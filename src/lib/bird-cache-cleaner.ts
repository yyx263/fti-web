import { readdir, lstat, unlink } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 1_000_000_000;
const TARGET_BYTES = 800_000_000;
const CHECK_INTERVAL = 60_000;
const RECENT_FILE_AGE = 60_000;
const TEMP_FILE_AGE = 24 * 60 * 60 * 1000;

// 只识别图片接口生成的缓存文件名。
const CACHE_NAME = /^[a-f0-9]{64}\.(webp|jpg)$/;
const TEMP_NAME = /^[a-f0-9]{64}-[a-f0-9-]{36}\.tmp$/;

type CacheFile = {
  filePath: string;
  size: number;
  modifiedAt: number;
  temporary: boolean;
};

type CleanerState = {
  timer?: ReturnType<typeof setInterval>;
  running: boolean;
};

// 开发环境可能重复加载模块，使用进程级状态避免重复启动。
const globalState = globalThis as typeof globalThis & {
  birdCacheCleaner?: CleanerState;
};

const state =
  globalState.birdCacheCleaner ??
  (globalState.birdCacheCleaner = { running: false });

function isMissing(error: unknown) {
  return (error as NodeJS.ErrnoException).code === "ENOENT";
}

/** 文件可能已被其他任务删除；其他错误必须保留日志。 */
async function removeCache(filePath: string): Promise<boolean> {
  try {
    await unlink(filePath);
    return true;
  } catch (error) {
    if (isMissing(error)) return true;

    console.error("[鸟类缓存] 删除失败：", filePath, error);
    return false;
  }
}

/** 只清理当前目录中的缓存文件，不递归进入子目录。 */
async function cleanCache() {
  if (state.running) return;
  state.running = true;

  try {
    const cacheRoot = path.resolve(
      process.env.BIRD_CACHE_ROOT ?? ".cache/birds"
    );

    const entries = await readdir(cacheRoot, {
      withFileTypes: true,
    });

    const files: CacheFile[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const temporary = TEMP_NAME.test(entry.name);
      if (!temporary && !CACHE_NAME.test(entry.name)) continue;

      const filePath = path.join(cacheRoot, entry.name);

      try {
        // 不跟随符号链接，避免清理到缓存目录之外。
        const info = await lstat(filePath);
        if (!info.isFile()) continue;

        files.push({
          filePath,
          size: info.size,
          modifiedAt: info.mtimeMs,
          temporary,
        });
      } catch (error) {
        if (!isMissing(error)) throw error;
      }
    }

    const now = Date.now();
    let total = files.reduce((sum, file) => sum + file.size, 0);
    let removed = 0;

    // 先处理上次异常退出遗留的临时文件。
    for (const file of files) {
      if (
        file.temporary &&
        now - file.modifiedAt >= TEMP_FILE_AGE &&
        await removeCache(file.filePath)
      ) {
        total -= file.size;
        removed += 1;
      }
    }

    if (total > MAX_BYTES) {
      const candidates = files
        .filter(
          (file) =>
            !file.temporary &&
            now - file.modifiedAt >= RECENT_FILE_AGE
        )
        .sort((a, b) => a.modifiedAt - b.modifiedAt);

      for (const file of candidates) {
        if (total <= TARGET_BYTES) break;

        if (await removeCache(file.filePath)) {
          total -= file.size;
          removed += 1;
        }
      }
    }

    if (removed > 0) {
      console.log(
        `[鸟类缓存] 清理 ${removed} 个文件，` +
        `本轮估算剩余 ${(total / 1_000_000).toFixed(1)} MB`
      );
    }

    if (total > MAX_BYTES) {
      console.warn(
        "[鸟类缓存] 仍超过 1 GB，可能存在近期文件、临时文件或删除失败。"
      );
    }
  } catch (error) {
    // 首次启动时缓存目录可能还没有创建。
    if (!isMissing(error)) {
      console.error("[鸟类缓存] 检查失败：", error);
    }
  } finally {
    state.running = false;
  }
}

/** 启动进程内定时任务；服务退出时任务随之结束。 */
export function startBirdCacheCleaner() {
  if (state.timer) return;

  state.timer = setInterval(() => {
    void cleanCache();
  }, CHECK_INTERVAL);

  // 定时器本身不阻止 Node.js 正常退出。
  state.timer.unref();

  console.log("[鸟类缓存] 自动清理已启动，每分钟检查，容量阈值 1 GB。");
  void cleanCache();
}
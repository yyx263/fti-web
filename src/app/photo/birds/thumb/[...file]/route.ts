import {
  mkdir,
  readFile,
  realpath,
  rename,
  stat,
  unlink,
} from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { runImageTask } from "@/lib/image-tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ThumbnailContext = {
  params: Promise<{ file: string[] }>;
};

/** 返回缩略图；暂不使用浏览器缓存，方便验证原图替换后的更新。 */
function imageResponse(image: Uint8Array, cacheHit: boolean) {
  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Thumbnail-Cache": cacheHit ? "HIT" : "MISS",
    },
  });
}

/** 仅从观鸟精选目录生成 JPG/JPEG 缩略图，不提供原图内容。 */
export async function GET(
  _request: Request,
  context: ThumbnailContext
) {
  const { file } = await context.params;

  // 拒绝隐藏项、系统目录和非法路径段。
  if (
    file.some(
      (part) =>
        part.startsWith(".") ||
        part.startsWith("@") ||
        part.includes("/") ||
        part.includes("\\") ||
        part.includes("\0")
    )
  ) {
    return new Response("Not found", { status: 404 });
  }

  const extension = path.extname(file.at(-1) ?? "").toLowerCase();

  if (extension !== ".jpg" && extension !== ".jpeg") {
    return new Response("Not found", { status: 404 });
  }

  const configuredRoot = process.env.BIRD_PHOTO_ROOT;

  if (!configuredRoot) {
    console.error("未配置 BIRD_PHOTO_ROOT");
    return new Response("Image service unavailable", { status: 500 });
  }

  try {
    const root = await realpath(configuredRoot);

    // 解析符号链接后的真实路径，确保目标仍位于精选目录内。
    let sourcePath: string;

    try {
      sourcePath = await realpath(path.join(root, ...file));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOENT" || code === "ENOTDIR") {
        return new Response("Not found", { status: 404 });
      }

      throw error;
    }

    const relativePath = path.relative(root, sourcePath);

    if (
      relativePath === ".." ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      return new Response("Not found", { status: 404 });
    }

    const sourceInfo = await stat(sourcePath);

    if (!sourceInfo.isFile()) {
      return new Response("Not found", { status: 404 });
    }

    const cacheRoot = path.resolve(
      process.env.BIRD_CACHE_ROOT ?? ".cache/birds"
    );

    // 原图修改后生成新缓存；调整缩略图参数时也应修改版本标记。
    const cacheKey = createHash("sha256")
      .update(
        JSON.stringify([
          sourcePath,
          sourceInfo.size,
          sourceInfo.mtimeMs,
          "thumb-v1-640-webp-80",
        ])
      )
      .digest("hex");

    const cachePath = path.join(cacheRoot, `${cacheKey}.webp`);

    try {
      const cachedImage = await readFile(cachePath);
      return imageResponse(cachedImage, true);
    } catch (error) {
      // 仅在缓存不存在时生成；权限等错误继续上抛。
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    const image = await runImageTask(cachePath, async () => {
      // 等待期间，其他请求可能已经写入缓存，因此开始处理前再次检查。
      try {
        return await readFile(cachePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          throw error;
        }
      }
    
      await mkdir(cacheRoot, { recursive: true });

      console.log("生成缩略图：", relativePath);
    
      const thumbnail = await sharp(sourcePath)
        .rotate()
        .resize({
          width: 640,
          height: 640,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();
    
      // 临时文件名独立，避免多个生成任务互相覆盖未完成的文件。
      const temporaryPath = path.join(
        cacheRoot,
        `${cacheKey}-${randomUUID()}.tmp`
      );
    
      try {
        await writeFile(temporaryPath, thumbnail);
        await rename(temporaryPath, cachePath);
      } finally {
        await unlink(temporaryPath).catch(
          (error: NodeJS.ErrnoException) => {
            if (error.code !== "ENOENT") {
              console.error("清理缩略图临时文件失败：", error);
            }
          }
        );
      }
    
      return thumbnail;
    });
    
    return imageResponse(image, false);
  } catch (error) {
    console.error("生成鸟类缩略图失败：", error);
    return new Response("Unable to create thumbnail", { status: 500 });
  }
}

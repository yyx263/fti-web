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
import exifr from "exifr";
import type { BirdPhotoInfo } from "@/types/bird-photo";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";

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

/** 仅接受有限正数，避免损坏的 EXIF 值进入页面。 */
function positiveNumber(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
    ? value
    : null;
}

function nonEmptyText(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

/** 仅从观鸟精选目录生成 JPG/JPEG 缩略图，不提供原图内容。 */
export async function GET(
  request: Request,
  context: ThumbnailContext
) {
  const { file } = await context.params;

  // 只允许固定的图片规格，不接收任意尺寸。
  const view = new URL(request.url).searchParams.get("view") ?? "thumb";

  if (!["thumb", "preview", "info", "original"].includes(view)) {
    return new Response("Invalid image view", { status: 400 });
  }

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

    // 原图经过同样的路径检查，使用流传输，不整体读入服务端内存。
    if (view === "original") {
      const stream = createReadStream(sourcePath);
      const body = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

      return new Response(body, {
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": String(sourceInfo.size),
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (view === "info") {
      const dimensions = await sharp(sourcePath).metadata();
    
      // 拍摄时间保留相机记录，不转换为 Date，避免时区偏移。
      const tags: Record<string, unknown> =
        (await exifr.parse(sourcePath, {
          pick: [
            "Model",
            "FocalLength",
            "ExposureTime",
            "FNumber",
            "ISO",
            "DateTimeOriginal",
          ],
          reviveValues: false,
        })) ?? {};
    
      // EXIF 方向为 5～8 时，正常显示后的宽高需要交换。
      const orientation = dimensions.orientation ?? 1;
      const swapDimensions = orientation >= 5 && orientation <= 8;
    
      const width = swapDimensions
        ? dimensions.height
        : dimensions.width;
    
      const height = swapDimensions
        ? dimensions.width
        : dimensions.height;
    
      if (!width || !height) {
        throw new Error("无法读取照片尺寸");
      }
    
      const capturedAt = nonEmptyText(tags.DateTimeOriginal);
    
      const info: BirdPhotoInfo = {
        width,
        height,
        camera: nonEmptyText(tags.Model),
        focalLength: positiveNumber(tags.FocalLength),
        exposureTime: positiveNumber(tags.ExposureTime),
        aperture: positiveNumber(tags.FNumber),
        iso: positiveNumber(tags.ISO),
        capturedAt:
          capturedAt?.replace(
            /^(\d{4}):(\d{2}):(\d{2})/,
            "$1-$2-$3"
          ) ?? null,
      };
    
      return Response.json(info, {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    
    const imageSize = view === "preview" ? 1920 : 640;
    const imageQuality = view === "preview" ? 85 : 80;

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
          `${view}-v1-${imageSize}-webp-${imageQuality}`,
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

      console.log("生成 ${view} 图片：", relativePath);
    
      const thumbnail = await sharp(sourcePath)
        .rotate()
        .resize({
          width: imageSize,
          height: imageSize,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: imageQuality })
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

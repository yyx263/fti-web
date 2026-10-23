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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ThumbnailContext = {
  params: Promise<{ file: string[] }>;
};

/** 原尺寸图片同样只返回去除私密元数据的网页副本。 */
function imageResponse(
  image: Uint8Array,
  cacheHit: boolean,
  originalFilename?: string,
  download = false
) {
  const headers: Record<string, string> = {
    "Content-Type": originalFilename ? "image/jpeg" : "image/webp",
    "Content-Length": String(image.byteLength),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Thumbnail-Cache": cacheHit ? "HIT" : "MISS",
  };
  if (originalFilename) {
    // ASCII 回退名称兼容旧客户端，filename* 保留中文鸟名。
    const filename = `${path.parse(originalFilename).name}.jpg`;
    const encoded = encodeURIComponent(filename).replace(
      /['()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    );
    headers["Content-Disposition"] =
      `${download ? "attachment" : "inline"}; filename="bird-photo.jpg"; filename*=UTF-8''${encoded}`;
  }
  return new Response(new Uint8Array(image), {
    headers,
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

/** 从精选目录生成缩略图、预览及去除位置元数据的全尺寸副本。 */
export async function GET(
  request: Request,
  context: ThumbnailContext
) {
  const { file } = await context.params;

  // 只允许固定的图片规格，不接收任意尺寸。
  const searchParams = new URL(request.url).searchParams;
  const view = searchParams.get("view") ?? "thumb";
  const download = searchParams.get("download") === "1";

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
    const originalFilename = view === "original" ? file.at(-1) : undefined;

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
          view === "original"
            ? "original-private-v1-jpeg-100-444"
            : `${view}-v1-${imageSize}-webp-${imageQuality}`,
        ])
      )
      .digest("hex");

    const cachePath = path.join(cacheRoot, `${cacheKey}.${originalFilename ? "jpg" : "webp"}`);

    try {
      const cachedImage = await readFile(cachePath);
      return imageResponse(cachedImage, true, originalFilename, download);
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

      console.log(`生成 ${view} 图片：`, relativePath);
    
      // 先应用 EXIF 方向，再移除元数据，避免竖拍照片方向出错。
      // 不调用 keepMetadata/keepExif，防止 EXIF、XMP 或 IPTC 中的位置泄露。
      const pipeline = sharp(sourcePath).rotate();
      const thumbnail = originalFilename
        ? await pipeline.keepIccProfile()
          .jpeg({ quality: 100, chromaSubsampling: "4:4:4" }).toBuffer()
        : await pipeline.resize({
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
    
    return imageResponse(image, false, originalFilename, download);
  } catch (error) {
    console.error("生成鸟类图片失败：", error);
    return new Response("Unable to create image", { status: 500 });
  }
}

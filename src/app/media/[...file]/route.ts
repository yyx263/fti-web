import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const imageTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

type MediaContext = {
  params: Promise<{ file: string[] }>;
};

export async function GET(
  _request: Request,
  context: MediaContext
) {
  const { file } = await context.params;

  if (
    file.some(
      (part) =>
        part.startsWith(".") ||
        part.includes("/") ||
        part.includes("\\") ||
        part.includes("\0")
    )
  ) {
    return new Response("Not found", { status: 404 });
  }

  const contentRoot =
    process.env.CONTENT_ROOT ?? path.join(process.cwd(), "content");

  try {
    const imageRoot = await realpath(path.join(contentRoot, "images"));
    const filePath = await realpath(path.join(imageRoot, ...file));

    const relativePath = path.relative(imageRoot, filePath);

    if (
      relativePath === ".." ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      return new Response("Not found", { status: 404 });
    }

    const contentType = imageTypes[path.extname(filePath).toLowerCase()];

    if (!contentType) {
      return new Response("Not found", { status: 404 });
    }

    const image = await readFile(filePath);

    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (
      code === "ENOENT" ||
      code === "ENOTDIR" ||
      code === "EISDIR"
    ) {
      return new Response("Not found", { status: 404 });
    }

    console.error("读取图片失败：", error);
    return new Response("Unable to read image", { status: 500 });
  }
}
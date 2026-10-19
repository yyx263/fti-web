import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 仅提供白名单中的图片格式，不暴露内容目录中的其他文件。
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

/** 从 CONTENT_ROOT/images 读取博客配图；非法路径和不存在的资源统一返回 404。 */
export async function GET(
  _request: Request,
  context: MediaContext
) {
  const { file } = await context.params;

  // 路由参数按路径段校验，拒绝隐藏项、分隔符和空字节。
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
    // 解析真实路径后再次检查边界，防止符号链接绕过目录限制。
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
        // 配图可能原地替换，当前不缓存响应，以便刷新后读取新内容。
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

    // 权限、存储等故障记录在服务端，不向访客返回内部路径。
    console.error("读取图片失败：", error);
    return new Response("Unable to read image", { status: 500 });
  }
}
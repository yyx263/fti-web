import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

/** 列表和卡片使用的文章元数据，不包含 Markdown 正文。 */
type PostSummary = {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  tags: string[];
};

/** 详情页使用的完整文章。 */
type Post = PostSummary & {
  content: string;
};

/** 优先使用 NAS 挂载目录，未配置时回退到项目内的 content。 */
function getPostsDirectory(): string {
  const contentRoot =
    process.env.CONTENT_ROOT ??
    path.join(process.cwd(), "content");

  return path.join(contentRoot, "posts");
}

/** 校验 front matter：草稿返回 null，必填字段或草稿标记格式错误时抛出异常。 */
function parsePostSummary(
  id: string,
  data: Record<string, unknown>
): PostSummary | null {
  if (
    data.draft !== undefined &&
    typeof data.draft !== "boolean"
  ) {
    throw new Error(`${id}.md 的 draft 必须是布尔值`);
  }

  if (data.draft === true) {
    return null;
  }

  if (
    typeof data.title !== "string" ||
    typeof data.date !== "string" ||
    typeof data.description !== "string"
  ) {
    throw new Error(`${id}.md 的标题、日期和摘要必须填写为字符串`);
  }

  // 可选字段提供默认值，以兼容未填写分类和标签的旧文章。
  const category =
    typeof data.category === "string" &&
    data.category.trim() !== ""
      ? data.category.trim()
      : "未分类";

  const tags: string[] = [];

  if (Array.isArray(data.tags)) {
    for (const tag of data.tags) {
      if (typeof tag === "string" && tag.trim() !== "") {
        tags.push(tag.trim());
      }
    }
  }

  return {
    id,
    title: data.title,
    date: data.date,
    description: data.description,
    category,
    tags,
  };
}

/** 扫描已发布文章并返回摘要；仍需读取完整文件，但返回值不包含正文。 */
export async function getPostSummaries(): Promise<PostSummary[]> {
  const directory = getPostsDirectory();
  const files = await readdir(directory);
  const posts: PostSummary[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) {
      continue;
    }

    try {
      const filePath = path.join(directory, file);
      const source = await readFile(filePath, "utf8");
      const { data } = matter(source);

      const summary = parsePostSummary(
        file.slice(0, -3),
        data
      );

      if (summary) {
        posts.push(summary);
      }
    } catch (error) {
      // 单篇读取或解析失败不影响其他文章；目录读取失败则交由上层处理。
      console.error(`读取文章 ${file} 失败：`, error);
    }
  }

  // 日期约定为补齐位数的 YYYY-MM-DD 字符串，按字典序即可倒序排列。
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

/** 按 ID 直接读取一篇文章；不存在、草稿或解析失败返回 null，其他读取错误继续抛出。 */
export async function getPostById(
  id: string
): Promise<Post | null> {
  // ID 同时用于文件名；限定字符集，禁止路径分隔符和目录跳转。
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return null;
  }

  const directory = getPostsDirectory();
  const filePath = path.join(directory, `${id}.md`);

  let source: string;

  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }

  try {
    const { data, content } = matter(source);
    const summary = parsePostSummary(id, data);

    if (!summary) {
      return null;
    }

    return {
      ...summary,
      content,
    };
  } catch (error) {
    console.error(`解析文章 ${id}.md 失败：`, error);
    return null;
  }
}

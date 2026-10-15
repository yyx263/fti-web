import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

// 文章摘要
type PostSummary = {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  tags: string[];
};

// 完整文章
type Post = PostSummary & {
  content: string;
};

// 获取文章目录
function getPostsDirectory(): string {
  const contentRoot =
    process.env.CONTENT_ROOT ??
    path.join(process.cwd(), "content");

  return path.join(contentRoot, "posts");
}

// 检查并整理文章信息
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

// 读取摘要列表
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
      console.error(`读取文章 ${file} 失败：`, error);
    }
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

// 读取单篇文章
export async function getPostById(
  id: string
): Promise<Post | null> {
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

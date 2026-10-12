import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

type Post = {
  id: string;
  title: string;
  date: string;
  description: string;
  content: string;
};

export async function getPosts(): Promise<Post[]> {
  const contentRoot = process.env.CONTENT_ROOT ?? path.join(process.cwd(), "content");
  const directory = path.join(contentRoot, "posts");
  const files = await readdir(directory); // 读取目录下所有markdown

  const posts: Post[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) {
      continue;
    }

    const filePath = path.join(directory, file);
    const source = await readFile(filePath, "utf8");
    const { data, content } = matter(source);

    if (
      typeof data.title !== "string" ||
      typeof data.date !== "string" ||
      typeof data.description !== "string"
    ) {
      throw new Error(`${file} 的标题、日期和摘要必须填写为字符串`);
    }

    posts.push({
      id: file.slice(0, -3), // 删去末尾的.md
      title: data.title,
      date: data.date,
      description: data.description,
      content,
    });
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}
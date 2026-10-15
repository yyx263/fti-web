// 博客列表页
import PostCard from "@/components/PostCard";
import { getPostSummaries } from "@/data/posts";
import Link from "next/link";

export const dynamic = "force-dynamic";

type BlogPageProps = {
  searchParams: Promise<{
    category?: string | string[];
  }>;
};

export default async function BlogPage(props: BlogPageProps) {
  const searchParams = await props.searchParams;
  const posts = await getPostSummaries();

  const selectedCategory =
    typeof searchParams.category === "string"
      ? searchParams.category
      : "";

  const categories = [
    ...new Set(posts.map((post) => post.category)),
  ].sort((a, b) => {
    if (a === b) return 0;
    if (a === "未分类") return 1;
    if (b === "未分类") return -1;
    return 0;
  });

  const filteredPosts = selectedCategory
    ? posts.filter((post) => post.category === selectedCategory)
    : posts;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-bold">
        博客
      </h1>

      <p className="mt-4 text-[#72766c]">
        制作笔记、学习记录与日常随笔。
      </p>

      <nav
        aria-label="博客分类"
        className="mt-8 flex flex-wrap gap-2"
      >
        <Link
          href="/blog"
          aria-current={selectedCategory === "" ? "page" : undefined}
          className={`rounded-full px-4 py-2 text-sm ${
            selectedCategory === ""
              ? "bg-[#272c29] text-[#f5f3ec]"
              : "bg-[#eae8df] text-[#72766c] hover:bg-[#dedcd2]"
          }`}
        >
          全部
        </Link>

        {categories.map((category) => (
          <Link
            key={category}
            href={{
              pathname: "/blog",
              query: { category },
            }}
            aria-current={
              selectedCategory === category ? "page" : undefined
            }
            className={`rounded-full px-4 py-2 text-sm ${
              selectedCategory === category
                ? "bg-[#272c29] text-[#f5f3ec]"
                : "bg-[#eae8df] text-[#72766c] hover:bg-[#dedcd2]"
            }`}
          >
            {category}
          </Link>
        ))}
      </nav>

      <section className="mt-8">
        <h2 className="text-xl leading-16 font-semibold border-b border-[#d8d8ce]">
          {selectedCategory || "全部文章"}
          <span className="ml-3 text-sm font-normal text-[#72766c]">
            {filteredPosts.length} 篇
          </span>
        </h2>

        {filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            title={post.title}
            date={post.date}
            description={post.description}
            category={post.category}
            tags={post.tags}
          />
        ))}

        {filteredPosts.length === 0 && (
          <p className="py-10 text-[#72766c]">
            暂时没有符合条件的文章。
          </p>
        )}
      </section>
    </main>
  );
}
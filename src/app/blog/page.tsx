// 博客列表页
import PostCard from "@/components/PostCard";
import { getPostSummaries } from "@/data/posts";
import Link from "next/link";

export const dynamic = "force-dynamic";

type BlogPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    tag?: string | string[];
    page?: string | string[];
  }>;
};

export default async function BlogPage(props: BlogPageProps) {
  const searchParams = await props.searchParams;
  const posts = await getPostSummaries();

  // 指定分类
  const selectedCategory =
    typeof searchParams.category === "string"
      ? searchParams.category
      : "";

  // 指定tag
  const selectedTag =
    typeof searchParams.tag === "string"
      ? searchParams.tag
      : "";

  const categories = [
    ...new Set(posts.map((post) => post.category)),
  ].sort((a, b) => {
    if (a === b) return 0;
    if (a === "未分类") return 1;
    if (b === "未分类") return -1;
    return 0;
  });

  // 先按分类和tag筛选
  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === "" ||
      post.category === selectedCategory;
  
    const matchesTag =
      selectedTag === "" ||
      post.tags.includes(selectedTag);
  
    return matchesCategory && matchesTag;
  });

  // 分页
  const pageSize = 10;

  const pageValue =
    typeof searchParams.page === "string"
      ? Number(searchParams.page)
      : 1;

  const requestedPage =
    Number.isSafeInteger(pageValue) && pageValue >= 1
      ? pageValue
      : 1;

  // 至少显示1页
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / pageSize)
  );

  // 最多不超过总页数
  const currentPage = Math.min(requestedPage, totalPages);

  const startIndex = (currentPage - 1) * pageSize;

  const paginatedPosts = filteredPosts.slice(
    startIndex,
    startIndex + pageSize
  );

  // 制作翻页链接
  function getPageHref(page: number) {
    const query: Record<string, string> = {};
  
    if (selectedCategory) {
      query.category = selectedCategory;
    }
  
    if (page > 1) {
      query.page = String(page);
    }

    if (selectedTag) {
      query.tag = selectedTag;
    }
  
    return {
      pathname: "/blog",
      query,
    };
  }

  // 制作切换分类链接
  function getCategoryHref(category: string) {
    const query: Record<string, string> = {};
  
    if (category) {
      query.category = category;
    }
  
    if (selectedTag) {
      query.tag = selectedTag;
    }
  
    return {
      pathname: "/blog",
      query,
    };
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <p className="text-sm tracking-widest text-[#72766c]">
        BLOG
      </p>

      <h1 className="mt-3 text-4xl font-bold">
        博客
      </h1>

      <p className="mt-4 text-[#72766c]">
        制作笔记、学习记录与日常随笔。
      </p>

      <nav
        aria-label="博客分类"
        className="mt-12 flex flex-wrap gap-2"
      >
        <Link
          href={getCategoryHref("")}
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
            href={getCategoryHref(category)}
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

      {selectedTag && (
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-[#72766c]">
            当前标签：
            <strong className="font-medium text-[#272c29]">
              #{selectedTag}
            </strong>
          </span>

          <Link
            href={{
              pathname: "/blog",
              query: selectedCategory
                ? { category: selectedCategory }
                : {},
            }}
            className="text-[#d75834] hover:underline"
          >
            清除标签
          </Link>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-xl leading-16 font-semibold border-b border-[#d8d8ce]">
          {selectedCategory || "全部文章"}
          <span className="ml-3 text-sm font-normal text-[#72766c]">
            {filteredPosts.length} 篇
          </span>
        </h2>

        {paginatedPosts.map((post) => (
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

        {totalPages > 1 && (
          <nav
            aria-label="博客分页"
            className="mt-10 flex items-center justify-between gap-4 text-sm"
          >
            {currentPage > 1 ? (
              <Link
                href={getPageHref(currentPage - 1)}
                className="rounded-md border border-[#d8d8ce] px-4 py-2 hover:bg-[#eae8df]"
              >
                ← 上一页
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="rounded-md border border-[#d8d8ce] px-4 py-2 text-[#72766c] opacity-40"
              >
                ← 上一页
              </span>
            )}

            <span className="text-[#72766c]">
              第 {currentPage} / {totalPages} 页
            </span>

            {currentPage < totalPages ? (
              <Link
                href={getPageHref(currentPage + 1)}
                className="rounded-md border border-[#d8d8ce] px-4 py-2 hover:bg-[#eae8df]"
              >
                下一页 →
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="rounded-md border border-[#d8d8ce] px-4 py-2 text-[#72766c] opacity-40"
              >
                下一页 →
              </span>
            )}
          </nav>
        )}
      </section>
    </main>
  );
}

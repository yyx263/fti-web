// 文章详情：按 ID 读取正文，并扩展 GFM 表格与站内黑幕标记。
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostById } from "@/data/posts";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 不预生成文章，允许 NAS 上的文章增删和草稿状态实时生效。
export const dynamic = "force-dynamic";

type PostPageProps = {
  params: Promise<{ id: string }>
};

export default async function PostPage(props:PostPageProps) {
  const params = await props.params;
  const post = await getPostById(params.id);

  // 读取层统一隐藏草稿及无效文章，页面只负责转入 404。
  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <Link
        href="/blog"
        className="text-sm text-[#72766c] hover:text-[#d75834]"  
      >
        ← 返回博客
      </Link>

      <article className="mt-10">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#72766c]">
          <time dateTime={post.date}>{post.date}</time>

          <span aria-hidden="true">·</span>
          
          <Link
            href={{
              pathname: "/blog",
              query: { category: post.category },
            }}
            className="hover:text-[#d75834]"
          >
            {post.category}
          </Link>
        </div>

        <h1 className="mt-4 text-4xl font-bold leading-relaxed">
          {post.title}
        </h1>

        <p className="mt-6 leading-8 text-[#72766c]">
          {post.description}
        </p>

        {post.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={{
                    pathname: "/blog",
                    query: { tag },
                  }}
                  className="block rounded-full bg-[#eae8df] px-3 py-1 text-xs text-[#72766c] hover:bg-[#dedcd2] hover:text-[#272c29]"
                >
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 markdown-body">
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              // 站内约定：[文字](#spoiler) 显示为黑幕；普通链接保持原语义。
              a: ({ href, children, title }) => {
                if (href === "#spoiler") {
                  return (
                    <span className="markdown-spoiler">
                      {children}
                    </span>
                  );
                }
            
                return (
                  <a href={href} title={title}>
                    {children}
                  </a>
                );
              },

              // 宽表格只在容器内滚动，避免撑宽整篇文章。
              table: ({ children }) => (
                <div
                  className="markdown-table-scroll"
                  role="region"
                  aria-label="文章表格"
                  tabIndex={0}
                >
                  <table>{children}</table>
                </div>
              ),
            }}
          >
            {post.content}
          </Markdown>
        </div>
      </article>
    </main>
  );
}



import Link from "next/link";
import PostCard from "@/components/PostCard";
import { getPostSummaries } from "@/data/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getPostSummaries();
  const recentPosts = posts.slice(0, 3);
  const titleName = "让想法有形，让日常留影。";
  const description = "这里记录我们的工作和日常，以及一些尚未被证伪的奇思妙想";

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      
      <p className="text-sm tracking-widest text-[#d75834]">
        FTI / FUTURE, THOUGHTS & IMAGINATIONS
      </p>

      <h1 className="mt-6 text-4xl font-bold">
        {titleName}
      </h1>
      
      <h2 className="mt-4 text-2xl leading-relaxed">
        过去在远离，未来是否意味着正在靠近。
      </h2>

      <p className="mt-6 max-w-xl text-base leading-8 text-[#72766c]">
        {description}
      </p>

      <section className="mt-16">
        <div className="flex items-center justify-between gap-4 border-b border-[#d8d8ce] pb-4">
          <h2 className="text-xl font-semibold">
            最近文章
          </h2>

          <Link
            href="/blog"
            className="shrink-0 text-sm text-[#72766c] hover:text-[#d75834]"
          >
            全部文章 →
          </Link>
        </div>

        {recentPosts.length > 0 ? (
          recentPosts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              date={post.date}
              description={post.description}
              category={post.category}
              tags={post.tags}
            />
          ))
        ) : (
          <p className="py-8 text-[#72766c]">
            第一篇记录正在酝酿中。
          </p>
        )}
      </section>

    </main>
  );
}

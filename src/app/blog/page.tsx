// 博客列表页
import PostCard from "@/components/PostCard";
import { getPosts } from "@/data/posts";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-bold">
        博客
      </h1>

      <p className="mt-4 text-[#72766c]">
        制作笔记、学习记录与日常随笔。
      </p>

      <section className="mt-8">
        <h2 className="text-xl leading-16 font-semibold border-b border-[#d8d8ce]">
          最近文章
        </h2>

        {posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            title={post.title}
            date={post.date}
            description={post.description}
          />
        ))}
      </section>
    </main>
  );
}
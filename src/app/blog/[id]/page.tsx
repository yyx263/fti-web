// 文章详情页
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "@/data/posts";
import Markdown from "react-markdown";

export const dynamic = "force-dynamic";

type PostPageProps = {
  params: Promise<{ id: string }>
};

export default async function PostPage(props:PostPageProps) {
  const params = await props.params;
  const posts = await getPosts();

  const post = posts.find((item) => item.id === params.id);

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
        <p className="text-sm text-[#72766c]">
          {post.date}
        </p>

        <h1 className="mt-4 text-4xl font-bold leading-relaxed">
          {post.title}
        </h1>

        <p className="mt-6 leading-8 text-[#72766c]">
          {post.description}
        </p>

        <div className="mt-10 markdown-body">
          <Markdown>{post.content}</Markdown>
        </div>
      </article>
    </main>
  );
}



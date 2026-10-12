import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <p className="text-sm text-[#d75834]">
        404 / SIGNAL LOST
      </p>

      <h1 className="mt-6 text-4xl font-bold">
        这条信号暂时失联。
      </h1>

      <p className="mt-4 text-[#72766c]">
        页面不存在，或者文章尚未发布。
      </p>

      <Link
        href="/blog"
        className="mt-8 inline-block text-[#d75834]"
      >
        返回博客 →
      </Link>
    </main>
  );
}
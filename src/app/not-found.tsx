import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center px-6 py-16">
      <div className="grid w-full items-center gap-10 md:grid-cols-[320px_1fr] md:gap-16">
        <Image
          src="/illustrations/404-box.png"
          alt="头顶写着404的纸箱，一脸困惑的角色"
          width={1254}
          height={1254}
          loading="eager"
          sizes="(min-width: 768px) 320px, 260px"
          className="mx-auto h-auto w-65 md:w-[320px]"
        />

        <div className="text-center md:text-left">
          <p className="text-xs font-medium tracking-[0.25em] text-[#d75834]">
            404 / SIGNAL LOST
          </p>

          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
            纸箱里没有找到你要的页面
          </h1>

          <p className="mt-5 leading-8 text-[#72766c]">
            <br />
            地址可能有误，或者这篇文章已经搬走了。
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
            <Link
              href="/"
              className="rounded-full bg-[#272c29] px-6 py-3 text-sm font-medium text-[#f5f3ec] transition-colors hover:bg-[#d75834]"
            >
              返回首页
            </Link>

            <Link
              href="/blog"
              className="rounded-full border border-[#d8d8ce] px-6 py-3 text-sm font-medium transition-colors hover:border-[#d75834] hover:text-[#d75834]"
            >
              去博客看看 →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
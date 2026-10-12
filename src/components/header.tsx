import Link from "next/link";

// 导航组件
export default function Header() {
  return (
    <header className="border-b border-[#d8d9ce]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-3xl font-bold">
          FTI<span className="text-[#d75834]">.</span>
        </Link>

        <nav className="flex gap-6 text-sm" aria-label="主导航">
          <Link href="/" className="hover:text-[#d75834]">
            首页
          </Link>

          <Link href="/blog" className="hover:text-[#d75834]">
            博客
          </Link>
        </nav>
      </div>
    </header>
  )
}

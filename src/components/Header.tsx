// 全站导航；数组顺序即显示顺序，LOGO 提供返回首页入口。

import Link from "next/link";

const navigation = [
  { href: "/blog", label: "博客" },
  { href: "/albums", label: "影集" },
  { href: "/artworks", label: "画集" },
  { href: "/projects", label: "资料" },
];

export default function Header() {
  return (
    <header className="border-b border-[#d8d9ce]">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <Link
          href="/"
          aria-label="FTI 首页"
          className="text-3xl font-bold"
        >
          FTI<span className="text-[#d75834]">.</span>
        </Link>

        <nav
          className="flex flex-wrap gap-x-5 gap-y-2 text-sm"
          aria-label="主导航"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-[#d75834]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

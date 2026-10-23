// 全站导航；数组顺序即显示顺序，LOGO 提供返回首页入口。

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/blog", label: "博客" },
  { href: "/albums", label: "影集" },
  { href: "/artworks", label: "画集" },
  { href: "/projects", label: "资料" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-[#d8d9ce] bg-background">
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
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  pathname === item.href
                    ? "page"
                    : isActive
                      ? "location"
                      : undefined
                }
                className={`transition-colors hover:text-[#d75834] ${
                  isActive ? "text-[#d75834]" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

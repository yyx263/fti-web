import Link from "next/link";

// 影集栏目入口；具体内容及布局由各子路由独立维护。
const collections = [
  {
    href: "/albums/birds",
    title: "观鸟精选",
    description:
      "记录野外拍摄的鸟类照片，拒绝诱拍。",
    label: "鸟类摄影",
  },
  {
    href: "/albums/astro",
    title: "星空",
    description:
      "从银河到遥远星系，记录镜头下的夜空。",
    label: "天文摄影",
  },
];

export default function AlbumsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <p className="text-sm tracking-widest text-[#72766c]">
        PHOTOGRAPHY
      </p>

      <h1 className="mt-3 text-4xl font-bold">
        影集
      </h1>

      <p className="mt-5 max-w-2xl leading-8 text-[#72766c]">
        按主题整理的摄影作品。
      </p>

      <section
        aria-label="摄影栏目"
        className="mt-12 grid gap-6 md:grid-cols-2"
      >
        {collections.map((collection) => (
          <Link
            key={collection.href}
            href={collection.href}
            className="group rounded-xl border border-[#d8d8ce] p-8 transition-colors hover:border-[#d75834] hover:bg-[#eeece4]"
          >
            <p className="text-sm text-[#72766c]">
              {collection.label}
            </p>

            <h2 className="mt-4 text-2xl font-semibold group-hover:text-[#d75834]">
              {collection.title}
            </h2>

            <p className="mt-4 leading-8 text-[#72766c]">
              {collection.description}
            </p>

            <span className="mt-8 inline-block text-sm text-[#d75834]">
              进入栏目 →
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
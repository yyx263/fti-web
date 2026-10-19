import Link from "next/link";

type PostCardProps = {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  tags: string[];
}

// 显示摘要卡片
export default function PostCard(props: PostCardProps) {
  return (
    <article className="mt-6 border-b border-[#d8d8ce] pb-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-[#72766c]">
        <time dateTime={props.date}>{props.date}</time>

        <span aria-hidden="true">·</span>

        <Link
        href={{
          pathname: "/blog",
          query: { category: props.category },
        }}
        className="hover:text-[#d75834]"
        >
        {props.category}
        </Link>
      </div>

      <h3 className="mt-2 text-2xl font-semibold">
        <Link
          href={"/blog/" + props.id}
          className="hover:text-[#d75834]"
        >
          {props.title}
        </Link>
      </h3>

      <p className="mt-3 leading-8 text-[#72766c]">
        {props.description}
      </p>

      {props.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {props.tags.map((tag) => (
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
    </article>
  );
}


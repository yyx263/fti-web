import Link from "next/link";

type PostCardProps = {
  id: string;
  title: string;
  date: string;
  description: string;
}

export default function PostCard(props: PostCardProps) {
  return (
    <article className="mt-6 border-b border-[#d8d8ce] pb-6">
      <p className="text-sm text-[#72766c]">
        {props.date}
      </p>

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
    </article>
  );
}


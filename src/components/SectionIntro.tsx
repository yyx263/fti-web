import Link from "next/link";

type SectionIntroProps = {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
};

export default function SectionIntro(props: SectionIntroProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      <Link
        href={props.backHref}
        className="text-sm text-[#72766c] hover:text-[#d75834]"
      >
        ← {props.backLabel}
      </Link>

      <h1 className="mt-10 text-4xl font-bold">
        {props.title}
      </h1>

      <p className="mt-6 max-w-2xl leading-8 text-[#72766c]">
        {props.description}
      </p>

      <p className="mt-10 border-t border-[#d8d8ce] pt-6 text-sm text-[#72766c]">
        内容正在整理中。
      </p>
    </main>
  );
}
import SectionIntro from "@/components/SectionIntro";

export default function BirdsPage() {
  return (
    <SectionIntro
      title="观鸟精选"
      description="记录野外拍摄的鸟类照片，拒绝塘拍诱拍"
      backHref="/albums"
      backLabel="返回影集"
    />
  );
}
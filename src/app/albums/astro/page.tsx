import SectionIntro from "@/components/SectionIntro";

/** 星空栏目介绍页，待接入摄影作品。 */
export default function AstroPage() {
  return (
    <SectionIntro
      title="星空"
      description="收藏银河、星野与深空摄影作品，记录每一次仰望夜空的收获。"
      backHref="/albums"
      backLabel="返回影集"
    />
  );
}
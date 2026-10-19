import SectionIntro from "@/components/SectionIntro";

/** 画集入口，当前使用共用介绍布局。 */
export default function ArtworksPage() {
  return (
    <SectionIntro
      title="画集"
      description="收藏原创插画、角色创作与绘画练习，记录从草稿到完成的过程。"
      backHref="/"
      backLabel="返回首页"
    />
  );
}
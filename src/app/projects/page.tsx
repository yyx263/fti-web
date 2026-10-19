import SectionIntro from "@/components/SectionIntro";

/** 资料入口，后续承载项目目录与 README 展示。 */
export default function ProjectsPage() {
  return (
    <SectionIntro
      title="资料"
      description="整理 DIY 与软件项目的说明、制作资料和开源文件，方便查阅与复现。"
      backHref="/"
      backLabel="返回首页"
    />
  );
}
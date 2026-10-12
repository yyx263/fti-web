

export default function Home() {
  const instituteName = "未来科技研究所";
  const description = "这里记录我们的工作和日常，以及一些尚未被证伪的奇思妙想";

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20">
      
      <p className="text-sm tracking-widest text-[#d75834]">
        FTI / FUTURE TECHNOLOGY INSTITUTE
      </p>

      <h1 className="mt-6 text-4xl font-bold">
        {instituteName}
      </h1>
      
      <h2 className="mt-4 text-2xl leading-relaxed">
        过去在远离，未来是否意味着正在靠近。
      </h2>

      <p className="mt-6 max-w-xl text-base leading-8 text-[#72766c]">
        {description}
      </p>

    </main>
  );
}

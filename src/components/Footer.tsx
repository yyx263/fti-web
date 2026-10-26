export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#d8d8ce]">
      <div className="mx-auto max-w-5xl px-6 py-6 text-center text-xs leading-6 text-[#72766c]">
        <p>El Psy Congroo. © 2026 FTI</p>

        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#d75834]"
        >
          浙ICP备2026088339号-1
        </a>
      </div>
    </footer>
  );
}
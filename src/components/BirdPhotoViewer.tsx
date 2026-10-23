"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { BirdPhoto } from "@/data/birds";
import BirdPhotoDetails from "@/components/BirdPhotoDetails";
import BirdZoomImage from "@/components/BirdZoomImage";

type BirdPhotoViewerProps = {
  photos: BirdPhoto[];
  speciesName: string;
  initialIndex: number;
  onClose: () => void;
};

/** 编码各级目录，避免中文、空格等字符影响图片地址。 */
function getThumbnailUrl(photo: BirdPhoto) {
  const encodedPath = photo.relativePath
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `/photo/birds/thumb/${encodedPath}`;
}

/** 同鸟种照片查看器：大图区加载预览图，导航使用缩略图。 */
export default function BirdPhotoViewer({
  photos,
  speciesName,
  initialIndex,
  onClose,
}: BirdPhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const currentPhoto = photos[currentIndex];

  // 打开模态窗口，并在关闭后恢复页面原有的滚动设置和焦点。
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;

      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      ) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  // 只移动底部缩略图栏，不滚动背景页面。
  useEffect(() => {
    const button = activeThumbnailRef.current;
    const container = button?.parentElement;

    if (!button || !container) return;

    const buttonRect = button.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    if (
      buttonRect.left < containerRect.left ||
      buttonRect.right > containerRect.right
    ) {
      container.scrollBy({
        left:
          buttonRect.left -
          containerRect.left -
          (container.clientWidth - buttonRect.width) / 2,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  function showPrevious() {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  function showNext() {
    setCurrentIndex((index) =>
      Math.min(photos.length - 1, index + 1)
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="bird-viewer"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          showPrevious();
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          showNext();
        }
      }}
    >
      <div className="bird-viewer-layout">
        <header className="flex items-center justify-between gap-4 border-b border-white/15 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-lg font-semibold">
              {speciesName}
            </h2>

            <p
              className="mt-1 text-sm text-white/65"
              aria-live="polite"
            >
              {currentIndex + 1} / {photos.length}
              {currentPhoto.note && ` · ${currentPhoto.note}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="shrink-0 rounded-md px-3 py-2 hover:bg-white/15"
            aria-label="关闭照片查看器"
          >
            关闭 ×
          </button>
        </header>

        <div className="bird-viewer-content">
          <div className="relative min-h-0">
            <BirdZoomImage
              key={currentPhoto.relativePath}
              imageUrl={getThumbnailUrl(currentPhoto)}
              alt={
                currentPhoto.note
                  ? `${speciesName}，${currentPhoto.note}`
                  : speciesName
              }
            />

            <button
              type="button"
              onClick={showPrevious}
              disabled={currentIndex === 0}
              aria-label="上一张照片"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 px-4 py-3 text-xl hover:bg-black/70 disabled:cursor-default disabled:opacity-25"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={showNext}
              disabled={currentIndex === photos.length - 1}
              aria-label="下一张照片"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 px-4 py-3 text-xl hover:bg-black/70 disabled:cursor-default disabled:opacity-25"
            >
              ›
            </button>
          </div>

          <aside
            aria-label="照片拍摄参数"
            className="overflow-y-auto border-t border-white/15 p-5 lg:border-l lg:border-t-0"
          >
            <h3 className="mb-5 text-sm font-medium">
              拍摄信息
            </h3>

            <BirdPhotoDetails
              key={currentPhoto.relativePath}
              infoUrl={`${getThumbnailUrl(currentPhoto)}?view=info`}
            />
          </aside>
        </div>

        <nav
          aria-label="同鸟种照片"
          className="flex gap-3 overflow-x-auto border-t border-white/15 p-4"
        >
          {photos.map((photo, index) => {
            const active = index === currentIndex;

            return (
              <button
                key={photo.relativePath}
                ref={active ? activeThumbnailRef : undefined}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`查看第 ${index + 1} 张${speciesName}照片`}
                aria-current={active ? "true" : undefined}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded border-2 ${
                  active
                    ? "border-[#d75834]"
                    : "border-transparent opacity-65 hover:opacity-100"
                }`}
              >
                <Image
                  src={getThumbnailUrl(photo)}
                  alt=""
                  fill
                  unoptimized
                  loading="lazy"
                  className="object-contain"
                />
              </button>
            );
          })}
        </nav>
      </div>
    </dialog>
  );
}
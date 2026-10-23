"use client";

import Image from "next/image";
import type { BirdPhoto } from "@/data/birds";
import { useState } from "react";
import BirdPhotoViewer from "@/components/BirdPhotoViewer";

type BirdPhotoGridProps = {
  photos: BirdPhoto[];
  allPhotos: BirdPhoto[];
  speciesName: string;
  compact?: boolean;
  eagerCount?: number;
};

/** 仅请求缩略图；原图和大图查看器后续单独接入。 */
export default function BirdPhotoGrid({
  photos,
  allPhotos,
  speciesName,
  compact = false,
  eagerCount = 0,
}: BirdPhotoGridProps) {
  // null 表示关闭；数字表示打开时选中的照片下标。
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  return (
    <>
      <div
        className={
          compact
            ? "flex gap-3 overflow-x-auto pb-2"
            : "grid grid-cols-1 gap-5 sm:grid-cols-2"
        }
      >
        {photos.map((photo, photoIndex) => {
          // 每个路径段单独编码，保留目录间的斜杠。
          const imagePath = photo.relativePath
            .split("/")
            .map(encodeURIComponent)
            .join("/");

          return (
            <figure
              key={photo.relativePath}
              className={compact ? "w-44 shrink-0" : "min-w-0"}
            >
              <button
                type="button"
                aria-label={`放大查看${speciesName}：${photo.fileName}`}
                className="relative block aspect-4/3 w-full cursor-zoom-in overflow-hidden rounded-lg bg-[#eeece4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d75834]"
                onClick={() => {
                  const index = allPhotos.findIndex(
                    (item) => item.relativePath === photo.relativePath
                  );

                  if (index >= 0) {
                    setViewerIndex(index);
                  }
                }}
              >
                <Image
                  src={`/photo/birds/thumb/${imagePath}`}
                  alt={
                    photo.note
                      ? `${speciesName}，${photo.note}`
                      : speciesName
                  }
                  fill
                  unoptimized
                  loading={photoIndex < eagerCount ? "eager" : "lazy"}
                  className="object-contain"
                />
              </button>

              {photo.note && (
                <figcaption className="mt-2 text-xs text-[#72766c]">
                  {photo.note}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>

      {viewerIndex !== null && (
        <BirdPhotoViewer
          photos={allPhotos}
          speciesName={speciesName}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
import Image from "next/image";
import type { BirdPhoto } from "@/data/birds";

type BirdPhotoGridProps = {
  photos: BirdPhoto[];
  speciesName: string;
  compact?: boolean;
};

/** 仅请求缩略图；原图和大图查看器后续单独接入。 */
export default function BirdPhotoGrid({
  photos,
  speciesName,
  compact = false,
}: BirdPhotoGridProps) {
  return (
    <div
      className={
        compact
          ? "flex gap-3 overflow-x-auto pb-2"
          : "grid grid-cols-1 gap-5 sm:grid-cols-2"
      }
    >
      {photos.map((photo) => {
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
            <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-[#eeece4]">
              <Image
                src={`/photo/birds/thumb/${imagePath}`}
                alt={
                  photo.note
                    ? `${speciesName}，${photo.note}`
                    : speciesName
                }
                fill
                unoptimized
                loading="lazy"
                className="object-contain"
              />
            </div>

            {photo.note && (
              <figcaption className="mt-2 text-xs text-[#72766c]">
                {photo.note}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}
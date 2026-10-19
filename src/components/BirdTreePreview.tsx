import Link from "next/link";
import type { BirdDirectory } from "@/data/birds";

type BirdTreePreviewProps = {
  directory: BirdDirectory;
  selectedDirectoryId: string;
  selectedSpeciesName: string;
};

/** 目录树导航；目录负责展开，链接负责切换右侧内容。 */
export default function BirdTreePreview({
  directory,
  selectedDirectoryId,
  selectedSpeciesName,
}: BirdTreePreviewProps) {
  const isSelected = directory.id === selectedDirectoryId;

  const isAncestor =
    directory.id === "" ||
    isSelected ||
    selectedDirectoryId.startsWith(`${directory.id}/`);

  const directoryHref = {
    pathname: "/albums/birds",
    query: directory.id ? { dir: directory.id } : {},
  };

  return (
    <details open={isAncestor}>
      <summary
        className={`bird-directory-row ${
          isSelected && !selectedSpeciesName
            ? "bg-[#eae8df] text-[#d75834]"
            : ""
        }`}
      >
        <span className="bird-directory-arrow" aria-hidden="true">
          ▸
        </span>

        <span className="min-w-0 flex-1 wrap-break-word">
          {directory.name}
        </span>

        <Link
          href={directoryHref}
          prefetch={false}
          aria-label={`查看${directory.name}目录`}
          aria-current={
            isSelected && !selectedSpeciesName ? "page" : undefined
          }
          className="bird-directory-view"
        >
          查看
        </Link>
      </summary>

      <div className="ml-2 border-l border-[#d8d8ce] pl-3">
        {directory.directories.map((child) => (
          <BirdTreePreview
            key={child.id}
            directory={child}
            selectedDirectoryId={selectedDirectoryId}
            selectedSpeciesName={selectedSpeciesName}
          />
        ))}

        {directory.species.map((species) => {
          const active =
            isSelected && selectedSpeciesName === species.name;

          return (
            <Link
              key={species.id}
              href={{
                pathname: "/albums/birds",
                query: {
                  dir: directory.id,
                  species: species.name,
                },
              }}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={`block rounded px-2 py-2 text-sm ${
                active
                  ? "bg-[#eae8df] text-[#d75834]"
                  : "hover:text-[#d75834]"
              }`}
            >
              {species.name}
              <span className="ml-2 text-xs text-[#72766c]">
                {species.photos.length}
              </span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}
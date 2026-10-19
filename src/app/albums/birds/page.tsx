import Link from "next/link";
import { notFound } from "next/navigation";
import BirdTreePreview from "@/components/BirdTreePreview";
import BirdPhotoGrid from "@/components/BirdPhotoGrid";
import {
  getBirdTree,
  flattenBirdDirectories,
} from "@/data/birds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BirdsPageProps = {
  searchParams: Promise<{
    dir?: string | string[];
    species?: string | string[];
    page?: string | string[];
  }>;
};

export default async function BirdsPage(props: BirdsPageProps) {
  const params = await props.searchParams;
  const tree = await getBirdTree();
  const directories = flattenBirdDirectories(tree);

  const directoryId =
    typeof params.dir === "string" ? params.dir : "";

  const speciesName =
    typeof params.species === "string" ? params.species : "";

  // 仅查找扫描到的目录，不直接将查询参数传给文件系统。
  const selectedDirectory = directories.find(
    (directory) => directory.id === directoryId
  );

  if (!selectedDirectory) {
    notFound();
  }

  const selectedSpecies = selectedDirectory.species.find(
    (species) => species.name === speciesName
  );

  if (speciesName && !selectedSpecies) {
    notFound();
  }

  // 目录视图包含当前目录和全部后代目录中的鸟种。
  const speciesRows = flattenBirdDirectories(selectedDirectory)
    .flatMap((directory) =>
      directory.species.map((species) => ({
        directoryId: directory.id,
        species,
      }))
    );

  const pageSize = selectedSpecies ? 12 : 6;
  const itemCount = selectedSpecies
    ? selectedSpecies.photos.length
    : speciesRows.length;

  const pageValue =
    typeof params.page === "string" ? Number(params.page) : 1;

  const requestedPage =
    Number.isSafeInteger(pageValue) && pageValue >= 1
      ? pageValue
      : 1;

  const totalPages = Math.max(1, Math.ceil(itemCount / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  /** 翻页保留目录与鸟种，第一页省略页码。 */
  function getPageHref(page: number) {
    const query: Record<string, string> = {};

    if (directoryId) query.dir = directoryId;
    if (speciesName) query.species = speciesName;
    if (page > 1) query.page = String(page);

    return {
      pathname: "/albums/birds",
      query,
    };
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12">
      <Link
        href="/albums"
        className="text-sm text-[#72766c] hover:text-[#d75834]"
      >
        ← 返回影集
      </Link>

      <h1 className="mt-8 text-4xl font-bold">观鸟精选</h1>

      <p className="mt-5 leading-8 text-[#72766c]">
        记录野外拍摄的鸟类照片。
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="min-w-0 self-start rounded-xl border border-[#d8d8ce] p-4 lg:sticky lg:top-6 lg:max-h-[85vh] lg:overflow-y-auto">
          <nav aria-label="鸟类分类">
            <BirdTreePreview
              directory={tree}
              selectedDirectoryId={directoryId}
              selectedSpeciesName={speciesName}
            />
          </nav>
        </aside>

        <section className="min-w-0" aria-label="鸟类照片">
          <p className="wrap-break-words text-sm text-[#72766c]">
            {directoryId
              ? `观鸟精选 / ${directoryId.split("/").join(" / ")}`
              : "观鸟精选"}
          </p>

          <div className="mt-3 flex flex-wrap items-baseline gap-3 border-b border-[#d8d8ce] pb-5">
            <h2 className="text-2xl font-semibold">
              {selectedSpecies?.name ?? selectedDirectory.name}
            </h2>

            <span className="text-sm text-[#72766c]">
              {itemCount} {selectedSpecies ? "张照片" : "个鸟种"}
            </span>
          </div>

          {selectedSpecies ? (
            <div className="mt-6">
              <BirdPhotoGrid
                speciesName={selectedSpecies.name}
                photos={selectedSpecies.photos.slice(
                  startIndex,
                  startIndex + pageSize
                )}
              />
            </div>
          ) : (
            <div className="space-y-8 pt-6">
              {speciesRows
                .slice(startIndex, startIndex + pageSize)
                .map(({ directoryId: rowDirectoryId, species }) => (
                  <article key={species.id}>
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-lg font-semibold">
                        {species.name}
                        <span className="ml-3 text-sm font-normal text-[#72766c]">
                          {species.photos.length} 张
                        </span>
                      </h3>

                      <Link
                        href={{
                          pathname: "/albums/birds",
                          query: {
                            dir: rowDirectoryId,
                            species: species.name,
                          },
                        }}
                        prefetch={false}
                        className="text-sm text-[#d75834] hover:underline"
                      >
                        查看全部 →
                      </Link>
                    </div>

                    <BirdPhotoGrid
                      compact
                      speciesName={species.name}
                      photos={species.photos.slice(0, 4)}
                    />
                  </article>
                ))}

              {itemCount === 0 && (
                <p className="py-8 text-[#72766c]">
                  此目录暂时没有 JPG 照片。
                </p>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <nav
              aria-label="照片分页"
              className="mt-10 flex items-center justify-between gap-4 text-sm"
            >
              {currentPage > 1 ? (
                <Link
                  href={getPageHref(currentPage - 1)}
                  prefetch={false}
                  className="text-[#d75834] hover:underline"
                >
                  ← 上一页
                </Link>
              ) : (
                <span className="text-[#72766c] opacity-40">
                  ← 上一页
                </span>
              )}

              <span className="text-[#72766c]">
                第 {currentPage} / {totalPages} 页
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={getPageHref(currentPage + 1)}
                  prefetch={false}
                  className="text-[#d75834] hover:underline"
                >
                  下一页 →
                </Link>
              ) : (
                <span className="text-[#72766c] opacity-40">
                  下一页 →
                </span>
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
import { readdir } from "node:fs/promises";
import path from "node:path";

/** 照片索引；仅保存路径和文件名信息，不加载图片内容。 */
export type BirdPhoto = {
  /** 相对 BIRD_PHOTO_ROOT 的路径，统一使用正斜杠。 */
  relativePath: string;
  fileName: string;
  /** 文件名中的排序序号；未填写时为 null。 */
  sequence: number | null;
  note: string;
};

/** 同一目录内按鸟种名归组的照片集合。 */
export type BirdSpecies = {
  /** 目录层级与鸟种名序列化后的标识；移动目录会改变标识。 */
  id: string;
  name: string;
  photos: BirdPhoto[];
};

/** 真实目录节点；species 只包含直属鸟种，不包含子目录内的鸟种。 */
export type BirdDirectory = {
  /** 相对目录路径；根目录使用空字符串。 */
  id: string;
  name: string;
  directories: BirdDirectory[];
  species: BirdSpecies[];
};

/** 解析“鸟种 序号备注”；无序号时按首个空白拆分，鸟种名内不应含空格。 */
function parseBirdFileName(fileName: string) {
  const baseName = path
    .basename(fileName, path.extname(fileName))
    .trim();

  const match = baseName.match(
    /^(.+?)\s+(\d+)(.*)$/
  );

  if (match) {
    return {
      name: match[1].trim(),
      sequence: Number(match[2]),
      note: match[3].trim(),
    };
  }

  // 兼容“白斑尾柳莺 存疑”等无序号文件，保留识别备注。
  const [name, ...notes] = baseName.split(/\s+/);

  return {
    name,
    sequence: null,
    note: notes.join(" "),
  };
}

/**
 * 每次调用重新扫描 JPG/JPEG 目录信息，当前不缓存、不读取原图内容。
 * 根目录未配置或目录无法读取时抛出错误，避免将挂载故障当成空相册。
 */
export async function getBirdTree(): Promise<BirdDirectory> {
  const root = process.env.BIRD_PHOTO_ROOT;

  if (!root) {
    throw new Error("请在 .env.local 中设置 BIRD_PHOTO_ROOT");
  }

  // segments 来自实际目录项；递归兼容不固定的目、科、属层级。
  async function scanDirectory(
    segments: string[]
  ): Promise<BirdDirectory> {
    const absolutePath = path.join(root!, ...segments);

    const entries = await readdir(absolutePath, {
      withFileTypes: true,
    });

    entries.sort((a, b) =>
      a.name.localeCompare(b.name, "zh-CN", {
        numeric: true,
      })
    );

    const directory: BirdDirectory = {
      id: segments.join("/"),
      name: segments.at(-1) ?? "观鸟精选",
      directories: [],
      species: [],
    };

    // 分组限定在当前目录，避免跨目录合并同名鸟种。
    const speciesMap = new Map<string, BirdSpecies>();

    for (const entry of entries) {
      // 排除隐藏项和 NAS 系统目录。
      if (
        entry.name.startsWith(".") ||
        entry.name.startsWith("@")
      ) {
        continue;
      }

      // 不跟随符号链接，避免扫描到目录树之外或形成循环。
      if (entry.isSymbolicLink()) {
        continue;
      }

      if (entry.isDirectory()) {
        const child = await scanDirectory([
          ...segments,
          entry.name,
        ]);

        directory.directories.push(child);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();

      if (extension !== ".jpg" && extension !== ".jpeg") {
        continue;
      }

      const parsed = parseBirdFileName(entry.name);

      let species = speciesMap.get(parsed.name);

      if (!species) {
        species = {
          id: JSON.stringify([...segments, parsed.name]),
          name: parsed.name,
          photos: [],
        };

        speciesMap.set(parsed.name, species);
      }

      species.photos.push({
        relativePath: [...segments, entry.name].join("/"),
        fileName: entry.name,
        sequence: parsed.sequence,
        note: parsed.note,
      });
    }

    directory.species = [...speciesMap.values()];

    directory.species.sort((a, b) =>
      a.name.localeCompare(b.name, "zh-CN")
    );

    // 有序号的照片优先；序号相同或缺失时按文件名自然排序。
    for (const species of directory.species) {
      species.photos.sort((a, b) => {
        const sequenceDifference =
          (a.sequence ?? Number.MAX_SAFE_INTEGER) -
          (b.sequence ?? Number.MAX_SAFE_INTEGER);

        return (
          sequenceDifference ||
          a.fileName.localeCompare(b.fileName, "zh-CN", {
            numeric: true,
          })
        );
      });
    }

    return directory;
  }

  return scanDirectory([]);
}

/** 将目录树展开成数组，方便按目录 ID 查找节点。 */
export function flattenBirdDirectories(
  directory: BirdDirectory
): BirdDirectory[] {
  return [
    directory,
    ...directory.directories.flatMap(flattenBirdDirectories),
  ];
}

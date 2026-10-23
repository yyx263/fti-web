"use client";

import { useEffect, useState } from "react";
import type { BirdPhotoInfo } from "@/types/bird-photo";

type BirdPhotoDetailsProps = {
  infoUrl: string;
};

function formatShutter(seconds: number | null): string {
  if (seconds === null) return "未记录";

  if (seconds >= 0.5) {
    return `${Number(seconds.toFixed(3))} s`;
  }

  return `1/${Number((1 / seconds).toFixed(1))} s`;
}

/** 按当前照片读取拍摄参数，切换或关闭时取消未完成请求。 */
export default function BirdPhotoDetails({
  infoUrl,
}: BirdPhotoDetailsProps) {
  const [info, setInfo] = useState<BirdPhotoInfo | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInfo() {
      try {
        const response = await fetch(infoUrl, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`照片信息请求失败：${response.status}`);
        }

        const data: BirdPhotoInfo = await response.json();

        if (!controller.signal.aborted) {
          setInfo(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setFailed(true);
        }
      }
    }

    void loadInfo();

    return () => controller.abort();
  }, [infoUrl]);

  if (failed) {
    return (
      <p className="text-sm text-white/65">
        拍摄参数暂时读取失败，仍可浏览照片。
      </p>
    );
  }

  if (!info) {
    return (
      <p className="text-sm text-white/65" role="status">
        正在读取拍摄参数……
      </p>
    );
  }

  const items = [
    ["相机", info.camera ?? "未记录"],
    [
      "焦距",
      info.focalLength === null ? "未记录" : `${info.focalLength} mm`,
    ],
    ["快门", formatShutter(info.exposureTime)],
    ["光圈", info.aperture === null ? "未记录" : `f/${info.aperture}`],
    ["ISO", info.iso === null ? "未记录" : String(info.iso)],
    ["拍摄时间", info.capturedAt ?? "未记录"],
    ["原图尺寸", `${info.width} × ${info.height}`],
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm lg:grid-cols-1">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-white/50">
            {label}
          </dt>
          <dd className="mt-1 wrap-break-words text-white/90">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
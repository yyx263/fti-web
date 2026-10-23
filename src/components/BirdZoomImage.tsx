"use client";

import Image from "next/image";
import { flushSync } from "react-dom";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";

type Point = { x: number; y: number };

type BirdZoomImageProps = {
  imageUrl: string;
  alt: string;
};

type LoadedImage = {
  url: string;
  width: number;
  height: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

/** 原图按需加载；缩放以图片原始尺寸为基准，最高 200%。 */
export default function BirdZoomImage({
  imageUrl,
  alt,
}: BirdZoomImageProps) {
  const [original, setOriginal] = useState(false);
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [failed, setFailed] = useState(false);

  // null 表示跟随窗口自动适应，数字表示用户选择的缩放比例。
  const [requestedScale, setRequestedScale] = useState<number | null>(null);

  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
  });

  const viewportRef = useRef<HTMLDivElement>(null);

  const pointersRef = useRef(new Map<number, Point>());

  const src = `${imageUrl}?view=${original ? "original" : "preview"}`;
  const loaded = loadedImage?.url === src;
  const canZoom = original && loaded && !failed;

  const naturalWidth = loaded ? loadedImage.width : 1920;
  const naturalHeight = loaded ? loadedImage.height : 1280;

  // 适应窗口时保留少量边距；小图片默认不放大。
  const fitScale = Math.min(
    1,
    Math.max(1, viewport.width - 24) / naturalWidth,
    Math.max(1, viewport.height - 24) / naturalHeight
  );

  const scale = canZoom
    ? clamp(requestedScale ?? fitScale, fitScale, 2)
    : fitScale;

  const imageWidth = naturalWidth * scale;
  const imageHeight = naturalHeight * scale;

  // 观察照片显示区域，而不是整个浏览器窗口。
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setViewport({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // 切换图片模式或调整窗口时重新居中；普通缩放由手势锚点定位。
  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    element.scrollLeft =
      (element.scrollWidth - element.clientWidth) / 2;

    element.scrollTop =
      (element.scrollHeight - element.clientHeight) / 2;
    pointersRef.current.clear();
  }, [src, loaded, viewport.width, viewport.height]);

  const zoomAt = useCallback((factor: number, from: Point, to = from) => {
    const element = viewportRef.current;
    if (!element || !canZoom) return;

    const nextScale = clamp(scale * factor, fitScale, 2);
    // 图片小于视口时有居中留白，换算原图坐标时需要扣除。
    const imageX = (element.scrollLeft + from.x -
      Math.max(0, (element.clientWidth - imageWidth) / 2)) / scale;
    const imageY = (element.scrollTop + from.y -
      Math.max(0, (element.clientHeight - imageHeight) / 2)) / scale;

    // 先更新画布尺寸，再写滚动位置，避免旧尺寸把滚动范围截断。
    flushSync(() => setRequestedScale(nextScale));
    element.scrollLeft = imageX * nextScale +
      Math.max(0, (element.clientWidth - naturalWidth * nextScale) / 2) - to.x;
    element.scrollTop = imageY * nextScale +
      Math.max(0, (element.clientHeight - naturalHeight * nextScale) / 2) - to.y;
  }, [canZoom, scale, fitScale, imageWidth, imageHeight, naturalWidth, naturalHeight]);

  // 原生非被动监听允许阻止默认滚动，避免滚轮带动背景页面。
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    function handleWheel(event: WheelEvent) {
      // 保留浏览器自身的 Ctrl/Command + 滚轮缩放行为。
      if (!canZoom || event.ctrlKey || event.metaKey) return;

      event.preventDefault();

      const delta =
        event.deltaMode === 1
          ? event.deltaY * 16
          : event.deltaMode === 2
            ? event.deltaY * viewport.height
            : event.deltaY;

      const factor = Math.exp(-clamp(delta, -100, 100) * 0.002);

      const rect = element!.getBoundingClientRect();
      zoomAt(factor, { x: event.clientX - rect.left, y: event.clientY - rect.top });
    }

    element.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => element.removeEventListener("wheel", handleWheel);
  }, [canZoom, zoomAt, viewport.height]);

  function changeScale(factor: number) {
    const element = viewportRef.current;
    if (element) zoomAt(factor, { x: element.clientWidth / 2, y: element.clientHeight / 2 });
  }

  function toggleOriginal() {
    pointersRef.current.clear();
    setOriginal((value) => !value);
    setRequestedScale(null);
    setFailed(false);
  }

  const buttonClass =
    "rounded px-3 py-1.5 hover:bg-white/15 disabled:opacity-35";

  return (
    <div className="bird-zoom-layout">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2 text-sm">
        <button
          type="button"
          onClick={toggleOriginal}
          className={buttonClass}
        >
          {original ? "返回预览" : "查看原图"}
        </button>

        <button
          type="button"
          disabled={!canZoom || scale <= fitScale}
          onClick={() => changeScale(1 / 1.2)}
          aria-label="缩小照片"
          className={buttonClass}
        >
          −
        </button>

        <span className="min-w-14 text-center text-white/70">
          {canZoom ? `${Math.round(scale * 100)}%` : "适应"}
        </span>

        <button
          type="button"
          disabled={!canZoom || scale >= 2}
          onClick={() => changeScale(1.2)}
          aria-label="放大照片"
          className={buttonClass}
        >
          +
        </button>

        <button
          type="button"
          disabled={!canZoom}
          onClick={() => setRequestedScale(null)}
          className={buttonClass}
        >
          适应窗口
        </button>

        <span className="text-xs text-white/50" role="status">
          {failed
            ? "图片加载失败，请切换模式重试"
            : !loaded
              ? original
                ? "正在加载原图……"
                : "正在加载预览……"
              : canZoom
                ? "滚轮 / 双指缩放 · 按住拖动"
                : "预览图"}
        </span>
      </div>

      <div
        ref={viewportRef}
        className={`bird-zoom-viewport ${
          canZoom && scale > fitScale ? "cursor-grab" : ""
        }`}
        onPointerDown={(event) => {
          if (!canZoom || event.button !== 0) {
            return;
          }

          const element = event.currentTarget;

          event.preventDefault();
          const rect = element.getBoundingClientRect();
          pointersRef.current.set(event.pointerId, {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
          element.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const pointers = pointersRef.current;
          if (!pointers.has(event.pointerId)) return;
          const before = [...pointers.values()];
          const rect = event.currentTarget.getBoundingClientRect();
          pointers.set(event.pointerId, {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
          const after = [...pointers.values()];
          if (before.length === 1) {
            event.currentTarget.scrollLeft -= after[0].x - before[0].x;
            event.currentTarget.scrollTop -= after[0].y - before[0].y;
          } else {
            // 使用前两指的中点和距离；增减手指后从当前坐标继续，不跳回旧位置。
            const midpoint = (points: Point[]) => ({
              x: (points[0].x + points[1].x) / 2,
              y: (points[0].y + points[1].y) / 2,
            });
            const distance = (points: Point[]) =>
              Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
            const oldDistance = distance(before);
            if (oldDistance > 0) {
              zoomAt(distance(after) / oldDistance, midpoint(before), midpoint(after));
            }
          }
        }}
        onPointerUp={(event) => {
          pointersRef.current.delete(event.pointerId);

          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={(event) => {
          pointersRef.current.delete(event.pointerId);
        }}
        onLostPointerCapture={(event) => {
          pointersRef.current.delete(event.pointerId);
        }}
      >
        <div
          className="grid place-items-center"
          style={{
            width: Math.max(viewport.width, imageWidth),
            height: Math.max(viewport.height, imageHeight),
          }}
        >
          <Image
            key={src}
            src={src}
            alt={alt}
            width={naturalWidth}
            height={naturalHeight}
            unoptimized
            loading="eager"
            draggable={false}
            className="select-none"
            style={{
              width: imageWidth,
              height: imageHeight,
              maxWidth: "none",
              objectFit: "contain",
              visibility: loaded && !failed ? "visible" : "hidden",
            }}
            onLoad={(event) => {
              const image = event.currentTarget;

              setLoadedImage({
                url: src,
                width: image.naturalWidth,
                height: image.naturalHeight,
              });

              setFailed(false);
            }}
            onError={() => setFailed(true)}
          />
        </div>
      </div>
    </div>
  );
}

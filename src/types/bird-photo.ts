/** 浏览器需要的照片信息；不包含服务器路径或完整 EXIF。 */
export type BirdPhotoInfo = {
  width: number;
  height: number;
  camera: string | null;
  focalLength: number | null;
  exposureTime: number | null;
  aperture: number | null;
  iso: number | null;
  capturedAt: string | null;
};
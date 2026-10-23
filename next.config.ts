import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 仅允许指定局域网来源访问开发资源，不是生产环境的 CORS 配置。
  allowedDevOrigins: ["10.33.7.109"],

  // 由 Node.js 原生加载，避免打包影响 exifr 的 fs、zlib 加载。
  serverExternalPackages: ["exifr"],
};

export default nextConfig;

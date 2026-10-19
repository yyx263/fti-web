import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 仅允许指定局域网来源访问开发资源，不是生产环境的 CORS 配置。
  allowedDevOrigins: ["10.33.7.109"],
};

export default nextConfig;

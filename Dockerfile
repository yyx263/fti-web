# 构建阶段：安装锁定的依赖并生成 Next.js 生产产物。
FROM node:24-bookworm-slim AS build

WORKDIR /app

# 依赖清单独立复制，使仅修改源码时可复用安装层。
COPY package.json package-lock.json ./
RUN npm ci --registry=https://registry.npmmirror.com

COPY . .
RUN npm run build

# 运行阶段：沿用构建目录；NAS 内容由部署配置在运行时挂载。
FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build --chown=node:node /app ./

# 使用非 root 用户运行，挂载目录需要向该用户提供读取权限。
USER node

EXPOSE 3000

# 监听全部容器网卡，通过宿主机端口映射对外提供服务。
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]

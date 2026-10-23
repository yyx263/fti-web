/** 在 Node.js 服务启动时注册后台缓存维护任务。 */
export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  const { startBirdCacheCleaner } = await import(
    "./lib/bird-cache-cleaner"
  );

  startBirdCacheCleaner();
}
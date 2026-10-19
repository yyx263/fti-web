const MAX_CONCURRENT = 2;

let activeCount = 0;

const waitingTasks: Array<() => void> = [];

const pendingTasks = new Map<
  string,
  Promise<Uint8Array>
>();

/** 启动等待中的任务，最多同时执行指定数量。 */
function startWaitingTasks() {
  while (
    activeCount < MAX_CONCURRENT &&
    waitingTasks.length > 0
  ) {
    const start = waitingTasks.shift();

    if (start) {
      start();
    }
  }
}

/**
 * 同一进程内按 key 合并图片任务，并限制生成并发。
 * 无论成功或失败，结束后都会释放名额，允许后续请求重试。
 */
export function runImageTask(
  key: string,
  task: () => Promise<Uint8Array>
): Promise<Uint8Array> {
  const existingTask = pendingTasks.get(key);

  if (existingTask) {
    return existingTask;
  }

  const promise = new Promise<Uint8Array>((resolve, reject) => {
    waitingTasks.push(() => {
      activeCount += 1;

      Promise.resolve()
        .then(task)
        .then(resolve, reject)
        .finally(() => {
          activeCount -= 1;
          pendingTasks.delete(key);
          startWaitingTasks();
        });
    });
  });

  pendingTasks.set(key, promise);
  startWaitingTasks();

  return promise;
}
import { useEffect } from 'react';

/** 开发环境 StrictMode 会重复执行 effect；cleanup 里 abort 可取消第一次请求 */
export function useAbortableEffect(
  effect: (signal: AbortSignal) => void | Promise<void>,
  deps: React.DependencyList,
) {
  useEffect(() => {
    const ctrl = new AbortController();
    void effect(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps 由调用方传入
  }, deps);
}

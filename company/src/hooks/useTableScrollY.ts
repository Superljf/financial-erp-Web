import { useLayoutEffect, useRef, useState } from 'react';

/** 按容器剩余高度计算 Ant Design Table 的 scroll.y，使表体出现内部滚动条 */
export function useTableScrollY(resetKey?: unknown) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(320);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const measure = () => {
      const header =
        wrap.querySelector<HTMLElement>('.ant-table-header') ||
        wrap.querySelector<HTMLElement>('.ant-table-thead');
      const pagination = wrap.querySelector<HTMLElement>('.ant-table-pagination');
      const tableWrap = wrap.querySelector<HTMLElement>('.ant-table-wrapper');
      const headerH = header?.getBoundingClientRect().height ?? 55;
      let pageH = 64;
      if (pagination) {
        const style = getComputedStyle(pagination);
        pageH =
          pagination.getBoundingClientRect().height +
          parseFloat(style.marginTop || '0') +
          parseFloat(style.marginBottom || '0');
      }
      const padBottom = tableWrap ? parseFloat(getComputedStyle(tableWrap).paddingBottom || '0') : 8;
      setScrollY(Math.max(160, Math.floor(wrap.clientHeight - headerH - pageH - padBottom)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    window.addEventListener('resize', measure);
    const timer = window.setTimeout(measure, 0);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.clearTimeout(timer);
    };
  }, [resetKey]);

  return { wrapRef, scrollY };
}

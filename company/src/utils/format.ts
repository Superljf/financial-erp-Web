import dayjs from 'dayjs';

export function todayISO(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function monthFirstLast(d = dayjs()) {
  return {
    start: d.startOf('month').format('YYYY-MM-DD'),
    end: d.endOf('month').format('YYYY-MM-DD'),
  };
}

/** 含当天的 91 天：今天往前 90 天 ~ 今天 */
export function default91Range(d = dayjs()) {
  return {
    start: d.subtract(90, 'day').format('YYYY-MM-DD'),
    end: d.format('YYYY-MM-DD'),
  };
}

export function ymOf(date: string): string {
  return date.slice(0, 7);
}

export function spanDays(start: string, end: string): number {
  return dayjs(end).diff(dayjs(start), 'day') + 1;
}

export function formatMoney(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 展示层脱敏：第 5–9 位变为 * */
export function maskCode(code: string): string {
  if (!code || code.length < 9) return code;
  return `${code.slice(0, 4)}*****${code.slice(9)}`;
}

export const CHINESE_NAME_RE = /^[\u4e00-\u9fff]+$/;

export function isChineseName(name: string, min = 2, max = 20): boolean {
  return CHINESE_NAME_RE.test(name) && name.length >= min && name.length <= max;
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

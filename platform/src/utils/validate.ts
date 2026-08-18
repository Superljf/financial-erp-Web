import type { Company } from '../types';

/** 公司名称仅允许中文（不含字母、数字、符号、空格） */
export const CHINESE_NAME_RE = /^[\u4e00-\u9fff]+$/;

export function isChineseCompanyName(name: string): boolean {
  return CHINESE_NAME_RE.test(name);
}

export function deriveStatus(company: Pick<Company, 'cancel'>): '存续' | '已注销' {
  return company.cancel ? '已注销' : '存续';
}

export function isCompanyActiveInMonth(company: Company, year: number, month: number): boolean {
  const ym = `${year}-${String(month).padStart(2, '0')}`;
  const foundYm = company.found ? company.found.slice(0, 7) : '';
  const cancelYm = company.cancel ? company.cancel.slice(0, 7) : '';
  const registered = Boolean(foundYm && foundYm <= ym);
  const notCanceled = !cancelYm || cancelYm >= ym;
  return registered && notCanceled;
}

export function ymKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function companyMonthKey(companyId: number, year: number, month: number): string {
  return `${companyId}-${year}-${month}`;
}

export function formatNow(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function formatStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

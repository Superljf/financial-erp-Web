import { delay, store } from '../mock/store';
import type { Company } from '../types';

export interface LoginPayload {
  company: string;
  account: string;
  password: string;
}

export type LoginResult =
  | { ok: true; company: Company }
  | { ok: false; field?: 'company' | 'account' | 'password'; message: string };

export async function loginCompany(payload: LoginPayload): Promise<LoginResult> {
  await delay();
  if (!payload.company) return { ok: false, field: 'company', message: '请输入公司名称' };
  if (!payload.account) return { ok: false, field: 'account', message: '请输入账号' };
  if (!payload.password) return { ok: false, field: 'password', message: '请输入密码' };

  const hit = store.companies.find((c) => c.name === payload.company);
  if (!hit) return { ok: false, message: '公司不存在' };
  if (hit.cancel) return { ok: false, message: '该公司已注销，无法登录' };
  if (payload.account !== hit.account) return { ok: false, message: '账号错误' };
  if (payload.password !== hit.pwd) return { ok: false, message: '密码错误' };
  return { ok: true, company: hit };
}

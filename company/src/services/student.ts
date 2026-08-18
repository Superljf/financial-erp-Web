import { delay, nextEnrollCode, store } from '../mock/store';
import type { AccountRow, CashRow, Company, ConsumeRow, StudentBrief } from '../types';
import { uid, ymOf } from '../utils/format';

function sameCompany(row: { 公司名称: string; 纳税人识别号: string }, company: Company) {
  return row.公司名称 === company.name || row.纳税人识别号 === company.tax;
}

export function accountRemain(code: string, company: Company): number {
  const rows = store.accountData.filter((r) => r.学员编号 === code && sameCompany(r, company));
  if (!rows.length) return 0;
  rows.sort((a, b) => a.年月.localeCompare(b.年月));
  return Math.round((rows[rows.length - 1].本月剩余 || 0) * 100) / 100;
}

function latestAccount(code: string, company: Company): AccountRow | undefined {
  const rows = store.accountData.filter((r) => r.学员编号 === code && sameCompany(r, company));
  if (!rows.length) return undefined;
  rows.sort((a, b) => a.年月.localeCompare(b.年月));
  return rows[rows.length - 1];
}

export async function searchStudents(company: Company, keyword: string): Promise<StudentBrief[]> {
  await delay();
  const q = keyword.toLowerCase();
  const map = new Map<string, StudentBrief>();
  store.accountData
    .filter((r) => sameCompany(r, company))
    .forEach((r) => {
      if (!map.has(r.学员编号)) map.set(r.学员编号, { code: r.学员编号, name: r.学生姓名 });
    });
  return [...map.values()]
    .filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export async function getStudent(company: Company, code: string): Promise<StudentBrief | null> {
  await delay();
  const row = store.accountData.find((r) => r.学员编号 === code && sameCompany(r, company));
  if (!row) return null;
  return { code: row.学员编号, name: row.学生姓名 };
}

export async function listEnroll(company: Company, code: string): Promise<CashRow[]> {
  await delay();
  return store.cashData
    .filter((r) => r.学员编号 === code && sameCompany(r, company) && r.类型 === '预收学费')
    .slice()
    .sort((a, b) => b.交易日期.localeCompare(a.交易日期));
}

export async function listRefund(company: Company, code: string): Promise<CashRow[]> {
  await delay();
  return store.cashData
    .filter((r) => r.学员编号 === code && sameCompany(r, company) && r.类型 === '预收退款')
    .slice()
    .sort((a, b) => b.交易日期.localeCompare(a.交易日期));
}

export async function listConsume(company: Company, code: string): Promise<ConsumeRow[]> {
  await delay();
  return store.consumeData
    .filter((r) => r.学员编号 === code && sameCompany(r, company))
    .slice()
    .sort((a, b) => b.考勤日期.localeCompare(a.考勤日期));
}

export function peekEnrollCode(): string {
  return nextEnrollCode();
}

export async function enrollNew(
  company: Company,
  payload: { code: string; name: string; amount: number; date: string },
): Promise<StudentBrief> {
  await delay();
  const ym = ymOf(payload.date);
  store.cashData.push({
    id: uid('cash'),
    年月: ym,
    公司名称: company.name,
    纳税人识别号: company.tax,
    交易日期: payload.date,
    交易渠道: '',
    交易金额: payload.amount,
    清算金额: payload.amount,
    手续费: 0,
    团队: '',
    业务校区: '',
    学生姓名: payload.name,
    学员编号: payload.code,
    现金: '',
    转账: '',
    刷卡: '',
    在线支付: payload.amount,
    单据编号: '',
    客户账号: '',
    类型: '预收学费',
  });
  store.accountData.push({
    年月: ym,
    公司名称: company.name,
    纳税人识别号: company.tax,
    类型: '预收学费',
    学员编号: payload.code,
    学生姓名: payload.name,
    上月剩余: 0,
    应付: 0,
    转出: 0,
    预收: payload.amount,
    退款: 0,
    理赔: 0,
    课耗: 0,
    本月剩余: payload.amount,
  });
  return { code: payload.code, name: payload.name };
}

export async function enrollExist(
  company: Company,
  payload: { code: string; name: string; amount: number; date: string },
): Promise<void> {
  await delay();
  const ym = ymOf(payload.date);
  store.cashData.push({
    id: uid('cash'),
    年月: ym,
    公司名称: company.name,
    纳税人识别号: company.tax,
    交易日期: payload.date,
    交易渠道: '',
    交易金额: payload.amount,
    清算金额: payload.amount,
    手续费: 0,
    团队: '',
    业务校区: '',
    学生姓名: payload.name,
    学员编号: payload.code,
    现金: '',
    转账: '',
    刷卡: '',
    在线支付: payload.amount,
    单据编号: '',
    客户账号: '',
    类型: '预收学费',
  });
  const latest = latestAccount(payload.code, company);
  if (latest) {
    latest.预收 = Math.round((latest.预收 + payload.amount) * 100) / 100;
    latest.本月剩余 = Math.round((latest.本月剩余 + payload.amount) * 100) / 100;
  } else {
    store.accountData.push({
      年月: ym,
      公司名称: company.name,
      纳税人识别号: company.tax,
      类型: '预收学费',
      学员编号: payload.code,
      学生姓名: payload.name,
      上月剩余: 0,
      应付: 0,
      转出: 0,
      预收: payload.amount,
      退款: 0,
      理赔: 0,
      课耗: 0,
      本月剩余: payload.amount,
    });
  }
}

export async function attend(
  company: Company,
  payload: {
    code: string;
    name: string;
    classDate: string;
    grade: string;
    subject: string;
    attendDate: string;
    amount: number;
  },
): Promise<void> {
  await delay();
  const remain = accountRemain(payload.code, company);
  if (payload.amount > remain) {
    throw new Error('剩余金额不足，无法考勤！');
  }
  const ym = ymOf(payload.attendDate);
  store.consumeData.push({
    id: uid('cons'),
    年月: ym,
    公司名称: company.name,
    纳税人识别号: company.tax,
    考勤日期: payload.attendDate,
    学生姓名: payload.name,
    学员编号: payload.code,
    课耗金额: payload.amount,
    消耗课时: '',
    课时长度: '',
    课程名称: '',
    课程类型: '',
    课程子类型: '',
    课程年级: payload.grade,
    科目: payload.subject,
    课程季: '',
    上课日期: payload.classDate,
    上课时间: '',
    教师: '',
    教师编码: '',
  });
  const monthRow = store.accountData.find(
    (r) => r.学员编号 === payload.code && sameCompany(r, company) && r.年月 === ym,
  );
  if (monthRow) {
    monthRow.课耗 = Math.round((monthRow.课耗 + payload.amount) * 100) / 100;
    monthRow.本月剩余 = Math.round((monthRow.本月剩余 - payload.amount) * 100) / 100;
  } else {
    const latest = latestAccount(payload.code, company);
    const lastRemain = latest ? latest.本月剩余 : 0;
    const lastEnroll = latest ? latest.预收 : 0;
    store.accountData.push({
      年月: ym,
      公司名称: company.name,
      纳税人识别号: company.tax,
      类型: '预收学费',
      学员编号: payload.code,
      学生姓名: payload.name,
      上月剩余: lastRemain,
      应付: 0,
      转出: 0,
      预收: lastEnroll,
      退款: 0,
      理赔: 0,
      课耗: payload.amount,
      本月剩余: Math.round((lastRemain - payload.amount) * 100) / 100,
    });
  }
}

export async function voidEnroll(company: Company, id: string, code: string): Promise<void> {
  await delay();
  const idx = store.cashData.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const rec = store.cashData[idx];
  store.cashData.splice(idx, 1);
  const latest = latestAccount(code, company);
  if (latest) {
    latest.预收 = Math.round((latest.预收 - rec.交易金额) * 100) / 100;
    latest.本月剩余 = Math.round((latest.本月剩余 - rec.交易金额) * 100) / 100;
  }
}

export async function voidConsume(company: Company, id: string, code: string): Promise<void> {
  await delay();
  const idx = store.consumeData.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const rec = store.consumeData[idx];
  store.consumeData.splice(idx, 1);
  const monthRow = store.accountData.find(
    (r) => r.学员编号 === code && sameCompany(r, company) && r.年月 === rec.年月,
  );
  if (monthRow) {
    monthRow.课耗 = Math.round((monthRow.课耗 - rec.课耗金额) * 100) / 100;
    monthRow.本月剩余 = Math.round((monthRow.本月剩余 + rec.课耗金额) * 100) / 100;
  }
}

export async function listPerf(company: Company): Promise<CashRow[]> {
  await delay();
  return store.cashData.filter((r) => sameCompany(r, company) && r.类型 === '预收学费');
}

export async function listConsReport(company: Company): Promise<ConsumeRow[]> {
  await delay();
  return store.consumeData.filter((r) => sameCompany(r, company));
}

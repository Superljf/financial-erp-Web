import type { AccountRow, CashRow, Company, ConsumeRow } from '../types';
import { uid } from '../utils/format';

const seedStudents = [
  { code: 'XYBH_20230929000011', name: '李宜栩' },
  { code: 'XYBH_20230929000012', name: '李宜萱' },
  { code: 'XYBH_20230929000013', name: '王梓涵' },
  { code: 'XYBH_20230929000014', name: '陈思源' },
  { code: 'XYBH_20230929000015', name: '林小满' },
  { code: 'XYBH_20230929000016', name: '赵子轩' },
  { code: 'XYBH_20230929000017', name: '李宜辰' },
];

export const companies: Company[] = [
  { id: 1, tax: '91350200MA8R1A1B2C', name: '快乐智豪厦门文化有限公司', account: 'ZH01', pwd: '625777', found: '2020-03-15', cancel: '' },
  { id: 2, tax: '91350200MA8R2A2B3C', name: '厦门智学教育咨询有限公司', account: 'ZX01', pwd: '123456', found: '2019-07-01', cancel: '' },
  { id: 3, tax: '91350200MA8R3A3B4C', name: '福州优教文化有限公司', account: 'YJ01', pwd: 'abc123', found: '2021-01-10', cancel: '2024-12-31' },
  { id: 4, tax: '91350200MA8R4A4B5C', name: '泉州博文培训学校', account: 'BW01', pwd: 'qztc88', found: '2018-05-20', cancel: '' },
  { id: 5, tax: '91350200MA8R5A5B6C', name: '漳州启航教育科技有限公司', account: 'QH01', pwd: 'zhqz66', found: '2022-09-01', cancel: '' },
  { id: 6, tax: '91350200MA8R6A6B7C', name: '宁德思齐教育咨询有限公司', account: 'SQ01', pwd: 'ndsq99', found: '2020-11-11', cancel: '' },
  { id: 7, tax: '91350200MA8R7A7B8C', name: '莆田明德文化有限公司', account: 'MD01', pwd: 'ptmd55', found: '2023-02-28', cancel: '' },
  { id: 8, tax: '91350200MA8R8A8B9C', name: '龙岩育才教育服务中心', account: 'YC01', pwd: 'lyyc33', found: '2017-08-08', cancel: '' },
  { id: 9, tax: '91350200MA8R9A9B0C', name: '三明启智教育咨询有限公司', account: 'QZ01', pwd: 'smqz77', found: '2021-06-18', cancel: '' },
  { id: 10, tax: '91350200MA8R0A0B1C', name: '南平博雅文化有限公司', account: 'BY01', pwd: 'npby44', found: '2019-12-03', cancel: '' },
  { id: 11, tax: '91350200MA8R1B1C2D', name: '厦门卓越素质培训学校', account: 'ZY01', pwd: 'zysz88', found: '2022-04-25', cancel: '2025-06-30' },
  { id: 12, tax: '91350200MA8R2B2C3D', name: '福州翰林教育科技有限公司', account: 'HL01', pwd: 'fhhl66', found: '2020-09-09', cancel: '' },
];

const COMP = companies[0];
const amts = [4284, 6800, 3200, 1500, 980, 2600, 5000];
const subs = ['物理', '地理', '数学', '英语', '化学', '语文'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const cashData: CashRow[] = [];
[6, 7, 8].forEach((month) => {
  const ym = `2026-${pad(month)}`;
  for (let i = 0; i < 30; i += 1) {
    const st = seedStudents[i % seedStudents.length];
    const amt = amts[i % amts.length];
    const fee = Math.round(amt * 0.0025 * 100) / 100;
    cashData.push({
      id: uid('cash'),
      年月: ym,
      公司名称: COMP.name,
      纳税人识别号: COMP.tax,
      交易日期: `2026-${pad(month)}-${pad(1 + (i * 3) % 27)}`,
      交易渠道: 'C扫B',
      交易金额: amt,
      清算金额: amt - fee,
      手续费: fee,
      团队: '',
      业务校区: '',
      学生姓名: st.name,
      学员编号: st.code,
      现金: '',
      转账: '',
      刷卡: '',
      在线支付: amt,
      单据编号: '',
      客户账号: '',
      类型: '预收学费',
    });
  }
});

const refundAmts = [180, 220, 260, 270];
for (let i = 0; i < 77; i += 1) {
  const st = seedStudents[i % seedStudents.length];
  const amt = refundAmts[i % refundAmts.length];
  cashData.push({
    id: uid('refund'),
    年月: '2026-07',
    公司名称: COMP.name,
    纳税人识别号: COMP.tax,
    交易日期: `2026-07-${pad(2 + (i * 4) % 26)}`,
    交易渠道: '转账',
    交易金额: amt,
    清算金额: amt,
    手续费: 0,
    团队: '',
    业务校区: '',
    学生姓名: st.name,
    学员编号: st.code,
    现金: '',
    转账: amt,
    刷卡: '',
    在线支付: '',
    单据编号: '',
    客户账号: '',
    类型: '预收退款',
  });
}

cashData.push({
  id: 'cash_demo_today',
  年月: todayISO().slice(0, 7),
  公司名称: COMP.name,
  纳税人识别号: COMP.tax,
  交易日期: todayISO(),
  交易渠道: '在线支付',
  交易金额: 1000,
  清算金额: 1000,
  手续费: 0,
  团队: '',
  业务校区: '',
  学生姓名: seedStudents[0].name,
  学员编号: seedStudents[0].code,
  现金: '',
  转账: '',
  刷卡: '',
  在线支付: 1000,
  单据编号: '',
  客户账号: '',
  类型: '预收学费',
});

const consumeData: ConsumeRow[] = [];
for (let i = 0; i < 84; i += 1) {
  const st = seedStudents[i % seedStudents.length];
  const date = `2026-08-${pad(1 + (i * 3) % 27)}`;
  consumeData.push({
    id: `c${i}`,
    年月: '2026-08',
    公司名称: COMP.name,
    纳税人识别号: COMP.tax,
    考勤日期: i === 0 ? todayISO() : date,
    学生姓名: st.name,
    学员编号: st.code,
    课耗金额: 712,
    消耗课时: '',
    课时长度: '',
    课程名称: '',
    课程类型: '',
    课程子类型: '',
    课程年级: '高三',
    科目: subs[i % subs.length],
    课程季: '',
    上课日期: i === 0 ? todayISO() : date,
    上课时间: '',
    教师: '',
    教师编码: '',
  });
}

function remainOf(code: string): number {
  const enrolled = cashData
    .filter((r) => r.学员编号 === code && r.类型 === '预收学费')
    .reduce((a, r) => a + r.交易金额, 0);
  const consume = consumeData.filter((r) => r.学员编号 === code).reduce((a, r) => a + r.课耗金额, 0);
  const refund = cashData
    .filter((r) => r.学员编号 === code && r.类型 === '预收退款')
    .reduce((a, r) => a + r.交易金额, 0);
  return Math.round((enrolled - consume - refund) * 100) / 100;
}

const accountData: AccountRow[] = [];
[6, 7].forEach((month) => {
  const ym = `2026-${pad(month)}`;
  const latest = month === 7;
  seedStudents.forEach((st) => {
    const rem = remainOf(st.code);
    const enrolled = cashData
      .filter((r) => r.学员编号 === st.code && r.类型 === '预收学费')
      .reduce((a, r) => a + r.交易金额, 0);
    const consume = consumeData.filter((r) => r.学员编号 === st.code).reduce((a, r) => a + r.课耗金额, 0);
    const refund = cashData
      .filter((r) => r.学员编号 === st.code && r.类型 === '预收退款')
      .reduce((a, r) => a + r.交易金额, 0);
    accountData.push({
      年月: ym,
      公司名称: COMP.name,
      纳税人识别号: COMP.tax,
      类型: '预收学费',
      学员编号: st.code,
      学生姓名: st.name,
      上月剩余: latest ? 0 : rem,
      应付: 0,
      转出: 0,
      预收: latest ? enrolled : 0,
      退款: latest ? refund : 0,
      理赔: 0,
      课耗: latest ? consume : 0,
      本月剩余: rem,
    });
  });
});

export const store = {
  companies,
  cashData,
  consumeData,
  accountData,
  enrollSeq: 0,
};

export function delay(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function nextEnrollCode(): string {
  const d = new Date();
  const ds = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  store.enrollSeq += 1;
  return `XYBH_${ds}${String(store.enrollSeq).padStart(6, '0')}`;
}

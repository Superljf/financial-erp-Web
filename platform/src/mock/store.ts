import type { Company, MonthImportStatus, MonthSnapshot } from '../types';
import { companyMonthKey } from '../utils/validate';
import {
  ACCOUNT_EXAMPLE,
  ACCOUNT_HEADERS,
  CASH_EXAMPLE,
  CASH_HEADERS,
  CONSUME_EXAMPLE,
  CONSUME_HEADERS,
} from './excel';

function seedCompany(
  id: number,
  tax: string,
  name: string,
  found: string,
  cancel = '',
): Company {
  return {
    id,
    tax,
    name,
    passwordMasked: '••••••',
    status: cancel ? 'CANCELLED' : 'CONTINUING',
    statusLabel: cancel ? '已注销' : '存续',
    found,
    cancel,
  };
}

const seedCompanies: Company[] = [
  seedCompany(1, '91350200MA8R1A1B2C', '快乐智豪厦门文化有限公司', '2020-03-15'),
  seedCompany(2, '91350200MA8R2A2B3C', '厦门智学教育咨询有限公司', '2019-07-01'),
  seedCompany(3, '91350200MA8R3A3B4C', '福州优教文化有限公司', '2021-01-10', '2024-12-31'),
  seedCompany(4, '91350200MA8R4A4B5C', '泉州博文培训学校', '2018-05-20'),
  seedCompany(5, '91350200MA8R5A5B6C', '漳州启航教育科技有限公司', '2022-09-01'),
  seedCompany(6, '91350200MA8R6A6B7C', '宁德思齐教育咨询有限公司', '2020-11-11'),
  seedCompany(7, '91350200MA8R7A7B8C', '莆田明德文化有限公司', '2023-02-28'),
  seedCompany(8, '91350200MA8R8A8B9C', '龙岩育才教育服务中心', '2017-08-08'),
  seedCompany(9, '91350200MA8R9A9B0C', '三明启智教育咨询有限公司', '2021-06-18'),
  seedCompany(10, '91350200MA8R0A0B1C', '南平博雅文化有限公司', '2019-12-03'),
  seedCompany(11, '91350200MA8R1B1C2D', '厦门卓越素质培训学校', '2022-04-25', '2025-06-30'),
  seedCompany(12, '91350200MA8R2B2C3D', '福州翰林教育科技有限公司', '2020-09-09'),
];

export interface AppStore {
  companies: Company[];
  monthStatus: MonthImportStatus[];
  snapshots: Record<string, MonthSnapshot>;
  companyMonthImported: Set<string>;
}

function seedCompanyMonth(): Set<string> {
  const set = new Set<string>();
  [
    [1, 2026, 6],
    [1, 2026, 7],
    [2, 2026, 3],
    [4, 2026, 5],
  ].forEach(([id, y, m]) => set.add(companyMonthKey(id, y, m)));
  return set;
}

function seedSnapshot(year: number, month: number): MonthSnapshot {
  const ym = `${year}-${String(month).padStart(2, '0')}`;
  const patchYm = (row: (string | number)[]) => {
    const next = [...row];
    next[0] = ym;
    return next;
  };
  return {
    year,
    month,
    account: { headers: [...ACCOUNT_HEADERS], rows: [patchYm(ACCOUNT_EXAMPLE)] },
    cash: { headers: [...CASH_HEADERS], rows: [patchYm(CASH_EXAMPLE)] },
    consume: { headers: [...CONSUME_HEADERS], rows: [patchYm(CONSUME_EXAMPLE)] },
  };
}

export const store: AppStore = {
  companies: seedCompanies.map((c) => ({ ...c })),
  monthStatus: [
    {
      month: 6,
      monthLabel: '6月',
      yearMonth: '2026-06',
      fileName: '汇总表202606.xlsx',
      uploadedAt: '2026-08-11 09:30:15',
      imported: true,
      canDownload: true,
    },
    {
      month: 7,
      monthLabel: '7月',
      yearMonth: '2026-07',
      fileName: '汇总表202607.xlsx',
      uploadedAt: '2026-08-11 14:05:42',
      imported: true,
      canDownload: true,
    },
  ],
  snapshots: {
    '2026-06': seedSnapshot(2026, 6),
    '2026-07': seedSnapshot(2026, 7),
  },
  companyMonthImported: seedCompanyMonth(),
};

export function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

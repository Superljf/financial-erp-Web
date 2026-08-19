import type { CompanyImportRow, MonthImportStatus, PageResult } from '../types';
import { downloadBlob, queryString, requestBlob, requestJson } from './http';

interface MonthImportRow {
  month: number;
  monthLabel: string;
  yearMonth: string;
  fileName?: string | null;
  uploadedAt?: string | null;
  imported: boolean;
  canDownload: boolean;
}

interface CompanyImportMatrix {
  year: number;
  companies: {
    companyId: number;
    companyName: string;
    cells: string[];
  }[];
}

function mapMonth(row: MonthImportRow): MonthImportStatus {
  return {
    month: row.month,
    monthLabel: row.monthLabel,
    yearMonth: row.yearMonth,
    fileName: row.fileName ?? undefined,
    uploadedAt: row.uploadedAt ?? undefined,
    imported: row.imported,
    canDownload: row.canDownload,
  };
}

export async function getMonthStatus(
  year: number,
  page: number,
  size: number,
  signal?: AbortSignal,
): Promise<PageResult<MonthImportStatus>> {
  const data = await requestJson<PageResult<MonthImportRow>>(
    `/api/admin/imports/months${queryString({ year, page, size })}`,
    { signal },
  );
  return {
    ...data,
    content: (data.content ?? []).map(mapMonth),
  };
}

export async function getCompanyImportMatrix(
  year: number,
  signal?: AbortSignal,
): Promise<CompanyImportRow[]> {
  const data = await requestJson<CompanyImportMatrix>(
    `/api/admin/imports/companies${queryString({ year })}`,
    { signal },
  );
  return (data.companies ?? []).map((row) => ({
    companyId: row.companyId,
    companyName: row.companyName,
    cells: row.cells ?? [],
  }));
}

export async function downloadTemplate(): Promise<void> {
  const { blob, filename } = await requestBlob('/api/admin/imports/template', '导入模板.xlsx');
  downloadBlob(blob, filename);
}

export async function downloadMonthSource(year: number, month: number): Promise<void> {
  const fallback = `原excel数据_${year}-${String(month).padStart(2, '0')}.xlsx`;
  const { blob, filename } = await requestBlob(`/api/admin/imports/${year}/${month}/file`, fallback);
  downloadBlob(blob, filename);
}

export async function uploadMonthFile(year: number, month: number, file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  await requestJson(`/api/admin/imports/${year}/${month}`, {
    method: 'POST',
    body: form,
    skipErrorToast: true,
  });
}

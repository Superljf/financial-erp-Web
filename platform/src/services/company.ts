import type { Company, CompanyFormValues, PageResult } from '../types';
import { queryString, requestJson } from './http';

interface CompanyResponse {
  id: number;
  taxNo: string;
  name: string;
  passwordMasked?: string;
  status?: string;
  statusLabel?: string;
  establishedDate?: string | null;
  cancelledDate?: string | null;
}

export interface CompanyQuery {
  taxNo?: string;
  name?: string;
  page: number;
  size: number;
}

function mapCompany(row: CompanyResponse): Company {
  const cancel = row.cancelledDate ?? '';
  return {
    id: row.id,
    tax: row.taxNo,
    name: row.name,
    passwordMasked: row.passwordMasked || '••••••',
    status: row.status ?? (cancel ? 'CANCELLED' : 'CONTINUING'),
    statusLabel: row.statusLabel ?? (cancel ? '已注销' : '存续'),
    found: row.establishedDate ?? '',
    cancel,
  };
}

export async function listCompanies(
  query: CompanyQuery,
  signal?: AbortSignal,
): Promise<PageResult<Company>> {
  const data = await requestJson<PageResult<CompanyResponse>>(
    `/api/admin/companies${queryString({
      taxNo: query.taxNo?.trim(),
      name: query.name?.trim(),
      page: query.page,
      size: query.size,
    })}`,
    { signal },
  );
  return {
    ...data,
    content: (data.content ?? []).map(mapCompany),
  };
}

export async function createCompany(values: CompanyFormValues): Promise<Company> {
  const data = await requestJson<CompanyResponse>('/api/admin/companies', {
    method: 'POST',
    json: {
      taxNo: values.tax,
      name: values.name,
      password: values.pwd,
      establishedDate: values.found,
      cancelledDate: values.cancel || null,
    },
  });
  return mapCompany(data);
}

export async function updateCompany(id: number, values: Omit<CompanyFormValues, 'tax'>): Promise<Company> {
  const data = await requestJson<CompanyResponse>(`/api/admin/companies/${id}`, {
    method: 'PUT',
    json: {
      name: values.name,
      password: values.pwd,
      establishedDate: values.found,
      cancelledDate: values.cancel || null,
    },
  });
  return mapCompany(data);
}

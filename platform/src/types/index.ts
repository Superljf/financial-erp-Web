export interface Company {
  id: number;
  tax: string;
  name: string;
  passwordMasked: string;
  status: string;
  statusLabel: string;
  found: string;
  cancel: string;
}

export type RegisterStatus = '存续' | '已注销';

export interface MonthImportStatus {
  month: number;
  monthLabel: string;
  yearMonth: string;
  fileName?: string;
  uploadedAt?: string;
  imported: boolean;
  canDownload: boolean;
}

export interface CompanyImportRow {
  companyId: number;
  companyName: string;
  cells: string[];
}

export interface LoginPayload {
  username: string;
  password: string;
  captchaId: string;
  captchaCode: string;
}

export interface SheetSnapshot {
  headers: string[];
  rows: (string | number)[][];
}

export interface MonthSnapshot {
  year: number;
  month: number;
  account: SheetSnapshot;
  cash: SheetSnapshot;
  consume: SheetSnapshot;
}

export interface CompanyFormValues {
  tax: string;
  name: string;
  pwd: string;
  found: string;
  cancel?: string;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

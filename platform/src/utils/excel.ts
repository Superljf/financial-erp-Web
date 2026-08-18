import ExcelJS from 'exceljs';
import {
  ACCOUNT_EXAMPLE,
  ACCOUNT_HEADERS,
  CASH_EXAMPLE,
  CASH_HEADERS,
  CASH_OPTIONAL,
  CONSUME_EXAMPLE,
  CONSUME_HEADERS,
  CONSUME_OPTIONAL,
} from '../mock/excel';
import { store } from '../mock/store';
import type { SheetSnapshot } from '../types';
import { formatStamp, ymKey } from './validate';

export interface ParsedWorkbook {
  account: SheetSnapshot;
  cash: SheetSnapshot;
  consume: SheetSnapshot;
}

export interface ImportFail {
  ok: false;
  reasons: string[];
}

export interface ImportOk {
  ok: true;
  data: ParsedWorkbook;
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (value instanceof Date) {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${p(value.getMonth() + 1)}-${p(value.getDate())}`;
  }
  if (typeof value === 'object' && 'text' in value && typeof value.text === 'string') {
    return value.text.trim();
  }
  if (typeof value === 'object' && 'result' in value) {
    return cellText(value.result as ExcelJS.CellValue);
  }
  if (typeof value === 'object' && 'richText' in value && Array.isArray(value.richText)) {
    return value.richText.map((t) => t.text).join('').trim();
  }
  return String(value).trim();
}

function sheetToSnapshot(ws: ExcelJS.Worksheet): SheetSnapshot {
  const rows: (string | number)[][] = [];
  let headers: string[] = [];
  ws.eachRow((row, rowNumber) => {
    const values: (string | number)[] = [];
    const colCount = Math.max(row.cellCount, headers.length);
    for (let i = 1; i <= colCount; i += 1) {
      const raw = row.getCell(i).value;
      if (typeof raw === 'number') values.push(raw);
      else values.push(cellText(raw));
    }
    if (rowNumber === 1) {
      headers = values.map((v) => String(v));
    } else {
      rows.push(values);
    }
  });
  return { headers, rows };
}

function headersEqual(actual: string[], expected: readonly string[]): boolean {
  if (actual.length < expected.length) return false;
  return expected.every((h, i) => actual[i] === h);
}

function rowEmpty(row: (string | number)[]): boolean {
  return row.every((v) => v === '' || v == null);
}

function missingRequired(
  headers: readonly string[],
  row: (string | number)[],
  optional: Set<string>,
): boolean {
  return headers.some((h, i) => {
    if (optional.has(h)) return false;
    const v = row[i];
    return v === '' || v == null;
  });
}

function collectYm(snapshot: SheetSnapshot): string[] {
  const idx = snapshot.headers.indexOf('年月');
  if (idx < 0) return [];
  return snapshot.rows.filter((r) => !rowEmpty(r)).map((r) => String(r[idx] ?? ''));
}

function collectTax(snapshot: SheetSnapshot): string[] {
  const idx = snapshot.headers.indexOf('纳税人识别号');
  if (idx < 0) return [];
  return snapshot.rows.filter((r) => !rowEmpty(r)).map((r) => String(r[idx] ?? ''));
}

export async function parseImportFile(file: File): Promise<ParsedWorkbook> {
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const account = wb.getWorksheet('账户表');
  const cash = wb.getWorksheet('出纳表');
  const consume = wb.getWorksheet('课耗表');
  if (!account || !cash || !consume) {
    throw new Error('MISSING_SHEETS');
  }
  return {
    account: sheetToSnapshot(account),
    cash: sheetToSnapshot(cash),
    consume: sheetToSnapshot(consume),
  };
}

export function validateImport(
  parsed: ParsedWorkbook,
  year: number,
  month: number,
): ImportOk | ImportFail {
  const reasons: string[] = [];
  const expectedYm = ymKey(year, month);
  const taxSet = new Set(store.companies.map((c) => c.tax));

  if (
    !headersEqual(parsed.account.headers, ACCOUNT_HEADERS) ||
    !headersEqual(parsed.cash.headers, CASH_HEADERS) ||
    !headersEqual(parsed.consume.headers, CONSUME_HEADERS)
  ) {
    reasons.push('表头不一致');
  }

  const allRows = [
    ...parsed.account.rows.filter((r) => !rowEmpty(r)),
    ...parsed.cash.rows.filter((r) => !rowEmpty(r)),
    ...parsed.consume.rows.filter((r) => !rowEmpty(r)),
  ];

  const taxes = [
    ...collectTax(parsed.account),
    ...collectTax(parsed.cash),
    ...collectTax(parsed.consume),
  ];
  if (taxes.some((t) => t && !taxSet.has(t))) {
    reasons.push('纳税人识别号无匹配');
  }

  const yms = [
    ...collectYm(parsed.account),
    ...collectYm(parsed.cash),
    ...collectYm(parsed.consume),
  ];
  if (yms.some((ym) => ym && ym !== expectedYm)) {
    reasons.push('数据源年月≠当月');
  }

  const requiredEmpty =
    parsed.account.rows.filter((r) => !rowEmpty(r)).some((r) => missingRequired(ACCOUNT_HEADERS, r, new Set())) ||
    parsed.cash.rows.filter((r) => !rowEmpty(r)).some((r) => missingRequired(CASH_HEADERS, r, CASH_OPTIONAL)) ||
    parsed.consume.rows.filter((r) => !rowEmpty(r)).some((r) => missingRequired(CONSUME_HEADERS, r, CONSUME_OPTIONAL));
  if (requiredEmpty || allRows.length === 0) {
    reasons.push('必填为空');
  }

  if (reasons.length) return { ok: false, reasons: [...new Set(reasons)] };
  return { ok: true, data: parsed };
}

function addSheet(
  wb: ExcelJS.Workbook,
  name: string,
  headers: readonly string[],
  rows: (string | number)[][],
) {
  const ws = wb.addWorksheet(name);
  ws.addRow([...headers]);
  rows.forEach((row) => ws.addRow(row));
  ws.getRow(1).font = { bold: true };
}

export async function workbookToBlob(wb: ExcelJS.Workbook): Promise<Blob> {
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function buildTemplateBlob(): Promise<{ blob: Blob; filename: string }> {
  const wb = new ExcelJS.Workbook();
  addSheet(wb, '账户表', ACCOUNT_HEADERS, [ACCOUNT_EXAMPLE]);
  addSheet(wb, '出纳表', CASH_HEADERS, [CASH_EXAMPLE]);
  addSheet(wb, '课耗表', CONSUME_HEADERS, [CONSUME_EXAMPLE]);
  const blob = await workbookToBlob(wb);
  return { blob, filename: `汇总数据导入模板${formatStamp()}.xlsx` };
}

export async function buildSnapshotBlob(snap: {
  account: SheetSnapshot;
  cash: SheetSnapshot;
  consume: SheetSnapshot;
}): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  addSheet(wb, '账户表', snap.account.headers.length ? snap.account.headers : ACCOUNT_HEADERS, snap.account.rows);
  addSheet(wb, '出纳表', snap.cash.headers.length ? snap.cash.headers : CASH_HEADERS, snap.cash.rows);
  addSheet(wb, '课耗表', snap.consume.headers.length ? snap.consume.headers : CONSUME_HEADERS, snap.consume.rows);
  return workbookToBlob(wb);
}

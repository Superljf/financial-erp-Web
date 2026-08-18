import ExcelJS from 'exceljs';

export async function exportXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.addRow(headers);
  rows.forEach((r) => ws.addRow(r));
  ws.getRow(1).font = { bold: true };
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer as unknown as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

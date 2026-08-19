import { CheckOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import { Button, Select, Table, Tabs, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useState } from 'react';
import {
  downloadMonthSource,
  downloadTemplate,
  getCompanyImportMatrix,
  getMonthStatus,
} from '../../services/import';
import { isAbortError } from '../../services/http';
import { useAbortableEffect } from '../../hooks/useAbortableEffect';
import type { CompanyImportRow, MonthImportStatus } from '../../types';
import UploadModal from './UploadModal';

const YEARS = [2024, 2025, 2026];

export default function DataPage() {
  const [tab, setTab] = useState('month');
  const [year, setYear] = useState(2026);
  const [monthRows, setMonthRows] = useState<MonthImportStatus[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [matrix, setMatrix] = useState<CompanyImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadMonth, setUploadMonth] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const [months, companies] = await Promise.all([
          getMonthStatus(year, page - 1, 10, signal),
          getCompanyImportMatrix(year, signal),
        ]);
        if (signal?.aborted) return;
        setMonthRows(months.content);
        setMonthTotal(months.totalElements);
        setMatrix(companies);
      } catch (err) {
        if (isAbortError(err)) return;
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [year, page],
  );

  useAbortableEffect((signal) => loadData(signal), [loadData]);

  const monthColumns: ColumnsType<MonthImportStatus> = [
    {
      title: '月份',
      dataIndex: 'month',
      width: 80,
      render: (m: number) => <b>{m}月</b>,
    },
    {
      title: 'Excel 源文件',
      width: 170,
      render: (_, row) =>
        row.canDownload ? (
          <span
            className="file-pill"
            onClick={async () => {
              try {
                await downloadMonthSource(year, row.month);
                message.success('已下载原excel数据');
              } catch {
                /* 错误由 request 统一 toast */
              }
            }}
            title={row.fileName}
          >
            <FileExcelOutlined />
            <span>{row.fileName || '原excel数据'}</span>
          </span>
        ) : (
          <span style={{ color: '#86909c' }}>-</span>
        ),
    },
    {
      title: '上传时间',
      width: 170,
      render: (_, row) => row.uploadedAt || <span style={{ color: '#86909c' }}>-</span>,
    },
    {
      title: '导入状态',
      width: 120,
      render: (_, row) =>
        row.imported ? (
          <span>
            <i className="status-dot status-dot--blue" />
            已导入
          </span>
        ) : (
          <span>
            <i className="status-dot status-dot--gray" />
            未导入
          </span>
        ),
    },
    {
      title: '操作',
      width: 140,
      render: (_, row) =>
        row.imported ? (
          <Button onClick={() => setUploadMonth(row.month)}>重新上传</Button>
        ) : (
          <Button type="primary" onClick={() => setUploadMonth(row.month)}>
            上传
          </Button>
        ),
    },
  ];

  return (
    <div className="page-card page-card--stretch">
      <Tabs
        activeKey={tab}
        onChange={setTab}
        style={{ padding: '0 20px' }}
        items={[
          { key: 'month', label: '按月份' },
          { key: 'company', label: '按公司' },
        ]}
      />
      <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#4e5969' }}>查询年份</span>
        <Select
          value={year}
          style={{ width: 120 }}
          options={YEARS.map((y) => ({ value: y, label: String(y) }))}
          onChange={(value) => {
            setYear(value);
            setPage(1);
          }}
        />
        {tab === 'month' ? (
          <>
            <span style={{ flex: 1 }} />
            <Button
              icon={<DownloadOutlined />}
              onClick={async () => {
                try {
                  await downloadTemplate();
                  message.success('已下载导入模板（账户表 / 出纳表 / 课耗表 三表）');
                } catch {
                  /* 错误由 request 统一 toast */
                }
              }}
            >
              下载导入模板
            </Button>
          </>
        ) : null}
      </div>
      {tab === 'month' ? (
        <Table<MonthImportStatus>
          rowKey="month"
          loading={loading}
          columns={monthColumns}
          dataSource={monthRows}
          pagination={{
            current: page,
            pageSize: 10,
            total: monthTotal,
            showSizeChanger: false,
            onChange: setPage,
          }}
        />
      ) : (
        <CompanyMatrix rows={matrix} loading={loading} />
      )}
      <UploadModal
        open={uploadMonth != null}
        month={uploadMonth || 1}
        year={year}
        onClose={() => setUploadMonth(null)}
        onSuccess={async () => {
          setUploadMonth(null);
          await loadData();
        }}
      />
    </div>
  );
}

function CompanyMatrix({ rows, loading }: { rows: CompanyImportRow[]; loading: boolean }) {
  if (loading && rows.length === 0) {
    return <div className="matrix-wrap" style={{ color: '#86909c' }}>加载中…</div>;
  }
  return (
    <div className="matrix-wrap">
      <table className="matrix-table">
        <thead>
          <tr>
            <th>公司 ＼ 月份</th>
            {Array.from({ length: 12 }, (_, i) => (
              <th key={i}>{i + 1}月</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.companyId}>
              <td>
                <b>{row.companyName}</b>
              </td>
              {Array.from({ length: 12 }, (_, i) => {
                const cell = row.cells[i] ?? 'BLANK';
                if (cell === 'BLANK') return <td key={i} />;
                return (
                  <td key={i}>
                    {cell === 'IMPORTED' ? (
                      <span className="check-ok" title="已导入">
                        <CheckOutlined />
                      </span>
                    ) : (
                      <span className="check-empty" title="未导入">
                        ○
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

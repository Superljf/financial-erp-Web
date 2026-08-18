import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useTableScrollY } from '../../hooks/useTableScrollY';
import { listConsReport, listPerf } from '../../services/student';
import type { CashRow, ConsumeRow } from '../../types';
import { exportXlsx } from '../../utils/excel';
import { formatMoney, monthFirstLast, spanDays } from '../../utils/format';

interface Props {
  kind: 'perf' | 'cons';
}

export default function ReportPage({ kind }: Props) {
  const { company } = useAuth();
  const init = monthFirstLast();
  const [start, setStart] = useState(init.start);
  const [end, setEnd] = useState(init.end);
  const [applied, setApplied] = useState(init);
  const [rows, setRows] = useState<(CashRow | ConsumeRow)[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = async () => {
    if (!company) return;
    setLoading(true);
    const data = kind === 'perf' ? await listPerf(company) : await listConsReport(company);
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
    void load();
  }, [kind, company?.id]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const date = kind === 'perf' ? (r as CashRow).交易日期 : (r as ConsumeRow).考勤日期;
      return date >= applied.start && date <= applied.end;
    });
  }, [rows, applied, kind]);

  const { wrapRef, scrollY } = useTableScrollY(`${kind}-${page}-${filtered.length}`);

  const query = () => {
    if (!start || !end) {
      message.error('请选择起止日期');
      return;
    }
    if (end < start) {
      message.error('结束日期不能早于开始日期');
      return;
    }
    if (spanDays(start, end) > 91) {
      message.error('时间跨度不能超过 91 天');
      return;
    }
    if (company && start < company.found) {
      message.error('最早日期不能早于公司成立日');
      return;
    }
    setApplied({ start, end });
    setPage(1);
  };

  const reset = () => {
    const r = monthFirstLast();
    setStart(r.start);
    setEnd(r.end);
    setApplied(r);
    setPage(1);
  };

  const exportFile = async () => {
    if (!company) return;
    if (kind === 'perf') {
      const data = filtered as CashRow[];
      await exportXlsx(
        `业绩报表_${company.name}_${applied.start}-${applied.end}.xlsx`,
        '业绩报表',
        ['交易日期', '交易金额', '学员姓名'],
        data.map((r) => [r.交易日期, r.交易金额, r.学生姓名]),
      );
    } else {
      const data = filtered as ConsumeRow[];
      await exportXlsx(
        `课耗报表_${company.name}_${applied.start}-${applied.end}.xlsx`,
        '课耗报表',
        ['考勤日期', '学员姓名', '课程年级', '课耗金额', '科目'],
        data.map((r) => [r.考勤日期, r.学生姓名, r.课程年级, r.课耗金额, r.科目]),
      );
    }
    message.success(`已导出 ${filtered.length} 条（不受分页限制）`);
  };

  const perfCols: ColumnsType<CashRow> = [
    { title: '交易日期', dataIndex: '交易日期', sorter: (a, b) => a.交易日期.localeCompare(b.交易日期) },
    {
      title: '交易金额（元）',
      dataIndex: '交易金额',
      align: 'right',
      sorter: (a, b) => a.交易金额 - b.交易金额,
      render: (v: number) => formatMoney(v),
    },
    { title: '学员姓名', dataIndex: '学生姓名', sorter: (a, b) => a.学生姓名.localeCompare(b.学生姓名) },
  ];

  const consCols: ColumnsType<ConsumeRow> = [
    { title: '考勤日期', dataIndex: '考勤日期', sorter: (a, b) => a.考勤日期.localeCompare(b.考勤日期) },
    { title: '学员姓名', dataIndex: '学生姓名', sorter: (a, b) => a.学生姓名.localeCompare(b.学生姓名) },
    { title: '课程年级', dataIndex: '课程年级', sorter: (a, b) => a.课程年级.localeCompare(b.课程年级) },
    {
      title: '课耗金额（元）',
      dataIndex: '课耗金额',
      align: 'right',
      sorter: (a, b) => a.课耗金额 - b.课耗金额,
      render: (v: number) => formatMoney(v),
    },
    { title: '科目', dataIndex: '科目', sorter: (a, b) => a.科目.localeCompare(b.科目) },
  ];

  const pagination = {
    current: page,
    pageSize: 20,
    showSizeChanger: false,
    showQuickJumper: true,
    onChange: setPage,
    showTotal: (t: number) => `共 ${t} 条记录，每页 20 条，共 ${Math.max(1, Math.ceil(t / 20))} 页`,
  };

  return (
    <div className="page-card page-card--stretch">
      <div className="report-toolbar">
        <span>开始日期</span>
        <DatePicker
          allowClear
          value={start ? dayjs(start) : null}
          onChange={(d) => setStart(d ? d.format('YYYY-MM-DD') : '')}
        />
        <span>~</span>
        <span>结束日期</span>
        <DatePicker
          allowClear
          value={end ? dayjs(end) : null}
          onChange={(d) => setEnd(d ? d.format('YYYY-MM-DD') : '')}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={query}>
          查询
        </Button>
        <Button onClick={reset}>重置</Button>
        <span style={{ flex: 1 }} />
        <Button type="primary" icon={<DownloadOutlined />} onClick={() => void exportFile()}>
          导出
        </Button>
      </div>
      <div ref={wrapRef} className="table-fill">
        {kind === 'perf' ? (
          <Table<CashRow>
            rowKey="id"
            loading={loading}
            columns={perfCols}
            dataSource={filtered as CashRow[]}
            pagination={pagination}
            scroll={{ y: scrollY }}
          />
        ) : (
          <Table<ConsumeRow>
            rowKey="id"
            loading={loading}
            columns={consCols}
            dataSource={filtered as ConsumeRow[]}
            pagination={pagination}
            scroll={{ y: scrollY }}
          />
        )}
      </div>
    </div>
  );
}

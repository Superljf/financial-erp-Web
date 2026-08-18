import { SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Modal, Table, Tabs, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  accountRemain,
  attend,
  enrollExist,
  enrollNew,
  listConsume,
  listEnroll,
  listRefund,
  peekEnrollCode,
  searchStudents,
  voidConsume,
  voidEnroll,
} from '../../services/student';
import type { CashRow, ConsumeRow, StudentBrief } from '../../types';
import { default91Range, formatMoney, maskCode, todayISO } from '../../utils/format';
import AttendModal from './AttendModal';
import EnrollModal from './EnrollModal';
import '../../layouts/CompanyLayout.css';

type TabKey = 'enroll' | 'consume' | 'refund';

export default function ProfilePage() {
  const { company } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<StudentBrief[] | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StudentBrief | null>(null);
  const [remain, setRemain] = useState(0);
  const [tab, setTab] = useState<TabKey>('enroll');
  const defaultFilters = () => ({
    enroll: default91Range(),
    consume: default91Range(),
    refund: default91Range(),
  });
  const [draftFilters, setDraftFilters] = useState(defaultFilters());
  const [filters, setFilters] = useState(defaultFilters());
  const [enrollRows, setEnrollRows] = useState<CashRow[]>([]);
  const [consumeRows, setConsumeRows] = useState<ConsumeRow[]>([]);
  const [refundRows, setRefundRows] = useState<CashRow[]>([]);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollMode, setEnrollMode] = useState<'new' | 'exist'>('new');
  const [pendingCode, setPendingCode] = useState('');
  const [attendOpen, setAttendOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!company) return null;

  const doSearch = async () => {
    const q = keyword.trim();
    if (!q) {
      message.error('请输入学员姓名');
      return;
    }
    const list = await searchStudents(company, q);
    setResults(list);
    setPage(1);
    setSelected(null);
  };

  const openDetail = async (stu: StudentBrief) => {
    setSelected(stu);
    setTab('enroll');
    const range = defaultFilters();
    setDraftFilters(range);
    setFilters(range);
    const [en, co, re] = await Promise.all([
      listEnroll(company, stu.code),
      listConsume(company, stu.code),
      listRefund(company, stu.code),
    ]);
    setEnrollRows(en);
    setConsumeRows(co);
    setRefundRows(re);
    setRemain(accountRemain(stu.code, company));
  };

  const refreshDetail = async (code: string, nextTab?: TabKey) => {
    const [en, co, re] = await Promise.all([
      listEnroll(company, code),
      listConsume(company, code),
      listRefund(company, code),
    ]);
    setEnrollRows(en);
    setConsumeRows(co);
    setRefundRows(re);
    setRemain(accountRemain(code, company));
    if (nextTab) setTab(nextTab);
  };

  const filterBy = (start: string, end: string, date: string) => date >= start && date <= end;

  const currentFilter = filters[tab];
  const enrollView = enrollRows.filter((r) => filterBy(currentFilter.start, currentFilter.end, r.交易日期));
  const consumeView = consumeRows.filter((r) => filterBy(currentFilter.start, currentFilter.end, r.考勤日期));
  const refundView = refundRows.filter((r) => filterBy(currentFilter.start, currentFilter.end, r.交易日期));

  const queryRange = (kind: TabKey) => {
    const s = draftFilters[kind].start;
    const e = draftFilters[kind].end;
    if (!s || !e) {
      message.error('请选择起止日期');
      return;
    }
    if (e < s) {
      message.error('结束日期不能早于开始日期');
      return;
    }
    setFilters((prev) => ({ ...prev, [kind]: { start: s, end: e } }));
  };

  const enrollCols: ColumnsType<CashRow> = [
    { title: '交易日期', dataIndex: '交易日期' },
    { title: '交易金额（元）', dataIndex: '交易金额', align: 'right', render: (v: number) => formatMoney(v) },
    {
      title: '',
      width: 90,
      render: (_, row) =>
        row.交易日期 === todayISO() ? (
          <Button
            danger
            size="small"
            onClick={() => {
              Modal.confirm({
                title: `请确认是否作废 ${row.交易日期} 报读金额 ${formatMoney(row.交易金额)} 元的记录？`,
                okText: '立即作废',
                cancelText: '暂不作废',
                onOk: async () => {
                  await voidEnroll(company, row.id, selected!.code);
                  await refreshDetail(selected!.code);
                  message.success('已作废该报读记录');
                },
              });
            }}
          >
            作废
          </Button>
        ) : null,
    },
  ];

  const consumeCols: ColumnsType<ConsumeRow> = [
    { title: '考勤日期', dataIndex: '考勤日期' },
    { title: '科目', dataIndex: '科目' },
    { title: '课耗金额（元）', dataIndex: '课耗金额', align: 'right', render: (v: number) => formatMoney(v) },
    {
      title: '',
      width: 90,
      render: (_, row) =>
        row.考勤日期 === todayISO() ? (
          <Button
            danger
            size="small"
            onClick={() => {
              Modal.confirm({
                title: `请确认是否作废 ${row.考勤日期} ${row.科目}的课耗记录？`,
                okText: '立即作废',
                cancelText: '暂不作废',
                onOk: async () => {
                  await voidConsume(company, row.id, selected!.code);
                  await refreshDetail(selected!.code);
                  message.success('已作废该考勤记录');
                },
              });
            }}
          >
            作废
          </Button>
        ) : null,
    },
  ];

  const refundCols: ColumnsType<CashRow> = [
    { title: '退费日期', dataIndex: '交易日期' },
    { title: '退费金额（元）', dataIndex: '交易金额', align: 'right', render: (v: number) => formatMoney(v) },
  ];

  const filterBar = (kind: TabKey) => (
    <div style={{ padding: '0 24px 12px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span>开始日期</span>
      <DatePicker
        allowClear
        value={draftFilters[kind].start ? dayjs(draftFilters[kind].start) : null}
        onChange={(d) =>
          setDraftFilters((p) => ({ ...p, [kind]: { ...p[kind], start: d ? d.format('YYYY-MM-DD') : '' } }))
        }
      />
      <span>~</span>
      <span>结束日期</span>
      <DatePicker
        allowClear
        value={draftFilters[kind].end ? dayjs(draftFilters[kind].end) : null}
        onChange={(d) =>
          setDraftFilters((p) => ({ ...p, [kind]: { ...p[kind], end: d ? d.format('YYYY-MM-DD') : '' } }))
        }
      />
      <Button type="primary" icon={<SearchOutlined />} onClick={() => queryRange(kind)}>
        查询
      </Button>
      <Button
        onClick={() => {
          const range = default91Range();
          setDraftFilters((p) => ({ ...p, [kind]: range }));
          setFilters((p) => ({ ...p, [kind]: range }));
        }}
      >
        重置
      </Button>
    </div>
  );

  const resultTable = (() => {
    if (results === null) return null;
    if (results.length === 0) {
      return (
        <div className="profile-list-wrap">
          <div className="page-card" style={{ marginTop: 16 }}>
            <div className="enroll-hint">
              找不到学生？去{' '}
              <button
                type="button"
                onClick={() => {
                  setPendingCode(peekEnrollCode());
                  setEnrollMode('new');
                  setEnrollOpen(true);
                }}
              >
                新生报名
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="profile-list-wrap">
        <div className="page-card" style={{ marginTop: 16 }}>
          <div style={{ padding: '14px 24px 8px', color: '#86909c' }}>共 {results.length} 条</div>
          <Table<StudentBrief>
            rowKey="code"
            dataSource={results}
            pagination={{ current: page, pageSize: 10, total: results.length, onChange: setPage, showSizeChanger: false }}
            onRow={(row) => ({ onClick: () => void openDetail(row), style: { cursor: 'pointer' } })}
            columns={[
              { title: '学员编号', dataIndex: 'code', render: (v: string) => maskCode(v) },
              { title: '学员姓名', dataIndex: 'name' },
              { title: '', width: 56, render: () => <span style={{ color: '#1677ff', fontSize: 18 }}>›</span> },
            ]}
          />
        </div>
      </div>
    );
  })();

  if (selected) {
    return (
      <div>
        <div className="hero">
          <div className="hero-main">
            <div className="name">{selected.name}</div>
            <div className="code">{maskCode(selected.code)}</div>
          </div>
          <div className="hero-amount">
            <div className="ico">¥</div>
            <div>
              <div className="val">¥{formatMoney(remain)} 元</div>
              <div className="lab">剩余学费</div>
            </div>
          </div>
          <div className="hero-actions">
            <button
              type="button"
              className="btn-light"
              onClick={() => {
                setEnrollMode('exist');
                setEnrollOpen(true);
              }}
            >
              报名
            </button>
            <Tooltip title={remain <= 0 ? '当前学员无剩余金额无法考勤' : ''}>
              <span>
                <button
                  type="button"
                  className="btn-light"
                  disabled={remain <= 0}
                  onClick={() => setAttendOpen(true)}
                >
                  考勤
                </button>
              </span>
            </Tooltip>
          </div>
        </div>
        <div className="page-card" style={{ marginTop: 16 }}>
          <Tabs
            activeKey={tab}
            onChange={(k) => setTab(k as TabKey)}
            style={{ padding: '0 20px' }}
            items={[
              { key: 'enroll', label: '报读记录' },
              { key: 'consume', label: '课耗记录' },
              { key: 'refund', label: '退费记录' },
            ]}
          />
          {filterBar(tab)}
          {tab === 'enroll' && (
            <Table rowKey="id" columns={enrollCols} dataSource={enrollView} pagination={{ pageSize: 10 }} />
          )}
          {tab === 'consume' && (
            <Table rowKey="id" columns={consumeCols} dataSource={consumeView} pagination={{ pageSize: 10 }} />
          )}
          {tab === 'refund' && (
            <Table rowKey="id" columns={refundCols} dataSource={refundView} pagination={{ pageSize: 10 }} />
          )}
        </div>
        <div className="back-bar">
          <Button onClick={() => setSelected(null)}>返回学员搜索</Button>
        </div>
        <EnrollModal
          open={enrollOpen && enrollMode === 'exist'}
          mode="exist"
          name={selected.name}
          submitting={submitting}
          onCancel={() => setEnrollOpen(false)}
          onSubmit={async (v) => {
            setSubmitting(true);
            try {
              await enrollExist(company, { code: selected.code, name: selected.name, amount: v.amount, date: v.date });
              setEnrollOpen(false);
              await refreshDetail(selected.code, 'enroll');
              message.success('报名成功');
            } finally {
              setSubmitting(false);
            }
          }}
        />
        <AttendModal
          open={attendOpen}
          name={selected.name}
          submitting={submitting}
          onCancel={() => setAttendOpen(false)}
          onSubmit={async (v) => {
            setSubmitting(true);
            try {
              await attend(company, { code: selected.code, name: selected.name, ...v });
              setAttendOpen(false);
              await refreshDetail(selected.code, 'consume');
              message.success('考勤成功');
            } catch (err) {
              message.error(err instanceof Error ? err.message : '考勤失败');
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="search-hero">
        <div className="search-logo">学员查询</div>
        <div className={`search-bar${keyword ? ' has-text' : ''}`}>
          <input
            ref={inputRef}
            placeholder="请输入学员姓名"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void doSearch()}
          />
          <button
            type="button"
            className="btn-clear"
            aria-label="清空搜索"
            onClick={() => {
              setKeyword('');
              setResults(null);
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
          <button type="button" className="btn-search" onClick={() => void doSearch()}>
            查询
          </button>
        </div>
      </div>
      {resultTable}
      <EnrollModal
        open={enrollOpen && enrollMode === 'new'}
        mode="new"
        name={keyword.trim()}
        submitting={submitting}
        onCancel={() => setEnrollOpen(false)}
        onSubmit={async (v) => {
          setSubmitting(true);
          try {
            const stu = await enrollNew(company, { code: pendingCode, name: v.name, amount: v.amount, date: v.date });
            setEnrollOpen(false);
            message.success('报名成功，已跳转到该学员档案');
            await openDetail(stu);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </div>
  );
}

import { EditOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { createCompany, listCompanies, updateCompany } from '../../services/company';
import { ApiError } from '../../services/http';
import type { Company } from '../../types';
import CompanyFormModal from './CompanyFormModal';

function PasswordCell({ masked, plaintext }: { masked: string; plaintext?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <span className="pwd-cell">
      <span className="pwd-text">{shown && plaintext ? plaintext : masked || '••••••'}</span>
      <button
        type="button"
        className="pwd-eye"
        aria-label={shown ? '隐藏密码' : '显示密码'}
        onClick={() => {
          if (!plaintext) {
            message.info('密码已加密存储，无法查看明文，可通过编辑重置');
            return;
          }
          setShown((v) => !v);
        }}
      >
        {shown ? <EyeInvisibleOutlined /> : <EyeOutlined />}
      </button>
    </span>
  );
}

export default function CompanyPage() {
  const [rows, setRows] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [taxQ, setTaxQ] = useState('');
  const [nameQ, setNameQ] = useState('');
  const [appliedTax, setAppliedTax] = useState('');
  const [appliedName, setAppliedName] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Company | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pwdCache, setPwdCache] = useState<Record<number, string>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCompanies({
        taxNo: appliedTax,
        name: appliedName,
        page: page - 1,
        size: pageSize,
      });
      setRows(data.content);
      setTotal(data.totalElements);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return;
      message.error(err instanceof ApiError ? err.message : '加载公司列表失败');
    } finally {
      setLoading(false);
    }
  }, [appliedTax, appliedName, page, pageSize]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filteredFlag = Boolean(appliedTax || appliedName);

  const onSearch = () => {
    setAppliedTax(taxQ);
    setAppliedName(nameQ);
    setPage(1);
  };

  const onReset = () => {
    setTaxQ('');
    setNameQ('');
    setAppliedTax('');
    setAppliedName('');
    setPage(1);
  };

  const columns: ColumnsType<Company> = [
    { title: 'id', dataIndex: 'id', width: 56, ellipsis: true },
    { title: '纳税人识别号', dataIndex: 'tax', width: 200, ellipsis: true },
    { title: '公司名称', dataIndex: 'name', width: 220, ellipsis: true },
    {
      title: '专用密码',
      dataIndex: 'passwordMasked',
      width: 160,
      render: (v: string, row) => <PasswordCell masked={v} plaintext={pwdCache[row.id]} />,
    },
    {
      title: '登记状态',
      width: 100,
      render: (_, row) => (
        <span>
          <i className={`status-dot ${row.statusLabel === '存续' ? 'status-dot--blue' : 'status-dot--yellow'}`} />
          {row.statusLabel}
        </span>
      ),
    },
    { title: '成立日期', dataIndex: 'found', width: 120 },
    {
      title: '注销日期',
      dataIndex: 'cancel',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'op',
      width: 96,
      fixed: 'right',
      render: (_, row) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => {
            setModalMode('edit');
            setEditing(row);
            setModalOpen(true);
          }}
        >
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div className="page-card">
      <div style={{ padding: '16px 24px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          placeholder="纳税人识别号"
          value={taxQ}
          onChange={(e) => setTaxQ(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
        <Input
          placeholder="公司名称"
          value={nameQ}
          onChange={(e) => setNameQ(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={onSearch}>
          查询
        </Button>
        <Button onClick={onReset}>重置</Button>
        <span style={{ flex: 1 }} />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setModalMode('create');
            setEditing(null);
            setModalOpen(true);
          }}
        >
          新增公司
        </Button>
      </div>
      <div style={{ padding: '0 24px 12px', color: '#86909c', fontSize: 13 }}>
        共 {total} 家公司{filteredFlag ? '（已按纳税人识别号/公司名称过滤）' : ''}
      </div>
      <Table<Company>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: false,
          showTotal: (t, range) => `共 ${t} 条记录，第 ${range[0]}-${range[1]} 条`,
          onChange: (p, s) => {
            setPage(p);
            setPageSize(s);
          },
        }}
        locale={{ emptyText: '无匹配公司' }}
      />
      <CompanyFormModal
        open={modalOpen}
        mode={modalMode}
        company={editing}
        submitting={submitting}
        onCancel={() => setModalOpen(false)}
        onSubmit={async (values) => {
          setSubmitting(true);
          try {
            if (modalMode === 'create') {
              const created = await createCompany(values);
              setPwdCache((m) => ({ ...m, [created.id]: values.pwd }));
              message.success('新增成功，已生成登录身份');
            } else if (editing) {
              await updateCompany(editing.id, values);
              setPwdCache((m) => ({ ...m, [editing.id]: values.pwd }));
              message.success('保存成功');
            }
            setModalOpen(false);
            await reload();
          } catch (err) {
            message.error(err instanceof Error ? err.message : '保存失败');
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </div>
  );
}

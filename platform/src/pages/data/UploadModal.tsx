import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Modal, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useState } from 'react';
import { downloadTemplate, uploadMonthFile } from '../../services/import';
import { ApiError } from '../../services/http';

interface Props {
  open: boolean;
  year: number;
  month: number;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

function toReasons(err: unknown): string[] {
  if (err instanceof ApiError) {
    if (Array.isArray(err.data) && err.data.every((item) => typeof item === 'string')) {
      return err.data as string[];
    }
    return err.message.split(/[；;\n]/).map((s) => s.trim()).filter(Boolean);
  }
  return [err instanceof Error ? err.message : '导入失败'];
}

export default function UploadModal({ open, year, month, onClose, onSuccess }: Props) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const file = fileList[0]?.originFileObj as File | undefined;

  const reset = () => {
    setFileList([]);
    setReasons([]);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const startUpload = async () => {
    if (!file) {
      message.error('请先选择 Excel 文件');
      return;
    }
    setLoading(true);
    try {
      await uploadMonthFile(year, month, file);
      message.success('导入成功（覆盖当月数据）');
      reset();
      await onSuccess();
    } catch (err) {
      setReasons(toReasons(err));
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`上传数据 · ${month}月`}
      open={open}
      onCancel={handleClose}
      onOk={startUpload}
      okText="开始上传"
      cancelText="取消"
      confirmLoading={loading}
      width={520}
      destroyOnClose
    >
      <p style={{ color: '#4e5969', marginBottom: 14 }}>
        请选择 Excel 文件（.xlsx / .xls），每次仅 1 个文件，覆盖当月数据。
      </p>
      <Upload
        accept=".xlsx,.xls"
        maxCount={1}
        fileList={fileList}
        beforeUpload={(f) => {
          setFileList([
            {
              uid: f.uid,
              name: f.name,
              status: 'done',
              originFileObj: f,
            },
          ]);
          setReasons([]);
          return false;
        }}
        onRemove={() => {
          setFileList([]);
          return true;
        }}
      >
        <Button type="primary" icon={<UploadOutlined />}>
          选择文件
        </Button>
      </Upload>
      <div style={{ margin: '10px 0 16px', color: '#86909c', fontSize: 13 }}>
        {file ? file.name : '未选择任何文件'}
      </div>
      <div className="upload-rules">
        <b style={{ color: '#1d2129' }}>校验规则：</b>
        <ol style={{ margin: '6px 0 0', paddingLeft: 20 }}>
          <li>工作簿须含「账户表 / 出纳表 / 课耗表」三张</li>
          <li>表头必须与导入模板一致</li>
          <li>所有字段必填；数据源年月 = 当月</li>
          <li>纳税人识别号需匹配系统中的公司（存续 / 已注销均可导入）</li>
        </ol>
      </div>
      <div style={{ marginTop: 14 }}>
        <Button
          type="link"
          icon={<DownloadOutlined />}
          onClick={async () => {
            try {
              await downloadTemplate();
            } catch (err) {
              message.error(err instanceof Error ? err.message : '下载失败');
            }
          }}
          style={{ paddingLeft: 0 }}
        >
          下载导入模板（标准表头）
        </Button>
      </div>
      {reasons.length > 0 ? (
        <div
          style={{
            marginTop: 10,
            padding: 12,
            background: '#ffece8',
            borderRadius: 8,
            fontSize: 13,
            color: '#f53f3f',
          }}
        >
          <b style={{ display: 'block', marginBottom: 6 }}>导入失败（整批拒绝，未写入数据）</b>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </Modal>
  );
}

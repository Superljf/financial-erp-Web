import { useEffect, useMemo, useState } from 'react';
import { DatePicker, Form, Input, Modal } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { Company } from '../../types';
import { isChineseCompanyName } from '../../utils/validate';

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  company?: Company | null;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    tax: string;
    name: string;
    pwd: string;
    found: string;
    cancel?: string;
  }) => Promise<void>;
}

interface FormShape {
  tax?: string;
  name?: string;
  pwd?: string;
  found?: Dayjs | null;
  cancel?: Dayjs | null;
}

export default function CompanyFormModal({
  open,
  mode,
  company,
  submitting,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<FormShape>();
  const [canSave, setCanSave] = useState(false);
  const tax = Form.useWatch('tax', form);
  const name = Form.useWatch('name', form);
  const pwd = Form.useWatch('pwd', form);
  const found = Form.useWatch('found', form);

  const title = mode === 'create' ? '新增公司' : '编辑公司';

  const requiredFilled = useMemo(() => {
    if (mode === 'create') {
      return Boolean(tax && name && pwd && found);
    }
    return Boolean(name && pwd && found);
  }, [mode, tax, name, pwd, found]);

  useEffect(() => {
    setCanSave(requiredFilled);
  }, [requiredFilled]);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && company) {
      form.setFieldsValue({
        tax: company.tax,
        name: company.name,
        pwd: '',
        found: company.found ? dayjs(company.found) : null,
        cancel: company.cancel ? dayjs(company.cancel) : null,
      });
    } else {
      form.resetFields();
    }
  }, [open, mode, company, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const foundStr = values.found ? values.found.format('YYYY-MM-DD') : '';
      const cancelStr = values.cancel ? values.cancel.format('YYYY-MM-DD') : '';
      if (cancelStr && foundStr && cancelStr < foundStr) {
        form.setFields([{ name: 'cancel', errors: ['注销日期不得早于成立日期'] }]);
        return;
      }
      await onSubmit({
        tax: mode === 'edit' && company ? company.tax : (values.tax || ''),
        name: values.name || '',
        pwd: values.pwd || '',
        found: foundStr,
        cancel: cancelStr,
      });
    } catch {
      /* antd 已展示字段错误 */
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="保 存"
      cancelText="取消"
      confirmLoading={submitting}
      okButtonProps={{ disabled: !canSave }}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" autoComplete="off" style={{ marginTop: 12 }}>
        {mode === 'edit' && company ? (
          <>
            <Form.Item label="id（系统主键）">
              <Input value={company.id} disabled />
            </Form.Item>
            <Form.Item label="纳税人识别号（业务键）">
              <Input value={company.tax} disabled />
            </Form.Item>
          </>
        ) : (
          <Form.Item
            label="纳税人识别号"
            name="tax"
            validateTrigger={['onBlur', 'onChange']}
            rules={[{ required: true, message: '纳税人识别号不能为空' }]}
          >
            <Input placeholder="请输入纳税人识别号" />
          </Form.Item>
        )}
        <Form.Item
          label="公司名称"
          name="name"
          validateTrigger={['onBlur', 'onChange']}
          rules={[
            { required: true, message: '公司名称不能为空' },
            {
              validator: async (_, value) => {
                if (!value) return;
                if (!isChineseCompanyName(value)) {
                  throw new Error('公司名称仅允许中文');
                }
              },
            },
          ]}
        >
          <Input placeholder="请输入公司名称" />
        </Form.Item>
        <Form.Item
          label="专用密码"
          name="pwd"
          extra={mode === 'edit' ? '列表不返回明文密码，保存时需重新填写公司端登录密码' : undefined}
          validateTrigger={['onBlur', 'onChange']}
          rules={[
            { required: true, message: '专用密码不能为空' },
            { min: 6, max: 16, message: '请输入6-16位字符作为公司端登录密码' },
          ]}
        >
          <Input.Password placeholder="请输入6-16位字符作为公司端登录密码" />
        </Form.Item>
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            label="成立日期"
            name="found"
            style={{ flex: 1 }}
            validateTrigger={['onBlur', 'onChange']}
            rules={[{ required: true, message: '成立日期不能为空' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="yyyy-mm-dd" />
          </Form.Item>
          <Form.Item label="注销日期" name="cancel" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} placeholder="yyyy-mm-dd" allowClear />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

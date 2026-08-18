import { DatePicker, Form, Input, InputNumber, Modal } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';
import { isChineseName, todayISO } from '../../utils/format';

interface Props {
  open: boolean;
  mode: 'new' | 'exist';
  name?: string;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: { name: string; amount: number; date: string }) => Promise<void>;
}

interface FormShape {
  name?: string;
  amount?: number | null;
  date?: Dayjs | null;
}

export default function EnrollModal({ open, mode, name, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormShape>();
  const watchName = Form.useWatch('name', form);
  const watchAmt = Form.useWatch('amount', form);
  const watchDate = Form.useWatch('date', form);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: name || '',
      amount: undefined,
      date: dayjs(todayISO()),
    });
  }, [open, name, form]);

  const canSubmit = useMemo(() => {
    const amt = Number(watchAmt);
    const dateOk = Boolean(watchDate);
    const amtOk = amt > 0 && amt <= 1000000;
    if (mode === 'new') return Boolean(watchName && isChineseName(watchName) && amtOk && dateOk);
    return amtOk && dateOk;
  }, [mode, watchName, watchAmt, watchDate]);

  return (
    <Modal
      title="报名"
      open={open}
      onCancel={onCancel}
      onOk={async () => {
        const v = await form.validateFields();
        await onSubmit({
          name: v.name || name || '',
          amount: Number(v.amount),
          date: v.date!.format('YYYY-MM-DD'),
        });
      }}
      okText="立即报名"
      cancelText="暂不报名"
      confirmLoading={submitting}
      okButtonProps={{ disabled: !canSubmit }}
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item
          label="学员姓名"
          name="name"
          rules={
            mode === 'new'
              ? [
                  { required: true, message: '学员姓名不能为空' },
                  {
                    validator: async (_, v) => {
                      if (v && !isChineseName(v)) throw new Error('姓名须为2-20位中文');
                    },
                  },
                ]
              : []
          }
        >
          <Input placeholder="请输入学员姓名" disabled={mode === 'exist'} />
        </Form.Item>
        <Form.Item
          label="交易金额"
          name="amount"
          rules={[
            { required: true, message: '请输入交易金额' },
            {
              validator: async (_, v) => {
                const n = Number(v);
                if (!v && v !== 0) return;
                if (!(n > 0)) throw new Error('交易金额须大于0');
                if (n > 1000000 || Math.round(n * 100) / 100 !== n) {
                  throw new Error('金额最多2位小数且不超过100万');
                }
              },
            },
          ]}
        >
          <InputNumber style={{ width: '100%' }} min={0.01} max={1000000} step={0.01} placeholder="请输入交易金额" />
        </Form.Item>
        <Form.Item label="交易日期" name="date" rules={[{ required: true, message: '请选择交易日期' }]}>
          <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isAfter(dayjs(), 'day')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

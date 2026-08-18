import { DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';
import { GRADES, SUBJECTS } from '../../types';
import { todayISO } from '../../utils/format';

interface Props {
  open: boolean;
  name: string;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    classDate: string;
    grade: string;
    subject: string;
    attendDate: string;
    amount: number;
  }) => Promise<void>;
}

interface FormShape {
  classDate?: Dayjs | null;
  grade?: string;
  subject?: string;
  attendDate?: Dayjs | null;
  amount?: number | null;
}

export default function AttendModal({ open, name, submitting, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormShape>();
  const classDate = Form.useWatch('classDate', form);
  const grade = Form.useWatch('grade', form);
  const subject = Form.useWatch('subject', form);
  const attendDate = Form.useWatch('attendDate', form);
  const amount = Form.useWatch('amount', form);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      classDate: dayjs(todayISO()),
      grade: undefined,
      subject: undefined,
      attendDate: dayjs(todayISO()),
      amount: undefined,
    });
  }, [open, form]);

  const canSubmit = useMemo(() => {
    const n = Number(amount);
    return Boolean(classDate && grade && subject && attendDate && n > 0 && n <= 1000000);
  }, [classDate, grade, subject, attendDate, amount]);

  return (
    <Modal
      title="考勤"
      open={open}
      onCancel={onCancel}
      onOk={async () => {
        const v = await form.validateFields();
        await onSubmit({
          classDate: v.classDate!.format('YYYY-MM-DD'),
          grade: v.grade!,
          subject: v.subject!,
          attendDate: v.attendDate!.format('YYYY-MM-DD'),
          amount: Number(v.amount),
        });
      }}
      okText="立即考勤"
      cancelText="暂不考勤"
      confirmLoading={submitting}
      okButtonProps={{ disabled: !canSubmit }}
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item label="学员姓名">
          <Input value={name} disabled />
        </Form.Item>
        <Form.Item label="上课日期" name="classDate" rules={[{ required: true, message: '请选择上课日期' }]}>
          <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isAfter(dayjs(), 'day')} />
        </Form.Item>
        <Form.Item label="课程年级" name="grade" rules={[{ required: true, message: '请选择课程年级' }]}>
          <Select placeholder="请选择课程年级" options={GRADES.map((g) => ({ value: g, label: g }))} />
        </Form.Item>
        <Form.Item label="科目" name="subject" rules={[{ required: true, message: '请选择科目' }]}>
          <Select placeholder="请选择科目" options={SUBJECTS.map((s) => ({ value: s, label: s }))} />
        </Form.Item>
        <Form.Item label="考勤日期" name="attendDate" rules={[{ required: true, message: '请选择考勤日期' }]}>
          <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isAfter(dayjs(), 'day')} />
        </Form.Item>
        <Form.Item
          label="课耗金额"
          name="amount"
          rules={[
            { required: true, message: '请输入课耗金额' },
            {
              validator: async (_, v) => {
                const n = Number(v);
                if (!v && v !== 0) return;
                if (!(n > 0)) throw new Error('课耗金额须大于0');
                if (n > 1000000 || Math.round(n * 100) / 100 !== n) {
                  throw new Error('金额最多2位小数且不超过100万');
                }
              },
            },
          ]}
        >
          <InputNumber style={{ width: '100%' }} min={0.01} max={1000000} step={0.01} placeholder="请输入课耗金额" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

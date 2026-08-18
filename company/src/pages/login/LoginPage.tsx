import { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { loginCompany } from '../../services/auth';
import '../../layouts/CompanyLayout.css';

interface LoginForm {
  company: string;
  account: string;
  password: string;
}

export default function LoginPage() {
  const [form] = Form.useForm<LoginForm>();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async () => {
    const company = form.getFieldValue('company') ?? '';
    const account = form.getFieldValue('account') ?? '';
    const password = form.getFieldValue('password') ?? '';
    if (!company) {
      form.setFields([{ name: 'company', errors: ['请输入公司名称'] }]);
      return;
    }
    if (!account) {
      form.setFields([{ name: 'account', errors: ['请输入账号'] }]);
      return;
    }
    if (!password) {
      form.setFields([{ name: 'password', errors: ['请输入密码'] }]);
      return;
    }
    setLoading(true);
    const result = await loginCompany({ company, account, password });
    setLoading(false);
    if (!result.ok) {
      if (result.field) form.setFields([{ name: result.field, errors: [result.message] }]);
      else message.error(result.message);
      return;
    }
    login(result.company);
    message.success('登录成功');
    navigate('/profile', { replace: true });
  };

  return (
    <div className="login-shell">
      <header className="login-header">公司端登录</header>
      <div className="login-page">
        <div className="login-card">
          <h2>登录</h2>
          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
            initialValues={{
              company: '快乐智豪厦门文化有限公司',
              account: 'ZH01',
              password: '625777',
            }}
            onFinish={onFinish}
          >
            <Form.Item label="公司" name="company" rules={[{ required: true, message: '请输入公司名称' }]}>
              <Input placeholder="请输入公司名称" autoComplete="off" />
            </Form.Item>
            <Form.Item label="账号" name="account" rules={[{ required: true, message: '请输入账号' }]}>
              <Input maxLength={20} placeholder="请输入账号" autoComplete="off" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="请输入密码" autoComplete="new-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              登 录
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}

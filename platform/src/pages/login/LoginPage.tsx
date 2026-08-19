import { useCallback, useEffect, useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { fetchCaptcha, loginAdmin } from '../../services/auth';
import { ApiError } from '../../services/http';
import '../../layouts/AdminLayout.css';

interface LoginForm {
  username: string;
  password: string;
  captchaCode: string;
}

export default function LoginPage() {
  const [form] = Form.useForm<LoginForm>();
  const [loading, setLoading] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSrc, setCaptchaSrc] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const refreshCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    try {
      const data = await fetchCaptcha();
      setCaptchaId(data.captchaId);
      setCaptchaSrc(data.imageSrc);
      form.setFieldsValue({ captchaCode: '' });
    } catch {
      /* 错误由 request 统一 toast */
    } finally {
      setCaptchaLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void refreshCaptcha();
    // 仅进入登录页时拉一次；点击图片 / 登录失败再刷新
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 避免 form 引用变化导致重复请求
  }, []);

  const onFinish = async () => {
    const username = (form.getFieldValue('username') ?? '').trim();
    const password = form.getFieldValue('password') ?? '';
    const captchaCode = (form.getFieldValue('captchaCode') ?? '').trim();
    if (!username) {
      form.setFields([{ name: 'username', errors: ['请输入账号'] }]);
      return;
    }
    if (!password) {
      form.setFields([{ name: 'password', errors: ['请输入密码'] }]);
      return;
    }
    if (!captchaCode) {
      form.setFields([{ name: 'captchaCode', errors: ['请输入验证码'] }]);
      return;
    }
    setLoading(true);
    try {
      const result = await loginAdmin({
        username,
        password,
        captchaId,
        captchaCode,
      });
      login(result.token);
      message.success('登录成功');
      navigate('/companies', { replace: true });
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 0)) {
        void refreshCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <header className="login-header">管理端登录</header>
      <div className="login-page">
        <div className="login-card">
          <h2>登录</h2>
          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
            initialValues={{ username: 'admin', password: 'admin123' }}
            onFinish={onFinish}
          >
            <Form.Item label="账号" name="username" rules={[{ required: true, message: '请输入账号' }]}>
              <Input maxLength={20} placeholder="请输入账号" autoComplete="off" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="请输入密码" autoComplete="new-password" />
            </Form.Item>
            <Form.Item label="验证码" required>
              <div className="login-captcha">
                <Form.Item
                  name="captchaCode"
                  noStyle
                  rules={[{ required: true, message: '请输入验证码' }]}
                >
                  <Input maxLength={4} placeholder="请输入验证码" autoComplete="off" />
                </Form.Item>
                {captchaSrc ? (
                  <img
                    className="login-captcha__img"
                    src={captchaSrc}
                    alt="验证码"
                    title="点击刷新验证码"
                    onClick={() => void refreshCaptcha()}
                  />
                ) : (
                  <button
                    type="button"
                    className="login-captcha__img login-captcha__img--placeholder"
                    onClick={() => void refreshCaptcha()}
                  >
                    {captchaLoading ? '加载中' : '点击获取'}
                  </button>
                )}
              </div>
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

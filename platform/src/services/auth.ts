import { requestJson } from './http';
import type { LoginPayload } from '../types';

export interface CaptchaData {
  captchaId: string;
  imageSrc: string;
}

interface CaptchaResponse {
  captchaId: string;
  imageBase64: string;
}

interface LoginResponse {
  token: string;
  role: string;
  id: number;
  name: string;
  taxNo?: string;
}

function toImageSrc(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('data:')) return raw;
  return `data:image/png;base64,${raw}`;
}

export async function fetchCaptcha(): Promise<CaptchaData> {
  const data = await requestJson<CaptchaResponse>('/api/auth/captcha', { skipAuth: true });
  return {
    captchaId: data.captchaId,
    imageSrc: toImageSrc(data.imageBase64),
  };
}

export async function loginAdmin(payload: LoginPayload): Promise<LoginResponse> {
  return requestJson<LoginResponse>('/api/auth/admin/login', {
    method: 'POST',
    skipAuth: true,
    json: payload,
  });
}

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

/** 开发环境 StrictMode 会连续触发两次 effect，合并为一次进行中的请求 */
let inflightCaptcha: Promise<CaptchaData> | null = null;

export async function fetchCaptcha(): Promise<CaptchaData> {
  if (!inflightCaptcha) {
    inflightCaptcha = requestJson<CaptchaResponse>('/api/auth/captcha', { skipAuth: true })
      .then((data) => ({
        captchaId: data.captchaId,
        imageSrc: toImageSrc(data.imageBase64),
      }))
      .finally(() => {
        inflightCaptcha = null;
      });
  }
  return inflightCaptcha;
}

export async function loginAdmin(payload: LoginPayload): Promise<LoginResponse> {
  return requestJson<LoginResponse>('/api/auth/admin/login', {
    method: 'POST',
    skipAuth: true,
    json: payload,
  });
}

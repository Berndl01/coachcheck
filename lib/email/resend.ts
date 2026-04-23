import { Resend } from 'resend';

export function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not set');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export const FROM_EMAIL = 'Humatrix Coach <noreply@humatrix.cc>';

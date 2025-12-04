// src/api/checkAuth.ts
import api from './client';

export async function checkAuth(): Promise<boolean> {
  try {
    await api.get('/auth/user/');
    return true;
  } catch {
    return false;
  }
}
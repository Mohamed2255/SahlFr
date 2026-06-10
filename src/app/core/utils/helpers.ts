import { ApiError } from '../models';

export function getApiErrorMessage(error: unknown, fallback = 'حدث خطأ غير متوقع'): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const apiError = (error as { error: ApiError }).error;
    return apiError?.message ?? apiError?.Message ?? fallback;
  }

  return fallback;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2
  }).format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

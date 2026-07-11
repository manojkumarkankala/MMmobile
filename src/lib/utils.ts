export const inr = (n: number): string =>
  '₹' + Math.round(n).toLocaleString('en-IN');

export const inrCompact = (n: number): string => {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return '₹' + Math.round(n);
};

export const discountPercent = (mrp: number, price: number): number => {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

export const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const initials = (name: string): string =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'U';

/** Delivery charge calculator per MMMobiles rules */
export function deliveryCharge(distanceKm: number): number {
  if (distanceKm <= 3) return 30;
  if (distanceKm <= 5) return 30 + Math.ceil(distanceKm - 3) * 9;
  if (distanceKm <= 10) return 30 + 2 * 9 + Math.ceil(distanceKm - 5) * 12;
  return 30 + 2 * 9 + 5 * 12 + Math.ceil(distanceKm - 10) * 15;
}

export function genOrderNumber(): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MM${y}${(d.getMonth() + 1).toString().padStart(2, '0')}${rand}`;
}

export function genOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

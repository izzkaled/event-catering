export type ImageKind = 'package_cover' | 'service'

export const IMAGE_SPECS: Record<
  ImageKind,
  { width: number; height: number; maxBytes: number; ar: string; en: string }
> = {
  package_cover: {
    width: 1600,
    height: 1000,
    maxBytes: 2.5 * 1024 * 1024,
    ar: 'غلاف الباقة: 1600×1000 بكسل (نسبة 16:10)، JPG أو WebP أو PNG، حد أقصى 2.5 ميجا',
    en: 'Package cover: 1600×1000 px (16:10), JPG/WebP/PNG, max 2.5 MB',
  },
  service: {
    width: 1200,
    height: 900,
    maxBytes: 2 * 1024 * 1024,
    ar: 'صورة الخدمة: 1200×900 بكسل (نسبة 4:3)، JPG أو WebP أو PNG، حد أقصى 2 ميجا',
    en: 'Service image: 1200×900 px (4:3), JPG/WebP/PNG, max 2 MB',
  },
}

export const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

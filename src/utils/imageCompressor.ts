/**
 * Utility to process, compress and convert user uploaded vehicle/machinery photos.
 * Ensures fast client-side compression to prevent exceeding browser localStorage quota
 * while preserving high fidelity for vehicle inspection and details.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/jpeg' | 'image/webp';
}

/**
 * Compresses an image File or Blob using an offscreen HTMLCanvas.
 * Returns a lightweight base64 Data URL string suitable for direct display and storage.
 */
export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 900,
    quality = 0.82,
    format = 'image/jpeg',
  } = options;

  // If running in a Node.js test environment without DOM / FileReader
  if (typeof window === 'undefined' || typeof FileReader === 'undefined' || typeof document === 'undefined') {
    if (typeof (file as any).arrayBuffer === 'function') {
      const arrayBuf = await (file as any).arrayBuffer();
      const base64 = Buffer.from(arrayBuf).toString('base64');
      return `data:${file.type || 'image/jpeg'};base64,${base64}`;
    }
    return 'data:image/jpeg;base64,mock';
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));

    reader.onload = (readerEvent) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('فشل معالجة أبعاد الصورة'));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original read if canvas 2D fails
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed Data URL
        const compressedDataUrl = canvas.toDataURL(format, quality);
        resolve(compressedDataUrl);
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Preset photo suggestions of common machinery and vehicles in As-Suwayda and Al-Kafr
 */
export const POPULAR_VEHICLE_PHOTO_PRESETS = [
  {
    title: 'جرار زراعي بيلاروس 820 (Belarus)',
    category: 'tractors',
    url: 'https://images.unsplash.com/photo-1592860956372-16e45c083c71?auto=format&fit=crop&w=800&q=80',
    description: 'جرار كابين زراعي أزرق/أحمر مجهز للحقول',
  },
  {
    title: 'حفارة كوماتسو مجنزرة (Komatsu)',
    category: 'excavators',
    url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
    description: 'حفارة ثقيلة مع ذراع هيدروليكي للمشاريع والمقالع',
  },
  {
    title: 'شاحنة مرسيدس قلاب (Actros/Tipper)',
    category: 'trucks',
    url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
    description: 'شاحنة لنقل الرمل والحصى ومواد البناء',
  },
  {
    title: 'بيك آب تويوتا هايلوكس (Hilux 4x4)',
    category: 'cars',
    url: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80',
    description: 'سيارة حقلية دفع رباعي ممتازة لطرق الجبل والكروم',
  },
];

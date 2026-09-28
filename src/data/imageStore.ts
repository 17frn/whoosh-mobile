import { openDB } from 'idb';

const DB_NAME = 'timeline-images-db';
const STORE_NAME = 'images';

// Inisialisasi IndexedDB
const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  },
});

/**
 * Menyimpan Base64 resolusi tinggi ke IndexedDB
 * @param id ID unik untuk gambar (misal: 'local_12345')
 * @param base64Data Data Base64 gambar resolusi tinggi
 */
export async function saveLocalImage(id: string, base64Data: string): Promise<void> {
  const db = await dbPromise;
  await db.put(STORE_NAME, base64Data, id);
}

/**
 * Mengambil Base64 resolusi tinggi dari IndexedDB
 * @param id ID unik gambar
 * @returns Data Base64 atau undefined jika tidak ditemukan
 */
export async function getLocalImage(id: string): Promise<string | undefined> {
  const db = await dbPromise;
  return await db.get(STORE_NAME, id);
}

/**
 * Helper untuk mengompres gambar (Canvas) dengan dua tingkat resolusi
 * @param file Objek File dari input
 * @returns Promise berisi { highRes: string, lowRes: string }
 */
export async function compressImage(file: File): Promise<{ highRes: string; lowRes: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No Canvas Context');

        // Fungsi internal untuk scale & convert ke base64 JPEG
        const resizeAndConvert = (maxDim: number, quality: number) => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          // Selalu kompres ke JPEG agar lebih ringan (bahkan untuk local high-res)
          return canvas.toDataURL('image/jpeg', quality);
        };

        // 1. High-Res untuk IndexedDB Lokal (Max 1920px, Quality 85%)
        const highRes = resizeAndConvert(1920, 0.85);
        
        // 2. Low-Res untuk Supabase Cloud Sync (Max 600px, Quality 60%)
        // Supabase string harus di bawah 1MB idealnya, 600px jpeg quality 60% biasanya hanya 30KB - 80KB.
        const lowRes = resizeAndConvert(600, 0.6);

        resolve({ highRes, lowRes });
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

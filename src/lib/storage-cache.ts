/**
 * Bộ lưu trữ dữ liệu an toàn & Bộ nhớ đệm Client (IndexedDB & LocalStorage Safe-Wrapper)
 * Tuân thủ triết lý Ponytail: 0 dependencies ngoài, bảo vệ 100% chống lỗi QuotaExceededError.
 */

const DB_NAME = "artprogress_client_db";
const DB_VERSION = 1;
const STORE_NAME = "artprogress_store";

function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("[IndexedDB] Không thể mở IndexedDB:", request.error);
        resolve(null);
      };
    } catch (e) {
      console.warn("[IndexedDB] Lỗi khởi tạo:", e);
      resolve(null);
    }
  });
}

/**
 * Đọc dữ liệu từ IndexedDB (dung lượng lớn: hàng trăm MB không bị giới hạn 5MB của localStorage)
 */
export async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openIndexedDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => {
        console.warn(`[IndexedDB] Lỗi đọc key="${key}":`, req.error);
        resolve(null);
      };
    } catch (e) {
      console.warn(`[IndexedDB] Exception đọc key="${key}":`, e);
      resolve(null);
    }
  });
}

/**
 * Ghi dữ liệu vào IndexedDB an toàn, bất đồng bộ, không bao giờ chặn UI thread hay gây tràn Quota 5MB
 */
export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  const db = await openIndexedDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => {
        console.warn(`[IndexedDB] Lỗi ghi key="${key}":`, req.error);
        resolve(false);
      };
    } catch (e) {
      console.warn(`[IndexedDB] Exception ghi key="${key}":`, e);
      resolve(false);
    }
  });
}

/**
 * Xóa một key trong IndexedDB
 */
export async function idbDelete(key: string): Promise<boolean> {
  const db = await openIndexedDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Wrapper an toàn cho localStorage.setItem:
 * Bắt 100% ngoại lệ (bao gồm QuotaExceededError, SecurityError trong Incognito)
 * Ngăn chặn tuyệt đối tình trạng crash toàn trang ("This page couldn't load").
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: unknown) {
    const errorName = (err as Error)?.name || "UnknownError";
    console.warn(`[Storage] Không thể ghi key="${key}" vào localStorage (${errorName})`);

    // Nếu gặp QuotaExceededError, chủ động dọn dẹp các cache key khổng lồ
    if (errorName === "QuotaExceededError" || errorName === "NS_ERROR_DOM_QUOTA_REACHED") {
      try {
        localStorage.removeItem("artprogress_artworks");
      } catch {}
    }
    return false;
  }
}

/**
 * Wrapper an toàn cho localStorage.getItem
 */
export function safeLocalStorageGet(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[Storage] Lỗi đọc key="${key}" từ localStorage:`, err);
    return null;
  }
}

/**
 * Wrapper an toàn cho localStorage.removeItem
 */
export function safeLocalStorageRemove(key: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch {}
}

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { Artwork, Topic, Student } from "@/types/artprogress";
import { INITIAL_ARTWORKS, INITIAL_TOPICS, INITIAL_STUDENTS, INITIAL_CLASSES } from "@/lib/mock-data";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const isFirebaseConfigured = Boolean(
  apiKey && !apiKey.includes("DummyKeyForDevelopment")
);

const firebaseConfig = {
  apiKey: apiKey || "AIzaSyDummyKeyForDevelopment123456789",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "artprogress-ai.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "artprogress-ai",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "artprogress-ai.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

// Khởi tạo Firebase App an toàn (Singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 1. Lưu tác phẩm vào Firestore
export async function saveArtworkToFirestore(artwork: Artwork): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const artRef = doc(db, "artworks", artwork.id);
    await setDoc(artRef, artwork, { merge: true });
    return true;
  } catch (err) {
    console.warn("Firestore không sẵn sàng, lưu cục bộ:", err);
    return false;
  }
}

// Xóa tác phẩm khỏi Firestore
export async function deleteArtworkFromFirestore(artworkId: string): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const artRef = doc(db, "artworks", artworkId);
    await deleteDoc(artRef);
    return true;
  } catch (err) {
    console.warn("Không thể xóa tác phẩm trên Firestore:", err);
    return false;
  }
}

// 2. Tải danh sách tác phẩm từ Firestore
export async function fetchArtworksFromFirestore(): Promise<Artwork[] | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const q = query(collection(db, "artworks"), orderBy("submittedAt", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs.map((d) => d.data() as Artwork);
  } catch (err) {
    console.warn("Không thể tải artworks từ Firestore:", err);
    return null;
  }
}

// 3. Lưu chủ đề vào Firestore
export async function saveTopicToFirestore(topic: Topic): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const topicRef = doc(db, "topics", topic.id);
    await setDoc(topicRef, topic, { merge: true });
    return true;
  } catch (err) {
    console.warn("Không thể lưu topic vào Firestore:", err);
    return false;
  }
}

// 3b. Xóa chủ đề khỏi Firestore
export async function deleteTopicFromFirestore(topicId: string): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const topicRef = doc(db, "topics", topicId);
    await deleteDoc(topicRef);
    return true;
  } catch (err) {
    console.warn("Không thể xóa topic trên Firestore:", err);
    return false;
  }
}

// 4. Tải danh sách chủ đề từ Firestore
export async function fetchTopicsFromFirestore(): Promise<Topic[] | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const snap = await getDocs(collection(db, "topics"));
    if (snap.empty) return null;
    return snap.docs.map((d) => d.data() as Topic);
  } catch (err) {
    console.warn("Không thể tải topics từ Firestore:", err);
    return null;
  }
}

// 4b. Quản lý danh sách học sinh trên Firestore
export async function fetchStudentsFromFirestore(): Promise<Student[] | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const snap = await getDocs(collection(db, "students"));
    if (snap.empty) return null;
    return snap.docs.map((d) => d.data() as Student);
  } catch (err) {
    console.warn("Không thể tải students từ Firestore:", err);
    return null;
  }
}

export async function saveStudentToFirestore(student: Student): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const sRef = doc(db, "students", student.id);
    await setDoc(sRef, student, { merge: true });
    return true;
  } catch (err) {
    console.warn("Không thể lưu student vào Firestore:", err);
    return false;
  }
}

export async function deleteStudentFromFirestore(studentId: string): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    const sRef = doc(db, "students", studentId);
    await deleteDoc(sRef);
    return true;
  } catch (err) {
    console.warn("Không thể xóa student khỏi Firestore:", err);
    return false;
  }
}

// 5. Tải ảnh lên Firebase Storage (Mặc định dùng trực tiếp Base64 khi chưa mở gói Storage)
export async function uploadArtworkImageToStorage(
  base64Data: string,
  path: string
): Promise<string | null> {
  // Mặc định sử dụng Base64 an toàn, không phụ thuộc vào Firebase Storage
  if (process.env.NEXT_PUBLIC_ENABLE_FIREBASE_STORAGE !== "true") {
    return null;
  }
  if (!isFirebaseConfigured) return null;
  try {
    const uploadPromise = (async () => {
      const storageRef = ref(storage, path);
      await uploadString(storageRef, base64Data, "data_url");
      return await getDownloadURL(storageRef);
    })();

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => {
        console.warn("Firebase Storage chưa kích hoạt hoặc phản hồi chậm. Tự động chuyển về Base64.");
        resolve(null);
      }, 2500)
    );

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (err) {
    console.warn("Không thể tải ảnh lên Storage, chuyển sang Base64:", err);
    return null;
  }
}

// 6. KHỞI TẠO DỮ LIỆU MẪU LỚP HỌC (ONE-CLICK SEEDER CHO GIÁO VIÊN - Q6)
export async function seedFirestoreWithSampleData(): Promise<{ success: boolean; count: number }> {
  if (!isFirebaseConfigured) {
    return { success: false, count: 0 };
  }

  try {
    let count = 0;

    // Seed Classes
    for (const c of INITIAL_CLASSES) {
      await setDoc(doc(db, "classes", c.id), c);
      count++;
    }

    // Seed Students
    for (const s of INITIAL_STUDENTS) {
      await setDoc(doc(db, "students", s.id), s);
      count++;
    }

    // Seed Topics
    for (const t of INITIAL_TOPICS) {
      await setDoc(doc(db, "topics", t.id), t);
      count++;
    }

    // Seed Artworks
    for (const a of INITIAL_ARTWORKS) {
      await setDoc(doc(db, "artworks", a.id), a);
      count++;
    }

    return { success: true, count };
  } catch (err) {
    console.error("Lỗi khi seed dữ liệu mẫu lên Firestore:", err);
    return { success: false, count: 0 };
  }
}

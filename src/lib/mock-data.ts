import { Topic, Student, ClassRoom, Artwork } from "@/types/artprogress";

// 4 KHỐI (6, 7, 8, 9) - MỖI KHỐI 4 LỚP (TỔNG 16 LỚP THCS)
export const INITIAL_CLASSES: ClassRoom[] = [
  // Khối 6
  { id: "class_6a1", name: "Lớp 6A1", grade: 6, schoolYear: "2025-2026", studentCount: 0 },
  { id: "class_6a2", name: "Lớp 6A2", grade: 6, schoolYear: "2025-2026", studentCount: 0 },
  { id: "class_6a3", name: "Lớp 6A3", grade: 6, schoolYear: "2025-2026", studentCount: 0 },
  { id: "class_6a4", name: "Lớp 6A4", grade: 6, schoolYear: "2025-2026", studentCount: 0 },

  // Khối 7
  { id: "class_7a1", name: "Lớp 7A1", grade: 7, schoolYear: "2025-2026", studentCount: 0 },
  { id: "class_7a2", name: "Lớp 7A2", grade: 7, schoolYear: "2025-2026", studentCount: 0 },
  { id: "class_7a3", name: "Lớp 7A3", grade: 7, schoolYear: "2025-2026", studentCount: 0 },
  { id: "class_7a4", name: "Lớp 7A4", grade: 7, schoolYear: "2025-2026", studentCount: 0 },

  // Khối 8
  { id: "class_8a1", name: "Lớp 8A1", grade: 8, schoolYear: "2025-2026", studentCount: 0 },
  { id: "class_8a2", name: "Lớp 8A2", grade: 8, schoolYear: "2025-2026", studentCount: 0 },
  { id: "class_8a3", name: "Lớp 8A3", grade: 8, schoolYear: "2025-2026", studentCount: 0 },
  { id: "class_8a4", name: "Lớp 8A4", grade: 8, schoolYear: "2025-2026", studentCount: 0 },

  // Khối 9
  { id: "class_9a1", name: "Lớp 9A1", grade: 9, schoolYear: "2025-2026", studentCount: 0 },
  { id: "class_9a2", name: "Lớp 9A2", grade: 9, schoolYear: "2025-2026", studentCount: 0 },
  { id: "class_9a3", name: "Lớp 9A3", grade: 9, schoolYear: "2025-2026", studentCount: 0 },
  { id: "class_9a4", name: "Lớp 9A4", grade: 9, schoolYear: "2025-2026", studentCount: 0 },
];

export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_TOPICS: Topic[] = [];
export const INITIAL_ARTWORKS: Artwork[] = [];

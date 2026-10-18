export interface Student {
  id: string; // mã học sinh (vd: "HS01")
  name: string;
  classId: string;
  avatarUrl?: string;
}

export interface ClassRoom {
  id: string;
  name: string; // vd: "Lớp 7A1"
  grade: number; // 6, 7, 8, 9
  schoolYear: string; // "2025-2026"
  studentCount: number;
}

export interface RubricCriterion {
  id: string;
  name: string; // Tên tiêu chí: Bố cục, Đường nét, Màu sắc, Sáng tạo
  description: string; // Yêu cầu cần đạt
  weight: number; // Tỷ trọng hoặc thang điểm tham khảo
}

export interface Topic {
  id: string;
  grade: number; // Khối 6, 7, 8, 9
  classId?: string; // Tùy chọn gán riêng cho một lớp cụ thể
  title: string; // Tên bài học / chủ đề: "Vẽ tranh đề tài Quê hương em"
  description: string;
  requirements: string[];
  rubric: RubricCriterion[];
  createdAt: string;
  dueDate?: string;
  isActive: boolean;
}

export type FeedbackStatus = "pending_moderation" | "approved" | "rejected";

export interface CriterionFeedback {
  criterionId: string;
  criterionName: string;
  strength: string; // Điểm nổi bật
  improvement: string; // Điều cần cải thiện
  level: "Chưa đạt" | "Đạt" | "Tốt" | "Xuất sắc";
}

export interface ArtworkFeedback {
  status: FeedbackStatus;
  criteriaReviews: CriterionFeedback[];
  overallStrength: string; // Tổng kết điểm mạnh
  actionableNextSteps: string[]; // Các bước hành động cụ thể học sinh nên làm tiếp theo
  referenceScore?: number; // Điểm tham khảo (thang 10)
  teacherNotes?: string; // Lời nhắn hoặc chỉnh sửa bổ sung của giáo viên
  reviewedAt?: string;
  reviewedBy?: string; // Tên giáo viên
}

export interface Artwork {
  id: string;
  topicId: string;
  studentId: string;
  studentName: string;
  classId: string;
  title: string;
  description?: string;
  initialImageUrl: string; // Bản đầu
  revisedImageUrl?: string; // Bản chỉnh sửa
  submittedAt: string;
  revisedAt?: string;
  feedback?: ArtworkFeedback; // Nhận xét (sau khi giáo viên duyệt mới gửi tới HS)
  isPublic: boolean; // Chỉ true khi giáo viên chọn lọc đưa vào Phòng Triển Lãm
  selfReflection?: {
    reflectionText: string;
    learningPoints?: string;
    updatedAt: string;
  };
}


import { analyzeArtworkWithGemini } from "@/lib/gemini";
import { INITIAL_TOPICS } from "@/lib/mock-data";
import { Artwork, RubricCriterion } from "@/types/artprogress";

/**
 * Server Action xử lý nộp tác phẩm mới và tự động sinh bản nháp từ AI dựa trên Rubric bài học
 */
export async function submitArtworkAction(formData: {
  topicId: string;
  studentId: string;
  studentName: string;
  classId: string;
  title: string;
  description: string;
  imageBase64: string;
  isRevision?: boolean;
  artworkId?: string;
  topicTitle?: string;
  rubric?: RubricCriterion[];
  grade?: number;
  className?: string;
}): Promise<{ success: boolean; artwork?: Artwork; error?: string }> {
  try {
    const DEFAULT_RUBRIC: RubricCriterion[] = [
      { id: "crit_comp", name: "Bố cục & Tỷ lệ", description: "Bố cục rõ ràng, mảng chính phụ cân đối", weight: 25 },
      { id: "crit_lines", name: "Đường nét & Hình khối", description: "Đường nét chắc chắn, hình khối sinh động", weight: 25 },
      { id: "crit_color", name: "Màu sắc & Đậm nhạt", description: "Màu sắc hài hòa, có độ đậm nhạt thể hiện chiều sâu", weight: 30 },
      { id: "crit_creat", name: "Sáng tạo & Thông điệp", description: "Có dấu ấn sáng tạo cá nhân, giàu cảm xúc", weight: 20 },
    ];
    const topic = INITIAL_TOPICS.find((t) => t.id === formData.topicId);
    const rubricToUse = formData.rubric && formData.rubric.length > 0 ? formData.rubric : (topic?.rubric || DEFAULT_RUBRIC);
    const titleToUse = formData.topicTitle || topic?.title || "Bài thực hành Mĩ thuật";

    // Gọi Gemini Vision phân tích ảnh dựa trên rubric và năng lực lứa tuổi khối lớp
    const draftFeedback = await analyzeArtworkWithGemini(
      formData.imageBase64,
      "image/jpeg",
      rubricToUse,
      titleToUse,
      formData.title,
      formData.grade,
      formData.className
    );

    const now = new Date().toISOString();

    const newArtwork: Artwork = {
      id: formData.artworkId || `art_${Date.now()}`,
      topicId: formData.topicId,
      studentId: formData.studentId,
      studentName: formData.studentName,
      classId: formData.classId,
      title: formData.title,
      description: formData.description,
      initialImageUrl: formData.imageBase64,
      submittedAt: now,
      feedback: draftFeedback, // Trạng thái "pending_moderation"
      isPublic: false, // Mặc định riêng tư theo yêu cầu an toàn
    };

    return { success: true, artwork: newArtwork };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    return { success: false, error: message };
  }
}

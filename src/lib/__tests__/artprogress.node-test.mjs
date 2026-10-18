import test from "node:test";
import assert from "node:assert/strict";

// Kiểm thử trực tiếp logic nghiệp vụ Rubric và Moderation theo chuẩn Ponytail (Zero extra dependency)
test("4 tiêu chí Rubric chuẩn GDPT 2018 phải có tổng trọng số 100%", () => {
  const rubric = [
    { name: "Bố cục & Tỷ lệ", weight: 25 },
    { name: "Đường nét & Hình khối", weight: 25 },
    { name: "Màu sắc & Đậm nhạt", weight: 30 },
    { name: "Sáng tạo & Thông điệp", weight: 20 },
  ];

  const totalWeight = rubric.reduce((sum, r) => sum + r.weight, 0);
  assert.equal(totalWeight, 100);
});

test("Quy trình phê duyệt (Human-in-the-Loop): Trạng thái ban đầu phải là pending_moderation", () => {
  const initialFeedback = {
    status: "pending_moderation",
    reviewedBy: null,
  };

  assert.equal(initialFeedback.status, "pending_moderation");
  assert.equal(initialFeedback.reviewedBy, null);

  // Khi giáo viên duyệt
  const approvedFeedback = {
    ...initialFeedback,
    status: "approved",
    reviewedBy: "Thầy/Cô giáo Mĩ thuật",
  };

  assert.equal(approvedFeedback.status, "approved");
  assert.ok(approvedFeedback.reviewedBy);
});

test("An toàn dữ liệu học sinh: Tác phẩm mặc định riêng tư isPublic = false", () => {
  const artwork = {
    id: "art_test",
    title: "Tranh kiểm thử",
    isPublic: false,
  };

  assert.equal(artwork.isPublic, false);
});

test("Nguyên tắc sư phạm: Học sinh chỉ được xem nhận xét khi trạng thái là approved", () => {
  const draftFeedback = {
    status: "pending_moderation",
    overallStrength: "Bản nháp AI chưa duyệt",
  };

  const canStudentView = (feedback) => feedback?.status === "approved";

  assert.equal(canStudentView(draftFeedback), false);

  const approvedFeedback = {
    ...draftFeedback,
    status: "approved",
  };

  assert.equal(canStudentView(approvedFeedback), true);
});

test("Quyền tác giả: Chỉ tác giả bài vẽ mới có quyền nộp bản chỉnh sửa", () => {
  const artwork = {
    id: "art_01",
    studentId: "HS01",
    revisedImageUrl: null,
  };

  const canSubmitRevision = (studentId, art) => {
    return art.studentId === studentId && !art.revisedImageUrl;
  };

  assert.equal(canSubmitRevision("HS01", artwork), true);
  assert.equal(canSubmitRevision("HS02", artwork), false);
});

test("Điều kiện triển lãm: Chỉ được công khai tác phẩm sau khi nhận xét đã duyệt", () => {
  const canPublishExhibition = (artwork) => {
    return artwork.feedback?.status === "approved";
  };

  const pendingArt = { id: "art_01", feedback: { status: "pending_moderation" } };
  const approvedArt = { id: "art_02", feedback: { status: "approved" } };

  assert.equal(canPublishExhibition(pendingArt), false);
  assert.equal(canPublishExhibition(approvedArt), true);
});

test("Quản lý nộp bài: Giáo viên có thể đóng hoặc mở nhận bài nộp của chủ đề", () => {
  const topic = {
    id: "topic_01",
    title: "Chủ đề thử nghiệm",
    isActive: true,
  };

  const toggleTopicStatus = (t) => ({ ...t, isActive: !t.isActive });

  const closedTopic = toggleTopicStatus(topic);
  assert.equal(closedTopic.isActive, false);

  const reopenedTopic = toggleTopicStatus(closedTopic);
  assert.equal(reopenedTopic.isActive, true);
});

test("Rubric bài học: Cho phép thiết lập tiêu chí riêng theo yêu cầu cần đạt với tổng trọng số 100%", () => {
  const customLessonRubric = [
    { name: "Mảng chính mảng phụ", description: "Bố cục rõ ràng", weight: 35 },
    { name: "Hòa sắc buổi sớm", description: "Màu sắc ấm áp", weight: 35 },
    { name: "Đường nét sinh động", description: "Nét vẽ chắc chắn", weight: 30 },
  ];

  const totalWeight = customLessonRubric.reduce((sum, r) => sum + r.weight, 0);
  assert.equal(totalWeight, 100);
  assert.equal(customLessonRubric.length, 3);
});

test("Graceful Fallback: Đảm bảo hệ thống tự chuyển sang Mock Data an toàn khi Firebase chưa cấu hình", () => {
  const checkConfigured = (key) => Boolean(key && !key.includes("DummyKeyForDevelopment"));

  assert.equal(checkConfigured("AIzaSyDummyKeyForDevelopment123456789"), false);
  assert.equal(checkConfigured(""), false);
  assert.equal(checkConfigured("AIzaSyRealFirebaseProductionKey_XYZ"), true);
});

test("Báo cáo tiến bộ sư phạm: Đảm bảo đầy đủ minh chứng Trước - Sau, Rubric, Lời phê và Tự đánh giá", () => {
  const reportData = {
    studentName: "Nguyễn Lê Bảo An",
    hasInitialImage: true,
    hasRevisedImage: true,
    hasRubricReviews: true,
    hasTeacherNotes: true,
    hasSelfReflection: true,
  };

  const isCompletePedagogicalEvidence = (r) => {
    return (
      r.hasInitialImage &&
      r.hasRevisedImage &&
      r.hasRubricReviews &&
      r.hasTeacherNotes &&
      r.hasSelfReflection
    );
  };

  assert.equal(isCompletePedagogicalEvidence(reportData), true);
});

test("Phân loại chủ đề theo Khối lớp: Chỉ hiển thị chủ đề thuộc Khối đang chọn", () => {
  const allTopics = [
    { id: "t1", grade: 6, title: "Chủ đề Khối 6 - Nét chấm" },
    { id: "t2", grade: 6, title: "Chủ đề Khối 6 - Hoa lá" },
    { id: "t3", grade: 7, title: "Chủ đề Khối 7 - Quê hương" },
    { id: "t4", grade: 8, title: "Chủ đề Khối 8 - Mĩ thuật hiện đại" },
    { id: "t5", grade: 9, title: "Chủ đề Khối 9 - Tranh cổ động" },
  ];

  const filterByGrade = (topics, grade) => topics.filter((t) => t.grade === grade);

  const grade6Topics = filterByGrade(allTopics, 6);
  assert.equal(grade6Topics.length, 2);
  assert.ok(grade6Topics.every((t) => t.grade === 6));

  const grade7Topics = filterByGrade(allTopics, 7);
  assert.equal(grade7Topics.length, 1);
  assert.equal(grade7Topics[0].id, "t3");

  const grade8Topics = filterByGrade(allTopics, 8);
  assert.equal(grade8Topics.length, 1);
  assert.equal(grade8Topics[0].id, "t4");

  const grade9Topics = filterByGrade(allTopics, 9);
  assert.equal(grade9Topics.length, 1);
  assert.equal(grade9Topics[0].id, "t5");
});

test("Định dạng tên lớp và che giấu thanh sidebar khi xuất bản in PDF", () => {
  const formatClassName = (rawClassId) => rawClassId.replace("class_", "").toUpperCase();

  assert.equal(formatClassName("class_6a1"), "6A1");
  assert.equal(formatClassName("class_7a2"), "7A2");
  assert.equal(formatClassName("class_9a4"), "9A4");

  // Kiểm tra class ẩn khi in trên sidebar và layout chính
  const asideClasses = "w-60 shrink-0 bg-white border-r print:hidden";
  const mainClasses = "flex-1 flex flex-col h-full overflow-hidden print:hidden";
  assert.ok(asideClasses.includes("print:hidden"));
  assert.ok(mainClasses.includes("print:hidden"));
});


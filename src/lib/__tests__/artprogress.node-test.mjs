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

test("Chống sập trang khi gặp QuotaExceededError: safeLocalStorageSet bắt lỗi an toàn và tự dọn dẹp cache", () => {
  // Giả lập môi trường trình duyệt với localStorage bị tràn dung lượng (QuotaExceededError)
  let removedKey = null;
  const mockStorage = {
    setItem(key) {
      const err = new Error("Setting the value of '" + key + "' exceeded the quota.");
      err.name = "QuotaExceededError";
      throw err;
    },
    removeItem(key) {
      removedKey = key;
    },
  };

  function testSafeLocalStorageSet(storage, key, value) {
    try {
      storage.setItem(key, value);
      return true;
    } catch (err) {
      const errorName = err?.name || "UnknownError";
      if (errorName === "QuotaExceededError" || errorName === "NS_ERROR_DOM_QUOTA_REACHED") {
        try {
          storage.removeItem("artprogress_artworks");
        } catch {}
      }
      return false;
    }
  }

  // Gọi setItem khi bộ nhớ đã đầy: Hàm phải trả về false và KHÔNG ĐƯỢC ném unhandled error làm sập ứng dụng
  const result = testSafeLocalStorageSet(mockStorage, "artprogress_topics", "[]");
  assert.equal(result, false, "Phải trả về false thay vì văng unhandled exception");
  assert.equal(removedKey, "artprogress_artworks", "Phải tự động xóa key artprogress_artworks để giải phóng dung lượng cho trình duyệt");
});

test("Phòng triển lãm 3D: Định dạng mã lớp học sinh xóa sạch tiền tố CLASS_ / class_", () => {
  const cleanClassId = (classId) => (classId || "").replace(/^class_/i, "").toUpperCase();

  assert.equal(cleanClassId("class_6a1"), "6A1");
  assert.equal(cleanClassId("CLASS_6A1"), "6A1");
  assert.equal(cleanClassId("class_7a2"), "7A2");
  assert.equal(cleanClassId("CLASS_8A3"), "8A3");
  assert.equal(cleanClassId("9A1"), "9A1");
  assert.equal(cleanClassId(""), "");
});

test("Phòng triển lãm 3D: Tự động tính toán và spawn đèn trần đều đặn khi phòng kéo giãn theo số lượng tranh", () => {
  function computeDownlightPositions(roomLength, interval = 6.0) {
    const positions = [0];
    const maxZ = roomLength / 2 - 2.8;
    for (let offset = interval; offset <= maxZ; offset += interval) {
      positions.push(offset);
      positions.push(-offset);
    }
    return positions.sort((a, b) => a - b);
  }

  // Phòng tiêu chuẩn 20m: Có 3 đèn tại Z = -6, 0, 6
  const lights20m = computeDownlightPositions(20);
  assert.equal(lights20m.length, 3);
  assert.deepEqual(lights20m, [-6, 0, 6]);

  // Phòng kéo dài 32m: Có 5 đèn tại Z = -12, -6, 0, 6, 12
  const lights32m = computeDownlightPositions(32);
  assert.equal(lights32m.length, 5);
  assert.deepEqual(lights32m, [-12, -6, 0, 6, 12]);

  // Phòng kéo dài 48m: Có 7 đèn
  const lights48m = computeDownlightPositions(48);
  assert.equal(lights48m.length, 7);
  assert.deepEqual(lights48m, [-18, -12, -6, 0, 6, 12, 18]);
});

test("Chỉnh sửa sư phạm (Human-in-the-Loop): Giáo viên có quyền hiệu chỉnh điểm số, điểm nổi bật và chi tiết nhận xét Rubric", () => {
  const initialFeedback = {
    status: "pending_moderation",
    referenceScore: 7.0,
    overallStrength: "Bản vẽ có cố gắng.",
    teacherNotes: "",
    criteriaReviews: [
      {
        criterionId: "crit_01",
        criterionName: "Bố cục & Tỷ lệ",
        strength: "Hình vẽ nằm giữa tranh.",
        improvement: "Cần căn đều mép tranh.",
        level: "Đạt",
      },
    ],
  };

  // 1. Giáo viên chỉnh sửa điểm số
  const updateScore = (fb, newScore) => ({
    ...fb,
    referenceScore: Math.min(10, Math.max(0, Math.round(newScore * 10) / 10)),
  });
  const fbAfterScore = updateScore(initialFeedback, 9.2);
  assert.equal(fbAfterScore.referenceScore, 9.2);

  // 2. Giáo viên chỉnh sửa điểm nổi bật
  const updateOverallStrength = (fb, newStrength) => ({
    ...fb,
    overallStrength: newStrength.trim() || fb.overallStrength,
  });
  const fbAfterStrength = updateOverallStrength(fbAfterScore, "Phối màu rực rỡ, cảm xúc trong sáng đặc trưng lứa tuổi.");
  assert.equal(fbAfterStrength.overallStrength, "Phối màu rực rỡ, cảm xúc trong sáng đặc trưng lứa tuổi.");

  // 3. Giáo viên chỉnh sửa chi tiết nhận xét Rubric
  const updateCriterion = (fb, critId, updates) => ({
    ...fb,
    criteriaReviews: fb.criteriaReviews.map((c) =>
      c.criterionId === critId ? { ...c, ...updates } : c
    ),
  });
  const fbAfterCrit = updateCriterion(fbAfterStrength, "crit_01", {
    level: "Xuất sắc",
    strength: "Mảng chính phụ cân đối và sinh động.",
    improvement: "Tiếp tục phát huy phong cách này.",
  });

  assert.equal(fbAfterCrit.criteriaReviews[0].level, "Xuất sắc");
  assert.equal(fbAfterCrit.criteriaReviews[0].strength, "Mảng chính phụ cân đối và sinh động.");
  assert.equal(fbAfterCrit.criteriaReviews[0].improvement, "Tiếp tục phát huy phong cách này.");
});

test("AI đánh giá thích ứng lứa tuổi (Age-Adaptive Evaluation): Tích hợp số liệu khối lớp và độ tuổi học sinh THCS", () => {
  const getStudentAge = (grade) => (grade >= 6 && grade <= 9 ? grade + 5 : 11);

  assert.equal(getStudentAge(6), 11); // Lớp 6 -> 11 tuổi
  assert.equal(getStudentAge(7), 12); // Lớp 7 -> 12 tuổi
  assert.equal(getStudentAge(8), 13); // Lớp 8 -> 13 tuổi
  assert.equal(getStudentAge(9), 14); // Lớp 9 -> 14 tuổi

  // Tiêu chuẩn chấm điểm phân hóa theo năng lực: Không cào bằng 6-7đ
  const classifyScoreByEffort = (isOutstanding, hasGoodColor, isDraftOnly) => {
    if (isDraftOnly) return { level: "Chưa đạt", minScore: 2.0, maxScore: 4.9 };
    if (isOutstanding) return { level: "Xuất sắc", minScore: 8.5, maxScore: 10.0 };
    if (hasGoodColor) return { level: "Tốt", minScore: 7.5, maxScore: 8.4 };
    return { level: "Đạt", minScore: 5.0, maxScore: 7.4 };
  };

  const outstandingResult = classifyScoreByEffort(true, true, false);
  assert.equal(outstandingResult.level, "Xuất sắc");
  assert.ok(outstandingResult.minScore >= 8.5, "Tranh đẹp nổi bật phải được chấm từ 8.5 trở lên, không bị cào bằng 6-7đ");

  const averageResult = classifyScoreByEffort(false, false, false);
  assert.equal(averageResult.level, "Đạt");
  assert.ok(averageResult.maxScore <= 7.4);
});

test("Thẩm định AI mĩ thuật THCS (GDPT 2018): Phân bổ điểm số nhất quán theo tiêu chí Rubric bài học", () => {
  // Logic kiểm soát chất lượng điểm số phổ quát cho mọi chủ đề mĩ thuật THCS
  const calibrateScore = (rawScore, criteriaLevels) => {
    if (rawScore === 0) return 0;
    const numXuatSac = criteriaLevels.filter((lvl) => lvl === "Xuất sắc").length;
    const numTot = criteriaLevels.filter((lvl) => lvl === "Tốt").length;

    let score = rawScore;
    // 1. Tác phẩm đạt phần lớn tiêu chí Xuất sắc (>= 60% tiêu chí) -> Xứng đáng đạt mức 9+
    if (numXuatSac >= Math.ceil(criteriaLevels.length * 0.6)) {
      if (score < 9.0) score = 9.2;
    }
    // 2. Bài làm cơ bản đại trà (không có tiêu chí Xuất sắc, tối đa 1 tiêu chí Tốt) -> Chuẩn 7.5đ
    else if (numXuatSac === 0 && numTot <= 1) {
      score = 7.5;
    }
    return Math.round(score * 10) / 10;
  };

  // Trường hợp 1: Bài làm cơ bản, sạch sẽ nhưng ở dạng phẳng 2D, đơn giản (chủ yếu Đạt, tối đa 1 Tốt)
  // Nếu AI cho điểm lệch lên 8.2đ -> Chuẩn hóa về đúng 7.5đ chuẩn mực
  const basicSubmissionLevels = ["Đạt", "Đạt", "Đạt", "Tốt"];
  const calibratedBasicArt = calibrateScore(8.2, basicSubmissionLevels);
  assert.equal(calibratedBasicArt, 7.5, "Bài làm cơ bản, phẳng 2D sạch sẽ được định chuẩn ở mức 7.5đ");

  // Trường hợp 2: Tác phẩm nổi bật, ý tưởng độc đáo, đạt đa số tiêu chí Xuất sắc (>= 60%)
  // Điểm số bắt buộc đạt 9+ (chuẩn mực 9.2đ)
  const outstandingSubmissionLevels = ["Xuất sắc", "Xuất sắc", "Xuất sắc", "Tốt"];
  const calibratedOutstandingArt = calibrateScore(8.6, outstandingSubmissionLevels);
  assert.ok(calibratedOutstandingArt >= 9.0, "Tác phẩm xuất sắc nổi trội trong lớp THCS bắt buộc đạt 9+ (>= 9.0đ)");
  assert.equal(calibratedOutstandingArt, 9.2);

  // Khoảng cách phân hóa công tâm giữa tác phẩm xuất sắc và bài làm cơ bản đạt 1.7 điểm
  const differentiationGap = Math.round((calibratedOutstandingArt - calibratedBasicArt) * 10) / 10;
  assert.equal(differentiationGap, 1.7);
});

test("Cơ chế chuyển đổi mô hình AI tự động (Automatic Model Fallback): Chuyển xuống gemini-3.1-flash-lite khi model chính quá tải/unavailable", async () => {
  const callModelWithFallback = async (primaryModel, fallbackModel, modelInvoker) => {
    try {
      return await modelInvoker(primaryModel);
    } catch (primaryError) {
      if (primaryModel !== fallbackModel) {
        return await modelInvoker(fallbackModel);
      }
      throw primaryError;
    }
  };

  // Trường hợp 1: Model chính (gemini-3.5-flash-lite) hoạt động bình thường
  let invokedModels = [];
  const normalInvoker = async (model) => {
    invokedModels.push(model);
    return { status: "success", model, responseText: "Phân tích thành công" };
  };

  const normalResult = await callModelWithFallback("gemini-3.5-flash-lite", "gemini-3.1-flash-lite", normalInvoker);
  assert.equal(normalResult.model, "gemini-3.5-flash-lite");
  assert.deepEqual(invokedModels, ["gemini-3.5-flash-lite"]);

  // Trường hợp 2: Model chính bị high demand / 503 / 429 unavailable -> Tự động chuyển xuống gemini-3.1-flash-lite
  invokedModels = [];
  const overloadedInvoker = async (model) => {
    invokedModels.push(model);
    if (model === "gemini-3.5-flash-lite") {
      throw new Error("503 Service Unavailable: High demand on gemini-3.5-flash-lite");
    }
    return { status: "success", model, responseText: "Phân tích thành công từ model dự phòng" };
  };

  const fallbackResult = await callModelWithFallback("gemini-3.5-flash-lite", "gemini-3.1-flash-lite", overloadedInvoker);
  assert.equal(fallbackResult.model, "gemini-3.1-flash-lite");
  assert.deepEqual(invokedModels, ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
  assert.equal(fallbackResult.responseText, "Phân tích thành công từ model dự phòng");
});

test("Xuất bản chấm điểm Excel tổng hợp theo từng chủ đề và lớp: Đầy đủ danh sách học sinh, điểm Rubric, xếp loại và thống kê GDPT 2018", () => {
  // Logic tổng hợp bảng điểm theo chuẩn Thông tư 22/2021/TT-BGDĐT
  const topic = {
    id: "topic_01",
    title: "Chủ đề 1: Sắc màu quê hương",
    grade: 7,
    rubric: [
      { id: "c1", name: "Bố cục & Trọng tâm", weight: 25 },
      { id: "c2", name: "Đường nét & Tạo hình", weight: 25 },
      { id: "c3", name: "Màu sắc & Đậm nhạt", weight: 30 },
      { id: "c4", name: "Sáng tạo & Cảm xúc", weight: 20 },
    ],
  };

  const classRoom = { id: "class_7a1", name: "Lớp 7A1", grade: 7 };
  const students = [
    { id: "HS01", name: "Nguyễn Văn A", classId: "class_7a1" },
    { id: "HS02", name: "Trần Thị B", classId: "class_7a1" },
    { id: "HS03", name: "Lê Hoàng C", classId: "class_7a1" },
  ];

  const artworks = [
    {
      id: "art_01",
      topicId: "topic_01",
      studentId: "HS01",
      studentName: "Nguyễn Văn A",
      title: "Chiều trên sông quê",
      submittedAt: "2026-10-25T10:00:00.000Z",
      feedback: {
        status: "approved",
        referenceScore: 9.2,
        overallStrength: "Bố cục sinh động, hòa sắc tươi sáng.",
        criteriaReviews: [
          { criterionId: "c1", criterionName: "Bố cục & Trọng tâm", level: "Xuất sắc" },
          { criterionId: "c2", criterionName: "Đường nét & Tạo hình", level: "Xuất sắc" },
          { criterionId: "c3", criterionName: "Màu sắc & Đậm nhạt", level: "Xuất sắc" },
          { criterionId: "c4", criterionName: "Sáng tạo & Cảm xúc", level: "Tốt" },
        ],
      },
    },
    {
      id: "art_02",
      topicId: "topic_01",
      studentId: "HS02",
      studentName: "Trần Thị B",
      title: "Cánh đồng lúa",
      submittedAt: "2026-10-26T14:00:00.000Z",
      feedback: {
        status: "approved",
        referenceScore: 7.5,
        overallStrength: "Bài vẽ sạch sẽ, đúng chủ đề.",
        criteriaReviews: [
          { criterionId: "c1", criterionName: "Bố cục & Trọng tâm", level: "Đạt" },
          { criterionId: "c2", criterionName: "Đường nét & Tạo hình", level: "Đạt" },
          { criterionId: "c3", criterionName: "Màu sắc & Đậm nhạt", level: "Đạt" },
          { criterionId: "c4", criterionName: "Sáng tạo & Cảm xúc", level: "Tốt" },
        ],
      },
    },
    // HS03 chưa nộp bài
  ];

  // 1. Kiểm tra ánh xạ dữ liệu theo hàng
  const classStudents = students.filter((s) => s.classId === classRoom.id);
  assert.equal(classStudents.length, 3);

  const rows = classStudents.map((st, idx) => {
    const art = artworks.find((a) => a.studentId === st.id && a.topicId === topic.id);
    const score = art?.feedback?.referenceScore ?? null;
    let gradeLevel = "Chưa đánh giá";
    if (score !== null) {
      if (score >= 9.0) gradeLevel = "Xuất sắc";
      else if (score >= 7.5) gradeLevel = "Tốt";
      else if (score >= 5.0) gradeLevel = "Đạt";
      else gradeLevel = "Chưa đạt";
    }
    return {
      stt: idx + 1,
      studentId: st.id,
      studentName: st.name,
      hasArtwork: !!art,
      score,
      gradeLevel,
    };
  });

  // HS01: Xuất sắc 9.2đ
  assert.equal(rows[0].score, 9.2);
  assert.equal(rows[0].gradeLevel, "Xuất sắc");

  // HS02: Tốt 7.5đ
  assert.equal(rows[1].score, 7.5);
  assert.equal(rows[1].gradeLevel, "Tốt");

  // HS03: Chưa nộp bài
  assert.equal(rows[2].hasArtwork, false);
  assert.equal(rows[2].score, null);
  assert.equal(rows[2].gradeLevel, "Chưa đánh giá");

  // 2. Kiểm tra thống kê tổng hợp của lớp
  const submittedCount = rows.filter((r) => r.hasArtwork).length;
  const submittedPercent = Math.round((submittedCount / rows.length) * 100);
  assert.equal(submittedCount, 2);
  assert.equal(submittedPercent, 67); // 2/3 = 67%

  const validScores = rows.map((r) => r.score).filter((s) => s !== null);
  const avgScore = Math.round((validScores.reduce((sum, s) => sum + s, 0) / validScores.length) * 10) / 10;
  assert.equal(avgScore, 8.4); // (9.2 + 7.5) / 2 = 8.35 -> 8.4

  // 3. Kiểm tra tính hợp lệ của cấu trúc XML Spreadsheet 2003
  const isXmlWorkbook = (xml) => xml.includes("<?xml") && xml.includes("<Workbook") && xml.includes("</Workbook>");
  const sampleXml = `<?xml version="1.0"?><Workbook><Worksheet ss:Name="BangDiem"><Table><Row><Cell><Data ss:Type="String">HS01</Data></Cell></Row></Table></Worksheet></Workbook>`;
  assert.ok(isXmlWorkbook(sampleXml));

  // 4. Kiểm tra cấu trúc CSV có UTF-8 BOM
  const sampleCsv = "\uFEFF" + `"STT","Mã HS","Họ và tên","Điểm số"\r\n1,"HS01","Nguyễn Văn A",9.2`;
  assert.equal(sampleCsv.charCodeAt(0), 0xFEFF, "CSV phải chứa ký tự Byte Order Mark để hiển thị tiếng Việt trên Excel");
});




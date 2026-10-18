import { GoogleGenAI } from "@google/genai";
import { RubricCriterion, ArtworkFeedback, CriterionFeedback } from "@/types/artprogress";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

/**
 * Sinh gợi ý nháp (Draft Feedback) phân tích ảnh tác phẩm mĩ thuật THCS dựa trên Rubric bài học.
 * Thẩm định tính hợp lệ của ảnh và đưa ra nhận xét chuyên môn thực tế, chân thực, khoa học.
 */
export async function analyzeArtworkWithGemini(
  imageBase64: string,
  mimeType: string,
  rubric: RubricCriterion[],
  topicTitle: string,
  artworkTitle: string
): Promise<ArtworkFeedback> {
  if (!apiKey) {
    // Trả về bản nháp mẫu sư phạm khi chưa gắn GEMINI_API_KEY để hệ thống vẫn chạy thử nghiệm mượt mà
    return generateFallbackDraftFeedback(rubric, topicTitle, artworkTitle);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const rubricPrompt = rubric
      .map(
        (r, idx) =>
          `${idx + 1}. [ID: "${r.id}"] **${r.name}**: ${r.description} (Trọng số: ${r.weight}%)`
      )
      .join("\n");

    const prompt = `Bạn là Giám khảo & Chuyên gia Sư phạm Mĩ thuật THCS chuyên sâu (Chương trình GDPT 2018).
Nhiệm vụ của bạn là thẩm định hình ảnh và nhận xét bài thực hành mĩ thuật một cách CHÂN THỰC, KHÁCH QUAN, KHOA HỌC và THỰC TẾ.
TUYỆT ĐỐI KHÔNG KHEN SÁO RỖNG, KHÔNG TÂNG BỐC ĐÃI BÔI, KHÔNG XEM ẢNH CHỤP MÀN HÌNH LÀ TRANH NGHỆ THUẬT.

THÔNG TIN BÀI HỌC:
- Chủ đề/Bài học: "${topicTitle}"
- Tên bức tranh: "${artworkTitle}"

DANH SÁCH TIÊU CHÍ RUBRIC ĐÁNH GIÁ:
${rubricPrompt}

QUY TRÌNH THẨM ĐỊNH & ĐÁNH GIÁ BẮT BUỘC THEO 2 BƯỚC:

--- BƯỚC 1: KIỂM TRA TÍNH HỢP LỆ CỦA ẢNH (Image Authenticity Check) ---
Hãy quan sát kĩ bức ảnh được gửi lên:
- Ảnh có phải là một bài thực hành mĩ thuật thực sự (tranh vẽ tay bằng chì, chì màu, sáp dầu, màu dạ, màu nước, màu bột, sơn acrylic, sơn dầu; tranh xé dán; sản phẩm điêu khắc đất nặn hoặc tác phẩm digital painting do học sinh tự vẽ) hay KHÔNG?
- NẾU HÌNH ẢNH LÀ:
  + Ảnh chụp màn hình máy tính / điện thoại (thấy rõ thanh taskbar, icon desktop, cửa sổ trình duyệt, khung chat, giao diện app, code, game...).
  + Ảnh chụp tài liệu văn bản, sách in, trang vở toàn chữ, bảng biểu, ảnh chụp màn hình bài viết mạng xã hội.
  + Ảnh chụp khuôn mặt selfie đời thường, ảnh phong cảnh chụp bằng camera điện thoại (không phải nét vẽ).
  + Ảnh meme, icon tải trên mạng, hoặc ảnh tối đen, mờ nhòe hoàn toàn không nhìn thấy gì.
- KHI ĐÓ, ĐÂY LÀ HÌNH ẢNH KHÔNG HỢP LỆ. BẠN PHẢI TỪ CHỐI CHẤM ĐIỂM VÀ TRẢ VỀ:
  + Với mọi tiêu chí trong "criteriaReviews":
    * "criterionId": Mã ID tương ứng của tiêu chí
    * "criterionName": Tên tiêu chí
    * "strength": "Hình ảnh tải lên không phải là bài vẽ mĩ thuật thực hành."
    * "improvement": "Vui lòng chụp lại ảnh bức tranh vẽ thực tế của em ở nơi đủ ánh sáng và tải lên lại."
    * "level": "Chưa đạt"
  + "overallStrength": "Ảnh tải lên là ảnh chụp màn hình thiết bị hoặc tài liệu/hình ảnh không phải bài vẽ mĩ thuật. Hệ thống không thể chấm điểm mĩ thuật trên ảnh này. Em hãy chụp lại bức tranh vẽ của mình dưới ánh sáng rõ nét để thầy cô và AI đánh giá chính xác nhé!"
  + "actionableNextSteps": [
      "Đặt bức tranh vẽ phẳng trên bàn hoặc giá vẽ ở nơi đủ ánh sáng tự nhiên.",
      "Căn góc máy trực diện, chụp trọn vẹn khổ tranh và tránh để bóng tay hay bóng điện thoại che khuất.",
      "Tải lại ảnh bài vẽ thực tế để nhận nhận xét chuyên môn và điểm tham khảo."
    ]
  + "referenceScore": 0

--- BƯỚC 2: PHÂN TÍCH CHUYÊN MÔN THỰC TẾ & CÔNG TÂM (Nếu là tác phẩm mĩ thuật hợp lệ) ---
Hãy nhận xét đúng với thực tế quan sát được trên tác phẩm:
1. Nhận diện chất liệu & kỹ thuật: Học sinh vẽ bằng chất liệu gì (sáp dầu, chì màu, bút dạ, màu nước, chì đen...)?
2. Bố cục (Composition):
   - Mảng hình chính và mảng phụ đã cân đối trên trang giấy chưa?
   - Có bị quá nhỏ lọt thỏm giữa trang, hay bị lệch hẳn về một góc, hay tràn viền lộn xộn?
3. Đường nét & Hình thể:
   - Nét vẽ chắc chắn, dứt khoát hay run rẩy, nguệch ngoạc?
   - Tỉ lệ hình thể nhân vật, đồ vật, phong cảnh có phù hợp với lứa tuổi THCS không?
4. Màu sắc & Sắc độ (Rất quan trọng):
   - Đã có độ đậm - nhạt (tối - trung gian - sáng) để tạo khối và chiều sâu không gian chưa, hay chỉ tô một lớp bẹt phẳng?
   - Màu tô có mịn đều không, có bị hở nhiều vệt trắng của giấy vẽ không? Có bị lem nhem ra ngoài nét viền không?
   - Hòa sắc nóng/lạnh hay tương phản có phù hợp với nội dung bài học không?
5. Mức độ hoàn thiện & Không gian:
   - Nền tranh (background) đã được xử lý hay còn bỏ trắng trơn?
   - Tranh đã hoàn thiện trọn vẹn hay mới chỉ là bản phác sơ sài?
6. Bám sát chủ đề: Nội dung bức tranh có đúng với chủ đề "${topicTitle}" không?

NGUYÊN TẮC CHO ĐIỂM & ĐÁNH GIÁ (Thang điểm 10):
- "Chưa đạt" (Điểm 1.0 - 4.9): Tranh chưa hoàn thiện, vẽ nguệch ngoạc sơ sài, lem nhem nhiều, bỏ trắng giấy hoặc vẽ lạc đề.
- "Đạt" (Điểm 5.0 - 6.9): Vẽ đúng chủ đề, nhìn rõ hình nhưng kỹ thuật còn vụng về, tô màu bẹt phẳng chưa có chuyển sắc độ sáng tối, nền tranh bỏ trống.
- "Tốt" (Điểm 7.0 - 8.4): Bố cục cân đối, màu sắc hài hòa, có ý thức tạo sáng tối và không gian, bài vẽ sạch sẽ chỉn chu.
- "Xuất sắc" (Điểm 8.5 - 10.0): Kỹ thuật vẽ và hòa sắc nổi bật, chiều sâu không gian tốt, nét vẽ phóng khoáng giàu cảm xúc và sáng tạo độc đáo.
- Lời nhận xét phải thẳng thắn, chân thành, mang tính xây dựng: Chỉ rõ cái chưa được và cách khắc phục; không khen chung chung, không tâng bốc.
- "actionableNextSteps": Phải là 2-3 chỉ dẫn kỹ thuật cực kỳ cụ thể để học sinh có thể cầm bút lên thực hành sửa ngay (ví dụ: "Tô thêm màu xanh lục đậm vào bóng cây để tạo chiều sâu", "Dùng bút dạ đen viền lại nét các nhân vật chính để hình rõ ràng hơn", "Tô kín các khoảng trắng còn sót lại ở góc trên nền tranh").

ĐỊNH DẠNG JSON ĐẦU RA (Chỉ trả về chuỗi JSON thuần, không bọc markdown hay ký tự thừa):
{
  "criteriaReviews": [
    {
      "criterionId": "<ID chính xác từ danh sách rubric>",
      "criterionName": "<Tên tiêu chí>",
      "strength": "<Nhận xét trung thực điểm làm được>",
      "improvement": "<Chỉ rõ điểm hạn chế và hướng dẫn sửa cụ thể>",
      "level": "Chưa đạt" // Chọn đúng một trong: "Chưa đạt", "Đạt", "Tốt", "Xuất sắc"
    }
  ],
  "overallStrength": "<Nhận xét tổng quan khách quan, chỉ rõ ưu điểm thực tế và điểm cần khắc phục lớn nhất>",
  "actionableNextSteps": [
    "<Hành động thực hành cụ thể 1>",
    "<Hành động thực hành cụ thể 2>"
  ],
  "referenceScore": 7.5
}`;

    const modelName = process.env.NEXT_PUBLIC_GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const callPromise = ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
                mimeType: mimeType || "image/jpeg",
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API timeout sau 20 giây")), 20000)
    );

    const response = await Promise.race([callPromise, timeoutPromise]);

    const text = response.text || "";
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleanText);

    // Chuẩn hóa criteriaReviews để đảm bảo khớp đầy đủ các tiêu chí Rubric bài học
    const validLevels = ["Chưa đạt", "Đạt", "Tốt", "Xuất sắc"];
    const normalizedCriteria: CriterionFeedback[] = rubric.map((r) => {
      const found = Array.isArray(parsed.criteriaReviews)
        ? parsed.criteriaReviews.find(
            (c: { criterionId?: string; criterionName?: string }) =>
              c.criterionId === r.id ||
              (c.criterionName && c.criterionName.trim().toLowerCase() === r.name.trim().toLowerCase())
          )
        : null;

      const level =
        found && validLevels.includes(found.level)
          ? (found.level as "Chưa đạt" | "Đạt" | "Tốt" | "Xuất sắc")
          : parsed.referenceScore === 0
          ? "Chưa đạt"
          : "Đạt";

      return {
        criterionId: r.id,
        criterionName: r.name,
        strength:
          found?.strength ||
          (parsed.referenceScore === 0
            ? "Hình ảnh tải lên không phải bài vẽ mĩ thuật thực hành."
            : "Đã hoàn thành phần thực hành tiêu chí này."),
        improvement:
          found?.improvement ||
          (parsed.referenceScore === 0
            ? "Cần chụp ảnh trực diện bài vẽ thực tế để được chấm điểm."
            : "Cần hoàn thiện thêm các chi tiết theo yêu cầu bài học."),
        level,
      };
    });

    const isRejectedImage = parsed.referenceScore === 0;

    return {
      status: "pending_moderation", // BẮT BUỘC: Bản nháp chờ giáo viên duyệt
      criteriaReviews: normalizedCriteria,
      overallStrength:
        parsed.overallStrength ||
        (isRejectedImage
          ? "Ảnh tải lên không phải bài vẽ mĩ thuật. Vui lòng chụp ảnh bài vẽ thực tế và gửi lại."
          : "Bài vẽ bước đầu thể hiện được nội dung chủ đề bài học."),
      actionableNextSteps:
        Array.isArray(parsed.actionableNextSteps) && parsed.actionableNextSteps.length > 0
          ? parsed.actionableNextSteps
          : [
              "Đặt bức tranh vẽ phẳng ở nơi đủ ánh sáng.",
              "Chụp ảnh trực diện toàn bộ bức tranh và gửi lại.",
            ],
      referenceScore:
        typeof parsed.referenceScore === "number"
          ? parsed.referenceScore
          : 7.0,
    };
  } catch (error) {
    console.error("Lỗi khi gọi Gemini Vision API:", error);
    return generateFallbackDraftFeedback(rubric, topicTitle, artworkTitle);
  }
}

/**
 * Tạo bản nháp phân tích mẫu chuẩn cấu trúc GDPT 2018 khi chưa có API Key
 */
function generateFallbackDraftFeedback(
  rubric: RubricCriterion[],
  topicTitle: string,
  artworkTitle: string
): ArtworkFeedback {
  return {
    status: "pending_moderation",
    criteriaReviews: rubric.map((r) => ({
      criterionId: r.id,
      criterionName: r.name,
      strength: `Tác phẩm thể hiện bước đầu theo yêu cầu về ${r.name.toLowerCase()} cho bài học "${topicTitle}".`,
      improvement: `Cần hoàn thiện thêm các mảng màu, độ tương phản sáng tối và chi tiết ${r.name.toLowerCase()}.`,
      level: "Đạt",
    })),
    overallStrength: `Bản nháp ghi nhận bài vẽ "${artworkTitle}" (Chủ đề: ${topicTitle}). Đang chờ giáo viên bộ môn xem xét và nhận xét chi tiết trực tiếp.`,
    actionableNextSteps: [
      "Bước 1: Kiểm tra lại các khoảng trắng trên tranh và tô kín nền.",
      "Bước 2: Tăng cường sắc độ đậm nhạt ở các chi tiết chính để bài vẽ có chiều sâu.",
      "Bước 3: Chờ phản hồi trực tiếp từ giáo viên mĩ thuật để hoàn thiện bản chỉnh sửa.",
    ],
    referenceScore: 7.0,
  };
}

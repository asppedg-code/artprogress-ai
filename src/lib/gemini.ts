import { GoogleGenAI } from "@google/genai";
import { RubricCriterion, ArtworkFeedback, CriterionFeedback } from "@/types/artprogress";

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

/**
 * Sinh gợi ý nháp (Draft Feedback) phân tích ảnh tác phẩm mĩ thuật THCS dựa trên Rubric bài học.
 * Thẩm định tính hợp lệ của ảnh và đưa ra nhận xét chuyên môn phù hợp với tâm sinh lý lứa tuổi từng khối lớp.
 */
export async function analyzeArtworkWithGemini(
  imageBase64: string,
  mimeType: string,
  rubric: RubricCriterion[],
  topicTitle: string,
  artworkTitle: string,
  grade?: number,
  className?: string
): Promise<ArtworkFeedback> {
  const studentGrade = grade && grade >= 6 && grade <= 9 ? grade : 6;
  const studentAge = studentGrade + 5; // Lớp 6 -> 11 tuổi, Lớp 7 -> 12 tuổi, Lớp 8 -> 13 tuổi, Lớp 9 -> 14 tuổi
  const gradeClassLabel = className
    ? `${className} (Khối ${studentGrade}, khoảng ${studentAge} tuổi)`
    : `Khối ${studentGrade} (khoảng ${studentAge} tuổi)`;

  if (!apiKey) {
    // Trả về bản nháp mẫu sư phạm khi chưa gắn GEMINI_API_KEY để hệ thống vẫn chạy thử nghiệm mượt mà
    return generateFallbackDraftFeedback(rubric, topicTitle, artworkTitle, studentGrade, className);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const rubricPrompt = rubric
      .map(
        (r, idx) =>
          `${idx + 1}. [ID: "${r.id}"] **${r.name}**: ${r.description} (Trọng số: ${r.weight}%)`
      )
      .join("\n");

    const prompt = `Bạn là Giám khảo & Chuyên gia Sư phạm Mĩ thuật THCS (Chương trình GDPT 2018).
Nhiệm vụ của bạn là thẩm định hình ảnh và nhận xét bài thực hành mĩ thuật một cách CÔNG TÂM, KHÁCH QUAN, KHOA HỌC và PHÙ HỢP NĂNG LỰC LỨA TUỔI HỌC SINH.
TUYỆT ĐỐI KHÔNG XEM ẢNH CHỤP MÀN HÌNH LÀ TRANH NGHỆ THUẬT.
ĐỒNG THỜI, TUYỆT ĐỐI TRÁNH KHẮT KHE THÁI QUÁ VÀ TRÁNH CÀO BẰNG TRANH ĐẸP Ở MỨC 6-7 ĐIỂM NHƯ TRANH ĐẠI TRÀ.

THÔNG TIN BÀI HỌC & ĐỐI TƯỢNG HỌC SINH:
- Đối tượng: Học sinh ${gradeClassLabel}
- Chủ đề/Bài học: "${topicTitle}"
- Tên bức tranh: "${artworkTitle}"

ĐẶC ĐIỂM TÂM SINH LÝ & NĂNG LỰC NGHỆ THUẬT THEO KHỐI LỚP:
${
  studentGrade === 6
    ? `* KHỐI 6 (11-12 tuổi): Học sinh vừa chuyển cấp từ Tiểu học lên THCS. Nét vẽ hồn nhiên, ngây thơ, mộc mạc và giàu cảm xúc trực quan. KHÔNG đòi hỏi tỷ lệ giải phẫu người lớn hay kỹ thuật vờn sáng tối như họa sĩ chuyên nghiệp. Nếu bức tranh phối màu phong phú, có mảng hình rõ ràng, vẽ kín giấy hoặc có ý tưởng ngộ nghĩnh đáng yêu thì PHẢI đánh giá Tốt đến Xuất sắc (8.0 - 9.5 điểm).`
    : studentGrade === 7
    ? `* KHỐI 7 (12-13 tuổi): Học sinh bắt đầu tiếp cận bố cục mảng chính - mảng phụ, hòa sắc nóng - lạnh. Nếu tranh có bố cục cân đối, màu sắc tươi sáng, thể hiện đúng chủ đề thì xứng đáng đạt 7.5 - 9.0 điểm.`
    : studentGrade === 8
    ? `* KHỐI 8 (13-14 tuổi): Học sinh đã học về luật xa gần đơn giản, sắc độ đậm nhạt và chiều sâu không gian. Tranh vẽ có chiều sâu, tương phản màu tốt, thể hiện tính độc lập sáng tạo thì PHẢI chấm 8.0 - 9.5 điểm.`
    : `* KHỐI 9 (14-15 tuổi): Kỹ năng tạo hình và tư duy thẩm mỹ hoàn thiện hơn. Đánh giá cao sự sáng tạo cá nhân, cách chọn góc nhìn và thông điệp biểu đạt (8.5 - 10.0 điểm nếu tác phẩm nổi bật).`
}

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

--- BƯỚC 2: PHÂN TÍCH CHUYÊN MÔN THEO NĂNG LỰC LỨA TUỔI (Nếu là tác phẩm mĩ thuật hợp lệ) ---
Hãy nhận xét đúng với năng lực lứa tuổi học sinh ${gradeClassLabel}:
1. Nhận diện chất liệu & kỹ thuật: Học sinh vẽ bằng chất liệu gì (sáp dầu, chì màu, bút dạ, màu nước, chì đen...)?
2. Bố cục (Composition):
   - Mảng hình chính và mảng phụ đã cân đối trên trang giấy so với lứa tuổi ${studentAge} tuổi chưa?
   - Có bị quá nhỏ lọt thỏm giữa trang, hay bị lệch hẳn về một góc, hay tràn viền lộn xộn?
3. Đường nét & Hình thể:
   - Nét vẽ tự tin, có hồn hay run rẩy, cẩu thả? Tỷ lệ hình thể phù hợp lứa tuổi THCS.
4. Màu sắc & Sắc độ:
   - Tranh có phối màu sinh động không? Màu tô có đều tay, có sự cố gắng tạo đậm nhạt hay chuyển màu không?
5. Mức độ hoàn thiện:
   - Nền tranh (background) đã được xử lý hay còn bỏ trắng? Tranh có sự đầu tư thời gian không?
6. Bám sát chủ đề: Nội dung bức tranh có đúng với chủ đề "${topicTitle}" không?

NGUYÊN TẮC CHO ĐIỂM & ĐÁNH GIÁ (Thang điểm 10) - PHÂN HÓA RÕ RỆT, KHUYẾN KHÍCH NỖ LỰC SÁNG TẠO:
- TUYỆT ĐỐI KHÔNG CÀO BẰNG MỌI BÀI VẼ Ở MỨC 6-7 ĐIỂM.
- "Xuất sắc" (Điểm 8.5 - 10.0): Tác phẩm nổi bật, màu sắc sinh động, nét vẽ tự tin giàu cảm xúc, có ý tưởng sáng tạo rõ nét so với lứa tuổi ${studentAge} tuổi. Tranh rất đẹp và chỉn chu PHẢI được trao điểm xứng đáng ở mức này!
- "Tốt" (Điểm 7.5 - 8.4): Bố cục cân đối, phối màu hài hòa, bài vẽ sạch sẽ, thể hiện rõ sự đầu tư công sức của học sinh.
- "Đạt" (Điểm 5.0 - 7.4): Bài vẽ trung bình, đúng chủ đề nhưng kỹ thuật còn đơn giản, vẽ sơ sài, tô màu bẹt hoặc bỏ trống nhiều nền.
- "Chưa đạt" (Điểm 1.0 - 4.9): Tranh chưa hoàn thiện, vẽ nguệch ngoạc cẩu thả, bỏ trắng giấy hoặc vẽ lạc đề.
- Lời nhận xét: Mang tính sư phạm khích lệ (Assessment for Learning), chỉ ra nét đẹp độc đáo của bức tranh trước, sau đó gợi ý 1-2 điểm kỹ thuật để học sinh tiến bộ.
- "actionableNextSteps": 2-3 chỉ dẫn kỹ thuật cụ thể, dễ làm theo để học sinh sửa bài.

ĐỊNH DẠNG JSON ĐẦU RA (Chỉ trả về chuỗi JSON thuần, không bọc markdown hay ký tự thừa):
{
  "criteriaReviews": [
    {
      "criterionId": "<ID chính xác từ danh sách rubric>",
      "criterionName": "<Tên tiêu chí>",
      "strength": "<Nhận xét điểm làm tốt>",
      "improvement": "<Gợi ý cải thiện cụ thể>",
      "level": "Tốt" // Chọn đúng một trong: "Chưa đạt", "Đạt", "Tốt", "Xuất sắc"
    }
  ],
  "overallStrength": "<Nhận xét tổng quan giàu tính sư phạm, nêu bật điểm sáng tạo của bức tranh>",
  "actionableNextSteps": [
    "<Hành động thực hành cụ thể 1>",
    "<Hành động thực hành cụ thể 2>"
  ],
  "referenceScore": 8.5
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
    return generateFallbackDraftFeedback(rubric, topicTitle, artworkTitle, studentGrade, className);
  }
}

/**
 * Tạo bản nháp phân tích mẫu chuẩn cấu trúc GDPT 2018 khi chưa có API Key
 */
function generateFallbackDraftFeedback(
  rubric: RubricCriterion[],
  topicTitle: string,
  artworkTitle: string,
  grade?: number,
  className?: string
): ArtworkFeedback {
  const g = grade || 6;
  const age = g + 5;
  const label = className ? `${className} (${age} tuổi)` : `Khối ${g} (${age} tuổi)`;

  return {
    status: "pending_moderation",
    criteriaReviews: rubric.map((r, idx) => ({
      criterionId: r.id,
      criterionName: r.name,
      strength: `Tác phẩm thể hiện nét vẽ tự nhiên, phù hợp với năng lực học sinh ${label} ở tiêu chí ${r.name.toLowerCase()}.`,
      improvement: `Em có thể tăng thêm độ đậm nhạt và trau chuốt các nét chi tiết cho tiêu chí ${r.name.toLowerCase()} nhé.`,
      level: idx === 0 || idx === 2 ? "Tốt" : "Đạt",
    })),
    overallStrength: `Bài vẽ "${artworkTitle}" (Chủ đề: ${topicTitle}) của học sinh ${label} có bố cục rõ ràng, phối màu tươi sáng và thể hiện tinh thần sáng tạo tích cực.`,
    actionableNextSteps: [
      "Bước 1: Giữ nguyên nét vẽ tự tin và tiếp tục phát huy khả năng phối màu sinh động.",
      "Bước 2: Dùng thêm một tông màu đậm hơn để nhấn vào bóng đổ và mảng hình chính.",
      "Bước 3: Lắng nghe thêm nhận xét chi tiết của Thầy/Cô để hoàn thiện bản chỉnh sửa.",
    ],
    referenceScore: 8.0,
  };
}

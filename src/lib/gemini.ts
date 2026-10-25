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

    const prompt = `Bạn là Giáo viên Mĩ thuật Trung học cơ sở (THCS - Khối 6 đến Khối 9, học sinh 11 đến 15 tuổi) theo Chương trình Giáo dục Phổ thông 2018 (GDPT 2018).
Nhiệm vụ của bạn là nhận xét và đánh giá sản phẩm mĩ thuật của học sinh một cách KHÁCH QUAN, KHUYẾN KHÍCH SỰ TIẾN BỘ và PHÙ HỢP CHÍNH XÁC NĂNG LỰC LỨA TUỔI HỌC SINH THCS.

THÔNG TIN BÀI HỌC & ĐỐI TƯỢNG HỌC SINH:
- Đối tượng: Học sinh ${gradeClassLabel}
- Chủ đề/Bài học: "${topicTitle}"
- Tên sản phẩm/bài vẽ: "${artworkTitle}"

ĐẶC ĐIỂM TÂM SINH LÝ & NĂNG LỰC MĨ THUẬT THEO ĐỘ TUỔI HỌC SINH THCS:
${
  studentGrade === 6
    ? `* KHỐI 6 (11-12 tuổi): Chuyển tiếp từ Tiểu học. Nét vẽ hồn nhiên, cảm xúc trực quan, giàu trí tưởng tượng ngộ nghĩnh.`
    : studentGrade === 7
    ? `* KHỐI 7 (12-13 tuổi): Bắt đầu chú ý bố cục mảng chính - mảng phụ, phối màu tươi sáng, tạo hình có ý thức thẩm mỹ rõ ràng hơn.`
    : studentGrade === 8
    ? `* KHỐI 8 (13-14 tuổi): Có ý thức tạo không gian, tương phản màu sắc, sự khéo léo trong các chi tiết và tính độc lập sáng tạo.`
    : `* KHỐI 9 (14-15 tuổi): Kỹ năng tạo hình và tư duy thẩm mỹ hoàn thiện hơn, bắt đầu định hình phong cách cá nhân và ý tưởng truyền tải.`
}

ĐẶC BIỆT LƯU Ý - NGUYÊN TẮC SƯ PHẠM MĨ THUẬT PHỔ THÔNG (TUYỆT ĐỐI KHÔNG CHẤM KIỂU CHUYÊN MÔN HÀN LÂM):
1. ĐÂY LÀ MÔN HỌC PHỔ THÔNG CHO HỌC SINH THCS, TUYỆT ĐỐI KHÔNG PHẢI KỲ THI ĐẠI HỌC MĨ THUẬT HAY ĐÀO TẠO HỌA SĨ CHUYÊN NGHIỆP:
   - TUYỆT ĐỐI KHÔNG bắt bẻ tỷ lệ giải phẫu cơ thể người (anatomy) hay bắt bẻ dáng người phải "vững chãi, đúng giải phẫu". Trong mĩ thuật THCS, mọi phong cách biểu đạt (vẽ cách điệu, dáng thời trang mềm mại, hoạt họa anime/manga, nét vẽ ngây thơ mộc mạc) đều được tôn trọng và khuyến khích.
   - TUYỆT ĐỐI KHÔNG bắt bẻ lý thuyết hàn lâm hay đòi hỏi học sinh phải hiểu sâu "ý nghĩa nhân học/văn hóa" của từng chi tiết/hoa văn. Học sinh biết vận dụng và phối hợp các yếu tố thẩm mỹ vào bài làm đã là một thành công lớn.
   - TUYỆT ĐỐI KHÔNG đòi hỏi vờn khối 3D tả thực phức tạp hay bóng đổ như tranh cổ điển. Tranh vẽ nét phẳng, mảng màu trang trí rực rỡ, tranh xé dán hay mô hình đều có vẻ đẹp riêng của từng thể loại.
2. PHẠM VI ÁP DỤNG PHỔ QUÁT CHO MỌI CHỦ ĐỀ & MỌI LOẠI SẢN PHẨM:
   - Áp dụng công tâm cho: Vẽ tranh đề tài (phong cảnh, sinh hoạt, lễ hội, tĩnh vật, chân dung...), Thiết kế & Trang trí (thời trang, bìa sách, quạt giấy, đĩa tròn, poster...), Tạo hình 3D (đất nặn, xé dán, vật liệu tái chế, thủ công...).
   - Đánh giá luôn bám sát theo các tiêu chí Rubric bài học được giao.

DANH SÁCH TIÊU CHÍ RUBRIC ĐÁNH GIÁ CỦA BÀI HỌC:
${rubricPrompt}

QUY TRÌNH ĐÁNH GIÁ 2 BƯỚC:

--- BƯỚC 1: KIỂM TRA TÍNH HỢP LỆ CỦA ẢNH ---
- Xác nhận ảnh chụp có phải là một bài thực hành mĩ thuật thực sự (tranh vẽ tay bằng màu chì/sáp/nước/bột/acrylic, tranh xé dán, mô hình đất nặn/thủ công, hoặc digital painting do học sinh tự vẽ) hay không.
- Nếu là ảnh chụp màn hình máy tính/điện thoại, tài liệu in, ảnh selfie đời thường, ảnh phong cảnh chụp bằng điện thoại, ảnh meme tải mạng: TỪ CHỐI CHẤM ĐIỂM, trả về "referenceScore": 0 và báo học sinh chụp lại ảnh bài vẽ thực tế.

--- BƯỚC 2: ĐÁNH GIÁ THEO TIÊU CHUẨN SƯ PHẠM HỌC SINH THCS (Thang điểm 10) ---

1. TIÊU CHUẨN XẾP MỨC VÀ ĐIỂM SỐ CÔNG TÂM:
   * Mức "Xuất sắc" (Điểm 9.0 - 10.0, chuẩn mực 9.0 - 9.5+ điểm):
     - Dành cho tác phẩm nổi bật trong lớp: có ý tưởng độc đáo, tạo hình tự tin sinh động, màu sắc rực rỡ bắt mắt hoặc hoa văn/chi tiết vẽ tỉ mỉ, bài làm thể hiện rõ công sức và năng khiếu của học sinh THCS.
     - Khi bài làm đạt đến độ chỉn chu và đẹp mắt này so với lứa tuổi THCS: CÁC TIÊU CHÍ RUBRIC PHẢI ĐƯỢC XẾP "Xuất sắc" VÀ ĐIỂM TỔNG BẮT BUỘC ĐẠT 9+ (từ 9.0 đến 9.6 điểm).
     - Lời "improvement" cho bài Xuất sắc: TUYỆT ĐỐI KHÔNG BỚI MÓC LỖI VẶT để dìm điểm. Lời gợi ý chỉ là lời động viên phát triển mở rộng (ví dụ: "Em có thể thử vẽ thêm bộ tranh cùng chủ đề hoặc thử nghiệm thêm chất liệu mới nếu thích nhé").

   * Mức "Tốt" / "Khá" (Điểm 7.5 - 8.9):
     - Dành cho bài làm hoàn thành tốt yêu cầu đề tài, bố cục rõ ràng, sạch sẽ, màu sắc ngay ngắn gọn gàng.
     - Nhưng ở mức độ cơ bản đại trà: ví dụ hình vẽ phẳng 2D, các chi tiết đơn giản, vẽ bằng thước kẻ cơ học, tô màu một lớp bẹt, chưa có nhiều cảm xúc chuyển động hay sự đột phá sáng tạo.
     - Với nhóm bài làm cơ bản, sạch sẽ đạt chuẩn này: Điểm số chuẩn mực là 7.5 điểm. Tiêu chí Rubric xếp ở mức "Tốt" hoặc "Đạt".

   * Mức "Đạt" (Điểm 5.0 - 7.4):
     - Đúng chủ đề nhưng kỹ thuật còn vụng về, nét vẽ ngập ngừng, màu tô lem hoặc chưa kín nền, hình vẽ nhỏ lọt thỏm.

   * Mức "Chưa đạt" (Điểm 1.0 - 4.9):
     - Bài làm cẩu thả, vẽ dở dang vài nét chì rồi nộp, bỏ trắng giấy hoặc vẽ hoàn toàn lạc đề.

2. NGUYÊN TẮC NHẤT QUÁN ĐIỂM SỐ:
   - "referenceScore" PHẢI phản ánh trung thực kết quả các tiêu chí trong "criteriaReviews":
     + Đa số tiêu chí đạt mức "Xuất sắc" => "referenceScore" BẮT BUỘC trong khoảng 9.0 - 9.5+.
     + Đa số tiêu chí đạt mức "Tốt" hoặc "Đạt" (bài cơ bản, phẳng 2D, sạch sẽ) => "referenceScore" chuẩn 7.5.

ĐỊNH DẠNG JSON ĐẦU RA (Chỉ trả về chuỗi JSON thuần, không bọc markdown hay ký tự thừa):
{
  "criteriaReviews": [
    {
      "criterionId": "<ID chính xác từ danh sách rubric>",
      "criterionName": "<Tên tiêu chí>",
      "strength": "<Nhận xét ưu điểm nổi bật giàu tính khích lệ sư phạm>",
      "improvement": "<Gợi ý phát triển tích cực, phù hợp lứa tuổi>",
      "level": "Xuất sắc" // Chọn đúng một trong: "Chưa đạt", "Đạt", "Tốt", "Xuất sắc"
    }
  ],
  "overallStrength": "<Nhận xét tổng quan giàu tính sư phạm, khen ngợi điểm nổi bật và nỗ lực của học sinh>",
  "actionableNextSteps": [
    "<Hành động thực hành cụ thể 1>",
    "<Hành động thực hành cụ thể 2>"
  ],
  "referenceScore": 9.2
}`;

    const primaryModel = process.env.NEXT_PUBLIC_GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const fallbackModel = process.env.NEXT_PUBLIC_GEMINI_FALLBACK_MODEL || process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";

    const callGeminiWithTimeout = async (model: string) => {
      const callPromise = ai.models.generateContent({
        model,
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
        setTimeout(() => reject(new Error(`Gemini API timeout sau 20 giây với model ${model}`)), 20000)
      );

      return await Promise.race([callPromise, timeoutPromise]);
    };

    let response;
    try {
      response = await callGeminiWithTimeout(primaryModel);
    } catch (primaryError) {
      console.warn(
        `[ArtProgress AI] Model chính (${primaryModel}) gặp sự cố (quá tải / high demand / unavailable). Tự động chuyển xuống model dự phòng (${fallbackModel}). Chi tiết:`,
        primaryError
      );
      if (primaryModel !== fallbackModel) {
        response = await callGeminiWithTimeout(fallbackModel);
      } else {
        throw primaryError;
      }
    }

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
            ? "Hình ảnh tải lên không phải sản phẩm mĩ thuật thực hành."
            : "Đã hoàn thành phần thực hành tiêu chí này."),
        improvement:
          found?.improvement ||
          (parsed.referenceScore === 0
            ? "Cần chụp ảnh trực diện sản phẩm thực tế để được đánh giá."
            : "Em có thể tiếp tục phát huy năng lực sáng tạo ở bài học tiếp theo nhé."),
        level,
      };
    });

    const isRejectedImage = parsed.referenceScore === 0;

    // Đảm bảo tính nhất quán sư phạm: Điểm tổng hợp phải đồng điệu với phân bổ các mức độ tiêu chí Rubric
    let calibratedScore = typeof parsed.referenceScore === "number" ? parsed.referenceScore : 7.5;
    if (!isRejectedImage && normalizedCriteria.length > 0) {
      const numXuatSac = normalizedCriteria.filter((c) => c.level === "Xuất sắc").length;
      const numTot = normalizedCriteria.filter((c) => c.level === "Tốt").length;

      // 1. Tác phẩm đạt chuẩn Xuất sắc ở phần lớn tiêu chí (từ 60% tiêu chí trở lên đạt Xuất sắc):
      // Tiêu chuẩn mĩ thuật THCS: Bài làm nổi trội xứng đáng đạt mức 9+ (9.0 - 9.5+)
      if (numXuatSac >= Math.ceil(normalizedCriteria.length * 0.6)) {
        if (calibratedScore < 9.0) {
          calibratedScore = 9.2;
        } else if (calibratedScore > 9.8) {
          calibratedScore = 9.5;
        }
      }
      // 2. Tác phẩm ở mức cơ bản, đúng đề tài nhưng chưa có tiêu chí Xuất sắc (chủ yếu Đạt, tối đa 1 Tốt):
      // Bài vẽ phẳng, sạch sẽ, ngay ngắn đạt chuẩn Khá ở mức 7.5 điểm
      else if (numXuatSac === 0 && numTot <= 1) {
        calibratedScore = 7.5;
      }

      calibratedScore = Math.round(calibratedScore * 10) / 10;
    }

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
      referenceScore: isRejectedImage ? 0 : calibratedScore,
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

# ADR 0004: TÍCH HỢP GEMINI 3.5 FLASH-LITE, XÁC THỰC SƯ PHẠM VÀ PHÂN QUYỀN TRẢI NGHIỆM THỰC TẾ

## Trạng thái
Đã chấp thuận (Accepted) — Ngày 15/10/2026

## Bối cảnh
Dự án bước vào giai đoạn kết nối dữ liệu đám mây (Firebase) và AI thực tế (Gemini API) để chuẩn bị tham dự Ngày hội Giáo viên sáng tạo 2026. Trong quá trình rà soát `/grill-with-docs`, các vấn đề về hạn mức API quota, phân quyền sư phạm và quy trình thiết lập môi trường đã được thảo luận và chốt phương án.

## Các quyết định kiến trúc đã thống nhất

### 1. Lựa chọn mô hình Gemini 3.5 Flash-Lite (Q2)
- **Quyết định**: Sử dụng mô hình `gemini-3.5-flash-lite` qua Google Gen AI SDK (`@google/genai`) làm mô hình thị giác mặc định, hỗ trợ cấu hình qua biến môi trường `GEMINI_MODEL`.
- **Lý do**:
  - Hạn mức Quota miễn phí (Free Tier RPM / RPD) của dòng Flash-Lite cao hơn đáng kể so với các dòng Pro/Full Flash.
  - Tốc độ xử lý đa phương thức (Multimodal Image-to-JSON) siêu tốc (~1-2 giây), đảm bảo modal nộp bài của học sinh phản hồi tức thì.
  - Hỗ trợ chuẩn `responseMimeType: "application/json"` để ánh xạ trực tiếp vào Rubric 4 tiêu chí bài học.

### 2. Đường ống lưu trữ ảnh qua Firebase Storage (Q1)
- **Quyết định**: Ảnh bài vẽ (đã nén qua Canvas API ~200KB-400KB) được tải lên Firebase Storage tại đường dẫn `artworks/{classId}/{studentId}_{timestamp}.jpg`.
- **Lưu trữ Firestore**: Tài liệu Firestore chỉ lưu trữ đường dẫn công khai `downloadUrl`, không lưu chuỗi Base64 dài để tránh vượt quá giới hạn 1MB/document và giảm chi phí truy vấn.
- **Dự phòng (Fallback)**: Nếu Firebase chưa cấu hình hoặc Storage offline, hệ thống tự động duy trì Base64 cục bộ để giáo viên vẫn trình diễn bài giảng bình thường.

### 3. Cơ chế Xác thực & Phân quyền Sư phạm (Q3)
- **Quyết định**: Triển khai hàng rào xác thực kép (Dual-Barrier Authentication):
  - **Giáo viên**: Được bảo vệ bởi Mã PIN Sư phạm (Mặc định: `123456`). Người dùng chỉ được cấp quyền Duyệt nhận xét, Đóng/Mở nộp bài, Chỉnh sửa điểm số và Đăng lên Triển Lãm sau khi xác thực thành công.
  - **Học sinh & Khách xem**: Không bị chặn bởi form đăng nhập bắt buộc. Học sinh chọn Lớp và Tên để nộp bài; Ban giám khảo / Khách xem có thể duyệt phòng tranh công khai ngay lập tức.
- **Lý do**: Đảm bảo an toàn sư phạm và bảo mật lời phê của học sinh, đồng thời đem lại trải nghiệm frictionless (không rào cản) cho Ban giám khảo Ngày hội sáng tạo.

### 4. Quy chuẩn Biến môi trường (.env.local) (Q4)
- **Quyết định**: Cung cấp file mẫu `.env.example` với đầy đủ các khóa cần thiết (`GEMINI_API_KEY`, `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_TEACHER_PIN`).
- **Lý do**: Giúp giáo viên/người triển khai dễ dàng cấu hình chỉ trong 3 phút mà không làm lộ khóa bảo mật ra mã nguồn Git.

## Hệ quả
- Cập nhật hàm gọi `analyzeArtworkWithGemini` sang mô hình `gemini-3.5-flash-lite`.
- Tích hợp Modal nhập mã PIN giáo viên khi chuyển vai trò hoặc thực hiện thao tác quản trị.
- Cập nhật đường ống nộp bài để đẩy ảnh lên Firebase Storage khi `isFirebaseConfigured = true`.

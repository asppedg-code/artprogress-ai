# ADR 0002: LỰA CHỌN NỀN TẢNG BACKEND (FIREBASE VS SUPABASE) VÀ RUBRIC SƯ PHẠM

## Trạng thái
Đã chấp thuận (Accepted)

## Bối cảnh
- Q5 & Q6 đã thống nhất: Rubric chuẩn GDPT 2018 (4 tiêu chí: Bố cục, Đường nét, Màu sắc, Sáng tạo) và phản hồi AI 4 mục có cấu trúc sư phạm rõ ràng (Điểm mạnh, Gợi ý cải thiện, Hành động tiếp theo, Mức độ đạt).
- Q7 xem xét nền tảng backend: Hệ sinh thái Antigravity tích hợp sẵn bộ công cụ chuyên sâu của Firebase (CLI, Firestore, Firebase Storage, Firebase Auth, Firebase App Hosting, Security Rules Auditor, Subagent chuyên trách `firestore-rules-author`).

## Quyết định kỹ thuật: Chọn FIREBASE làm nền tảng Backend & Lưu trữ
Hệ thống ArtProgress AI sẽ sử dụng **Firebase (Google Cloud)**:
1. **Firestore Database**: Lưu trữ thông tin lớp học, danh sách học sinh, bài tập chủ đề, rubric, dữ liệu tác phẩm và phản hồi của giáo viên/AI theo kiến trúc document thời gian thực (realtime updates).
2. **Firebase Storage**: Lưu trữ ảnh tác phẩm mĩ thuật (ảnh bản gốc và ảnh bản hoàn thiện) với CDN tốc độ cao, tối ưu tải ảnh trên smartphone.
3. **Firebase Authentication / Custom Session**: Quản lý tài khoản giáo viên và đăng nhập mã học sinh/lớp.
4. **Bảo mật & Phân quyền**: Được kiểm soát chặt chẽ thông qua `firestore.rules` và `storage.rules` với subagent chuyên trách `firestore-rules-author` và audit an toàn dữ liệu học sinh.
5. **Tương thích hoàn hảo với Gemini Vision**: Cùng thuộc hệ sinh thái Google, tối ưu độ trễ và quản lý API key phía máy chủ (Next.js Server Actions / Firebase Admin SDK).

## Hệ quả
- Thay thế gói Supabase bằng Firebase Admin SDK (`firebase-admin`) và Client SDK (`firebase`).
- Loại bỏ sự phụ thuộc vào cấu hình PostgreSQL bên ngoài, tận dụng Firestore NoSQL mềm dẻo cho cấu trúc Rubric linh hoạt.

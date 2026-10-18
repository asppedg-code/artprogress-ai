# ADR 0003: CÁC QUYẾT ĐỊNH THIẾT KẾ BACKEND FIREBASE, LƯU TRỮ ẢNH VÀ XUẤT BÁO CÁO TIẾN BỘ

## Trạng thái
Đã chấp thuận (Accepted) — Ngày 15/10/2026

## Bối cảnh
Sau khi hoàn thiện và đóng gói giao diện Studio Workspace phía Frontend, hệ thống bước vào giai đoạn tích hợp dịch vụ thực tế để chuẩn bị thử nghiệm trong lớp học và tham gia Ngày hội Nhà giáo sáng tạo 2026. Phiên Grill-with-Docs Vòng 1 đã làm rõ 5 quyết định kiến trúc then chốt:

## Các quyết định kiến trúc đã thống nhất

### 1. Cấu trúc cơ sở dữ liệu Firestore: Flat Root Collections (Q1)
- **Quyết định**: Sử dụng các bộ sưu tập phẳng ở cấp gốc (`classes`, `topics`, `students`, `artworks`) liên kết bằng trường khóa ngoại (`classId`, `topicId`, `studentId`).
- **Lý do**: Cho phép truy vấn đa chiều (lọc theo lớp, lọc theo học sinh, hiển thị Phòng Triển Lãm công khai toàn trường) bằng các câu lệnh `where()` đơn giản, tránh sự phức tạp của Firestore `collectionGroup` lồng sâu.

### 2. Xử lý & Lưu trữ Ảnh tác phẩm trên Firebase Storage (Q2)
- **Quyết định**: Tự động nén và resize ảnh phía Client (Canvas API, tối đa 1600px, chuyển định dạng WebP/JPEG chất lượng cao, dung lượng ~300KB-600KB) trước khi tải lên Firebase Storage.
- **Quy ước đường dẫn**: `artworks/{topicId}/{studentId}_{timestamp}_{initial|revised}.jpg`.
- **Lý do**: Tiết kiệm băng thông mạng trong lớp học THCS, giảm chi phí lưu trữ Storage và tối ưu tốc độ phân tích thị giác của Gemini Vision mà không cần trigger Cloud Functions ngầm tốn kém.

### 3. Cơ chế Đăng nhập & Quản lý Phiên làm việc (Q3)
- **Quyết định**:
  - **Giáo viên**: Đăng nhập bằng tài khoản Google (Firebase Authentication Google Provider) để quản trị lớp học, tạo chủ đề, duyệt nhận xét và đóng/mở nộp bài.
  - **Học sinh**: Đăng nhập nhanh bằng cách chọn Lớp + Mã/Tên học sinh (`studentId`), lưu phiên qua Cookie/LocalStorage nhẹ phía Client.
- **Lý do**: Giúp học sinh THCS vào bài học ngay lập tức chỉ trong vài giây, không mất thời gian xử lý sự cố quên mật khẩu/email.

### 4. Phương thức tích hợp Gemini Vision API: Synchronous Server Action (Q4)
- **Quyết định**: Gọi trực tiếp Gemini 2.5 Flash Vision trong Next.js Server Action với thời gian chờ ~2-4 giây kèm hiệu ứng chờ sư phạm trên giao diện.
- **Lý do**: Lớp học THCS (35-40 học sinh) nộp bài rải rác trong suốt 45 phút tiết học. Gọi đồng bộ mang lại phản hồi nháp ngay lập tức cho Giáo viên kiểm tra, không cần thiết lập hệ thống Message Queue hay Polling ngầm phức tạp.

### 5. Định dạng Xuất Báo cáo Tiến bộ Học tập (Q5)
- **Quyết định**: Xây dựng tính năng "Xuất Báo Cáo Tiến Bộ Sư Phạm" dưới dạng Printable HTML / PDF View chuẩn trang in khổ A4.
- **Nội dung báo cáo**: Bao gồm ảnh Before - After đối sánh, bảng điểm Rubric theo Yêu cầu cần đạt, lời nhận xét sư phạm đã duyệt của Giáo viên và nhật ký tự đánh giá của học sinh.
- **Lý do**: Cung cấp minh chứng trực quan, sinh động nhất về hiệu quả chuyển đổi số và phát triển năng lực mĩ thuật của học sinh phục vụ Hội đồng giám khảo Ngày hội sáng tạo 2026.

## Hệ quả
- Khởi tạo schema chuẩn trên Firestore và kết nối Firebase Storage SDK.
- Xây dựng component trang in Báo cáo tiến bộ sư phạm (`/report` hoặc modal Printable View).
- Giữ vững nguyên tắc Ponytail: tối giản kiến trúc, không phát sinh dịch vụ trung gian ngoài luồng.

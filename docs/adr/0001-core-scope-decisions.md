# ADR 0001: CÁC QUYẾT ĐỊNH THIẾT KẾ & PHẠM VI HỆ THỐNG ARTPROGRESS AI (VÒNG 1)

## Trạng thái
Đã chấp thuận (Accepted)

## Bối cảnh
Dự án "Mĩ thuật tiến bộ số – ArtProgress AI" cần tối ưu hóa trải nghiệm thực tế cho giáo viên và học sinh THCS trong tiết học mĩ thuật, đồng thời tuân thủ triết lý tối giản (Ponytail), bảo mật dữ liệu học sinh và tập trung vào các tính năng cốt lõi phục vụ nghiên cứu & Ngày hội Nhà giáo sáng tạo 2026.

## Các quyết định kiến trúc đã thống nhất

### 1. Cơ chế xác thực & đăng nhập học sinh (Q1 -> Lựa chọn A)
- **Quyết định**: Học sinh không cần đăng ký bằng email cá nhân phức tạp. Giáo viên tạo lớp và sinh mã học sinh/mã định danh lớp. Học sinh đăng nhập bằng Mã học sinh + Mật khẩu đơn giản/Mã lớp.
- **Lý do**: Phù hợp lứa tuổi THCS, tiết kiệm thời gian vào tiết học, bảo mật thông tin cá nhân của học sinh.

### 2. Quản lý phiên bản tác phẩm (Q2 -> Hoãn/Tối giản)
- **Quyết định**: Tạm thời chưa phức tạp hóa cấu trúc đa phiên bản. Tiếp cận theo cấu trúc cơ bản nhất: một tác phẩm gồm ảnh ban đầu và trường cập nhật ảnh hoàn thiện để đáp ứng luồng so sánh trước-sau, không xây dựng hệ thống versioning cồng kềnh.
- **Ghi chú Ponytail**: `ponytail: giữ cấu trúc dữ liệu phẳng đơn giản nhất, mở rộng khi có yêu cầu thực tế`.

### 3. Pipeline AI & Phê duyệt Human-in-the-Loop (Q3 -> Lựa chọn A)
- **Quyết định**: Khi học sinh nộp tác phẩm, hệ thống tự động gọi Gemini Vision để tạo "Gợi ý nháp" (Draft Feedback) ngầm.
- **Quy tắc hiển thị**: Học sinh ở trạng thái chờ duyệt. Giáo viên nhận thông báo và xem toàn bộ gợi ý nháp của AI trên Dashboard để Chấp thuận (Approve), Chỉnh sửa bổ sung (Edit) hoặc Từ chối (Reject) trước khi phản hồi được gửi tới học sinh.

### 4. Triển lãm & Mã QR (Q4 -> Công khai chọn lọc, bỏ QR)
- **Quyết định**:
  - Tác phẩm mặc định ở chế độ riêng tư (`is_public = false`).
  - Chỉ những tác phẩm được giáo viên chọn lọc và bấm công khai mới hiển thị trên trang Phòng Triển lãm chung cho khách/phụ huynh xem.
  - Bỏ qua tính năng tạo mã QR để tập trung tối đa vào luồng chấm điểm và tiến bộ mĩ thuật.

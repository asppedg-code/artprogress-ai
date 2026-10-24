/**
 * =========================================================================
 * CẤU HÌNH PHIÊN BẢN HỆ THỐNG ARTPROGRESS (SINGLE SOURCE OF TRUTH)
 * =========================================================================
 * 
 * Bạn chỉ cần thay đổi số phiên bản ở DUY NHẤT file này:
 * - Khi bạn phát hành bản cập nhật lớn hoặc sửa lỗi cấu trúc và muốn ép
 *   tất cả trình duyệt của giáo viên & học sinh tự động xóa sạch cache cũ
 *   để tải bản mới nhất: Chỉ cần tăng số phiên bản (ví dụ: "1.0.1", "1.1.0").
 * 
 * - LƯU Ý KHI DEPLOY: Nếu bạn tiếp tục deploy lên Firebase mà KHÔNG thay đổi
 *   phiên bản này, hệ thống vẫn hoạt động HOÀN TOÀN BÌNH THƯỜNG, không có
 *   bất kỳ lỗi nào xảy ra.
 */
export const APP_VERSION = "1.5.0";

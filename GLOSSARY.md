# BẢNG THUẬT NGỮ DỰ ÁN (GLOSSARY) - ARTPROGRESS AI

Tài liệu định nghĩa chuẩn xác các thuật ngữ sư phạm, nghiệp vụ và kỹ thuật trong hệ thống hỗ trợ dạy học Mĩ thuật THCS (Chương trình GDPT 2018 & Ngày hội Giáo viên sáng tạo 2026).

| Thuật ngữ | Tiếng Anh | Định nghĩa chuẩn xác trong hệ thống |
| :--- | :--- | :--- |
| **Hồ sơ sáng tạo** | Portfolio | Không gian lưu trữ hành trình học tập môn Mĩ thuật của từng học sinh, gồm các tác phẩm, bản thảo, tiến trình chỉnh sửa và tự đánh giá. |
| **Bản đầu** | Initial Draft | Ảnh chụp tác phẩm ở giai đoạn phác thảo hoặc sản phẩm ban đầu mà học sinh nộp lần đầu. |
| **Bản chỉnh sửa** | Revised Version | Ảnh chụp tác phẩm sau khi học sinh đã tiếp thu nhận xét của giáo viên/AI và hoàn thiện thêm. |
| **Yêu cầu cần đạt bài học** | Lesson Learning Outcomes | Các tiêu chuẩn năng lực đặc thù của từng chủ đề bài học mĩ thuật cụ thể, làm căn cứ sư phạm trực tiếp để giáo viên thiết lập Rubric đánh giá. |
| **Tiêu chí Rubric bài học** | Lesson Rubric Criteria | Bộ thước đo đánh giá được thiết lập linh hoạt theo từng bài học (gồm tên tiêu chí, yêu cầu cần đạt và trọng số % với tổng 100%). |
| **Gợi ý nháp AI** | Draft AI Feedback | Phản hồi do Gemini Vision phân tích tự động từ ảnh tác phẩm và Rubric bài học. Chỉ giáo viên mới thấy bản nháp này trước khi duyệt. |
| **Duyệt phản hồi** | Feedback Moderation | Quyết định của giáo viên (Chấp thuận / Hiệu chỉnh bổ sung / Đổi mức độ Rubric) trước khi phản hồi chính thức được phát hành cho học sinh. |
| **Trước - Sau** | Before & After | Chế độ hiển thị tương phản trực quan (side-by-side hoặc slider) giữa bản đầu và bản chỉnh sửa dựa trên cùng khung tỷ lệ chuẩn. |
| **Phòng Triển lãm** | Public Exhibition | Không gian trưng bày trực tuyến các tác phẩm xuất sắc đã được giáo viên duyệt nhận xét và phê duyệt công khai (`isPublic = true`). |
| **Đóng/Mở nộp bài** | Submission Toggle | Trạng thái tiếp nhận bài nộp của từng chủ đề do giáo viên chủ động kiểm soát (`isActive`), ngăn học sinh nộp bài ngoài giờ quy định. |
| **Báo cáo tiến bộ sư phạm** | Pedagogical Progress Report | Bản tổng hợp minh chứng hành trình phát triển năng lực của học sinh (đối sánh Before-After, bảng điểm Rubric, lời phê và tự đánh giá), phục vụ hồ sơ bài giảng và Ngày hội sáng tạo 2026. |
| **Mã PIN Sư phạm** | Teacher Auth PIN | Mã bảo mật ngắn (mặc định `123456`) bảo vệ các thao tác quản trị sư phạm (duyệt bài, chỉnh sửa điểm, đổi Rubric, đóng/mở nộp bài) tránh học sinh thao tác nhầm lẫn. |
| **Kho lưu trữ tác phẩm** | Artwork Storage | Dịch vụ đám mây Firebase Storage lưu trữ ảnh tác phẩm đã nén, cung cấp liên kết truy cập an toàn tải nhanh cho hồ sơ học sinh. |
| **Phòng Triển lãm 3D** | 3D Interactive Art Gallery | Không gian ảo 3D thời gian thực (Three.js WebGL) mô phỏng bảo tàng nghệ thuật với sàn gỗ, đèn rọi tranh và tường trưng bày, cho phép người dùng tự do di chuyển tham quan. |
| **Khung tranh 3D** | 3D Artwork Frame | Thực thể 3D trong không gian bảo tàng kết hợp khung gỗ nổi, toan vẽ nạp ảnh động của học sinh và biển đồng khắc thông tin tác phẩm bên dưới. |
| **Điều hướng lướt tới** | Click-to-Focus / Tap-to-Inspect | Cơ chế tương tác mượt mà: người xem nhấp chuột hoặc chạm vào bức tranh từ xa để camera tự động lướt đến cự ly đối diện chính diện tác phẩm. |
| **Chế độ xem kép** | Dual View (2D/3D) | Khả năng chuyển đổi tức thì giữa chế độ xem lưới ảnh 2D truyền thống và chế độ tham quan thực tế ảo 3D theo nhu cầu người dùng. |


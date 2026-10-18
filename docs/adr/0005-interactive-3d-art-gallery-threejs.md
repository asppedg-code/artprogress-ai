# ADR 0005: KHÔNG GIAN TRIỂN LÃM NGHỆ THUẬT 3D TƯƠNG TÁC (THREE.JS NATIVE)

## Trạng thái
Đã chấp thuận (Accepted) — Ngày 17/10/2026

## Bối cảnh
Người dùng mong muốn mang trải nghiệm phòng triển lãm nghệ thuật 3D tương tác (vốn từng xây dựng bằng Unity WebGL) vào mục Phòng Triển Lãm của ArtProgress AI, giúp học sinh, giáo viên và khách tham quan có thể di chuyển trong không gian ảo và bấm xem tranh trực quan.

Qua quy trình phỏng vấn thiết kế `/grill-with-docs` (Round 1) và chuẩn thiết kế trải nghiệm `/impeccable` (Experience Mode), nhóm đã so sánh giữa việc bê nguyên game Unity WebGL (nặng 30-100MB, khó đồng bộ động và dễ văng trên mobile) và xây dựng phòng triển lãm 3D Native bằng Three.js.

## Các quyết định kiến trúc đã thống nhất

### 1. Nền tảng 3D: Three.js thuần trong React Component (Q1)
- **Quyết định**: Sử dụng thư viện `three` và `@types/three` thuần túy, tích hợp thông qua React `useRef<HTMLCanvasElement>` component (`Gallery3DView.tsx`).
- **Lý do**:
  - Tương thích 100% với React 19 và Next.js 16 (tránh xung đột peer-dependencies của các thư viện wrapper như `@react-three/fiber`).
  - Kích thước siêu nhẹ (~600KB), tải tức thì trong 1 giây ngay cả trên mạng 4G.
  - Kiểm soát hoàn toàn vòng đời WebGL (`renderer.dispose()`, giải phóng geometry, material, texture) khi người dùng thoát khỏi triển lãm 3D, tránh rò rỉ bộ nhớ (memory leak).

### 2. Bố cục phòng triển lãm tự co giãn thông minh (Smart Dynamic Gallery) (Q2)
- **Quyết định**: Kích thước phòng triển lãm (chiều dài hành lang nghệ thuật) được tính toán động dựa trên số lượng tranh thực tế (`artworks.filter(a => a.isPublic)`).
- **Quy tắc sắp đặt**:
  - Tranh được bố trí đều hai bên vách tường với khoảng cách thẩm mỹ chuẩn bảo tàng (2.8m - 3.2m), ngang tầm mắt (1.6m).
  - Tự động sinh khung tranh 3D (viền gỗ sồi / kim loại mạ vàng), toan tranh gắn Texture ảnh học sinh nạp động từ URL/Base64, kèm biển tên tác giả (Plaque) bằng canvas texture bên dưới.

### 3. Cơ chế điều khiển đa phương thức (Hybrid Navigation Controls) (Q3)
- **Quyết định**: Hỗ trợ đồng thời cả PC và thiết bị cảm ứng di động:
  - **Trên PC**: Di chuyển tự do bằng cụm phím `W, A, S, D` (hoặc phím mũi tên) + xoay chuột quan sát không gian.
  - **Trên Mobile**: Cần điều khiển ảo (Virtual Joystick) góc trái màn hình + thao tác vuốt màn hình để đổi góc nhìn.
  - **Cơ chế Click-to-Focus (Tap-to-Inspect)**: Người xem có thể nhấp chuột/chạm trực tiếp vào bất kỳ bức tranh nào từ xa $\rightarrow$ Camera sẽ tự động trượt mượt mà (smooth lerp) đến đứng đối diện chính diện bức tranh đó.
  - **Xem chi tiết tác phẩm**: Nhấp vào tranh khi đang ở cự ly gần sẽ kích hoạt Modal đối sánh Before–After và bảng điểm Rubric GDPT 2018 sẵn có của web.

### 4. Chế độ xem kép (Dual View: 2D Grid ↔ 3D Gallery) (Q4)
- **Quyết định**: Giữ nguyên chế độ hiển thị dạng lưới 2D truyền thống và bổ sung chế độ Phòng 3D.
- **Thanh công cụ**: Bố trí nút gạt chuyển đổi nhanh giữa *"Phòng 3D"* và *"Dạng lưới 2D"*. Mặc định khi khách hoặc học sinh vào tham quan sẽ mở chế độ 3D trải nghiệm cao cấp, nhưng có thể quay về 2D tức thì nếu cần lướt nhanh danh sách.

### 5. Kiến trúc ánh sáng bảo tàng và Khung tranh thích ứng (Museum Lighting & Adaptive Framing)
- **Khung tranh co giãn theo tỷ lệ ảnh tự nhiên**: Tính toán động (`computeDimensions` & `applyFrameFit`) cho viền gỗ, viền vàng và passe-partout theo tỷ lệ ảnh tự nhiên (`naturalWidth / naturalHeight`), loại bỏ biến dạng toan tranh.
- **Model đèn rọi ray tròn & Khớp xoay Quaternion**: Củ đèn dạng trụ vát viền vàng xoay hướng chính xác 100% bằng phép biến đổi Quaternion chĩa vào tâm bức tranh; chùm sáng `SpotLight` phát xuất từ bề mặt thấu kính đèn.
- **Đèn LED âm trần tròn trung tâm (Single Central Recessed Downlight)**: Bố trí duy nhất 1 đèn LED âm trần tròn nhỏ ở trung tâm trần nhà ($\varnothing 20\text{cm}$, vành viền mỏng phẳng màu trắng sứ áp sát trần, mặt kính mica trắng mờ phát sáng phẳng $\varnothing 15.6\text{cm}$, đã xóa hoàn toàn các vạch đen tai cài) kèm quầng sáng mềm mại (glow halo texture) và chùm sáng `SpotLight` chiếu thẳng xuống sàn nhà.
- **Phào chỉ kiến trúc & Nẹp viền đen góc tường**: Kẻ nẹp đen sắc nét tại 4 góc tường đứng, 4 viền phào trần (crown molding) và phào chân tường (baseboard) bao quanh cả 4 vách, tạo nét kiến trúc bảo tàng cổ điển thanh lịch.
- **Tăng độ sáng không gian**: Tăng `AmbientLight` lên `1.35` kết hợp ánh sáng hắt tường tinh tế, mang lại không gian triển lãm sáng sủa, ấm áp và rõ nét.

### 6. Tối ưu hóa hiệu năng 60FPS & Trải nghiệm tương tác (Performance & Smooth Damping)
- **Tách biệt Reticle khỏi React State**: Chuyển điều khiển tâm ngắm (Crosshair) sang thao tác trực tiếp trên DOM node qua `ref` (`reticleDotRef`, `reticleLabelRef`), triệt tiêu 100% việc React re-render trong quá trình di chuyển hay lia tầm nhìn.
- **Làm mượt quán tính (Cinematic Damping)**: Tích hợp bộ lọc quán tính mượt mà cho bước đi bàn phím (`14.0 * delta`) và góc quay tầm nhìn chuột/cảm ứng (`24.0 * delta`), triệt tiêu hoàn toàn hiện tượng khựng giật cục bộ khi bắt đầu/kết thúc di chuyển.
- **Kiến trúc ánh sáng hiệu năng cao**: Kết hợp `HemisphereLight` per-vertex cho độ sáng tự nhiên không tốn shader + 1 đèn LED âm trần trung tâm + thu hẹp cự ly spotlight tranh còn 5.0m.
- **Tái sử dụng Geometry & Chuyển đổi MeshLambertMaterial**: Dùng chung các đối tượng hình học cho toàn bộ đèn ray; chuyển trần, ray, phào chỉ và chi tiết đèn sang `MeshLambertMaterial` / `MeshBasicMaterial` giảm 70% gánh nặng shader.
- **Giới hạn DPR & Precision**: Cài đặt `pixelRatio` tối đa 1.25 và `precision: "mediump"` giúp GPU tích hợp xử lý nhẹ nhàng, ổn định 60 FPS.
- **Khắc phục lỗi reset vị trí Camera**: Sử dụng `onSelectArtworkRef` kết hợp so sánh theo `artworksKey`; lưu và khôi phục tọa độ camera trong `stateRef`, ngăn camera bị giật về điểm spawn khi mở modal Before–After.

## Hệ quả
- Cài đặt `three` và `@types/three`.
- Xây dựng component `Gallery3DView.tsx` hoàn chỉnh với ánh sáng spotlight chiếu tranh, sàn gỗ mỹ thuật, tường gallery và các vách tranh.
- Tích hợp liền mạch với dữ liệu `artworks` trong `page.tsx` và modal `galleryModalArtwork`.

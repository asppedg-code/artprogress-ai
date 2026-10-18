/**
 * Nén và tối ưu hóa ảnh tác phẩm mĩ thuật phía Client bằng HTML5 Canvas native
 * Tuân thủ triết lý Ponytail (Senior Dev Mode): 0 dependencies npm ngoài, tận dụng triệt để Web API có sẵn.
 */

export async function compressArtworkImage(
  input: File | string,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<{ base64: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    // 1. Tải ảnh vào đối tượng Image
    const img = new Image();

    img.onload = () => {
      // 2. Tính toán tỷ lệ co giãn giữ nguyên khung hình gốc
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // 3. Vẽ lên Canvas để nén và chuẩn hóa
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Không thể khởi tạo Canvas 2D context"));
        return;
      }

      // Vẽ ảnh với chất lượng làm mịn cao
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // 4. Xuất chuỗi Base64 và Blob JPEG chất lượng cao
      const base64 = canvas.toDataURL("image/jpeg", quality);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ base64, blob });
          } else {
            reject(new Error("Không thể chuyển đổi Canvas thành Blob"));
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Không thể tải và đọc dữ liệu ảnh"));
    };

    // Nạp nguồn ảnh
    if (typeof input === "string") {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Lỗi khi đọc file ảnh từ máy"));
      reader.readAsDataURL(input);
    }
  });
}

"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, CheckCircle, RefreshCw, Camera, ImageIcon, X } from "lucide-react";
import { compressArtworkImage } from "@/lib/image-utils";
import { Topic } from "@/types/artprogress";

interface UploadArtworkModalProps {
  topics?: Topic[];
  selectedTopicId?: string;
  topicTitle: string;
  isRevision?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; imageBase64: string; topicId?: string }) => Promise<void>;
}

export function UploadArtworkModal({
  topics = [],
  selectedTopicId,
  topicTitle,
  isRevision = false,
  isOpen,
  onClose,
  onSubmit,
}: UploadArtworkModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const [userSelectedTopicId, setUserSelectedTopicId] = useState<string | null>(null);

  // Tham chiếu đến 2 input tải ảnh riêng biệt (Thư viện ảnh vs Máy ảnh trực tiếp)
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const activeTopicFallback = topics.find((t) => t.isActive)?.id || topics[0]?.id || "";
  const currentTopicId = isRevision
    ? (selectedTopicId || "")
    : (userSelectedTopicId ?? (selectedTopicId || activeTopicFallback));

  const chosenTopic = topics.find((t) => t.id === currentTopicId);

  const handleClose = () => {
    setUserSelectedTopicId(null);
    setTitle("");
    setDescription("");
    setPreviewUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const { base64 } = await compressArtworkImage(file, 1600, 1600, 0.85);
        setPreviewUrl(base64);
      } catch (err) {
        console.error("Lỗi khi nén ảnh:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
        // Reset giá trị input để cho phép chọn lại cùng 1 file nếu cần
        e.target.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) return;

    const effectiveTopicId = isRevision ? selectedTopicId : (currentTopicId || selectedTopicId);
    if (!effectiveTopicId && !isRevision) {
      alert("Vui lòng chọn chủ đề bài học trước khi nộp bài.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title || (isRevision ? "Bản hoàn thiện" : "Bản phác thảo ban đầu"),
        description,
        imageBase64: previewUrl,
        topicId: effectiveTopicId,
      });
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      {/* KHUNG MODAL TỰ ĐỘNG THÍCH ỨNG: CÓ GIỚI HẠN CHIỀU CAO VÀ CUỘN RIÊNG, NÚT BẤM LUÔN NẰM TRONG TẦM MẮT */}
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-stone-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* 1. THANH HEADER CỐ ĐỊNH Ở ĐỈNH */}
        <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-100 flex items-center justify-between bg-white z-10">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm sm:text-base font-bold text-stone-900 truncate">
              {isRevision ? "Nộp bản chỉnh sửa (Hoàn thiện)" : "Nộp bài vẽ mĩ thuật mới"}
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500 truncate mt-0.5">
              {isRevision ? topicTitle : (chosenTopic?.title || topicTitle)}
            </p>
          </div>
          <button
            onClick={handleClose}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0 cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. FORM & VÙNG NỘI DUNG CUỘN ĐỘC LẬP (KHÔNG BỊ TRÀN HAY MẤT NÚT BẤM) */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 overscroll-contain">
            {/* Chọn chủ đề bài học khi nộp bài mới */}
            {!isRevision ? (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Chọn chủ đề bài học để nộp:
                </label>
                {topics.length > 0 ? (
                  <div className="space-y-1">
                    <select
                      value={currentTopicId}
                      onChange={(e) => setUserSelectedTopicId(e.target.value)}
                      className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white text-stone-800 cursor-pointer"
                    >
                      {topics.map((t) => (
                        <option key={t.id} value={t.id} disabled={!t.isActive}>
                          {t.title} {!t.isActive ? "(Đã đóng nộp bài)" : ""}
                        </option>
                      ))}
                    </select>
                    {chosenTopic?.description && (
                      <p className="text-[11px] text-stone-500 line-clamp-1 italic px-1">
                        {chosenTopic.description}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    Chưa có chủ đề bài học nào được thiết lập. Thầy/Cô vui lòng tạo chủ đề trước.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] text-xs flex items-center justify-between">
                <span className="text-stone-500">Chủ đề bài học:</span>
                <strong className="text-stone-800 font-semibold">{topicTitle}</strong>
              </div>
            )}

            {!isRevision && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tên bức tranh của em
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng hôn trên dòng sông quê..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                />
              </div>
            )}

            {/* Ô TẢI ẢNH: HỖ TRỢ ĐẦY ĐỦ THƯ VIỆN ẢNH VÀ CHỤP MÁY ẢNH TRÊN ĐIỆN THOẠI */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Ảnh chụp tác phẩm (Vẽ tay hoặc tạo hình)
                </label>
                {previewUrl && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Đã tải ảnh thành công
                  </span>
                )}
              </div>

              <div className="relative border-2 border-dashed border-[#E0D5C3] hover:border-[#C85A32] rounded-2xl p-3.5 sm:p-5 text-center transition-colors bg-[#FAF8F5]/80">
                {previewUrl ? (
                  <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden shadow-xs border border-stone-200 bg-stone-900/5">
                    <Image src={previewUrl} alt="Preview" fill sizes="400px" className="object-contain" />
                    
                    {/* Thanh công cụ đổi ảnh đè trên góc ảnh */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-stone-900/80 via-stone-900/40 to-transparent flex items-center justify-between gap-2">
                      <span className="text-[10.5px] text-white/90 font-medium truncate max-w-[140px] pl-1">
                        Ảnh đã sẵn sàng
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="bg-white/90 hover:bg-white active:scale-95 text-stone-800 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                          title="Chụp lại ảnh khác bằng máy ảnh"
                        >
                          <Camera className="w-3 h-3 text-[#C86446]" />
                          <span>Chụp lại</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="bg-white/90 hover:bg-white active:scale-95 text-stone-800 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                          title="Chọn ảnh khác từ Thư viện"
                        >
                          <ImageIcon className="w-3 h-3 text-[#27445D]" />
                          <span>Thư viện</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : isCompressing ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-8 h-8 text-[#C86446] animate-spin" />
                    <span className="text-xs font-bold text-stone-800">Đang nén &amp; tối ưu hóa ảnh...</span>
                    <span className="text-[10px] text-stone-400">Chuẩn hóa độ phân giải cho Trợ lý AI</span>
                  </div>
                ) : (
                  <div className="py-3 sm:py-5 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#F6EDE8] text-[#C86446] flex items-center justify-center mb-2 shadow-2xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-stone-800">
                      Chọn hình thức tải ảnh bài vẽ
                    </span>
                    <p className="text-[11px] text-stone-500 mt-0.5 max-w-xs leading-relaxed">
                      Chụp trực tiếp bằng camera điện thoại hoặc chọn ảnh có sẵn từ bộ sưu tập
                    </p>

                    {/* 2 NÚT THAO TÁC RÕ RÀNG DÀNH RIÊNG CHO DI ĐỘNG & MÁY TÍNH */}
                    <div className="grid grid-cols-2 gap-2.5 mt-3.5 w-full max-w-xs">
                      {/* Nút 1: Mở Thư Viện Ảnh (Album / Files) */}
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl bg-white border border-[#CFDEE8] hover:border-[#27445D] text-[#27445D] font-bold text-xs shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <ImageIcon className="w-4 h-4 text-[#27445D] shrink-0" />
                        <span>Thư viện ảnh</span>
                      </button>

                      {/* Nút 2: Mở Trực Tiếp Máy Ảnh (Camera) */}
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl bg-[#F6EDE8] border border-[#F3D8CC] hover:border-[#C85A32] text-[#8E431E] font-bold text-xs shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <Camera className="w-4 h-4 text-[#C85A32] shrink-0" />
                        <span>Chụp ảnh ngay</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-stone-400 mt-2.5 font-medium">
                      Hỗ trợ PNG, JPG • Tự động nén chuẩn 1600px nhẹ mượt
                    </span>
                  </div>
                )}

                {/* 1. INPUT ẨN MỞ THƯ VIỆN ẢNH (Không có capture để hệ điều hành mở Thư viện/Album trên điện thoại) */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* 2. INPUT ẨN MỞ MÁY ẢNH (Có capture='environment' để kích hoạt camera sau) */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Ý tưởng hoặc cảm nhận của em (Không bắt buộc)
              </label>
              <textarea
                rows={2}
                placeholder="Chia sẻ ngắn gọn điều em muốn thể hiện qua bài vẽ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all resize-none"
              />
            </div>

            {isSubmitting && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 animate-pulse">
                <RefreshCw className="w-4 h-4 text-amber-700 animate-spin shrink-0" />
                <span>
                  <strong>Trợ lý Gemini AI đang phân tích bài vẽ:</strong> Thẩm định màu sắc, nét vẽ và đối sánh chuẩn Rubric GDPT 2018...
                </span>
              </div>
            )}
          </div>

          {/* 3. THANH FOOTER CỐ ĐỊNH Ở ĐÁY: ĐẢM BẢO LUÔN NHÌN THẤY VÀ BẤM ĐƯỢC 100% */}
          <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-stone-100 bg-[#FAF8F5] flex items-center justify-end gap-2.5 z-10">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!previewUrl || isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B24E28] text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải lên & AI phân tích...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Xác nhận nộp bài</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

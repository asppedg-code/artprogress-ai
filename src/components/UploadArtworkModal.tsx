"use client";

import React, { useState } from "react";
import Image from "next/image";
import { UploadCloud, CheckCircle, RefreshCw } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              {isRevision ? "Nộp bản chỉnh sửa (Hoàn thiện)" : "Nộp bài vẽ mĩ thuật mới"}
            </h3>
            <p className="text-xs text-stone-500">
              {isRevision ? topicTitle : (chosenTopic?.title || topicTitle)}
            </p>
          </div>
          <button
            onClick={handleClose}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Ảnh chụp tác phẩm (Vẽ tay hoặc tạo hình)
            </label>
            <div className="relative border-2 border-dashed border-stone-300 rounded-2xl p-4 text-center hover:border-amber-500 transition-colors bg-stone-50/50">
              {previewUrl ? (
                <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden shadow-xs">
                  <Image src={previewUrl} alt="Preview" fill sizes="400px" className="object-contain" />
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(null)}
                    className="absolute top-2 right-2 bg-stone-900/80 text-white text-[11px] px-2.5 py-1 rounded-md"
                  >
                    Đổi ảnh khác
                  </button>
                </div>
              ) : isCompressing ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-8 h-8 text-[#C86446] animate-spin" />
                  <span className="text-xs font-semibold text-stone-700">Đang tối ưu hóa dung lượng ảnh...</span>
                  <span className="text-[10px] text-stone-400">Chuẩn hóa độ phân giải cho Trợ lý AI</span>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center py-6">
                  <UploadCloud className="w-10 h-10 text-amber-600 mb-2" />
                  <span className="text-xs font-semibold text-stone-800">Chạm để chọn hoặc chụp ảnh</span>
                  <span className="text-[11px] text-stone-400 mt-1">Hỗ trợ ảnh PNG, JPG (tự động nén chuẩn 1600px)</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              )}
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
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all resize-none"
            />
          </div>

          {isSubmitting && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 animate-pulse">
              <RefreshCw className="w-4 h-4 text-amber-700 animate-spin shrink-0" />
              <span>
                <strong>Trợ lý Gemini 3.5 đang thẩm định bức tranh:</strong> Đang phân tích màu sắc, nét vẽ và đối sánh yêu cầu cần đạt của bài học...
              </span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!previewUrl || isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all flex items-center gap-2"
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

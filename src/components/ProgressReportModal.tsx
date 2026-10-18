"use client";

import React from "react";
import Image from "next/image";
import { Printer, X, Award, CheckCircle2, Sliders, User, BookOpen } from "lucide-react";
import { Artwork, Topic } from "@/types/artprogress";
import { APP_VERSION } from "@/config/version";

interface ProgressReportModalProps {
  artwork: Artwork | null;
  topic?: Topic;
  isOpen: boolean;
  onClose: () => void;
}

export function ProgressReportModal({
  artwork,
  topic,
  isOpen,
  onClose,
}: ProgressReportModalProps) {
  if (!isOpen || !artwork) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs print:p-0 print:bg-white print:static print:inset-auto print:block print:w-full print:h-auto report-print-target">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:rounded-none print:overflow-visible print:p-0">
        {/* THANH THAO TÁC TRÊN ĐỈNH (ẨN KHI IN) */}
        <div className="p-4 border-b border-[#F0EBE1] bg-[#FAF8F5] flex items-center justify-between sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C86446]" />
            <h3 className="font-serif font-bold text-sm text-[#1E1C1A]">
              Bản In Báo Cáo Tiến Bộ Sư Phạm (Minh chứng Ngày hội sáng tạo 2026)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-[#C86446] hover:bg-[#B25337] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In báo cáo / Lưu PDF (A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* NỘI DUNG TRANG BÁO CÁO IN KHỔ A4 */}
        <div className="p-8 space-y-6 text-[#1E1C1A] print:p-0 print:text-black">
          {/* TIÊU ĐỀ CHÍNH XUẤT BẢN */}
          <div className="text-center border-b-2 border-stone-800 pb-5 space-y-1">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-stone-500">
              Chương trình Giáo dục Phổ thông 2018 • Môn Mĩ thuật THCS
            </p>
            <h1 className="font-serif text-2xl font-bold tracking-tight uppercase">
              Báo Cáo Đánh Giá Tiến Bộ Sáng Tạo Mĩ Thuật
            </h1>
            <p className="text-xs text-stone-600 italic">
              (Hồ sơ minh chứng ứng dụng Công nghệ số & Trợ lý AI trong dạy học phát triển phẩm chất, năng lực)
            </p>
          </div>

          {/* KHỐI THÔNG TIN HỌC SINH & CHỦ ĐỀ BÀI HỌC */}
          <div className="grid grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DC] print:bg-white print:border-stone-300 text-xs">
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C86446]" />
                <span className="font-semibold text-stone-600">Học sinh:</span>
                <strong className="text-stone-900 text-sm">{artwork.studentName}</strong>
              </p>
              <p className="text-stone-600 pl-5">
                Mã học sinh: <strong>{artwork.studentId}</strong> • Lớp: <strong>{artwork.classId.replace("class_", "").toUpperCase()}</strong>
              </p>
            </div>

            <div className="space-y-1.5 text-right print:text-right">
              <p className="flex items-center justify-end gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#C86446]" />
                <span className="font-semibold text-stone-600">Bài học:</span>
                <strong className="text-stone-900">{topic?.title || "Chủ đề Mĩ thuật THCS"}</strong>
              </p>
              <p className="text-stone-500 text-[11px]">
                Ngày khởi tạo: {new Date(artwork.submittedAt).toLocaleDateString("vi-VN")}
                {artwork.revisedAt && ` • Hoàn thiện: ${new Date(artwork.revisedAt).toLocaleDateString("vi-VN")}`}
              </p>
            </div>
          </div>

          {/* ĐỐI SÁNH TRỰC QUAN TRƯỚC - SAU (BEFORE - AFTER) */}
          <div className="space-y-2">
            <h3 className="font-serif text-sm font-bold flex items-center gap-2 border-l-4 border-[#C86446] pl-2">
              <Sliders className="w-4 h-4 text-[#C86446]" />
              Minh chứng đối sánh hành trình sáng tạo (Before – After)
            </h3>

            <div className="grid grid-cols-2 gap-4 pt-1">
              {/* Bản phác thảo đầu */}
              <div className="border border-stone-200 rounded-2xl p-2.5 bg-stone-50 print:bg-white space-y-2 text-center">
                <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-white border border-stone-200">
                  <Image
                    src={artwork.initialImageUrl}
                    alt="Bản đầu"
                    fill
                    sizes="400px"
                    className="object-contain p-1"
                  />
                </div>
                <div className="text-[11px] font-bold text-[#C86446] uppercase tracking-wider">
                  1. Bản phác thảo ban đầu
                </div>
              </div>

              {/* Bản hoàn thiện sau nhận xét */}
              <div className="border border-stone-200 rounded-2xl p-2.5 bg-stone-50 print:bg-white space-y-2 text-center">
                <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-white border border-stone-200">
                  <Image
                    src={artwork.revisedImageUrl || artwork.initialImageUrl}
                    alt="Bản hoàn thiện"
                    fill
                    sizes="400px"
                    className="object-contain p-1"
                  />
                </div>
                <div className="text-[11px] font-bold text-[#4F6B58] uppercase tracking-wider">
                  2. Bản hoàn thiện tiến bộ
                </div>
              </div>
            </div>
          </div>

          {/* BẢNG ĐIỂM RUBRIC ĐÁNH GIÁ THEO YÊU CẦU CẦN ĐẠT CỦA BÀI HỌC */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-l-4 border-[#C86446] pl-2">
              <h3 className="font-serif text-sm font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C86446]" />
                Đánh giá theo Rubric Yêu cầu cần đạt bài học
              </h3>
              {artwork.feedback?.referenceScore !== undefined && (
                <span className="font-serif font-bold text-sm text-[#C86446]">
                  Điểm tham khảo: {artwork.feedback.referenceScore} / 10
                </span>
              )}
            </div>

            <table className="w-full text-xs border border-stone-300 rounded-xl overflow-hidden">
              <thead className="bg-[#FAF8F5] print:bg-stone-100 text-stone-700 font-bold border-b border-stone-300">
                <tr>
                  <th className="p-2.5 text-left w-1/4">Tiêu chí</th>
                  <th className="p-2.5 text-center w-20">Mức đạt</th>
                  <th className="p-2.5 text-left">Nhận xét điểm mạnh & Gợi ý cải thiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {artwork.feedback?.criteriaReviews.map((crit) => (
                  <tr key={crit.criterionId}>
                    <td className="p-2.5 font-bold text-stone-900 align-top">
                      {crit.criterionName}
                    </td>
                    <td className="p-2.5 text-center align-top">
                      <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-stone-100 text-stone-800 border border-stone-300">
                        {crit.level}
                      </span>
                    </td>
                    <td className="p-2.5 text-stone-700 leading-relaxed align-top">
                      <p>
                        <strong className="text-emerald-700">Ưu điểm:</strong> {crit.strength}
                      </p>
                      <p className="mt-0.5">
                        <strong className="text-[#C86446]">Cải thiện:</strong> {crit.improvement}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* LỜI PHÊ GIÁO VIÊN & NHẬT KÝ TỰ ĐÁNH GIÁ CỦA HỌC SINH */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Lời phê của Giáo viên */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-[#F6EDE8]/40 print:bg-white space-y-2 text-xs">
              <h4 className="font-serif font-bold text-xs text-[#C86446] flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Lời phê sư phạm của Giáo viên
              </h4>
              <p className="text-stone-800 italic leading-relaxed">
                &ldquo;{artwork.feedback?.teacherNotes || artwork.feedback?.overallStrength}&rdquo;
              </p>
              <div className="pt-4 text-right">
                <p className="font-serif font-bold text-stone-900">
                  {artwork.feedback?.reviewedBy || "Giáo viên Mĩ thuật"}
                </p>
                <p className="text-[10px] text-stone-400">Đã kiểm duyệt & xác nhận</p>
              </div>
            </div>

            {/* Góc tự đánh giá của Học sinh */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-[#EDF3EF]/40 print:bg-white space-y-2 text-xs">
              <h4 className="font-serif font-bold text-xs text-[#4F6B58] flex items-center gap-1.5 uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                Nhật ký tự đánh giá của Học sinh
              </h4>
              <p className="text-stone-800 leading-relaxed">
                {artwork.selfReflection?.reflectionText || "Em đã tiếp thu góp ý của cô và thấy tranh của mình tiến bộ rõ rệt ở bản chỉnh sửa."}
              </p>
              <div className="pt-4 text-right">
                <p className="font-serif font-bold text-stone-900">{artwork.studentName}</p>
                <p className="text-[10px] text-stone-400">Học sinh tự phản tỉnh</p>
              </div>
            </div>
          </div>

          {/* CHÂN TRANG BÁO CÁO */}
          <div className="pt-6 border-t border-stone-200 text-center text-[10px] text-stone-400">
            Hệ thống ArtProgress AI v{APP_VERSION} • Ngày hội Giáo viên sáng tạo với Công nghệ số & AI 2026
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  X,
  BookOpen,
  Users,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Artwork, ClassRoom, Student, Topic } from "@/types/artprogress";
import {
  buildTopicGradeSummaryData,
  downloadTopicGradeFile,
} from "@/lib/excel-export";

interface ExportGradeExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  classes: ClassRoom[];
  students: Student[];
  artworks: Artwork[];
  initialTopicId?: string;
  initialClassId?: string;
}

export function ExportGradeExcelModal({
  isOpen,
  onClose,
  topics,
  classes,
  students,
  artworks,
  initialTopicId,
  initialClassId,
}: ExportGradeExcelModalProps) {
  const [userSelectedTopicId, setUserSelectedTopicId] = useState<string | null>(null);
  const [userSelectedClassId, setUserSelectedClassId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<"xls" | "csv">("xls");
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedTopicId = userSelectedTopicId ?? (initialTopicId || topics[0]?.id || "");
  const selectedClassId = userSelectedClassId ?? (initialClassId || classes[0]?.id || "");

  if (!isOpen) return null;

  const currentTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const classStudents = currentClass
    ? students.filter(
        (s) =>
          !s.classId ||
          s.classId === currentClass.id ||
          s.classId.toUpperCase() === currentClass.id.toUpperCase()
      )
    : [];

  const summaryData =
    currentTopic && currentClass
      ? buildTopicGradeSummaryData(currentTopic, currentClass, classStudents, artworks)
      : null;

  const handleClose = () => {
    setUserSelectedTopicId(null);
    setUserSelectedClassId(null);
    setIsSuccess(false);
    onClose();
  };

  const handleDownload = () => {
    if (!currentTopic || !currentClass) return;
    downloadTopicGradeFile(currentTopic, currentClass, classStudents, artworks, exportFormat);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-stone-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EBE1] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#F6EDE8] border border-[#E8D7CF] text-[#C86446] flex items-center justify-center shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 truncate">
                Xuất Bảng Điểm Tổng Hợp (Excel)
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 font-sans truncate">
                Theo dõi &amp; xuất báo cáo kết quả đánh giá GDPT 2018 từng chủ đề theo lớp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NỘI DUNG CUỘN */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs font-sans">
          {/* KHỐI CHỌN CHỦ ĐỀ & LỚP HỌC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Chọn Chủ đề */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#C86446]" />
                <span>Chủ đề bài học:</span>
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setUserSelectedTopicId(e.target.value)}
                className="w-full text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-[#C86446] cursor-pointer font-medium"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} (Khối {t.grade || "?"})
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Lớp học */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#4F6B58]" />
                <span>Lớp học:</span>
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setUserSelectedClassId(e.target.value)}
                className="w-full text-xs bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-[#4F6B58] cursor-pointer font-medium"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.grade ? `Khối ${c.grade}` : ""})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* KHỐI THÔNG TIN TỔNG QUAN XEM TRƯỚC */}
          {summaryData && (
            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EAE5DC] space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#C86446]" />
                  Tổng quan dữ liệu bài nộp
                </span>
                <span className="text-[11px] text-stone-500">
                  {currentTopic?.rubric.length || 0} tiêu chí Rubric
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-white p-2 rounded-xl border border-[#EAE5DC]">
                  <p className="text-[10px] text-stone-500">Sĩ số lớp</p>
                  <p className="text-sm font-bold text-stone-900 mt-0.5">
                    {summaryData.statistics.totalStudents} HS
                  </p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#EAE5DC]">
                  <p className="text-[10px] text-emerald-700">Đã nộp bài</p>
                  <p className="text-sm font-bold text-emerald-800 mt-0.5">
                    {summaryData.statistics.submittedCount} ({summaryData.statistics.submittedPercent}%)
                  </p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#EAE5DC]">
                  <p className="text-[10px] text-amber-700">Chưa nộp</p>
                  <p className="text-sm font-bold text-amber-800 mt-0.5">
                    {summaryData.statistics.unsubmittedCount} ({summaryData.statistics.unsubmittedPercent}%)
                  </p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#EAE5DC]">
                  <p className="text-[10px] text-[#C86446]">Điểm trung bình</p>
                  <p className="text-sm font-bold text-[#C86446] mt-0.5">
                    {summaryData.statistics.averageScore !== null
                      ? `${summaryData.statistics.averageScore}/10`
                      : "Chưa có"}
                  </p>
                </div>
              </div>

              {/* Phân bổ xếp loại */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[11px] text-stone-600">
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-medium">
                  Xuất sắc: {summaryData.statistics.gradeCount.xuatSac} ({summaryData.statistics.gradePercent.xuatSac}%)
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium">
                  Tốt: {summaryData.statistics.gradeCount.tot} ({summaryData.statistics.gradePercent.tot}%)
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-medium">
                  Đạt: {summaryData.statistics.gradeCount.dat} ({summaryData.statistics.gradePercent.dat}%)
                </span>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-medium">
                  Chưa đạt: {summaryData.statistics.gradeCount.chuaDat} ({summaryData.statistics.gradePercent.chuaDat}%)
                </span>
              </div>
            </div>
          )}

          {/* CHỌN ĐỊNH DẠNG TẢI VỀ */}
          <div className="space-y-2">
            <label className="font-bold text-stone-700 block">Định dạng tệp xuất ra:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  exportFormat === "xls"
                    ? "bg-[#FAF8F5] border-[#C86446] ring-1 ring-[#C86446]/20 shadow-xs"
                    : "bg-white border-[#EAE5DC] hover:border-stone-300"
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value="xls"
                  checked={exportFormat === "xls"}
                  onChange={() => setExportFormat("xls")}
                  className="mt-0.5 text-[#C86446] focus:ring-[#C86446]"
                />
                <div className="min-w-0">
                  <p className="font-bold text-stone-900 flex items-center gap-1.5">
                    <span>Excel Bảng Tính (.xls)</span>
                    <span className="text-[10px] bg-[#C86446] text-white px-1.5 py-0.2 rounded font-semibold">
                      Khuyên dùng
                    </span>
                  </p>
                  <p className="text-[10.5px] text-stone-500 mt-0.5">
                    Đầy đủ tiêu đề, màu sắc nhận diện mức đạt GDPT 2018, kẻ khung viền và khối thống kê chân bảng.
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  exportFormat === "csv"
                    ? "bg-[#FAF8F5] border-[#C86446] ring-1 ring-[#C86446]/20 shadow-xs"
                    : "bg-white border-[#EAE5DC] hover:border-stone-300"
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={exportFormat === "csv"}
                  onChange={() => setExportFormat("csv")}
                  className="mt-0.5 text-[#C86446] focus:ring-[#C86446]"
                />
                <div className="min-w-0">
                  <p className="font-bold text-stone-900">Tệp CSV UTF-8 (.csv)</p>
                  <p className="text-[10.5px] text-stone-500 mt-0.5">
                    Mở nhanh trên mọi phần mềm bảng tính (Excel, Google Sheets, vnEdu) có gắn BOM tiếng Việt.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* THÔNG BÁO THÀNH CÔNG */}
          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã tải xuống bảng điểm thành công! Vui lòng kiểm tra thư mục Downloads trên máy bạn.</span>
            </div>
          )}
        </div>

        {/* NÚT THAO TÁC Ở CHÂN MODAL */}
        <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between gap-2 shrink-0">
          <p className="text-[11px] text-stone-400 italic hidden sm:block">
            * Minh chứng kết quả đánh giá theo Thông tư 22/2021/TT-BGDĐT
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-600 text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-[#C86446] hover:bg-[#B25337] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Tải file {exportFormat.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

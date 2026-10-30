import React from "react";
import { ArtworkFeedback } from "@/types/artprogress";
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, Award } from "lucide-react";

interface FeedbackCardProps {
  feedback: ArtworkFeedback;
  isTeacherView?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
}

export function FeedbackCard({
  feedback,
  isTeacherView = false,
  onApprove,
  onReject,
  onEdit,
}: FeedbackCardProps) {
  const isPending = feedback.status === "pending_moderation";

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden transition-all">
      {/* Header trạng thái */}
      <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-900">
              {isPending ? "Gợi ý nháp từ AI (Chờ giáo viên duyệt)" : "Nhận xét & Đánh giá chuyên môn"}
            </h4>
            <p className="text-[11px] text-stone-500">
              {feedback.reviewedBy ? `Đã duyệt bởi: ${feedback.reviewedBy}` : "Dựa theo Yêu cầu cần đạt GDPT 2018"}
            </p>
          </div>
        </div>

        {feedback.referenceScore !== undefined && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              feedback.referenceScore > 0
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>
              {feedback.referenceScore > 0
                ? `Điểm tham khảo: ${feedback.referenceScore}/10`
                : "Chưa chấm điểm (Ảnh không hợp lệ)"}
            </span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Điểm mạnh chung hoặc Lưu ý hình ảnh */}
        <div
          className={`border rounded-xl p-4 ${
            feedback.referenceScore === 0
              ? "bg-rose-50/70 border-rose-200"
              : "bg-emerald-50/70 border-emerald-100"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.referenceScore === 0 ? (
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p
                className={`text-xs font-semibold mb-0.5 ${
                  feedback.referenceScore === 0 ? "text-rose-900" : "text-emerald-900"
                }`}
              >
                {feedback.referenceScore === 0 ? "Thẩm định hình ảnh bài vẽ" : "Điểm nổi bật của tác phẩm"}
              </p>
              <p
                className={`text-xs leading-relaxed ${
                  feedback.referenceScore === 0 ? "text-rose-800" : "text-emerald-800"
                }`}
              >
                {feedback.overallStrength}
              </p>
            </div>
          </div>
        </div>

        {/* Lời nhắn riêng của giáo viên (nếu có) */}
        {feedback.teacherNotes && (
          <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-900 mb-1">Lời nhắn từ Giáo viên:</p>
            <p className="text-xs text-amber-800 leading-relaxed italic">&ldquo;{feedback.teacherNotes}&rdquo;</p>
          </div>
        )}

        {/* Chi tiết từng tiêu chí Rubric */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider">Đánh giá theo tiêu chí Rubric</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {feedback.criteriaReviews.map((crit) => (
              <div
                key={crit.criterionId}
                className="p-3.5 rounded-xl border border-stone-200/70 bg-stone-50/30 space-y-2 hover:bg-stone-50/80 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-800 leading-snug">{crit.criterionName}</span>
                  <span
                    className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      crit.level === "Xuất sắc"
                        ? "bg-purple-100 text-purple-700"
                        : crit.level === "Tốt"
                        ? "bg-blue-100 text-blue-700"
                        : crit.level === "Đạt"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {crit.level}
                  </span>
                </div>
                <div className="text-[11px] space-y-1.5 text-stone-600">
                  <p>
                    <strong className="text-emerald-700 font-medium">Ưu điểm:</strong> {crit.strength}
                  </p>
                  <p>
                    <strong className="text-amber-700 font-medium">Lưu ý:</strong> {crit.improvement}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Các hành động thực hành tiếp theo */}
        {feedback.actionableNextSteps && feedback.actionableNextSteps.length > 0 && (
          <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-sky-950 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
              Hành động thực hành tiếp theo dành cho học sinh:
            </p>
            <ul className="text-xs text-sky-900 space-y-1.5 pl-4 list-disc marker:text-sky-500">
              {feedback.actionableNextSteps.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bảng điều khiển dành riêng cho giáo viên khi duyệt */}
        {isTeacherView && isPending && (
          <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-amber-50/40 -mx-5 -mb-5 p-4">
            <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Bản nháp này chưa gửi tới học sinh. Thầy/cô vui lòng kiểm tra trước khi duyệt.</span>
            </div>
            <div className="flex items-center gap-2">
              {onReject && (
                <button
                  type="button"
                  onClick={onReject}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Từ chối
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="px-3.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
                >
                  Sửa lời phê
                </button>
              )}
              {onApprove && (
                <button
                  type="button"
                  onClick={onApprove}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Phê duyệt & Phát hành
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

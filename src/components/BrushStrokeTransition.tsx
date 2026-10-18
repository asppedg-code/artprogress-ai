"use client";

import React, { useEffect } from "react";
import { Palette, Sparkles } from "lucide-react";
import { APP_VERSION } from "@/config/version";

export interface BrushStrokeTransitionProps {
  onSwap: () => void;
  onComplete: () => void;
}

/**
 * Hiệu ứng chuyển cảnh vệt cọ vẽ nghệ thuật (Artistic Brush Stroke Wipe)
 * Tông màu chủ đạo: #C4572F (Sơn son đất nung / Terracotta Atelier)
 * Chuyển động: Trượt dứt khoát từ phải sang trái che phủ toàn màn hình,
 * sau đó trượt về để hé lộ giao diện xưởng vẽ chính.
 * Tối ưu hóa 100% bằng CSS GPU Keyframes, không gây render lặp.
 */
export function BrushStrokeTransition({
  onSwap,
  onComplete,
}: BrushStrokeTransitionProps) {
  useEffect(() => {
    // 1. Kích hoạt đổi giao diện (onSwap) ngay tại điểm che phủ toàn màn hình (giai đoạn 1 kết thúc ở 500ms = 0.5s)
    const swapTimer = setTimeout(() => {
      onSwap();
    }, 500);

    // 2. Kích hoạt kết thúc chuyển cảnh khi toàn bộ 3 giai đoạn hoàn tất (500ms + 800ms + 500ms = 1800ms)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(completeTimer);
    };
  }, [onSwap, onComplete]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] pointer-events-auto select-none overflow-hidden"
    >
      <style>{`
        /* Chuyển động vệt cọ vẽ theo 3 giai đoạn:
           - Giai đoạn 1 (0% -> 27.78%, tức 0.5s): Quét dứt khoát từ phải sang trái che phủ toàn màn hình
           - Giai đoạn 2 (27.78% -> 72.22%, tức 0.8s): Giữ nguyên trạng thái phủ kín, hiển thị dấu ấn xưởng vẽ
           - Giai đoạn 3 (72.22% -> 100%, tức 0.5s): Trượt về lại bên phải để hé lộ giao diện chính
        */
        @keyframes brushSweepAndRetreat {
          0% {
            transform: translate3d(calc(100% + 180px), 0, 0);
            animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          }
          27.78% {
            transform: translate3d(0, 0, 0);
            animation-timing-function: linear;
          }
          72.22% {
            transform: translate3d(0, 0, 0);
            animation-timing-function: cubic-bezier(0.7, 0, 0.2, 1);
          }
          100% {
            transform: translate3d(calc(100% + 180px), 0, 0);
          }
        }

        .animate-brush-sweep {
          animation: brushSweepAndRetreat 1800ms forwards;
        }

        /* Dấu ấn xưởng vẽ xuất hiện nổi bật trong giai đoạn 2 (0.8s) khi màn hình đang được phủ kín */
        @keyframes atelierEmblemPop {
          0%, 22% {
            opacity: 0;
            transform: scale(0.92);
          }
          27.78% {
            opacity: 1;
            transform: scale(1);
          }
          68% {
            opacity: 1;
            transform: scale(1);
          }
          72.22%, 100% {
            opacity: 0;
            transform: scale(0.96);
          }
        }

        .animate-emblem-pop {
          animation: atelierEmblemPop 1800ms forwards;
        }

        /* Vân vệt cọ vẽ ngang chạy dọc thân dải sơn */
        .brush-bristle-texture {
          background-image: repeating-linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.05) 0px,
            rgba(255, 255, 255, 0.05) 2px,
            transparent 2px,
            transparent 16px,
            rgba(0, 0, 0, 0.06) 16px,
            rgba(0, 0, 0, 0.06) 18px,
            transparent 18px,
            transparent 32px
          );
        }

        /* Vệt sáng bóng của sơn ướt quét qua */
        .brush-sheen-sweep {
          background: linear-gradient(
            115deg,
            transparent 20%,
            rgba(255, 255, 255, 0.16) 45%,
            rgba(255, 255, 255, 0.24) 50%,
            rgba(255, 255, 255, 0.16) 55%,
            transparent 80%
          );
          transform: skewX(-20deg);
        }
      `}</style>

      {/* DẢI CỌ VẼ CHÍNH: Rộng bằng toàn màn hình + 180px cho đầu lông cọ */}
      <div className="absolute top-0 bottom-0 right-0 w-[calc(100vw+180px)] h-full will-change-transform animate-brush-sweep">
        {/* 1. ĐẦU LÔNG CỌ VẼ HÌNH THÁI MỸ THUẬT (SVG LEADING BRISTLE EDGE) */}
        <div className="absolute top-0 bottom-0 left-0 w-[180px] h-full pointer-events-none">
          <svg
            className="w-full h-full overflow-visible drop-shadow-[-12px_0_16px_rgba(0,0,0,0.18)]"
            viewBox="0 0 180 1000"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Gradient sơn son chuyển màu có chiều sâu */}
              <linearGradient id="brushEdgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C4572F" />
                <stop offset="50%" stopColor="#C4572F" />
                <stop offset="100%" stopColor="#C4572F" />
              </linearGradient>

              {/* Lớp bóng viền sơn ướt */}
              <linearGradient id="brushHighlightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E2744C" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#C4572F" stopOpacity="0" />
              </linearGradient>

              {/* Lớp bóng sâu chân cọ */}
              <linearGradient id="brushShadowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9C3A18" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#C4572F" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Lớp lông cọ tối (Tạo độ dày khối sơn dầu) */}
            <path
              d="
                M 180 0
                L 140 0
                C 120 30, 70 50, 50 85
                C 30 115, 60 135, 110 150
                C 140 165, 120 190, 45 220
                C 10 240, 20 270, 95 295
                C 150 315, 110 350, 60 380
                C 25 405, 30 435, 90 460
                C 140 480, 80 515, 20 540
                C 2 560, 20 590, 105 615
                C 160 635, 120 670, 55 695
                C 20 715, 40 750, 110 775
                C 160 795, 100 830, 45 860
                C 15 885, 30 920, 100 945
                C 140 965, 150 990, 130 1000
                L 180 1000
                Z
              "
              fill="url(#brushShadowGrad)"
            />

            {/* Lớp thân cọ chính #C4572F với các múi tơ cọ tự nhiên */}
            <path
              d="
                M 180 0
                L 130 0
                C 110 25, 45 45, 30 75
                C 15 100, 40 120, 85 135
                C 130 150, 150 165, 115 185
                C 70 205, 15 225, 8 250
                C 0 275, 40 290, 100 305
                C 145 320, 135 345, 75 365
                C 30 385, 45 415, 90 435
                C 130 455, 140 475, 50 495
                C 10 510, 0 535, 0 555
                C 0 575, 50 595, 110 610
                C 150 625, 135 650, 65 670
                C 25 690, 30 720, 85 740
                C 125 755, 145 775, 40 800
                C 15 815, 25 840, 80 860
                C 125 880, 135 905, 55 930
                C 30 945, 60 975, 115 990
                C 145 995, 155 1000, 140 1000
                L 180 1000
                Z
              "
              fill="url(#brushEdgeGrad)"
            />

            {/* Lớp highlight đầu ngọn cọ bắt sáng (#E2744C) */}
            <path
              d="
                M 180 0
                L 150 0
                C 130 30, 80 50, 65 80
                C 50 105, 70 120, 105 135
                C 140 150, 120 175, 70 200
                C 40 220, 35 245, 60 265
                C 90 280, 120 300, 95 320
                C 70 335, 65 360, 100 380
                C 130 400, 120 425, 75 445
                C 45 465, 30 490, 40 515
                C 50 535, 75 550, 115 565
                C 140 580, 120 605, 85 625
                C 60 645, 50 670, 95 690
                C 130 705, 120 730, 65 750
                C 35 770, 45 795, 90 815
                C 120 830, 130 855, 75 875
                C 50 895, 70 920, 110 940
                C 140 960, 150 980, 160 1000
                L 180 1000
                Z
              "
              fill="url(#brushHighlightGrad)"
            />

            {/* Những sợi lông cọ vút nhọn văng ra phía trước */}
            <line x1="8" y1="250" x2="-26" y2="250" stroke="#C4572F" strokeWidth="3" strokeLinecap="round" />
            <line x1="0" y1="555" x2="-36" y2="555" stroke="#C4572F" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="40" y1="800" x2="-18" y2="800" stroke="#C4572F" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="75" x2="-15" y2="75" stroke="#C4572F" strokeWidth="2" strokeLinecap="round" />
            <line x1="55" y1="930" x2="8" y2="930" stroke="#C4572F" strokeWidth="2" strokeLinecap="round" />

            {/* Giọt bắn sơn nghệ thuật ngẫu nhiên phía đầu cọ */}
            <circle cx="-38" cy="254" r="3.5" fill="#C4572F" />
            <circle cx="-28" cy="542" r="4.5" fill="#C4572F" />
            <circle cx="-48" cy="565" r="2.5" fill="#E2744C" />
            <circle cx="-30" cy="804" r="3" fill="#C4572F" />
            <circle cx="-16" cy="390" r="2.5" fill="#C4572F" />
            <circle cx="-24" cy="680" r="3" fill="#C4572F" />
          </svg>
        </div>

        {/* 2. THÂN DẢI SƠN ĐẶC #C4572F PHỦ KÍN TOÀN BỘ PHẦN CÒN LẠI */}
        <div
          className="absolute top-0 bottom-0 right-0 left-[178px] bg-[#C4572F] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #CF5E35 0%, #C4572F 45%, #B44A24 100%)",
          }}
        >
          {/* Lớp vân tơ cọ vẽ */}
          <div className="absolute inset-0 brush-bristle-texture opacity-60" />

          {/* Vệt bóng lướt nhẹ */}
          <div className="absolute inset-0 brush-sheen-sweep opacity-70" />

          {/* Họa tiết phác họa chìm tinh tế */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08)_0%,transparent_70%)]" />

          {/* 3. DẤU ẤN NGHỆ THUẬT XƯỞNG VẼ (ATELIER SEAL) XUẤT HIỆN TẠI ĐỈNH ĐIỂM */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-emblem-pop">
            <div className="w-16 h-16 rounded-2xl bg-white/12 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-2xl mb-3">
              <Palette className="w-8 h-8 text-[#FFF2E0]" />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide drop-shadow-md">
                ArtProgress
              </span>
              <span className="text-[10px] bg-white/20 text-[#FFF2E0] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border border-white/20">
                AI &bull; v{APP_VERSION}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#FFEAD4]/90 font-medium tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#FAD5A5]" />
              <span>Mĩ thuật tiến bộ số</span>
              <Sparkles className="w-3.5 h-3.5 text-[#FAD5A5]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

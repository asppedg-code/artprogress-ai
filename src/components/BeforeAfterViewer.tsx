"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

interface BeforeAfterViewerProps {
  initialImageUrl: string;
  revisedImageUrl?: string;
  initialLabel?: string;
  revisedLabel?: string;
}

export function BeforeAfterViewer({
  initialImageUrl,
  revisedImageUrl,
  initialLabel = "Bản đầu (Phác thảo)",
  revisedLabel = "Bản hoàn thiện",
}: BeforeAfterViewerProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [mode, setMode] = useState<"slider" | "side_by_side">("slider");
  const [fitMode, setFitMode] = useState<"contain" | "cover">("contain");

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Đo đạc chính xác kích thước container để cố định khung hiển thị cho cả 2 ảnh
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  useEffect(() => {
    updateDimensions();

    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });
    observer.observe(el);

    window.addEventListener("resize", updateDimensions);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [updateDimensions, mode]);

  if (!revisedImageUrl) {
    return (
      <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-[#EAE5DC] bg-[#1E1C1A] shadow-xs flex items-center justify-center">
        <Image
          src={initialImageUrl}
          alt={initialLabel}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={fitMode === "contain" ? "object-contain p-2" : "object-cover"}
        />
        <div className="absolute bottom-3 left-3 bg-[#1E1C1A]/85 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full font-medium border border-white/10">
          {initialLabel}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-2">
      {/* Nút chuyển chế độ xem & tỷ lệ */}
      <div className="flex items-center justify-between text-xs text-stone-600 px-0.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C86446]"></span>
            Đối sánh tiến trình
          </span>

          {/* Nút chuyển kiểu căn vừa ảnh */}
          <div className="flex bg-[#F0EBE1] p-0.5 rounded-md border border-[#E2DBD0] text-[9.5px]">
            <button
              type="button"
              onClick={() => setFitMode("contain")}
              className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                fitMode === "contain" ? "bg-white text-stone-900 font-bold shadow-xs" : "text-stone-500 hover:text-stone-900"
              }`}
              title="Chứa trọn vẹn bức tranh (không bị cắt viền)"
            >
              Vừa khung
            </button>
            <button
              type="button"
              onClick={() => setFitMode("cover")}
              className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                fitMode === "cover" ? "bg-white text-stone-900 font-bold shadow-xs" : "text-stone-500 hover:text-stone-900"
              }`}
              title="Lấp đầy khung quan sát"
            >
              Lấp đầy
            </button>
          </div>
        </div>

        <div className="flex bg-[#F0EBE1] p-0.5 rounded-lg border border-[#E2DBD0] text-[10px]">
          <button
            type="button"
            onClick={() => setMode("slider")}
            className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
              mode === "slider"
                ? "bg-white text-stone-900 font-bold shadow-xs"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Thanh trượt
          </button>
          <button
            type="button"
            onClick={() => setMode("side_by_side")}
            className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
              mode === "side_by_side"
                ? "bg-white text-stone-900 font-bold shadow-xs"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Song song
          </button>
        </div>
      </div>

      {mode === "slider" ? (
        <div
          ref={containerRef}
          className="relative flex-1 min-h-[280px] w-full rounded-xl overflow-hidden select-none border border-[#EAE5DC] bg-[#1E1C1A] shadow-xs"
        >
          {/* LỚP 1: ẢNH HOÀN THIỆN (NẰM DƯỚI TOÀN BỘ) */}
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={revisedImageUrl}
              alt={revisedLabel}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={fitMode === "contain" ? "object-contain p-1" : "object-cover"}
              priority
            />
          </div>
          <div className="absolute top-2.5 right-2.5 bg-[#4F6B58]/90 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs z-10 pointer-events-none">
            {revisedLabel}
          </div>

          {/* LỚP 2: ẢNH PHÁC THẢO (BỊ CẮT THEO % THANH TRƯỢT) */}
          {/* QUAN TRỌNG: Khung con bên trong phải có kích thước ĐÚNG BẰNG 100% container cha để không bị co méo hoặc lệch tâm */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden z-10"
            style={{ width: `${sliderPosition}%` }}
          >
            <div
              style={{
                width: dimensions.width > 0 ? `${dimensions.width}px` : "100%",
                height: dimensions.height > 0 ? `${dimensions.height}px` : "100%",
                position: "relative",
              }}
            >
              <Image
                src={initialImageUrl}
                alt={initialLabel}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={fitMode === "contain" ? "object-contain p-1" : "object-cover"}
                priority
              />
            </div>
            <div className="absolute top-2.5 left-2.5 bg-[#C86446]/90 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs pointer-events-none">
              {initialLabel}
            </div>
          </div>

          {/* VẠCH CHIA THANH TRƯỢT TAO NHÃ */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)] z-20 pointer-events-none flex items-center justify-center"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-7 h-7 -ml-3.5 bg-white rounded-full shadow-lg border border-stone-200 flex items-center justify-center text-stone-700 text-xs font-bold transition-transform">
              ↔
            </div>
          </div>

          {/* RANGE INPUT CHO PHÉP KÉO TRƯỢT TƯƠNG TÁC */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 m-0"
            aria-label="Thanh trượt so sánh trước sau"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 flex-1 min-h-[280px]">
          <div className="relative rounded-xl overflow-hidden border border-[#EAE5DC] bg-[#1E1C1A] shadow-xs">
            <Image
              src={initialImageUrl}
              alt={initialLabel}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={fitMode === "contain" ? "object-contain p-1" : "object-cover"}
            />
            <div className="absolute bottom-2 left-2 bg-[#C86446]/90 text-white text-[9px] px-2 py-0.5 rounded font-medium shadow-xs">
              {initialLabel}
            </div>
          </div>
          <div className="relative rounded-xl overflow-hidden border border-[#EAE5DC] bg-[#1E1C1A] shadow-xs">
            <Image
              src={revisedImageUrl}
              alt={revisedLabel}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={fitMode === "contain" ? "object-contain p-1" : "object-cover"}
            />
            <div className="absolute bottom-2 left-2 bg-[#4F6B58]/90 text-white text-[9px] px-2 py-0.5 rounded font-medium shadow-xs">
              {revisedLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";

export function ArtistPaintingAnimation() {
  return (
    <div className="relative w-full max-w-[440px] mx-auto flex flex-col items-center justify-center select-none pointer-events-none">
      <style>{`
        /* Chuyển động cánh tay cầm cọ vẽ của họa sĩ */
        @keyframes artistBrushMove {
          0%, 100% {
            transform: rotate(0deg) translate(0px, 0px);
          }
          25% {
            transform: rotate(-14deg) translate(-6px, -4px);
          }
          50% {
            transform: rotate(4deg) translate(4px, 2px);
          }
          75% {
            transform: rotate(-8deg) translate(-2px, -8px);
          }
        }

        /* Nét vẽ màu nước sống động loang trên khung tranh */
        @keyframes canvasStrokeBloom {
          0% {
            stroke-dashoffset: 260;
            opacity: 0.3;
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: -260;
            opacity: 0.3;
          }
        }

        /* Hạt sáng & bụi màu lấp lánh bay lên từ đầu cọ */
        @keyframes pigmentSparkle {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-24px) scale(1.1);
            opacity: 0;
          }
        }

        /* Khung tranh thở nhẹ nhàng */
        @keyframes easelFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .anim-brush-arm {
          transform-origin: 228px 172px;
          animation: artistBrushMove 2.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }

        .anim-paint-line-1 {
          stroke-dasharray: 260;
          animation: canvasStrokeBloom 5s ease-in-out infinite;
        }

        .anim-paint-line-2 {
          stroke-dasharray: 200;
          animation: canvasStrokeBloom 4.2s ease-in-out 1.2s infinite;
        }

        .anim-easel-subtle {
          animation: easelFloat 6s ease-in-out infinite;
        }

        .sparkle-float-1 {
          animation: pigmentSparkle 2.8s ease-in-out infinite;
        }
        .sparkle-float-2 {
          animation: pigmentSparkle 3.2s ease-in-out 1s infinite;
        }
        .sparkle-float-3 {
          animation: pigmentSparkle 2.4s ease-in-out 1.8s infinite;
        }
      `}</style>

      {/* SVG MINH HỌA HỌA SĨ ĐANG VẼ TRANH TRÊN GIÁ VẼ */}
      <div className="relative w-full aspect-[4/3] flex items-center justify-center anim-easel-subtle">
        <svg
          viewBox="0 0 400 320"
          className="w-full h-full drop-shadow-[0_12px_24px_rgba(30,28,26,0.1)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradient màu gỗ giá vẽ */}
            <linearGradient id="woodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D89A68" />
              <stop offset="100%" stopColor="#A86A3E" />
            </linearGradient>

            {/* Gradient khung canvas trắng kem */}
            <linearGradient id="canvasGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F8F3EA" />
            </linearGradient>

            {/* Gradient áo họa sĩ */}
            <linearGradient id="smockGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3A6B88" />
              <stop offset="100%" stopColor="#224A62" />
            </linearGradient>

            {/* Gradient mũ nồi họa sĩ Terracotta */}
            <linearGradient id="beretGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D9663D" />
              <stop offset="100%" stopColor="#A84320" />
            </linearGradient>

            {/* Gradient vệt màu vẽ hoàng hôn trên tranh */}
            <linearGradient id="skyArtGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F9D488" />
              <stop offset="50%" stopColor="#F49E62" />
              <stop offset="100%" stopColor="#7DAE94" />
            </linearGradient>

            {/* Vệt màu nước đang vẽ */}
            <linearGradient id="strokeGradientBlue" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1E88E5" />
              <stop offset="50%" stopColor="#26C6DA" />
              <stop offset="100%" stopColor="#FFB300" />
            </linearGradient>

            {/* Bóng đổ chân giá vẽ */}
            <radialGradient id="shadowGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(40, 30, 20, 0.18)" />
              <stop offset="100%" stopColor="rgba(40, 30, 20, 0)" />
            </radialGradient>
          </defs>

          {/* 1. BÓNG ĐỔ DƯỚI SÀN */}
          <ellipse cx="145" cy="295" rx="100" ry="12" fill="url(#shadowGradient)" />
          <ellipse cx="270" cy="292" rx="45" ry="9" fill="url(#shadowGradient)" />

          {/* ===================================================================
              2. GIÁ VẼ (WOODEN TRIPOD EASEL)
              =================================================================== */}
          {/* Chân sau giá vẽ */}
          <line x1="145" y1="40" x2="145" y2="295" stroke="url(#woodGradient)" strokeWidth="9" strokeLinecap="round" />

          {/* Hai chân trước giá vẽ */}
          <line x1="145" y1="40" x2="65" y2="295" stroke="url(#woodGradient)" strokeWidth="10" strokeLinecap="round" />
          <line x1="145" y1="40" x2="220" y2="295" stroke="url(#woodGradient)" strokeWidth="10" strokeLinecap="round" />

          {/* Thanh đỡ ngang bên dưới */}
          <rect x="52" y="196" width="180" height="12" rx="4" fill="url(#woodGradient)" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.15))" />

          {/* Núm vặn điều chỉnh giá vẽ */}
          <circle cx="145" cy="202" r="5" fill="#7A4B29" />
          <circle cx="145" cy="48" r="7" fill="#7A4B29" />

          {/* ===================================================================
              3. KHUNG TRANH VẼ (CANVAS BOARD & ARTWORK IN PROGRESS)
              =================================================================== */}
          <g filter="drop-shadow(0 6px 12px rgba(35,25,15,0.12))">
            {/* Khung tranh nền */}
            <rect x="68" y="72" width="150" height="124" rx="8" fill="url(#canvasGradient)" stroke="#E5DEC9" strokeWidth="3" />

            {/* Bức tranh phong cảnh đang vẽ dở bên trong canvas */}
            <rect x="74" y="78" width="138" height="112" rx="5" fill="#FAF6EE" />

            {/* NÉT CỌ ĐANG VẼ ĐỘNG (ANIMATED BRUSHSTROKES ON CANVAS) */}
            <path
              d="M85 140 C110 110, 140 160, 175 130"
              stroke="url(#strokeGradientBlue)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              className="anim-paint-line-1"
            />
            <path
              d="M100 160 C125 145, 150 170, 195 150"
              stroke="#D9663D"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
              className="anim-paint-line-2"
            />

            {/* Chiếc kẹp giữ tranh phía trên */}
            <rect x="135" y="66" width="20" height="12" rx="3" fill="#8D572F" />
          </g>

          {/* ===================================================================
              4. GHẾ NGỒI XƯỞNG VẼ CỦA HỌA SĨ
              =================================================================== */}
          <ellipse cx="270" cy="226" rx="28" ry="8" fill="#B27A4E" />
          <line x1="250" y1="228" x2="244" y2="290" stroke="#8D572F" strokeWidth="5" strokeLinecap="round" />
          <line x1="290" y1="228" x2="296" y2="290" stroke="#8D572F" strokeWidth="5" strokeLinecap="round" />
          <line x1="270" y1="230" x2="270" y2="288" stroke="#8D572F" strokeWidth="4" strokeLinecap="round" />

          {/* ===================================================================
              5. HỌA SĨ (THE ARTIST)
              =================================================================== */}
          <g>
            {/* Chân & Quần họa sĩ */}
            <path d="M255 220 L248 275 L236 277" stroke="#2B3E4F" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M272 220 L275 275 L288 277" stroke="#2B3E4F" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* Giày da nâu */}
            <ellipse cx="233" cy="279" rx="8" ry="4" fill="#6A3B18" />
            <ellipse cx="292" cy="279" rx="8" ry="4" fill="#6A3B18" />

            {/* Thân áo họa sĩ (Art Smock) */}
            <path
              d="M246 160 C246 150, 280 150, 284 160 L288 224 C288 230, 244 230, 244 224 Z"
              fill="url(#smockGradient)"
              filter="drop-shadow(0 3px 6px rgba(0,0,0,0.1))"
            />
            {/* Dây tạp dề & cổ áo */}
            <path d="M255 156 L265 180 L275 156" stroke="#F5EFE6" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* BẢNG PHA MÀU TRÊN TAY TRÁI (PALETTE IN LEFT HAND) */}
            <g transform="translate(230, 185) rotate(-10)">
              {/* Bảng gỗ hình quả thận */}
              <path
                d="M10 20 C5 10, 25 -5, 42 6 C55 15, 52 35, 36 38 C28 40, 24 30, 16 32 C10 34, 12 25, 10 20 Z"
                fill="#DEB887"
                stroke="#C49B68"
                strokeWidth="2"
                filter="drop-shadow(0 3px 4px rgba(0,0,0,0.15))"
              />
              {/* Lỗ xỏ ngón tay cái */}
              <ellipse cx="22" cy="28" rx="3.5" ry="4.5" fill="#F8F3EA" />
              {/* Các giọt màu sơn trên bảng màu */}
              <circle cx="20" cy="10" r="3.2" fill="#E53935" />
              <circle cx="30" cy="10" r="3.2" fill="#FDD835" />
              <circle cx="40" cy="16" r="3.2" fill="#1E88E5" />
              <circle cx="42" cy="26" r="3" fill="#43A047" />
              <circle cx="35" cy="32" r="2.8" fill="#FFFFFF" />
            </g>
            {/* Cánh tay trái ôm bảng màu */}
            <path d="M248 160 C240 178, 236 194, 244 204" stroke="#F5CBA7" strokeWidth="7" strokeLinecap="round" fill="none" />

            {/* Đầu & Khuôn mặt họa sĩ */}
            <circle cx="262" cy="130" r="17" fill="#F5CBA7" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))" />
            {/* Tóc */}
            <path d="M248 126 C248 116, 274 114, 277 125 C272 128, 266 122, 252 127 Z" fill="#4A2E18" />
            {/* Mắt đang nhìn chăm chú bức tranh & miệng cười nhẹ */}
            <circle cx="254" cy="129" r="2" fill="#2C1D11" />
            <path d="M251 137 Q254 141, 258 138" stroke="#A85A32" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="251" cy="134" r="2.5" fill="#FF8A80" opacity="0.5" />

            {/* MŨ NỒI HỌA SĨ (FRENCH ARTIST BERET) */}
            <path
              d="M244 122 C244 108, 278 104, 282 118 C284 125, 246 127, 244 122 Z"
              fill="url(#beretGradient)"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
            />
            {/* Cuống mũ nồi nhỏ đặc trưng */}
            <path d="M263 108 L263 103" stroke="#A84320" strokeWidth="2.5" strokeLinecap="round" />

            {/* =================================================================
                CÁNH TAY CẦM CỌ VẼ CHUYỂN ĐỘNG ĐỘNG (ANIMATED RIGHT ARM & BRUSH)
                ================================================================= */}
            <g className="anim-brush-arm">
              {/* Bắp tay */}
              <path d="M260 166 C242 168, 226 172, 215 165" stroke="#3A6B88" strokeWidth="9" strokeLinecap="round" fill="none" />
              {/* Cẳng tay */}
              <path d="M216 166 L195 158" stroke="#F5CBA7" strokeWidth="6.5" strokeLinecap="round" fill="none" />
              {/* Bàn tay */}
              <circle cx="193" cy="157" r="4.5" fill="#F5CBA7" />
              {/* Cán bút lông vẽ gỗ */}
              <line x1="202" y1="168" x2="168" y2="140" stroke="#8D572F" strokeWidth="3" strokeLinecap="round" />
              {/* Đầu kim loại giữ lông cọ */}
              <line x1="172" y1="143" x2="167" y2="139" stroke="#B0BEC5" strokeWidth="3.5" />
              {/* Lông cọ mềm nhúng màu xanh */}
              <path d="M168 140 Q162 135, 163 134 Q167 137, 169 141 Z" fill="#1E88E5" />
            </g>
          </g>

          {/* ===================================================================
              6. CÁC HẠT SÁNG & BỤI MÀU LẤP LÁNH BAY TỪ ĐẦU CỌ
              =================================================================== */}
          <g>
            <circle cx="160" cy="130" r="3" fill="#FBC02D" className="sparkle-float-1" />
            <circle cx="152" cy="120" r="2.5" fill="#42A5F5" className="sparkle-float-2" />
            <circle cx="168" cy="116" r="2" fill="#EC407A" className="sparkle-float-3" />
            <circle cx="174" cy="136" r="2.2" fill="#66BB6A" className="sparkle-float-1" />
          </g>

          {/* Xô đựng cọ vẽ cạnh chân giá vẽ */}
          <g transform="translate(85, 260)">
            <rect x="0" y="8" width="20" height="24" rx="3" fill="#546E7A" />
            <line x1="4" y1="8" x2="-2" y2="-6" stroke="#8D572F" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="10" y1="8" x2="10" y2="-8" stroke="#D89A68" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="8" x2="22" y2="-4" stroke="#8D572F" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </div>
  );
}

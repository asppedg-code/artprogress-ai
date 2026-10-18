"use client";

import React from "react";

export function AtelierBackgroundIllustration() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
      <style>{`
        /* Chuyển động nhẹ của các giọt màu nước và lá cây */
        @keyframes floatGentle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(2deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .anim-leaf-sway {
          transform-origin: center;
          animation: floatGentle 5s ease-in-out infinite;
        }
        .anim-drop-pulse {
          animation: pulseGlow 4s ease-in-out infinite;
        }
      `}</style>

      {/* 1. NỀN PHÒNG TRANH VÀNG KEM ẤM ÁP */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF] via-[#FAF6EF] to-[#F5ECE0]" />

      {/* 2. DẢI SÓNG LƯỢN XANH - VÀNG NGHỆ THUẬT (S-CURVE RIBBON CHIA ĐÔI MÀN HÌNH) */}
      <svg
        className="hidden lg:block absolute left-1/2 top-0 -translate-x-1/2 h-full w-[160px] xl:w-[200px] z-10"
        viewBox="0 0 200 1000"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="blueWaveGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0288D1" />
            <stop offset="50%" stopColor="#1E88E5" />
            <stop offset="100%" stopColor="#0D47A1" />
          </linearGradient>

          <linearGradient id="goldWaveGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFD54F" />
            <stop offset="50%" stopColor="#FFA000" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>
        </defs>

        {/* Dải sóng màu vàng hoàng thổ uốn lượn */}
        <path
          d="M120 0 C60 180, 160 380, 100 580 C50 750, 150 880, 110 1000 L135 1000 C175 880, 75 750, 125 580 C185 380, 85 180, 145 0 Z"
          fill="url(#goldWaveGrad)"
          opacity="0.95"
        />

        {/* Dải sóng màu xanh dương uốn lượn đối xứng */}
        <path
          d="M95 0 C40 180, 140 380, 80 580 C30 750, 130 880, 90 1000 L115 1000 C155 880, 55 750, 105 580 C165 380, 65 180, 120 0 Z"
          fill="url(#blueWaveGrad)"
        />

        {/* Chùm lá cây xanh trang trí mọc dọc theo dải sóng */}
        <g className="anim-leaf-sway">
          {/* Cụm lá tầng trên */}
          <path d="M125 240 C145 220, 160 235, 150 255 C135 255, 125 248, 125 240 Z" fill="#2E7D32" />
          <path d="M118 250 C130 268, 145 265, 140 248 C130 246, 120 248, 118 250 Z" fill="#43A047" />

          {/* Cụm lá tầng giữa */}
          <path d="M85 520 C65 500, 50 515, 60 535 C75 535, 85 528, 85 520 Z" fill="#2E7D32" />
          <path d="M92 530 C80 548, 65 545, 70 528 C80 526, 90 528, 92 530 Z" fill="#43A047" />

          {/* Cụm lá tầng dưới */}
          <path d="M130 740 C150 720, 165 735, 155 755 C140 755, 130 748, 130 740 Z" fill="#2E7D32" />
        </g>

        {/* Các giọt màu nước bay lơ lửng */}
        <g className="anim-drop-pulse">
          <circle cx="150" cy="120" r="8" fill="#1E88E5" />
          <circle cx="168" cy="95" r="5" fill="#FFB300" />
          <circle cx="65" cy="460" r="7" fill="#E53935" />
          <circle cx="145" cy="680" r="6" fill="#FDD835" />
        </g>
      </svg>

      {/* 3. MẶT BÀN HỌA CỤ CẠNH DƯỚI (DESK ATELIER - CẢ 2 BÊN TRÁI & PHẢI) */}
      <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-[110px] xl:h-[135px] pointer-events-none z-10">
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Mặt bàn gỗ cong vòm 2 bên */}
          <path
            d="M0 140 L0 50 Q280 20, 560 85 Q720 120, 880 85 Q1160 20, 1440 50 L1440 140 Z"
            fill="#EAC297"
            stroke="#CFA173"
            strokeWidth="3"
          />
          {/* Cạnh viền bóng của mặt bàn */}
          <path
            d="M0 50 Q280 20, 560 85 Q720 120, 880 85 Q1160 20, 1440 50"
            stroke="#FDE8CD"
            strokeWidth="4"
          />

          {/* ===================================================================
              HỌA CỤ BÀN BÊN TRÁI: SỔ KÝ HỌA, TUÝP MÀU, BẢNG PHA MÀU, CỌ VẼ
              =================================================================== */}
          <g transform="translate(60, 20)">
            {/* Cuốn sổ ký họa lật mở có gáy lò xo */}
            <g transform="translate(0, 10)">
              <rect x="0" y="0" width="130" height="90" rx="6" fill="#FFFFFF" stroke="#D7CCC8" strokeWidth="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))" />
              {/* Lò xo gáy sổ */}
              {[10, 24, 38, 52, 66, 80, 94, 108, 122].map((x) => (
                <circle key={x} cx={x} cy="6" r="3" fill="#8D6E63" />
              ))}
              {/* Nét vẽ phác thảo chì phong cảnh núi & mây */}
              <path d="M20 70 L45 42 L65 60 L85 35 L115 70" stroke="#78909C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M35 30 Q45 25, 55 30" stroke="#90A4AE" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <circle cx="85" cy="25" r="7" stroke="#90A4AE" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
            </g>

            {/* Các tuýp màu sơn dầu nằm trên bàn */}
            <g transform="translate(145, 45) rotate(-15)">
              <rect x="0" y="0" width="55" height="18" rx="3" fill="#FFFFFF" stroke="#B0BEC5" strokeWidth="1.5" />
              <rect x="15" y="0" width="22" height="18" fill="#1E88E5" />
              <rect x="55" y="4" width="8" height="10" rx="2" fill="#37474F" />
            </g>

            <g transform="translate(195, 50) rotate(10)">
              <rect x="0" y="0" width="55" height="18" rx="3" fill="#FFFFFF" stroke="#B0BEC5" strokeWidth="1.5" />
              <rect x="15" y="0" width="22" height="18" fill="#E53935" />
              <rect x="55" y="4" width="8" height="10" rx="2" fill="#37474F" />
            </g>

            <g transform="translate(245, 45) rotate(-5)">
              <rect x="0" y="0" width="55" height="18" rx="3" fill="#FFFFFF" stroke="#B0BEC5" strokeWidth="1.5" />
              <rect x="15" y="0" width="22" height="18" fill="#FDD835" />
              <rect x="55" y="4" width="8" height="10" rx="2" fill="#37474F" />
            </g>

            {/* Bảng pha màu gỗ với giọt màu */}
            <g transform="translate(320, 15) rotate(12)">
              <path d="M10 20 C5 10, 35 -10, 65 5 C95 20, 85 55, 60 60 C45 62, 35 45, 20 50 C10 52, 12 35, 10 20 Z" fill="#D7CCC8" stroke="#BCAAA4" strokeWidth="2" />
              <circle cx="28" cy="18" r="4.5" fill="#E53935" />
              <circle cx="45" cy="15" r="4.5" fill="#FDD835" />
              <circle cx="62" cy="22" r="4.5" fill="#1E88E5" />
              <circle cx="68" cy="38" r="4.5" fill="#43A047" />
              <circle cx="50" cy="48" r="4" fill="#FFFFFF" />
            </g>

            {/* Ống cắm bút lông cọ vẽ */}
            <g transform="translate(-40, -10)">
              <rect x="0" y="25" width="36" height="55" rx="5" fill="#0288D1" stroke="#01579B" strokeWidth="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))" />
              {/* Các cán cọ vươn lên */}
              <line x1="8" y1="25" x2="-8" y2="-30" stroke="#8D6E63" strokeWidth="4" strokeLinecap="round" />
              <polygon points="-8,-30 -12,-38 -6,-36" fill="#B0BEC5" />
              <polygon points="-12,-38 -14,-46 -8,-42" fill="#D84315" />

              <line x1="18" y1="25" x2="18" y2="-35" stroke="#A1887F" strokeWidth="4.5" strokeLinecap="round" />
              <polygon points="18,-35 15,-43 21,-43" fill="#B0BEC5" />
              <polygon points="15,-43 18,-52 21,-43" fill="#1565C0" />

              <line x1="28" y1="25" x2="44" y2="-28" stroke="#8D6E63" strokeWidth="4" strokeLinecap="round" />
              <polygon points="44,-28 48,-36 42,-34" fill="#B0BEC5" />
              <polygon points="48,-36 52,-44 46,-40" fill="#FBC02D" />
            </g>
          </g>

          {/* ===================================================================
              HỌA CỤ BÀN BÊN PHẢI: BẢNG PHA MÀU & ỐNG CỌ VẼ
              =================================================================== */}
          <g transform="translate(1080, 20)">
            {/* Các tuýp màu sơn dầu */}
            <g transform="translate(0, 45) rotate(15)">
              <rect x="0" y="0" width="55" height="18" rx="3" fill="#FFFFFF" stroke="#B0BEC5" strokeWidth="1.5" />
              <rect x="15" y="0" width="22" height="18" fill="#1E88E5" />
              <rect x="55" y="4" width="8" height="10" rx="2" fill="#37474F" />
            </g>

            <g transform="translate(50, 48) rotate(-10)">
              <rect x="0" y="0" width="55" height="18" rx="3" fill="#FFFFFF" stroke="#B0BEC5" strokeWidth="1.5" />
              <rect x="15" y="0" width="22" height="18" fill="#E53935" />
              <rect x="55" y="4" width="8" height="10" rx="2" fill="#37474F" />
            </g>

            {/* Bảng pha màu góc phải */}
            <g transform="translate(120, 25) rotate(-8)">
              <path d="M10 20 C5 10, 35 -10, 65 5 C95 20, 85 55, 60 60 C45 62, 35 45, 20 50 C10 52, 12 35, 10 20 Z" fill="#D7CCC8" stroke="#BCAAA4" strokeWidth="2" />
              <circle cx="28" cy="18" r="4.5" fill="#1E88E5" />
              <circle cx="45" cy="15" r="4.5" fill="#FDD835" />
              <circle cx="62" cy="22" r="4.5" fill="#E53935" />
              <circle cx="68" cy="38" r="4.5" fill="#43A047" />
            </g>

            {/* Ống cắm bút lông cọ vẽ bên phải */}
            <g transform="translate(260, -10)">
              <rect x="0" y="25" width="36" height="55" rx="5" fill="#0288D1" stroke="#01579B" strokeWidth="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))" />
              <line x1="12" y1="25" x2="-2" y2="-28" stroke="#8D6E63" strokeWidth="4" strokeLinecap="round" />
              <polygon points="-2,-28 -6,-36 0,-34" fill="#B0BEC5" />
              <polygon points="-6,-36 -8,-44 -2,-40" fill="#E53935" />

              <line x1="24" y1="25" x2="36" y2="-32" stroke="#A1887F" strokeWidth="4.5" strokeLinecap="round" />
              <polygon points="36,-32 40,-40 34,-38" fill="#B0BEC5" />
              <polygon points="40,-40 44,-48 38,-45" fill="#1E88E5" />
            </g>
          </g>
        </svg>
      </div>

      {/* 4. VỆT MÀU NƯỚC LOANG TRANG TRÍ Ở GÓC TRÊN BÊN PHẢI */}
      <div className="hidden lg:block absolute top-4 right-6 pointer-events-none">
        <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
          <circle cx="95" cy="25" r="14" fill="#1E88E5" opacity="0.9" />
          <circle cx="112" cy="45" r="8" fill="#29B6F6" opacity="0.8" />
          <circle cx="80" cy="50" r="10" fill="#FFCA28" opacity="0.85" />
        </svg>
      </div>
    </div>
  );
}

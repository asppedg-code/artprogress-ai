import type { Metadata, Viewport } from "next";
import { Lora, Be_Vietnam_Pro } from "next/font/google";
import { APP_VERSION } from "@/config/version";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// Font Serif nghệ thuật cho tiêu đề (tránh rơi về Times New Roman)
const lora = Lora({
  variable: "--font-serif",
  subsets: ["vietnamese", "latin"],
  display: "swap",
});

// Font Sans hiện đại, sạch sẽ và tối ưu tuyệt đối cho tiếng Việt
const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `ArtProgress AI v${APP_VERSION} — Mĩ thuật THCS`,
  description: `Hồ sơ sáng tạo & Tiến bộ số môn Mĩ thuật (v${APP_VERSION})`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${lora.variable} ${beVietnamPro.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FDFBF7] text-stone-800">
        {children}
      </body>
    </html>
  );
}
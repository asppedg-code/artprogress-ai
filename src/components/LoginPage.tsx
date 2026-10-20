"use client";

import React, { useState, useMemo } from "react";
import {
  GraduationCap,
  Palette,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Search,
  Frame,
} from "lucide-react";
import { ClassRoom, Student } from "@/types/artprogress";
import { ArtistPaintingAnimation } from "@/components/ArtistPaintingAnimation";
import { APP_VERSION } from "@/config/version";

interface LoginPageProps {
  classes: ClassRoom[];
  students: Student[];
  onLoginTeacher: (pin: string) => boolean;
  onLoginStudent: (grade: number, classId: string, studentId: string) => void;
  onLoginGuest: () => void;
}

// 8 Sắc tố mỹ thuật gán riêng cho từng học sinh
const ATELIER_PIGMENTS = [
  { name: "Xanh Chàm", hex: "#27445D", bg: "#EDF3F7", border: "#CFDEE8", accent: "#1A3247" },
  { name: "Cam Đất", hex: "#C85A32", bg: "#FDF5F0", border: "#F3D8CC", accent: "#9E3E1C" },
  { name: "Vàng Hoàng Thổ", hex: "#C57D22", bg: "#FDF8EE", border: "#F3E2C4", accent: "#96590F" },
  { name: "Xanh Lục Trầm", hex: "#3E6B52", bg: "#EFF6F2", border: "#CCE2D4", accent: "#294D3A" },
  { name: "Đỏ Son Chu Sa", hex: "#B83A35", bg: "#FDF2F1", border: "#F5D2D1", accent: "#8A231F" },
  { name: "Tím Thạch Anh", hex: "#6E4C7A", bg: "#F7F2F9", border: "#E5D4EB", accent: "#4E3257" },
  { name: "Xanh Khổng Tước", hex: "#226B7D", bg: "#EEF7F9", border: "#CBE7ED", accent: "#134956" },
  { name: "Nâu Đất Sẫm", hex: "#754C35", bg: "#F9F4F1", border: "#E8D8CF", accent: "#523321" },
];

function getStudentPigment(studentId: string, name: string) {
  let hash = 0;
  const str = studentId + name;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % ATELIER_PIGMENTS.length;
  return ATELIER_PIGMENTS[idx];
}

export function LoginPage({
  classes,
  students,
  onLoginTeacher,
  onLoginStudent,
  onLoginGuest,
}: LoginPageProps) {
  // Trạng thái chọn Cổng đăng nhập
  const [activeTab, setActiveTab] = useState<"teacher" | "student" | "guest">("teacher");

  // Form Giáo viên
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState("");

  // Form Học sinh
  const [selectedGrade, setSelectedGrade] = useState<number>(7);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  const classesInGrade = useMemo(
    () => classes.filter((c) => c.grade === selectedGrade),
    [classes, selectedGrade]
  );

  const [selectedClassId, setSelectedClassId] = useState<string>(
    classesInGrade[0]?.id || classes[0]?.id || ""
  );

  const studentsInClass = useMemo(
    () => students.filter((s) => s.classId === selectedClassId),
    [students, selectedClassId]
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    studentsInClass[0]?.id || students[0]?.id || ""
  );

  // Lọc học sinh theo từ khóa tìm kiếm (Tên hoặc Mã HS)
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return studentsInClass;
    const query = studentSearchQuery.toLowerCase();
    return studentsInClass.filter(
      (s) => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
    );
  }, [studentsInClass, studentSearchQuery]);

  // Thông tin học sinh đang được chọn
  const currentSelectedStudent = useMemo(() => {
    return studentsInClass.find((s) => s.id === selectedStudentId) || studentsInClass[0];
  }, [studentsInClass, selectedStudentId]);

  const currentSelectedClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  const selectedPigment = useMemo(() => {
    if (!currentSelectedStudent) return ATELIER_PIGMENTS[0];
    return getStudentPigment(currentSelectedStudent.id, currentSelectedStudent.name);
  }, [currentSelectedStudent]);

  // Đổi Khối học
  const handleGradeChange = (grade: number) => {
    setSelectedGrade(grade);
    setStudentSearchQuery("");
    const newClasses = classes.filter((c) => c.grade === grade);
    if (newClasses.length > 0) {
      const nextClassId = newClasses[0].id;
      setSelectedClassId(nextClassId);
      const newStudents = students.filter((s) => s.classId === nextClassId);
      if (newStudents.length > 0) {
        setSelectedStudentId(newStudents[0].id);
      }
    }
  };

  // Đổi Lớp học
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setStudentSearchQuery("");
    const newStudents = students.filter((s) => s.classId === classId);
    if (newStudents.length > 0) {
      setSelectedStudentId(newStudents[0].id);
    }
  };

  // Đăng nhập giáo viên
  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setPinError("Vui lòng nhập mã PIN sư phạm để tiếp tục.");
      return;
    }
    const success = onLoginTeacher(pin);
    if (!success) {
      setPinError("Mã PIN không đúng. Gợi ý: Dùng mã mặc định 123456.");
    } else {
      setPinError("");
    }
  };

  // Điền nhanh mã PIN Giám khảo
  const handleQuickFillPin = () => {
    setPin("123456");
    setPinError("");
  };

  // Đăng nhập học sinh
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveStudentId = selectedStudentId || currentSelectedStudent?.id;
    if (!effectiveStudentId) {
      alert("Vui lòng chọn danh tính học sinh trước khi vào giá vẽ.");
      return;
    }
    onLoginStudent(selectedGrade, selectedClassId, effectiveStudentId);
  };

  return (
    <div
      className="min-h-[100dvh] w-full relative flex items-center justify-center p-2 sm:p-4 md:p-8 login-screen-bg selection:bg-[#F3E2C4] selection:text-[#96590F] overflow-x-hidden overflow-y-auto font-sans"
    >
      <style>{`
        /* Nền đăng nhập thích ứng: Mobile dùng tranh viền dọc (#fdf9ee), Desktop dùng studio tranh ngang (#FAF6EE) */
        .login-screen-bg {
          background-color: #fdf9ee;
          background-image: url('/login-bg-mobile.png');
          background-repeat: no-repeat;
          background-position: center center;
          background-size: contain;
        }
        @media (min-width: 1024px) {
          .login-screen-bg {
            background-color: #FAF6EE;
            background-image: url('/login-bg.png');
            background-size: cover;
            background-position: center;
          }
        }

        /* Hiệu ứng vệt cọ quét qua nút bấm (/impeccable animate) */
        .brush-sweep-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .brush-sweep-btn::after {
          content: "";
          position: absolute;
          top: 0;
          left: -120%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent);
          transition: all 0.65s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .brush-sweep-btn:hover::after {
          left: 120%;
        }

        /* Giọt màu sơn dầu 3D bóng bẩy */
        .paint-drop-3d {
          box-shadow: inset 0 -2px 3px rgba(0,0,0,0.25), inset 0 2px 2px rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.12);
        }

        /* Thẻ mềm mại chuẩn studio */
        .atelier-card-glow {
          box-shadow: 0 10px 40px -10px rgba(36, 31, 28, 0.12), 0 20px 25px -5px rgba(0, 0, 0, 0.05);
        }
      `}</style>

      {/* CONTAINER CHÍNH: MOBILE CĂN GIỮA Ô ĐĂNG NHẬP, DESKTOP PHÂN ĐÔI TRÁI (HỌA SĨ) & PHẢI (Ô ĐĂNG NHẬP) */}
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-10 items-center justify-center lg:justify-items-center min-h-[calc(100dvh-2rem)] lg:min-h-[560px] z-10 py-2 sm:py-4">

        {/* =====================================================================
            PHẦN BÊN TRÁI: ANIMATION HỌA SĨ ĐANG VẼ TRANH (CHỈ HIỆN TRÊN DESKTOP)
            Căn chính giữa chuẩn xác trong nửa màn hình bên trái
            ===================================================================== */}
        <div className="hidden lg:flex w-full items-center justify-center px-2 sm:px-6">
          <ArtistPaintingAnimation />
        </div>

        {/* =====================================================================
            PHẦN Ô ĐĂNG NHẬP (LOGIN BOX)
            Mobile: Căn chính giữa khoảng trống của tranh viền #fdf9ee
            Desktop: Nằm ở nửa màn hình bên phải
            ===================================================================== */}
        <div className="w-full flex items-center justify-center px-1 sm:px-6">
          <div className="w-[92%] sm:w-full max-w-[340px] sm:max-w-[360px] lg:max-w-[400px] bg-white/94 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#E8DFC9] atelier-card-glow p-4 sm:p-5 relative transition-all lg:-translate-y-6 lg:translate-x-12">

            {/* TIÊU ĐỀ Ô ĐĂNG NHẬP (TINH GIẢN GỌN GÀNG) */}
            <div className="text-center mb-3">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#241F1C] tracking-tight">
                Đăng Nhập
              </h2>
              <p className="text-[11px] text-[#8C7F6E] mt-0.5">
                Vui lòng chọn đúng vai trò bên dưới
              </p>
            </div>

            {/* BẢNG CHỌN 3 VAI TRÒ VỚI ICON TƯỢNG TRƯNG */}
            <div className="grid grid-cols-3 gap-1 bg-[#F4EFE6] p-1 rounded-xl border border-[#E0D5C3] mb-3">
              {/* Tab 1: Giáo Viên */}
              <button
                type="button"
                onClick={() => setActiveTab("teacher")}
                className={`py-2 px-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === "teacher"
                  ? "bg-white text-[#8E431E] font-bold shadow-xs border border-[#F3D8CC]"
                  : "text-[#6E645A] hover:text-[#241F1C]"
                  }`}
              >
                <GraduationCap className={`w-4 h-4 shrink-0 ${activeTab === "teacher" ? "text-[#C85A32]" : "text-[#8C7F6E]"}`} />
                <span className="font-serif text-[11.5px] sm:text-xs">Giáo Viên</span>
              </button>

              {/* Tab 2: Học Sinh */}
              <button
                type="button"
                onClick={() => setActiveTab("student")}
                className={`py-2 px-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === "student"
                  ? "bg-white text-[#27445D] font-bold shadow-xs border border-[#CFDEE8]"
                  : "text-[#6E645A] hover:text-[#241F1C]"
                  }`}
              >
                <Palette className={`w-4 h-4 shrink-0 ${activeTab === "student" ? "text-[#27445D]" : "text-[#8C7F6E]"}`} />
                <span className="font-serif text-[11.5px] sm:text-xs">Học Sinh</span>
              </button>

              {/* Tab 3: Khách */}
              <button
                type="button"
                onClick={() => setActiveTab("guest")}
                className={`py-2 px-1 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === "guest"
                  ? "bg-white text-[#96590F] font-bold shadow-xs border border-[#F3E2C4]"
                  : "text-[#6E645A] hover:text-[#241F1C]"
                  }`}
              >
                <Frame className={`w-4 h-4 shrink-0 ${activeTab === "guest" ? "text-[#C57D22]" : "text-[#8C7F6E]"}`} />
                <span className="font-serif text-[11.5px] sm:text-xs">Khách</span>
              </button>
            </div>

            {/* =================================================================
                1. BIỂU MẪU ĐĂNG NHẬP GIÁO VIÊN (TINH GIẢN)
                ================================================================= */}
            {activeTab === "teacher" && (
              <form onSubmit={handleTeacherSubmit} className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="teacher-pin-input" className="block text-xs font-semibold text-[#3B342C]">
                      Mã PIN Giáo viên
                    </label>
                    <button
                      type="button"
                      onClick={handleQuickFillPin}
                      className="text-[10.5px] text-[#C85A32] hover:underline cursor-pointer font-medium"
                    >
                      Gợi ý: 123456
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      id="teacher-pin-input"
                      type={showPin ? "text" : "password"}
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value);
                        if (pinError) setPinError("");
                      }}
                      placeholder="Nhập mã PIN"
                      className="w-full text-xs px-3 py-2 pr-14 rounded-xl border border-[#D9CEBC] focus:outline-none focus:ring-1 focus:ring-[#C85A32] font-mono tracking-widest bg-[#FAF6EE] text-[#241F1C]"
                      autoFocus
                    />
                    <div className="absolute right-2.5 top-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="text-[#968979] hover:text-[#241F1C] p-0.5 cursor-pointer"
                        title={showPin ? "Ẩn PIN" : "Hiện PIN"}
                      >
                        {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <Lock className="w-3.5 h-3.5 text-[#968979]" />
                    </div>
                  </div>

                  {pinError && (
                    <p className="text-[10.5px] text-rose-600 font-medium">{pinError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#C85A32] via-[#BA4E27] to-[#9E3E1C] hover:from-[#BA4E27] hover:to-[#8F3514] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer brush-sweep-btn"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* =================================================================
                2. BIỂU MẪU ĐĂNG NHẬP HỌC SINH (GỌN GÀNG, TINH GIẢN)
                ================================================================= */}
            {activeTab === "student" && (
              <form onSubmit={handleStudentSubmit} className="space-y-2.5">
                {/* Chọn Khối & Lớp */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-semibold text-[#3B342C] mb-1">
                      Khối
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {[6, 7, 8, 9].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleGradeChange(g)}
                          className={`py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${selectedGrade === g
                            ? "bg-[#27445D] text-white border-[#27445D] shadow-2xs"
                            : "bg-[#FAF6EE] border-[#E0D5C3] text-[#5C5348] hover:bg-white"
                            }`}
                        >
                          K{g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-semibold text-[#3B342C] mb-1">
                      Lớp
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {classesInGrade.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleClassChange(c.id)}
                          className={`py-1 rounded-md text-[11px] font-semibold text-center transition-all cursor-pointer border truncate ${selectedClassId === c.id
                            ? "border-[#27445D] bg-[#EDF3F7] text-[#27445D] font-bold shadow-2xs"
                            : "border-[#E0D5C3] bg-[#FAF6EE] text-[#5C5348] hover:bg-white"
                            }`}
                        >
                          {c.name.replace("Lớp ", "").replace(/^[6789]/, "")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chọn Danh tính Học sinh */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10.5px] font-semibold text-[#3B342C]">
                      Học sinh {currentSelectedClass ? `(${currentSelectedClass.name})` : ""}
                    </label>
                    {currentSelectedStudent && (
                      <span className="text-[10px] font-medium text-[#27445D] flex items-center gap-1 truncate max-w-[170px]">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: selectedPigment.hex }}
                        />
                        <span className="truncate">{currentSelectedStudent.name}</span>
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-3 h-3 text-[#968979] absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Tìm tên hoặc mã HS..."
                      className="w-full text-[11px] pl-7 pr-2.5 py-1.5 rounded-lg border border-[#D9CEBC] focus:outline-none focus:ring-1 focus:ring-[#27445D] bg-[#FAF6EE] text-[#241F1C]"
                    />
                  </div>

                  <div className="max-h-24 overflow-y-auto border border-[#E0D5C3] rounded-lg p-0.5 bg-[#FAF6EE] space-y-0.5">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((st) => {
                        const pigment = getStudentPigment(st.id, st.name);
                        const isSelected = selectedStudentId === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setSelectedStudentId(st.id)}
                            className={`w-full px-2 py-1 rounded text-left text-[11px] flex items-center justify-between cursor-pointer border ${isSelected
                              ? "bg-white border-[#27445D] text-[#27445D] font-bold shadow-2xs"
                              : "bg-white/60 border-transparent hover:bg-white text-[#3B342C]"
                              }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: pigment.hex }}
                              />
                              <span className="truncate">{st.name}</span>
                            </div>
                            <span className="text-[9.5px] font-mono text-[#8C7F6E] shrink-0 ml-1">{st.id}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-1.5 text-center text-[10px] text-[#8C7F6E]">
                        {studentSearchQuery ? "Không tìm thấy học sinh." : "Chưa có học sinh trong lớp này."}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#27445D] via-[#1E3A52] to-[#122A3D] hover:from-[#1E3A52] hover:to-[#0C1E2D] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer brush-sweep-btn"
                >
                  <Palette className="w-4 h-4" />
                  <span>Vào phòng học</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* =================================================================
                3. BIỂU MẪU ĐĂNG NHẬP KHÁCH THƯỞNG LÃM (TINH GIẢN)
                ================================================================= */}
            {activeTab === "guest" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E8DFC9] text-center space-y-1">
                  <p className="text-xs text-[#5C5348] leading-relaxed">
                    Thưởng lãm các tác phẩm mĩ thuật xuất sắc của học sinh THCS.
                  </p>
                  <p className="text-[10.5px] text-[#8C7F6E]">
                    Mở cửa tự do • Không cần mật khẩu
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onLoginGuest}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#C57D22] via-[#B26E1A] to-[#8C520E] hover:from-[#B26E1A] hover:to-[#784408] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer brush-sweep-btn"
                >
                  <Frame className="w-4 h-4" />
                  <span>Vào Triển Lãm</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* CHÂN Ô ĐĂNG NHẬP */}
            <div className="mt-3 pt-2 border-t border-[#F0E6D8] text-center text-[10px] text-[#A89C8C] flex items-center justify-center gap-1.5 flex-wrap">
              <span>Hệ thống đánh giá tiến bộ &amp; hồ sơ sáng tạo môn Mĩ thuật</span>
              <span>&bull;</span>
              <span className="font-mono text-[9px] bg-[#EDE4D6] text-[#7A6E5F] px-1.5 py-0.5 rounded-full font-semibold">
                v{APP_VERSION}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


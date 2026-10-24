"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Palette,
  BookOpen,
  Globe,
  Award,
  Layers,
  GraduationCap,
  Upload,
  Sliders,
  CheckCircle2,
  Sparkles,
  Plus,
  ChevronRight,
  X,
  FileText,
  Edit3,
  Lock,
  Eye,
  Save,
  Trash2,
  Check,
  Printer,
  School,
  LogOut,
  Users,
  UserPlus,
  Menu,
  ArrowLeft,
} from "lucide-react";
import { INITIAL_ARTWORKS, INITIAL_TOPICS, INITIAL_STUDENTS, INITIAL_CLASSES } from "@/lib/mock-data";
import { Artwork, ArtworkFeedback, Topic, Student, RubricCriterion, ClassRoom } from "@/types/artprogress";
import { BeforeAfterViewer } from "@/components/BeforeAfterViewer";
import { UploadArtworkModal } from "@/components/UploadArtworkModal";
import { ProgressReportModal } from "@/components/ProgressReportModal";
import { LoginPage } from "@/components/LoginPage";
import { Gallery3DView } from "@/components/Gallery3DView";
import { BrushStrokeTransition } from "@/components/BrushStrokeTransition";
import { submitArtworkAction } from "@/app/actions/artwork";
import {
  isFirebaseConfigured,
  fetchArtworksFromFirestore,
  saveArtworkToFirestore,
  deleteArtworkFromFirestore,
  fetchTopicsFromFirestore,
  saveTopicToFirestore,
  deleteTopicFromFirestore,
  fetchStudentsFromFirestore,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  uploadArtworkImageToStorage,
} from "@/lib/firebase";
import { APP_VERSION } from "@/config/version";
import {
  idbGet,
  idbSet,
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeLocalStorageRemove,
} from "@/lib/storage-cache";

const STORAGE_VERSION_TAG = `artprogress_storage_v${APP_VERSION}_clean`;

export default function DashboardPage() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [role, setRole] = useState<"teacher" | "student" | "guest">("teacher");
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(false);
  const [isTeacherPinModalOpen, setIsTeacherPinModalOpen] = useState(false);
  const [teacherPinInput, setTeacherPinInput] = useState("");
  const [teacherPinError, setTeacherPinError] = useState("");
  const [currentNav, setCurrentNav] = useState<"portfolio" | "topics" | "rubric" | "gallery">("portfolio");
  const [galleryViewMode, setGalleryViewMode] = useState<"3d" | "grid">("3d");

  // Quản lý điều hướng thích ứng trên thiết bị di động (Mobile Adaptive)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobilePortfolioView, setMobilePortfolioView] = useState<"list" | "detail">("list");

  // Hiệu ứng chuyển cảnh vệt cọ vẽ (#C4572F) dứt khoát khi đăng nhập
  const [isBrushTransitioning, setIsBrushTransitioning] = useState(false);
  const pendingLoginRef = useRef<(() => void) | null>(null);

  const triggerLoginTransition = useCallback((loginAction: () => void) => {
    pendingLoginRef.current = loginAction;
    setIsBrushTransitioning(true);
  }, []);

  // QUẢN LÝ 4 KHỐI (6, 7, 8, 9) VÀ 16 LỚP HỌC THCS
  const [classes] = useState<ClassRoom[]>(INITIAL_CLASSES);
  const [selectedGrade, setSelectedGrade] = useState<number>(7);
  const [selectedClass, setSelectedClass] = useState<ClassRoom>(
    () => INITIAL_CLASSES.find((c) => c.id === "class_7a1") || INITIAL_CLASSES[0]
  );

  // Quản lý học sinh và tài khoản học sinh đang chọn (Hỗ trợ lưu trữ cục bộ & Firestore)
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Modal quản lý danh sách học sinh (Dành cho Giáo viên)
  const [isStudentRosterModalOpen, setIsStudentRosterModalOpen] = useState(false);
  const [rosterTab, setRosterTab] = useState<"list" | "add" | "batch">("list");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [batchStudentText, setBatchStudentText] = useState("");

  const classStudents = useMemo(
    () => students.filter((s) => s.classId === selectedClass.id),
    [students, selectedClass.id]
  );

  const currentStudent = useMemo(() => {
    return classStudents.find((s) => s.id === selectedStudentId) || classStudents[0] || null;
  }, [classStudents, selectedStudentId]);

  // Danh sách tác phẩm & tác phẩm được chọn (Lưu trữ cục bộ & Firestore)
  const [artworks, setArtworks] = useState<Artwork[]>(INITIAL_ARTWORKS);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);

  // Quản lý chủ đề theo Khối & bộ lọc chủ đề (Lưu trữ cục bộ & Firestore)
  const [topics, setTopics] = useState<Topic[]>(INITIAL_TOPICS);
  const [newTopicGrade, setNewTopicGrade] = useState<number>(7);

  // Danh sách chủ đề chỉ thuộc Khối đang chọn (Khối 6, 7, 8 hoặc 9)
  const currentGradeTopics = useMemo(() => {
    return topics.filter((t) => (t.grade !== undefined ? t.grade === selectedGrade : true));
  }, [topics, selectedGrade]);

  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const selectedTopic = useMemo(() => {
    if (currentGradeTopics.length === 0) return null;
    return currentGradeTopics.find((t) => t.id === selectedTopicId) || currentGradeTopics[0] || null;
  }, [currentGradeTopics, selectedTopicId]);

  const setSelectedTopic = (t: Topic | null) => {
    setSelectedTopicId(t?.id || null);
  };

  const [topicFilter, setTopicFilter] = useState<string>("all");

  // Trạng thái Bảng trượt bên cạnh (Evaluation Drawer) - Mặc định đóng để không che màn hình khi đăng nhập
  const [isEvaluationDrawerOpen, setIsEvaluationDrawerOpen] = useState(false);

  // Modal Tự đánh giá của học sinh
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);

  // Bộ lọc trạng thái bài nộp
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "revised">("all");

  // Modal nộp tác phẩm
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRevisionUpload, setIsRevisionUpload] = useState(false);

  // Modal xem chi tiết tác phẩm ở Phòng Triển Lãm
  const [galleryModalArtwork, setGalleryModalArtwork] = useState<Artwork | null>(null);

  // Modal Báo cáo tiến bộ in PDF
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Modal tạo chủ đề bài học mới kèm Rubric theo Yêu cầu cần đạt
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [newTopicReqs, setNewTopicReqs] = useState("");
  const [newTopicCriteria, setNewTopicCriteria] = useState<RubricCriterion[]>([
    {
      id: "crit_1",
      name: "Bố cục & Trọng tâm",
      description: "Xác định rõ mảng chính, mảng phụ theo yêu cầu bài học.",
      weight: 25,
    },
    {
      id: "crit_2",
      name: "Đường nét & Tạo hình",
      description: "Thể hiện nét vẽ biểu cảm, chắc chắn và đúng đặc điểm.",
      weight: 25,
    },
    {
      id: "crit_3",
      name: "Màu sắc & Hòa sắc",
      description: "Vận dụng hòa sắc phù hợp với không khí bài học.",
      weight: 30,
    },
    {
      id: "crit_4",
      name: "Sáng tạo & Cảm xúc",
      description: "Ý tưởng thể hiện tình cảm chân thực, góc nhìn mới mẻ.",
      weight: 20,
    },
  ]);

  // Trạng thái chỉnh sửa lời phê của giáo viên (Inline)
  const [isEditingTeacherNotes, setIsEditingTeacherNotes] = useState(false);
  const [teacherNotesInput, setTeacherNotesInput] = useState("");

  // Trạng thái tự đánh giá của học sinh
  const [reflectionInput, setReflectionInput] = useState("");

  // 1. Khôi phục dữ liệu từ localStorage và phiên làm việc từ sessionStorage sau khi client hydrate xong
  useEffect(() => {
    let isCancelled = false;

    async function initAndLoadData() {
      // Chờ microtask để không gây cascading renders đồng bộ trong effect
      await Promise.resolve();
      if (isCancelled) return;

      try {
        // 1. So sánh mã phiên bản (1.0.0). Nếu phát hiện phiên bản cũ -> tự động dọn sạch cache và reload
        const cachedVersion = safeLocalStorageGet("artprogress_app_version");
        if (cachedVersion && cachedVersion !== APP_VERSION) {
          // Xóa toàn bộ cache cũ để không bị xung đột với phiên bản mới
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch { }
          safeLocalStorageSet("artprogress_app_version", APP_VERSION);
          safeLocalStorageSet("artprogress_storage_version", STORAGE_VERSION_TAG);

          // Xóa CacheStorage API nếu trình duyệt hỗ trợ
          if (typeof window !== "undefined" && "caches" in window) {
            try {
              const cacheKeys = await caches.keys();
              await Promise.all(cacheKeys.map((key) => caches.delete(key)));
            } catch { }
          }

          // Reload sạch sẽ trang để nạp trọn vẹn bundle mới nhất
          if (typeof window !== "undefined") {
            window.location.reload();
            return;
          }
        } else {
          // Lưu phiên bản 1.0.0 nếu chưa có
          safeLocalStorageSet("artprogress_app_version", APP_VERSION);
        }

        // Luôn chủ động xóa artprogress_artworks khỏi localStorage để giải phóng ngay quota 5MB
        safeLocalStorageRemove("artprogress_artworks");

        if (safeLocalStorageGet("artprogress_storage_version") !== STORAGE_VERSION_TAG) {
          safeLocalStorageRemove("artprogress_students");
          safeLocalStorageRemove("artprogress_topics");
          safeLocalStorageSet("artprogress_storage_version", STORAGE_VERSION_TAG);
        } else {
          const cachedStudents = safeLocalStorageGet("artprogress_students");
          if (cachedStudents) {
            try {
              const parsed = JSON.parse(cachedStudents);
              if (Array.isArray(parsed) && parsed.length > 0) setStudents(parsed);
            } catch { }
          }
          const cachedTopics = safeLocalStorageGet("artprogress_topics");
          if (cachedTopics) {
            try {
              const parsed = JSON.parse(cachedTopics);
              if (Array.isArray(parsed) && parsed.length > 0) setTopics(parsed);
            } catch { }
          }
        }

        // Khôi phục artworks từ IndexedDB (dung lượng không giới hạn 5MB, an toàn tuyệt đối)
        try {
          const cachedArtworks = await idbGet<Artwork[]>("artprogress_artworks");
          if (cachedArtworks && Array.isArray(cachedArtworks) && cachedArtworks.length > 0) {
            setArtworks(cachedArtworks);
          }
        } catch (e) {
          console.warn("[IndexedDB] Lỗi đọc cache artworks:", e);
        }
      } catch (e) {
        console.warn("Lỗi kiểm tra phiên bản và đọc cache:", e);
      }

      try {
        const loggedIn = sessionStorage.getItem("artprogress_logged_in") === "true";
        if (loggedIn) {
          setIsLoggedIn(true);
          const savedRole = sessionStorage.getItem("artprogress_role");
          if (savedRole === "teacher" || savedRole === "student" || savedRole === "guest") {
            setRole(savedRole);
            if (savedRole === "teacher") {
              setIsTeacherAuthenticated(true);
            }
          }
          const savedGrade = sessionStorage.getItem("artprogress_grade");
          if (savedGrade) {
            const parsedG = parseInt(savedGrade, 10);
            if ([6, 7, 8, 9].includes(parsedG)) setSelectedGrade(parsedG);
          }
          const savedClassId = sessionStorage.getItem("artprogress_class_id");
          if (savedClassId) {
            const foundClass = INITIAL_CLASSES.find((c) => c.id === savedClassId);
            if (foundClass) setSelectedClass(foundClass);
          }
          const savedStudentId = sessionStorage.getItem("artprogress_student_id");
          if (savedStudentId) setSelectedStudentId(savedStudentId);
        }
      } catch (e) {
        console.warn("Lỗi đọc session đăng nhập:", e);
      }

      setHasHydrated(true);

      if (isFirebaseConfigured) {
        try {
          const [cloudArtworks, cloudTopics, cloudStudents] = await Promise.all([
            fetchArtworksFromFirestore(),
            fetchTopicsFromFirestore(),
            fetchStudentsFromFirestore(),
          ]);

          if (isCancelled) return;
          if (cloudArtworks && cloudArtworks.length > 0) {
            setArtworks(cloudArtworks);
            idbSet("artprogress_artworks", cloudArtworks).catch(() => { });
          }
          if (cloudTopics && cloudTopics.length > 0) {
            setTopics(cloudTopics);
            safeLocalStorageSet("artprogress_topics", JSON.stringify(cloudTopics));
          }
          if (cloudStudents && cloudStudents.length > 0) {
            setStudents(cloudStudents);
            safeLocalStorageSet("artprogress_students", JSON.stringify(cloudStudents));
          }
        } catch (e) {
          console.warn("Chạy ở chế độ Graceful Fallback:", e);
        }
      }
    }

    initAndLoadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Tự động đồng bộ danh sách học sinh, chủ đề vào localStorage và bài vẽ vào IndexedDB khi có thay đổi (sau khi đã hydrate)
  useEffect(() => {
    if (hasHydrated) {
      safeLocalStorageSet("artprogress_students", JSON.stringify(students));
    }
  }, [students, hasHydrated]);

  useEffect(() => {
    if (hasHydrated) {
      safeLocalStorageSet("artprogress_topics", JSON.stringify(topics));
    }
  }, [topics, hasHydrated]);

  useEffect(() => {
    if (hasHydrated) {
      idbSet("artprogress_artworks", artworks).catch((err) => {
        console.warn("[Storage] Không thể ghi artworks vào IndexedDB:", err);
      });
    }
  }, [artworks, hasHydrated]);

  // 2. DANH SÁCH BÀI VẼ THEO LỚP HỌC ĐANG CHỌN, VAI TRÒ VÀ BỘ LỌC
  const displayArtworks = useMemo(() => {
    return artworks.filter((art) => {
      // 1. Lọc theo lớp học đang chọn
      if (art.classId !== selectedClass.id) {
        return false;
      }
      // 2. Nếu là vai trò học sinh: chỉ hiển thị bài của học sinh đó
      if (role === "student") {
        return Boolean(currentStudent && art.studentId === currentStudent.id);
      }
      // 3. Nếu có lọc thêm theo chủ đề
      if (topicFilter !== "all" && art.topicId !== topicFilter) {
        return false;
      }
      return true;
    });
  }, [artworks, selectedClass.id, role, currentStudent, topicFilter]);

  const filteredArtworks = useMemo(() => {
    return displayArtworks.filter((art) => {
      if (filterMode === "pending") return art.feedback?.status === "pending_moderation";
      if (filterMode === "revised") return !!art.revisedImageUrl;
      return true;
    });
  }, [displayArtworks, filterMode]);

  const selectedArtwork = useMemo(() => {
    if (filteredArtworks.length === 0) return null;
    return filteredArtworks.find((a) => a.id === selectedArtworkId) || filteredArtworks[0];
  }, [filteredArtworks, selectedArtworkId]);

  const setSelectedArtwork = (art: Artwork | null) => {
    setSelectedArtworkId(art?.id || null);
  };

  // Danh sách tác phẩm công khai cho Phòng Triển Lãm (ổn định reference)
  const publicArtworks = useMemo(() => artworks.filter((a) => a.isPublic), [artworks]);
  const handleSelectGalleryArtwork = useCallback((art: Artwork) => setGalleryModalArtwork(art), []);
  const handleSwitchToGrid = useCallback(() => setGalleryViewMode("grid"), []);

  const activeNav = role === "guest" && currentNav === "portfolio" ? "gallery" : currentNav;

  // Đổi Khối học (6, 7, 8, 9)
  const handleSelectGrade = (grade: number) => {
    setSelectedGrade(grade);
    setNewTopicGrade(grade);
    setTopicFilter("all");
    const firstClassInGrade = classes.find((c) => c.grade === grade);
    if (firstClassInGrade) {
      setSelectedClass(firstClassInGrade);
    }
    const topicsForGrade = topics.filter((t) => t.grade === grade);
    if (topicsForGrade.length > 0) {
      setSelectedTopic(topicsForGrade[0]);
    } else {
      setSelectedTopic(null);
    }
  };

  // Chọn Lớp học trong Khối
  const handleSelectClass = (cl: ClassRoom) => {
    setSelectedClass(cl);
    setTopicFilter("all");
    if (cl.grade !== selectedGrade) {
      setSelectedGrade(cl.grade);
      setNewTopicGrade(cl.grade);
      const topicsForGrade = topics.filter((t) => t.grade === cl.grade);
      if (topicsForGrade.length > 0) {
        setSelectedTopic(topicsForGrade[0]);
      } else {
        setSelectedTopic(null);
      }
    }
  };

  // ĐÓNG / MỞ NỘP BÀI CHO CHỦ ĐỀ
  const handleToggleTopicStatus = (topicId: string) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id === topicId) {
          const updated = { ...t, isActive: !t.isActive };
          saveTopicToFirestore(updated);
          return updated;
        }
        return t;
      })
    );
  };

  // ĐĂNG NHẬP CỔNG GIÁO VIÊN
  const handleLoginTeacher = (pin: string) => {
    const correctPin = (process.env.NEXT_PUBLIC_TEACHER_PIN || "").trim();
    if (correctPin && pin.trim() === correctPin) {
      triggerLoginTransition(() => {
        setRole("teacher");
        setIsTeacherAuthenticated(true);
        setIsLoggedIn(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("artprogress_logged_in", "true");
          sessionStorage.setItem("artprogress_role", "teacher");
        }
      });
      return true;
    }
    return false;
  };

  // ĐĂNG NHẬP CỔNG HỌC SINH
  const handleLoginStudent = (grade: number, classId: string, studentId: string) => {
    triggerLoginTransition(() => {
      setRole("student");
      setIsTeacherAuthenticated(false);
      setSelectedGrade(grade);
      const targetClass = classes.find((c) => c.id === classId);
      if (targetClass) setSelectedClass(targetClass);
      setSelectedStudentId(studentId);
      setCurrentNav("portfolio");
      setIsLoggedIn(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("artprogress_logged_in", "true");
        sessionStorage.setItem("artprogress_role", "student");
        sessionStorage.setItem("artprogress_student_id", studentId);
        sessionStorage.setItem("artprogress_class_id", classId);
        sessionStorage.setItem("artprogress_grade", grade.toString());
      }
    });
  };

  // ĐĂNG NHẬP CỔNG KHÁCH XEM TRIỂN LÃM
  const handleLoginGuest = () => {
    triggerLoginTransition(() => {
      setRole("guest");
      setIsTeacherAuthenticated(false);
      setCurrentNav("gallery");
      setIsLoggedIn(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("artprogress_logged_in", "true");
        sessionStorage.setItem("artprogress_role", "guest");
      }
    });
  };

  // ĐĂNG XUẤT KHỎI HỆ THỐNG
  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsTeacherAuthenticated(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("artprogress_logged_in");
      sessionStorage.removeItem("artprogress_role");
      sessionStorage.removeItem("artprogress_student_id");
      sessionStorage.removeItem("artprogress_class_id");
      sessionStorage.removeItem("artprogress_grade");
    }
  };

  // QUẢN LÝ DANH SÁCH HỌC SINH (GIÁO VIÊN)
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const classCode = selectedClass.name.replace("Lớp ", "");
    const generatedId = newStudentId.trim() || `HS${classCode}_${String(classStudents.length + 1).padStart(2, "0")}`;
    const newStudent: Student = {
      id: generatedId,
      name: newStudentName.trim(),
      classId: selectedClass.id,
    };

    setStudents((prev) => [...prev, newStudent]);
    setNewStudentName("");
    setNewStudentId("");
    setRosterTab("list");

    if (isFirebaseConfigured) {
      await saveStudentToFirestore(newStudent);
    }
  };

  const handleBatchImportStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchStudentText.trim()) return;

    const lines = batchStudentText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const classCode = selectedClass.name.replace("Lớp ", "");
    const newAdded: Student[] = [];

    lines.forEach((line, index) => {
      const cleanName = line.replace(/^\d+[\s\.\-\)\:]+/, "").trim();
      if (cleanName) {
        const id = `HS${classCode}_${String(classStudents.length + index + 1).padStart(2, "0")}`;
        newAdded.push({
          id,
          name: cleanName,
          classId: selectedClass.id,
        });
      }
    });

    if (newAdded.length > 0) {
      setStudents((prev) => [...prev, ...newAdded]);
      setBatchStudentText("");
      setRosterTab("list");

      if (isFirebaseConfigured) {
        for (const st of newAdded) {
          await saveStudentToFirestore(st);
        }
      }
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    const confirmed = window.confirm(
      `Thầy/cô có chắc muốn xóa học sinh "${studentName}" (${studentId}) khỏi ${selectedClass.name}?`
    );
    if (!confirmed) return;

    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    if (selectedStudentId === studentId) {
      const remaining = classStudents.filter((s) => s.id !== studentId);
      if (remaining.length > 0) {
        setSelectedStudentId(remaining[0].id);
      }
    }

    if (isFirebaseConfigured) {
      await deleteStudentFromFirestore(studentId);
    }
  };

  const handleResetStudentsToDefault = () => {
    const confirmed = window.confirm("Khôi phục toàn bộ danh sách học sinh về mặc định ban đầu?");
    if (!confirmed) return;
    setStudents(INITIAL_STUDENTS);
    safeLocalStorageSet("artprogress_students", JSON.stringify(INITIAL_STUDENTS));
  };

  // XÓA CHỦ ĐỀ BÀI HỌC (GIÁO VIÊN)
  const handleDeleteTopic = async (topicId: string) => {
    const topicToDelete = topics.find((t) => t.id === topicId);
    if (!topicToDelete) return;

    const confirmed = window.confirm(
      `Thầy/cô có chắc chắn muốn xóa chủ đề: "${topicToDelete.title}"?\n\nLưu ý: Các bài vẽ đã nộp của học sinh thuộc chủ đề này vẫn được lưu an toàn trong hồ sơ lớp.`
    );
    if (!confirmed) return;

    const remainingTopics = topics.filter((t) => t.id !== topicId);
    setTopics(remainingTopics);

    if (selectedTopic && selectedTopic.id === topicId) {
      const fallbackTopic = remainingTopics.find((t) => t.grade === selectedGrade) || remainingTopics[0] || null;
      setSelectedTopic(fallbackTopic);
    }

    if (isFirebaseConfigured) {
      await deleteTopicFromFirestore(topicId);
    }
  };

  // XÓA TÁC PHẨM
  const handleDeleteArtwork = async (artworkId: string) => {
    const artToDelete = artworks.find((a) => a.id === artworkId);
    if (!artToDelete) return;

    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa tác phẩm "${artToDelete.title}" của học sinh ${artToDelete.studentName}? Thao tác này không thể hoàn tác.`
    );
    if (!confirmDelete) return;

    setArtworks((prev) => prev.filter((a) => a.id !== artworkId));
    if (galleryModalArtwork?.id === artworkId) {
      setGalleryModalArtwork(null);
    }
    if (selectedArtworkId === artworkId) {
      const remaining = filteredArtworks.filter((a) => a.id !== artworkId);
      setSelectedArtworkId(remaining.length > 0 ? remaining[0].id : null);
    }
    if (isFirebaseConfigured) {
      await deleteArtworkFromFirestore(artworkId);
    }
  };

  const handleVerifyTeacherPin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = (process.env.NEXT_PUBLIC_TEACHER_PIN || "").trim();
    if (correctPin && teacherPinInput.trim() === correctPin) {
      setIsTeacherAuthenticated(true);
      setRole("teacher");
      setIsTeacherPinModalOpen(false);
      setTeacherPinError("");
    } else {
      setTeacherPinError("Mã PIN không đúng. Vui lòng thử lại.");
    }
  };

  // Nộp bài mới hoặc bản chỉnh sửa (Đẩy ảnh lên Firebase Storage nếu Live Cloud)
  const handleArtworkSubmit = async (data: { title: string; description: string; imageBase64: string; topicId?: string }) => {
    const targetTopicId = data.topicId || selectedTopic?.id;
    const effectiveTopic = topics.find((t) => t.id === targetTopicId) || selectedTopic;

    if (!effectiveTopic) {
      alert("Chưa có chủ đề bài học nào được chọn. Thầy/Cô vui lòng tạo chủ đề trước.");
      return;
    }
    if (!effectiveTopic.isActive) {
      alert("Chủ đề bài học này hiện đã đóng nộp bài. Vui lòng liên hệ Thầy/Cô.");
      return;
    }
    if (!currentStudent) {
      alert("Chưa chọn danh tính học sinh. Vui lòng chọn học sinh trước khi nộp bài.");
      return;
    }

    if (isRevisionUpload && selectedArtwork) {
      let finalRevisedUrl = data.imageBase64;
      if (isFirebaseConfigured) {
        const storagePath = `artworks/${selectedClass.id}/${currentStudent.id}_revised_${Date.now()}.jpg`;
        const downloadUrl = await uploadArtworkImageToStorage(data.imageBase64, storagePath);
        if (downloadUrl) {
          finalRevisedUrl = downloadUrl;
        }
      }

      const updated: Artwork = {
        ...selectedArtwork,
        revisedImageUrl: finalRevisedUrl,
        revisedAt: new Date().toISOString(),
        feedback: selectedArtwork.feedback
          ? {
            ...selectedArtwork.feedback,
            status: "pending_moderation",
          }
          : undefined,
      };
      setArtworks((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setSelectedArtwork(updated);
      setIsRevisionUpload(false);
      saveArtworkToFirestore(updated);
    } else {
      let finalImageUrl = data.imageBase64;
      if (isFirebaseConfigured) {
        const storagePath = `artworks/${selectedClass.id}/${currentStudent.id}_${Date.now()}.jpg`;
        const downloadUrl = await uploadArtworkImageToStorage(data.imageBase64, storagePath);
        if (downloadUrl) {
          finalImageUrl = downloadUrl;
        }
      }

      const res = await submitArtworkAction({
        topicId: effectiveTopic.id,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        classId: selectedClass.id,
        title: data.title,
        description: data.description,
        imageBase64: data.imageBase64,
        topicTitle: effectiveTopic.title,
        rubric: effectiveTopic.rubric,
      });

      if (res.success && res.artwork) {
        const cloudArtwork: Artwork = {
          ...res.artwork,
          initialImageUrl: finalImageUrl,
        };
        setArtworks((prev) => [cloudArtwork, ...prev]);
        setSelectedArtwork(cloudArtwork);
        setSelectedTopic(effectiveTopic);
        setCurrentNav("portfolio");
        saveArtworkToFirestore(cloudArtwork);
      }
    }
  };

  // Giáo viên duyệt nhận xét phát hành cho học sinh
  const handleApproveFeedback = (artworkId: string) => {
    if (!isTeacherAuthenticated || role !== "teacher") {
      setIsTeacherPinModalOpen(true);
      return;
    }
    setArtworks((prev) =>
      prev.map((art) => {
        if (art.id === artworkId && art.feedback) {
          const updatedFeedback: ArtworkFeedback = {
            ...art.feedback,
            status: "approved",
            reviewedBy: "Thầy/Cô giáo Mĩ thuật",
            reviewedAt: new Date().toISOString(),
          };
          const updatedArt = { ...art, feedback: updatedFeedback };
          if (selectedArtwork?.id === artworkId) setSelectedArtwork(updatedArt);
          saveArtworkToFirestore(updatedArt);
          return updatedArt;
        }
        return art;
      })
    );
  };

  // Giáo viên chỉnh sửa mức độ Rubric
  const handleUpdateCriterionLevel = (criterionId: string, level: "Chưa đạt" | "Đạt" | "Tốt" | "Xuất sắc") => {
    if (!selectedArtwork || !selectedArtwork.feedback) return;
    const updatedReviews = selectedArtwork.feedback.criteriaReviews.map((crit) =>
      crit.criterionId === criterionId ? { ...crit, level } : crit
    );
    const updatedArt: Artwork = {
      ...selectedArtwork,
      feedback: {
        ...selectedArtwork.feedback,
        criteriaReviews: updatedReviews,
      },
    };
    setArtworks((prev) => prev.map((a) => (a.id === updatedArt.id ? updatedArt : a)));
    setSelectedArtwork(updatedArt);
    saveArtworkToFirestore(updatedArt);
  };

  // Lưu lời phê giáo viên
  const handleSaveTeacherNotes = () => {
    if (!selectedArtwork || !selectedArtwork.feedback) return;
    const updated: Artwork = {
      ...selectedArtwork,
      feedback: {
        ...selectedArtwork.feedback,
        teacherNotes: teacherNotesInput,
      },
    };
    setArtworks((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedArtwork(updated);
    setIsEditingTeacherNotes(false);
    saveArtworkToFirestore(updated);
  };

  // Lưu góc tự đánh giá của học sinh
  const handleSaveSelfReflection = () => {
    if (!selectedArtwork) return;
    const updated: Artwork = {
      ...selectedArtwork,
      selfReflection: {
        reflectionText: reflectionInput,
        learningPoints: "Rút ra bài học về phối màu và hoàn thiện chi tiết.",
        updatedAt: new Date().toISOString(),
      },
    };
    setArtworks((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedArtwork(updated);
    setIsReflectionModalOpen(false);
    saveArtworkToFirestore(updated);
  };

  // Công khai triển lãm (ở chân bảng trượt)
  const handleToggleExhibition = (artworkId: string) => {
    const target = artworks.find((a) => a.id === artworkId);
    if (!target) return;

    if (!target.isPublic && target.feedback?.status !== "approved") {
      alert("Chỉ có thể công khai tác phẩm lên Triển lãm sau khi đã Duyệt & Phát hành nhận xét sư phạm.");
      return;
    }

    setArtworks((prev) =>
      prev.map((art) => {
        if (art.id === artworkId) {
          const updated = { ...art, isPublic: !art.isPublic };
          if (selectedArtwork?.id === artworkId) setSelectedArtwork(updated);
          saveArtworkToFirestore(updated);
          return updated;
        }
        return art;
      })
    );
  };

  // Helper tự động tạo tiêu chí Rubric từ Yêu cầu cần đạt
  const handleGenerateCriteriaFromReqs = () => {
    const reqLines = newTopicReqs
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    if (reqLines.length === 0) {
      alert("Vui lòng nhập các dòng Yêu cầu cần đạt cốt lõi trước.");
      return;
    }

    const equalWeight = Math.floor(100 / reqLines.length);
    const remainder = 100 - equalWeight * reqLines.length;

    const generated: RubricCriterion[] = reqLines.map((req, idx) => ({
      id: `crit_gen_${Date.now()}_${idx}`,
      name: req.length > 28 ? req.slice(0, 28) + "..." : req,
      description: req,
      weight: idx === 0 ? equalWeight + remainder : equalWeight,
    }));

    setNewTopicCriteria(generated);
  };

  // Thêm tiêu chí rubric mới
  const handleAddCriterion = () => {
    const newCrit: RubricCriterion = {
      id: `crit_${Date.now()}`,
      name: "Tiêu chí mới",
      description: "Mô tả yêu cầu cần đạt của bài học...",
      weight: 10,
    };
    setNewTopicCriteria((prev) => [...prev, newCrit]);
  };

  const handleRemoveCriterion = (id: string) => {
    if (newTopicCriteria.length <= 1) {
      alert("Bài học cần tối thiểu 1 tiêu chí đánh giá.");
      return;
    }
    setNewTopicCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCriterion = (id: string, field: keyof RubricCriterion, value: string | number) => {
    setNewTopicCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const totalNewCriteriaWeight = newTopicCriteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  // Thêm chủ đề mới từ modal
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    if (totalNewCriteriaWeight !== 100) {
      alert(`Tổng trọng số các tiêu chí Rubric phải đúng 100% (Hiện tại là: ${totalNewCriteriaWeight}%). Vui lòng điều chỉnh lại.`);
      return;
    }

    const reqArray = newTopicReqs
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    const createdTopic: Topic = {
      id: `topic_${Date.now()}`,
      grade: newTopicGrade,
      classId: selectedClass.id,
      title: newTopicTitle,
      description: newTopicDesc || "Thực hành sáng tạo mĩ thuật.",
      requirements: reqArray.length > 0 ? reqArray : newTopicCriteria.map((c) => c.description),
      rubric: newTopicCriteria,
      createdAt: new Date().toISOString().split("T")[0],
      isActive: true,
    };

    setTopics((prev) => [createdTopic, ...prev]);
    setSelectedTopic(createdTopic);
    if (newTopicGrade !== selectedGrade) {
      handleSelectGrade(newTopicGrade);
    }
    setIsCreateTopicModalOpen(false);
    setNewTopicTitle("");
    setNewTopicDesc("");
    setNewTopicReqs("");
    saveTopicToFirestore(createdTopic);
  };

  // Số lượng bài đã nộp của lớp hiện tại
  const currentClassArtworks = artworks.filter((a) => a.classId === selectedClass.id);
  const classesInSelectedGrade = classes.filter((c) => c.grade === selectedGrade);
  const is3DGallery = activeNav === "gallery" && galleryViewMode === "3d";

  // CHƯA ĐĂNG NHẬP HOẶC ĐANG HYDRATE: HIỂN THỊ TRANG ĐĂNG NHẬP ĐỒNG BỘ 100% VỚI SSR
  return (
    <>
      {!hasHydrated || !isLoggedIn ? (
        <LoginPage
          classes={classes}
          students={students}
          onLoginTeacher={handleLoginTeacher}
          onLoginStudent={handleLoginStudent}
          onLoginGuest={handleLoginGuest}
        />
      ) : (
        <div className="flex h-screen h-[100dvh] max-h-[100dvh] w-full bg-[#FAF8F5] text-[#1E1C1A] overflow-hidden overscroll-none select-none print:h-auto print:overflow-visible print:block">
          {/* =========================================================================
          1. TRỤC ĐIỀU HƯỚNG CỐ ĐỊNH BÊN TRÁI (w-60)
          Tích hợp Bộ quản lý 4 Khối & 16 Lớp học THCS
      ========================================================================= */}
          {/* LỚP PHỦ MỜ NỀN KHI MỞ SIDEBAR */}
          {isMobileSidebarOpen && (
            <div
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-40 animate-in fade-in duration-200"
              aria-hidden="true"
            />
          )}

          {/* =========================================================================
          1. TRỤC ĐIỀU HƯỚNG BÊN TRÁI (w-60)
          Tích hợp Bộ quản lý 4 Khối & 16 Lớp học THCS
          - Trong phòng tranh 3D hoặc trên điện thoại (kể cả xoay ngang): Ẩn hoàn toàn, chỉ mở khi bấm Menu
          - Desktop (lg+): Cố định bên trái khi ở các màn hình thông thường
      ========================================================================= */}
          <aside
            className={`w-64 md:w-60 shrink-0 bg-white border-r border-[#EAE5DC] flex flex-col justify-between h-full z-50 print:hidden transition-transform duration-300 ease-in-out
              fixed inset-y-0 left-0
              ${is3DGallery
                ? (isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full")
                : (isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:static lg:translate-x-0")
              }
            `}
          >
            <div className="p-3.5 flex flex-col h-full overflow-y-auto pb-10 md:pb-3.5">
              {/* Logo ứng dụng & Nút đóng */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#F6EDE8] border border-[#E8D7CF] flex items-center justify-center text-[#C86446] shrink-0">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-serif font-bold text-[#1E1C1A] text-sm truncate">
                        ArtProgress
                      </span>
                      <span className="text-[8px] bg-[#F6EDE8] text-[#C86446] font-semibold px-1 rounded-full uppercase shrink-0">
                        AI
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 truncate">
                      Mĩ thuật tiến bộ số &bull; v{APP_VERSION}
                    </p>
                  </div>
                </div>

                {/* Nút đóng Sidebar */}
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`${is3DGallery ? "flex" : "lg:hidden flex"} w-8 h-8 rounded-lg items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shrink-0 ml-1`}
                  title="Đóng thanh điều hướng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* THẺ TÀI KHOẢN ĐANG ĐĂNG NHẬP & NÚT ĐĂNG XUẤT (ĐƯỢC ĐẨY LÊN TRÊN ĐỂ LUÔN THẤY RÕ) */}
              <div className="py-2.5 border-b border-[#F0EBE1]">
                <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#EAE5DC] flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-xs ${role === "teacher"
                        ? "bg-[#C86446]"
                        : role === "student"
                          ? "bg-[#4F6B58]"
                          : "bg-[#1E1C1A]"
                        }`}
                    >
                      {role === "teacher" ? (
                        <GraduationCap className="w-4 h-4" />
                      ) : role === "student" ? (
                        currentStudent?.name?.charAt(0) || "H"
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif font-bold text-xs text-[#1E1C1A] truncate">
                        {role === "teacher"
                          ? "Thầy/Cô Mĩ thuật"
                          : role === "student"
                            ? (currentStudent?.name || "Học sinh")
                            : "Khách tham quan"}
                      </p>
                      <p className="text-[10px] text-stone-500 truncate font-sans">
                        {role === "teacher"
                          ? "Quyền Sư phạm"
                          : role === "student"
                            ? `${selectedClass.name} • ${currentStudent?.id || "Chưa có mã"}`
                            : "Triển lãm trực tuyến"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* =======================================================================
              KHỐI THÔNG TIN LỚP HỌC (PHÂN BIỆT RÕ HỌC SINH VÀ GIÁO VIÊN)
          ======================================================================= */}
              {role === "student" ? (
                <div className="pt-3 pb-2 border-b border-[#F0EBE1] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
                      <School className="w-3 h-3 text-[#C86446]" />
                      Lớp học của em
                    </span>
                    <span className="text-[9.5px] font-bold text-[#C86446] bg-[#F6EDE8] px-2 py-0.5 rounded-full border border-[#E8D7CF]">
                      Khối {selectedGrade}
                    </span>
                  </div>

                  {/* Thẻ thông tin lớp học dành riêng cho học sinh */}
                  <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE5DC] text-[10px] space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-stone-900 font-bold text-xs">{selectedClass.name}</strong>
                      <span className="text-stone-500 font-medium">Năm học {selectedClass.schoolYear}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600 text-[10px] pt-1 border-t border-stone-200/50">
                      <span>Bài vẽ của em: <strong className="text-[#4F6B58] font-bold">{displayArtworks.length} bài</strong></span>
                      <span>Mã HS: <strong className="text-stone-800 font-mono font-bold">{currentStudent?.id || "Chưa có"}</strong></span>
                    </div>
                  </div>
                </div>
              ) : role === "guest" ? (
                <div className="pt-3 pb-2 border-b border-[#F0EBE1] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
                      <Globe className="w-3 h-3 text-[#4F6B58]" />
                      Chế độ Khách
                    </span>
                    <span className="text-[9.5px] font-bold text-[#4F6B58] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Tham quan
                    </span>
                  </div>

                  {/* Thẻ thông tin dành cho khách tham quan */}
                  <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE5DC] text-[10px] space-y-1 shadow-2xs">
                    <strong className="text-stone-900 font-bold text-xs block">Phòng Triển Lãm Nghệ Thuật</strong>
                    <p className="text-stone-500 text-[10px] leading-relaxed">
                      Trưng bày các tác phẩm mĩ thuật tiêu biểu của học sinh THCS đã được giáo viên duyệt công khai.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="pt-3 pb-2 border-b border-[#F0EBE1] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
                      <School className="w-3 h-3 text-[#C86446]" />
                      Quản lý Khối & Lớp
                    </span>
                    <span className="text-[9px] text-[#4F6B58] font-bold">16 Lớp</span>
                  </div>

                  {/* Chọn 4 Khối: Khối 6, Khối 7, Khối 8, Khối 9 */}
                  <div className="grid grid-cols-4 gap-1 bg-[#F5F2EB] p-0.5 rounded-lg text-[10px] font-bold">
                    {[6, 7, 8, 9].map((gr) => (
                      <button
                        key={gr}
                        type="button"
                        onClick={() => handleSelectGrade(gr)}
                        className={`py-1 rounded text-center transition-all cursor-pointer ${selectedGrade === gr
                          ? "bg-white text-[#C86446] shadow-xs"
                          : "text-stone-500 hover:text-stone-900"
                          }`}
                      >
                        K{gr}
                      </button>
                    ))}
                  </div>

                  {/* Chọn 4 Lớp trong Khối đã chọn (ví dụ: 7A1, 7A2, 7A3, 7A4) */}
                  <div className="grid grid-cols-4 gap-1 text-[11px] font-semibold">
                    {classesInSelectedGrade.map((cl) => {
                      const isCurrentClass = selectedClass.id === cl.id;
                      return (
                        <button
                          key={cl.id}
                          type="button"
                          onClick={() => handleSelectClass(cl)}
                          className={`py-1 rounded-md text-center border transition-all cursor-pointer ${isCurrentClass
                            ? "bg-[#C86446] text-white border-[#C86446] shadow-xs"
                            : "bg-white text-stone-700 border-[#EAE5DC] hover:border-[#C86446] hover:bg-[#FAF8F5]"
                            }`}
                        >
                          {cl.name.replace("Lớp ", "")}
                        </button>
                      );
                    })}
                  </div>

                  {/* Thông số nhanh của Lớp đang chọn & Nút Quản lý Học sinh */}
                  <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#EAE5DC] text-[10px] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-stone-800 font-bold">{selectedClass.name}</strong>
                      <button
                        type="button"
                        onClick={() => setIsStudentRosterModalOpen(true)}
                        className="text-[9.5px] bg-white border border-[#EAE5DC] hover:border-[#C86446] text-[#C86446] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs hover:bg-[#FDFBF7] transition-all cursor-pointer"
                        title="Xem và bổ sung tài khoản học sinh vào lớp"
                      >
                        <Users className="w-3 h-3" />
                        <span>Quản lý HS ({classStudents.length})</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-stone-500 text-[9.5px]">
                      <span>Đã nộp: <strong className="text-[#4F6B58]">{currentClassArtworks.length} bài</strong></span>
                      <span>Chờ duyệt: <strong className="text-[#C86446]">{currentClassArtworks.filter(a => a.feedback?.status === "pending_moderation").length}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Điều Hướng */}
              <nav className="mt-3 space-y-1 flex-1">
                <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider px-2 block mb-1">
                  Không gian làm việc
                </span>

                {/* Hồ sơ sáng tạo */}
                {role === "guest" ? (
                  <div
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-300 cursor-not-allowed"
                    title="Hồ sơ sáng tạo chỉ dành cho Giáo viên & Học sinh trong lớp"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                      <span>Hồ sơ sáng tạo</span>
                    </span>
                    <span className="text-[9px] bg-stone-100 text-stone-400 px-1 rounded">Nội bộ</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentNav("portfolio");
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeNav === "portfolio"
                      ? "bg-[#F5F2EB] text-[#1E1C1A] font-semibold"
                      : "text-stone-600 hover:bg-[#FAF8F5] hover:text-stone-900"
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-[#C86446] shrink-0" />
                      <span>{role === "student" ? "Bài vẽ của em" : `Bài vẽ ${selectedClass.name}`}</span>
                    </span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-mono font-bold">
                      {displayArtworks.length}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCurrentNav("topics");
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeNav === "topics"
                    ? "bg-[#F5F2EB] text-[#1E1C1A] font-semibold"
                    : "text-stone-600 hover:bg-[#FAF8F5] hover:text-stone-900"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#C86446] shrink-0" />
                    <span>Chủ đề (Khối {selectedGrade})</span>
                  </span>
                  <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-mono font-bold">
                    {currentGradeTopics.length}
                  </span>
                </button>

                {/* Rubric theo Yêu cầu cần đạt của bài học */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentNav("rubric");
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeNav === "rubric"
                    ? "bg-[#F5F2EB] text-[#1E1C1A] font-semibold"
                    : "text-stone-600 hover:bg-[#FAF8F5] hover:text-stone-900"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-[#C86446] shrink-0" />
                    <span>Rubric bài học</span>
                  </span>
                  <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-mono">
                    {selectedTopic ? selectedTopic.rubric.length : 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentNav("gallery");
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeNav === "gallery"
                    ? "bg-[#F5F2EB] text-[#1E1C1A] font-semibold"
                    : "text-stone-600 hover:bg-[#FAF8F5] hover:text-stone-900"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-[#4F6B58] shrink-0" />
                    <span>Phòng Triển Lãm</span>
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-mono font-bold">
                    {artworks.filter((a) => a.isPublic).length}
                  </span>
                </button>
              </nav>

              {/* Nút nộp bài của học sinh */}
              {role === "student" && (
                <div className="my-2.5">
                  <button
                    type="button"
                    disabled={currentGradeTopics.length === 0 || !currentGradeTopics.some((t) => t.isActive)}
                    onClick={() => {
                      setIsRevisionUpload(false);
                      setIsUploadModalOpen(true);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full py-2 px-2.5 rounded-lg text-xs font-medium shadow-xs flex items-center justify-center gap-1.5 transition-all ${currentGradeTopics.some((t) => t.isActive)
                      ? "bg-[#1E1C1A] hover:bg-[#C86446] text-[#FAF8F5] cursor-pointer"
                      : "bg-stone-200 text-stone-400 cursor-not-allowed"
                      }`}
                    title={
                      currentGradeTopics.length === 0
                        ? "Chưa có chủ đề bài học nào"
                        : !currentGradeTopics.some((t) => t.isActive)
                          ? "Tất cả chủ đề đã đóng nộp bài"
                          : "Chọn chủ đề và nộp bài vẽ"
                    }
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {currentGradeTopics.length === 0
                        ? "Chưa có bài học"
                        : currentGradeTopics.some((t) => t.isActive)
                          ? "Nộp bài vẽ mới"
                          : "Đã đóng nộp bài"}
                    </span>
                  </button>
                </div>
              )}

              {/* PHẦN CHÂN THANH ĐIỀU HƯỚNG */}
              <div className="pt-2.5 border-t border-[#F0EBE1] mt-auto shrink-0">
                <div className="flex items-center justify-between px-1 text-[9px] text-stone-400 font-mono">
                  <span>ArtProgress Studio</span>
                  <span className="bg-[#FAF8F5] border border-[#EAE5DC] px-1.5 py-0.2 rounded font-semibold text-stone-500">
                    v{APP_VERSION}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* =========================================================================
          2. NỘI DUNG CHÍNH (FULL VIEW HOẶC CẤU TRÚC WORKSPACE VỚI BẢNG TRƯỢT DRAWER)
      ========================================================================= */}
          <main className="flex-1 flex flex-col h-full overflow-hidden print:hidden min-w-0">
            {/* THANH TOP HEADER DÀNH RIÊNG CHO MOBILE (< md) - TỰ ĐỘNG ẨN KHI Ở PHÒNG TRANH 3D ĐỂ TẠO KHÔNG GIAN TOÀN MÀN HÌNH */}
            {!(activeNav === "gallery" && galleryViewMode === "3d") && (
              <header className="md:hidden h-14 bg-white border-b border-[#EAE5DC] px-3.5 flex items-center justify-between z-20 shrink-0 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#EAE5DC] hover:border-[#C86446] text-stone-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                    title="Mở menu điều hướng"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-bold text-[#1E1C1A] text-xs truncate">
                        ArtProgress
                      </span>
                      <span className="text-[8.5px] font-bold text-[#C86446] bg-[#F6EDE8] px-1.5 py-0.2 rounded-full border border-[#E8D7CF] truncate">
                        {role === "student" ? selectedClass.name : role === "teacher" ? `Khối ${selectedGrade} • ${selectedClass.name}` : "Triển lãm"}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-stone-400 truncate font-sans">
                      {activeNav === "portfolio" ? "Hồ sơ bài vẽ" : activeNav === "topics" ? "Chủ đề bài học" : activeNav === "rubric" ? "Rubric bài học" : "Phòng triển lãm"}
                    </p>
                  </div>
                </div>

                {/* Tác vụ nhanh bên phải mobile header */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {role === "student" && (
                    <button
                      type="button"
                      disabled={currentGradeTopics.length === 0 || !currentGradeTopics.some((t) => t.isActive)}
                      onClick={() => {
                        setIsRevisionUpload(false);
                        setIsUploadModalOpen(true);
                      }}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-all ${currentGradeTopics.some((t) => t.isActive)
                          ? "bg-[#C86446] text-white active:scale-95 cursor-pointer"
                          : "bg-stone-200 text-stone-400 cursor-not-allowed"
                        }`}
                      title="Nộp bài vẽ mới"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold">Nộp bài</span>
                    </button>
                  )}

                  {role === "teacher" && activeNav === "topics" && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewTopicGrade(selectedGrade);
                        setIsCreateTopicModalOpen(true);
                      }}
                      className="py-1.5 px-2.5 bg-[#C86446] text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tạo</span>
                    </button>
                  )}

                  {role === "teacher" && activeNav === "portfolio" && (
                    <button
                      type="button"
                      onClick={() => setIsStudentRosterModalOpen(true)}
                      className="py-1.5 px-2 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] text-[#C86446] text-[11px] font-bold shadow-2xs flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="Quản lý học sinh"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>HS ({classStudents.length})</span>
                    </button>
                  )}

                  {/* Đổi góc làm việc nhanh giữa Bài vẽ & Chủ đề */}
                  <button
                    type="button"
                    onClick={() => {
                      if (activeNav === "portfolio") setCurrentNav("topics");
                      else setCurrentNav("portfolio");
                    }}
                    className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] text-stone-600 hover:text-[#C86446] flex items-center justify-center text-[10px] active:scale-95 transition-all cursor-pointer"
                    title="Chuyển chế độ xem"
                  >
                    {activeNav === "portfolio" ? <BookOpen className="w-3.5 h-3.5 text-[#C86446]" /> : <Layers className="w-3.5 h-3.5 text-[#C86446]" />}
                  </button>
                </div>
              </header>
            )}
            {/* VIEW 1: CHỦ ĐỀ BÀI HỌC (CÓ NÚT ĐÓNG / MỞ NỘP BÀI) */}
            {activeNav === "topics" && (
              <div className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto space-y-4 sm:space-y-6 max-w-5xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE5DC] pb-4">
                  <div>
                    <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1C1A] flex items-center gap-2">
                      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#C86446]" />
                      <span>Chủ Đề & Nhiệm Vụ Bài Học Mĩ Thuật — Khối {selectedGrade}</span>
                    </h1>
                    <p className="text-xs text-stone-500 mt-1">
                      Quản lý các chủ đề thực hành theo từng khối lớp và trạng thái đóng/mở nhận bài nộp
                    </p>
                  </div>

                  {role === "teacher" && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewTopicGrade(selectedGrade);
                        setIsCreateTopicModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-[#1E1C1A] text-white text-xs font-medium rounded-xl hover:bg-[#C86446] transition-colors flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tạo chủ đề & Thiết lập Rubric</span>
                    </button>
                  )}
                </div>

                {/* Thanh chuyển nhanh Khối lớp (Chỉ hiển thị cho Giáo viên) */}
                {role === "teacher" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-[#EAE5DC] shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-bold text-stone-700 shrink-0">Khối lớp:</span>
                      <div className="flex gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE5DC] overflow-x-auto no-scrollbar">
                        {[6, 7, 8, 9].map((gr) => (
                          <button
                            key={gr}
                            type="button"
                            onClick={() => handleSelectGrade(gr)}
                            className={`px-3 sm:px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${selectedGrade === gr
                              ? "bg-[#C86446] text-white shadow-xs"
                              : "text-stone-600 hover:bg-stone-200/60"
                              }`}
                          >
                            Khối {gr}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-[11px] sm:text-xs text-stone-500">
                      Đang hiển thị <strong>{currentGradeTopics.length} chủ đề</strong> áp dụng cho <strong className="text-[#C86446]">Khối {selectedGrade}</strong>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {currentGradeTopics.length === 0 ? (
                    <div className="text-center py-10 sm:py-12 bg-white rounded-2xl border border-dashed border-stone-300 p-6 sm:p-8 space-y-3">
                      <p className="text-sm text-stone-500">Khối {selectedGrade} hiện chưa có chủ đề bài học nào.</p>
                      {role === "teacher" && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewTopicGrade(selectedGrade);
                            setIsCreateTopicModalOpen(true);
                          }}
                          className="px-4 py-2 bg-[#C86446] text-white text-xs font-semibold rounded-xl hover:bg-[#B25337] transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tạo chủ đề đầu tiên cho Khối {selectedGrade}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    currentGradeTopics.map((t) => {
                      const topicArtworkCount = artworks.filter((a) => a.topicId === t.id && a.classId === selectedClass.id).length;
                      return (
                        <div
                          key={t.id}
                          className="bg-white rounded-2xl p-4 sm:p-6 border border-[#EAE5DC] shadow-xs space-y-4 hover:border-stone-300 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] bg-[#F6EDE8] text-[#C86446] font-bold px-2 py-0.5 rounded-full uppercase">
                                  Học kỳ I • Khối {t.grade || selectedGrade} • {selectedClass.name}
                                </span>
                                <span className="text-xs text-stone-400">Năm học 2025–2026</span>
                              </div>
                              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1E1C1A] mt-2">
                                {t.title}
                              </h2>
                              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                                {t.description}
                              </p>
                            </div>

                            {/* KHỐI NÚT ĐÓNG / MỞ NỘP BÀI VÀ XÓA CHỦ ĐỀ DÀNH CHO GIÁO VIÊN */}
                            <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
                              {t.isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-emerald-50 text-emerald-800 text-[11px] sm:text-xs font-semibold rounded-full border border-emerald-200">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Đang mở nộp bài
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-stone-100 text-stone-600 text-[11px] sm:text-xs font-semibold rounded-full border border-stone-200">
                                  <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                                  Đã đóng nộp bài
                                </span>
                              )}

                              {role === "teacher" && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTopicStatus(t.id)}
                                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${t.isActive
                                      ? "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300"
                                      : "bg-[#4F6B58] hover:bg-[#3D5344] text-white border-[#4F6B58]"
                                      }`}
                                  >
                                    {t.isActive ? "Đóng nộp" : "Mở nộp"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTopic(t.id)}
                                    className="px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                                    title="Xóa chủ đề này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Xóa</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[#F0EBE1]">
                            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                              Yêu cầu cần đạt cốt lõi:
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                              {t.requirements.map((req, idx) => (
                                <div key={idx} className="p-2.5 sm:p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE5DC] text-xs text-stone-600 leading-relaxed flex gap-2">
                                  <span className="font-bold text-[#C86446]">{idx + 1}.</span>
                                  <span>{req}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-stone-500">
                            <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs">
                              <span className="flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-stone-400" />
                                Đã có {topicArtworkCount} học sinh {selectedClass.name} nộp bài
                              </span>
                              <span className="flex items-center gap-1.5 text-stone-400">
                                <Award className="w-3.5 h-3.5" />
                                {t.rubric.length} tiêu chí Rubric bài học
                              </span>
                            </div>

                            {role !== "guest" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTopic(t);
                                  setTopicFilter(t.id);
                                  setCurrentNav("portfolio");
                                }}
                                className="text-[#C86446] font-semibold hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                              >
                                <span>Xem hồ sơ bài nộp {selectedClass.name}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }))}
                </div>
              </div>
            )}

            {/* VIEW 2: RUBRIC THEO YÊU CẦU CẦN ĐẠT CỦA BÀI HỌC */}
            {activeNav === "rubric" && (
              <div className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto space-y-4 sm:space-y-6 max-w-5xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE5DC] pb-4">
                  <div>
                    <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1C1A] flex items-center gap-2">
                      <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#C86446]" />
                      <span>Rubric Đánh Giá Theo Yêu Cầu Cần Đạt Bài Học</span>
                    </h1>
                    <p className="text-xs text-stone-500 mt-1">
                      Bộ thước đo sư phạm được thiết lập riêng cho từng chủ đề bài học để làm căn cứ phân tích AI
                    </p>
                  </div>

                  {/* Hộp chọn chủ đề */}
                  {selectedTopic && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-stone-500 font-medium">Chủ đề (Khối {selectedGrade}):</span>
                      <select
                        value={selectedTopic.id}
                        onChange={(e) => {
                          const tp = currentGradeTopics.find((t) => t.id === e.target.value);
                          if (tp) setSelectedTopic(tp);
                        }}
                        className="text-xs bg-white border border-[#EAE5DC] rounded-xl px-2.5 sm:px-3 py-1.5 font-medium text-stone-800 focus:outline-none cursor-pointer max-w-[200px] truncate"
                      >
                        {currentGradeTopics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs font-semibold px-2.5 sm:px-3 py-1 bg-[#F5F2EB] text-[#C86446] rounded-full border border-[#E2DBD0]">
                        Tổng: 100%
                      </div>
                      {role === "teacher" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(selectedTopic.id)}
                          className="text-xs font-semibold px-2.5 py-1 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          title="Xóa chủ đề bài học này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Xóa chủ đề</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!selectedTopic ? (
                  <div className="text-center py-12 sm:py-16 bg-white rounded-3xl border border-dashed border-[#EAE5DC] p-6 space-y-3">
                    <Award className="w-10 h-10 sm:w-12 sm:h-12 text-stone-300 mx-auto" />
                    <h3 className="text-base font-bold text-stone-700">Chưa có chủ đề bài học nào ở Khối {selectedGrade}</h3>
                    <p className="text-xs text-stone-500 max-w-md mx-auto">
                      {role === "teacher"
                        ? "Thầy/Cô hãy bấm 'Tạo chủ đề & Rubric mới' để thiết lập bài học đầu tiên."
                        : "Thầy/Cô chưa mở chủ đề bài học nào cho khối lớp này."}
                    </p>
                    {role === "teacher" && (
                      <button
                        type="button"
                        onClick={() => setIsCreateTopicModalOpen(true)}
                        className="px-4 py-2 bg-[#C86446] hover:bg-[#B3553A] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tạo chủ đề &amp; Rubric mới</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {selectedTopic.rubric.map((r, index) => (
                      <div
                        key={r.id}
                        className="bg-white rounded-2xl p-4 sm:p-6 border border-[#EAE5DC] shadow-xs space-y-3 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#F6EDE8] text-[#C86446] text-xs font-bold flex items-center justify-center">
                              0{index + 1}
                            </span>
                            <h3 className="font-serif text-sm sm:text-base font-bold text-[#1E1C1A]">
                              {r.name}
                            </h3>
                          </div>
                          <span className="font-serif text-base sm:text-lg font-bold text-[#C86446]">
                            {r.weight}%
                          </span>
                        </div>

                        <p className="text-xs text-stone-600 leading-relaxed bg-[#FAF8F5] p-2.5 sm:p-3 rounded-xl border border-[#EAE5DC]">
                          <strong className="text-stone-800">Yêu cầu cần đạt:</strong> {r.description}
                        </p>

                        <div className="space-y-1.5 pt-2 text-[11px] text-stone-500">
                          <p className="font-medium text-stone-700">Mức độ đạt được của học sinh:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center font-medium pt-1 text-[11px]">
                            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">Chưa đạt</span>
                            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">Đạt</span>
                            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">Tốt</span>
                            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">Xuất sắc</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: PHÒNG TRIỂN LÃM CÔNG KHAI (HỖ TRỢ CHẾ ĐỘ 3D VÀ LƯỚI 2D) */}
            {activeNav === "gallery" && (
              galleryViewMode === "3d" ? (
                <div className="fixed inset-0 z-30 w-full h-[100dvh] relative overflow-hidden flex flex-col min-h-0 bg-[#1A1614] touch-none overscroll-none">
                  <Gallery3DView
                    artworks={publicArtworks}
                    onSelectArtwork={handleSelectGalleryArtwork}
                    onSwitchToGrid={handleSwitchToGrid}
                    onToggleSidebar={() => setIsMobileSidebarOpen(true)}
                  />
                </div>
              ) : (
                <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 flex flex-col min-h-0">
                  <>
                    <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-4">
                      <div>
                        <h1 className="font-serif text-2xl font-bold text-[#1E1C1A] flex items-center gap-2">
                          <Globe className="w-5 h-5 text-[#C86446]" />
                          Phòng Triển Lãm Mĩ Thuật Trực Tuyến
                        </h1>
                        <p className="text-xs text-stone-500 mt-1 font-sans">
                          Tuyển tập các tác phẩm xuất sắc từ 16 lớp THCS đã được Giáo viên phê duyệt công khai. Bấm vào tranh để xem hành trình đối sánh Before – After.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setGalleryViewMode("3d")}
                          type="button"
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                          <span>Bước vào Phòng 3D</span>
                        </button>
                        <span className="text-xs font-medium px-3 py-1 bg-[#F5F2EB] text-stone-700 border border-[#E2DBD0] rounded-full">
                          {artworks.filter((a) => a.isPublic).length} tác phẩm
                        </span>
                      </div>
                    </div>

                    {artworks.filter((a) => a.isPublic).length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-[#EAE5DC] space-y-2">
                        <Globe className="w-12 h-12 text-stone-300 mx-auto" />
                        <h3 className="text-base font-bold text-stone-700">Phòng triển lãm chưa có tác phẩm</h3>
                        <p className="text-xs text-stone-500 max-w-md mx-auto">
                          Khi Giáo viên duyệt công khai bài vẽ của học sinh, các bức tranh xuất sắc sẽ được trưng bày tại đây.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {artworks
                          .filter((a) => a.isPublic)
                          .map((art) => (
                            <div
                              key={art.id}
                              onClick={() => setGalleryModalArtwork(art)}
                              className="artwork-frame rounded-2xl overflow-hidden transition-all group cursor-pointer bg-white border border-[#EAE5DC] hover:border-[#C86446] shadow-xs hover:shadow-md"
                            >
                              <div className="relative aspect-4/3 bg-[#F5F2EB] overflow-hidden">
                                <Image
                                  src={art.revisedImageUrl || art.initialImageUrl}
                                  alt={art.title}
                                  fill
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                                />
                                {art.revisedImageUrl && (
                                  <span className="absolute top-3 left-3 bg-[#4F6B58] text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                                    <Sliders className="w-3 h-3" /> Đối sánh tiến bộ
                                  </span>
                                )}
                                <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                                  <Eye className="w-4 h-4" />
                                  <span>Xem chi tiết tác phẩm</span>
                                </div>
                              </div>
                              <div className="p-5 space-y-3">
                                <div>
                                  <h3 className="font-serif text-base font-bold text-[#1E1C1A] group-hover:text-[#C86446] transition-colors">
                                    {art.title}
                                  </h3>
                                  <p className="text-xs text-stone-500 mt-0.5">
                                    Tác giả: <strong className="text-stone-800">{art.studentName}</strong> • {art.classId.toUpperCase()}
                                  </p>
                                </div>

                                {art.feedback?.overallStrength && (
                                  <p className="text-xs text-stone-600 italic bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE5DC]">
                                    &ldquo;{art.feedback.overallStrength}&rdquo;
                                  </p>
                                )}

                                {art.selfReflection && (
                                  <div className="text-[11px] text-stone-500 pt-2 border-t border-[#F0EBE1]">
                                    <span className="font-semibold text-stone-700">Tự đánh giá: </span>
                                    {art.selfReflection.reflectionText}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                </div>
              )
            )}

            {/* VIEW 4: CẤU TRÚC WORKSPACE TÍCH HỢP BẢNG TRƯỢT DRAWER */}
            {activeNav === "portfolio" && (
              <div className="flex-1 flex overflow-hidden h-full relative">
                {/* CỘT 1: DANH SÁCH BÀI VẼ THEO LỚP ĐANG CHỌN (w-64) */}
                <section className={`${mobilePortfolioView === "detail" ? "hidden md:flex" : "flex"} w-full md:w-64 lg:w-72 shrink-0 border-r border-[#EAE5DC] bg-white flex-col h-full z-10`}>
                  <div className="p-3 border-b border-[#F0EBE1] space-y-2 shrink-0">
                    <div className="flex items-center justify-between">
                      <h2 className="font-serif text-xs font-bold text-[#1E1C1A] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#C86446]" />
                        {role === "student" ? `Bài của em (${currentStudent?.name ? currentStudent.name.split(" ").pop() : "Học sinh"})` : `Bài vẽ ${selectedClass.name}`}
                      </h2>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-[#F5F2EB] text-stone-600">
                        {filteredArtworks.length}
                      </span>
                    </div>

                    {/* Bộ lọc theo Chủ đề của Khối đang chọn */}
                    <select
                      value={topicFilter}
                      onChange={(e) => setTopicFilter(e.target.value)}
                      className="w-full text-[10.5px] bg-[#FAF8F5] border border-[#EAE5DC] rounded-lg px-2 py-1 text-stone-700 focus:outline-none cursor-pointer font-medium"
                    >
                      <option value="all">Tất cả chủ đề (Khối {selectedGrade})</option>
                      {currentGradeTopics.map((tp) => (
                        <option key={tp.id} value={tp.id}>
                          {tp.title}
                        </option>
                      ))}
                    </select>

                    {/* Thanh lọc nhanh trạng thái */}
                    <div className="flex bg-[#F5F2EB] p-0.5 rounded-lg text-[10px] font-medium text-stone-600">
                      <button
                        type="button"
                        onClick={() => setFilterMode("all")}
                        className={`flex-1 py-0.5 rounded transition-all cursor-pointer ${filterMode === "all" ? "bg-white text-stone-900 font-semibold shadow-xs" : "hover:text-stone-900"
                          }`}
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode("pending")}
                        className={`flex-1 py-0.5 rounded transition-all cursor-pointer ${filterMode === "pending" ? "bg-white text-[#C86446] font-semibold shadow-xs" : "hover:text-stone-900"
                          }`}
                      >
                        Chờ duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode("revised")}
                        className={`flex-1 py-0.5 rounded transition-all cursor-pointer ${filterMode === "revised" ? "bg-white text-[#4F6B58] font-semibold shadow-xs" : "hover:text-stone-900"
                          }`}
                      >
                        Đã sửa
                      </button>
                    </div>
                  </div>

                  {/* Danh sách bài vẽ cuộn độc lập */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {filteredArtworks.length === 0 ? (
                      <div className="p-6 text-center text-xs text-stone-400 italic space-y-1">
                        <p>Chưa có bài vẽ nào trong {selectedClass.name}.</p>
                        <p className="text-[10px]">Học sinh có thể nộp bài hoặc chọn lớp khác.</p>
                      </div>
                    ) : (
                      filteredArtworks.map((art) => {
                        const isSelected = selectedArtwork?.id === art.id;
                        const isPending = art.feedback?.status === "pending_moderation";

                        return (
                          <div
                            key={art.id}
                            onClick={() => {
                              setSelectedArtwork(art);
                              setMobilePortfolioView("detail");
                            }}
                            className={`group p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 relative ${isSelected
                              ? "bg-[#FAF8F5] border-[#C86446] ring-1 ring-[#C86446]/20 shadow-xs"
                              : "bg-white border-[#EAE5DC] hover:border-stone-300"
                              }`}
                          >
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#F5F2EB] shrink-0 border border-[#EAE5DC]">
                              <Image
                                src={art.initialImageUrl}
                                alt={art.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h3 className="font-serif text-[11px] font-bold text-[#1E1C1A] truncate">
                                  {art.title}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                  {isPending && (
                                    <span className="text-[8px] bg-[#F6EDE8] text-[#C86446] font-semibold px-1 py-0.2 rounded">
                                      Chờ
                                    </span>
                                  )}
                                  {role === "teacher" && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteArtwork(art.id);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-rose-600 rounded transition-opacity cursor-pointer"
                                      title="Xóa tác phẩm"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-[10px] text-stone-500 truncate font-sans">
                                {art.studentName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[9px] text-stone-400 font-sans mt-0.5">
                                <span>{new Date(art.submittedAt).toLocaleDateString("vi-VN")}</span>
                                {art.revisedImageUrl && (
                                  <span className="text-[#4F6B58] font-medium">✓ Sửa</span>
                                )}
                                {art.isPublic && (
                                  <span className="text-stone-700 font-medium">• Triển lãm</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                {/* VÙNG LÀM VIỆC CHÍNH */}
                <div className={`${mobilePortfolioView === "list" ? "hidden md:flex" : "flex"} flex-1 flex-col h-full overflow-hidden min-w-0`}>
                  {/* THANH HEADER BÀI VẼ: TINH GỌN, CO GIÃN THÔNG MINH, KHÔNG TRÀN LAYOUT */}
                  <div className="shrink-0 bg-white border-b border-[#EAE5DC] px-3 sm:px-4 md:px-6 py-2 md:py-0 md:h-13 flex flex-col md:flex-row md:items-center justify-between gap-2 z-10 shadow-xs">
                    {/* BÊN TRÁI (HOẶC HÀNG 1 TRÊN MOBILE): NÚT QUAY LẠI + THÔNG TIN TÁC PHẨM & HUY HIỆU */}
                    <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-2.5 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Nút quay lại danh sách bài vẽ trên mobile */}
                        <button
                          type="button"
                          onClick={() => setMobilePortfolioView("list")}
                          className="md:hidden flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-[#C86446] px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#EAE5DC] shrink-0 active:scale-95 cursor-pointer"
                          title="Quay lại danh sách bài vẽ"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Danh sách</span>
                        </button>

                        {selectedArtwork ? (
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h2
                                className="font-serif font-bold text-xs sm:text-sm text-[#1E1C1A] truncate max-w-[130px] sm:max-w-[180px] md:max-w-xs shrink"
                                title={selectedArtwork.title}
                              >
                                {selectedArtwork.title}
                              </h2>
                              {selectedArtwork.isPublic && (
                                <span className="text-emerald-700 shrink-0" title="Tác phẩm đang được trưng bày tại Phòng Triển Lãm">
                                  <Globe className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 truncate font-sans">
                              HS: <strong className="text-stone-800">{selectedArtwork.studentName}</strong> • {selectedClass.name}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400 italic">Chưa chọn tác phẩm</span>
                        )}
                      </div>

                      {/* Huy hiệu tiến trình thực tế của bài vẽ */}
                      {selectedArtwork && (
                        <div className="shrink-0 flex items-center gap-1">
                          {selectedArtwork.revisedImageUrl ? (
                            <span className="text-[9.5px] sm:text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <Sliders className="w-2.5 h-2.5" />
                              <span className="hidden sm:inline">Bản hoàn thiện</span>
                              <span className="sm:hidden">Đã sửa</span>
                            </span>
                          ) : (
                            <span className="text-[9.5px] sm:text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                              Phác thảo
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* BÊN PHẢI (HOẶC HÀNG 2 TRÊN MOBILE): CÁC NÚT THAO TÁC KHÔNG BAO GIỜ BỊ TRÀN */}
                    {selectedArtwork && (
                      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0 py-0.5">
                        {/* 1. NÚT TỰ ĐÁNH GIÁ (NỔI BẬT DÀNH CHO HỌC SINH & GIÁO VIÊN) */}
                        <button
                          type="button"
                          onClick={() => {
                            setReflectionInput(selectedArtwork.selfReflection?.reflectionText || "");
                            setIsReflectionModalOpen(true);
                          }}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 shrink-0 transition-all ${selectedArtwork.selfReflection
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                              : "bg-[#F6EDE8] border border-[#E8D7CF] text-[#C86446] hover:bg-[#F0DFD7]"
                            }`}
                          title="Tự đánh giá bài vẽ của em"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>
                            {selectedArtwork.selfReflection
                              ? role === "student" && selectedArtwork.studentId === currentStudent?.id
                                ? "Sửa tự đánh giá"
                                : "Xem tự đánh giá"
                              : "Tự đánh giá"}
                          </span>
                        </button>

                        {/* 2. NÚT PRIMARY: MỞ / THU GỌN BẢNG CHẤM ĐIỂM */}
                        <button
                          type="button"
                          onClick={() => setIsEvaluationDrawerOpen(!isEvaluationDrawerOpen)}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 sm:gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 ${isEvaluationDrawerOpen
                              ? "bg-[#C86446] text-white border-[#C86446]"
                              : "bg-white text-stone-700 border-[#E8D7CF] hover:bg-[#F6EDE8] hover:text-[#C86446]"
                            }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">{isEvaluationDrawerOpen ? "Thu gọn bảng điểm" : "Bảng chấm điểm"}</span>
                          <span className="md:hidden">{isEvaluationDrawerOpen ? "Đóng điểm" : "Điểm & Lời phê"}</span>
                          {selectedArtwork?.feedback?.status === "pending_moderation" && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                          )}
                        </button>

                        {/* 3. NÚT NỘP BẢN SỬA (CHỈ HIỂN THỊ KHI LÀ HỌC SINH TÁC GIẢ) */}
                        {role === "student" &&
                          selectedArtwork.studentId === currentStudent?.id &&
                          !selectedArtwork.revisedImageUrl && (() => {
                            const artworkTopic = topics.find((t) => t.id === selectedArtwork.topicId) || selectedTopic;
                            const isTopicActive = artworkTopic ? artworkTopic.isActive : false;
                            return (
                              <button
                                type="button"
                                disabled={!isTopicActive}
                                onClick={() => {
                                  if (artworkTopic) setSelectedTopic(artworkTopic);
                                  setIsRevisionUpload(true);
                                  setIsUploadModalOpen(true);
                                }}
                                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 sm:gap-1.5 transition-all shrink-0 active:scale-95 ${isTopicActive
                                    ? "bg-[#4F6B58] hover:bg-[#3D5344] text-white cursor-pointer"
                                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                                  }`}
                                title={!artworkTopic ? "Chưa có chủ đề bài học" : !isTopicActive ? "Chủ đề này đã đóng nộp bài" : ""}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Nộp bản sửa</span>
                              </button>
                            );
                          })()}

                        {/* 4. NÚT XUẤT BẢN IN BÁO CÁO TIẾN BỘ SƯ PHẠM */}
                        <button
                          type="button"
                          onClick={() => setIsReportModalOpen(true)}
                          className="px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#E8D7CF] bg-white hover:bg-[#FAF8F5] text-stone-700 hover:text-[#C86446] flex items-center gap-1 shadow-xs cursor-pointer transition-colors shrink-0 active:scale-95"
                          title="Xuất bản in báo cáo tiến bộ sư phạm khổ A4"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#C86446]" />
                          <span className="hidden sm:inline">Báo cáo (PDF)</span>
                        </button>

                        {/* 5. NÚT XÓA TÁC PHẨM (CHO GIÁO VIÊN HOẶC HỌC SINH TÁC GIẢ KHI ĐANG CHỜ DUYỆT) */}
                        {(role === "teacher" ||
                          (role === "student" &&
                            selectedArtwork.studentId === currentStudent?.id &&
                            selectedArtwork.feedback?.status === "pending_moderation")) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteArtwork(selectedArtwork.id)}
                              className="px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 flex items-center gap-1 shadow-xs cursor-pointer transition-colors shrink-0 active:scale-95"
                              title="Xóa tác phẩm này"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span className="hidden sm:inline">Xóa</span>
                            </button>
                          )}
                      </div>
                    )}
                  </div>

                  {/* KHÔNG GIAN QUAN SÁT TÁC PHẨM TRÀN VIỀN RỘNG RÃI */}
                  <section className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto bg-[#FAF8F5]">
                    {selectedArtwork ? (
                      <div className="min-h-full flex flex-col justify-between max-w-6xl w-full mx-auto space-y-3">
                        {/* KHUNG TRANH BEFORE - AFTER */}
                        <div className="flex-1 flex flex-col min-h-0">
                          <div className="flex items-center justify-between mb-2 shrink-0">
                            <h3 className="font-serif text-xs sm:text-sm font-bold text-[#1E1C1A] flex items-center gap-1.5 sm:gap-2">
                              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C86446]" />
                              <span className="truncate">
                                {selectedArtwork.revisedImageUrl
                                  ? "Không gian quan sát & Đối sánh Before – After"
                                  : "Bản phác thảo ban đầu (Đang đợi bản hoàn thiện)"}
                              </span>
                            </h3>
                            {selectedArtwork.description && (
                              <span className="text-[11px] sm:text-xs text-stone-500 italic truncate max-w-[150px] sm:max-w-md">
                                &ldquo;{selectedArtwork.description}&rdquo;
                              </span>
                            )}
                          </div>

                          {/* Khung BeforeAfterViewer tràn viền */}
                          <div className="flex-1 min-h-[260px] sm:min-h-0 bg-white rounded-2xl p-2 sm:p-4 border border-[#EAE5DC] shadow-xs flex flex-col justify-center">
                            <BeforeAfterViewer
                              initialImageUrl={selectedArtwork.initialImageUrl}
                              revisedImageUrl={selectedArtwork.revisedImageUrl}
                            />
                          </div>
                        </div>

                        {/* DẢI GHI CHÚ TIẾN BỘ & TỰ ĐÁNH GIÁ Ở CHÂN TRANG */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
                          {/* Thẻ trạng thái nhận xét nhanh */}
                          <div className="bg-white rounded-xl p-3 border border-[#EAE5DC] shadow-xs flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              {selectedArtwork.feedback?.status === "approved" ? (
                                <>
                                  <span className="font-bold text-[#4F6B58] block text-[11px] truncate flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Thầy/Cô đã duyệt & phát hành nhận xét
                                  </span>
                                  <p className="text-stone-600 truncate text-[11px] mt-0.5">
                                    {selectedArtwork.feedback.overallStrength || "Đạt yêu cầu bài học"}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <span className="font-bold text-amber-700 block text-[11px] truncate flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                    {role === "teacher"
                                      ? "Bản nháp AI: Cần Giáo viên kiểm tra & phát hành"
                                      : "Thầy/Cô đang thẩm định nhận xét sư phạm"}
                                  </span>
                                  <p className="text-stone-500 truncate text-[11px] mt-0.5">
                                    {role === "teacher"
                                      ? "Bấm 'Bảng chấm điểm' để duyệt lời phê & điểm số."
                                      : "Nhận xét sẽ hiển thị ngay khi Thầy/Cô phát hành."}
                                  </p>
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setIsEvaluationDrawerOpen(true)}
                              className="text-[#C86446] hover:underline text-[11px] font-semibold shrink-0 cursor-pointer"
                            >
                              Xem chi tiết →
                            </button>
                          </div>

                          {/* Nhật ký tự đánh giá của học sinh */}
                          <div className="bg-white rounded-xl p-3 border border-[#EAE5DC] shadow-xs text-xs">
                            <div className="flex items-center justify-between font-bold text-stone-800 text-[11px] mb-0.5">
                              <span className="flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-[#C86446]" />
                                <span>Góc tự đánh giá của học sinh:</span>
                              </span>

                              {role === "student" && selectedArtwork.studentId === currentStudent?.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReflectionInput(selectedArtwork.selfReflection?.reflectionText || "");
                                    setIsReflectionModalOpen(true);
                                  }}
                                  className="text-[#C86446] hover:underline text-[10px] flex items-center gap-0.5 cursor-pointer font-semibold"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>{selectedArtwork.selfReflection ? "Sửa ghi chú" : "Viết tự đánh giá"}</span>
                                </button>
                              )}
                            </div>

                            {selectedArtwork.selfReflection ? (
                              <p className="text-stone-600 truncate text-[11px]">
                                {selectedArtwork.selfReflection.reflectionText}
                              </p>
                            ) : (
                              <p className="text-stone-400 italic text-[11px]">
                                {role === "student" && selectedArtwork.studentId === currentStudent?.id
                                  ? "Em hãy bấm 'Viết tự đánh giá' để ghi lại cảm nhận bài học."
                                  : "Học sinh chưa gửi ghi nhận tự đánh giá."}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-stone-400 text-sm">
                        Chọn một tác phẩm từ danh sách {selectedClass.name} bên trái để quan sát.
                      </div>
                    )}
                  </section>
                </div>

                {/* =========================================================================
                3. BẢNG TRƯỢT BÊN CẠNH (EVALUATION DRAWER)
                Mobile / Tablet (< lg): Slide-over sheet kèm backdrop
                Desktop (lg+): Cột cố định hoặc trượt mượt mà
            ========================================================================= */}
                {/* Backdrop overlay khi mở bảng trên mobile/tablet */}
                {isEvaluationDrawerOpen && (
                  <div
                    onClick={() => setIsEvaluationDrawerOpen(false)}
                    className="fixed inset-0 bg-stone-900/40 backdrop-blur-2xs z-35 lg:hidden transition-opacity"
                    aria-hidden="true"
                  />
                )}

                <div
                  className={`fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] lg:static lg:z-30 lg:w-96 shrink-0 bg-white border-l border-[#EAE5DC] flex flex-col h-full shadow-2xl transition-transform duration-300 ${isEvaluationDrawerOpen ? "translate-x-0" : "translate-x-full lg:hidden"
                    }`}
                >
                  {/* Header của bảng trượt */}
                  <div className="p-4 border-b border-[#F0EBE1] bg-[#FAF8F5] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#F6EDE8] text-[#C86446] flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif text-sm font-bold text-[#1E1C1A]">
                          Bảng Chấm Điểm & Lời Phê
                        </h3>
                        <p className="text-[10px] text-stone-500 font-sans">
                          Rubric bài học • {selectedClass.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedArtwork?.feedback?.referenceScore !== undefined && (
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${selectedArtwork.feedback.referenceScore > 0
                            ? "bg-[#F6EDE8] text-[#C86446] border-[#E8D7CF]"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                        >
                          {selectedArtwork.feedback.referenceScore > 0
                            ? `${selectedArtwork.feedback.referenceScore}/10 đ`
                            : "Chưa chấm điểm"}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsEvaluationDrawerOpen(false)}
                        className="w-7 h-7 rounded-lg hover:bg-stone-200/60 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Vùng cuộn của nội dung nhận xét & các tiêu chí Rubric bài học */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedArtwork ? (
                      role === "student" && selectedArtwork.feedback?.status === "pending_moderation" ? (
                        <div className="p-6 text-center space-y-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE5DC] my-8">
                          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                            <Sparkles className="w-6 h-6 animate-pulse" />
                          </div>
                          <h4 className="font-serif font-bold text-sm text-[#1E1C1A]">
                            Thầy/Cô đang thẩm định bài vẽ của em
                          </h4>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            Bản gợi ý từ trợ lý AI đang được Thầy/Cô xem xét và hiệu chỉnh kỹ lưỡng. Lời nhận xét sư phạm chính thức sẽ hiển thị tại đây ngay sau khi Thầy/Cô duyệt!
                          </p>
                          <div className="text-[11px] text-stone-400 font-medium pt-2 border-t border-[#F0EBE1]">
                            Học sinh THCS • Đảm bảo chuẩn mực sư phạm
                          </div>
                        </div>
                      ) : selectedArtwork.feedback ? (
                        <>
                          {/* Điểm nổi bật chung */}
                          <div className="p-3 bg-[#EDF3EF]/70 border border-[#D1E0D6] rounded-xl text-xs space-y-1">
                            <span className="font-bold text-[#4F6B58] block text-[11px]">
                              Điểm nổi bật của tác phẩm:
                            </span>
                            <p className="text-stone-700 leading-relaxed text-[11.5px]">
                              {selectedArtwork.feedback.overallStrength}
                            </p>
                          </div>

                          {/* Lời phê riêng của giáo viên (Inline Editing) */}
                          <div className="p-3 bg-[#F6EDE8]/70 border border-[#E8D7CF] rounded-xl text-xs space-y-1.5 relative group">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#C86446] block text-[11px]">
                                Lời phê của Giáo viên:
                              </span>
                              {role === "teacher" && !isEditingTeacherNotes && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTeacherNotesInput(selectedArtwork.feedback?.teacherNotes || "");
                                    setIsEditingTeacherNotes(true);
                                  }}
                                  className="text-[#C86446] hover:underline text-[10px] flex items-center gap-0.5 cursor-pointer font-medium"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Sửa lời phê</span>
                                </button>
                              )}
                            </div>

                            {isEditingTeacherNotes ? (
                              <div className="space-y-2 mt-1">
                                <textarea
                                  rows={3}
                                  value={teacherNotesInput}
                                  onChange={(e) => setTeacherNotesInput(e.target.value)}
                                  placeholder="Nhập lời phê sư phạm của Thầy/Cô..."
                                  className="w-full text-xs p-2 rounded-lg border border-[#E8D7CF] bg-white focus:outline-none focus:ring-1 focus:ring-[#C86446]"
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingTeacherNotes(false)}
                                    className="px-2.5 py-1 text-[11px] rounded text-stone-600 hover:bg-stone-200"
                                  >
                                    Hủy
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSaveTeacherNotes}
                                    className="px-2.5 py-1 text-[11px] rounded bg-[#C86446] text-white font-medium flex items-center gap-1"
                                  >
                                    <Save className="w-3 h-3" />
                                    <span>Lưu lời phê</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-stone-700 italic leading-relaxed text-[11px]">
                                &ldquo;{selectedArtwork.feedback.teacherNotes || "Chưa có lời phê bổ sung từ giáo viên."}&rdquo;
                              </p>
                            )}
                          </div>

                          {/* Đánh giá chi tiết các tiêu chí Rubric theo bài học */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400">
                              <span>Đánh giá Rubric bài học</span>
                              <span>Trọng số 100%</span>
                            </div>

                            {selectedArtwork.feedback.criteriaReviews.map((crit) => (
                              <div
                                key={crit.criterionId}
                                className="p-3 rounded-xl border border-[#EAE5DC] bg-[#FAF8F5]/60 space-y-2 text-xs hover:border-stone-300 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-stone-800 text-[11px]">
                                    {crit.criterionName}
                                  </span>

                                  {/* Bấm đổi nhanh mức độ biểu hiện */}
                                  {role === "teacher" ? (
                                    <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-[#EAE5DC]">
                                      {(["Chưa đạt", "Đạt", "Tốt", "Xuất sắc"] as const).map((lvl) => {
                                        const isCurrent = crit.level === lvl;
                                        return (
                                          <button
                                            key={lvl}
                                            type="button"
                                            onClick={() => handleUpdateCriterionLevel(crit.criterionId, lvl)}
                                            className={`px-1.5 py-0.5 text-[9px] rounded font-semibold transition-all cursor-pointer ${isCurrent
                                              ? lvl === "Xuất sắc"
                                                ? "bg-purple-100 text-purple-800 font-bold"
                                                : lvl === "Tốt"
                                                  ? "bg-blue-100 text-blue-800 font-bold"
                                                  : lvl === "Đạt"
                                                    ? "bg-emerald-100 text-emerald-800 font-bold"
                                                    : "bg-amber-100 text-amber-800 font-bold"
                                              : "text-stone-400 hover:text-stone-700 hover:bg-stone-50"
                                              }`}
                                          >
                                            {lvl}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span
                                      className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${crit.level === "Xuất sắc"
                                        ? "bg-purple-100 text-purple-700"
                                        : crit.level === "Tốt"
                                          ? "bg-blue-100 text-blue-700"
                                          : crit.level === "Đạt"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-amber-100 text-amber-700"
                                        }`}
                                    >
                                      {crit.level}
                                    </span>
                                  )}
                                </div>

                                <p className="text-stone-600 text-[11px] leading-relaxed">
                                  <strong className="text-emerald-700 font-medium">Ưu điểm:</strong> {crit.strength}
                                </p>
                                <p className="text-stone-600 text-[11px] leading-relaxed">
                                  <strong className="text-[#C86446] font-medium">Cải thiện:</strong> {crit.improvement}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Chỉ dẫn thực hành tiếp theo */}
                          {selectedArtwork.feedback.actionableNextSteps && (
                            <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-1.5 text-xs">
                              <span className="font-bold text-sky-900 block text-[11px]">
                                Chỉ dẫn thực hành tiếp theo cho học sinh:
                              </span>
                              <ul className="text-sky-800 space-y-1 pl-3.5 list-disc text-[11px] leading-relaxed">
                                {selectedArtwork.feedback.actionableNextSteps.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-stone-400 italic text-center py-12">
                          Chưa có dữ liệu phản hồi cho tác phẩm này.
                        </div>
                      )
                    ) : (
                      <div className="text-xs text-stone-400 italic text-center py-12">
                        Vui lòng chọn một tác phẩm từ danh sách.
                      </div>
                    )}
                  </div>

                  {/* Chân bảng trượt: Phê duyệt nhận xét & Tùy chọn Triển lãm */}
                  {selectedArtwork?.feedback && (
                    <div className="p-4 border-t border-[#F0EBE1] bg-[#FAF8F5] shrink-0 space-y-2.5">
                      {selectedArtwork.feedback.status === "pending_moderation" ? (
                        role === "teacher" ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-medium">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Bản nháp AI: Thầy/Cô kiểm tra trước khi phát hành.</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setTeacherNotesInput(selectedArtwork.feedback?.teacherNotes || "");
                                  setIsEditingTeacherNotes(true);
                                }}
                                className="flex-1 py-2 border border-[#E8D7CF] bg-white text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-50 cursor-pointer text-center"
                              >
                                Sửa lời phê
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveFeedback(selectedArtwork.id)}
                                className="flex-1 py-2 bg-[#4F6B58] hover:bg-[#3D5344] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Duyệt & Phát hành</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span>Đang đợi Thầy/Cô duyệt phát hành nhận xét.</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center justify-between text-xs text-stone-600">
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            Đã duyệt phát hành
                          </span>
                          <span className="text-[11px] text-stone-400">
                            Bởi: {selectedArtwork.feedback.reviewedBy || "Giáo viên"}
                          </span>
                        </div>
                      )}

                      {/* VỊ TRÍ CHUẨN XÁC CỦA NÚT DUYỆT LÊN TRIỂN LÃM & XÓA BÀI VẼ */}
                      {role === "teacher" && (
                        <div className="pt-2 border-t border-[#EAE5DC] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleDeleteArtwork(selectedArtwork.id)}
                            className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium hover:underline cursor-pointer"
                            title="Xóa vĩnh viễn tác phẩm này khỏi hệ thống"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Xóa tác phẩm</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-stone-500">Trưng bày:</span>
                            <button
                              type="button"
                              onClick={() => handleToggleExhibition(selectedArtwork.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${selectedArtwork.isPublic
                                ? "bg-[#F5F2EB] border-[#E2DBD0] text-stone-700 hover:bg-[#EAE5DC]"
                                : selectedArtwork.feedback?.status !== "approved"
                                  ? "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed"
                                  : "bg-[#F6EDE8] border-[#E8D7CF] text-[#C86446] hover:bg-[#F0DFD7]"
                                }`}
                              title={
                                selectedArtwork.feedback?.status !== "approved"
                                  ? "Cần Duyệt & Phát hành nhận xét trước khi đưa lên Triển lãm"
                                  : ""
                              }
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>{selectedArtwork.isPublic ? "Gỡ khỏi Triển Lãm" : "Đưa lên Triển Lãm"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Modal nộp tác phẩm */}
          <UploadArtworkModal
            topics={currentGradeTopics}
            selectedTopicId={selectedTopic?.id}
            topicTitle={selectedTopic?.title || "Bài thực hành Mĩ thuật"}
            isRevision={isRevisionUpload}
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onSubmit={handleArtworkSubmit}
          />

          {/* Modal xem chi tiết tác phẩm ở Phòng Triển Lãm */}
          {galleryModalArtwork && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-[#F0EBE1] flex items-center justify-between bg-[#FAF8F5]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1E1C1A]">
                      {galleryModalArtwork.title}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Tác giả: <strong>{galleryModalArtwork.studentName}</strong> • {galleryModalArtwork.classId.toUpperCase()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGalleryModalArtwork(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="h-[380px] bg-[#FAF8F5] rounded-2xl p-4 border border-[#EAE5DC]">
                    <BeforeAfterViewer
                      initialImageUrl={galleryModalArtwork.initialImageUrl}
                      revisedImageUrl={galleryModalArtwork.revisedImageUrl}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                      <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Nhận xét sư phạm của Giáo viên</span>
                      </h4>
                      <p className="text-xs text-emerald-800 leading-relaxed italic">
                        &ldquo;{galleryModalArtwork.feedback?.teacherNotes || galleryModalArtwork.feedback?.overallStrength}&rdquo;
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 space-y-2">
                      <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-700" />
                        <span>Góc tự đánh giá của học sinh</span>
                      </h4>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {galleryModalArtwork.selfReflection?.reflectionText || "Chưa tự đánh giá."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Xuất Bản In Báo Cáo Tiến Bộ Sư Phạm */}
          <ProgressReportModal
            artwork={selectedArtwork}
            topic={topics.find((t) => t.id === selectedArtwork?.topicId) || selectedTopic || undefined}
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
          />

          {/* Modal Tự Đánh Giá Học Sinh */}
          {isReflectionModalOpen && selectedArtwork && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-stone-100 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#F6EDE8] border border-[#E8D7CF] text-[#C86446] flex items-center justify-center shadow-xs shrink-0">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 truncate">
                        Góc Tự Đánh Giá Học Sinh
                      </h3>
                      <p className="text-[11px] sm:text-xs text-stone-500 font-sans truncate">
                        {selectedArtwork.title} • {selectedArtwork.studentName} ({selectedClass.name})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReflectionModalOpen(false)}
                    className="w-8 h-8 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto py-3 space-y-3.5 overscroll-contain">
                  {/* Lời phê hoặc góp ý của Thầy/Cô (nếu có) để học sinh đối chiếu */}
                  {selectedArtwork.feedback && (
                    <div className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-xs space-y-1">
                      <span className="font-bold text-[#4F6B58] block text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Góp ý sư phạm của Giáo viên:
                      </span>
                      <p className="text-stone-700 italic text-[11px] leading-relaxed">
                        &ldquo;{selectedArtwork.feedback.teacherNotes || selectedArtwork.feedback.overallStrength || "Đạt yêu cầu bài học."}&rdquo;
                      </p>
                    </div>
                  )}

                  {role === "student" && selectedArtwork.studentId === currentStudent?.id ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-stone-800">
                        Cảm nhận &amp; bài học rút ra của em:
                      </label>
                      <textarea
                        rows={4}
                        value={reflectionInput}
                        onChange={(e) => setReflectionInput(e.target.value)}
                        placeholder="Sau khi nghe Thầy/Cô góp ý, em đã sửa tranh như thế nào và rút ra bài học gì về màu sắc, nét vẽ hoặc bố cục?..."
                        className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-[#C86446] focus:ring-1 focus:ring-[#C86446] font-sans leading-relaxed resize-none"
                      />
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 space-y-0.5">
                        <p className="font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-700" />
                          Gợi ý tự đánh giá theo GDPT 2018:
                        </p>
                        <p className="text-[10.5px] text-amber-800">
                          • Em đã chỉnh sửa điểm nào về bố cục, đường nét hoặc hòa sắc?
                        </p>
                        <p className="text-[10.5px] text-amber-800">
                          • Bản hoàn thiện đã thể hiện đúng ý tưởng sáng tạo của em chưa?
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1 text-xs">
                      <span className="font-bold text-stone-700 block text-[11px]">
                        Nội dung tự đánh giá của học sinh:
                      </span>
                      {selectedArtwork.selfReflection ? (
                        <p className="text-stone-800 leading-relaxed text-xs">
                          {selectedArtwork.selfReflection.reflectionText}
                        </p>
                      ) : (
                        <p className="text-stone-400 italic text-[11px]">
                          Học sinh chưa ghi nhận nội dung tự đánh giá cho tác phẩm này.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2 shrink-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setIsReflectionModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                  >
                    Đóng
                  </button>
                  {role === "student" && selectedArtwork.studentId === currentStudent?.id && (
                    <button
                      type="button"
                      onClick={handleSaveSelfReflection}
                      className="px-5 py-2 rounded-xl bg-[#C86446] hover:bg-[#B25337] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Lưu tự đánh giá</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal Tạo chủ đề mới kèm thiết lập Rubric */}
          {isCreateTopicModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-stone-100 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 shrink-0">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#C86446]" />
                      <span>Tạo Chủ Đề Mới &amp; Thiết Lập Rubric</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {selectedClass.name} • Thiết lập tiêu chí đánh giá theo Yêu cầu cần đạt bài học
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateTopicModalOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateTopic} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto py-3 space-y-4 sm:space-y-5 overscroll-contain pr-1">
                    {/* KHỐI 1: THÔNG TIN BÀI HỌC */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        1. Thông tin chủ đề &amp; Yêu cầu cần đạt
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Áp dụng cho Khối lớp *
                          </label>
                          <select
                            value={newTopicGrade}
                            onChange={(e) => setNewTopicGrade(Number(e.target.value))}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#C86446] bg-white cursor-pointer font-medium"
                          >
                            <option value={6}>Khối 6 (Lớp 6A1 - 6A4)</option>
                            <option value={7}>Khối 7 (Lớp 7A1 - 7A4)</option>
                            <option value={8}>Khối 8 (Lớp 8A1 - 8A4)</option>
                            <option value={9}>Khối 9 (Lớp 9A1 - 9A4)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Lớp thực hiện
                          </label>
                          <div className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-600 font-medium">
                            {selectedClass.name} (Khối {selectedGrade})
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Tên chủ đề / Tên bài học
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Chủ đề 2: Di sản mĩ thuật qua góc nhìn sáng tạo"
                          value={newTopicTitle}
                          onChange={(e) => setNewTopicTitle(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#C86446]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Mô tả nhiệm vụ thực hành
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Mô tả mục tiêu và nội dung thực hành cho học sinh..."
                          value={newTopicDesc}
                          onChange={(e) => setNewTopicDesc(e.target.value)}
                          className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#C86446] resize-none"
                        />
                      </div>

                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <label className="text-xs font-semibold text-stone-700">
                            Yêu cầu cần đạt cốt lõi (Mỗi dòng 1 yêu cầu)
                          </label>
                          <button
                            type="button"
                            onClick={handleGenerateCriteriaFromReqs}
                            className="text-[11px] text-[#C86446] hover:underline font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Tự động sinh tiêu chí Rubric từ các dòng này</span>
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="1. Xác định mảng chính và tỷ lệ các đối tượng cân đối.&#10;2. Thể hiện nét vẽ biểu cảm, chắc chắn.&#10;3. Phối màu hòa sắc làm nổi bật chủ đề."
                          value={newTopicReqs}
                          onChange={(e) => setNewTopicReqs(e.target.value)}
                          className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#C86446] resize-none font-sans"
                        />
                      </div>
                    </div>

                    {/* KHỐI 2: THIẾT LẬP RUBRIC THEO YÊU CẦU CẦN ĐẠT CỦA BÀI HỌC */}
                    <div className="pt-3 border-t border-stone-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                            2. Thiết lập Rubric đánh giá bài học
                          </h4>
                          <p className="text-[11px] text-stone-400">
                            Tùy chỉnh tiêu chí, mô tả và trọng số riêng cho bài học này
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${totalNewCriteriaWeight === 100
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                              }`}
                          >
                            Tổng: {totalNewCriteriaWeight}% {totalNewCriteriaWeight === 100 ? "✓" : "(Cần = 100%)"}
                          </span>
                          <button
                            type="button"
                            onClick={handleAddCriterion}
                            className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm tiêu chí</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2.5 max-h-60 overflow-y-auto p-1">
                        {newTopicCriteria.map((crit, idx) => (
                          <div
                            key={crit.id}
                            className="p-3 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl space-y-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-[#F6EDE8] text-[#C86446] font-bold text-[10px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                required
                                placeholder="Tên tiêu chí (ví dụ: Bố cục mảng chính)"
                                value={crit.name}
                                onChange={(e) => handleUpdateCriterion(crit.id, "name", e.target.value)}
                                className="flex-1 font-bold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200 focus:outline-none focus:border-[#C86446]"
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  required
                                  value={crit.weight}
                                  onChange={(e) => handleUpdateCriterion(crit.id, "weight", Number(e.target.value))}
                                  className="w-14 text-center font-bold text-[#C86446] bg-white px-1.5 py-1 rounded-lg border border-stone-200 focus:outline-none focus:border-[#C86446]"
                                />
                                <span className="text-stone-500 font-bold">%</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCriterion(crit.id)}
                                className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <textarea
                              rows={1}
                              required
                              placeholder="Yêu cầu cần đạt cụ thể của học sinh đối với tiêu chí này..."
                              value={crit.description}
                              onChange={(e) => handleUpdateCriterion(crit.id, "description", e.target.value)}
                              className="w-full text-[11px] p-2 bg-white rounded-lg border border-stone-200 focus:outline-none focus:border-[#C86446] resize-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2 shrink-0 bg-white">
                    <button
                      type="button"
                      onClick={() => setIsCreateTopicModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={totalNewCriteriaWeight !== 100}
                      className="px-5 py-2 rounded-xl bg-[#C86446] hover:bg-[#B25337] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Tạo chủ đề &amp; Lưu Rubric</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 9. MODAL XÁC THỰC QUYỀN GIÁO VIÊN QUA MÃ PIN (TEACHER PIN AUTH) */}
          {isTeacherPinModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-stone-100 animate-in fade-in zoom-in-95 duration-200 mx-3">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#F6EDE8] border border-[#E8D7CF] text-[#C86446] mx-auto flex items-center justify-center shadow-xs">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">
                    Xác Thực Quyền Giáo Viên
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Nhập mã PIN sư phạm để kích hoạt quyền duyệt bài, chấm điểm và quản trị bài học GDPT 2018.
                  </p>
                </div>

                <form onSubmit={handleVerifyTeacherPin} className="mt-5 space-y-4">
                  <div>
                    <input
                      type="password"
                      maxLength={10}
                      autoFocus
                      placeholder="Nhập mã PIN Giáo viên"
                      value={teacherPinInput}
                      onChange={(e) => {
                        setTeacherPinInput(e.target.value);
                        if (teacherPinError) setTeacherPinError("");
                      }}
                      className="w-full text-center text-sm tracking-widest font-mono py-2.5 px-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C86446]/20 focus:border-[#C86446]"
                    />
                    {teacherPinError && (
                      <p className="text-[11px] text-red-600 mt-1.5 text-center font-medium">
                        {teacherPinError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsTeacherPinModalOpen(false)}
                      className="flex-1 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-[#C86446] hover:bg-[#B25337] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Mở quyền GV
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 10. MODAL QUẢN LÝ DANH SÁCH HỌC SINH TRONG LỚP (DÀNH CHO GIÁO VIÊN) */}
          {isStudentRosterModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-stone-100 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 shrink-0">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#F6EDE8] border border-[#E8D7CF] text-[#C86446] flex items-center justify-center shadow-xs shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 truncate">
                        Danh Sách Học Sinh — {selectedClass.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-stone-500 font-sans truncate">
                        Khối {selectedGrade} • Năm học {selectedClass.schoolYear} • Sĩ số:{" "}
                        <strong className="text-[#4F6B58]">{classStudents.length} học sinh</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStudentRosterModalOpen(false)}
                    className="w-8 h-8 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Thanh Tab chuyển chế độ */}
                <div className="flex gap-1.5 sm:gap-2 pt-3 pb-2.5 border-b border-stone-100 text-xs font-semibold overflow-x-auto no-scrollbar shrink-0">
                  <button
                    type="button"
                    onClick={() => setRosterTab("list")}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${rosterTab === "list"
                      ? "bg-[#C86446] text-white shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Danh sách ({classStudents.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRosterTab("add")}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${rosterTab === "add"
                      ? "bg-[#C86446] text-white shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Thêm học sinh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRosterTab("batch")}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${rosterTab === "batch"
                      ? "bg-[#C86446] text-white shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Nhập từ Excel/Text</span>
                  </button>
                </div>

                {/* Nội dung Tab */}
                <div className="flex-1 overflow-y-auto py-3 overscroll-contain">
                  {rosterTab === "list" && (
                    <div className="space-y-2">
                      {classStudents.length === 0 ? (
                        <div className="p-8 text-center text-xs text-stone-500 italic space-y-2">
                          <p>Chưa có học sinh nào trong {selectedClass.name}.</p>
                          <button
                            type="button"
                            onClick={() => setRosterTab("batch")}
                            className="text-xs text-[#C86446] font-bold hover:underline"
                          >
                            Bấm vào đây để dán danh sách học sinh vào lớp ngay
                          </button>
                        </div>
                      ) : (
                        <div className="border border-stone-200 rounded-2xl overflow-hidden text-xs overflow-x-auto">
                          <table className="w-full min-w-[460px] text-left">
                            <thead className="bg-[#FAF8F5] border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
                              <tr>
                                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                                <th className="py-2.5 px-3 w-28">Mã HS</th>
                                <th className="py-2.5 px-3">Họ và tên</th>
                                <th className="py-2.5 px-3 w-28 text-center">Bài đã nộp</th>
                                <th className="py-2.5 px-3 w-20 text-center">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {classStudents.map((st, idx) => {
                                const submittedCount = artworks.filter(
                                  (a) => a.studentId === st.id && a.classId === selectedClass.id
                                ).length;
                                return (
                                  <tr key={st.id} className="hover:bg-stone-50/80 transition-colors">
                                    <td className="py-2 px-3 text-center text-stone-400 font-mono">
                                      {idx + 1}
                                    </td>
                                    <td className="py-2 px-3 font-mono font-bold text-stone-700">
                                      <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[10.5px]">
                                        {st.id}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 font-semibold text-stone-900">
                                      {st.name}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span
                                        className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] ${submittedCount > 0
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : "bg-stone-100 text-stone-400"
                                          }`}
                                      >
                                        {submittedCount} bài
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteStudent(st.id, st.name)}
                                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Xóa học sinh này khỏi lớp"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {rosterTab === "add" && (
                    <form onSubmit={handleAddStudent} className="space-y-4 max-w-md mx-auto py-2">
                      <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200 text-xs text-stone-600">
                        Thêm một tài khoản học sinh mới vào <strong>{selectedClass.name}</strong> (Khối {selectedGrade}).
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Họ và tên học sinh *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Nguyễn Văn An"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#C86446]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Mã học sinh (Tùy chọn)
                        </label>
                        <input
                          type="text"
                          placeholder={`Mặc định tự sinh: HS${selectedClass.name.replace("Lớp ", "")}_${String(classStudents.length + 1).padStart(2, "0")}`}
                          value={newStudentId}
                          onChange={(e) => setNewStudentId(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#C86446] font-mono"
                        />
                      </div>
                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRosterTab("list")}
                          className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                        >
                          Quay lại
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-[#C86446] hover:bg-[#B25337] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Thêm vào {selectedClass.name}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {rosterTab === "batch" && (
                    <form onSubmit={handleBatchImportStudents} className="space-y-4 py-2">
                      <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
                        <p className="font-semibold text-stone-800">
                          Nhập nhanh danh sách học sinh từ file Excel hoặc sổ điểm giấy:
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Dán danh sách tên học sinh vào ô bên dưới (mỗi dòng một tên hoặc có số thứ tự ở đầu dòng). Hệ thống sẽ tự động bóc tách họ tên và gán mã định danh cho toàn bộ học sinh.
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Danh sách họ và tên (Mỗi dòng một học sinh):
                        </label>
                        <textarea
                          rows={8}
                          required
                          placeholder={"1. Nguyễn Văn An\n2. Lê Thị Bình\n3. Trần Quốc Cường\n4. Phạm Thu Dung..."}
                          value={batchStudentText}
                          onChange={(e) => setBatchStudentText(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#C86446] font-sans leading-relaxed"
                        />
                      </div>
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <button
                          type="button"
                          onClick={handleResetStudentsToDefault}
                          className="text-[11px] text-stone-400 hover:text-stone-700 underline cursor-pointer self-start sm:self-auto"
                        >
                          Khôi phục danh sách mặc định
                        </button>
                        <div className="flex gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setRosterTab("list")}
                            className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-[#C86446] hover:bg-[#B25337] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Nhập vào {selectedClass.name}</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 shrink-0 bg-white">
                  <span className="text-[10px] sm:text-[11px] truncate max-w-[200px] sm:max-w-none">
                    Dữ liệu đồng bộ tức thì cho cổng đăng nhập và nộp bài.
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsStudentRosterModalOpen(false)}
                    className="px-4 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HIỆU ỨNG CHUYỂN CẢNH VỆT CỌ VẼ NGHỆ THUẬT (#C4572F) DỨT KHOÁT */}
      {isBrushTransitioning && (
        <BrushStrokeTransition
          onSwap={() => {
            if (pendingLoginRef.current) {
              pendingLoginRef.current();
              pendingLoginRef.current = null;
            }
          }}
          onComplete={() => {
            setIsBrushTransitioning(false);
          }}
        />
      )}
    </>
  );
}

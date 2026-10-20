"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Artwork } from "@/types/artprogress";
import { APP_VERSION } from "@/config/version";
import {
  Maximize2,
  Minimize2,
  Compass,
  LayoutGrid,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  RotateCw,
} from "lucide-react";

interface Gallery3DViewProps {
  artworks: Artwork[];
  onSelectArtwork: (artwork: Artwork) => void;
  onSwitchToGrid: () => void;
}

// Bức tranh mẫu trang trí khi phòng chưa có bài nộp công khai
const SAMPLE_EXHIBITION_PIECES: Artwork[] = [
  {
    id: "sample_art_1",
    topicId: "topic_1",
    studentId: "HS_01",
    studentName: "Mĩ Thuật Sáng Tạo",
    classId: "7A1",
    title: "Sắc Màu Quê Hương",
    initialImageUrl: "",
    submittedAt: "2026-10-15T08:00:00Z",
    isPublic: true,
  },
  {
    id: "sample_art_2",
    topicId: "topic_2",
    studentId: "HS_02",
    studentName: "Tạo Hình & Di Sản",
    classId: "7A2",
    title: "Vũ Điệu Hoa Văn Trống Đồng",
    initialImageUrl: "",
    submittedAt: "2026-10-15T09:00:00Z",
    isPublic: true,
  },
  {
    id: "sample_art_3",
    topicId: "topic_3",
    studentId: "HS_03",
    studentName: "Hội Họa Hiện Đại",
    classId: "8A1",
    title: "Góc Phố Hoàng Hôn",
    initialImageUrl: "",
    submittedAt: "2026-10-15T10:00:00Z",
    isPublic: true,
  },
  {
    id: "sample_art_4",
    topicId: "topic_4",
    studentId: "HS_04",
    studentName: "Thiết Kế Đồ Họa",
    classId: "9A1",
    title: "Bình Minh Trên Biển Đảo",
    initialImageUrl: "",
    submittedAt: "2026-10-15T11:00:00Z",
    isPublic: true,
  },
];

// Hàm sinh texture sàn gỗ sồi bằng Canvas (nhẹ, tải tức thì)
function createProceduralWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#A37D52";
  ctx.fillRect(0, 0, 512, 512);

  const plankH = 64;
  for (let y = 0; y < 512; y += plankH) {
    const isShift = (y / plankH) % 2 === 0;
    const plankW = 128;
    const offset = isShift ? 0 : plankW / 2;

    for (let x = -offset; x < 512; x += plankW) {
      const tone = (Math.random() - 0.5) * 14;
      const r = Math.min(255, Math.max(0, 163 + tone));
      const g = Math.min(255, Math.max(0, 125 + tone));
      const b = Math.min(255, Math.max(0, 82 + tone));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + 1, y + 1, plankW - 2, plankH - 2);

      // Vân gỗ mảnh
      ctx.strokeStyle = "rgba(60, 40, 20, 0.12)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const sy = y + 12 + i * 14;
        ctx.moveTo(x, sy);
        ctx.bezierCurveTo(
          x + plankW * 0.3,
          sy + (Math.random() - 0.5) * 5,
          x + plankW * 0.7,
          sy + (Math.random() - 0.5) * 5,
          x + plankW,
          sy
        );
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(40, 25, 12, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, plankW, plankH);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 16);
  return tex;
}

// Hàm sinh texture quầng sáng mềm mại tự nhiên cho đèn LED âm trần (Downlight Halo Glow)
function createDownlightGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createRadialGradient(128, 128, 16, 128, 128, 128);
  grad.addColorStop(0, "rgba(255, 252, 240, 0.90)");
  grad.addColorStop(0.22, "rgba(255, 246, 218, 0.55)");
  grad.addColorStop(0.48, "rgba(255, 238, 195, 0.22)");
  grad.addColorStop(0.78, "rgba(255, 230, 180, 0.06)");
  grad.addColorStop(1, "rgba(255, 225, 175, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// Hàm sinh biển đồng mạ vàng ghi tên tác giả (Brass Plaque)
function createPlaqueTexture(title: string, studentName: string, classId: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const grad = ctx.createLinearGradient(0, 0, 512, 180);
  grad.addColorStop(0, "#C99E26");
  grad.addColorStop(0.5, "#FFF2C4");
  grad.addColorStop(1, "#997305");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 180);

  ctx.strokeStyle = "#5C4201";
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 500, 168);

  ctx.strokeStyle = "#FFF";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(12, 12, 488, 156);

  ctx.textAlign = "center";
  ctx.fillStyle = "#241801";
  ctx.font = "bold 30px serif";
  const displayTitle = title.length > 20 ? title.slice(0, 18) + "..." : title;
  ctx.fillText(displayTitle, 256, 65);

  ctx.strokeStyle = "#785803";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(80, 84);
  ctx.lineTo(432, 84);
  ctx.stroke();

  ctx.font = "italic 22px sans-serif";
  ctx.fillStyle = "#3B2702";
  ctx.fillText(`Tác giả: ${studentName}`, 256, 120);

  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = "#5E4403";
  ctx.fillText(`Lớp ${classId.toUpperCase()}`, 256, 150);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Tranh minh họa nghệ thuật khi chưa có ảnh chụp
function createInspirationalArtTexture(title: string, themeColor: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Gradient màu nghệ thuật
  const grad = ctx.createLinearGradient(0, 0, 800, 600);
  grad.addColorStop(0, themeColor);
  grad.addColorStop(0.5, "#FAF6EE");
  grad.addColorStop(1, "#3B2E24");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 600);

  // Vệt cọ màu nước loang trừu tượng
  ctx.save();
  ctx.filter = "blur(30px)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.beginPath();
  ctx.arc(320, 240, 160, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(200, 100, 50, 0.3)";
  ctx.beginPath();
  ctx.arc(480, 360, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Khung trang trí bên trong
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 740, 540);

  // Tiêu đề tác phẩm
  ctx.textAlign = "center";
  ctx.fillStyle = "#1E1A17";
  ctx.font = "bold 42px serif";
  ctx.fillText(title, 400, 290);

  ctx.font = "italic 24px sans-serif";
  ctx.fillStyle = "#54463B";
  ctx.fillText("Không Gian Triển Lãm Mĩ Thuật THCS", 400, 340);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Các vector tĩnh tái sử dụng trong vòng lặp Render để triệt tiêu việc sinh rác bộ nhớ (Zero GC allocation)
const _vCurLook = new THREE.Vector3();
const _vWantLook = new THREE.Vector3();
const _vForward = new THREE.Vector3();
const _vRight = new THREE.Vector3();
const _vLookTarget = new THREE.Vector3();
const _vCenterV2 = new THREE.Vector2(0, 0);

export function Gallery3DView({
  artworks,
  onSelectArtwork,
  onSwitchToGrid,
}: Gallery3DViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reticleDotRef = useRef<HTMLDivElement>(null);
  const reticleLabelRef = useRef<HTMLSpanElement>(null);

  // Giữ ref callback onSelectArtwork ổn định, ngăn việc mở modal làm re-render/re-mount scene
  const onSelectArtworkRef = useRef(onSelectArtwork);
  useEffect(() => {
    onSelectArtworkRef.current = onSelectArtwork;
  }, [onSelectArtwork]);

  // Dữ liệu triển lãm: Nếu chưa có bài nộp nào, hiển thị 4 tác phẩm tiêu biểu
  const displayArtworks = artworks.length > 0 ? artworks : SAMPLE_EXHIBITION_PIECES;
  const artworksKey = displayArtworks
    .map((a) => `${a.id}_${a.title}_${a.initialImageUrl}_${a.revisedImageUrl || ""}`)
    .join(";");

  // State giao diện
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [focusedArtwork, setFocusedArtwork] = useState<Artwork | null>(null);
  const [activeArtworkIndex, setActiveArtworkIndex] = useState(0);
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  // Trạng thái thiết bị cảm ứng di động (chỉ hiện nút di chuyển trên mobile/tablet cảm ứng, KHÔNG hiện trên máy tính)
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Theo dõi hướng màn hình và thiết bị cảm ứng
  useEffect(() => {
    const checkOrientation = () => {
      const hasTouch = (
        ("ontouchstart" in window) ||
        (navigator.maxTouchPoints > 0) ||
        window.matchMedia("(pointer: coarse)").matches
      );
      // Chỉ kích hoạt phím điều khiển ảo nếu là màn hình di động/tablet có cảm ứng
      const isMobileTouch = hasTouch && window.innerWidth < 1024;
      setIsTouchDevice(isMobileTouch);

      const isMobileSize = window.innerWidth < 1024;
      const isPortrait = window.innerHeight > window.innerWidth;
      if (hasTouch && isMobileSize && isPortrait) {
        setShowRotatePrompt(true);
      } else {
        // Tự động tắt thông báo khi người dùng đã xoay ngang màn hình
        setShowRotatePrompt(false);
      }
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Refs điều khiển và vòng đời Three.js
  const focusedArtRef = useRef<Artwork | null>(null);

  const stateRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    artworkMeshes: {
      hitbox: THREE.Mesh;
      artwork: Artwork;
      focusPos: THREE.Vector3;
      focusTarget: THREE.Vector3;
      index: number;
    }[];
    hitboxes: THREE.Mesh[];
    keys: { [key: string]: boolean };
    isDragging: boolean;
    mouseStartPos: { x: number; y: number };
    prevMousePos: { x: number; y: number };
    yaw: number;
    pitch: number;
    targetYaw: number;
    targetPitch: number;
    velocity: THREE.Vector3;
    targetCamPos: THREE.Vector3 | null;
    targetCamLook: THREE.Vector3 | null;
    roomLength: number;
    roomWidth: number;
    animFrameId: number;
    raycaster: THREE.Raycaster;
    wasHit: boolean;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    artworkMeshes: [],
    hitboxes: [],
    keys: {},
    isDragging: false,
    mouseStartPos: { x: 0, y: 0 },
    prevMousePos: { x: 0, y: 0 },
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
    velocity: new THREE.Vector3(),
    targetCamPos: null,
    targetCamLook: null,
    roomLength: 22,
    roomWidth: 10,
    animFrameId: 0,
    raycaster: new THREE.Raycaster(),
    wasHit: false,
  });

  // Tự động tắt bảng hướng dẫn sau 7 giây
  useEffect(() => {
    const timer = setTimeout(() => setShowHelp(false), 7000);
    return () => clearTimeout(timer);
  }, []);

  // Di chuyển mượt mà tới bức tranh chỉ định
  const focusOnArtworkByIndex = useCallback((index: number) => {
    const state = stateRef.current;
    if (index < 0 || index >= state.artworkMeshes.length) return;

    const target = state.artworkMeshes[index];
    setActiveArtworkIndex(index);
    setFocusedArtwork(target.artwork);
    focusedArtRef.current = target.artwork;

    state.targetCamPos = target.focusPos.clone();
    state.targetCamLook = target.focusTarget.clone();

    // Hướng nhìn chuẩn diện
    const dx = target.focusTarget.x - target.focusPos.x;
    const dz = target.focusTarget.z - target.focusPos.z;
    const wantYaw = Math.atan2(-dx, -dz);
    state.yaw = wantYaw;
    state.pitch = 0;
    state.targetYaw = wantYaw;
    state.targetPitch = 0;
    state.velocity.set(0, 0, 0);
  }, []);

  // =========================================================================
  // KHỞI TẠO KHÔNG GIAN 3D THREE.JS (CHỈ CHẠY 1 LẦN KHI MOUNT HOẶC ĐỔI DANH SÁCH)
  // =========================================================================
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 1000;
    const height = container.clientHeight || 650;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#F4EFE6");
    scene.fog = new THREE.FogExp2("#F4EFE6", 0.016);

    // 2. Camera (Tầm mắt người: 1.65m)
    const camera = new THREE.PerspectiveCamera(56, width / height, 0.1, 80);

    // 3. Renderer (Tối ưu hiệu năng: mediump precision, pixelRatio mượt mà)
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      precision: "mediump",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));

    // Khôi phục vị trí và góc nhìn camera nếu đã tồn tại (ngăn giật lag & ngăn dịch chuyển về spawn)
    if (stateRef.current.camera) {
      camera.position.copy(stateRef.current.camera.position);
      camera.rotation.copy(stateRef.current.camera.rotation);
      stateRef.current.targetYaw = stateRef.current.yaw;
      stateRef.current.targetPitch = stateRef.current.pitch;
    }

    stateRef.current.scene = scene;
    stateRef.current.camera = camera;
    stateRef.current.renderer = renderer;

    // =======================================================================
    // TÍNH TOÁN BỐ CỤC KHÔNG GIAN HÀNH LANG PHÒNG TRANH
    // =======================================================================
    const items = displayArtworks;
    const totalCount = items.length;
    const roomWidth = 10.0; // Hành lang rộng 10m
    const wallHeight = 4.6; // Trần cao 4.6m
    const artworkSpacing = 4.0; // Khoảng cách giữa các tranh: 4m

    const pairs = Math.max(2, Math.ceil(totalCount / 2));
    const roomLength = Math.max(20, (pairs + 1) * artworkSpacing + 4);
    stateRef.current.roomLength = roomLength;
    stateRef.current.roomWidth = roomWidth;

    // Nếu chưa có vị trí camera lưu trước đó, đặt tại điểm xuất phát (Spawn Point)
    if (!stateRef.current.camera || camera.position.lengthSq() === 0) {
      camera.position.set(0, 1.65, roomLength / 2 - 2.8);
      camera.lookAt(0, 1.65, 0);
      stateRef.current.yaw = 0;
      stateRef.current.pitch = 0;
      stateRef.current.targetYaw = 0;
      stateRef.current.targetPitch = 0;
    }

    // =======================================================================
    // ÁNH SÁNG PHÒNG TRƯNG BÀY (HIỆU NĂNG CAO, BỪNG SÁNG & KHÔNG TỐN SHADER)
    // =======================================================================
    // 1. Hemisphere Light: Ánh sáng vòm trời trắng ấm từ trần + hắt gỗ ấm từ sàn (tính per-vertex, cực nhẹ)
    const hemiLight = new THREE.HemisphereLight(0xFFFBF0, 0xA88B68, 1.15);
    scene.add(hemiLight);

    // 2. Ambient Light trắng ấm nền nã
    const ambientLight = new THREE.AmbientLight(0xFFF8EE, 0.55);
    scene.add(ambientLight);

    // =======================================================================
    // DỰNG KIẾN TRÚC PHÒNG (SÀN GỖ, TƯỜNG, TRẦN, RAY ĐÈN)
    // =======================================================================
    // 1. Sàn gỗ sồi
    const woodTexture = createProceduralWoodTexture();
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const floorMat = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.4,
      metalness: 0.04,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 2. Tường phòng trưng bày
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xF7F4ED,
      roughness: 0.88,
      metalness: 0.02,
      side: THREE.FrontSide,
    });

    // Tường Trái (-X)
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomLength, wallHeight), wallMat);
    leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    // Tường Phải (+X)
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomLength, wallHeight), wallMat);
    rightWall.position.set(roomWidth / 2, wallHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // Tường Cuối phòng (-Z)
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, wallHeight), wallMat);
    backWall.position.set(0, wallHeight / 2, -roomLength / 2);
    scene.add(backWall);

    // Tường Đầu phòng (+Z)
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, wallHeight), wallMat);
    frontWall.position.set(0, wallHeight / 2, roomLength / 2);
    frontWall.rotation.y = Math.PI;
    scene.add(frontWall);

    // 3. Trần phòng và ray đèn (Dùng MeshLambertMaterial tối ưu hàng nghìn lần so với PBR MeshStandard)
    const ceilingMat = new THREE.MeshLambertMaterial({ color: 0xF2ECE2 });
    const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.set(0, wallHeight, 0);
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    const trackMat = new THREE.MeshLambertMaterial({ color: 0x241F1C });
    const leftTrack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, roomLength - 2), trackMat);
    leftTrack.position.set(-roomWidth / 2 + 1.4, wallHeight - 0.04, 0);
    scene.add(leftTrack);

    const rightTrack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, roomLength - 2), trackMat);
    rightTrack.position.set(roomWidth / 2 - 1.4, wallHeight - 0.04, 0);
    scene.add(rightTrack);

    // =======================================================================
    // 3b. ĐÈN LED ÂM TRẦN TRÒN DUY NHẤT Ở TRUNG TÂM PHÒNG (RECESSED LED DOWNLIGHT)
    // Thiết kế tối giản, tinh tế, viền tròn màu trắng sứ nguyên khối (không vạch đen)
    // Đặt DUY NHẤT 1 đèn ở giữa trần nhà (X = 0, Z = 0) theo đúng yêu cầu
    // =======================================================================
    const downlightWhiteMat = new THREE.MeshLambertMaterial({ color: 0xFAFAFA });
    const downlightDiffuserMat = new THREE.MeshBasicMaterial({ color: 0xFFFAF0, side: THREE.DoubleSide });
    const downlightStepMat = new THREE.MeshLambertMaterial({ color: 0xE6E6E6 });

    // Texture quầng sáng mềm mại bao quanh đèn trên mặt trần
    const glowTex = createDownlightGlowTexture();
    const haloMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const createRecessedDownlightMesh = () => {
      const g = new THREE.Group();

      const bezel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.005, 24),
        downlightWhiteMat
      );
      bezel.position.y = -0.0025;
      g.add(bezel);

      const step = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.003, 24),
        downlightStepMat
      );
      step.position.y = -0.004;
      g.add(step);

      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.086, 24),
        downlightDiffuserMat
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.y = -0.0056;
      g.add(lens);

      return g;
    };

    // 1. Quầng sáng phát quang mềm mại trên mặt trần
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, wallHeight - 0.001, 0);
    scene.add(halo);

    // 2. DUY NHẤT 1 đèn LED âm trần tròn tại chính giữa tâm trần (X = 0, Z = 0)
    const centralDl = createRecessedDownlightMesh();
    centralDl.position.set(0, wallHeight, 0);
    scene.add(centralDl);

    // 3. Nguồn sáng Spotlight chĩa thẳng từ mặt đèn xuống sàn nhà trung tâm
    const downSpot = new THREE.SpotLight(0xFFF9EE, 4.5, 12, Math.PI / 3.0, 0.5, 1.2);
    downSpot.position.set(0, wallHeight - 0.01, 0);
    const downTarget = new THREE.Object3D();
    downTarget.position.set(0, 0, 0);
    scene.add(downTarget);
    downSpot.target = downTarget;
    downTarget.updateMatrixWorld();
    scene.add(downSpot);

    // =======================================================================
    // 4. VIỀN ĐEN GÓC TƯỜNG, NẸP TRẦN VÀ PHÀO CHÂN TƯỜNG (ARCHITECTURAL ACCENTS)
    // Sử dụng MeshLambertMaterial để tối đa hóa hiệu năng GPU
    // =======================================================================
    const architecturalTrimMat = new THREE.MeshLambertMaterial({ color: 0x1A1816 });

    // 4a. 4 nẹp viền đen góc đứng nối giữa 4 bức tường (Vertical Wall Corners)
    const cornerPostGeo = new THREE.BoxGeometry(0.06, wallHeight, 0.06);
    const cornerHalfW = roomWidth / 2 - 0.03;
    const cornerHalfL = roomLength / 2 - 0.03;
    [
      [-cornerHalfW, -cornerHalfL],
      [cornerHalfW, -cornerHalfL],
      [-cornerHalfW, cornerHalfL],
      [cornerHalfW, cornerHalfL],
    ].forEach(([cx, cz]) => {
      const post = new THREE.Mesh(cornerPostGeo, architecturalTrimMat);
      post.position.set(cx, wallHeight / 2, cz);
      scene.add(post);
    });

    // 4b. Viền đen chạy quanh trần nối giữa 4 bức tường và trần nhà (Crown Moldings)
    const topTrimY = wallHeight - 0.025;
    const crownSideGeo = new THREE.BoxGeometry(0.06, 0.05, roomLength);
    const crownLeft = new THREE.Mesh(crownSideGeo, architecturalTrimMat);
    crownLeft.position.set(-roomWidth / 2 + 0.03, topTrimY, 0);
    scene.add(crownLeft);

    const crownRight = new THREE.Mesh(crownSideGeo, architecturalTrimMat);
    crownRight.position.set(roomWidth / 2 - 0.03, topTrimY, 0);
    scene.add(crownRight);

    const crownEndGeo = new THREE.BoxGeometry(roomWidth, 0.05, 0.06);
    const crownBack = new THREE.Mesh(crownEndGeo, architecturalTrimMat);
    crownBack.position.set(0, topTrimY, -roomLength / 2 + 0.03);
    scene.add(crownBack);

    const crownFront = new THREE.Mesh(crownEndGeo, architecturalTrimMat);
    crownFront.position.set(0, topTrimY, roomLength / 2 - 0.03);
    scene.add(crownFront);

    // 4c. Phào chỉ gỗ chân tường (Đủ cả 4 cạnh sàn nhà)
    const bbSideGeo = new THREE.BoxGeometry(0.06, 0.22, roomLength);
    const bbLeft = new THREE.Mesh(bbSideGeo, architecturalTrimMat);
    bbLeft.position.set(-roomWidth / 2 + 0.03, 0.11, 0);
    scene.add(bbLeft);

    const bbRight = new THREE.Mesh(bbSideGeo, architecturalTrimMat);
    bbRight.position.set(roomWidth / 2 - 0.03, 0.11, 0);
    scene.add(bbRight);

    const bbEndGeo = new THREE.BoxGeometry(roomWidth, 0.22, 0.06);
    const bbBack = new THREE.Mesh(bbEndGeo, architecturalTrimMat);
    bbBack.position.set(0, 0.11, -roomLength / 2 + 0.03);
    scene.add(bbBack);

    const bbFront = new THREE.Mesh(bbEndGeo, architecturalTrimMat);
    bbFront.position.set(0, 0.11, roomLength / 2 - 0.03);
    scene.add(bbFront);

    // =======================================================================
    // TẠO CÁC KHUNG TRANH 3D VÀ BÀI VẼ HỌC SINH (FIT VỚI ẢNH & MODEL ĐÈN TRẦN)
    // Tối ưu dùng chung Geometries và Materials để giảm thiểu Draw Calls
    // =======================================================================
    stateRef.current.artworkMeshes = [];

    const frameD = 0.08;

    // Khung đèn ray trần dùng chung Geometries và Materials
    const lampMountGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.035, 18);
    const lampStemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.07, 12);
    const lampCanisterGeo = new THREE.CylinderGeometry(0.11, 0.08, 0.20, 18);
    const lampBezelGeo = new THREE.TorusGeometry(0.11, 0.012, 8, 18);
    const lampLensGeo = new THREE.CircleGeometry(0.10, 18);

    const darkMetalLambertMat = new THREE.MeshLambertMaterial({ color: 0x1E1A17 });
    const bezelLambertMat = new THREE.MeshLambertMaterial({ color: 0xD4AF37 });
    const lensLambertMat = new THREE.MeshBasicMaterial({ color: 0xFFFDE8, side: THREE.DoubleSide });

    // Khung tranh dùng chung Materials (Gỗ sồi đen + viền chỉ vàng)
    const outerFrameMat = new THREE.MeshStandardMaterial({ color: 0x2A1F18, roughness: 0.4, metalness: 0.1 });
    const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.9, roughness: 0.2 });

    // Hàm tính toán kích thước khung tranh fit chuẩn xác 100% theo tỷ lệ ảnh tự nhiên (Ôm sát tranh, không để khoảng trắng)
    const computeDimensions = (aspect: number) => {
      const ar = Math.max(0.45, Math.min(2.5, aspect));
      let pW = 1.7;
      let pH = 1.7 / ar;
      if (pH > 1.35) {
        pH = 1.35;
        pW = pH * ar;
      }
      if (pW > 2.05) {
        pW = 2.05;
        pH = pW / ar;
      }

      // Khung ôm khít bức tranh:
      // Viền chỉ vàng sang trọng viền quanh mép ảnh (bề rộng 3cm mỗi bên)
      const goldBorder = 0.03;
      const goldW = pW + goldBorder * 2;
      const goldH = pH + goldBorder * 2;

      // Khung gỗ sồi đen bên ngoài (bề rộng 7cm mỗi bên)
      const woodBorder = 0.07;
      const fW = goldW + woodBorder * 2;
      const fH = goldH + woodBorder * 2;

      return { pW, pH, goldW, goldH, fW, fH };
    };

    items.forEach((art, idx) => {
      const isLeft = idx % 2 === 0;
      const pairIndex = Math.floor(idx / 2);

      const startZ = roomLength / 2 - 4.5;
      const zPos = startZ - pairIndex * artworkSpacing;
      const xPos = isLeft ? -roomWidth / 2 + 0.08 : roomWidth / 2 - 0.08;
      const yPos = 1.95; // Tầm mắt chuẩn

      // Khởi tạo kích thước ban đầu (Tỷ lệ 4:3 cho tranh mẫu)
      const initialDims = computeDimensions(1.333);

      const frameGroup = new THREE.Group();
      frameGroup.position.set(xPos, yPos, zPos);
      frameGroup.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;

      // 1. Khung tranh gỗ sồi đen sang trọng
      const outerFrame = new THREE.Mesh(
        new THREE.BoxGeometry(initialDims.fW, initialDims.fH, frameD),
        outerFrameMat
      );
      frameGroup.add(outerFrame);

      // 2. Viền chỉ vàng nổi bật ôm trực diện mép tranh
      const goldTrim = new THREE.Mesh(
        new THREE.BoxGeometry(initialDims.goldW, initialDims.goldH, frameD + 0.006),
        goldTrimMat
      );
      frameGroup.add(goldTrim);

      // 3. Mặt toan tranh vẽ (Painting Canvas) ôm khít 100% trong lòng khung
      const sampleColors = ["#8C5E3B", "#3E6B52", "#C85A32", "#27445D"];
      const fallbackTex = createInspirationalArtTexture(art.title, sampleColors[idx % sampleColors.length]);
      const paintingMat = new THREE.MeshStandardMaterial({
        map: fallbackTex,
        roughness: 0.75,
        metalness: 0.02,
      });
      const paintingMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(initialDims.pW, initialDims.pH),
        paintingMat
      );
      paintingMesh.position.z = frameD / 2 + 0.008;
      frameGroup.add(paintingMesh);

      // 4. Biển đồng ghi tên tác phẩm bên dưới
      const plaqueTex = createPlaqueTexture(art.title, art.studentName, art.classId);
      const plaqueMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.72, 0.25),
        new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.35, metalness: 0.55 })
      );
      plaqueMesh.position.set(0, -initialDims.fH / 2 - 0.18, frameD / 2 + 0.01);
      frameGroup.add(plaqueMesh);

      // 5. Hitbox vô hình để nhấp chuột
      const hitGeo = new THREE.PlaneGeometry(initialDims.fW + 0.25, initialDims.fH + 0.35);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitGeo, hitMat);
      hitbox.position.set(0, -0.05, frameD / 2 + 0.02);
      hitbox.userData = { artwork: art, index: idx };
      frameGroup.add(hitbox);

      // Hàm cập nhật toàn bộ khung tranh fit chuẩn theo tỷ lệ ảnh tự nhiên
      const applyFrameFit = (aspect: number) => {
        const newDims = computeDimensions(aspect);

        outerFrame.geometry.dispose();
        outerFrame.geometry = new THREE.BoxGeometry(newDims.fW, newDims.fH, frameD);

        goldTrim.geometry.dispose();
        goldTrim.geometry = new THREE.BoxGeometry(newDims.goldW, newDims.goldH, frameD + 0.006);

        paintingMesh.geometry.dispose();
        paintingMesh.geometry = new THREE.PlaneGeometry(newDims.pW, newDims.pH);

        plaqueMesh.position.y = -newDims.fH / 2 - 0.18;

        hitbox.geometry.dispose();
        hitbox.geometry = new THREE.PlaneGeometry(newDims.fW + 0.25, newDims.fH + 0.35);
      };

      // Tải ảnh thực tế (Base64 hoặc URL) và tự động fit khung tranh
      const applyLoadedImage = (imageEl: HTMLImageElement) => {
        const loadedTex = new THREE.Texture(imageEl);
        loadedTex.colorSpace = THREE.SRGBColorSpace;
        loadedTex.needsUpdate = true;
        paintingMat.map = loadedTex;
        paintingMat.needsUpdate = true;

        if (imageEl.naturalWidth > 0 && imageEl.naturalHeight > 0) {
          applyFrameFit(imageEl.naturalWidth / imageEl.naturalHeight);
        }
      };

      const imageUrl = art.revisedImageUrl || art.initialImageUrl;
      if (imageUrl) {
        const img = new Image();
        if (!imageUrl.startsWith("data:")) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => applyLoadedImage(img);
        img.onerror = () => {
          if (img.crossOrigin) {
            const retryImg = new Image();
            retryImg.onload = () => applyLoadedImage(retryImg);
            retryImg.src = imageUrl;
          }
        };
        img.src = imageUrl;
        if (img.complete && img.naturalWidth > 0) {
          applyLoadedImage(img);
        }
      }

      scene.add(frameGroup);

      // =====================================================================
      // 7. MODEL CỤC ĐÈN HÌNH TRÒN NHỎ LẮP TRÊN TRẦN NHÀ (CIRCULAR TRACK SPOTLIGHT)
      // Dùng chung Geometries & Materials đã khởi tạo sẵn
      // =====================================================================
      const lampX = isLeft ? -roomWidth / 2 + 1.4 : roomWidth / 2 - 1.4;
      const lampY = wallHeight - 0.04;
      const lampZ = zPos;

      const lampGroup = new THREE.Group();
      lampGroup.position.set(lampX, lampY, lampZ);

      // Đế đèn tròn gắn áp sát vào ray trần
      const mountMesh = new THREE.Mesh(lampMountGeo, darkMetalLambertMat);
      mountMesh.position.y = -0.0175;
      lampGroup.add(mountMesh);

      // Cổ xoay kim loại nối ray với củ đèn
      const stemMesh = new THREE.Mesh(lampStemGeo, darkMetalLambertMat);
      stemMesh.position.y = -0.07;
      lampGroup.add(stemMesh);

      // Khớp xoay củ đèn tại tâm cổ xoay
      const headPivotY = -0.11;
      const headGroup = new THREE.Group();
      headGroup.position.set(0, headPivotY, 0);

      // Tọa độ thế giới của khớp xoay củ đèn
      const headWorldPos = new THREE.Vector3(lampX, lampY + headPivotY, lampZ);
      // Tâm mặt bức tranh trên tường
      const targetPos = new THREE.Vector3(xPos + (isLeft ? 0.06 : -0.06), yPos, zPos);
      // Vector hướng chĩa chuẩn xác từ củ đèn tới tâm tranh
      const aimDir = new THREE.Vector3().subVectors(targetPos, headWorldPos).normalize();

      // Xoay củ đèn: Trục +Z của headGroup hướng chuẩn xác 100% vào tâm tranh
      headGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), aimDir);

      // Củ đèn dạng ống trụ vát
      const canisterMesh = new THREE.Mesh(lampCanisterGeo, darkMetalLambertMat);
      canisterMesh.rotation.x = Math.PI / 2;
      headGroup.add(canisterMesh);

      // Vành kim loại vàng đồng quanh miệng đèn tròn (+Z)
      const bezelMesh = new THREE.Mesh(lampBezelGeo, bezelLambertMat);
      bezelMesh.position.z = 0.10;
      headGroup.add(bezelMesh);

      // Mặt kính đèn tròn phát sáng rực rỡ (+Z)
      const lensMesh = new THREE.Mesh(lampLensGeo, lensLambertMat);
      lensMesh.position.z = 0.102;
      headGroup.add(lensMesh);

      lampGroup.add(headGroup);
      scene.add(lampGroup);

      // =====================================================================
      // 8. BỐ CỤC ÁNH SÁNG SPOTLIGHT RỌI TRANH (CỰ LY TẬP TRUNG 5M KHÔNG LAN TRÀN)
      // =====================================================================
      const spotOrigin = headWorldPos.clone().addScaledVector(aimDir, 0.12);

      const spotLight = new THREE.SpotLight(0xFFF8E8, 3.8, 5.0, Math.PI / 4.6, 0.45, 1.3);
      spotLight.position.copy(spotOrigin);

      const lightTarget = new THREE.Object3D();
      lightTarget.position.copy(targetPos);
      scene.add(lightTarget);
      spotLight.target = lightTarget;
      lightTarget.updateMatrixWorld();
      scene.add(spotLight);

      // Vị trí camera đứng đối diện bức tranh
      const focusDistance = 2.2;
      const focusPos = new THREE.Vector3(
        isLeft ? -roomWidth / 2 + focusDistance : roomWidth / 2 - focusDistance,
        1.65,
        zPos
      );
      const focusTarget = new THREE.Vector3(xPos, yPos, zPos);

      stateRef.current.artworkMeshes.push({
        hitbox,
        artwork: art,
        focusPos,
        focusTarget,
        index: idx,
      });
    });

    // Lưu danh sách hitbox một lần duy nhất (Zero reallocation during raycast)
    stateRef.current.hitboxes = stateRef.current.artworkMeshes.map((m) => m.hitbox);

    // =======================================================================
    // VÒNG LẶP RENDER & CƠ CHẾ ĐIỀU HƯỚNG MƯỢT MÀ (ZERO GC & CINEMATIC DAMPING)
    // =======================================================================
    let lastTime = performance.now();
    let lastRaycastCheck = 0;

    const animate = () => {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const state = stateRef.current;
      const cam = state.camera;

      if (cam) {
        // 1. Quá trình lướt camera tới bức tranh (Smooth Lerp)
        if (state.targetCamPos && state.targetCamLook) {
          cam.position.lerp(state.targetCamPos, 0.09);

          cam.getWorldDirection(_vCurLook);
          _vWantLook.copy(state.targetCamLook).sub(cam.position).normalize();
          _vCurLook.lerp(_vWantLook, 0.09);
          _vLookTarget.copy(cam.position).add(_vCurLook);
          cam.lookAt(_vLookTarget);

          if (cam.position.distanceTo(state.targetCamPos) < 0.05) {
            state.targetCamPos = null;
            state.targetCamLook = null;
          }
        } else {
          // 2. Di chuyển tự do bằng bàn phím (Smooth cinematic inertia - không giật khựng)
          const moveSpeed = 4.2;
          _vForward.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw)).normalize();
          _vRight.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw)).normalize();

          let moveX = 0;
          let moveZ = 0;

          if (state.keys["KeyW"] || state.keys["ArrowUp"]) {
            moveX += _vForward.x;
            moveZ += _vForward.z;
          }
          if (state.keys["KeyS"] || state.keys["ArrowDown"]) {
            moveX -= _vForward.x;
            moveZ -= _vForward.z;
          }
          if (state.keys["KeyA"] || state.keys["ArrowLeft"]) {
            moveX -= _vRight.x;
            moveZ -= _vRight.z;
          }
          if (state.keys["KeyD"] || state.keys["ArrowRight"]) {
            moveX += _vRight.x;
            moveZ += _vRight.z;
          }

          const moveLen = Math.hypot(moveX, moveZ);
          let targetVx = 0;
          let targetVz = 0;
          if (moveLen > 0.001) {
            targetVx = (moveX / moveLen) * moveSpeed;
            targetVz = (moveZ / moveLen) * moveSpeed;
          }

          const moveDamping = Math.min(1.0, 14.0 * delta);
          state.velocity.x += (targetVx - state.velocity.x) * moveDamping;
          state.velocity.z += (targetVz - state.velocity.z) * moveDamping;

          const halfW = state.roomWidth / 2 - 0.8;
          const halfL = state.roomLength / 2 - 0.8;

          cam.position.x = Math.max(-halfW, Math.min(halfW, cam.position.x + state.velocity.x * delta));
          cam.position.z = Math.max(-halfL, Math.min(halfL, cam.position.z + state.velocity.z * delta));
          cam.position.y = 1.65;

          // Làm mượt góc xoay tầm nhìn chuột & cảm ứng (Rotational smoothing)
          const lookDamping = Math.min(1.0, 24.0 * delta);
          state.yaw += (state.targetYaw - state.yaw) * lookDamping;
          state.pitch += (state.targetPitch - state.pitch) * lookDamping;

          _vLookTarget.set(
            cam.position.x - Math.sin(state.yaw) * Math.cos(state.pitch),
            cam.position.y + Math.sin(state.pitch),
            cam.position.z - Math.cos(state.yaw) * Math.cos(state.pitch)
          );
          cam.lookAt(_vLookTarget);
        }

        // 3. Kiểm tra tâm ngắm (Crosshair) & Bức tranh gần nhất định kỳ mỗi 200ms
        // Tách biệt hoàn toàn khỏi React state: không kích hoạt React re-render
        if (now - lastRaycastCheck > 200) {
          lastRaycastCheck = now;

          // Raycast kiểm tra tâm ngắm
          state.raycaster.setFromCamera(_vCenterV2, cam);
          const hits = state.raycaster.intersectObjects(state.hitboxes, false);
          const isHit = hits.length > 0 && hits[0].distance < 6.0;

          if (isHit !== state.wasHit) {
            state.wasHit = isHit;
            if (reticleDotRef.current) {
              reticleDotRef.current.className = isHit
                ? "w-7 h-7 rounded-full border-2 border-amber-400 bg-amber-400/20 scale-125 transition-all duration-150 pointer-events-none"
                : "w-2.5 h-2.5 rounded-full bg-white/70 shadow-xs transition-all duration-150 pointer-events-none";
            }
            if (reticleLabelRef.current) {
              reticleLabelRef.current.style.display = isHit ? "block" : "none";
            }
          }

          // Kiểm tra bức tranh gần nhất
          let closest: Artwork | null = null;
          let minD2 = 6.76; // 2.6 * 2.6

          for (const item of state.artworkMeshes) {
            const d2 = cam.position.distanceToSquared(item.focusPos);
            if (d2 < minD2) {
              minD2 = d2;
              closest = item.artwork;
            }
          }

          if (closest?.id !== focusedArtRef.current?.id) {
            focusedArtRef.current = closest;
            setFocusedArtwork(closest);
          }
        }
      }

      renderer.render(scene, camera);
      state.animFrameId = requestAnimationFrame(animate);
    };

    stateRef.current.animFrameId = requestAnimationFrame(animate);

    // =======================================================================
    // XỬ LÝ SỰ KIỆN PHÍM VÀ CHUỘT
    // =======================================================================
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = true;
      stateRef.current.targetCamPos = null;
      stateRef.current.targetCamLook = null;

      if ((e.code === "KeyE" || e.code === "Space") && focusedArtRef.current) {
        onSelectArtworkRef.current(focusedArtRef.current);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.mouseStartPos = { x: e.clientX, y: e.clientY };
      stateRef.current.prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!stateRef.current.isDragging) return;

      const dx = e.clientX - stateRef.current.prevMousePos.x;
      const dy = e.clientY - stateRef.current.prevMousePos.y;
      stateRef.current.prevMousePos = { x: e.clientX, y: e.clientY };

      const rotSpeed = 0.0030;
      stateRef.current.targetYaw -= dx * rotSpeed;
      stateRef.current.targetPitch = Math.max(-1.15, Math.min(1.15, stateRef.current.targetPitch - dy * rotSpeed));

      stateRef.current.targetCamPos = null;
      stateRef.current.targetCamLook = null;
    };

    const handleMouseUp = (e: MouseEvent) => {
      stateRef.current.isDragging = false;

      // Phân biệt thao tác Click và Kéo chuột
      const dragDist = Math.hypot(
        e.clientX - stateRef.current.mouseStartPos.x,
        e.clientY - stateRef.current.mouseStartPos.y
      );

      // Nếu kéo chuột < 6px thì mới tính là Click chọn tranh
      if (dragDist < 6) {
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const state = stateRef.current;
        if (!state.camera || !state.scene) return;

        state.raycaster.setFromCamera(new THREE.Vector2(x, y), state.camera);
        const intersects = state.raycaster.intersectObjects(state.hitboxes, false);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const art = hit.userData.artwork as Artwork;
          const targetIdx = hit.userData.index as number;

          if (art) {
            // Nếu đã đứng trước tranh hoặc nhấp lại lần nữa -> Mở Modal chi tiết
            if (focusedArtRef.current?.id === art.id) {
              onSelectArtworkRef.current(art);
            } else {
              focusOnArtworkByIndex(targetIdx);
            }
          }
        }
      }
    };

    // Sự kiện Touch cho màn hình cảm ứng di động
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        stateRef.current.isDragging = true;
        stateRef.current.mouseStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        stateRef.current.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!stateRef.current.isDragging || e.touches.length !== 1) return;

      const dx = e.touches[0].clientX - stateRef.current.prevMousePos.x;
      const dy = e.touches[0].clientY - stateRef.current.prevMousePos.y;
      stateRef.current.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      const rotSpeed = 0.0040;
      stateRef.current.targetYaw -= dx * rotSpeed;
      stateRef.current.targetPitch = Math.max(-1.15, Math.min(1.15, stateRef.current.targetPitch - dy * rotSpeed));
    };

    const handleTouchEnd = (e: TouchEvent) => {
      stateRef.current.isDragging = false;
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const dragDist = Math.hypot(
          touch.clientX - stateRef.current.mouseStartPos.x,
          touch.clientY - stateRef.current.mouseStartPos.y
        );

        if (dragDist < 10) {
          const rect = canvas.getBoundingClientRect();
          const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

          const state = stateRef.current;
          if (!state.camera || !state.scene) return;

          state.raycaster.setFromCamera(new THREE.Vector2(x, y), state.camera);
          const intersects = state.raycaster.intersectObjects(state.hitboxes, false);

          if (intersects.length > 0) {
            const hit = intersects[0].object;
            const art = hit.userData.artwork as Artwork;
            const targetIdx = hit.userData.index as number;
            if (art) {
              if (focusedArtRef.current?.id === art.id) {
                onSelectArtworkRef.current(art);
              } else {
                focusOnArtworkByIndex(targetIdx);
              }
            }
          }
        }
      }
    };

    // Tự động căn chỉnh kích thước khi khung cha thay đổi
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nw = entry.contentRect.width;
        const nh = entry.contentRect.height;
        if (nw > 0 && nh > 0 && camera && renderer) {
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, nh);
        }
      }
    });
    resizeObserver.observe(container);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd);

    const capturedState = stateRef.current;

    return () => {
      cancelAnimationFrame(capturedState.animFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);

      scene.clear();
      renderer.dispose();
      woodTexture.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      wallMat.dispose();
      glowTex.dispose();
      haloMat.dispose();
      downlightWhiteMat.dispose();
      downlightDiffuserMat.dispose();
      downlightStepMat.dispose();
      ceilingGeo.dispose();
      ceilingMat.dispose();
      trackMat.dispose();
      architecturalTrimMat.dispose();
      darkMetalLambertMat.dispose();
      bezelLambertMat.dispose();
      lensLambertMat.dispose();
      outerFrameMat.dispose();
      goldTrimMat.dispose();
      lampMountGeo.dispose();
      lampStemGeo.dispose();
      lampCanisterGeo.dispose();
      lampBezelGeo.dispose();
      lampLensGeo.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworksKey, focusOnArtworkByIndex]);

  // Phím điều khiển ảo cho điện thoại (Hỗ trợ cả chạm tức thì và giữ phím)
  const handleVirtualWalk = useCallback((dir: "w" | "s" | "a" | "d", isPress: boolean) => {
    const codeMap: { [key: string]: string } = {
      w: "KeyW",
      s: "KeyS",
      a: "KeyA",
      d: "KeyD",
    };
    const state = stateRef.current;
    state.keys[codeMap[dir]] = isPress;
    state.targetCamPos = null;
    state.targetCamLook = null;

    if (isPress) {
      // Khi vừa chạm: Lập tức cấp gia tốc đẩy bước chân (Step impulse)
      // Giúp dù người dùng chạm nhẹ (tap) hay giữ lâu (hold), bước đi vẫn di chuyển rõ nét và tức thì!
      const stepImpulse = 3.2;
      _vForward.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw)).normalize();
      _vRight.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw)).normalize();

      if (dir === "w") {
        state.velocity.x += _vForward.x * stepImpulse;
        state.velocity.z += _vForward.z * stepImpulse;
      } else if (dir === "s") {
        state.velocity.x -= _vForward.x * stepImpulse;
        state.velocity.z -= _vForward.z * stepImpulse;
      } else if (dir === "a") {
        state.velocity.x -= _vRight.x * stepImpulse;
        state.velocity.z -= _vRight.z * stepImpulse;
      } else if (dir === "d") {
        state.velocity.x += _vRight.x * stepImpulse;
        state.velocity.z += _vRight.z * stepImpulse;
      }
    }
  }, []);

  const createWalkHandlers = useCallback((dir: "w" | "s" | "a" | "d") => {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {}
        handleVirtualWalk(dir, true);
      },
      onPointerUp: (e: React.PointerEvent) => {
        e.preventDefault();
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
        handleVirtualWalk(dir, false);
      },
      onPointerCancel: (e: React.PointerEvent) => {
        e.preventDefault();
        handleVirtualWalk(dir, false);
      },
      onPointerLeave: (e: React.PointerEvent) => {
        if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) {
          handleVirtualWalk(dir, false);
        }
      },
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      style: {
        touchAction: "none",
        WebkitTouchCallout: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      } as React.CSSProperties,
    };
  }, [handleVirtualWalk]);

  // Bật/tắt toàn màn hình
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex-1 bg-[#1A1614] overflow-hidden select-none outline-none"
    >
      {/* KHUNG VẼ 3D WEBGL */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* TÂM NGẮM THẨM MỸ (RETICLE) - ZERO REACT RE-RENDER */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
        <div
          ref={reticleDotRef}
          className="w-2.5 h-2.5 rounded-full bg-white/70 shadow-xs transition-all duration-150 pointer-events-none"
        />
        <span
          ref={reticleLabelRef}
          style={{ display: "none" }}
          className="absolute -bottom-6 text-[10px] font-bold text-amber-300 bg-stone-900/80 px-2 py-0.5 rounded-full whitespace-nowrap backdrop-blur-xs pointer-events-none"
        >
          Nhấp để xem tranh
        </span>
      </div>

      {/* =====================================================================
          HUD TRÊN CÙNG: HUY HIỆU PHIÊN BẢN (TRÁI) & THANH CÔNG CỤ (PHẢI)
          ===================================================================== */}
      <div className="absolute top-4 left-4 pointer-events-none z-20 flex items-center gap-2">
        <div className="bg-stone-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-700/60 shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-serif font-bold text-xs text-white">Triển Lãm 3D</span>
          <span className="text-[9.5px] font-mono font-semibold bg-stone-800 text-amber-300 px-1.5 py-0.2 rounded border border-stone-700">
            v{APP_VERSION}
          </span>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex items-center justify-end pointer-events-none z-20">

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Nút chuyển sang dạng lưới 2D */}
          <button
            onClick={onSwitchToGrid}
            type="button"
            className="bg-white/95 hover:bg-white text-stone-800 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg border border-stone-200 backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Chuyển sang chế độ lưới 2D"
          >
            <LayoutGrid className="w-4 h-4 text-[#C85A32]" />
            <span className="hidden sm:inline">Dạng Lưới 2D</span>
          </button>

          {/* Hướng dẫn */}
          <button
            onClick={() => setShowHelp((prev) => !prev)}
            type="button"
            className="w-9 h-9 rounded-xl bg-stone-900/85 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/60 flex items-center justify-center transition-all cursor-pointer"
            title="Hướng dẫn di chuyển"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Bật/Tắt Toàn Màn Hình */}
          <button
            onClick={toggleFullscreen}
            type="button"
            className="w-9 h-9 rounded-xl bg-stone-900/85 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700/60 flex items-center justify-center transition-all cursor-pointer"
            title={isFullscreen ? "Thoát toàn màn hình" : "Xem toàn màn hình"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* =====================================================================
          HỘP CHỈ DẪN ĐIỀU KHIỂN (POPUP CÓ NÚT TẮT)
          ===================================================================== */}
      {showHelp && (
        <div className="absolute top-18 left-4 max-w-xs bg-stone-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-stone-700/70 text-white shadow-2xl pointer-events-auto z-20 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <span className="text-[11.5px] font-bold text-amber-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Cách tham quan phòng 3D (v{APP_VERSION})
            </span>
            <button
              onClick={() => setShowHelp(false)}
              className="text-stone-400 hover:text-white text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          </div>
          <ul className="text-[11px] text-stone-300 space-y-1.5 mt-2">
            <li className="flex items-center justify-between">
              <span>Đi lại:</span>
              <kbd className="px-1.5 py-0.5 bg-stone-800 rounded border border-stone-700 font-mono text-[10px] text-amber-300">
                W A S D / Mũi tên
              </kbd>
            </li>
            <li className="flex items-center justify-between">
              <span>Xoay góc nhìn:</span>
              <span className="text-stone-400">Giữ chuột & rê</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Lướt tới xem tranh:</span>
              <span className="text-stone-400">Nhấp chuột vào tranh</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Mở bài Before–After:</span>
              <kbd className="px-1.5 py-0.5 bg-stone-800 rounded border border-stone-700 font-mono text-[10px] text-amber-300">
                Phím E / Nhấp đúp
              </kbd>
            </li>
          </ul>
        </div>
      )}

      {/* =====================================================================
          THẺ CHI TIẾT BỨC TRANH ĐANG ĐỨNG ĐỐI DIỆN
          ===================================================================== */}
      {focusedArtwork && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto z-20 max-w-md w-[92%] sm:w-auto animate-in slide-in-from-bottom-3 duration-200">
          <div className="bg-stone-900/95 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-amber-500/60 shadow-2xl flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[9.5px] uppercase font-bold tracking-wider text-amber-400 block">
                Đang chiêm ngưỡng
              </span>
              <h3 className="font-serif font-bold text-white text-sm truncate">
                {focusedArtwork.title}
              </h3>
              <p className="text-[11px] text-stone-300 truncate">
                Tác giả: <strong>{focusedArtwork.studentName}</strong> • Lớp {focusedArtwork.classId.toUpperCase()}
              </p>
            </div>
            <button
              onClick={() => onSelectArtwork(focusedArtwork)}
              type="button"
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 shrink-0 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem chi tiết</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          THANH ĐIỀU HƯỚNG NHANH CÁC BỨC TRANH Ở ĐÁY MÀN HÌNH (QUICK JUMP BAR)
          Portrait: Căn giữa đáy màn hình
          Landscape: Tự động dạt về góc dưới bên phải để KHÔNG dính chùm với D-pad góc trái
          ===================================================================== */}
      <div className="absolute bottom-3 sm:bottom-4 left-3 right-3 landscape:left-auto landscape:right-3 flex items-center justify-center landscape:justify-end pointer-events-none z-20">
        <div className="bg-stone-900/90 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-2xl border border-stone-700/60 shadow-xl pointer-events-auto flex items-center gap-1.5 sm:gap-2 max-w-full landscape:max-w-[calc(100vw-160px)] overflow-x-auto">
          <button
            onClick={() => focusOnArtworkByIndex(Math.max(0, activeArtworkIndex - 1))}
            disabled={activeArtworkIndex <= 0}
            className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-25 text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
            title="Tranh trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[calc(100vw-160px)] sm:max-w-md landscape:max-w-[calc(100vw-240px)] py-1">
            {displayArtworks.map((art, idx) => (
              <button
                key={art.id}
                onClick={() => focusOnArtworkByIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] sm:text-[11px] font-medium transition-all cursor-pointer shrink-0 truncate max-w-[105px] sm:max-w-[130px] ${activeArtworkIndex === idx
                  ? "bg-amber-600 text-white font-bold shadow-xs scale-105"
                  : "bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white"
                  }`}
                title={`${art.title} - ${art.studentName}`}
              >
                {idx + 1}. {art.title}
              </button>
            ))}
          </div>

          <button
            onClick={() => focusOnArtworkByIndex(Math.min(displayArtworks.length - 1, activeArtworkIndex + 1))}
            disabled={activeArtworkIndex >= displayArtworks.length - 1}
            className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-25 text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
            title="Tranh tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          NÚT ĐIỀU HƯỚNG ẢO CHO THIẾT BỊ DI ĐỘNG (MOBILE D-PAD)
          CHỈ HIỂN THỊ TRÊN THIẾT BỊ CẢM ỨNG DI ĐỘNG (ẨN HOÀN TOÀN TRÊN MÁY TÍNH / DESKTOP)
          Portrait: Nằm góc trái ở trên thanh chọn ảnh
          Landscape: Nằm góc dưới bên trái, tách rời hoàn toàn với thanh chọn ảnh bên phải
          ===================================================================== */}
      {isTouchDevice && (
        <div className="absolute bottom-20 landscape:bottom-3 left-3 pointer-events-auto z-20 flex flex-col items-center gap-1 bg-stone-900/85 p-1.5 sm:p-2 rounded-2xl border border-stone-700/60 backdrop-blur-md shadow-2xl select-none lg:hidden">
          <button
            type="button"
            {...createWalkHandlers("w")}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-amber-600 active:scale-95 text-white flex items-center justify-center transition-transform select-none shadow-sm cursor-pointer"
            title="Tiến lên"
            aria-label="Tiến lên"
          >
            <ArrowUp className="w-5 h-5 pointer-events-none" />
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              {...createWalkHandlers("a")}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-amber-600 active:scale-95 text-white flex items-center justify-center transition-transform select-none shadow-sm cursor-pointer"
              title="Qua trái"
              aria-label="Qua trái"
            >
              <ArrowLeft className="w-5 h-5 pointer-events-none" />
            </button>
            <button
              type="button"
              {...createWalkHandlers("s")}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-amber-600 active:scale-95 text-white flex items-center justify-center transition-transform select-none shadow-sm cursor-pointer"
              title="Lùi lại"
              aria-label="Lùi lại"
            >
              <ArrowDown className="w-5 h-5 pointer-events-none" />
            </button>
            <button
              type="button"
              {...createWalkHandlers("d")}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-stone-800 hover:bg-stone-700 active:bg-amber-600 active:scale-95 text-white flex items-center justify-center transition-transform select-none shadow-sm cursor-pointer"
              title="Qua phải"
              aria-label="Qua phải"
            >
              <ArrowRight className="w-5 h-5 pointer-events-none" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          THÔNG BÁO GỢI Ý XOAY NGANG MÀN HÌNH TRÊN DI ĐỘNG
          Tự động xuất hiện khi ở chế độ dọc và tự tắt khi người dùng xoay ngang
          ===================================================================== */}
      {showRotatePrompt && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-stone-900/95 border border-stone-700/80 rounded-3xl p-5 sm:p-6 max-w-[340px] w-full text-center shadow-2xl space-y-4">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Smartphone className="w-8 h-8 animate-pulse rotate-90 transition-transform" />
              <RotateCw className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: "6s" }} />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-bold text-white tracking-tight">
                Xoay Ngang Màn Hình
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Phòng triển lãm 3D được thiết kế theo tỷ lệ điện ảnh góc rộng. Bạn hãy xoay ngang điện thoại để có tầm nhìn khoáng đạt và điều khiển bước đi thuận tiện nhất nhé.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowRotatePrompt(false)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Đã hiểu • Tiếp tục xem</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

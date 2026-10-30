import { Artwork, ClassRoom, Student, Topic } from "@/types/artprogress";

export interface TopicGradeSummaryRow {
  stt: number;
  studentId: string;
  studentName: string;
  submissionStatus: "Đã nộp bản đầu" | "Đã nộp bản sửa" | "Đã duyệt" | "Chờ duyệt" | "Chưa nộp bài";
  artworkTitle: string;
  criteriaReviews: {
    criterionId: string;
    criterionName: string;
    level: string; // "Xuất sắc" | "Tốt" | "Đạt" | "Chưa đạt" | "-"
  }[];
  score: number | null;
  gradeLevel: "Xuất sắc" | "Tốt" | "Đạt" | "Chưa đạt" | "Chưa đánh giá";
  teacherFeedback: string;
  selfReflection: "Đã tự đánh giá" | "Chưa";
  submittedAt: string;
}

export interface TopicGradeStatistics {
  totalStudents: number;
  submittedCount: number;
  submittedPercent: number;
  unsubmittedCount: number;
  unsubmittedPercent: number;
  gradeCount: {
    xuatSac: number;
    tot: number;
    dat: number;
    chuaDat: number;
  };
  gradePercent: {
    xuatSac: number;
    tot: number;
    dat: number;
    chuaDat: number;
  };
  averageScore: number | null;
  maxScore: number | null;
  minScore: number | null;
}

export interface TopicGradeReportData {
  topic: Topic;
  classRoom: ClassRoom;
  rows: TopicGradeSummaryRow[];
  statistics: TopicGradeStatistics;
  exportedAt: string;
}

/**
 * Thoát các ký tự đặc biệt trong XML để tránh lỗi parse khi mở trên Excel
 */
function escapeXml(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Thoát chuỗi dữ liệu chuẩn định dạng CSV
 */
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Xây dựng bảng dữ liệu chấm điểm tổng hợp đầy đủ theo từng chủ đề và lớp
 */
export function buildTopicGradeSummaryData(
  topic: Topic,
  classRoom: ClassRoom,
  students: Student[],
  artworks: Artwork[]
): TopicGradeReportData {
  // Lọc học sinh thuộc lớp đang chọn (hoặc tất cả nếu đã lọc sẵn)
  const classStudents = students.filter(
    (s) => !s.classId || s.classId === classRoom.id || s.classId.toUpperCase() === classRoom.id.toUpperCase()
  );

  const rows: TopicGradeSummaryRow[] = classStudents.map((student, index) => {
    // Tìm bài vẽ của học sinh theo topicId và studentId
    const artwork = artworks.find(
      (a) => a.studentId === student.id && a.topicId === topic.id
    );

    let submissionStatus: TopicGradeSummaryRow["submissionStatus"] = "Chưa nộp bài";
    let artworkTitle = "(Chưa nộp bài)";
    let score: number | null = null;
    let gradeLevel: TopicGradeSummaryRow["gradeLevel"] = "Chưa đánh giá";
    let teacherFeedback = "Chưa có bài nộp";
    let selfReflection: TopicGradeSummaryRow["selfReflection"] = "Chưa";
    let submittedAt = "-";

    const criteriaReviews: TopicGradeSummaryRow["criteriaReviews"] = (topic.rubric || []).map((r) => ({
      criterionId: r.id,
      criterionName: r.name,
      level: "-",
    }));

    if (artwork) {
      artworkTitle = artwork.title || "Tác phẩm thực hành";
      submittedAt = artwork.submittedAt ? new Date(artwork.submittedAt).toLocaleDateString("vi-VN") : "-";

      if (artwork.revisedImageUrl) {
        submissionStatus = "Đã nộp bản sửa";
      } else if (artwork.feedback?.status === "approved") {
        submissionStatus = "Đã duyệt";
      } else if (artwork.feedback?.status === "pending_moderation") {
        submissionStatus = "Chờ duyệt";
      } else {
        submissionStatus = "Đã nộp bản đầu";
      }

      if (artwork.selfReflection?.reflectionText) {
        selfReflection = "Đã tự đánh giá";
      }

      if (artwork.feedback) {
        teacherFeedback =
          artwork.feedback.teacherNotes ||
          artwork.feedback.overallStrength ||
          "Đã ghi nhận bài vẽ";

        if (typeof artwork.feedback.referenceScore === "number") {
          score = Math.round(artwork.feedback.referenceScore * 10) / 10;

          if (score >= 9.0) gradeLevel = "Xuất sắc";
          else if (score >= 7.5) gradeLevel = "Tốt";
          else if (score >= 5.0) gradeLevel = "Đạt";
          else gradeLevel = "Chưa đạt";
        }

        // Khớp tiêu chí Rubric
        if (Array.isArray(artwork.feedback.criteriaReviews)) {
          criteriaReviews.forEach((cr) => {
            const found = artwork.feedback?.criteriaReviews.find(
              (rev) =>
                rev.criterionId === cr.criterionId ||
                rev.criterionName.trim().toLowerCase() === cr.criterionName.trim().toLowerCase()
            );
            if (found && found.level) {
              cr.level = found.level;
            }
          });
        }
      }
    }

    return {
      stt: index + 1,
      studentId: student.id,
      studentName: student.name,
      submissionStatus,
      artworkTitle,
      criteriaReviews,
      score,
      gradeLevel,
      teacherFeedback,
      selfReflection,
      submittedAt,
    };
  });

  // Tính toán số liệu thống kê
  const totalStudents = classStudents.length;
  const submittedRows = rows.filter((r) => r.submissionStatus !== "Chưa nộp bài");
  const submittedCount = submittedRows.length;
  const unsubmittedCount = totalStudents - submittedCount;
  const submittedPercent = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
  const unsubmittedPercent = 100 - submittedPercent;

  const validScores = rows.map((r) => r.score).filter((s): s is number => typeof s === "number");
  const averageScore =
    validScores.length > 0
      ? Math.round((validScores.reduce((sum, s) => sum + s, 0) / validScores.length) * 10) / 10
      : null;
  const maxScore = validScores.length > 0 ? Math.max(...validScores) : null;
  const minScore = validScores.length > 0 ? Math.min(...validScores) : null;

  const gradeCount = {
    xuatSac: rows.filter((r) => r.gradeLevel === "Xuất sắc").length,
    tot: rows.filter((r) => r.gradeLevel === "Tốt").length,
    dat: rows.filter((r) => r.gradeLevel === "Đạt").length,
    chuaDat: rows.filter((r) => r.gradeLevel === "Chưa đạt").length,
  };

  const gradedCount = gradeCount.xuatSac + gradeCount.tot + gradeCount.dat + gradeCount.chuaDat;
  const gradePercent = {
    xuatSac: gradedCount > 0 ? Math.round((gradeCount.xuatSac / gradedCount) * 100) : 0,
    tot: gradedCount > 0 ? Math.round((gradeCount.tot / gradedCount) * 100) : 0,
    dat: gradedCount > 0 ? Math.round((gradeCount.dat / gradedCount) * 100) : 0,
    chuaDat: gradedCount > 0 ? Math.round((gradeCount.chuaDat / gradedCount) * 100) : 0,
  };

  return {
    topic,
    classRoom,
    rows,
    statistics: {
      totalStudents,
      submittedCount,
      submittedPercent,
      unsubmittedCount,
      unsubmittedPercent,
      gradeCount,
      gradePercent,
      averageScore,
      maxScore,
      minScore,
    },
    exportedAt: new Date().toLocaleDateString("vi-VN"),
  };
}

/**
 * Sinh chuỗi nội dung XML Spreadsheet 2003 (.xls) chuyên nghiệp, có định dạng màu sắc & đường viền
 */
export function generateTopicGradeExcelXml(
  topic: Topic,
  classRoom: ClassRoom,
  students: Student[],
  artworks: Artwork[]
): string {
  const data = buildTopicGradeSummaryData(topic, classRoom, students, artworks);
  const rubricList = topic.rubric || [];
  const totalColumns = 9 + rubricList.length;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>ArtProgress AI - Mĩ Thuật GDPT 2018</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E1C1A"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="15" ss:Bold="1" ss:Color="#C86446"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Italic="1" ss:Color="#666666"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#333333"/>
  </Style>
  <Style ss:ID="MetaValue">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E1C1A"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#C86446" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RubricHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4F6B58" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Cell">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1E1C1A"/>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1E1C1A"/>
  </Style>
  <Style ss:ID="CellBoldCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#1E1C1A"/>
  </Style>
  <Style ss:ID="CellScore">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10.5" ss:Bold="1" ss:Color="#C86446"/>
   <NumberFormat ss:Format="0.0"/>
  </Style>
  <Style ss:ID="LevelXuatSac">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#6B21A8"/>
   <Interior ss:Color="#F3E8FF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="LevelTot">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Bold="1" ss:Color="#166534"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="LevelDat">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#1E3A8A"/>
   <Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="LevelChuaDat">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="9.5" ss:Color="#991B1B"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="StatsHeader">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#DCD7CF"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#1E1C1A"/>
   <Interior ss:Color="#FAF8F5" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Bảng Điểm">
  <Table ss:DefaultColumnWidth="80" ss:DefaultRowHeight="20">
   <Column ss:Width="40"/>
   <Column ss:Width="85"/>
   <Column ss:Width="160"/>
   <Column ss:Width="110"/>
   <Column ss:Width="170"/>
   ${rubricList.map(() => `<Column ss:Width="125"/>`).join("\n   ")}
   <Column ss:Width="80"/>
   <Column ss:Width="105"/>
   <Column ss:Width="280"/>
   <Column ss:Width="95"/>
   <Column ss:Width="85"/>

   <!-- TIÊU ĐỀ BẢNG ĐIỂM -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="${totalColumns - 1}" ss:StyleID="Title">
     <Data ss:Type="String">BẢNG ĐÁNH GIÁ &amp; TỔNG HỢP ĐIỂM BÀI THỰC HÀNH MĨ THUẬT</Data>
    </Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="${totalColumns - 1}" ss:StyleID="SubTitle">
     <Data ss:Type="String">Chương trình Giáo dục Phổ thông 2018 • Môn Mĩ thuật THCS (ArtProgress AI)</Data>
    </Cell>
   </Row>
   <Row ss:Height="10"/>

   <!-- THÔNG TIN CHỦ ĐỀ & LỚP HỌC -->
   <Row ss:Height="20">
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Chủ đề bài học:</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(topic.title)}</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Lớp học:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(classRoom.name)} (Khối ${classRoom.grade})</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Ngày xuất:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${escapeXml(data.exportedAt)}</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Sĩ số lớp:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${data.statistics.totalStudents} học sinh</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Đã nộp:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${data.statistics.submittedCount} HS (${data.statistics.submittedPercent}%)</Data></Cell>
    <Cell ss:StyleID="MetaLabel"><Data ss:Type="String">Điểm TB:</Data></Cell>
    <Cell ss:StyleID="MetaValue"><Data ss:Type="String">${data.statistics.averageScore !== null ? `${data.statistics.averageScore} / 10` : "Chưa có"}</Data></Cell>
   </Row>
   <Row ss:Height="12"/>

   <!-- HÀNG TIÊU ĐỀ CỘT -->
   <Row ss:Height="30">
    <Cell ss:StyleID="Header"><Data ss:Type="String">STT</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mã HS</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Họ và tên học sinh</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Trạng thái</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tên bài vẽ</Data></Cell>
    ${rubricList
      .map(
        (r) =>
          `<Cell ss:StyleID="RubricHeader"><Data ss:Type="String">${escapeXml(r.name)} (${r.weight}%)</Data></Cell>`
      )
      .join("\n    ")}
    <Cell ss:StyleID="Header"><Data ss:Type="String">Điểm số</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Xếp loại</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nhận xét &amp; Lời phê của Giáo viên</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tự đánh giá</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Ngày nộp</Data></Cell>
   </Row>
`;

  // Từng hàng học sinh
  data.rows.forEach((row) => {
    const levelStyle =
      row.gradeLevel === "Xuất sắc"
        ? "LevelXuatSac"
        : row.gradeLevel === "Tốt"
        ? "LevelTot"
        : row.gradeLevel === "Đạt"
        ? "LevelDat"
        : row.gradeLevel === "Chưa đạt"
        ? "LevelChuaDat"
        : "CellCenter";

    xml += `   <Row ss:Height="22">
    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${row.stt}</Data></Cell>
    <Cell ss:StyleID="CellBoldCenter"><Data ss:Type="String">${escapeXml(row.studentId)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.studentName)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(row.submissionStatus)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.artworkTitle)}</Data></Cell>
    ${row.criteriaReviews
      .map((c) => {
        const critStyle =
          c.level === "Xuất sắc"
            ? "LevelXuatSac"
            : c.level === "Tốt"
            ? "LevelTot"
            : c.level === "Đạt"
            ? "LevelDat"
            : c.level === "Chưa đạt"
            ? "LevelChuaDat"
            : "CellCenter";
        return `<Cell ss:StyleID="${critStyle}"><Data ss:Type="String">${escapeXml(c.level)}</Data></Cell>`;
      })
      .join("\n    ")}
    ${
      row.score !== null
        ? `<Cell ss:StyleID="CellScore"><Data ss:Type="Number">${row.score}</Data></Cell>`
        : `<Cell ss:StyleID="CellCenter"><Data ss:Type="String">-</Data></Cell>`
    }
    <Cell ss:StyleID="${levelStyle}"><Data ss:Type="String">${escapeXml(row.gradeLevel)}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.teacherFeedback)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(row.selfReflection)}</Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(row.submittedAt)}</Data></Cell>
   </Row>
`;
  });

  // Khối thống kê tổng hợp ở chân bảng
  xml += `   <Row ss:Height="12"/>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="${totalColumns - 1}" ss:StyleID="StatsHeader">
     <Data ss:Type="String">THỐNG KÊ KẾT QUẢ ĐÁNH GIÁ CHỦ ĐỀ — LỚP ${escapeXml(classRoom.name.toUpperCase())}</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="CellBoldCenter"><Data ss:Type="String">•</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="Cell"><Data ss:Type="String">Sĩ số học sinh:</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="CellBoldCenter"><Data ss:Type="String">${data.statistics.totalStudents} học sinh</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="Cell"><Data ss:Type="String">Tỷ lệ nộp bài:</Data></Cell>
    <Cell ss:MergeAcross="${totalColumns - 11}" ss:StyleID="CellBoldCenter"><Data ss:Type="String">${data.statistics.submittedCount} HS (${data.statistics.submittedPercent}%)</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="CellBoldCenter"><Data ss:Type="String">•</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="Cell"><Data ss:Type="String">Mức Xuất sắc (9.0 - 10.0đ):</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="LevelXuatSac"><Data ss:Type="String">${data.statistics.gradeCount.xuatSac} HS (${data.statistics.gradePercent.xuatSac}%)</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="Cell"><Data ss:Type="String">Mức Tốt (7.5 - 8.9đ):</Data></Cell>
    <Cell ss:MergeAcross="${totalColumns - 11}" ss:StyleID="LevelTot"><Data ss:Type="String">${data.statistics.gradeCount.tot} HS (${data.statistics.gradePercent.tot}%)</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="CellBoldCenter"><Data ss:Type="String">•</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="Cell"><Data ss:Type="String">Mức Đạt (5.0 - 7.4đ):</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="LevelDat"><Data ss:Type="String">${data.statistics.gradeCount.dat} HS (${data.statistics.gradePercent.dat}%)</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="Cell"><Data ss:Type="String">Mức Chưa đạt (&lt; 5.0đ):</Data></Cell>
    <Cell ss:MergeAcross="${totalColumns - 11}" ss:StyleID="LevelChuaDat"><Data ss:Type="String">${data.statistics.gradeCount.chuaDat} HS (${data.statistics.gradePercent.chuaDat}%)</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:StyleID="CellBoldCenter"><Data ss:Type="String">•</Data></Cell>
    <Cell ss:MergeAcross="3" ss:StyleID="Cell"><Data ss:Type="String">Điểm trung bình cả lớp:</Data></Cell>
    <Cell ss:MergeAcross="${totalColumns - 5}" ss:StyleID="CellScore"><Data ss:Type="String">${data.statistics.averageScore !== null ? `${data.statistics.averageScore} / 10 điểm` : "Chưa có dữ liệu"}</Data></Cell>
   </Row>
   <Row ss:Height="25"/>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="4" ss:StyleID="CellCenter"><Data ss:Type="String">NGƯỜI LẬP BẢNG</Data></Cell>
    <Cell ss:MergeAcross="${totalColumns - 6}" ss:StyleID="CellCenter"><Data ss:Type="String">GIÁO VIÊN BỘ MÔN MĨ THUẬT</Data></Cell>
   </Row>
   <Row ss:Height="16">
    <Cell ss:MergeAcross="4" ss:StyleID="SubTitle"><Data ss:Type="String">(Ký và ghi rõ họ tên)</Data></Cell>
    <Cell ss:MergeAcross="${totalColumns - 6}" ss:StyleID="SubTitle"><Data ss:Type="String">(Ký và ghi rõ họ tên)</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  return xml;
}

/**
 * Sinh chuỗi CSV có kèm UTF-8 BOM để Excel / Google Sheets mở trực tiếp không lỗi font
 */
export function generateTopicGradeCsv(
  topic: Topic,
  classRoom: ClassRoom,
  students: Student[],
  artworks: Artwork[]
): string {
  const data = buildTopicGradeSummaryData(topic, classRoom, students, artworks);
  const rubricList = topic.rubric || [];

  const headers = [
    "STT",
    "Mã học sinh",
    "Họ và tên học sinh",
    "Trạng thái nộp bài",
    "Tên bài vẽ",
    ...rubricList.map((r) => `${r.name} (${r.weight}%)`),
    "Điểm số (Thang 10)",
    "Xếp loại GDPT 2018",
    "Nhận xét của Giáo viên",
    "Tự đánh giá",
    "Ngày nộp bài",
  ];

  const csvRows: string[] = [
    `"BẢNG ĐÁNH GIÁ & TỔNG HỢP ĐIỂM MĨ THUẬT THCS"`,
    `"Chủ đề bài học: ${topic.title.replace(/"/g, '""')}"`,
    `"Lớp: ${classRoom.name} (Khối ${classRoom.grade})","Ngày xuất: ${data.exportedAt}","Sĩ số: ${data.statistics.totalStudents} học sinh"`,
    "",
    headers.map(escapeCsv).join(","),
  ];

  data.rows.forEach((row) => {
    const rowValues = [
      row.stt,
      row.studentId,
      row.studentName,
      row.submissionStatus,
      row.artworkTitle,
      ...row.criteriaReviews.map((c) => c.level),
      row.score !== null ? row.score : "-",
      row.gradeLevel,
      row.teacherFeedback,
      row.selfReflection,
      row.submittedAt,
    ];
    csvRows.push(rowValues.map(escapeCsv).join(","));
  });

  // Thống kê cuối CSV
  csvRows.push("");
  csvRows.push(`"THỐNG KÊ KẾT QUẢ ĐÁNH GIÁ LỚP ${classRoom.name.toUpperCase()}"`);
  csvRows.push(`"Đã nộp bài: ${data.statistics.submittedCount}/${data.statistics.totalStudents} (${data.statistics.submittedPercent}%)"`);
  csvRows.push(
    `"Xuất sắc: ${data.statistics.gradeCount.xuatSac} HS (${data.statistics.gradePercent.xuatSac}%)","Tốt: ${data.statistics.gradeCount.tot} HS (${data.statistics.gradePercent.tot}%)","Đạt: ${data.statistics.gradeCount.dat} HS (${data.statistics.gradePercent.dat}%)","Chưa đạt: ${data.statistics.gradeCount.chuaDat} HS (${data.statistics.gradePercent.chuaDat}%)"`
  );
  csvRows.push(
    `"Điểm trung bình cả lớp: ${data.statistics.averageScore !== null ? `${data.statistics.averageScore}/10` : "Chưa có"}"`
  );

  // Thêm UTF-8 BOM (\uFEFF) ở đầu chuỗi
  return "\uFEFF" + csvRows.join("\r\n");
}

/**
 * Tải về máy file bảng điểm tổng hợp (Excel .xls hoặc CSV .csv)
 */
export function downloadTopicGradeFile(
  topic: Topic,
  classRoom: ClassRoom,
  students: Student[],
  artworks: Artwork[],
  format: "xls" | "csv" = "xls"
): void {
  const sanitize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 30);

  const classNameClean = sanitize(classRoom.name || "Lop");
  const topicTitleClean = sanitize(topic.title || "ChuDe");
  const filename = `Bang_Diem_Mi_Thuat_${classNameClean}_${topicTitleClean}.${format}`;

  let content: string;
  let mimeType: string;

  if (format === "csv") {
    content = generateTopicGradeCsv(topic, classRoom, students, artworks);
    mimeType = "text/csv;charset=utf-8;";
  } else {
    content = generateTopicGradeExcelXml(topic, classRoom, students, artworks);
    mimeType = "application/vnd.ms-excel;charset=utf-8;";
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

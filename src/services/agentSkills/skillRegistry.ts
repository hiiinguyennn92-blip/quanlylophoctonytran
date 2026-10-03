import type {
  AgentSkillDefinition,
  RoutedSkillInfo,
  SkillMatchResult,
  SkillRouteId,
} from './skillTypes.ts';

export const SKILL_DEFINITIONS: Record<SkillRouteId, AgentSkillDefinition> = {
  early_warning: {
    id: 'early_warning',
    name: 'Can Thiệp Sớm & An Toàn Học Đường',
    badge: 'Skill An Toàn & Bảo Vệ Trẻ',
    category: 'safety',
    iconName: 'AlertTriangle',
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    description: 'Phát hiện học sinh vắng học bất thường, suy giảm động lực và đề xuất can thiệp nhân văn.',
    samplePrompt: 'Hãy rà soát danh sách học sinh có tín hiệu cần quan tâm và đề xuất biện pháp can thiệp sớm cho từng em.',
    capabilities: [
      'Phân tích chuyên cần & cảnh báo vắng',
      'Đánh giá nguy cơ học đường',
      'Kế hoạch can thiệp 1-1 nhân văn',
      'Bảo mật dữ liệu nhạy cảm của trẻ',
    ],
    actionType: 'Tạo nhiệm vụ can thiệp',
    modelUsed: 'gemini-3.8-flash',
    directiveSummary: 'Nhận diện nguy cơ vắng học, suy giảm học lực và kế hoạch kèm cặp bảo mật.',
    triggers: [
      {
        keywords: [
          'vắng',
          'nghỉ học',
          'đi trễ',
          'chuyên cần',
          'can thiệp',
          'nguy cơ',
          'tín hiệu',
          'sa sút',
          'nghỉ nhiều',
          'vắng không phép',
          'bỏ tiết',
          'chú ý',
        ],
        weight: 1.5,
        negativeKeywords: ['vẽ', 'ảnh', 'hình ảnh', 'poster', 'tiết sinh hoạt', 'thi đua'],
      },
    ],
    systemDirective: `
CHỈ THỊ KỸ NĂNG: CAN THIỆP SỚM & CHUYÊN CẦN (HỆ THỐNG AN TOÀN HỌC ĐƯỜNG)
- Phân tích nguyên nhân tiềm ẩn đằng sau các buổi vắng hoặc sụt giảm tương tác (sức khỏe, tâm lý, gia đình).
- Đề xuất kế hoạch can thiệp 3 bước kín đáo, nhân văn: (1) Lắng nghe 1-1, (2) Đôi bạn cùng tiến giúp đỡ, (3) Phối hợp phụ huynh tế nhị.
- Tuyệt đối không quy kết học sinh "cá biệt" hay "lười học".
- Xuất actionCard type "task_create" với payload có studentId, title nhiệm vụ và mô tả rõ ràng để giáo viên lưu vào hệ thống chỉ với 1 click.
`,
    createContextualPrompt: (student, defaultPrompt) => {
      if (student) {
        return `Em hãy phân tích hồ sơ, chuyên cần và các điểm cần quan tâm của học sinh ${student.fullName} và gợi ý giải pháp sư phạm kèm cặp cụ thể.`;
      }
      return defaultPrompt;
    },
  },

  circular_27: {
    id: 'circular_27',
    name: 'Đánh Giá Khung Năng Lực TT27',
    badge: 'Skill Sư Phạm Chuẩn BGD',
    category: 'pedagogical',
    iconName: 'Award',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Tư vấn nhận xét học bạ, 3 năng lực chung, 7 năng lực đặc thù và 5 phẩm chất theo mô hình Can-Need-Action.',
    samplePrompt: 'Gợi ý cách nhận xét phẩm chất Chăm chỉ và Năng lực Tự chủ cho học sinh còn rụt rè, chưa mạnh dạn phát biểu.',
    capabilities: [
      'Mô hình 3 thành tố Can-Need-Action',
      'Chuẩn hóa Thông tư 27/2020/TT-BGDĐT',
      '3 Năng lực cốt lõi & 7 Năng lực đặc thù',
      '5 Phẩm chất chủ yếu của học sinh tiểu học',
    ],
    actionType: 'Lưu vào sổ đánh giá',
    modelUsed: 'gemini-3.8-flash',
    directiveSummary: 'Khung 3 năng lực chung, 7 đặc thù, 5 phẩm chất theo mô hình Can-Need-Action.',
    triggers: [
      {
        keywords: [
          'nhận xét',
          'học bạ',
          'thông tư 27',
          'tt27',
          'năng lực',
          'phẩm chất',
          'đánh giá',
          'xếp loại',
          'hoàn thành tốt',
          'chưa hoàn thành',
          'can-need-action',
          'khen ngợi',
          'sổ điểm',
        ],
        weight: 1.5,
        negativeKeywords: ['vẽ hình', 'chỗ ngồi', 'bàn ghế', 'sơ đồ lớp'],
      },
    ],
    systemDirective: `
CHỈ THỊ KỸ NĂNG: ĐÁNH GIÁ KHUNG NĂNG LỰC & PHẨM CHẤT THEO THÔNG TƯ 27/2020/TT-BGDĐT
- Tuyệt đối không phán xét, không gán nhãn tiêu cực (không dùng từ "kém", "lười").
- Cấu trúc nhận xét bắt buộc theo công thức Can-Need-Action (3 thành tố):
  (1) CAN: Ghi nhận em đã làm được gì cụ thể (sự tiến bộ, nỗ lực).
  (2) NEED: Điểm em cần hoàn thiện thêm (vùng phát triển gần).
  (3) ACTION: Biện pháp hoặc hành động cụ thể mà giáo viên và gia đình cần phối hợp giúp em.
- Xuất actionCard type "assessment_input" với criteria, level gợi ý (Tốt / Đạt / Cần cố gắng) và teacherComment chuẩn mực.
`,
    createContextualPrompt: (student, defaultPrompt) => {
      if (student) {
        return `Gợi ý lời nhận xét học kỳ theo Thông tư 27 cho học sinh ${student.fullName} dựa trên năng lực, điểm mạnh và vùng phát triển gần của em.`;
      }
      return defaultPrompt;
    },
  },

  classroom_dynamics: {
    id: 'classroom_dynamics',
    name: 'Tối Ưu Sơ Đồ & Thị Lực',
    badge: 'Skill Bố Trí Không Gian',
    category: 'spatial',
    iconName: 'Eye',
    color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    description: 'Tư vấn bố trí vị trí ngồi cho học sinh cận thị, thấp bé, ghép đôi bạn cùng tiến giúp đỡ nhau.',
    samplePrompt: 'Lớp có các bạn mắt cận thị và bạn hay nói chuyện riêng, em nên tư vấn bố trí sơ đồ bàn ghế như thế nào?',
    capabilities: [
      'Ưu tiên thị lực & tật khúc xạ (cận thị)',
      'Công thái học chiều cao học sinh',
      'Kỹ thuật đôi bạn cùng tiến',
      'Cân bằng trật tự và giảm nói chuyện riêng',
    ],
    actionType: 'Mở sơ đồ lớp học',
    modelUsed: 'gemini-3.8-flash',
    directiveSummary: 'Bố trí chỗ ngồi theo thị lực (cận thị), chiều cao và đôi bạn cùng tiến.',
    triggers: [
      {
        keywords: [
          'chỗ ngồi',
          'sơ đồ',
          'bàn ghế',
          'cận thị',
          'thấp bé',
          'ghép đôi',
          'cùng tiến',
          'ngồi đầu bàn',
          'cuối lớp',
          'dãy giữa',
          'thị lực',
          'đổi chỗ',
        ],
        weight: 1.5,
        negativeKeywords: ['vẽ tranh', 'tin nhắn zalo', 'báo giảng'],
      },
    ],
    systemDirective: `
CHỈ THỊ KỸ NĂNG: TỐI ƯU SƠ ĐỒ CHỖ NGỒI & THỊ LỰC HỌC ĐƯỜNG
- Ưu tiên 1: Thị lực (học sinh cận thị xếp 2 bàn đầu ở 2 dãy giữa, tránh ánh sáng lóa cửa sổ).
- Ưu tiên 2: Chiều cao học sinh (thấp ngồi trước, cao ngồi sau).
- Ưu tiên 3: Tâm lý sư phạm - ghép đôi bạn cùng tiến (1 bạn có khả năng tập trung tốt ngồi cùng bạn còn rụt rè/hay mất tập trung).
- Xuất actionCard type "seating_view" với gợi ý sắp xếp vị trí bàn ghế cụ thể.
`,
    createContextualPrompt: (student, defaultPrompt) => {
      if (student) {
        return `Tư vấn vị trí ngồi phù hợp nhất trong lớp cho em ${student.fullName} để tăng khả năng tương tác và tập trung học tập.`;
      }
      return defaultPrompt;
    },
  },

  parent_bridge: {
    id: 'parent_bridge',
    name: 'Cầu Nối Phụ Huynh & Zalo',
    badge: 'Skill Ứng Xử Sư Phạm',
    category: 'communication',
    iconName: 'Heart',
    color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    description: 'Soạn tin nhắn Zalo gửi phụ huynh tinh tế, ấm áp, kêu gọi sự đồng hành chân thành từ gia đình.',
    samplePrompt: 'Soạn tin nhắn gửi mẹ bạn Đức Anh nhắc chuẩn bị đồ dùng môn Mỹ thuật và khen ngợi con có nhiều tiến bộ.',
    capabilities: [
      'Văn phong ứng xử sư phạm nhân văn',
      'Định dạng tối ưu gửi nhanh qua Zalo/SMS',
      'Cấu trúc 3 bước: Khen - Góp ý - Đồng hành',
      'Xử lý tình huống phụ huynh nhạy cảm',
    ],
    actionType: 'Soạn gửi Zalo',
    modelUsed: 'gemini-3.8-flash',
    directiveSummary: 'Soạn tin nhắn Zalo 3 phần: Ghi nhận tích cực -> Trao đổi nhẹ nhàng -> Kêu gọi đồng hành.',
    triggers: [
      {
        keywords: [
          'phụ huynh',
          'zalo',
          'tin nhắn',
          'gửi mẹ',
          'gửi bố',
          'thông báo phụ huynh',
          'gọi điện',
          'sổ liên lạc',
          'nhắc nhở phụ huynh',
          'trao đổi gia đình',
        ],
        weight: 1.6,
        negativeKeywords: ['vẽ ảnh', 'sơ đồ lớp'],
      },
    ],
    systemDirective: `
CHỈ THỊ KỸ NĂNG: CẦU NỐI PHỤ HUYNH & ZALO SƯ PHẠM
- Soạn tin nhắn mẫu gửi phụ huynh hoàn chỉnh, ấm áp, văn phong chuẩn mực sư phạm.
- Cấu trúc 3 phần: (1) Khen ngợi điểm tích cực gần nhất của con, (2) Chia sẻ chân thành vấn đề cần lưu ý, (3) Lời mời đồng hành và lời chúc gia đình.
- Xuất actionCard type "zalo_message" với payload chứa recipientName, phone và message sẵn sàng sao chép gửi ngay.
`,
    createContextualPrompt: (student, defaultPrompt) => {
      if (student) {
        return `Soạn tin nhắn Zalo gửi tới phụ huynh em ${student.fullName} trao đổi tế nhị, ấm áp về tình hình học tập và động viên em rèn luyện.`;
      }
      return defaultPrompt;
    },
  },

  lesson_schedule: {
    id: 'lesson_schedule',
    name: 'Kế Hoạch Sinh Hoạt & Báo Giảng',
    badge: 'Skill Điều Phối Học Đường',
    category: 'schedule',
    iconName: 'Calendar',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    description: 'Thiết kế tiến trình tiết sinh hoạt lớp 35 phút, xây dựng trò chơi giáo dục và điều phối kế hoạch tuần.',
    samplePrompt: 'Thiết kế tiến trình tiết sinh hoạt lớp tuần 12 với chủ đề Biết ơn thầy cô và trò chơi gắn kết tập thể.',
    capabilities: [
      'Khung thời lượng 35 phút chuẩn mực',
      'Trò chơi sinh hoạt lớp sáng tạo',
      'Kế hoạch báo giảng & thời khóa biểu',
      'Lời phát biểu truyền cảm hứng của giáo viên',
    ],
    actionType: 'Xem kế hoạch tuần',
    modelUsed: 'gemini-3.8-flash',
    directiveSummary: 'Thiết kế tiến trình 35 phút tiết sinh hoạt lớp và điều phối lịch dạy.',
    triggers: [
      {
        keywords: [
          'sinh hoạt lớp',
          'tiết sinh hoạt',
          'kế hoạch tuần',
          'báo giảng',
          'thời khóa biểu',
          'tiết học',
          'trò chơi',
          'chủ đề tuần',
          'lịch dạy',
          'hoạt động tập thể',
        ],
        weight: 1.4,
        negativeKeywords: ['vẽ ảnh', 'cận thị', 'zalo'],
      },
    ],
    systemDirective: `
CHỈ THỊ KỸ NĂNG: KẾ HOẠCH TIẾT SINH HOẠT LỚP & ĐIỀU PHỐI LỊCH DẠY
- Kịch bản tiết sinh hoạt lớp 35 phút chuẩn cấu trúc:
  + Phần 1 (10 phút): Ban cán sự tổng kết nhẹ nhàng, tuyên dương các bạn nỗ lực.
  + Phần 2 (15 phút): Trò chơi gắn kết tập thể hoặc diễn đàn chia sẻ chủ đề tuần.
  + Phần 3 (10 phút): Thầy/Cô truyền cảm hứng và phổ biến phương hướng tuần mới.
- Xuất actionCard type "schedule_view" với tóm tắt tiến trình và link nhanh đến kế hoạch.
`,
    createContextualPrompt: (student, defaultPrompt) => {
      if (student) {
        return `Gợi ý hoạt động gắn kết hoặc phân công nhiệm vụ trong tiết sinh hoạt lớp để khuyến khích em ${student.fullName} tự tin hơn.`;
      }
      return defaultPrompt;
    },
  },

  image_design: {
    id: 'image_design',
    name: 'Nhà Thiết Kế Hình Ảnh Học Đường AI',
    badge: 'Google Nano Banana 2 (gemini-3.1-flash-image)',
    category: 'creative',
    iconName: 'Palette',
    color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    description: 'Biên dịch yêu cầu giáo viên thành Prompt cấu trúc 8 khối cho Google Nano Banana 2 & GPT Image.',
    samplePrompt: 'Thiết kế poster tuyên dương đôi bạn cùng tiến môn Toán cho góc học tập lớp 3A1 phong cách hoạt hình ấm áp.',
    capabilities: [
      'Cấu trúc Prompt 8 Khối Master Blueprint',
      'Định tuyến Google Nano Banana 2 / GPT Image',
      'Khóa chữ tiếng Việt có dấu chính xác',
      'Chuẩn tỷ lệ học đường: 16:9, 4:3, 1:1, 9:16',
    ],
    actionType: 'Mở Xưởng Vẽ AI',
    modelUsed: 'gemini-3.1-flash-image',
    directiveSummary: 'Sinh cấu trúc Prompt 8 khối cho poster, infographic, giấy khen học đường.',
    triggers: [
      {
        keywords: [
          'ảnh',
          'hình ảnh',
          'vẽ',
          'poster',
          'thiết kế',
          'infographic',
          'giấy khen',
          'banner',
          'truyện tranh',
          'scrapbook',
          'flashcard',
          'prompt vẽ',
          'bức tranh',
          'xưởng vẽ',
          'minh họa',
        ],
        weight: 2.0,
      },
    ],
    systemDirective: `
CHỈ THỊ KỸ NĂNG: NHÀ THIẾT KẾ HÌNH ẢNH HỌC ĐƯỜNG AI (Google Nano Banana 2 - gemini-3.1-flash-image)
- Đóng vai Master Visual Designer trường học Việt Nam.
- Bắt buộc phải cung cấp một "imagePromptBlueprint" theo đúng CẤU TRÚC 8 KHỐI CHUẨN MỰC (8-BLOCK ARCHITECTURE):
  [BLOCK 1: HỆ ĐIỀU HÀNH & MỤC TIÊU (SYSTEM TARGET & DIRECTIVE)]
  [BLOCK 2: CHỦ THỂ & BẢN SẮC VĂN HÓA TIỂU HỌC VIỆT NAM (SUBJECT & CULTURAL CONTEXT)]
  [BLOCK 3: PHONG CÁCH NGHỆ THUẬT & CHẤT LIỆU (ARTISTIC STYLE & MEDIUM)]
  [BLOCK 4: BỐ CỤC, THỨ TỰ QUAN SÁT & VÙNG AN TOÀN CHỮ (COMPOSITION, READING ORDER & NEGATIVE SPACE)]
  [BLOCK 5: ÁNH SÁNG & BẢNG MÀU SƯ PHẠM (LIGHTING & COLOR HARMONY)]
  [BLOCK 6: QUY CHUẨN KHÓA CHỮ TIẾNG VIỆT CÓ DẤU (EXACT VIETNAMESE TYPOGRAPHY)]
  [BLOCK 7: BỘ LỌC CẤM & GIỚI HẠN AN TOÀN (NEGATIVE CONSTRAINTS & SANITIZER)]
  [BLOCK 8: ĐỘ PHÂN GIẢI & TIÊU CHUẨN XUẤT BẢN (RESOLUTION & PRODUCTION FIDELITY)]
- Đồng thời cung cấp actionCard type "image_design" với payload chi tiết để giáo viên có thể mở trực tiếp Xưởng Vẽ AI.
`,
    createContextualPrompt: (student, defaultPrompt) => {
      if (student) {
        return `Thiết kế một tấm giấy khen hoặc poster tuyên dương thành tích tiến bộ vượt bậc cho em ${student.fullName}.`;
      }
      return defaultPrompt;
    },
  },

  student_journal_analyzer: {
    id: 'student_journal_analyzer',
    name: 'Phân Tích Nhật Ký & Tiến Bộ Học Sinh',
    badge: 'Skill Quan Sát Sư Phạm',
    category: 'analysis',
    iconName: 'Compass',
    color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    description: 'Tổng hợp ghi chép nhật ký chủ nhiệm, nhận diện xu hướng hành vi và chuyển biến tích cực theo thời gian.',
    samplePrompt: 'Hãy rà soát nhật ký lớp 2 tuần gần nhất và tổng hợp những chuyển biến tâm lý của học sinh.',
    capabilities: [
      'Tổng hợp chuỗi nhật ký theo thời gian',
      'Nhận diện xu hướng cảm xúc & hành vi',
      'Đề xuất biện pháp động viên kịp thời',
      'Hỗ trợ ghi học bạ thực chất',
    ],
    actionType: 'Xem nhật ký lớp',
    modelUsed: 'gemini-3.8-flash',
    directiveSummary: 'Tổng hợp nhật ký chủ nhiệm, phân tích chuyển biến tâm lý và tiến bộ học sinh.',
    triggers: [
      {
        keywords: [
          'nhật ký',
          'ghi chép',
          'tiến bộ',
          'chuyển biến',
          'hành vi',
          'quan sát',
          'theo dõi',
          'tâm lý',
          'cảm xúc',
        ],
        weight: 1.3,
        negativeKeywords: ['vẽ ảnh', 'sơ đồ lớp', 'sinh hoạt lớp'],
      },
    ],
    systemDirective: `
CHỈ THỊ KỸ NĂNG: PHÂN TÍCH NHẬT KÝ & TIẾN BỘ HỌC SINH
- Rà soát các ghi chép nhật ký chủ nhiệm, liên kết với dữ liệu chuyên cần và học tập.
- Chỉ ra 2-3 điểm sáng về sự nỗ lực vượt bậc của học sinh so với chính bản thân trước đây.
- Xuất actionCard type "journal_record" với tóm tắt quan sát.
`,
    createContextualPrompt: (student, defaultPrompt) => {
      if (student) {
        return `Rà soát các quan sát nhật ký về em ${student.fullName} và phân tích sự tiến bộ của em trong giai đoạn vừa qua.`;
      }
      return defaultPrompt;
    },
  },

  general: {
    id: 'general',
    name: 'Trợ Lý Chủ Nhiệm Toàn Diện',
    badge: 'Multi-Agent Router (GDPT 2018)',
    category: 'pedagogical',
    iconName: 'Bot',
    color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    description: 'Điều phối đa năng lực sư phạm, giải đáp nghiệp vụ chủ nhiệm và quản lý lớp học tiểu học.',
    samplePrompt: 'Thầy/Cô cần hỗ trợ gì về quản lý lớp học, học sinh hoặc trao đổi phụ huynh hôm nay?',
    capabilities: [
      'Điều phối đa kỹ năng',
      'Giải đáp Thông tư & Quy định BGD',
      'Tư vấn tình huống sư phạm thực tế',
      'Hỗ trợ toàn diện công tác chủ nhiệm',
    ],
    actionType: 'Hỗ trợ nghiệp vụ',
    modelUsed: 'gemini-3.8-flash',
    directiveSummary: 'Điều phối đa năng lực sư phạm và quản lý lớp học.',
    triggers: [],
    systemDirective: `
Bạn là AI Agent Chuyên Gia Sư Phạm Tiểu Học Việt Nam, hỗ trợ Giáo viên Chủ nhiệm toàn diện.
`,
    createContextualPrompt: (_student, defaultPrompt) => defaultPrompt,
  },
};

/**
 * Thuật toán Semantic Intent Matching đa chiều với trọng số và bộ lọc loại trừ
 */
export function scoreSkillMatch(skill: AgentSkillDefinition, query: string): SkillMatchResult {
  const q = query.toLowerCase().trim();
  let totalScore = 0;
  const matchedKeywords: string[] = [];

  for (const rule of skill.triggers) {
    // 1. Kiểm tra từ khóa loại trừ
    if (rule.negativeKeywords) {
      for (const neg of rule.negativeKeywords) {
        if (q.includes(neg.toLowerCase())) {
          totalScore -= 2.0; // Phạt nặng nếu chứa từ khóa đối lập
        }
      }
    }

    // 2. Kiểm tra cụm từ chính xác (Exact phrase bonus)
    if (rule.exactPhrases) {
      for (const phrase of rule.exactPhrases) {
        if (q.includes(phrase.toLowerCase())) {
          totalScore += rule.weight * 2.5;
          matchedKeywords.push(phrase);
        }
      }
    }

    // 3. Khớp từ khóa
    for (const kw of rule.keywords) {
      const lowerKw = kw.toLowerCase();
      if (q.includes(lowerKw)) {
        totalScore += rule.weight;
        matchedKeywords.push(kw);
      }
    }
  }

  return {
    skill,
    score: Math.max(0, totalScore),
    matchedKeywords,
    reason: matchedKeywords.length > 0 ? `Khớp: ${matchedKeywords.slice(0, 3).join(', ')}` : 'Không khớp trực tiếp',
  };
}

/**
 * Định tuyến Kỹ năng (Skill Router) chuẩn mực:
 * 1. Ưu tiên lựa chọn tường minh của người dùng (Explicit User Override)
 * 2. Sử dụng thuật toán Semantic Intent Matching với ngưỡng tin cậy
 * 3. Fallback mượt mà về General Assistant nếu không đủ tin cậy
 */
export function resolveSkillRoute(query: string, requestedSkillRoute?: string): RoutedSkillInfo {
  // 1. Nếu người dùng chọn rõ ràng từ thanh Skill Bar, ưu tiên tuyệt đối
  if (requestedSkillRoute && requestedSkillRoute !== 'auto') {
    const directSkill = SKILL_DEFINITIONS[requestedSkillRoute as SkillRouteId];
    if (directSkill) {
      return {
        id: directSkill.id,
        name: directSkill.name,
        badge: directSkill.badge,
        modelUsed: directSkill.modelUsed,
        directiveSummary: directSkill.directiveSummary,
      };
    }
    // Mapping alias nếu có
    if (requestedSkillRoute === 'ai_image_design') {
      const imgSkill = SKILL_DEFINITIONS.image_design;
      return {
        id: imgSkill.id,
        name: imgSkill.name,
        badge: imgSkill.badge,
        modelUsed: imgSkill.modelUsed,
        directiveSummary: imgSkill.directiveSummary,
      };
    }
  }

  // 2. Chấm điểm từng skill có sẵn
  const candidates: SkillMatchResult[] = [];
  const skillsToEvaluate: SkillRouteId[] = [
    'image_design',
    'circular_27',
    'early_warning',
    'classroom_dynamics',
    'parent_bridge',
    'lesson_schedule',
    'student_journal_analyzer',
  ];

  for (const skillId of skillsToEvaluate) {
    const def = SKILL_DEFINITIONS[skillId];
    if (def) {
      const result = scoreSkillMatch(def, query);
      if (result.score > 0) {
        candidates.push(result);
      }
    }
  }

  // Sắp xếp theo điểm giảm dần
  candidates.sort((a, b) => b.score - a.score);

  // Nếu điểm cao nhất vượt ngưỡng tin cậy (threshold >= 1.0)
  if (candidates.length > 0 && candidates[0].score >= 1.0) {
    const best = candidates[0].skill;
    return {
      id: best.id,
      name: best.name,
      badge: best.badge,
      modelUsed: best.modelUsed,
      directiveSummary: best.directiveSummary,
    };
  }

  // 3. Fallback sang General Assistant
  const generalSkill = SKILL_DEFINITIONS.general;
  return {
    id: generalSkill.id,
    name: generalSkill.name,
    badge: generalSkill.badge,
    modelUsed: generalSkill.modelUsed,
    directiveSummary: generalSkill.directiveSummary,
  };
}

export function getSkillDefinition(id: SkillRouteId): AgentSkillDefinition {
  return SKILL_DEFINITIONS[id] || SKILL_DEFINITIONS.general;
}

export function getAllSkillManifests(): AgentSkillDefinition[] {
  return Object.values(SKILL_DEFINITIONS).filter((s) => s.id !== 'general');
}

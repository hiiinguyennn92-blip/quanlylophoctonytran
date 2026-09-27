import { StylePresetMetadata, StylePresetId } from './types';

export const STYLE_PRESETS: Record<StylePresetId, StylePresetMetadata> = {
  community_safety_editorial: {
    id: 'community_safety_editorial',
    nameVi: 'Poster Cộng đồng – Thông tin An toàn',
    shortDescVi: 'Minh họa phẳng sạch, bố cục bất đối xứng, checklist an toàn rõ ràng, con người & trường học Việt Nam.',
    categories: ['education', 'poster', 'all'],
    artStyle: 'Clean Flat Editorial Illustration',
    aspectRatios: ['3:4', '1:1', '4:3', '16:9'],
    defaultAspectRatio: '3:4',
    suitableFor: [
      'Phòng chống nắng nóng & sốc nhiệt',
      'An toàn giao thông cổng trường',
      'Vệ sinh cá nhân & rửa tay 6 bước',
      'Phòng chống sốt xuất huyết & dịch bệnh',
      'An toàn trường học & nề nếp lớp',
      'Kỹ năng phòng cháy chữa cháy',
      'Sơ cứu cơ bản học đường',
      'Phòng chống đuối nước mùa hè',
      'An toàn vệ sinh thực phẩm bán trú',
      'Sức khỏe cộng đồng học sinh',
    ],
    colorPaletteDefault: ['#047857', '#0284c7', '#f59e0b', '#f8fafc'],
  },

  youth_promo_mixed_media: {
    id: 'youth_promo_mixed_media',
    nameVi: 'Poster Quảng bá Trẻ trung – Mixed Media',
    shortDescVi: 'Năng lượng cao, chân dung cutout ảnh thật, viền graphic dày, typography ấn tượng, doodle & sticker vui nhộn.',
    categories: ['event', 'poster', 'all'],
    artStyle: 'High-energy Mixed Media Commercial Collage',
    aspectRatios: ['3:4', '9:16', '1:1'],
    defaultAspectRatio: '3:4',
    suitableFor: [
      'Ngày hội thiếu nhi & Ngày hội trường học',
      'Câu lạc bộ Tiếng Anh, STEM, Mỹ thuật, Thể thao',
      'Sự kiện văn nghệ, Hội thi Giai điệu Tuổi hồng',
      'Hoạt động trải nghiệm & Kỹ năng sống',
      'Workshop sáng tạo & Hội chợ sách trường học',
      'Chương trình ngoại khóa, cắm trại dã ngoại',
      'Chiến dịch nụ cười học đường, Đôi bạn cùng tiến',
    ],
    colorPaletteDefault: ['#1e293b', '#22c55e', '#eab308', '#a855f7', '#ef4444'],
  },

  three_panel_story_collage: {
    id: 'three_panel_story_collage',
    nameVi: 'Poster Collage Kể chuyện 3 phần',
    shortDescVi: 'Bố cục 3 khung kể chuyện tuần tự, giữ đồng nhất nhân vật, biểu cảm tự nhiên, bối cảnh lớp học & gia đình.',
    categories: ['storytelling', 'education', 'all'],
    artStyle: 'Sequential 3-Panel Editorial Story Collage',
    aspectRatios: ['16:9', '4:3', '1:1'],
    defaultAspectRatio: '16:9',
    suitableFor: [
      'Hành trình 1 ngày ở trường của bé',
      'Câu chuyện bạn giúp bạn vượt khó',
      'Quy trình học tập & sinh hoạt nề nếp',
      'Bài học đạo đức & gương người tốt việc tốt',
      'Nhật ký thực hành chăm sóc cây xanh',
      'Trước - Trong - Sau buổi hoạt động trải nghiệm',
    ],
    colorPaletteDefault: ['#3b82f6', '#10b981', '#f59e0b', '#ffffff'],
  },

  botanical_scrapbook: {
    id: 'botanical_scrapbook',
    nameVi: 'Sổ tay Thực vật – Scrapbook Thủ công',
    shortDescVi: 'Nghệ thuật sổ tay thực vật thủ công: sáp màu oil pastel, giấy xé, washi tape, 2 vùng chữ máy đánh & chữ tay mềm mại.',
    categories: ['science', 'nature', 'scrapbook', 'all'],
    artStyle: 'Handcrafted Botanical Art Journal',
    aspectRatios: ['3:4', '1:1', '4:3'],
    defaultAspectRatio: '3:4',
    suitableFor: [
      'Tìm hiểu cây hoa sân trường (hoa phượng, bàng, sen...)',
      'Góc thiên nhiên & cây quả nhiệt đới Việt Nam',
      'Nhật ký quan sát hạt nảy mầm môn Tự nhiên & Xã hội',
      'Dự án STEM làm tiêu bản lá & vườn thuốc nam',
      'Học liệu sinh thái & bảo vệ môi trường xanh',
    ],
    colorPaletteDefault: ['#2e7d32', '#d97706', '#be185d', '#fdfbf7'],
  },

  minimal_geographic_editorial: {
    id: 'minimal_geographic_editorial',
    nameVi: 'Minh họa Địa danh Tối giản',
    shortDescVi: 'Phong cách tối giản Bắc Âu + biên tập Nhật Bản + tâm hồn văn hóa Việt Nam: silhouette địa danh, micro vignette tinh tế.',
    categories: ['geography', 'culture', 'education', 'all'],
    artStyle: 'Scandinavian Minimalism + Japanese Editorial + Vietnamese Sensibility',
    aspectRatios: ['3:4', '1:1', '4:3', '16:9'],
    defaultAspectRatio: '3:4',
    suitableFor: [
      'Poster bài học Lịch sử & Địa lí tiểu học',
      'Minh họa danh lam thắng cảnh quê hương Việt Nam',
      'Khám phá di sản văn hóa (Hà Nội, Huế, Hội An, Tây Nguyên...)',
      'Dự án Em yêu quê hương & Lễ hội truyền thống',
      'Bản đồ nghệ thuật tỉnh/thành phố',
    ],
    colorPaletteDefault: ['#0f172a', '#0284c7', '#d97706', '#f8fafc'],
  },
};

export const STYLE_PRESET_LIST: StylePresetMetadata[] = Object.values(STYLE_PRESETS);

export const STYLE_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Tất cả phong cách' },
  { id: 'education', label: 'Giáo dục & An toàn' },
  { id: 'poster', label: 'Poster truyền thông' },
  { id: 'storytelling', label: 'Kể chuyện 3 phần' },
  { id: 'event', label: 'Sự kiện & Phong trào' },
  { id: 'science', label: 'Khoa học & STEM' },
  { id: 'nature', label: 'Thiên nhiên & Thực vật' },
  { id: 'culture', label: 'Văn hóa & Di sản' },
  { id: 'geography', label: 'Địa lí & Quê hương' },
  { id: 'scrapbook', label: 'Sổ tay Scrapbook' },
];

/**
 * Mẫu dữ liệu ban đầu cho từng Style để giáo viên bắt đầu tức thì
 */
export const DEFAULT_STYLE_INPUTS = {
  community_safety_editorial: {
    sceneSubject: 'Phòng chống nắng nóng & đuối nước mùa hè',
    mainMessage: 'Uống đủ nước, đội mũ nón và không bơi lội ở nơi nước sâu nguy hiểm',
    safetyActions: [
      'Đội mũ rộng vành khi ra sân trường',
      'Uống đủ nước sạch mỗi ngày',
      'Chỉ bơi lội khi có người lớn đi cùng',
      'Mặc áo phao đúng quy cách',
    ],
    environment: 'Sân trường tiểu học Việt Nam có hàng cây râm mát và sân bóng',
    mainCharacter: 'Em học sinh tiểu học Việt Nam ngoan ngoãn đeo khăn quàng đỏ',
    foregroundObjects: ['Bình nước cá nhân', 'Mũ vải đồng phục', 'Phao bơi an toàn'],
    supportingIcons: ['Biểu tượng giọt nước', 'Mặt trời đội nón', 'Dấu tích xanh an toàn'],
    primaryColor: '#059669',
    secondaryColor: '#0284c7',
  },

  youth_promo_mixed_media: {
    subjectIdentity: 'Nhóm học sinh tiểu học năng động, vui tươi tham gia câu lạc bộ sáng tạo',
    subjectPose: 'Đang giơ tay hào hứng, cầm sản phẩm thủ công và nở nụ cười rạng rỡ',
    wardrobe: 'Đồng phục học sinh tiểu học Việt Nam năng động, khăn quàng đỏ',
    deviceOrObject: 'Kính thực tế ảo mini, bảng vẽ hoặc mô hình tên lửa nước',
    headlineLine1: 'NGÀY HỘI SÁNG TẠO TUỔI THƠ',
    headlineLine2: 'KHÁM PHÁ THẾ GIỚI CÙNG BẠN BÈ',
    campaignLabel: 'LỚP CHỦ NHIỆM 4.0 · THIẾU NHI TỰ HÀO',
    footerMainText: 'Thời gian: 8:00 sáng Thứ Bảy tuần này tại Sân trường',
    footerSecondaryText: 'Đăng ký cùng Ban chỉ huy Chi đội hoặc Thầy/Cô Chủ nhiệm',
    backgroundWord: 'SÁNG TẠO & VUI HỌC',
    backgroundColor: '#0f172a',
    contourColor: '#22c55e',
    headlineAccentColor: '#facc15',
    stickerColor: '#ec4899',
    doodleColors: ['#38bdf8', '#facc15', '#ffffff'],
  },

  three_panel_story_collage: {
    storyTitle: 'Đôi Bạn Cùng Tiến Trong Giờ Học Toán',
    storyTheme: 'Học sinh giúp đỡ nhau vượt qua bài tập khó, cùng tiến bộ trong học tập',
    characterDescription: 'Hai bạn học sinh lớp 3: bạn An chăm chỉ và bạn Khang tiến bộ',
    panels: [
      {
        panelNumber: 1,
        panelTitle: 'Khởi đầu: Bài toán khó',
        actionDescription: 'Bạn Khang ngồi suy nghĩ bên bàn học, cảm thấy bỡ ngỡ với phép tính nhân',
        settingOrTime: 'Đầu giờ truy bài trong lớp học tiểu học sáng sớm',
        speechOrCaption: 'Bài này khó quá, làm sao đây nhỉ?',
      },
      {
        panelNumber: 2,
        panelTitle: 'Đồng hành: Bạn bè sẻ chia',
        actionDescription: 'Bạn An mỉm cười ngồi cạnh, tận tình chỉ vào vở hướng dẫn bạn từng bước',
        settingOrTime: 'Giờ học nhóm 15 phút đầu giờ',
        speechOrCaption: 'Cậu thử tách phép tính này ra xem, dễ hiểu lắm!',
      },
      {
        panelNumber: 3,
        panelTitle: 'Thành quả: Nụ cười rạng rỡ',
        actionDescription: 'Cả hai bạn cùng giơ bài làm hoàn thành đúng, được cô giáo khen ngợi và thưởng sao hoa điểm tốt',
        settingOrTime: 'Cuối tiết học toán vui tươi',
        speechOrCaption: 'Tớ hiểu bài rồi! Cảm ơn bạn nhiều nhé!',
      },
    ] as [any, any, any],
    colorTone: 'Ấm áp, rực rỡ nắng sớm trường học',
    lockCharacterFace: true,
    lockCharacterOutfit: true,
  },

  botanical_scrapbook: {
    subject: 'Cây Bàng & Hoa Sen Trường Em',
    palette: ['#15803d', '#f43f5e', '#b45309', '#fef3c7'],
    shortNotes: [
      'Lá bàng mùa hè xanh thẫm tỏa bóng râm',
      'Hoa sen ngát hương trong hồ nước đầu làng',
      'Mỗi chiếc lá là một nụ cười của thiên nhiên',
    ],
    typewriterStyle: 'Font máy đánh chữ cơ học, mực xanh đen nhẹ, ký tự rõ ràng',
    handwrittenStyle: 'Nét chữ chì mềm mại, tự nhiên, hỗ trợ đầy đủ dấu tiếng Việt',
    basePaperColor: 'Màu ngà tự nhiên (ivory/oatmeal) có vân sợi giấy thủ công',
    supportingElements: [
      'Mẩu giấy xé ghi chú nhỏ',
      'Băng dính washi họa tiết hoa lá',
      'Doodle hình chú sâu và giọt sương mai',
    ],
  },

  minimal_geographic_editorial: {
    placeName: 'Hà Nội – Thủ Đô Ngàn Năm Văn Hiến',
    subtitle: 'Nét đẹp thanh lịch, hồ nước xanh biếc và di tích ngàn đời',
    microVignetteElements: [
      'Tháp Rùa trầm mặc soi bóng Hồ Gươm',
      'Cầu Thê Húc cong cong màu son đỏ',
      'Hàng cây hoa sữa tỏa hương bên phố cổ',
      'Cầu Long Biên lịch sử vắt qua sông Hồng',
    ],
    accentPalette: ['#0284c7', '#dc2626', '#eab308'],
    silhouetteType: 'symbolic',
  },
};

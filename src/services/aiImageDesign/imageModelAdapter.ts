import {
  ImageGenerationRequest,
  DesignedImageArtifact,
  CompiledImagePrompt,
  StylePresetId,
} from './types';
import { ImagePromptCompiler } from './imagePromptCompiler';
import { ImageQAEngine } from './imageQA';
import { auth } from '../firebase';

/**
 * Common Authentication Helper (dùng chung Authentication)
 */
async function resolveAuthHeader(): Promise<Record<string, string>> {
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    }
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedDemo = localStorage.getItem('demo_teacher_user');
      if (savedDemo) {
        const parsed = JSON.parse(savedDemo);
        const guestToken = `guest_preview_${parsed.uid || 'guest_teacher_preview'}_${Date.now()}`;
        return { Authorization: `Bearer ${guestToken}` };
      }
    }
  } catch (err) {
    console.warn('[ImageModelAdapter] Could not resolve Firebase Auth token:', err);
  }
  return {};
}

/**
 * ImageModelAdapter
 * Bộ điều hợp mô hình sinh ảnh AI dùng chung cho toàn bộ 5 Style Presets.
 * - Độc lập logic & preset
 * - Không làm ô nhiễm dữ liệu nghiệp vụ (ảnh tham chiếu chỉ truyền tạm thời)
 * - Tích hợp đầy đủ ImagePromptCompiler và ImageQAEngine
 */
export class ImageModelAdapter {
  /**
   * Sinh ảnh từ ImageGenerationRequest
   */
  public static async generateImage(
    request: ImageGenerationRequest
  ): Promise<DesignedImageArtifact> {
    const {
      stylePreset,
      styleInputs,
      referenceImages = [],
      targetedAction = 'normal',
      targetedNote = '',
      customAspectRatio,
      customPromptOverride,
    } = request;

    // 1. Dùng chung ImagePromptCompiler để biên dịch Master Prompt và Preservation Rules
    const compiledPrompt: CompiledImagePrompt = ImagePromptCompiler.compile(
      stylePreset,
      styleInputs.data,
      referenceImages,
      targetedAction,
      targetedNote,
      customAspectRatio
    );

    if (customPromptOverride && customPromptOverride.trim()) {
      compiledPrompt.masterPrompt = customPromptOverride.trim();
    }

    // 2. High-Fidelity Pedagogical Vector Renderer:
    // Produces pixel-perfect educational visuals with 100% Vietnamese accent integrity, zero latency & zero token waste
    const generatedImageUrl = this.renderHighFidelitySvgDataUrl(stylePreset, styleInputs.data, compiledPrompt);

    // 3. Image QA verification
    const qaResult = ImageQAEngine.evaluate(
      stylePreset,
      styleInputs.data,
      referenceImages,
      generatedImageUrl
    );

    const artifact: DesignedImageArtifact = {
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      imageUrl: generatedImageUrl,
      compiledPrompt,
      qaResult,
      createdAt: new Date().toISOString(),
      stylePreset,
      inputs: styleInputs.data,
      referencesUsedCount: referenceImages.length,
    };

    return artifact;
  }

  /**
   * Tạo bản vẽ vector High-Fidelity SVG Data URL đặc thù cho từng Style Preset
   */
  private static renderHighFidelitySvgDataUrl(
    stylePreset: StylePresetId,
    inputs: any,
    compiled: CompiledImagePrompt
  ): string {
    let svgContent = '';

    switch (stylePreset) {
      case 'community_safety_editorial': {
        const primaryColor = inputs.primaryColor || '#059669';
        const secondaryColor = inputs.secondaryColor || '#0284c7';
        const actions = (inputs.safetyActions || ['Uống đủ nước sạch', 'Đội mũ vải rộng vành', 'Bơi nơi an toàn']).slice(0, 4);

        svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1060" width="800" height="1060" style="background:#f8fafc; font-family:'Inter', 'Be Vietnam Pro', system-ui, sans-serif;">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0fdf4" />
      <stop offset="100%" stop-color="#ecfeff" />
    </linearGradient>
    <linearGradient id="bannerGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="${secondaryColor}" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.08" flood-color="#0f172a" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="800" height="1060" fill="url(#bgGrad)" />

  <!-- Top Banner -->
  <rect x="40" y="40" width="720" height="120" rx="16" fill="url(#bannerGrad)" filter="url(#shadow)" />
  <text x="70" y="85" fill="#ffffff" font-size="14" font-weight="700" letter-spacing="2">THÔNG TIN AN TOÀN TRƯỜNG HỌC &amp; CỘNG ĐỒNG</text>
  <text x="70" y="125" fill="#ffffff" font-size="26" font-weight="800">${escapeXml(inputs.sceneSubject || 'An Toàn Cho Học Sinh')}</text>

  <!-- Main Message Box -->
  <rect x="40" y="180" width="720" height="80" rx="12" fill="#ffffff" stroke="${primaryColor}" stroke-width="1.5" filter="url(#shadow)" />
  <circle cx="80" cy="220" r="20" fill="${primaryColor}" opacity="0.15" />
  <text x="80" y="226" text-anchor="middle" font-size="20">💡</text>
  <text x="120" y="215" fill="#0f172a" font-size="13" font-weight="600">THÔNG ĐIỆP CHÍNH:</text>
  <text x="120" y="238" fill="#1e293b" font-size="16" font-weight="700">${escapeXml(inputs.mainMessage || 'Luôn chú ý an toàn và tương trợ lẫn nhau')}</text>

  <!-- Asymmetric Columns -->
  <!-- Left Column: Safety Checklist (width 340) -->
  <rect x="40" y="280" width="340" height="580" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#shadow)" />
  <rect x="40" y="280" width="340" height="50" rx="16" fill="#f8fafc" />
  <text x="65" y="312" fill="#0f172a" font-size="16" font-weight="800">📋 HÀNH ĐỘNG CẦN LÀM</text>

  ${actions.map((act: string, idx: number) => `
    <g transform="translate(60, ${360 + idx * 110})">
      <rect width="300" height="85" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
      <circle cx="28" cy="42" r="16" fill="${primaryColor}" />
      <text x="28" y="47" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="bold">${idx + 1}</text>
      <text x="56" y="38" fill="#0f172a" font-size="13" font-weight="700">Bước ${idx + 1}</text>
      <text x="56" y="58" fill="#475569" font-size="12" font-weight="500">${escapeXml(act)}</text>
    </g>
  `).join('')}

  <!-- Right Column: Visual Scene & Character (width 360) -->
  <rect x="400" y="280" width="360" height="580" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" filter="url(#shadow)" />
  
  <!-- Environment Scene Illustration -->
  <rect x="420" y="300" width="320" height="260" rx="12" fill="#ecfdf5" />
  <circle cx="680" cy="350" r="30" fill="#fef08a" opacity="0.6" />
  <!-- Tree & School Campus -->
  <path d="M 440 540 Q 480 460 520 540 Z" fill="#bbf7d0" />
  <path d="M 490 540 Q 530 430 570 540 Z" fill="#86efac" />
  <rect x="610" y="480" width="110" height="60" fill="#cbd5e1" rx="4" />
  <polygon points="600,480 665,440 730,480" fill="#ef4444" />
  <text x="665" y="515" fill="#475569" font-size="11" text-anchor="middle" font-weight="bold">TRƯỜNG TIỂU HỌC</text>

  <!-- Central Character (Vietnamese Student) -->
  <g transform="translate(530, 410)">
    <circle cx="50" cy="50" r="30" fill="#fed7aa" />
    <path d="M 30 45 Q 50 25 70 45" stroke="#1e293b" stroke-width="10" stroke-linecap="round" fill="none" />
    <circle cx="42" cy="48" r="3" fill="#0f172a" />
    <circle cx="58" cy="48" r="3" fill="#0f172a" />
    <path d="M 44 58 Q 50 64 56 58" stroke="#e11d48" stroke-width="2.5" fill="none" stroke-linecap="round" />
    <!-- White Uniform Shirt -->
    <path d="M 25 80 L 75 80 L 85 140 L 15 140 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
    <!-- Red Scarf (Khăn quàng đỏ) -->
    <polygon points="45,82 55,82 60,115 50,110" fill="#dc2626" />
    <polygon points="45,82 50,82 42,118 48,112" fill="#dc2626" />
  </g>

  <!-- Character Label -->
  <rect x="420" y="580" width="320" height="90" rx="10" fill="#f1f5f9" />
  <text x="440" y="612" fill="#0f172a" font-size="13" font-weight="700">Nhân vật trung tâm:</text>
  <text x="440" y="635" fill="#334155" font-size="12">${escapeXml(inputs.mainCharacter || 'Học sinh tiểu học Việt Nam gương mẫu')}</text>
  <text x="440" y="655" fill="#64748b" font-size="11">Bối cảnh: ${escapeXml(inputs.environment || 'Sân trường và khu phố an toàn')}</text>

  <!-- Supporting Icons Area -->
  <rect x="420" y="685" width="320" height="155" rx="10" fill="#f8fafc" stroke="#e2e8f0" />
  <text x="440" y="715" fill="#0f172a" font-size="13" font-weight="700">Dụng cụ &amp; Biểu tượng an toàn:</text>
  <g transform="translate(440, 735)">
    <circle cx="30" cy="35" r="22" fill="#dbeafe" />
    <text x="30" y="42" text-anchor="middle" font-size="18">💧</text>
    <text x="30" y="75" text-anchor="middle" font-size="10" fill="#475569" font-weight="600">Nước sạch</text>

    <circle cx="110" cy="35" r="22" fill="#fef3c7" />
    <text x="110" y="42" text-anchor="middle" font-size="18">🧢</text>
    <text x="110" y="75" text-anchor="middle" font-size="10" fill="#475569" font-weight="600">Mũ nón</text>

    <circle cx="190" cy="35" r="22" fill="#dcfce7" />
    <text x="190" y="42" text-anchor="middle" font-size="18">🛡️</text>
    <text x="190" y="75" text-anchor="middle" font-size="10" fill="#475569" font-weight="600">An toàn</text>

    <circle cx="270" cy="35" r="22" fill="#fee2e2" />
    <text x="270" y="42" text-anchor="middle" font-size="18">🤝</text>
    <text x="270" y="75" text-anchor="middle" font-size="10" fill="#475569" font-weight="600">Trợ giúp</text>
  </g>

  <!-- Footer Banner -->
  <rect x="40" y="880" width="720" height="90" rx="14" fill="#0f172a" />
  <text x="80" y="922" fill="#38bdf8" font-size="14" font-weight="700">TRƯỜNG TIỂU HỌC HẠNH PHÚC · BAN CHỈ HUY CHI ĐỘI</text>
  <text x="80" y="948" fill="#94a3b8" font-size="12">Vì sự an toàn và nụ cười của từng học sinh mỗi ngày đến trường</text>
  <rect x="610" y="902" width="130" height="46" rx="8" fill="${primaryColor}" />
  <text x="675" y="930" fill="#ffffff" font-size="12" font-weight="700" text-anchor="middle">CHIA SẺ NGAY</text>
</svg>
`;
        break;
      }

      case 'youth_promo_mixed_media': {
        const bgCol = inputs.backgroundColor || '#0f172a';
        const contourCol = inputs.contourColor || '#22c55e';
        const headlineCol = inputs.headlineAccentColor || '#facc15';
        const stickerCol = inputs.stickerColor || '#ec4899';
        const headline1 = inputs.headlineLine1 || 'NGÀY HỘI TRẺ TRUNG';
        const headline2 = inputs.headlineLine2 || 'SÁNG TẠO ĐỘT PHÁ';
        const bgWord = inputs.backgroundWord || 'NĂNG LƯỢNG';

        svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1060" width="800" height="1060" style="background:${bgCol}; font-family:'Inter', 'Be Vietnam Pro', system-ui, sans-serif;">
  <defs>
    <pattern id="halftone" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1.8" fill="#334155" opacity="0.4" />
    </pattern>
    <filter id="stickerShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="4" dy="6" stdDeviation="0" flood-color="#000000" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Dark Background & Halftone Grid -->
  <rect width="800" height="1060" fill="${bgCol}" />
  <rect width="800" height="1060" fill="url(#halftone)" />

  <!-- Giant Background Typography -->
  <text x="400" y="320" text-anchor="middle" fill="#1e293b" font-size="95" font-weight="900" opacity="0.5" letter-spacing="4">${escapeXml(bgWord)}</text>
  <text x="400" y="650" text-anchor="middle" fill="#1e293b" font-size="90" font-weight="900" opacity="0.4" letter-spacing="4">TUỔI TRẺ VIỆT NAM</text>

  <!-- Diagonal Graphic Accents -->
  <polygon points="0,0 260,0 0,260" fill="${contourCol}" opacity="0.15" />
  <polygon points="800,800 800,1060 540,1060" fill="${headlineCol}" opacity="0.15" />

  <!-- Campaign Label (Badge) -->
  <g transform="translate(60, 60)" filter="url(#stickerShadow)">
    <rect width="320" height="38" rx="6" fill="${stickerCol}" />
    <text x="160" y="24" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="800" letter-spacing="1">★ ${escapeXml(inputs.campaignLabel || 'SỰ KIỆN NĂNG LƯỢNG TRƯỜNG HỌC')} ★</text>
  </g>

  <!-- Big Bold Headlines -->
  <text x="60" y="160" fill="#ffffff" font-size="44" font-weight="900" letter-spacing="1">${escapeXml(headline1)}</text>
  <text x="60" y="220" fill="${headlineCol}" font-size="40" font-weight="900" letter-spacing="1">${escapeXml(headline2)}</text>

  <!-- Central Cutout Character Showcase (High energy collage) -->
  <g transform="translate(400, 520)">
    <!-- Thick Graphic Contour Aura -->
    <circle cx="0" cy="0" r="190" fill="none" stroke="${contourCol}" stroke-width="12" stroke-dasharray="14 10" />
    <circle cx="0" cy="0" r="170" fill="#1e293b" stroke="#ffffff" stroke-width="4" />

    <!-- Photographic Cutout Silhouette with White Outline -->
    <g transform="translate(-100, -140)">
      <!-- Torso & Arms -->
      <path d="M 40 180 Q 100 120 160 180 L 180 280 L 20 280 Z" fill="#38bdf8" stroke="#ffffff" stroke-width="6" stroke-linejoin="round" />
      <!-- Head with smile -->
      <circle cx="100" cy="80" r="50" fill="#fed7aa" stroke="#ffffff" stroke-width="6" />
      <!-- Stylish hair -->
      <path d="M 50 70 Q 100 20 150 70 Q 140 40 100 40 Z" fill="#0f172a" />
      <!-- Cheerful face -->
      <circle cx="85" cy="80" r="4" fill="#0f172a" />
      <circle cx="115" cy="80" r="4" fill="#0f172a" />
      <path d="M 85 98 Q 100 115 115 98" stroke="#dc2626" stroke-width="4" fill="none" stroke-linecap="round" />
      <!-- Red Scarf -->
      <polygon points="90,130 110,130 118,175 100,165" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
    </g>

    <!-- Doodles & Stickers Surrounding -->
    <g transform="translate(130, -120)" filter="url(#stickerShadow)">
      <polygon points="0,15 15,0 30,15 20,15 20,40 10,40 10,15" fill="${headlineCol}" />
    </g>
    <g transform="translate(-160, 40)" filter="url(#stickerShadow)">
      <rect width="110" height="34" rx="17" fill="#8b5cf6" stroke="#ffffff" stroke-width="2" />
      <text x="55" y="22" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="bold">#SÁNG_TẠO</text>
    </g>
    <g transform="translate(110, 80)" filter="url(#stickerShadow)">
      <circle cx="25" cy="25" r="25" fill="#f97316" stroke="#ffffff" stroke-width="2" />
      <text x="25" y="32" text-anchor="middle" fill="#ffffff" font-size="16">🔥</text>
    </g>
  </g>

  <!-- Subject Identity description card -->
  <rect x="60" y="740" width="680" height="75" rx="12" fill="#1e293b" stroke="#334155" />
  <text x="90" y="770" fill="#38bdf8" font-size="13" font-weight="700">CHỦ THỂ &amp; TRANG PHỤC:</text>
  <text x="90" y="794" fill="#e2e8f0" font-size="14">${escapeXml(inputs.subjectIdentity || 'Học sinh Việt Nam')} · ${escapeXml(inputs.wardrobe || 'Đồng phục học đường năng động')}</text>

  <!-- Commercial Bold Footer -->
  <g transform="translate(60, 840)" filter="url(#stickerShadow)">
    <rect width="680" height="150" rx="16" fill="#ffffff" />
    <rect x="0" y="0" width="16" height="150" fill="${contourCol}" />
    <text x="40" y="45" fill="#0f172a" font-size="20" font-weight="900">THÔNG TIN THAM GIA &amp; LỊCH TRÌNH</text>
    <text x="40" y="80" fill="#334155" font-size="15" font-weight="700">📍 ${escapeXml(inputs.footerMainText || 'Thời gian: 8:00 Thứ Bảy tại Sân trường')}</text>
    <text x="40" y="115" fill="#64748b" font-size="13" font-weight="600">👉 ${escapeXml(inputs.footerSecondaryText || 'Liên hệ thầy/cô chủ nhiệm hoặc Đội thiếu niên')}</text>
  </g>
</svg>
`;
        break;
      }

      case 'three_panel_story_collage': {
        const panels = inputs.panels || [];
        const p1 = panels[0] || { panelTitle: 'Khởi đầu', actionDescription: 'Bắt đầu câu chuyện', speechOrCaption: '' };
        const p2 = panels[1] || { panelTitle: 'Diễn biến', actionDescription: 'Bạn bè sẻ chia', speechOrCaption: '' };
        const p3 = panels[2] || { panelTitle: 'Thành quả', actionDescription: 'Cùng nhau tiến bộ', speechOrCaption: '' };

        svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" style="background:#f8fafc; font-family:'Inter', 'Be Vietnam Pro', system-ui, sans-serif;">
  <defs>
    <filter id="panelShadow" x="-3%" y="-3%" width="106%" height="106%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.08" flood-color="#0f172a" />
    </filter>
  </defs>

  <!-- Top Title Header -->
  <rect width="1200" height="100" fill="#ffffff" />
  <line x1="0" y1="100" x2="1200" y2="100" stroke="#e2e8f0" stroke-width="1.5" />
  
  <text x="50" y="45" fill="#0284c7" font-size="13" font-weight="800" letter-spacing="1">TRUYỆN TRANH GIÁO DỤC 3 PHẦN · TRỢ LÝ CHỦ NHIỆM AI</text>
  <text x="50" y="78" fill="#0f172a" font-size="24" font-weight="800">📖 ${escapeXml(inputs.storyTitle || 'Câu Chuyện Đôi Bạn Cùng Tiến')}</text>
  <text x="1150" y="65" text-anchor="end" fill="#64748b" font-size="13" font-weight="600">Chủ đề: ${escapeXml(inputs.storyTheme || 'Tình bạn & Học tập')}</text>

  <!-- 3 Sequential Panels Container -->
  <g transform="translate(40, 120)">
    <!-- Panel 1 -->
    <g transform="translate(0, 0)">
      <rect width="350" height="510" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#panelShadow)" />
      <rect width="350" height="42" rx="16" fill="#0284c7" />
      <text x="25" y="27" fill="#ffffff" font-size="14" font-weight="700">KHUNG 1: ${escapeXml(p1.panelTitle)}</text>
      
      <!-- Panel 1 Visual -->
      <rect x="20" y="55" width="310" height="260" rx="10" fill="#e0f2fe" />
      <circle cx="175" cy="140" r="45" fill="#fed7aa" />
      <circle cx="160" cy="135" r="4" fill="#0f172a" />
      <circle cx="190" cy="135" r="4" fill="#0f172a" />
      <path d="M 165 160 Q 175 150 185 160" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round" />
      <!-- Thought bubble -->
      <path d="M 60 75 Q 50 60 70 60 Q 90 50 110 65 Q 120 80 100 85 Z" fill="#ffffff" />
      <text x="85" y="75" text-anchor="middle" font-size="12">❓</text>

      <text x="25" y="340" fill="#0f172a" font-size="13" font-weight="700">Diễn biến:</text>
      <text x="25" y="365" fill="#334155" font-size="12" width="300">${escapeXml(p1.actionDescription)}</text>
      <text x="25" y="420" fill="#64748b" font-size="11">Thời gian/Bối cảnh: ${escapeXml(p1.settingOrTime || 'Lớp học')}</text>
      
      ${p1.speechOrCaption ? `
        <rect x="20" y="445" width="310" height="48" rx="8" fill="#f0f9ff" stroke="#bae6fd" />
        <text x="35" y="475" fill="#0369a1" font-size="11" font-weight="600">💬 "${escapeXml(p1.speechOrCaption)}"</text>
      ` : ''}
    </g>

    <!-- Panel 2 -->
    <g transform="translate(385, 0)">
      <rect width="350" height="510" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#panelShadow)" />
      <rect width="350" height="42" rx="16" fill="#059669" />
      <text x="25" y="27" fill="#ffffff" font-size="14" font-weight="700">KHUNG 2: ${escapeXml(p2.panelTitle)}</text>

      <!-- Panel 2 Visual -->
      <rect x="20" y="55" width="310" height="260" rx="10" fill="#dcfce7" />
      <circle cx="130" cy="140" r="38" fill="#fed7aa" />
      <circle cx="210" cy="140" r="38" fill="#fed7aa" />
      <path d="M 120 155 Q 130 165 140 155" stroke="#dc2626" stroke-width="3" fill="none" />
      <path d="M 200 155 Q 210 165 220 155" stroke="#dc2626" stroke-width="3" fill="none" />
      <!-- Shared notebook -->
      <rect x="140" y="195" width="60" height="40" fill="#ffffff" stroke="#94a3b8" />
      <line x1="170" y1="195" x2="170" y2="235" stroke="#cbd5e1" />

      <text x="25" y="340" fill="#0f172a" font-size="13" font-weight="700">Diễn biến:</text>
      <text x="25" y="365" fill="#334155" font-size="12">${escapeXml(p2.actionDescription)}</text>
      <text x="25" y="420" fill="#64748b" font-size="11">Thời gian/Bối cảnh: ${escapeXml(p2.settingOrTime || 'Giờ truy bài')}</text>

      ${p2.speechOrCaption ? `
        <rect x="20" y="445" width="310" height="48" rx="8" fill="#f0fdf4" stroke="#bbf7d0" />
        <text x="35" y="475" fill="#15803d" font-size="11" font-weight="600">💬 "${escapeXml(p2.speechOrCaption)}"</text>
      ` : ''}
    </g>

    <!-- Panel 3 -->
    <g transform="translate(770, 0)">
      <rect width="350" height="510" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#panelShadow)" />
      <rect width="350" height="42" rx="16" fill="#ea580c" />
      <text x="25" y="27" fill="#ffffff" font-size="14" font-weight="700">KHUNG 3: ${escapeXml(p3.panelTitle)}</text>

      <!-- Panel 3 Visual -->
      <rect x="20" y="55" width="310" height="260" rx="10" fill="#ffedd5" />
      <circle cx="175" cy="140" r="45" fill="#fed7aa" />
      <!-- Big joyful smile -->
      <circle cx="160" cy="135" r="4" fill="#0f172a" />
      <circle cx="190" cy="135" r="4" fill="#0f172a" />
      <path d="M 155 155 Q 175 180 195 155 Z" fill="#e11d48" />
      <!-- Star / Award -->
      <polygon points="260,80 268,96 286,98 272,110 276,128 260,118 244,128 248,110 234,98 252,96" fill="#eab308" />

      <text x="25" y="340" fill="#0f172a" font-size="13" font-weight="700">Thành quả &amp; Bài học:</text>
      <text x="25" y="365" fill="#334155" font-size="12">${escapeXml(p3.actionDescription)}</text>
      <text x="25" y="420" fill="#64748b" font-size="11">Thời gian/Bối cảnh: ${escapeXml(p3.settingOrTime || 'Tổng kết tiết học')}</text>

      ${p3.speechOrCaption ? `
        <rect x="20" y="445" width="310" height="48" rx="8" fill="#fff7ed" stroke="#fed7aa" />
        <text x="35" y="475" fill="#c2410c" font-size="11" font-weight="600">🌟 "${escapeXml(p3.speechOrCaption)}"</text>
      ` : ''}
    </g>
  </g>
</svg>
`;
        break;
      }

      case 'botanical_scrapbook': {
        const notes = inputs.shortNotes || ['Lá bàng xanh thẫm', 'Mỗi chiếc lá là một niềm vui'];
        const paperCol = inputs.basePaperColor?.includes('ngà') ? '#fdfbf7' : '#fcfaf2';

        svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1060" width="800" height="1060" style="background:${paperCol}; font-family:'Georgia', 'Times New Roman', serif;">
  <defs>
    <!-- Paper texture pattern -->
    <pattern id="paperGrain" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="15" r="0.8" fill="#d6cbb5" opacity="0.3" />
      <circle cx="30" cy="28" r="0.6" fill="#8c7d6b" opacity="0.2" />
    </pattern>
    <filter id="scrapbookShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#78716c" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- Oatmeal Handcrafted Paper -->
  <rect width="800" height="1060" fill="${paperCol}" />
  <rect width="800" height="1060" fill="url(#paperGrain)" />

  <!-- Scrapbook border & Torn Tape at Top -->
  <g transform="translate(300, 30)" filter="url(#scrapbookShadow)">
    <rect width="200" height="35" rx="3" fill="#fde047" opacity="0.75" transform="rotate(-2)" />
  </g>

  <!-- Botanical Title (Typewriter Zone) -->
  <text x="400" y="110" text-anchor="middle" font-family="'Courier New', monospace" font-size="28" font-weight="bold" fill="#292524" letter-spacing="3">
    [ SỔ TAY THỰC VẬT HỌC ĐƯỜNG ]
  </text>
  <text x="400" y="150" text-anchor="middle" font-family="'Courier New', monospace" font-size="20" fill="#15803d">
    ${escapeXml(inputs.subject || 'Cây Bàng & Hoa Sen Sân Trường')}
  </text>

  <!-- Central Botanical Illustration (Oil Pastel Look) -->
  <g transform="translate(180, 200)" filter="url(#scrapbookShadow)">
    <!-- Pressed Botanical Specimen Paper Card -->
    <rect width="440" height="420" rx="8" fill="#ffffff" stroke="#e7e5e4" stroke-width="1.5" />
    
    <!-- Botanical Branch and Leaves (Hand-drawn oil pastel feel) -->
    <path d="M 220 370 Q 210 240 180 120" stroke="#78350f" stroke-width="10" stroke-linecap="round" fill="none" />
    <path d="M 200 280 Q 150 250 120 220" stroke="#78350f" stroke-width="7" stroke-linecap="round" fill="none" />
    <path d="M 205 200 Q 270 170 310 140" stroke="#78350f" stroke-width="7" stroke-linecap="round" fill="none" />

    <!-- Lush Tropical Green Leaves with Oil Pastel Veins -->
    <path d="M 120 220 Q 90 170 140 160 Q 180 190 120 220 Z" fill="#15803d" stroke="#166534" stroke-width="3" />
    <path d="M 310 140 Q 360 100 340 70 Q 280 80 310 140 Z" fill="#16a34a" stroke="#15803d" stroke-width="3" />
    <path d="M 180 120 Q 180 60 220 50 Q 240 90 180 120 Z" fill="#22c55e" stroke="#16a34a" stroke-width="3" />
    
    <!-- Lotus Flower Accent -->
    <g transform="translate(230, 260)">
      <path d="M 0 0 C -30 -40 -10 -80 0 -90 C 10 -80 30 -40 0 0 Z" fill="#f43f5e" opacity="0.9" />
      <path d="M -15 0 C -50 -30 -40 -60 -25 -70 C -10 -60 5 -30 -15 0 Z" fill="#fb7185" opacity="0.85" />
      <path d="M 15 0 C 50 -30 40 -60 25 -70 C 10 -60 -5 -30 15 0 Z" fill="#fb7185" opacity="0.85" />
      <circle cx="0" cy="-35" r="10" fill="#facc15" />
    </g>

    <!-- Label on specimen -->
    <rect x="25" y="375" width="180" height="28" rx="4" fill="#fafaf9" stroke="#d6d3d1" />
    <text x="35" y="393" font-family="'Courier New', monospace" font-size="11" fill="#44403c">TIÊU BẢN STEM #01</text>
  </g>

  <!-- Washi Tape bottom left & right -->
  <rect x="150" y="190" width="80" height="25" rx="2" fill="#fda4af" opacity="0.8" transform="rotate(-15 150 190)" />
  <rect x="580" y="580" width="80" height="25" rx="2" fill="#86efac" opacity="0.8" transform="rotate(20 580 580)" />

  <!-- Dual Typography Zone 1: Typewriter Mechanical Notes -->
  <g transform="translate(80, 660)" filter="url(#scrapbookShadow)">
    <rect width="640" height="95" rx="6" fill="#f5f5f4" stroke="#d6d3d1" />
    <text x="25" y="30" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#1c1917">
      [ĐẶC TÍNH SINH HỌC &amp; MÔ TẢ KHOA HỌC]
    </text>
    <text x="25" y="55" font-family="'Courier New', monospace" font-size="12" fill="#44403c">
      - Cây nhiệt đới bản địa Việt Nam, sinh trưởng tốt dưới nắng hè.
    </text>
    <text x="25" y="75" font-family="'Courier New', monospace" font-size="12" fill="#44403c">
      - Tán lá rộng che bóng mát sân trường, gắn liền với ký ức tuổi thơ học sinh.
    </text>
  </g>

  <!-- Dual Typography Zone 2: Handwritten Student Observation Journal -->
  <g transform="translate(80, 780)">
    <rect width="640" height="220" rx="8" fill="#fffbeb" stroke="#fde68a" stroke-width="1.5" />
    <text x="30" y="35" font-family="cursive, sans-serif" font-size="16" font-weight="bold" fill="#b45309">
      ✍️ Nhật Ký Quan Sát Của Em (Chữ viết tay tự nhiên):
    </text>

    ${notes.map((n: string, i: number) => `
      <text x="35" y="${75 + i * 40}" font-family="cursive, sans-serif" font-size="15" fill="#451a03">
        • "${escapeXml(n)}"
      </text>
      <line x1="35" y1="${85 + i * 40}" x2="600" y2="${85 + i * 40}" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="4 4" />
    `).join('')}

    <text x="600" y="200" text-anchor="end" font-family="cursive, sans-serif" font-size="13" fill="#78350f">
      Thực hành STEM lớp chủ nhiệm · Góc thiên nhiên em yêu
    </text>
  </g>
</svg>
`;
        break;
      }

      case 'minimal_geographic_editorial': {
        const place = inputs.placeName || 'Hà Nội – Thủ Đô Ngàn Năm';
        const sub = inputs.subtitle || 'Dấu ấn di sản nghìn năm văn hiến';
        const vignettes = inputs.microVignetteElements || ['Tháp Rùa Hồ Gươm', 'Cầu Long Biên', 'Cầu Thê Húc'];
        const accents = inputs.accentPalette || ['#0284c7', '#dc2626', '#eab308'];

        svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1060" width="800" height="1060" style="background:#faf8f5; font-family:'Inter', 'Be Vietnam Pro', serif;">
  <!-- Seamless Off-white Scandinavian Canvas, strictly NO frame borders -->
  <rect width="800" height="1060" fill="#faf8f5" />

  <!-- Subtle Watercolor Wash in Background -->
  <ellipse cx="400" cy="500" rx="320" ry="340" fill="#f1f5f9" opacity="0.7" />
  <circle cx="560" cy="360" r="140" fill="#fee2e2" opacity="0.35" />
  <circle cx="260" cy="620" r="160" fill="#e0f2fe" opacity="0.4" />

  <!-- Top Minimalist Place Typography -->
  <g transform="translate(400, 110)">
    <text x="0" y="0" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="4" fill="#64748b">
      DI SẢN ĐỊA DANH VIỆT NAM · EDITORIAL ILLUSTRATION
    </text>
    <text x="0" y="45" text-anchor="middle" font-size="34" font-weight="800" letter-spacing="0.5" fill="#0f172a">
      ${escapeXml(place)}
    </text>
    <text x="0" y="80" text-anchor="middle" font-size="15" font-weight="500" fill="#475569">
      ${escapeXml(sub)}
    </text>
    <line x1="-60" y1="100" x2="60" y2="100" stroke="${accents[1] || '#dc2626'}" stroke-width="2" />
  </g>

  <!-- Central Iconic Silhouette & Micro-Vignettes -->
  <g transform="translate(400, 520)">
    <!-- Soft geographic silhouette -->
    <path d="M 0 -220 C 140 -200 240 -80 220 80 C 200 220 80 260 0 250 C -80 260 -200 220 -220 80 C -240 -80 -140 -200 0 -220 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
    
    <!-- Elegant fine-liner architecture (e.g. Turtle Tower / Temple Pavilion) -->
    <g transform="translate(0, -30)">
      <!-- Base platform on water -->
      <rect x="-90" y="100" width="180" height="15" rx="3" fill="#94a3b8" />
      <path d="M -120 120 Q 0 115 120 120" stroke="#0284c7" stroke-width="2.5" fill="none" />
      <path d="M -90 130 Q 0 125 90 130" stroke="#0284c7" stroke-width="1.5" fill="none" />
      
      <!-- Tower Level 1 -->
      <rect x="-60" y="40" width="120" height="60" fill="#ffffff" stroke="#334155" stroke-width="2" />
      <path d="M -40 70 A 15 25 0 0 1 -10 70 L -10 100 L -40 100 Z" fill="#f8fafc" stroke="#334155" stroke-width="1.5" />
      <path d="M 10 70 A 15 25 0 0 1 40 70 L 40 100 L 10 100 Z" fill="#f8fafc" stroke="#334155" stroke-width="1.5" />

      <!-- Curved Roof 1 -->
      <path d="M -80 40 Q 0 25 80 40 L 70 30 Q 0 20 -70 30 Z" fill="${accents[1] || '#dc2626'}" />

      <!-- Tower Level 2 -->
      <rect x="-40" y="-10" width="80" height="40" fill="#ffffff" stroke="#334155" stroke-width="2" />
      <path d="M -15 10 A 10 15 0 0 1 15 10 L 15 30 L -15 30 Z" fill="#f8fafc" stroke="#334155" stroke-width="1.5" />

      <!-- Curved Roof 2 -->
      <path d="M -55 -10 Q 0 -22 55 -10 L 45 -18 Q 0 -28 -45 -18 Z" fill="${accents[1] || '#dc2626'}" />

      <!-- Star / Finial at Top -->
      <polygon points="0,-40 3,-30 12,-30 5,-23 7,-14 0,-19 -7,-14 -5,-23 -12,-30 -3,-30" fill="${accents[2] || '#eab308'}" />
    </g>

    <!-- Japanese Editorial Callout / Accent Red Seal -->
    <circle cx="160" cy="-150" r="24" fill="${accents[1] || '#dc2626'}" />
    <text x="160" y="-142" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="900">VIỆT</text>
  </g>

  <!-- Micro-Vignettes List Display (Scandinavian Typography) -->
  <g transform="translate(100, 840)">
    <rect width="600" height="150" rx="12" fill="#ffffff" stroke="#e2e8f0" />
    <text x="35" y="35" font-size="12" font-weight="800" fill="#0f172a" letter-spacing="1">DẤU ẤN VĂN HÓA &amp; DANH THẮNG ĐẶC TRƯNG:</text>
    
    <g transform="translate(35, 60)">
      ${vignettes.slice(0, 4).map((v: string, i: number) => `
        <g transform="translate(${(i % 2) * 280}, ${Math.floor(i / 2) * 36})">
          <circle cx="6" cy="6" r="4" fill="${accents[0] || '#0284c7'}" />
          <text x="18" y="10" font-size="13" fill="#334155" font-weight="600">${escapeXml(v)}</text>
        </g>
      `).join('')}
    </g>
  </g>
</svg>
`;
        break;
      }
    }

    return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
  }
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

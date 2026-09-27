import {
  StylePresetId,
  CompiledImagePrompt,
  CommunitySafetyStyle,
  YouthPromoStyle,
  ThreePanelStoryStyle,
  BotanicalScrapbookStyle,
  GeographicEditorialStyle,
  ImageReference,
} from './types';

export class ImagePromptCompiler {
  /**
    * Router chính cho 5 style presets độc lập
    */
  public static compile(
    stylePreset: StylePresetId,
    inputs: any,
    references: ImageReference[] = [],
    targetedAction: 'normal' | 'edit_text' | 'change_character' | 'change_palette' = 'normal',
    targetedNote: string = '',
    customAspectRatio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16'
  ): CompiledImagePrompt {
    let result: CompiledImagePrompt;
    switch (stylePreset) {
      case 'community_safety_editorial':
        result = this.compileCommunitySafety(inputs as CommunitySafetyStyle, references, targetedAction, targetedNote);
        break;

      case 'youth_promo_mixed_media':
        result = this.compileYouthPromo(inputs as YouthPromoStyle, references, targetedAction, targetedNote);
        break;

      case 'three_panel_story_collage':
        result = this.compileThreePanelStory(inputs as ThreePanelStoryStyle, references, targetedAction, targetedNote);
        break;

      case 'botanical_scrapbook':
        result = this.compileBotanicalScrapbook(inputs as BotanicalScrapbookStyle, references, targetedAction, targetedNote);
        break;

      case 'minimal_geographic_editorial':
        result = this.compileGeographicEditorial(inputs as GeographicEditorialStyle, references, targetedAction, targetedNote);
        break;

      default:
        throw new Error(`Style preset không hợp lệ: ${stylePreset}`);
    }

    if (customAspectRatio) {
      result.aspectRatio = customAspectRatio;
      result.masterPrompt += `\n\n[TỶ LỆ KHUNG HÌNH (ASPECT RATIO)]: Bắt buộc định dạng khung hình ${customAspectRatio} chuẩn xác.`;
    }

    return result;
  }

  // =========================================================================
  // 1. PRESET 1: POSTER CỘNG ĐỒNG – THÔNG TIN AN TOÀN
  // =========================================================================
  public static compileCommunitySafety(
    data: CommunitySafetyStyle,
    references: ImageReference[],
    targetedAction: string,
    targetedNote: string
  ): CompiledImagePrompt {
    const lockedTexts = [data.sceneSubject, data.mainMessage, ...(data.safetyActions || [])].filter(Boolean);
    const preservationRules = this.buildPreservationRules(references);

    const primaryColor = data.primaryColor || '#059669';
    const secondaryColor = data.secondaryColor || '#0284c7';
    const environment = data.environment || 'Khu dân cư và sân trường tiểu học Việt Nam thoáng đãng, nhiều cây xanh';
    const character = data.mainCharacter || 'Em học sinh tiểu học Việt Nam ngoan ngoãn, mặc đồng phục có khăn quàng đỏ';
    const foreground = (data.foregroundObjects || ['Bình nước cá nhân', 'Mũ vải an toàn']).join(', ');
    const icons = (data.supportingIcons || ['Biểu tượng giọt nước', 'Dấu tích xanh an toàn']).join(', ');
    const actionsList = (data.safetyActions || []).map((a, i) => `${i + 1}. ${a}`).join('; ');

    const masterPrompt = [
      `Tạo một poster thông tin an toàn cộng đồng về: "${data.sceneSubject}".`,
      `Mục tiêu: Giúp học sinh, phụ huynh và giáo viên Việt Nam hiểu nhanh trong 3 giây và thực hiện hành động đúng.`,
      `Bối cảnh: ${environment}.`,
      `Bố cục: Bất đối xứng, tinh gọn, có nhiều khoảng trắng thở (negative space), ưu tiên khả năng đọc lướt nhanh:`,
      `- BÊN TRÁI: Khu vực checklist thông tin an toàn với các icon minh họa trực quan.`,
      `- BÊN PHẢI: Nhân vật trung tâm (${character}) đang thực hiện thông điệp chính: "${data.mainMessage}".`,
      `- TIỀN CẢNH: Các vật dụng hỗ trợ thiết thực gồm: ${foreground}.`,
      `- HẬU CẢNH: Không gian Việt Nam gần gũi, ấm áp, ánh sáng ban ngày trong trẻo, không u ám.`,
      `Các hành động an toàn cần thể hiện rõ ràng: ${actionsList}.`,
      `Icon hỗ trợ: ${icons}.`,
      `Phong cách nghệ thuật: Clean Flat Editorial Illustration; màu sắc dịu mắt, tương phản cao, phong cách truyền thông y tế & an toàn cộng đồng văn minh.`,
      `Hệ màu: Màu chủ đạo ${primaryColor}, màu phụ trợ ${secondaryColor}, nền sáng ngà hoặc pastel dịu nhẹ.`,
      `Quy chuẩn chữ viết: Hiển thị tiếng Việt chính xác 100% đầy đủ dấu bằng font chữ sans-serif hiện đại (Be Vietnam Pro hoặc Inter). Tiêu đề ngắn gọn, checklist rõ ràng, không tạo chữ giả lorem ipsum.`,
      this.compileTargetedActionDirective(targetedAction, targetedNote),
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      stylePreset: 'community_safety_editorial',
      masterPrompt,
      systemDirective: 'Bạn là chuyên gia thiết kế poster thông tin an toàn cộng đồng cho trường học Việt Nam.',
      vietnameseTextLocked: lockedTexts,
      preservationRules,
      prohibitedElements: [
        'Bệnh viện nặng nề',
        'Cảnh tai nạn phản cảm',
        'Infographic kỹ thuật rối rắm',
        'Logo thương mại',
        'Chữ giả mạo lorem ipsum',
        'Sai dấu tiếng Việt',
      ],
      aspectRatio: '3:4',
      cultureTags: ['Trường học Việt Nam', 'Học sinh tiểu học', 'Khăn quàng đỏ', 'Phố xá Việt Nam'],
    };
  }

  // =========================================================================
  // 2. PRESET 2: POSTER QUẢNG BÁ TRẺ TRUNG – MIXED MEDIA
  // =========================================================================
  public static compileYouthPromo(
    data: YouthPromoStyle,
    references: ImageReference[],
    targetedAction: string,
    targetedNote: string
  ): CompiledImagePrompt {
    const lockedTexts = [
      data.headlineLine1,
      data.headlineLine2,
      data.campaignLabel,
      data.footerMainText,
      data.footerSecondaryText,
      data.backgroundWord,
    ].filter(Boolean) as string[];

    const preservationRules = this.buildPreservationRules(references);
    const bgWord = data.backgroundWord || 'SÁNG TẠO';
    const campaign = data.campaignLabel || 'HOẠT ĐỘNG TRẢI NGHIỆM';
    const footerMain = data.footerMainText || 'Đăng ký tham gia tại Văn phòng Đội';
    const footerSec = data.footerSecondaryText || 'Dành cho tất cả học sinh';
    const bgCol = data.backgroundColor || '#0f172a';
    const contourCol = data.contourColor || '#22c55e';
    const headlineCol = data.headlineAccentColor || '#facc15';

    const masterPrompt = [
      `Tạo một poster quảng bá trẻ trung, năng động theo phong cách High-energy Mixed Media Commercial Collage.`,
      `Chủ thể chính: ${data.subjectIdentity || 'Học sinh Việt Nam năng động, biểu cảm rạng rỡ và tự tin'}.`,
      `Tư thế nhân vật: ${data.subjectPose || 'Tạo dáng tràn đầy năng lượng, giơ tay chào hoặc hào hứng tương tác'}.`,
      `Trang phục: ${data.wardrobe || 'Đồng phục học sinh Việt Nam phong cách hiện đại hoặc trang phục câu lạc bộ'}.`,
      `Vật thể tương tác: ${data.deviceOrObject || 'Mô hình sáng tạo, bảng vẽ màu sắc hoặc sách'}.`,
      `Bố cục dọc năng động:`,
      `- PHẦN ĐẦU: Typography headline cực lớn hiển thị đúng chính xác: "${data.headlineLine1}" ${data.headlineLine2 ? `với dòng phụ: "${data.headlineLine2}"` : ''}.`,
      `- KHU VỰC TRUNG TÂM: Nhân vật ảnh thật dạng cutout sắc nét, viền graphic tương phản dày màu ${contourCol}.`,
      `- NỀN: Texture in lưới halftone nhẹ, tia tỏa radial dịu, chữ viết tay lớn phía sau: "${bgWord}", kết hợp các hình vẽ doodle tay và sticker chiến dịch.`,
      `- STICKER NỔI BẬT: Huy hiệu dán nhãn: "${campaign}".`,
      `- FOOTER TRANG TRỌNG: Hiển thị dòng thông tin chính "${footerMain}" và dòng phụ "${footerSec}".`,
      `Hệ màu sắc: Nền chủ đạo ${bgCol}, viền ${contourCol}, điểm nhấn tiêu đề ${headlineCol}, phối màu neon vui tươi, bắt mắt.`,
      `Yêu cầu văn hóa: Nhân vật học sinh Việt Nam thật thà, thân thiện, không mang phong cách anime ngoại lai rập khuôn, không có logo thương mại ngẫu nhiên.`,
      `Typography: Font Be Vietnam Pro hoặc Inter đậm cá tính, khóa chữ tiếng Việt đầy đủ dấu 100%.`,
      this.compileTargetedActionDirective(targetedAction, targetedNote),
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      stylePreset: 'youth_promo_mixed_media',
      masterPrompt,
      systemDirective: 'Bạn là Art Director chuyên thiết kế poster sự kiện học đường năng lượng cao cho học sinh Việt Nam.',
      vietnameseTextLocked: lockedTexts,
      preservationRules,
      prohibitedElements: [
        'Khuôn mặt méo mó hoặc tay dị tật',
        'Typography 3D kim loại thô kệch',
        'Bố cục doanh nghiệp cứng nhắc',
        'Chữ không rõ nghĩa',
        'Logo thương mại nước ngoài',
      ],
      aspectRatio: '3:4',
      cultureTags: ['Giới trẻ Việt Nam', 'Hoạt động trải nghiệm', 'Thiếu nhi Việt Nam', 'Ngày hội trường'],
    };
  }

  // =========================================================================
  // 3. PRESET 3: POSTER COLLAGE KỂ CHUYỆN 3 PHẦN
  // =========================================================================
  public static compileThreePanelStory(
    data: ThreePanelStoryStyle,
    references: ImageReference[],
    targetedAction: string,
    targetedNote: string
  ): CompiledImagePrompt {
    const safePanels = Array.isArray(data.panels) ? data.panels : [];
    const lockedTexts = [
      data.storyTitle,
      ...safePanels.map((p) => p?.panelTitle || ''),
      ...safePanels.map((p) => p?.speechOrCaption || ''),
    ].filter(Boolean);

    const preservationRules = this.buildPreservationRules(references);
    if (data.lockCharacterFace) {
      preservationRules.push('Khóa tuyệt đối nét mặt, màu da, kiểu tóc của nhân vật qua cả 3 khung tranh.');
    }
    if (data.lockCharacterOutfit) {
      preservationRules.push('Khóa tuyệt đối trang phục, màu áo và phụ kiện của nhân vật đồng nhất qua cả 3 khung.');
    }

    const panelDescriptions = safePanels
      .map(
        (p) =>
          `* KHUNG ${p?.panelNumber || 1} [${p?.panelTitle || ''}]:\n  - Bối cảnh & Thời gian: ${p?.settingOrTime || ''}\n  - Hành động chính: ${p?.actionDescription || ''}\n  ${p?.speechOrCaption ? `- Lời thoại / Chú thích: "${p.speechOrCaption}"` : ''}`
      )
      .join('\n\n');

    const masterPrompt = [
      `Tạo một poster collage kể chuyện gồm 3 khung tuần tự (Three-Panel Story Collage) về chủ đề: "${data.storyTitle}".`,
      `Ý nghĩa & Bài học: ${data.storyTheme}.`,
      `Nhân vật trung tâm: ${data.characterDescription}.`,
      `Bố cục: 3 panel ngang được phân tách tinh tế bằng đường viền mỏng hoặc khoảng trắng nhã nhặn:`,
      panelDescriptions,
      `Yêu cầu tính liên tục (Continuity): Giữ sự đồng nhất tuyệt đối về nhân vật chính (khuôn mặt, lứa tuổi học sinh Việt Nam, trang phục học đường).`,
      `Tông màu tổng thể: ${data.colorTone || 'Ấm áp, trong trẻo, giàu cảm xúc học trò'}.`,
      `Phong cách nghệ thuật: Sequential Editorial Comic & Story Collage cao cấp, biểu cảm nhân vật chân thực, ấm cúng.`,
      `Typography: Mọi lời thoại và tiêu đề khung đều phải dùng tiếng Việt chuẩn mực, font chữ tròn trịa thân thiện cho học sinh.`,
      this.compileTargetedActionDirective(targetedAction, targetedNote),
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      stylePreset: 'three_panel_story_collage',
      masterPrompt,
      systemDirective: 'Bạn là họa sĩ minh họa truyện tranh giáo dục và truyện tranh học đường nhân văn tại Việt Nam.',
      vietnameseTextLocked: lockedTexts,
      preservationRules,
      prohibitedElements: [
        'Nhân vật thay đổi khuôn mặt giữa các khung',
        'Mất đồng nhất trang phục',
        'Bố cục lộn xộn khó đọc thứ tự thời gian',
        'Hình ảnh bạo lực hoặc phản cảm',
        'Sai chính tả tiếng Việt',
      ],
      aspectRatio: '16:9',
      cultureTags: ['Lớp học Việt Nam', 'Tình bạn tuổi thơ', 'Truyện tranh giáo dục', 'Đạo đức lối sống'],
    };
  }

  // =========================================================================
  // 4. PRESET 4: SỔ TAY THỰC VẬT – SCRAPBOOK THỦ CÔNG
  // =========================================================================
  public static compileBotanicalScrapbook(
    data: BotanicalScrapbookStyle,
    references: ImageReference[],
    targetedAction: string,
    targetedNote: string
  ): CompiledImagePrompt {
    const lockedTexts = [data.subject, ...(data.shortNotes || [])].filter(Boolean);
    const preservationRules = this.buildPreservationRules(references);

    const paletteStr = (data.palette || ['#2e7d32', '#d97706', '#be185d', '#fdfbf7']).join(', ');
    const notesStr = (data.shortNotes || []).map((n, i) => `Ghi chú ${i + 1}: "${n}"`).join('\n');
    const paperColor = data.basePaperColor || 'Giấy bột ngà tự nhiên (ivory/oatmeal paper) có xơ sợi thực vật';
    const supporting = (data.supportingElements || ['Giấy xé thủ công', 'Băng dính washi hoa lá', 'Doodle chú bọ']).join(', ');

    const masterPrompt = [
      `Tạo một trang sổ tay thực vật thủ công (Handcrafted Botanical Art Journal / Scrapbook) về: "${data.subject}".`,
      `Nền trang sổ: ${paperColor}, có texture hạt giấy nổi và vân giấy thô ráp mộc mạc.`,
      `Chủ thể trung tâm: Cây, hoa, lá hoặc quả Việt Nam được vẽ bằng chất liệu sáp màu dầu (oil pastel) và sáp màu crayon, các vệt sáp có độ dày và độ bám giấy thủ công rõ nét.`,
      `Xung quanh chủ thể: Bố trí các chi tiết trang trí scrapbook gồm: ${supporting}.`,
      `Hai khu vực chữ viết (Dual Typography System):`,
      `- VÙNG CHỮ MÁY ĐÁNH (Typewriter Zone): Ghi tên loài cây, đặc tính sinh học bằng font monospace máy chữ mực nhạt, phím chữ hơi xô lệch tự nhiên: ${data.typewriterStyle || 'Mực cơ học hoài niệm'}.`,
      `- VÙNG CHỮ VIẾT TAY (Handwritten Zone): Ghi chép cảm nghĩ, nhật ký quan sát học sinh bằng nét chữ chì mềm mại, tự nhiên: ${data.handwrittenStyle || 'Nét chì nắn nót học trò'}.`,
      `Nội dung các ghi chú cần thể hiện:`,
      notesStr,
      `Bảng màu chủ đạo: ${paletteStr}.`,
      `Tuyệt đối không dùng: Không chụp ảnh photorealistic, không 3D CGI bóng bẩy, không hình vector clip-art phẳng lì. Phải toát lên cảm giác sổ tay handmade chân thực do chính giáo viên hoặc học sinh ghi chép tỉ mỉ.`,
      `Toàn bộ chữ viết phải hiển thị đúng dấu tiếng Việt chính xác, không dịch sang tiếng Anh.`,
      this.compileTargetedActionDirective(targetedAction, targetedNote),
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      stylePreset: 'botanical_scrapbook',
      masterPrompt,
      systemDirective: 'Bạn là chuyên gia thiết kế sổ tay nghệ thuật thực vật thủ công (Botanical Scrapbook Artist).',
      vietnameseTextLocked: lockedTexts,
      preservationRules,
      prohibitedElements: [
        'Photorealism',
        '3D CGI kết xuất máy tính',
        'Vector clip-art phẳng lì',
        'Font chữ hiện đại vô cảm',
        'Mất dấu tiếng Việt',
      ],
      aspectRatio: '3:4',
      cultureTags: ['Thực vật Việt Nam', 'Hoa sen', 'Hoa phượng', 'Cây bàng', 'STEM sinh học'],
    };
  }

  // =========================================================================
  // 5. PRESET 5: MINH HỌA ĐỊA DANH TỐI GIẢN
  // =========================================================================
  public static compileGeographicEditorial(
    data: GeographicEditorialStyle,
    references: ImageReference[],
    targetedAction: string,
    targetedNote: string
  ): CompiledImagePrompt {
    const lockedTexts = [data.placeName, data.subtitle || ''].filter(Boolean);
    const preservationRules = this.buildPreservationRules(references);

    const paletteStr = (data.accentPalette || ['#0f172a', '#0284c7', '#d97706']).join(', ');
    const vignettesStr = (data.microVignetteElements || ['Danh lam di sản', 'Cảnh quan đặc trưng']).map((v) => `• ${v}`).join('\n');

    const masterPrompt = [
      `Tạo một tác phẩm minh họa editorial tối giản về địa danh: "${data.placeName}".`,
      data.subtitle ? `Dòng phụ đề: "${data.subtitle}".` : '',
      `Ý tưởng cốt lõi: Một hình bóng (silhouette) địa lí hoặc biểu tượng văn hóa thanh lịch của vùng đất này.`,
      `Bên trong và xung quanh silhouette là các hình ảnh thu nhỏ tinh tế (Micro-Vignettes):`,
      vignettesStr,
      `Phong cách nghệ thuật: Kết hợp hài hòa giữa Tối giản Bắc Âu (Scandinavian Minimalism) + Minh họa tạp chí Nhật Bản (Japanese Editorial Illustration) + Tâm hồn văn hóa Việt Nam thanh tao.`,
      `Nét vẽ: Fine-liner hữu cơ tinh xảo kết hợp các mảng màu nước loang nhẹ (watercolor wash), bố cục thoáng đạt, tôn trọng khoảng trắng tĩnh lặng.`,
      `Nền: Màu ngà sáng liền mạch toàn bộ khung hình, không có khung viền bao quanh (no borders, no frames), không có mockup hay pin bản đồ du lịch thương mại thô cứng.`,
      `Bảng màu điểm nhấn: ${paletteStr}.`,
      `Typography: Tên địa danh "${data.placeName}" hiển thị bằng font serif thanh lịch hoặc sans-serif cao cấp (Lora, Merriweather hoặc Be Vietnam Pro), giữ nguyên dấu tiếng Việt 100%, spacing hoàn hảo.`,
      this.compileTargetedActionDirective(targetedAction, targetedNote),
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      stylePreset: 'minimal_geographic_editorial',
      masterPrompt,
      systemDirective: 'Bạn là họa sĩ minh họa địa lí & văn hóa di sản Việt Nam theo trường phái Editorial Tối giản.',
      vietnameseTextLocked: lockedTexts,
      preservationRules,
      prohibitedElements: [
        'Khung viền giả lập tranh treo tường',
        'Map pin biểu tượng bản đồ du lịch thô',
        'Collage ảnh du lịch chắp vá',
        'Màu sắc sặc sỡ chói gắt',
        'Lỗi khoảng cách chữ hay mất dấu tiếng Việt',
      ],
      aspectRatio: '3:4',
      cultureTags: ['Di sản Việt Nam', 'Địa lí quê hương', 'Hà Nội', 'Huế', 'Hội An', 'Hạ Long', 'Tây Nguyên'],
    };
  }

  // =========================================================================
  // HELPER: PRESERVATION RULES CHO ẢNH THAM CHIẾU
  // =========================================================================
  private static buildPreservationRules(references: ImageReference[]): string[] {
    if (!references || references.length === 0) return [];

    const rules: string[] = [];

    references.forEach((ref, idx) => {
      const label = `Ảnh tham chiếu ${idx + 1}`;
      const strength = ref.preservationStrength.toUpperCase();

      switch (ref.type) {
        case 'character':
          rules.push(
            `[MỨC ĐỘ ${strength}] Giữ nguyên nhận diện nhân vật từ ${label}: khóa cấu trúc khuôn mặt, màu da, kiểu tóc và dáng dấp tổng thể.`
          );
          break;
        case 'face':
          rules.push(
            `[MỨC ĐỘ ${strength}] Giữ nguyên tuyệt đối đường nét khuôn mặt, ánh mắt và nụ cười từ ${label}.`
          );
          break;
        case 'outfit':
          rules.push(
            `[MỨC ĐỘ ${strength}] Giữ nguyên kiểu dáng trang phục, màu sắc áo quần và phụ kiện học sinh từ ${label}.`
          );
          break;
        case 'composition':
          rules.push(
            `[MỨC ĐỘ ${strength}] Tái hiện nhịp điệu bố cục không gian, tỷ lệ vàng và phân mảng từ ${label}.`
          );
          break;
        case 'color':
          rules.push(
            `[MỨC ĐỘ ${strength}] Trích xuất và áp dụng chính xác bảng màu, tông sáng tối từ ${label}.`
          );
          break;
        case 'style':
          rules.push(
            `[MỨC ĐỘ ${strength}] Trích xuất chất liệu nghệ thuật, cách đi nét và chất cảm bề mặt từ ${label} mà không sao chép chữ hay thương hiệu.`
          );
          break;
        case 'object':
          rules.push(
            `[MỨC ĐỘ ${strength}] Giữ nguyên vật thể chủ đạo từ ${label} trong khung cảnh mới.`
          );
          break;
        case 'inspiration':
        default:
          rules.push(
            `[MỨC ĐỘ ${strength}] Lấy cảm hứng về năng lượng thị giác từ ${label}, sáng tạo linh hoạt, không sao chép nguyên mẫu.`
          );
          break;
      }

      if (ref.customInstruction) {
        rules.push(`[YÊU CẦU RIÊNG CHO ${label}] ${ref.customInstruction}`);
      }
    });

    return rules;
  }

  // =========================================================================
  // HELPER: TARGETED EDIT DIRECTIVE
  // =========================================================================
  private static compileTargetedActionDirective(action: string, note: string): string {
    if (!action || action === 'normal') return '';

    if (action === 'edit_text') {
      return `[CHỈ ĐỊNH ĐIỀU CHỈNH CỤC BỘ: SỬA CHỮ]\nGiữ nguyên 100% bố cục, nhân vật và phong cách nền. Chỉ thay đổi lại nội dung văn bản theo ghi chú: "${note}".`;
    }
    if (action === 'change_character') {
      return `[CHỈ ĐỊNH ĐIỀU CHỈNH CỤC BỘ: ĐỔI NHÂN VẬT]\nGiữ nguyên bố cục không gian, bảng màu và các khối typography. Chỉ thay đổi ngoại hình/nhân vật theo ghi chú: "${note}".`;
    }
    if (action === 'change_palette') {
      return `[CHỈ ĐỊNH ĐIỀU CHỈNH CỤC BỘ: ĐỔI BẢNG MÀU]\nGiữ nguyên toàn bộ bố cục, nhân vật và typography. Chỉ chuyển đổi hệ màu sắc theo ghi chú: "${note}".`;
    }
    return '';
  }
}

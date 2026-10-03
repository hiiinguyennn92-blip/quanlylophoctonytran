import { VisualBrief, CompiledImagePrompt } from './visualBrief';
import { ImageEngine, DEFAULT_MODEL_CONFIG } from './modelRouter';

export class BananaPromptAdapter {
  public static compile(brief: VisualBrief, engine: ImageEngine = 'banana-2'): CompiledImagePrompt {
    const isEdit = brief.editContext?.isEdit || brief.intent === 'EDIT_IMAGE';
    const targetModel = engine === 'banana-pro' ? DEFAULT_MODEL_CONFIG.models.bananaPro : DEFAULT_MODEL_CONFIG.models.banana2;

    let promptText = '';

    if (isEdit) {
      // Banana Edit Prompt format
      const preserves = (brief.editContext?.preserve?.length ? brief.editContext.preserve : brief.preservationRules)
        .map((p) => `- ${p}`)
        .join('\n');
      const changes = (brief.editContext?.change?.length ? brief.editContext.change : ['Điều chỉnh theo yêu cầu mới'])
        .map((c) => `- ${c}`)
        .join('\n');

      promptText = `TARGET: Google Nano Banana (${engine}).

Đây là thao tác CHỈNH SỬA ảnh hiện có.

GIỮ NGUYÊN:
${preserves || '- Toàn bộ chủ thể và bố cục cốt lõi'}

CHỈ THAY ĐỔI:
${changes}

KHÔNG THAY ĐỔI:
- bố cục;
- góc nhìn;
- tỷ lệ;
- nhân vật;
- màu;
trừ khi được liệt kê trong phần CHỈ THAY ĐỔI.

Yêu cầu mới:
${brief.editContext?.editRequest || brief.purpose || 'Thực hiện tinh chỉnh chính xác'}`;
    } else {
      // Banana Master Template
      const readingOrderText = brief.composition.readingOrder?.length
        ? brief.composition.readingOrder.map((item, idx) => `${idx + 1}. ${item}`).join('\n')
        : '1. Tiêu đề chính\n2. Chủ thể trung tâm\n3. Chi tiết minh họa';

      const foregroundText = brief.foreground?.length ? brief.foreground.join(', ') : 'Rõ ràng, không che khuất điểm nhấn chính.';
      const centerText = brief.center?.length ? brief.center.join(', ') : brief.subject;
      const backgroundElementsText = brief.backgroundElements?.length ? brief.backgroundElements.join(', ') : brief.background || 'Đồng nhất, hỗ trợ thị giác.';
      const structureForm = brief.primaryStructure?.form || 'Bố cục cân đối, hài hòa chuẩn giáo dục.';
      const structureDetails = brief.primaryStructure?.details?.length
        ? brief.primaryStructure.details.map((d, idx) => `* Phần ${idx + 1}: ${d}`).join('\n')
        : 'Các khối thông tin sắp xếp lớp lang mạch lạc.';
      const flankingText = brief.flankingElements?.length ? brief.flankingElements.join(', ') : 'Biểu tượng học đường, họa tiết trang trí nhẹ nhàng.';

      const exactTextList = brief.text.enabled && brief.text.exactStrings?.length
        ? brief.text.exactStrings.map((t) => `"${t}"`).join('\n')
        : 'Không có chữ trong hình.';

      const hierarchyText = brief.text.hierarchy?.length
        ? brief.text.hierarchy.map((h, i) => `* Tầng ${i + 1}: ${h}`).join('\n')
        : '* Tiêu đề nổi bật\n* Nhãn hành động\n* Ghi chú bổ trợ';

      const preservationText = brief.preservationRules?.length
        ? brief.preservationRules.map((r) => `- ${r}`).join('\n')
        : '- Giữ tính khoa học, chuẩn mực sư phạm và nét văn hóa Việt Nam.';

      const prohibitedText = brief.prohibitedElements?.length
        ? brief.prohibitedElements.map((p) => `- Không ${p}`).join('\n')
        : '- Không watermark, không logo lạ, không chữ tiếng Anh vô nghĩa, không chi tiết rùng rợn hoặc méo mó.';

      promptText = `TARGET: Google Nano Banana 2 (${targetModel}).

[BLOCK 1: HỆ ĐIỀU HÀNH & MỤC TIÊU NGHỆ THUẬT (SYSTEM TARGET & DIRECTIVE)]
• Target Model: Google Nano Banana 2 (${targetModel})
• Vai trò: Master Pedagogical Art Director & Visual Educational Designer
• Mục đích thiết kế: ${brief.purpose}
• Đối tượng tiếp nhận: ${brief.audience}
• Định dạng sản phẩm: ${brief.presentationType}

[BLOCK 2: CHỦ THỂ TRUNG TÂM & BẢN SẮC HỌC ĐƯỜNG VIỆT NAM (SUBJECT & CULTURAL CONTEXT)]
• KHU VỰC TRUNG TÂM: ${centerText}
• Bản sắc văn hóa & bối cảnh: Học sinh tiểu học Việt Nam trong đồng phục tinh tươm (áo sơ mi trắng, quần/váy sẫm màu, khăn quàng đỏ Đội viên Thiếu niên Tiền phong rực rỡ từ lớp 3 trở lên), nét mặt tươi sáng, biểu cảm hồn nhiên, thân thiện và giàu năng lượng tích cực.
• Tương tác & Hành động chính: ${brief.subject}
• CẤU TRÚC CHÍNH (TINH CHỈNH THEO CHỦ ĐỀ): ${structureForm}
${structureDetails}
• Chi tiết phụ trợ: ${flankingText}

[BLOCK 3: PHONG CÁCH NGHỆ THUẬT & CHẤT LIỆU ĐỒ HỌA (ARTISTIC STYLE & MEDIUM)]
• Kỹ thuật tạo hình: ${brief.style.medium}
• Tính cách thị giác: ${brief.style.visualCharacter}
• Đường nét & Viền vẽ: ${brief.style.linework} - nét vẽ dứt khoát, sắc sảo, chống méo mó hoặc nhòe mờ.

[BLOCK 4: BỐ CỤC, THỨ TỰ QUAN SÁT & VÙNG AN TOÀN CHỮ (COMPOSITION, FLOW & TEXT SAFE ZONES)]
• Tỷ lệ khung hình chuẩn: ${brief.aspectRatio} (Bắt buộc giữ đúng tỷ lệ không co giãn)
• Bố cục không gian: ${brief.composition.layout}
• Điểm nhấn thị giác chính (Focal Point): ${brief.composition.focalPoint}
• THỨ TỰ QUAN SÁT:
${readingOrderText}
• TIỀN CẢNH: ${foregroundText}
• HẬU CẢNH: ${backgroundElementsText}
• Khoảng thở & Vùng an toàn chữ (Negative Space & Margins): Dành tối thiểu 15-20% diện tích thoáng sạch cho khoảng thở hoặc vị trí gắn tiêu đề, tuyệt đối không để chi tiết phụ chen chúc che khuất chữ.

[BLOCK 5: ÁNH SÁNG, BẦU KHÔNG KHÍ & BẢNG MÀU SƯ PHẠM (LIGHTING & COLOR HARMONY)]
• Chiếu sáng & Đổ bóng: ${brief.style.shading}, ánh sáng tự nhiên dịu nhẹ của buổi sáng sân trường Việt Nam.
• Bảng màu chủ đạo (Color Palette): ${brief.style.colorPalette?.join(', ') || '#059669 (Xanh ngọc sư phạm), #0284c7 (Xanh bầu trời), #f59e0b (Vàng nắng ấm), #f8fafc (Nền sáng)'}
• Cảm xúc truyền tải: Ấm áp, nhân văn, kích thích trí tò mò và niềm vui học tập của học sinh tiểu học.

[BLOCK 6: QUY CHUẨN KHÓA CHỮ TIẾNG VIỆT CÓ DẤU (EXACT VIETNAMESE TYPOGRAPHY)]
• CHỮ TRONG HÌNH (TINH CHỈNH THEO CHỦ ĐỀ):
${
  brief.text.enabled && brief.text.exactStrings?.length
    ? `• Danh sách chữ hiển thị bắt buộc (Exact Strings):
${exactTextList}
• Phân cấp kiểu chữ:
${hierarchyText}
• Tiêu chuẩn Font: ${brief.text.fontPreference || 'Be Vietnam Pro / Inter (Font Sans-serif hiện đại, dấu thanh tiếng Việt sắc nét)'}
• Nguyên tắc typographic: Hiển thị chính xác từng ký tự có dấu, không thêm bớt, không dịch, TUYỆT ĐỐI KHÔNG sinh chữ rác/chữ giả (Zero Lorem Ipsum / Gibberish).`
    : '• Hình ảnh đồ họa thuần túy, không chèn chữ ký tự.'
}

[BLOCK 7: BỘ LỌC CẤM & GIỚI HẠN AN TOÀN (NEGATIVE CONSTRAINTS & SANITIZER)]
• PHẢI GIỮ:
${preservationText}
• KHÔNG ĐƯỢC CÓ:
${prohibitedText}
• Không biến dạng bàn tay, thừa/thiếu ngón tay, mắt méo lệch (No anatomical deformation).
• Không biểu tượng ngoại lai không phù hợp học đường Việt Nam (Không xe bus vàng kiểu Mỹ, không ký hiệu lạ).
• Không watermark, không logo lạ, không màu sắc u ám/kinh dị.

[BLOCK 8: ĐỘ PHÂN GIẢI & TIÊU CHUẨN XUẤT BẢN (RESOLUTION & PRODUCTION FIDELITY)]
• Chuẩn đồ họa: 4K High Resolution, vector clarity, sắc nét từng chi tiết, sẵn sàng in ấn khổ lớn hoặc trình chiếu lớp học thông minh.`;
    }

    return {
      engine,
      model: targetModel,
      prompt: promptText,
      exactText: brief.text.enabled ? brief.text.exactStrings : [],
      aspectRatio: brief.aspectRatio,
      preservationRules: brief.preservationRules,
      prohibitedElements: brief.prohibitedElements,
      metadata: {
        purpose: brief.purpose,
        audience: brief.audience,
        presentationType: brief.presentationType,
        intent: String(brief.intent),
      },
      promptVersion: '1.2.0-banana-thematic',
    };
  }
}

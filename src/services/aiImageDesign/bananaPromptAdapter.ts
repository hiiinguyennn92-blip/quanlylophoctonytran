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

      promptText = `TARGET: Google Nano Banana (${engine}).

NHIỆM VỤ:
Tạo một hình ảnh hoàn chỉnh dùng cho: ${brief.purpose}
Đối tượng xem: ${brief.audience}

CHỦ ĐỀ:
${brief.subject}

CÁCH TRÌNH BÀY:
${brief.presentationType}

TỶ LỆ:
${brief.aspectRatio}
Thiết kế toàn bộ bố cục phù hợp chính xác với tỷ lệ này.

BỐ CỤC:
${brief.composition.layout}
Điểm nhấn chính: ${brief.composition.focalPoint}

THỨ TỰ QUAN SÁT:
Người xem cần nhìn theo thứ tự:
${readingOrderText}

Sử dụng:
* kích thước;
* tương phản;
* màu;
* khoảng trắng;
* hướng nhìn;
* đường dẫn thị giác;
để điều khiển thứ tự này.

TIỀN CẢNH:
${foregroundText}
Không che điểm nhấn chính.

KHU VỰC TRUNG TÂM:
${centerText}
Đây là chủ thể quan trọng nhất của hình.

HẬU CẢNH:
${backgroundElementsText}
Hậu cảnh phải hỗ trợ nội dung nhưng không cạnh tranh với chủ thể.

CẤU TRÚC CHÍNH (TINH CHỈNH THEO CHỦ ĐỀ):
Dạng cấu trúc: ${structureForm}
Chi tiết phân rã từng phần:
${structureDetails}

YẾU TỐ HỖ TRỢ:
${flankingText}

PHONG CÁCH:
Kỹ thuật: ${brief.style.medium}
Tính cách: ${brief.style.visualCharacter}
Đường nét: ${brief.style.linework}

ÁNH SÁNG & ĐỔ BÓNG:
${brief.style.shading}

BẢNG MÀU:
${brief.style.colorPalette?.join(', ') || 'Tươi sáng, sư phạm, hài hòa'}
Giữ màu nhất quán trên toàn hình.

CHỮ TRONG HÌNH (TINH CHỈNH THEO CHỦ ĐỀ):
${
  brief.text.enabled && brief.text.exactStrings?.length
    ? `Chỉ hiển thị các chuỗi sau:
${exactTextList}

Phân cấp chữ hiển thị:
${hierarchyText}

Quy chuẩn kiểu chữ:
${brief.text.fontPreference || 'Be Vietnam Pro / Inter (Font tiếng Việt chuẩn mực, rõ dấu)'}

Hiển thị chính xác từng chuỗi.
Không viết lại.
Không dịch.
Không thêm chữ ngoài danh sách.
Tất cả chữ phải:
* là tiếng Việt;
* đầy đủ dấu;
* dễ đọc;
* đúng chính tả.`
    : 'Hình ảnh không chứa chữ ký tự.'
}

PHẢI GIỮ:
${preservationText}
Những yếu tố này có ưu tiên cao. Không tự thay đổi.

KHÔNG ĐƯỢC CÓ:
${prohibitedText}

CHẤT LƯỢNG CUỐI:
Hình ảnh phải:
* dễ hiểu trong vài giây;
* có điểm nhấn rõ;
* bố cục cân bằng;
* không rối;
* có chiều sâu phù hợp;
* phù hợp đối tượng học sinh tiểu học Việt Nam;
* không chứa vật thể dư;
* không chứa chữ ngẫu nhiên.`;
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

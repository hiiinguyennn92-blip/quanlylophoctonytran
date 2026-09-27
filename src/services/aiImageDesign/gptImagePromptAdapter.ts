import { VisualBrief, CompiledImagePrompt } from './visualBrief';
import { DEFAULT_MODEL_CONFIG } from './modelRouter';

export class GptImagePromptAdapter {
  public static compile(brief: VisualBrief): CompiledImagePrompt {
    const isEdit = brief.editContext?.isEdit || brief.intent === 'EDIT_IMAGE';
    const targetModel = DEFAULT_MODEL_CONFIG.models.gptImage;

    let promptText = '';

    if (isEdit) {
      // GPT Image Edit Template
      const preserves = (brief.editContext?.preserve?.length ? brief.editContext.preserve : brief.preservationRules)
        .map((p) => `- ${p}`)
        .join('\n');
      const changes = (brief.editContext?.change?.length ? brief.editContext.change : ['Cập nhật chi tiết theo yêu cầu'])
        .map((c) => `- ${c}`)
        .join('\n');
      const locked = (brief.editContext?.lockedDetails?.length
        ? brief.editContext.lockedDetails
        : ['Chủ thể chính', 'Tỷ lệ', 'Góc nhìn']
      )
        .map((l) => `- ${l}`)
        .join('\n');

      promptText = `Đây là chỉnh sửa ảnh hiện tại.

## GIỮ NGUYÊN
${preserves || '- Toàn bộ kết cấu nền tảng'}

## THAY ĐỔI
${changes}

## KHÔNG THAY ĐỔI
${locked}

Ưu tiên giữ chính xác:
* chủ thể;
* vị trí;
* tỷ lệ;
* bố cục;
* các chi tiết nhận dạng;
trừ khi phần THAY ĐỔI yêu cầu khác.

Yêu cầu cụ thể: ${brief.editContext?.editRequest || brief.purpose}`;
    } else {
      // GPT Image Master Template with Thematic Structure and Typography
      const visibleDetails = [
        ...brief.foreground,
        ...brief.center,
        ...brief.backgroundElements,
        ...(brief.primaryStructure?.details || []),
      ]
        .filter(Boolean)
        .join(', ');

      const exactTextLines = brief.text.enabled && brief.text.exactStrings?.length
        ? brief.text.exactStrings.map((t) => `"${t}"`).join('\n')
        : 'Không thêm chữ vào hình.';

      const preserveLines = brief.preservationRules?.length
        ? brief.preservationRules.map((r) => `- ${r}`).join('\n')
        : '- Văn hóa học đường tiểu học Việt Nam trong sáng, chuẩn mực';

      const constraintsLines = brief.prohibitedElements?.length
        ? brief.prohibitedElements.map((p) => `- Không ${p}`).join('\n')
        : '- Không watermark, logo lạ, chi tiết méo mó hay chữ tiếng Anh rác';

      const hierarchyText = brief.text.hierarchy?.length
        ? brief.text.hierarchy.map((h) => `- ${h}`).join('\n')
        : '- Tiêu đề trên cùng\n- Nhãn hành động';

      promptText = `Tạo hình ảnh dùng cho: ${brief.purpose}.

## Cảnh
${brief.background || 'Không gian lớp học / thiên nhiên sư phạm sáng sủa'}

## Chủ thể
${brief.subject} (Dành cho: ${brief.audience})

## Bố cục & Cấu trúc chính theo chủ đề
Dạng cấu trúc: ${brief.primaryStructure.form}
Bố cục: ${brief.composition.layout}
Điểm nhấn chính: ${brief.composition.focalPoint}.
Thứ tự quan sát: ${brief.composition.readingOrder?.join(' → ') || 'Từ trung tâm ra xung quanh'}.

## Chi tiết nhìn thấy theo từng phần
${brief.primaryStructure.details?.map((d, i) => `Phần ${i + 1}: ${d}`).join('\n') || visibleDetails}

## Phong cách
${brief.style.medium} - ${brief.style.visualCharacter} (Đường nét: ${brief.style.linework})
Ánh sáng: ${brief.style.shading}
Màu: ${brief.style.colorPalette?.join(', ') || 'Tươi sáng, tự nhiên'}

## Chữ trong hình (Chuẩn mực tiếng Việt theo chủ đề)
${
  brief.text.enabled && brief.text.exactStrings?.length
    ? `Render chính xác từng chuỗi sau:
${exactTextLines}

Phân cấp chữ:
${hierarchyText}

Đặc tả font chữ:
${brief.text.fontPreference || 'Be Vietnam Pro / Inter'}

Yêu cầu nghiêm ngặt:
- Mỗi chuỗi chỉ xuất hiện số lần được yêu cầu.
- Không thêm chữ khác ngoài danh sách.
- Chữ tiếng Việt đầy đủ 100% dấu thanh.`
    : 'Không kết xuất chữ ký tự.'
}

## Phải giữ
${preserveLines}

## Không được có
${constraintsLines}

Tạo bố cục sạch, rõ ràng, giàu tính sư phạm và đúng mục đích sử dụng.`;
    }

    return {
      engine: 'gpt-image',
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
      promptVersion: '1.2.0-gpt-thematic',
    };
  }
}

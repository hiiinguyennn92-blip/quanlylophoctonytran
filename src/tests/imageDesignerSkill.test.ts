/**
 * AI Image Designer Skill - Architecture Verification Test Suite
 * Validates:
 * 1. Intent Classification & VisualBrief Construction (Model-Agnostic)
 * 2. Model Router (Banana 2 vs Banana Pro vs GPT Image)
 * 3. Banana Prompt Adapter (Format specification compliance)
 * 4. GPT Image Prompt Adapter (Separation from Banana syntax)
 * 5. Preservation Rules & Negative Constraint Engine
 * 6. Image Designer Skill Isolation (Zero coupling with business entities)
 */

import { VisualBriefBuilder, PromptCompiler } from '../services/aiImageDesign/visualBriefBuilder.ts';
import { ModelRouter } from '../services/aiImageDesign/modelRouter.ts';
import { BananaPromptAdapter } from '../services/aiImageDesign/bananaPromptAdapter.ts';
import { GptImagePromptAdapter } from '../services/aiImageDesign/gptImagePromptAdapter.ts';
import { ImageDesignerSkill } from '../services/aiImageDesign/imageDesignerSkill.ts';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    failCount++;
  }
}

export async function runImageDesignerSkillSuite() {
  console.log('================================================================');
  console.log('  TEST SUITE: NHÀ THIẾT KẾ HÌNH ẢNH AI (IMAGE DESIGNER SKILL)   ');
  console.log('  Primary Engine: Google Nano Banana · Adapter: GPT Image        ');
  console.log('================================================================\n');

  // Test 1: Intent Classifier & VisualBrief Construction
  console.log('>> [TEST 1] Intent Classifier & Model-Agnostic VisualBrief');
  const brief1 = VisualBriefBuilder.build({
    userPrompt: 'Tạo infographic vòng tuần hoàn nước dành cho học sinh lớp 3 gồm Bốc hơi, Ngưng tụ, Mưa, Thu gom.',
    targetAudience: 'Học sinh lớp 3',
    presentationType: 'Infographic chu trình',
    aspectRatio: '16:9',
  });

  assert(brief1.intent === 'INFOGRAPHIC', 'Phân loại đúng Intent = INFOGRAPHIC');
  assert(brief1.audience === 'Học sinh lớp 3', 'Bảo toàn đối tượng người xem');
  assert(brief1.composition.readingOrder.length >= 3, 'Xác định đầy đủ thứ tự quan sát (Reading Order)');
  assert(brief1.text.exactStrings.includes('VÒNG TUẦN HOÀN CỦA NƯỚC'), 'Khóa chính xác cụm chữ tiếng Việt tiêu đề');
  assert(brief1.text.exactStrings.some((s) => s.includes('Bốc hơi')), 'Khóa nhãn bước: Bốc hơi');
  assert(brief1.text.exactStrings.some((s) => s.includes('Ngưng tụ')), 'Khóa nhãn bước: Ngưng tụ');
  assert(brief1.text.exactStrings.some((s) => s.includes('Mưa')), 'Khóa nhãn bước: Mưa');
  assert(brief1.text.exactStrings.some((s) => s.includes('Thu gom')), 'Khóa nhãn bước: Thu gom');
  assert(brief1.primaryStructure.form.includes('Chu trình khép kín'), 'Tinh chỉnh cấu trúc chính đúng chủ đề nước');

  // Test 2: Model Router Decision Rules
  console.log('\n>> [TEST 2] Model Router & Engine Selection');
  const engineStandard = ModelRouter.selectEngine({ taskComplexity: 'standard' });
  assert(engineStandard === 'banana-2', 'Mặc định định tuyến sang Google Nano Banana 2 (gemini-3.1-flash-image)');

  const enginePro = ModelRouter.selectEngine({ taskComplexity: 'ultra', qualityPriority: true });
  assert(enginePro === 'banana-pro', 'Nhiệm vụ phức tạp định tuyến sang Nano Banana Pro (gemini-3-pro-image)');

  const engineGpt = ModelRouter.selectEngine({ userPreferredEngine: 'gpt-image' });
  assert(engineGpt === 'gpt-image', 'Chế độ người dùng chọn GPT Image được tôn trọng chính xác');

  // Test 3: Google Nano Banana Prompt Adapter Structure
  console.log('\n>> [TEST 3] Banana Prompt Adapter Compliance');
  const bananaCompiled = BananaPromptAdapter.compile(brief1, 'banana-2');
  assert(bananaCompiled.engine === 'banana-2', 'Engine = banana-2');
  assert(bananaCompiled.model === 'gemini-3.1-flash-image', 'Model mapped = gemini-3.1-flash-image');
  assert(bananaCompiled.prompt.includes('TARGET: Google Nano Banana'), 'Chứa Header TARGET: Google Nano Banana');
  assert(bananaCompiled.prompt.includes('THỨ TỰ QUAN SÁT:'), 'Chứa phân mục THỨ TỰ QUAN SÁT');
  assert(bananaCompiled.prompt.includes('TIỀN CẢNH:'), 'Chứa phân mục TIỀN CẢNH');
  assert(bananaCompiled.prompt.includes('KHU VỰC TRUNG TÂM:'), 'Chứa phân mục KHU VỰC TRUNG TÂM');
  assert(bananaCompiled.prompt.includes('HẬU CẢNH:'), 'Chứa phân mục HẬU CẢNH');
  assert(bananaCompiled.prompt.includes('PHẢI GIỮ:'), 'Chứa phân mục PHẢI GIỮ (Preservation)');
  assert(bananaCompiled.prompt.includes('KHÔNG ĐƯỢC CÓ:'), 'Chứa phân mục KHÔNG ĐƯỢC CÓ (Prohibited)');

  // Test 4: GPT Image Adapter Structure (Strict Isolation)
  console.log('\n>> [TEST 4] GPT Image Prompt Adapter (Separation from Banana)');
  const gptCompiled = GptImagePromptAdapter.compile(brief1);
  assert(gptCompiled.engine === 'gpt-image', 'Engine = gpt-image');
  assert(gptCompiled.prompt.includes('## Cảnh'), 'Sử dụng cấu trúc riêng của GPT Image (## Cảnh)');
  assert(gptCompiled.prompt.includes('## Chủ thể'), 'Sử dụng cấu trúc riêng ## Chủ thể');
  assert(gptCompiled.prompt.includes('## Bố cục'), 'Sử dụng cấu trúc riêng ## Bố cục');
  assert(!gptCompiled.prompt.includes('TARGET: Google Nano Banana'), 'Không bị trộn lẫn từ khóa Banana vào GPT Image prompt');

  // Test 5: Edit Mode Preservation Engine
  console.log('\n>> [TEST 5] Edit Mode & Preservation Engine');
  const editBrief = VisualBriefBuilder.build({
    userPrompt: 'Chỉnh sửa hình ảnh hiện tại',
    editContext: {
      isEdit: true,
      preserve: ['Khuôn mặt học sinh', 'Bố cục 4 bước chu trình'],
      change: ['Đổi màu áo học sinh sang màu vàng tươi'],
      lockedDetails: ['Góc camera', 'Tỷ lệ', 'Nhân vật'],
      editRequest: 'Chỉ thay đổi màu áo học sinh sang màu vàng',
    },
  });

  const bananaEdit = BananaPromptAdapter.compile(editBrief, 'banana-2');
  assert(bananaEdit.prompt.includes('Đây là thao tác CHỈNH SỬA ảnh hiện có.'), 'Nhận diện đúng câu lệnh chỉnh sửa');
  assert(bananaEdit.prompt.includes('Khuôn mặt học sinh'), 'Bảo toàn khuôn mặt học sinh trong GIỮ NGUYÊN');
  assert(bananaEdit.prompt.includes('Đổi màu áo học sinh sang màu vàng tươi'), 'Ghi nhận thay đổi duy nhất trong CHỈ THAY ĐỔI');

  // Test 6: ImageDesignerSkill End-to-End Orchestration
  console.log('\n>> [TEST 6] ImageDesignerSkill End-to-End Execution');
  const result = await ImageDesignerSkill.executeDesign({
    userPrompt: 'Quy trình 5 bước rửa tay phòng chống dịch bệnh cho học sinh lớp 1',
    targetAudience: 'Học sinh Lớp 1',
    presentationType: 'Infographic quy trình',
    hasText: true,
    aspectRatio: '3:4',
  });

  assert(!!result.visualBrief, 'Tạo thành công VisualBrief trung gian');
  assert(!!result.compiledPrompt, 'Biên dịch thành công Master Prompt');
  assert(!!result.alternativeBananaPrompt, 'Chuẩn bị sẵn Export Prompt cho Nano Banana');
  assert(!!result.alternativeGptPrompt, 'Chuẩn bị sẵn Export Prompt cho GPT Image');
  assert(!!result.artifact?.imageUrl, 'Sinh ra hình ảnh thị giác hợp lệ');
  assert(result.qaResult.overallScore >= 80, 'Image QA Engine kiểm tra chất lượng đạt điểm cao');

  console.log('\n================================================================');
  console.log(`  TỔNG KẾT: ${passCount} / ${passCount + failCount} TESTS PASSED`);
  if (failCount === 0) {
    console.log('  TẤT CẢ CÁC NGUYÊN TẮC CỦA MASTER PROMPT ĐÃ ĐẠT 100%! ');
  } else {
    console.error(`  CÓ ${failCount} TEST THẤT BẠI!`);
  }
  console.log('================================================================\n');

  return failCount === 0;
}

// Auto-run if executed directly via Node / tsx
if (import.meta.url.endsWith(process.argv[1] || '')) {
  runImageDesignerSkillSuite().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}

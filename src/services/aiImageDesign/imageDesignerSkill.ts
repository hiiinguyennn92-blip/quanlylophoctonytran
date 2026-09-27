import { VisualBrief, CompiledImagePrompt } from './visualBrief';
import { ImageEngine, ModelRouter, RouteDecisionFactors } from './modelRouter';
import { VisualBriefBuilder, VisualBriefBuilderParams, PromptCompiler } from './visualBriefBuilder';
import { ImageModelAdapter } from './imageModelAdapter';
import { ImageQAEngine } from './imageQA';
import { ImageQAResult, DesignedImageArtifact } from './types';

export interface ImageDesignerRequest {
  // Simple Input cho Giáo viên
  userPrompt: string; // Bạn muốn tạo hình gì?
  targetAudience?: string; // Dành cho ai?
  presentationType?: string; // Kiểu hình?
  hasText?: boolean; // Có chữ không?
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16' | string; // Tỷ lệ?

  // Lựa chọn Model / Tùy chọn nâng cao
  preferredEngine?: ImageEngine;
  exactStrings?: string[];
  referenceImages?: any[];

  // Chế độ nâng cao (Advanced Mode)
  isAdvanced?: boolean;
  advancedParams?: {
    compositionLayout?: string;
    focalPoint?: string;
    foreground?: string[];
    center?: string[];
    backgroundElements?: string[];
    customPalette?: string[];
    preservationRules?: string[];
    prohibitedElements?: string[];
    styleMedium?: string;
  };

  // Chế độ chỉnh sửa (Edit mode)
  editContext?: {
    isEdit: boolean;
    preserve: string[];
    change: string[];
    lockedDetails: string[];
    editRequest?: string;
  };
}

export interface ImageDesignerResult {
  visualBrief: VisualBrief;
  compiledPrompt: CompiledImagePrompt;
  alternativeGptPrompt?: CompiledImagePrompt;
  alternativeBananaPrompt?: CompiledImagePrompt;
  selectedEngine: ImageEngine;
  artifact: DesignedImageArtifact;
  qaResult: ImageQAResult;
}

/**
 * ImageDesignerSkill
 * Lớp logic điều phối độc lập của NHÀ THIẾT KẾ HÌNH ẢNH AI (Google Nano Banana + GPT Image)
 * - Tách biệt hoàn toàn với StudentRepository, Attendance, Assessment, Parent, v.v.
 * - Nhận Teacher Request -> Xây dựng VisualBrief -> Chọn Model Router -> Compile Prompt -> Sinh ảnh -> QA
 */
export class ImageDesignerSkill {
  public static async executeDesign(request: ImageDesignerRequest): Promise<ImageDesignerResult> {
    // 1. Phân loại và xây dựng VisualBrief trung gian
    const briefParams: VisualBriefBuilderParams = {
      userPrompt: request.userPrompt,
      targetAudience: request.targetAudience,
      presentationType: request.presentationType,
      aspectRatio: request.aspectRatio || '16:9',
      hasText: request.hasText,
      exactStrings: request.exactStrings,
      editContext: request.editContext,
      referenceCount: request.referenceImages?.length || 0,
      ...(request.isAdvanced && request.advancedParams ? request.advancedParams : {}),
    };

    const visualBrief = VisualBriefBuilder.build(briefParams);

    // 2. Định tuyến Model qua ModelRouter
    const decisionFactors: RouteDecisionFactors = {
      taskComplexity: request.isAdvanced ? 'high' : 'standard',
      referenceCount: request.referenceImages?.length || 0,
      textDensity: visualBrief.text.exactStrings.length > 4 ? 'high' : 'medium',
      editMode: !!request.editContext?.isEdit,
      userPreferredEngine: request.preferredEngine,
    };

    const selectedEngine = ModelRouter.selectEngine(decisionFactors);

    // 3. Compile Master Prompt cho Engine đã chọn
    const compiledPrompt = PromptCompiler.compile(visualBrief, selectedEngine);

    // 4. Chuẩn bị cả prompt đối chiếu cho phép xuất prompt (Copy Nano Banana & Copy GPT Image)
    const alternativeBananaPrompt =
      selectedEngine === 'gpt-image'
        ? PromptCompiler.compile(visualBrief, 'banana-2')
        : compiledPrompt;

    const alternativeGptPrompt =
      selectedEngine === 'gpt-image'
        ? compiledPrompt
        : PromptCompiler.compile(visualBrief, 'gpt-image');

    // 5. Gửi sang ImageModelAdapter để sinh ảnh an toàn
    const artifact = await ImageModelAdapter.generateImage({
      stylePreset: 'community_safety_editorial',
      mode: request.isAdvanced ? 'advanced' : 'simple',
      styleInputs: {
        preset: 'community_safety_editorial',
        data: {
          sceneSubject: visualBrief.subject,
          mainMessage: visualBrief.text.exactStrings[0] || visualBrief.subject,
          safetyActions: visualBrief.text.exactStrings.slice(1),
          environment: visualBrief.background,
        },
      },
      referenceImages: request.referenceImages || [],
      customAspectRatio: visualBrief.aspectRatio as any,
      customPromptOverride: compiledPrompt.prompt,
    });

    // 6. Gán thêm metadata engine và prompt vào artifact
    artifact.compiledPrompt = {
      ...artifact.compiledPrompt,
      masterPrompt: compiledPrompt.prompt,
      vietnameseTextLocked: visualBrief.text.exactStrings,
      preservationRules: visualBrief.preservationRules,
      prohibitedElements: visualBrief.prohibitedElements,
      aspectRatio: visualBrief.aspectRatio as any,
    };

    return {
      visualBrief,
      compiledPrompt,
      alternativeBananaPrompt,
      alternativeGptPrompt,
      selectedEngine,
      artifact,
      qaResult: artifact.qaResult,
    };
  }
}

/**
 * Core types for AI Image Design Skill
 * Trợ lý Chủ nhiệm AI - Thiết kế hình ảnh sư phạm & cộng đồng
 */

export type StylePresetId =
  | 'community_safety_editorial'
  | 'youth_promo_mixed_media'
  | 'three_panel_story_collage'
  | 'botanical_scrapbook'
  | 'minimal_geographic_editorial';

export type StyleCategory =
  | 'all'
  | 'education'
  | 'poster'
  | 'storytelling'
  | 'event'
  | 'science'
  | 'nature'
  | 'culture'
  | 'geography'
  | 'scrapbook';

export interface StylePresetMetadata {
  id: StylePresetId;
  nameVi: string;
  shortDescVi: string;
  categories: StyleCategory[];
  artStyle: string;
  aspectRatios: Array<'1:1' | '3:4' | '4:3' | '16:9' | '9:16'>;
  defaultAspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  suitableFor: string[];
  colorPaletteDefault: string[];
}

// -------------------------------------------------------------
// PRESET 1: POSTER CỘNG ĐỒNG – THÔNG TIN AN TOÀN
// -------------------------------------------------------------
export interface CommunitySafetyStyle {
  sceneSubject: string;
  mainMessage: string;
  safetyActions: string[];
  environment?: string;
  mainCharacter?: string;
  foregroundObjects?: string[];
  supportingIcons?: string[];
  primaryColor?: string;
  secondaryColor?: string;
}

// -------------------------------------------------------------
// PRESET 2: POSTER QUẢNG BÁ TRẺ TRUNG – MIXED MEDIA
// -------------------------------------------------------------
export interface YouthPromoStyle {
  subjectIdentity: string;
  subjectPose?: string;
  wardrobe?: string;
  deviceOrObject?: string;

  headlineLine1: string;
  headlineLine2?: string;

  campaignLabel?: string;
  footerMainText?: string;
  footerSecondaryText?: string;

  backgroundWord?: string;

  backgroundColor?: string;
  contourColor?: string;
  headlineAccentColor?: string;
  stickerColor?: string;
  doodleColors?: string[];
}

// -------------------------------------------------------------
// PRESET 3: POSTER COLLAGE KỂ CHUYỆN 3 PHẦN
// -------------------------------------------------------------
export interface PanelStoryItem {
  panelNumber: 1 | 2 | 3;
  panelTitle: string;
  actionDescription: string;
  settingOrTime: string;
  speechOrCaption?: string;
}

export interface ThreePanelStoryStyle {
  storyTitle: string;
  storyTheme: string;
  characterDescription: string;
  panels: [PanelStoryItem, PanelStoryItem, PanelStoryItem];
  colorTone?: string;
  lockCharacterFace?: boolean;
  lockCharacterOutfit?: boolean;
}

// -------------------------------------------------------------
// PRESET 4: SỔ TAY THỰC VẬT – SCRAPBOOK THỦ CÔNG
// -------------------------------------------------------------
export interface BotanicalScrapbookStyle {
  subject: string;
  palette?: string[];
  shortNotes: string[];

  typewriterStyle?: string;
  handwrittenStyle?: string;

  basePaperColor?: string;
  supportingElements?: string[];
}

// -------------------------------------------------------------
// PRESET 5: MINH HỌA ĐỊA DANH TỐI GIẢN
// -------------------------------------------------------------
export interface GeographicEditorialStyle {
  placeName: string;
  subtitle?: string;
  microVignetteElements: string[];

  accentPalette?: string[];
  silhouetteType?: 'geographic' | 'symbolic';
}

// -------------------------------------------------------------
// REFERENCE IMAGES
// -------------------------------------------------------------
export type ReferencePurpose =
  | 'character'
  | 'face'
  | 'outfit'
  | 'composition'
  | 'color'
  | 'style'
  | 'object'
  | 'inspiration';

export type PreservationStrength = 'low' | 'medium' | 'high';

export interface ImageReference {
  id: string;
  name: string;
  dataUrl: string; // base64
  mimeType: string;
  sizeBytes: number;
  type: ReferencePurpose;
  preservationStrength: PreservationStrength;
  uploadedAt: string;
  customInstruction?: string;
}

// -------------------------------------------------------------
// COMPILED PROMPT & GENERATION
// -------------------------------------------------------------
export interface CompiledImagePrompt {
  stylePreset: StylePresetId;
  masterPrompt: string;
  systemDirective: string;
  vietnameseTextLocked: string[];
  preservationRules: string[];
  prohibitedElements: string[];
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  cultureTags: string[];
}

export interface ImageGenerationRequest {
  stylePreset: StylePresetId;
  mode: 'simple' | 'advanced';
  styleInputs:
    | { preset: 'community_safety_editorial'; data: CommunitySafetyStyle }
    | { preset: 'youth_promo_mixed_media'; data: YouthPromoStyle }
    | { preset: 'three_panel_story_collage'; data: ThreePanelStoryStyle }
    | { preset: 'botanical_scrapbook'; data: BotanicalScrapbookStyle }
    | { preset: 'minimal_geographic_editorial'; data: GeographicEditorialStyle };
  referenceImages?: ImageReference[];
  targetedAction?: 'normal' | 'edit_text' | 'change_character' | 'change_palette';
  targetedNote?: string;
  customAspectRatio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  customPromptOverride?: string;
}

// -------------------------------------------------------------
// IMAGE QA
// -------------------------------------------------------------
export interface ImageQAItem {
  key: string;
  label: string;
  passed: boolean;
  score: number; // 0 - 100
  note: string;
}

export interface ImageQAResult {
  overallScore: number;
  isApproved: boolean;
  commonChecks: {
    subjectCorrect: ImageQAItem;
    layoutCorrect: ImageQAItem;
    vietnameseTextCorrect: ImageQAItem;
    culturalFit: ImageQAItem;
    preservationMatch: ImageQAItem;
    prohibitedElementsDetected: ImageQAItem;
    characterConsistency: ImageQAItem;
    styleMatch: ImageQAItem;
    needsReview: boolean;
  };
  styleSpecificChecks: ImageQAItem[];
  feedbackNotes: string[];
}

export interface DesignedImageArtifact {
  id: string;
  imageUrl: string;
  compiledPrompt: CompiledImagePrompt;
  qaResult: ImageQAResult;
  createdAt: string;
  stylePreset: StylePresetId;
  inputs: any;
  referencesUsedCount: number;
}

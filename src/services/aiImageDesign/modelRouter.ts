/**
 * Model Router & Engine definitions for AI Image Designer Skill
 * Targeted for:
 * 1. Primary: Google Nano Banana (Banana 2: gemini-3.1-flash-image, Banana Pro: gemini-3-pro-image)
 * 2. Secondary: GPT Image
 */

export type ImageEngine = 'banana-2' | 'banana-pro' | 'gpt-image';

export interface ModelEngineConfig {
  defaultEngine: ImageEngine;
  models: {
    banana2: string; // 'gemini-3.1-flash-image' (Nano Banana 2)
    bananaPro: string; // 'gemini-3-pro-image' (Nano Banana Pro)
    gptImage: string; // 'gpt-image' adapter
  };
}

export const DEFAULT_MODEL_CONFIG: ModelEngineConfig = {
  defaultEngine: 'banana-2',
  models: {
    banana2: 'gemini-3.1-flash-image',
    bananaPro: 'gemini-3-pro-image',
    gptImage: 'gpt-image-standard',
  },
};

export interface RouteDecisionFactors {
  taskComplexity?: 'standard' | 'high' | 'ultra';
  referenceCount?: number;
  textDensity?: 'low' | 'medium' | 'high';
  editMode?: boolean;
  qualityPriority?: boolean;
  latencyPriority?: boolean;
  userPreferredEngine?: ImageEngine;
}

export class ModelRouter {
  public static selectEngine(factors: RouteDecisionFactors): ImageEngine {
    if (factors.userPreferredEngine) {
      return factors.userPreferredEngine;
    }

    // High complexity, multiple references, or ultra quality demands -> Banana Pro
    if (
      factors.qualityPriority ||
      factors.taskComplexity === 'ultra' ||
      (factors.referenceCount && factors.referenceCount >= 3)
    ) {
      return 'banana-pro';
    }

    // Default Banana 2 (gemini-3.1-flash-image)
    return 'banana-2';
  }

  public static getEngineDisplayName(engine: ImageEngine): string {
    switch (engine) {
      case 'banana-2':
        return 'Google Nano Banana 2 (gemini-3.1-flash-image)';
      case 'banana-pro':
        return 'Google Nano Banana Pro (gemini-3-pro-image)';
      case 'gpt-image':
        return 'GPT Image Model Adapter';
      default:
        return engine;
    }
  }
}

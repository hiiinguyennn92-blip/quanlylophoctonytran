import { ImageEngine } from './modelRouter';

export type VisualIntent =
  | 'ILLUSTRATION'
  | 'INFOGRAPHIC'
  | 'PROCESS'
  | 'STORY'
  | 'POSTER'
  | 'DIAGRAM'
  | 'TIMELINE'
  | 'CUTAWAY'
  | 'CHARACTER'
  | 'LOCATION'
  | 'CLASSROOM'
  | 'EDIT_IMAGE'
  | 'RESTYLE_IMAGE'
  | 'COMPOSITE_IMAGE';

export interface VisualBrief {
  intent: VisualIntent | string;

  subject: string;
  audience: string;
  purpose: string;

  presentationType: string;

  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16' | string;
  orientation?: 'landscape' | 'portrait' | 'square';

  background: string;

  composition: {
    layout: string;
    focalPoint: string;
    readingOrder: string[];
  };

  foreground: string[];
  center: string[];
  backgroundElements: string[];

  primaryStructure: {
    form: string;
    details: string[];
  };

  flankingElements: string[];

  text: {
    enabled: boolean;
    exactStrings: string[];
    hierarchy?: string[];
    fontPreference?: string;
  };

  style: {
    medium: string;
    visualCharacter: string;
    linework: string;
    shading: string;
    colorPalette: string[];
  };

  preservationRules: string[];

  prohibitedElements: string[];

  references?: {
    description: string;
    preservationPriority: string[];
  }[];

  editContext?: {
    isEdit: boolean;
    preserve: string[];
    change: string[];
    lockedDetails: string[];
    editRequest?: string;
  };
}

export interface CompiledImagePrompt {
  engine: ImageEngine;
  model: string;
  prompt: string;
  exactText: string[];
  aspectRatio: string;
  preservationRules: string[];
  prohibitedElements: string[];
  metadata: {
    purpose: string;
    audience: string;
    presentationType: string;
    intent: string;
  };
  promptVersion: string;
}

export interface ImagePromptCompilerInterface {
  compile(brief: VisualBrief, engine: ImageEngine): CompiledImagePrompt;
}

/**
 * AGENTIC SKILL ARCHITECTURE - CORE TYPE DEFINITIONS
 * 
 * Chuẩn hóa kiến trúc Agent Skill độc lập, có thể mở rộng (Open-Closed Principle),
 * định nghĩa hợp đồng Input/Output, Semantic Triggers, Context Injection và Action Dispatcher.
 */

export type AgentSkillCategory =
  | 'safety'
  | 'pedagogical'
  | 'spatial'
  | 'communication'
  | 'schedule'
  | 'creative'
  | 'analysis';

export type AgentSkillActionType =
  | 'zalo_message'
  | 'task_create'
  | 'seating_view'
  | 'assessment_input'
  | 'image_design'
  | 'schedule_view'
  | 'journal_record';

export interface AgentSkillAction {
  type: AgentSkillActionType;
  title: string;
  description?: string;
  payload?: any;
}

export type SkillRouteId =
  | 'image_design'
  | 'circular_27'
  | 'early_warning'
  | 'classroom_dynamics'
  | 'lesson_schedule'
  | 'parent_bridge'
  | 'student_journal_analyzer'
  | 'general';

export interface RoutedSkillInfo {
  id: SkillRouteId;
  name: string;
  badge: string;
  modelUsed: string;
  directiveSummary?: string;
}

export interface ImagePromptBlueprint {
  subject: string;
  aspectRatio: string;
  stylePreset: string;
  masterPrompt8Block: string;
  exactVietnameseText: string[];
  negativeConstraints: string[];
}

export interface SkillTriggerRule {
  /** Các từ khóa có trọng số */
  keywords: string[];
  /** Trọng số điểm (ví dụ 1.0, 1.5, 2.0) */
  weight: number;
  /** Từ khóa loại trừ: nếu xuất hiện thì giảm hoặc triệt tiêu điểm */
  negativeKeywords?: string[];
  /** Cụm từ chính xác cần có */
  exactPhrases?: string[];
}

export interface AgentSkillDefinition {
  id: SkillRouteId;
  name: string;
  badge: string;
  category: AgentSkillCategory;
  iconName: string;
  color: string;
  description: string;
  samplePrompt: string;
  capabilities: string[];
  actionType: string;
  modelUsed: string;
  directiveSummary: string;
  triggers: SkillTriggerRule[];
  systemDirective: string;
  createContextualPrompt: (student: any | null, defaultPrompt: string) => string;
  validateActionPayload?: (payload: any) => boolean;
}

export interface SkillMatchResult {
  skill: AgentSkillDefinition;
  score: number;
  matchedKeywords: string[];
  reason: string;
}

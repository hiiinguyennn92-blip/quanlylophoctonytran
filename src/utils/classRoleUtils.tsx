import React from 'react';
import {
  Crown,
  GraduationCap,
  Sparkles,
  Music,
  ShieldCheck,
  Award,
  Users,
  UserCheck,
  Flag,
  Mic,
  Coins,
  Star,
  BadgeCheck,
  Shield,
} from 'lucide-react';

export interface ClassRoleDefinition {
  title: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconColorClass: string;
  description: string;
}

export const CLASS_ROLES: Record<string, ClassRoleDefinition> = {
  'Lớp trưởng': {
    title: 'Lớp trưởng',
    label: 'Lớp trưởng',
    shortLabel: 'Lớp trưởng',
    icon: Crown,
    color: 'amber',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-800',
    iconColorClass: 'text-amber-600',
    description: 'Chỉ huy chung, điều hành các hoạt động của tập thể lớp',
  },
  'Lớp phó học tập': {
    title: 'Lớp phó học tập',
    label: 'Lớp phó học tập',
    shortLabel: 'LP Học tập',
    icon: GraduationCap,
    color: 'blue',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-800',
    iconColorClass: 'text-blue-600',
    description: 'Đôn đốc việc chuẩn bị bài vở, truy bài 15 phút đầu giờ và học nhóm',
  },
  'Lớp phó lao động': {
    title: 'Lớp phó lao động',
    label: 'Lớp phó lao động',
    shortLabel: 'LP Lao động',
    icon: Sparkles,
    color: 'emerald',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-800',
    iconColorClass: 'text-emerald-600',
    description: 'Phụ trách vệ sinh lớp học, trực nhật, chăm sóc bồn hoa cây cảnh',
  },
  'Lớp phó văn thể mỹ': {
    title: 'Lớp phó văn thể mỹ',
    label: 'Lớp phó văn thể mỹ',
    shortLabel: 'LP Văn thể',
    icon: Music,
    color: 'purple',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    textClass: 'text-purple-800',
    iconColorClass: 'text-purple-600',
    description: 'Tổ chức các hoạt động văn nghệ, thể dục giữa giờ và phong trào thi đua',
  },
  'Lớp phó trật tự': {
    title: 'Lớp phó trật tự',
    label: 'Lớp phó trật tự',
    shortLabel: 'LP Trật tự',
    icon: ShieldCheck,
    color: 'orange',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    textClass: 'text-orange-800',
    iconColorClass: 'text-orange-600',
    description: 'Nhắc nhở nề nếp, duy trì sự trật tự, kỷ cương giờ học và giờ nghỉ',
  },
  'Lớp phó': {
    title: 'Lớp phó',
    label: 'Lớp phó',
    shortLabel: 'Lớp phó',
    icon: Award,
    color: 'indigo',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    textClass: 'text-indigo-800',
    iconColorClass: 'text-indigo-600',
    description: 'Hỗ trợ Lớp trưởng quán xuyến các công việc hàng ngày của lớp',
  },
  'Tổ trưởng': {
    title: 'Tổ trưởng',
    label: 'Tổ trưởng',
    shortLabel: 'Tổ trưởng',
    icon: Users,
    color: 'teal',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200',
    textClass: 'text-teal-800',
    iconColorClass: 'text-teal-600',
    description: 'Quản lý, theo dõi việc học tập và nề nếp của các thành viên trong tổ',
  },
  'Tổ phó': {
    title: 'Tổ phó',
    label: 'Tổ phó',
    shortLabel: 'Tổ phó',
    icon: UserCheck,
    color: 'cyan',
    bgClass: 'bg-cyan-50',
    borderClass: 'border-cyan-200',
    textClass: 'text-cyan-800',
    iconColorClass: 'text-cyan-600',
    description: 'Hỗ trợ Tổ trưởng kiểm tra bài đầu giờ và nề nếp tổ',
  },
  'Cờ đỏ': {
    title: 'Cờ đỏ',
    label: 'Cờ đỏ (Sao đỏ)',
    shortLabel: 'Cờ đỏ',
    icon: Flag,
    color: 'rose',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    textClass: 'text-rose-800',
    iconColorClass: 'text-rose-600',
    description: 'Thành viên Đội Cờ đỏ / Sao đỏ chấm thi đua và nề nếp toàn trường',
  },
  'Quản ca': {
    title: 'Quản ca',
    label: 'Quản ca',
    shortLabel: 'Quản ca',
    icon: Mic,
    color: 'pink',
    bgClass: 'bg-pink-50',
    borderClass: 'border-pink-200',
    textClass: 'text-pink-800',
    iconColorClass: 'text-pink-600',
    description: 'Bắt nhịp bài hát đầu giờ, giữa giờ và các buổi sinh hoạt lớp',
  },
  'Thủ quỹ': {
    title: 'Thủ quỹ',
    label: 'Thủ quỹ lớp',
    shortLabel: 'Thủ quỹ',
    icon: Coins,
    color: 'yellow',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
    textClass: 'text-yellow-800',
    iconColorClass: 'text-yellow-600',
    description: 'Ghi chép và quản lý quỹ nhỏ cho hoạt động tập thể lớp',
  },
  'Ban cán sự': {
    title: 'Ban cán sự',
    label: 'Ban cán sự lớp',
    shortLabel: 'Ban cán sự',
    icon: Star,
    color: 'violet',
    bgClass: 'bg-violet-50',
    borderClass: 'border-violet-200',
    textClass: 'text-violet-800',
    iconColorClass: 'text-violet-600',
    description: 'Thành viên Ban cán sự phụ trách công tác chuyên trách',
  },
};

export const CLASS_ROLE_LIST = Object.values(CLASS_ROLES);

/**
 * Tìm kiếm cấu hình danh hiệu cán bộ lớp
 */
export function getClassRoleConfig(roleTitle?: string): ClassRoleDefinition | null {
  if (!roleTitle || !roleTitle.trim()) return null;
  const trimmed = roleTitle.trim();

  // Tìm đối sánh trực tiếp
  if (CLASS_ROLES[trimmed]) {
    return CLASS_ROLES[trimmed];
  }

  // Đối sánh gần đúng
  const lower = trimmed.toLowerCase();
  if (lower.includes('lớp trưởng')) return CLASS_ROLES['Lớp trưởng'];
  if (lower.includes('học tập')) return CLASS_ROLES['Lớp phó học tập'];
  if (lower.includes('lao động')) return CLASS_ROLES['Lớp phó lao động'];
  if (lower.includes('văn thể') || lower.includes('văn nghệ')) return CLASS_ROLES['Lớp phó văn thể mỹ'];
  if (lower.includes('trật tự') || lower.includes('kỷ luật')) return CLASS_ROLES['Lớp phó trật tự'];
  if (lower.includes('lớp phó')) return CLASS_ROLES['Lớp phó'];
  if (lower.includes('tổ trưởng')) return CLASS_ROLES['Tổ trưởng'];
  if (lower.includes('tổ phó')) return CLASS_ROLES['Tổ phó'];
  if (lower.includes('cờ đỏ') || lower.includes('sao đỏ')) return CLASS_ROLES['Cờ đỏ'];
  if (lower.includes('quản ca') || lower.includes('hát')) return CLASS_ROLES['Quản ca'];
  if (lower.includes('thủ quỹ')) return CLASS_ROLES['Thủ quỹ'];
  if (lower.includes('cán sự')) return CLASS_ROLES['Ban cán sự'];

  // Dự phòng cho danh hiệu tùy chỉnh khác do giáo viên tự nhập
  return {
    title: trimmed,
    label: trimmed,
    shortLabel: trimmed,
    icon: BadgeCheck,
    color: 'slate',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-800',
    iconColorClass: 'text-slate-600',
    description: trimmed,
  };
}

/**
 * Component hiển thị Huy hiệu Cán bộ lớp có Icon riêng biệt
 */
export const ClassRoleBadge: React.FC<{
  roleTitle?: string;
  size?: 'xs' | 'sm' | 'md';
  showIconOnly?: boolean;
  className?: string;
}> = ({ roleTitle, size = 'sm', showIconOnly = false, className = '' }) => {
  const config = getClassRoleConfig(roleTitle);
  if (!config) return null;

  const IconComp = config.icon;

  const sizeClasses = {
    xs: {
      badge: 'px-1.5 py-0.5 text-[9px] gap-1',
      icon: 'w-2.5 h-2.5',
    },
    sm: {
      badge: 'px-2 py-0.5 text-[10px] gap-1',
      icon: 'w-3 h-3',
    },
    md: {
      badge: 'px-2.5 py-1 text-xs gap-1.5',
      icon: 'w-3.5 h-3.5',
    },
  }[size];

  if (showIconOnly) {
    return (
      <span
        title={config.label + ': ' + config.description}
        className={`inline-flex items-center justify-center p-1 rounded-md border ${config.bgClass} ${config.borderClass} ${config.iconColorClass} ${className}`}
      >
        <IconComp className={sizeClasses.icon} />
      </span>
    );
  }

  return (
    <span
      title={config.label + ': ' + config.description}
      className={`inline-flex items-center font-bold rounded-md border shadow-2xs transition-colors shrink-0 ${sizeClasses.badge} ${config.bgClass} ${config.borderClass} ${config.textClass} ${className}`}
    >
      <IconComp className={`${sizeClasses.icon} ${config.iconColorClass} shrink-0`} />
      <span className="truncate">{config.shortLabel}</span>
    </span>
  );
};

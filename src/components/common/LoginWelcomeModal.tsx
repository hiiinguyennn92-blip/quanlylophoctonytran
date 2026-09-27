import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, CheckCircle2, HeartHandshake, ShieldCheck, X, Award, ArrowRight } from 'lucide-react';
import { UserProfile } from '../../types';

interface LoginWelcomeModalProps {
  user: UserProfile | null;
  onClose: () => void;
  onExplore?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
  shape: 'circle' | 'square' | 'pill';
}

export const LoginWelcomeModal: React.FC<LoginWelcomeModalProps> = ({ user, onClose, onExplore }) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (user) {
      // Trigger animation
      const t1 = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t1);
    } else {
      setVisible(false);
    }
  }, [user]);

  const handleDismiss = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 280);
  };

  const particles: Particle[] = useMemo(() => {
    const colors = ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#6366f1', '#3b82f6'];
    const shapes: ('circle' | 'square' | 'pill')[] = ['circle', 'square', 'pill'];
    return Array.from({ length: 32 }, (_, i) => ({
      id: i,
      x: Math.random() * 94 + 3,
      y: Math.random() * 85 + 5,
      color: colors[i % colors.length],
      size: Math.floor(Math.random() * 8) + 6,
      rotation: Math.floor(Math.random() * 360),
      delay: (i * 0.04) % 0.8,
      duration: 1.6 + Math.random() * 1.2,
      shape: shapes[i % shapes.length],
    }));
  }, []);

  if (!user) return null;

  const isGmail = user.email?.toLowerCase().includes('@gmail.com');
  const greetingName = user.displayName || user.email?.split('@')[0] || 'Thầy/Cô';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        visible && !closing ? 'bg-slate-900/60 backdrop-blur-xs opacity-100' : 'bg-transparent opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
    >
      {/* Confetti & celebratory floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute animate-bounce"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: p.shape === 'pill' ? `${p.size * 2}px` : `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '9999px' : p.shape === 'pill' ? '9999px' : '3px',
              transform: `rotate(${p.rotation}deg)`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden transition-all duration-300 transform ${
          visible && !closing ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Top Banner */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 pt-8 pb-10 text-white overflow-hidden text-center">
          {/* Subtle background glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* User Avatar with Google Badge */}
          <div className="relative inline-block mb-3.5">
            <div className="w-20 h-20 rounded-2xl p-1 bg-white/30 backdrop-blur-md shadow-lg mx-auto flex items-center justify-center">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={greetingName}
                  className="w-full h-full object-cover rounded-xl border border-white/50"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                  {greetingName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Google Logo / Success Icon badge */}
            <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border border-slate-100">
              {isGmail ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              )}
            </div>
          </div>

          {/* Welcome Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-50 text-[11px] font-semibold mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Đăng nhập thành công qua Google Gmail</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Chào mừng {greetingName}! 👋
          </h3>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-sm mx-auto truncate font-medium">
            {user.email}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
              <Award className="w-4 h-4 text-amber-500" />
              Hệ thống đã sẵn sàng phục vụ công tác chủ nhiệm
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Hồ sơ điện tử:</strong> Đồng bộ bảo mật trực tiếp theo tài khoản
                </span>
              </div>
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Trợ lý AI TT27:</strong> Tự động hoá gợi ý nhận xét học tập
                </span>
              </div>
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Nề nếp & Điểm danh:</strong> Thống kê chuyên cần và cảnh báo sớm
                </span>
              </div>
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                <HeartHandshake className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Gắn kết Phụ Huynh:</strong> Mẫu tin nhắn Zalo/SMS nhanh chóng
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                handleDismiss();
                if (onExplore) onExplore();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Vào không gian lớp học ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition cursor-pointer"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

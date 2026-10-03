import React, { useState } from 'react';
import {
  Heart,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Award,
  BookOpen,
  Users,
  Code2,
  X,
  Mail,
  Crown,
  Command,
} from 'lucide-react';

export interface AuthorAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthorAboutModal: React.FC<AuthorAboutModalProps> = ({ isOpen, onClose }) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  // App Support & Developer Info
  const authorName = 'Ban Phát Triển Sổ Chủ Nhiệm 4.0';
  const authorRole = 'Đội ngũ Kỹ sư Phần mềm & Giải pháp Giáo dục Số EdTech';
  const authorPhone = '0909 888 668';
  const authorPhoneClean = '0909888668';
  const authorZaloLink = `https://zalo.me/${authorPhoneClean}`;
  const authorEmail = 'hotro.sochunhiem@gmail.com';

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText(authorPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-6 sm:p-7 text-white shrink-0">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/20 blur-xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-teal-400/20 blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white/30 shrink-0">
                AI
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/25 border border-amber-300/40 text-amber-200">
                    Ban phát triển
                  </span>
                  <span className="text-emerald-200 text-xs font-semibold">· Sổ Chủ Nhiệm 4.0</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                  {authorName}
                </h2>
                <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                  {authorRole}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Quick Contact Action Bar */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>Kênh liên hệ trực tiếp & Hỗ trợ kỹ thuật</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Hỗ trợ nhiệt tình 24/7</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Phone Direct Call */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] text-slate-400 font-medium">Điện thoại / Hotline</div>
                    <a
                      href={`tel:${authorPhoneClean}`}
                      className="text-xs font-bold text-slate-800 hover:text-emerald-700 transition-colors"
                    >
                      {authorPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Sao chép số điện thoại"
                  >
                    {copiedPhone ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`tel:${authorPhoneClean}`}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    Gọi ngay
                  </a>
                </div>
              </div>

              {/* Zalo Direct Chat */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-blue-200 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 font-bold text-xs">
                    Zalo
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] text-slate-400 font-medium">Nhắn tin Zalo</div>
                    <span className="text-xs font-bold text-blue-900">{authorPhone}</span>
                  </div>
                </div>

                <a
                  href={authorZaloLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>Chat Zalo</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>
          </div>

          {/* Heartfelt Letter of Thanks */}
          <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/70 p-5 sm:p-6 rounded-2xl border border-rose-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
              <Heart className="w-4 h-4 text-rose-600 fill-rose-500 animate-pulse" />
              <span>Lời Tri Ân & Cảm Ơn Sâu Sắc Gửi Quý Thầy/Cô</span>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed space-y-2.5 font-normal italic">
              <p>
                <strong>Kính gửi Quý Thầy/Cô Giáo viên Chủ nhiệm Tiểu học trên mọi miền Tổ quốc!</strong>
              </p>
              <p className="not-italic text-slate-600">
                Nghề giáo luôn là một trong những nghề cao quý, tận tụy và đong đầy tình yêu thương nhất. Thấu hiểu những vất vả, áp lực và bao lo toan thường nhật của Thầy/Cô — từ quản lý nề nếp, điểm danh, kết nối phụ huynh đến từng dòng lời nhận xét học bạ mỗi kỳ — tôi đã dành trọn tâm huyết xây dựng nên ứng dụng <strong>Sổ Chủ Nhiệm Điện Tử Thông Minh 4.0</strong> này.
              </p>
              <p className="not-italic text-slate-600">
                Tôi xin gửi lời cảm ơn chân thành và lòng biết ơn sâu sắc nhất tới Quý Thầy/Cô đã tin tưởng, sử dụng và đóng góp những ý kiến quý báu. Sự đồng hành của Thầy/Cô là nguồn cảm hứng lớn nhất giúp tôi không ngừng nâng cấp phần mềm ngày càng tiện ích, thân thiện và tối ưu nhất cho công tác giảng dạy.
              </p>
              <p className="not-italic font-semibold text-emerald-900 pt-1">
                Kính chúc Quý Thầy/Cô luôn tràn đầy sức khỏe, niềm vui, hạnh phúc và luôn giữ trọn ngọn lửa nhiệt huyết với sự nghiệp trồng người cao quý!
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-rose-200/60 text-xs">
              <span className="text-slate-400 font-medium">Trân trọng kính thư,</span>
              <span className="font-black text-slate-900 font-serif text-sm">Đội Ngũ Phát Triển</span>
            </div>
          </div>

          {/* About the Application Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Giới Thiệu Ứng Dụng Sổ Chủ Nhiệm Điện Tử Thông Minh 4.0</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ứng dụng được thiết kế chuyên biệt và tối ưu toàn diện cho <strong>Giáo viên Chủ nhiệm cấp Tiểu học (từ Lớp 1 đến Lớp 5)</strong>, bám sát Chương trình GDPT 2018 và Thông tư 27/2020/TT-BGDĐT của Bộ Giáo dục & Đào tạo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Xếp STT Tên A-Z & Cán Bộ Lớp</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Tự động phân tích và xếp thứ tự học sinh theo chữ cái đầu của Tên gọi (Linh xếp trước Thảo), gắn icon chuyên biệt cho từng danh hiệu cán bộ lớp (Lớp trưởng 👑, Lớp phó 🎓, Tổ trưởng 👥...).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>AI Hỗ Trợ Nhận Xét Chuẩn Mực</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Tạo nhận xét học tập, năng lực, phẩm chất chuẩn Thông tư 27 bằng giọng văn sư phạm tự nhiên, ấm áp, cá thể hóa theo tiến bộ thực tế của từng em.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Điểm Danh & Sổ Liên Lạc 1 Chạm</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Điểm danh nhanh trong 1 phút, tự động tổng hợp tỷ lệ chuyên cần và gửi tin nhắn Zalo trao đổi trực tiếp với từng phụ huynh thuận tiện.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>An Toàn & Bảo Mật Dữ Liệu Tuyệt Đối</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Lưu trữ đám mây Firebase chuẩn doanh nghiệp, cách ly dữ liệu từng giáo viên và hỗ trợ sao lưu / xuất Excel đầy đủ bất cứ khi nào.
                </p>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Flow */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
              <Command className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Phím Tắt Tối Ưu Tốc Độ Thao Tác (Fast Keyboard Flow)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Tìm kiếm nhanh toàn năng</span>
                <kbd className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-2xs">⌘K / Ctrl+K</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Đổi giao diện Sáng / Tối</span>
                <kbd className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-2xs">Nút Moon / Sun</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Đóng cửa sổ / Hủy chọn</span>
                <kbd className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-2xs">Esc</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300 font-medium">In sơ đồ / Báo cáo A4</span>
                <kbd className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-2xs">⌘P / Ctrl+P</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Phát triển vì cộng đồng giáo dục Việt Nam</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={authorZaloLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>Kết nối Zalo Hỗ Trợ Kỹ Thuật</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

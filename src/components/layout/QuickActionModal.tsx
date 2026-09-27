import React, { useState } from 'react';
import {
  Heart,
  Phone,
  MessageCircle,
  Sparkles,
  Info,
  ChevronUp,
  X,
  ExternalLink,
} from 'lucide-react';
import { AuthorAboutModal } from '../common/AuthorAboutModal';

export const QuickActionModal: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const authorPhone = '0909 888 668';
  const authorPhoneClean = '0909888668';
  const authorZaloLink = `https://zalo.me/${authorPhoneClean}`;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 no-print flex flex-col items-end gap-2.5">
        {/* Expanded Quick Contact Popover */}
        {expanded && (
          <div className="mb-1 w-64 bg-white rounded-2xl p-4 shadow-xl border border-slate-200/90 text-xs animate-in fade-in slide-in-from-bottom-3 duration-150 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">Sổ Chủ Nhiệm 4.0</h4>
                  <p className="text-[10px] text-slate-400">Trợ lý sư phạm số</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed italic">
              "Đồng hành cùng Thầy/Cô tối ưu hóa công tác chủ nhiệm, tinh gọn học vụ theo Thông tư 27-BGDĐT."
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`tel:${authorPhoneClean}`}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-[11px] transition-colors border border-emerald-200"
                title="Đường dây hỗ trợ kỹ thuật"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Hotline SP</span>
              </a>

              <a
                href={authorZaloLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl font-bold text-[11px] transition-colors border border-blue-200"
                title="Hỗ trợ qua Zalo"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
                <span>Zalo Hỗ trợ</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setShowModal(true);
              }}
              className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Xem Giới thiệu App & Hướng dẫn</span>
            </button>
          </div>
        )}

        {/* Floating Trigger Button */}
        <div className="flex items-center gap-2">
          {/* Subtle label tooltip on hover */}
          <div
            onClick={() => setShowModal(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-xs rounded-full shadow-md border border-slate-200 text-slate-800 text-xs font-bold cursor-pointer hover:bg-emerald-50 hover:text-emerald-800 transition-all hover:scale-105"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Hỗ trợ & Hướng dẫn App</span>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border-2 border-white/40 group relative"
              aria-label="Hướng dẫn và hỗ trợ sử dụng"
              title="Bấm để xem hướng dẫn sử dụng và hỗ trợ kỹ thuật"
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-xs font-black tracking-tight">AI</span>
                <Heart className="w-3 h-3 text-rose-300 fill-rose-300 animate-pulse mt-0.5" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Full Modal */}
      <AuthorAboutModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

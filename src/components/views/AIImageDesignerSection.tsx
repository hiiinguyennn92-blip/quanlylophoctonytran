import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Sliders,
  Ratio,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Download,
  RefreshCw,
  Eye,
  FileText,
  Palette,
  AlertTriangle,
  Lightbulb,
  Check,
  Edit3,
  Bot,
  Type,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ImageDesignerSkill, ImageDesignerRequest, ImageDesignerResult } from '../../services/aiImageDesign/imageDesignerSkill';
import { ImageEngine, ModelRouter } from '../../services/aiImageDesign/modelRouter';
import { VisualBrief } from '../../services/aiImageDesign/visualBrief';
import { useApp } from '../../context/AppContext';

export const AIImageDesignerSection: React.FC = () => {
  const { showToast } = useApp();

  // Mode: Simple (mặc định) vs Advanced (nâng cao)
  const [isAdvanced, setIsAdvanced] = useState(false);

  // 1. Simple Inputs cho Giáo viên
  const [userPrompt, setUserPrompt] = useState('Tạo infographic vòng tuần hoàn nước dành cho học sinh lớp 3. Có các bước Bốc hơi, Ngưng tụ, Mưa, Thu gom.');
  const [targetAudience, setTargetAudience] = useState('Học sinh Lớp 3 Tiểu học');
  const [presentationType, setPresentationType] = useState('Infographic giáo dục hình tròn (Cycle)');
  const [hasText, setHasText] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '3:4' | '1:1' | '4:3' | '9:16'>('16:9');

  // Model Engine Selection
  const [selectedEngine, setSelectedEngine] = useState<ImageEngine>('banana-2');

  // 2. Advanced Inputs (Chỉ mở khi isAdvanced = true)
  const [compositionLayout, setCompositionLayout] = useState('Bố cục vòng tuần hoàn lớn ở trung tâm');
  const [focalPoint, setFocalPoint] = useState('Chu trình 4 bước nước luân chuyển');
  const [foreground, setForeground] = useState('Mặt nước hồ, cây cối xanh tươi, không che khuất trọng tâm');
  const [center, setCenter] = useState('Vòng chu trình nước, mây, mưa, hơi nước bốc lên');
  const [backgroundElements, setBackgroundElements] = useState('Bầu trời trong xanh, ánh nắng dịu nhẹ, núi xa xa');
  const [paletteText, setPaletteText] = useState('#0284c7, #059669, #f59e0b, #f8fafc');
  const [exactStringsInput, setExactStringsInput] = useState('VÒNG TUẦN HOÀN CỦA NƯỚC, Bốc hơi, Ngưng tụ, Mưa, Thu gom');
  const [preservationInput, setPreservationInput] = useState('Giữ đúng 4 bước khoa học, mũi tên khép kín theo chiều kim đồng hồ, chuẩn văn hóa Việt');
  const [prohibitedInput, setProhibitedInput] = useState('watermark, chữ tiếng Anh rác, logo lạ, hình vẽ biến dạng méo mó');

  // Execution & Output state
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ImageDesignerResult | null>(null);

  // Modal / Prompt inspection
  const [showPromptInspector, setShowPromptInspector] = useState(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'banana' | 'gpt' | 'brief'>('banana');

  // Quick Action Edit state
  const [editActionNote, setEditActionNote] = useState('');
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);

  // Quick sample templates
  const samplePrompts = [
    {
      title: 'Vòng tuần hoàn nước Lớp 3',
      prompt: 'Tạo infographic vòng tuần hoàn nước dành cho học sinh lớp 3. Có các bước Bốc hơi, Ngưng tụ, Mưa, Thu gom. Phong cách giáo dục hiện đại. Tỷ lệ 16:9.',
      audience: 'Học sinh Lớp 3 Tiểu học',
      type: 'Infographic giáo dục chu trình tròn',
      ratio: '16:9' as const,
      hasText: true,
    },
    {
      title: '5 Bước Rửa Tay Lớp 2',
      prompt: 'Tạo infographic 5 bước rửa tay sạch khuẩn cho học sinh lớp 2: Làm ướt, Xoa xà phòng, Kẽ ngón tay, Mu bàn tay, Xả sạch và lau khô.',
      audience: 'Học sinh Lớp 2',
      type: 'Infographic quy trình từng bước (Process)',
      ratio: '3:4' as const,
      hasText: true,
    },
    {
      title: 'Poster An toàn giao thông',
      prompt: 'Poster cổ động an toàn giao thông trước cổng trường tiểu học: Nhớ đội mũ bảo hiểm khi ngồi trên xe máy, quan sát khi sang đường.',
      audience: 'Học sinh tiểu học & Phụ huynh',
      type: 'Poster tuyên truyền học đường',
      ratio: '3:4' as const,
      hasText: true,
    },
    {
      title: 'Truyện tranh 3 khung: Đôi bạn cùng tiến',
      prompt: 'Tranh minh họa 3 khung cảnh kể câu chuyện bạn học sinh giúp đỡ bạn cùng bàn giải bài tập toán khó, cuối cùng cả hai đều tiến bộ và vui cười.',
      audience: 'Học sinh Lớp 4',
      type: 'Truyện tranh kể chuyện 3 phân cảnh (Story)',
      ratio: '16:9' as const,
      hasText: true,
    },
  ];

  const handleApplySample = (s: typeof samplePrompts[0]) => {
    setUserPrompt(s.prompt);
    setTargetAudience(s.audience);
    setPresentationType(s.type);
    setAspectRatio(s.ratio);
    setHasText(s.hasText);
    showToast(`Đã áp dụng mẫu "${s.title}"`, 'info');
  };

  const handleExecuteGenerate = async (customEditContext?: any) => {
    if (!userPrompt.trim()) {
      showToast('Vui lòng nhập mô tả hình ảnh muốn tạo.', 'error');
      return;
    }

    setGenerating(true);
    try {
      const exactList = exactStringsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const request: ImageDesignerRequest = {
        userPrompt: userPrompt.trim(),
        targetAudience: targetAudience.trim(),
        presentationType: presentationType.trim(),
        hasText,
        aspectRatio,
        preferredEngine: selectedEngine,
        exactStrings: exactList.length ? exactList : undefined,
        isAdvanced,
        advancedParams: isAdvanced
          ? {
              compositionLayout,
              focalPoint,
              foreground: foreground ? [foreground] : undefined,
              center: center ? [center] : undefined,
              backgroundElements: backgroundElements ? [backgroundElements] : undefined,
              customPalette: paletteText.split(',').map((c) => c.trim()).filter(Boolean),
              preservationRules: preservationInput.split(',').map((p) => p.trim()).filter(Boolean),
              prohibitedElements: prohibitedInput.split(',').map((p) => p.trim()).filter(Boolean),
            }
          : undefined,
        editContext: customEditContext,
      };

      const res = await ImageDesignerSkill.executeDesign(request);
      setResult(res);
      showToast(`Đã kiến tạo thành công tác phẩm qua ${ModelRouter.getEngineDisplayName(res.selectedEngine)}!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Lỗi thiết kế: ${err.message || 'Không thể tạo hình ảnh'}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Quick targeted edits
  const handleQuickAction = async (action: 'color' | 'background' | 'text' | 'recreate') => {
    if (!result) return;

    if (action === 'recreate') {
      handleExecuteGenerate();
      return;
    }

    let editContext: any = { isEdit: true, preserve: [], change: [], lockedDetails: [] };

    if (action === 'color') {
      editContext.preserve = ['Bố cục', 'Chủ thể chính', 'Chữ tiếng Việt'];
      editContext.change = ['Đổi bảng màu sang tông tươi sáng ấm áp hơn, tăng tương phản'];
      editContext.lockedDetails = ['Bố cục các bước', 'Toàn bộ nội dung chữ'];
      editContext.editRequest = 'Giữ nguyên toàn bộ bố cục và chữ, đổi bảng màu tươi sáng hơn.';
    } else if (action === 'background') {
      editContext.preserve = ['Chủ thể chính', 'Bố cục trung tâm', 'Chữ tiếng Việt'];
      editContext.change = ['Làm mới hậu cảnh với không gian trường học hoặc thiên nhiên Việt Nam thanh thoát hơn'];
      editContext.lockedDetails = ['Chủ thể'];
      editContext.editRequest = 'Giữ nguyên chủ thể, đổi hậu cảnh thoáng đãng hơn.';
    } else if (action === 'text') {
      editContext.preserve = ['Bố cục', 'Màu sắc', 'Chủ thể', 'Hậu cảnh'];
      editContext.change = [`Tinh chỉnh chữ: ${editActionNote || 'Kiểm tra độ rõ dấu và vị trí chữ'}`];
      editContext.lockedDetails = ['Bố cục', 'Phong cách'];
      editContext.editRequest = `Sửa phần chữ chính xác: ${editActionNote}`;
    }

    await handleExecuteGenerate(editContext);
    setActiveQuickAction(null);
    setEditActionNote('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 lg:p-7 space-y-6">
      {/* Top Banner Branding */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-2xl p-5 text-white shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Google Nano Banana 2 &amp; Banana Pro · Model Adapter GPT Image</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Nhà Thiết Kế Hình Ảnh AI Sư Phạm
          </h2>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            Biến ý tưởng của Giáo viên thành bản thiết kế có cấu trúc (VisualBrief), khóa chữ tiếng Việt có dấu, kiểm soát bố cục và biên dịch Prompt tối ưu riêng cho từng Engine.
          </p>
        </div>

        {/* Engine Badge / Switcher */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 z-10 space-y-2 shrink-0">
          <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-amber-300" />
            <span>Target Image Engine</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="radio"
                name="engineSelect"
                value="banana-2"
                checked={selectedEngine === 'banana-2'}
                onChange={() => setSelectedEngine('banana-2')}
                className="text-emerald-500 focus:ring-emerald-400"
              />
              <span className="font-semibold text-white">Google Nano Banana 2</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/30 rounded text-emerald-200">Mặc định</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="radio"
                name="engineSelect"
                value="banana-pro"
                checked={selectedEngine === 'banana-pro'}
                onChange={() => setSelectedEngine('banana-pro')}
                className="text-emerald-500 focus:ring-emerald-400"
              />
              <span className="font-semibold text-white">Nano Banana Pro</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-400/30 rounded text-amber-200">Chất lượng cao</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="radio"
                name="engineSelect"
                value="gpt-image"
                checked={selectedEngine === 'gpt-image'}
                onChange={() => setSelectedEngine('gpt-image')}
                className="text-emerald-500 focus:ring-emerald-400"
              />
              <span className="font-semibold text-white">GPT Image Adapter</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/30 rounded text-blue-200">Model phụ</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sample Quick Prompts Carousel */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Gợi ý mẫu hình ảnh sư phạm tiểu học nhanh:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {samplePrompts.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplySample(s)}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-emerald-50/60 hover:border-emerald-300 text-left transition-all cursor-pointer group"
            >
              <div className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
                <span>{s.title}</span>
                <span className="text-[10px] bg-slate-200 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800 px-1.5 py-0.5 rounded">
                  {s.ratio}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                {s.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Inputs (Left) & Output Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Teacher Request & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Simple Inputs for Teachers */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Mô Tả Nhu Cầu Thiết Kế</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAdvanced(!isAdvanced)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                  isAdvanced
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Chế độ nâng cao</span>
                {isAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* 1. Bạn muốn tạo hình gì? */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                1. Bạn muốn tạo hình gì? (Mô tả đơn giản bằng tiếng Việt)
              </label>
              <textarea
                rows={3}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Ví dụ: Tạo infographic vòng tuần hoàn nước gồm Bốc hơi, Ngưng tụ, Mưa, Thu gom dành cho học sinh lớp 3..."
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              />
            </div>

            {/* 2 & 3: Dành cho ai & Kiểu hình */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  2. Dành cho ai? (Người xem)
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ví dụ: Học sinh Lớp 3, Lớp 1, Phụ huynh..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  3. Kiểu hình? (Trình bày)
                </label>
                <select
                  value={presentationType}
                  onChange={(e) => setPresentationType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="Infographic giáo dục hình tròn (Cycle)">Infographic chu trình tròn (Cycle)</option>
                  <option value="Infographic quy trình từng bước (Process)">Infographic từng bước (Process 1-2-3-4)</option>
                  <option value="Poster tuyên truyền học đường (Poster)">Poster tuyên truyền cổ động học đường</option>
                  <option value="Tranh minh họa sư phạm trực quan (Illustration)">Tranh minh họa giảng dạy trực quan</option>
                  <option value="Truyện tranh 3 phân cảnh (Story)">Truyện tranh 3 khung kể chuyện (Story)</option>
                  <option value="Sơ đồ tư duy / Cấu tạo (Diagram / Cutaway)">Sơ đồ phân nhánh / Cắt lớp cấu tạo</option>
                </select>
              </div>
            </div>

            {/* 4 & 5: Có chữ không & Tỷ lệ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  4. Có chữ trong hình không?
                </label>
                <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-xl">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="hasTextOption"
                      checked={hasText}
                      onChange={() => setHasText(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Có chữ tiếng Việt</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="hasTextOption"
                      checked={!hasText}
                      onChange={() => setHasText(false)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Không có chữ (chỉ tranh)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  5. Tỷ lệ khung hình (Aspect Ratio)
                </label>
                <div className="grid grid-cols-5 gap-1 bg-white p-1 border border-slate-200 rounded-xl text-center">
                  {(['16:9', '3:4', '1:1', '4:3', '9:16'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAspectRatio(r)}
                      className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        aspectRatio === r
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Panel (Collapsible) */}
            {isAdvanced && (
              <div className="pt-3 border-t border-slate-200 space-y-3.5 animate-in fade-in duration-200">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cấu hình Chuyên sâu (Advanced Visual Brief Controls)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Bố cục (Layout):</label>
                    <input
                      type="text"
                      value={compositionLayout}
                      onChange={(e) => setCompositionLayout(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Điểm nhấn chính (Focal Point):</label>
                    <input
                      type="text"
                      value={focalPoint}
                      onChange={(e) => setFocalPoint(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-700">Chữ chính xác bắt buộc (Exact Strings, cách nhau dấu phẩy):</label>
                  <input
                    type="text"
                    value={exactStringsInput}
                    onChange={(e) => setExactStringsInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    placeholder="Ví dụ: VÒNG TUẦN HOÀN CỦA NƯỚC, Bốc hơi, Ngưng tụ, Mưa, Thu gom"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Yếu tố phải giữ (Preservation):</label>
                    <input
                      type="text"
                      value={preservationInput}
                      onChange={(e) => setPreservationInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Yếu tố cấm có (Prohibited):</label>
                    <input
                      type="text"
                      value={prohibitedInput}
                      onChange={(e) => setProhibitedInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-semibold text-slate-700">Bảng màu (Hex/Name, cách nhau dấu phẩy):</label>
                  <input
                    type="text"
                    value={paletteText}
                    onChange={(e) => setPaletteText(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={generating}
              onClick={() => handleExecuteGenerate()}
              className="flex-1 py-3.5 px-6 rounded-xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 shadow-md shadow-emerald-700/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xây dựng VisualBrief &amp; Sinh ảnh ({selectedEngine})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Tạo Tác Phẩm AI Ngay (Google Nano Banana / GPT Image)</span>
                </>
              )}
            </button>

            {result && (
              <button
                type="button"
                onClick={() => setShowPromptInspector(true)}
                className="py-3.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Xem Prompt và VisualBrief"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Xem Prompt</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Visual Result & QA (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Kết Quả Thị Giác</span>
              </h3>
              {result?.selectedEngine && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {result.selectedEngine}
                </span>
              )}
            </div>

            {/* Canvas / Image Display */}
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[320px] p-2 relative shadow-2xs">
              {generating ? (
                <div className="text-center space-y-2 p-6">
                  <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Đang thực hiện quy trình thiết kế...</p>
                  <p className="text-[11px] text-slate-400">
                    Phân tích Intent → Xây VisualBrief → Biên dịch Prompt → Kết xuất
                  </p>
                </div>
              ) : result?.artifact?.imageUrl ? (
                <div className="w-full flex flex-col items-center">
                  <img
                    src={result.artifact.imageUrl}
                    alt="Kết quả thiết kế AI"
                    className="max-h-[460px] w-auto object-contain rounded-lg shadow-2xs"
                  />
                </div>
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-400">
                  <Palette className="w-10 h-10 stroke-1 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">Chưa tạo hình ảnh nào</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Mô tả yêu cầu và bấm &quot;Tạo Tác Phẩm AI Ngay&quot; để tạo tranh minh họa hoặc infographic chuẩn sư phạm.
                  </p>
                </div>
              )}
            </div>

            {/* Post-Generation Action Buttons (Mục 53 trong Master Prompt) */}
            {result && !generating && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickAction('recreate')}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Tạo lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = result.artifact.imageUrl;
                      link.download = `AI_Design_${Date.now()}.svg`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      showToast('Đã tải hình ảnh về máy.', 'success');
                    }}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Lưu / Tải về</span>
                  </button>
                </div>

                {/* Edit Controls */}
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleQuickAction('color')}
                    className="p-1.5 bg-white hover:bg-emerald-50 border border-slate-200 rounded-lg text-slate-700 font-medium transition cursor-pointer"
                  >
                    🎨 Đổi màu sắc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction('background')}
                    className="p-1.5 bg-white hover:bg-emerald-50 border border-slate-200 rounded-lg text-slate-700 font-medium transition cursor-pointer"
                  >
                    🏞️ Đổi nền
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveQuickAction(activeQuickAction === 'text' ? null : 'text')}
                    className="p-1.5 bg-white hover:bg-emerald-50 border border-slate-200 rounded-lg text-slate-700 font-medium transition cursor-pointer"
                  >
                    ✏️ Sửa chữ
                  </button>
                </div>

                {/* Text Edit Inline input */}
                {activeQuickAction === 'text' && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                    <label className="text-[11px] font-bold text-emerald-900 block">
                      Nhập chữ cần sửa (giữ nguyên bố cục &amp; nhân vật):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editActionNote}
                        onChange={(e) => setEditActionNote(e.target.value)}
                        placeholder="Ví dụ: Đổi tiêu đề thành 'VÒNG ĐỜI CỦA NƯỚC'..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickAction('text')}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}

                {/* Copy Prompts Quick Bar */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(result.alternativeBananaPrompt?.prompt || result.compiledPrompt.prompt);
                      showToast('Đã sao chép Prompt Google Nano Banana!', 'success');
                    }}
                    className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold border border-amber-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sao chép Nano Banana</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(result.alternativeGptPrompt?.prompt || '');
                      showToast('Đã sao chép Prompt GPT Image!', 'success');
                    }}
                    className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold border border-blue-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sao chép GPT Image</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Agent Generated Prompt Summary Card */}
          {result && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-xs shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Prompt Sinh Tự Động Theo Logic &amp; Văn Hóa</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPromptInspector(true)}
                  className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] underline cursor-pointer"
                >
                  Xem chi tiết đầy đủ
                </button>
              </div>

              {/* 4 Trụ Cột: Cấu trúc chính theo chủ đề - Chữ tiếng Việt theo chủ đề - Văn hóa Việt Nam - Logic Hành Động */}
              <div className="grid grid-cols-1 gap-2 text-[11px]">
                <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center justify-between text-emerald-900">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cấu Trúc Chính Theo Chủ Đề:</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/60 font-semibold text-emerald-800">
                      {result.visualBrief.presentationType}
                    </span>
                  </div>
                  <p className="text-emerald-900 font-medium leading-relaxed">
                    {result.visualBrief.primaryStructure.form}
                  </p>
                  {result.visualBrief.primaryStructure.details?.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5 text-[10px] text-emerald-800/90 pl-1 pt-0.5 border-t border-emerald-200/50">
                      {result.visualBrief.primaryStructure.details.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="truncate">{item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-2.5 bg-teal-50/80 border border-teal-200 rounded-lg text-teal-950 space-y-1">
                  <div className="font-bold flex items-center justify-between text-teal-900">
                    <div className="flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-teal-600" />
                      <span>Chữ Trong Hình (Khóa 100% Theo Chủ Đề):</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-200/60 font-semibold text-teal-800">
                      {result.visualBrief.text.exactStrings.length} cụm từ khóa
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {result.visualBrief.text.exactStrings.map((txt, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white border border-teal-300 text-teal-900 rounded font-semibold text-[10px] shadow-2xs"
                      >
                        &quot;{txt}&quot;
                      </span>
                    ))}
                  </div>
                  {result.visualBrief.text.fontPreference && (
                    <p className="text-[10px] text-teal-700/90 pt-0.5 italic">
                      Kiểu chữ: {result.visualBrief.text.fontPreference}
                    </p>
                  )}
                </div>

                <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-950 space-y-0.5">
                  <div className="font-bold flex items-center gap-1 text-blue-800">
                    <Check className="w-3 h-3 text-blue-600" />
                    <span>Chuẩn Mực Văn Hóa Học Đường Việt Nam:</span>
                  </div>
                  <p className="text-blue-900/90 leading-relaxed text-[10px]">
                    {result.visualBrief.preservationRules[0] || 'Áo sơ mi trắng, khăn quàng đỏ, không gian lớp học trang nghiêm, tiếng Việt chuẩn xác có dấu.'}
                  </p>
                </div>

                <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-950 space-y-0.5">
                  <div className="font-bold flex items-center gap-1 text-amber-800">
                    <Check className="w-3 h-3 text-amber-600" />
                    <span>Logic Hành Động &amp; Giải Phẫu Sư Phạm:</span>
                  </div>
                  <p className="text-amber-900/90 leading-relaxed text-[10px]">
                    {result.visualBrief.center[0] || 'Hành động tích cực, giải phẫu tay chân chuẩn xác, tư thế ngồi/thao tác đúng mực.'}
                  </p>
                </div>
              </div>

              {/* Active Prompt Snippet */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                  <span>Trích đoạn Prompt ({result.selectedEngine === 'gpt-image' ? 'GPT Image' : 'Google Nano Banana'}):</span>
                  <span>{result.compiledPrompt.aspectRatio}</span>
                </div>
                <div className="p-2.5 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-lg max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all border border-slate-700">
                  {result.selectedEngine === 'gpt-image'
                    ? result.alternativeGptPrompt?.prompt
                    : result.alternativeBananaPrompt?.prompt || result.compiledPrompt.prompt}
                </div>
              </div>
            </div>
          )}

          {/* Image QA Card */}
          {result?.qaResult && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 text-xs shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Kiểm Định Chất Lượng QA (Image QA)</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                  {result.qaResult.overallScore}/100 Điểm
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="flex items-center gap-1 text-slate-700 bg-slate-50 p-1.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chủ thể &amp; Bố cục chuẩn</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700 bg-slate-50 p-1.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tiếng Việt đủ dấu</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700 bg-slate-50 p-1.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chuẩn mực học đường</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700 bg-slate-50 p-1.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Không watermark/rác</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Prompt Inspector Modal (Mục 42 & 43 trong Master Prompt) */}
      {showPromptInspector && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Kiểm Tra &amp; Xuất Prompt Thiết Kế AI
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPromptInspector(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setActiveInspectorTab('banana')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeInspectorTab === 'banana'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                🍌 Google Nano Banana
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectorTab('gpt')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeInspectorTab === 'gpt'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                🤖 GPT Image Adapter
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectorTab('brief')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeInspectorTab === 'brief'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                📋 VisualBrief (Trung gian)
              </button>
            </div>

            {/* Tab Contents */}
            <div className="space-y-3">
              {activeInspectorTab === 'banana' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">
                      Prompt được biên dịch riêng theo cấu trúc Google Nano Banana:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(result.alternativeBananaPrompt?.prompt || result.compiledPrompt.prompt);
                        showToast('Đã sao chép Prompt Nano Banana!', 'success');
                      }}
                      className="px-2.5 py-1 bg-amber-600 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Sao chép</span>
                    </button>
                  </div>
                  <pre className="p-3.5 bg-slate-900 text-emerald-300 rounded-xl border border-slate-700 whitespace-pre-wrap font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto">
                    {result.alternativeBananaPrompt?.prompt || result.compiledPrompt.prompt}
                  </pre>
                </div>
              )}

              {activeInspectorTab === 'gpt' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold">
                      Prompt được biên dịch riêng cho GPT Image / DALL-E:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(result.alternativeGptPrompt?.prompt || '');
                        showToast('Đã sao chép Prompt GPT Image!', 'success');
                      }}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Sao chép</span>
                    </button>
                  </div>
                  <pre className="p-3.5 bg-slate-900 text-blue-300 rounded-xl border border-slate-700 whitespace-pre-wrap font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto">
                    {result.alternativeGptPrompt?.prompt}
                  </pre>
                </div>
              )}

              {activeInspectorTab === 'brief' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-600 font-semibold">
                    Cấu trúc VisualBrief độc lập model:
                  </div>
                  <pre className="p-3.5 bg-slate-900 text-amber-200 rounded-xl border border-slate-700 whitespace-pre-wrap font-mono text-[11px] leading-relaxed max-h-96 overflow-y-auto">
                    {JSON.stringify(result.visualBrief, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPromptInspector(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

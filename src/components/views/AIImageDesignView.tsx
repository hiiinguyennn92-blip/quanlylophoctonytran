import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Trash2,
  Download,
  Copy,
  Layers,
  BookOpen,
  Eye,
  RefreshCw,
  Plus,
  Sliders,
  Check,
  Info,
  Maximize2,
  FileText,
  Lock,
  Compass,
  Smile,
  Leaf,
  MapPin,
  Flame,
  X,
  Edit3,
  Lightbulb,
  ExternalLink,
  Ratio,
  Wand2,
} from 'lucide-react';
import {
  StylePresetId,
  StyleCategory,
  ImageReference,
  ReferencePurpose,
  PreservationStrength,
  DesignedImageArtifact,
  CompiledImagePrompt,
} from '../../services/aiImageDesign/types';
import {
  STYLE_PRESETS,
  STYLE_PRESET_LIST,
  STYLE_CATEGORIES,
  DEFAULT_STYLE_INPUTS,
} from '../../services/aiImageDesign/presets';
import { ImageModelAdapter } from '../../services/aiImageDesign/imageModelAdapter';
import { ImagePromptCompiler } from '../../services/aiImageDesign/imagePromptCompiler';
import { useApp } from '../../context/AppContext';
import { AIImageDesignerSection } from './AIImageDesignerSection';

export const AIImageDesignView: React.FC = () => {
  const { showToast } = useApp();

  // Mode tab: 'banana_designer' (Skill Nhà Thiết Kế Hình Ảnh AI Master) vs 'presets_workshop' (5 Presets truyền thống)
  const [designerTab, setDesignerTab] = useState<'banana_designer' | 'presets_workshop'>('banana_designer');

  // Active Preset Selection
  const [selectedPresetId, setSelectedPresetId] = useState<StylePresetId>('community_safety_editorial');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form Inputs State initialized from presets
  const [formData, setFormData] = useState<Record<StylePresetId, any>>({
    community_safety_editorial: { ...DEFAULT_STYLE_INPUTS.community_safety_editorial },
    youth_promo_mixed_media: { ...DEFAULT_STYLE_INPUTS.youth_promo_mixed_media },
    three_panel_story_collage: {
      ...DEFAULT_STYLE_INPUTS.three_panel_story_collage,
      panels: JSON.parse(JSON.stringify(DEFAULT_STYLE_INPUTS.three_panel_story_collage.panels)),
    },
    botanical_scrapbook: {
      ...DEFAULT_STYLE_INPUTS.botanical_scrapbook,
      shortNotes: [...DEFAULT_STYLE_INPUTS.botanical_scrapbook.shortNotes],
    },
    minimal_geographic_editorial: {
      ...DEFAULT_STYLE_INPUTS.minimal_geographic_editorial,
      microVignetteElements: [...DEFAULT_STYLE_INPUTS.minimal_geographic_editorial.microVignetteElements],
    },
  });

  // Reference Images (strictly session only, never polluting business data)
  const [referenceImages, setReferenceImages] = useState<ImageReference[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aspect ratio customization state
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9' | '9:16'>(
    STYLE_PRESETS.community_safety_editorial.defaultAspectRatio
  );

  // Custom Prompt Editing State
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');

  // Targeted edit state
  const [targetedAction, setTargetedAction] = useState<'normal' | 'edit_text' | 'change_character' | 'change_palette'>('normal');
  const [targetedNote, setTargetedNote] = useState('');

  // Generation & Results
  const [generating, setGenerating] = useState(false);
  const [currentArtifact, setCurrentArtifact] = useState<DesignedImageArtifact | null>(null);
  const [historyArtifacts, setHistoryArtifacts] = useState<DesignedImageArtifact[]>([]);

  // Prompt Inspection Modal
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [inspectedPrompt, setInspectedPrompt] = useState<CompiledImagePrompt | null>(null);
  const [promptModalTab, setPromptModalTab] = useState<'master' | 'gpt_image'>('master');

  // Update aspect ratio when preset changes if user hasn't overridden
  useEffect(() => {
    setSelectedAspectRatio(STYLE_PRESETS[selectedPresetId].defaultAspectRatio);
  }, [selectedPresetId]);

  // Active preset metadata
  const activePreset = STYLE_PRESETS[selectedPresetId];
  const currentInputs = formData[selectedPresetId];

  // Filter presets by category
  const filteredPresets = STYLE_PRESET_LIST.filter(
    (p) => selectedCategory === 'all' || p.categories.includes(selectedCategory as StyleCategory)
  );

  // Handle Input Changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [selectedPresetId]: {
        ...prev[selectedPresetId],
        [field]: value,
      },
    }));
  };

  // Reset to default sample
  const handleResetToDefault = () => {
    setFormData((prev) => ({
      ...prev,
      [selectedPresetId]: JSON.parse(JSON.stringify(DEFAULT_STYLE_INPUTS[selectedPresetId])),
    }));
    showToast('Đã nạp lại mẫu nội dung chuẩn Việt Nam.', 'info');
  };

  // Upload Reference Image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        showToast('Chỉ hỗ trợ file hình ảnh (PNG, JPG, WEBP).', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newRef: ImageReference = {
          id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          dataUrl,
          mimeType: file.type,
          sizeBytes: file.size,
          type: 'character',
          preservationStrength: 'high',
          uploadedAt: new Date().toISOString(),
          customInstruction: '',
        };
        setReferenceImages((prev) => [...prev, newRef]);
        showToast(`Đã thêm ảnh tham chiếu "${file.name}".`, 'success');
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveReference = (id: string) => {
    setReferenceImages((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateReference = (id: string, field: keyof ImageReference, value: any) => {
    setReferenceImages((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Compile & Inspect Master Prompt
  const handleInspectPrompt = () => {
    try {
      const compiled = ImagePromptCompiler.compile(
        selectedPresetId,
        currentInputs,
        referenceImages,
        targetedAction,
        targetedNote,
        selectedAspectRatio
      );
      if (customPromptText && customPromptText.trim()) {
        compiled.masterPrompt = customPromptText.trim();
      }
      setInspectedPrompt(compiled);
      setShowPromptModal(true);
    } catch (err: any) {
      showToast(`Lỗi biên dịch prompt: ${err.message}`, 'error');
    }
  };

  // Compile current prompt for in-place edit textarea
  const handleLoadCurrentPromptForEditing = () => {
    try {
      const compiled = ImagePromptCompiler.compile(
        selectedPresetId,
        currentInputs,
        referenceImages,
        targetedAction,
        targetedNote,
        selectedAspectRatio
      );
      setCustomPromptText(compiled.masterPrompt);
      setIsEditingPrompt(true);
      showToast('Đã trích xuất Master Prompt vào trình chỉnh sửa.', 'info');
    } catch (err: any) {
      showToast(`Không thể trích xuất prompt: ${err.message}`, 'error');
    }
  };

  // Trigger Image Generation
  const handleGenerateImage = async () => {
    setGenerating(true);
    try {
      const artifact = await ImageModelAdapter.generateImage({
        stylePreset: selectedPresetId,
        mode: 'advanced',
        styleInputs: {
          preset: selectedPresetId as any,
          data: currentInputs,
        },
        referenceImages,
        targetedAction,
        targetedNote,
        customAspectRatio: selectedAspectRatio,
        customPromptOverride: isEditingPrompt && customPromptText.trim() ? customPromptText.trim() : undefined,
      });

      setCurrentArtifact(artifact);
      setHistoryArtifacts((prev) => [artifact, ...prev.slice(0, 9)]);
      showToast(`Đã thiết kế thành công poster theo phong cách "${activePreset.nameVi}"!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Lỗi khi tạo hình ảnh: ${err.message || 'Không thể tạo hình ảnh'}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Download Artifact
  const handleDownload = () => {
    if (!currentArtifact?.imageUrl) return;
    const link = document.createElement('a');
    link.href = currentArtifact.imageUrl;
    link.download = `${selectedPresetId}_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã tải tác phẩm về máy.', 'success');
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Palette className="w-80 h-80" />
        </div>
        <div className="relative z-10 space-y-2.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Skill Thiết Kế Hình Ảnh AI Sư Phạm
            </span>
            <span className="px-3 py-1 bg-white/10 text-white/90 rounded-full text-xs font-medium">
              5 Style Presets Độc Lập
            </span>
            <span className="px-3 py-1 bg-teal-500/20 text-teal-200 border border-teal-400/30 rounded-full text-xs font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
              Khóa Tiếng Việt Đầy Đủ Dấu
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xưởng Thiết Kế Hình Ảnh &amp; Poster Sư Phạm
          </h1>
          <p className="text-emerald-100/90 text-sm leading-relaxed">
            Hỗ trợ Giáo viên Chủ nhiệm kiến tạo poster thông tin an toàn, poster sự kiện thiếu nhi năng động, truyện tranh 3 phần học đường, sổ tay thực vật scrapbook thủ công và tranh minh họa địa danh tối giản.
          </p>
        </div>
      </div>

      {/* Top View Mode Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setDesignerTab('banana_designer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            designerTab === 'banana_designer'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>NHÀ THIẾT KẾ HÌNH ẢNH AI (Google Nano Banana + GPT Image)</span>
        </button>

        <button
          type="button"
          onClick={() => setDesignerTab('presets_workshop')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            designerTab === 'presets_workshop'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Xưởng 5 Style Presets Chuyên Sâu</span>
        </button>
      </div>

      {designerTab === 'banana_designer' ? (
        /* Primary Mode: ImageDesignerSkill (Google Nano Banana + Model Adapter GPT Image) */
        <AIImageDesignerSection />
      ) : (
        /* Secondary Mode: 5 Specialized Style Presets Workshop */
        <div className="space-y-6">
          {/* Category Pills & 5 Style Presets Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Chọn Phong Cách Hình Ảnh (5 Presets Chuyên Nghiệp)
              </h2>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {STYLE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-all font-medium ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5 Preset Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {filteredPresets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`text-left p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                        {preset.id === 'community_safety_editorial' && '🛡️ Y Tế & An Toàn'}
                        {preset.id === 'youth_promo_mixed_media' && '⚡ Sự Kiện & Phong Trào'}
                        {preset.id === 'three_panel_story_collage' && '📖 Kể Chuyện 3 Phần'}
                        {preset.id === 'botanical_scrapbook' && '🌿 Sổ Tay Thủ Công'}
                        {preset.id === 'minimal_geographic_editorial' && '🏛️ Địa Danh & Di Sản'}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {preset.nameVi}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {preset.shortDescVi}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-600">Tỷ lệ: {preset.defaultAspectRatio}</span>
                      <div className="flex items-center gap-1">
                        {preset.colorPaletteDefault.slice(0, 3).map((col, idx) => (
                          <span
                            key={idx}
                            className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs inline-block"
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

      {/* Main Studio Workspace: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form & Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Aspect Ratio & Frame Size Selector Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Ratio className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kích Thước &amp; Tỷ Lệ Khung Hình (Aspect Ratio)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lựa chọn tỷ lệ tối ưu cho mục đích sử dụng (in ấn A4, trình chiếu TV lớp học hoặc chia sẻ phụ huynh)
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                {selectedAspectRatio}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                {
                  ratio: '3:4' as const,
                  label: 'Dọc Chuẩn (3:4)',
                  desc: 'Poster A4, Bảng tin lớp',
                  icon: 'w-4 h-5',
                },
                {
                  ratio: '16:9' as const,
                  label: 'Ngang Rộng (16:9)',
                  desc: 'TV, Màn hình chiếu, Banner',
                  icon: 'w-6 h-3.5',
                },
                {
                  ratio: '1:1' as const,
                  label: 'Vuông (1:1)',
                  desc: 'Avatar, Zalo Post, Nhãn dán',
                  icon: 'w-4 h-4',
                },
                {
                  ratio: '4:3' as const,
                  label: 'Ngang Chuẩn (4:3)',
                  desc: 'Slide bài giảng, Truyện tranh',
                  icon: 'w-5 h-4',
                },
                {
                  ratio: '9:16' as const,
                  label: 'Dọc Dài (9:16)',
                  desc: 'Story điện thoại, Zalo Reel',
                  icon: 'w-3 h-5.5',
                },
              ].map((item) => {
                const isSelected = selectedAspectRatio === item.ratio;
                return (
                  <button
                    key={item.ratio}
                    type="button"
                    onClick={() => setSelectedAspectRatio(item.ratio)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`rounded border border-dashed ${
                          isSelected ? 'border-emerald-600 bg-emerald-200/50' : 'border-slate-400 bg-white'
                        } ${item.icon}`}
                      />
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Customization Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  Nội Dung &amp; Cấu Hình: {activePreset.nameVi}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Art Style: <span className="font-medium text-slate-700">{activePreset.artStyle}</span>
                </p>
              </div>
              <button
                onClick={handleResetToDefault}
                className="px-2.5 py-1 text-xs text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Khôi phục nội dung mẫu sư phạm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Mẫu chuẩn
              </button>
            </div>

            {/* PRESET 1: POSTER CỘNG ĐỒNG – THÔNG TIN AN TOÀN */}
            {selectedPresetId === 'community_safety_editorial' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chủ đề an toàn / Y tế cộng đồng (Scene Subject) *
                  </label>
                  <input
                    type="text"
                    value={currentInputs.sceneSubject || ''}
                    onChange={(e) => handleInputChange('sceneSubject', e.target.value)}
                    placeholder="VD: Phòng chống sốt xuất huyết trong mùa mưa tại trường"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thông điệp chính (Main Message) *
                  </label>
                  <input
                    type="text"
                    value={currentInputs.mainMessage || ''}
                    onChange={(e) => handleInputChange('mainMessage', e.target.value)}
                    placeholder="VD: Giữ vệ sinh lớp học, đậy kín dụng cụ chứa nước và diệt lăng quăng"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                  />
                </div>

                {/* Safety Actions Dynamic List */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Checklist các hành động an toàn (Bên trái poster)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...(currentInputs.safetyActions || []), ''];
                        handleInputChange('safetyActions', next);
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm hành động
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(currentInputs.safetyActions || []).map((act: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={act}
                          onChange={(e) => {
                            const next = [...currentInputs.safetyActions];
                            next[idx] = e.target.value;
                            handleInputChange('safetyActions', next);
                          }}
                          placeholder={`Hành động an toàn ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = currentInputs.safetyActions.filter((_: any, i: number) => i !== idx);
                            handleInputChange('safetyActions', next);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bối cảnh Việt Nam (Environment)
                    </label>
                    <input
                      type="text"
                      value={currentInputs.environment || ''}
                      onChange={(e) => handleInputChange('environment', e.target.value)}
                      placeholder="Sân trường tiểu học Việt Nam có cây xanh"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nhân vật trung tâm (Main Character)
                    </label>
                    <input
                      type="text"
                      value={currentInputs.mainCharacter || ''}
                      onChange={(e) => handleInputChange('mainCharacter', e.target.value)}
                      placeholder="Học sinh tiểu học đeo khăn quàng đỏ"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Màu chính</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={currentInputs.primaryColor || '#059669'}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="w-8 h-8 rounded-md cursor-pointer border border-slate-200 p-0"
                      />
                      <span className="text-xs font-mono text-slate-600">{currentInputs.primaryColor || '#059669'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Màu phụ</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={currentInputs.secondaryColor || '#0284c7'}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="w-8 h-8 rounded-md cursor-pointer border border-slate-200 p-0"
                      />
                      <span className="text-xs font-mono text-slate-600">{currentInputs.secondaryColor || '#0284c7'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRESET 2: POSTER QUẢNG BÁ TRẺ TRUNG – MIXED MEDIA */}
            {selectedPresetId === 'youth_promo_mixed_media' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tiêu đề lớn dòng 1 (Headline 1) *
                    </label>
                    <input
                      type="text"
                      value={currentInputs.headlineLine1 || ''}
                      onChange={(e) => handleInputChange('headlineLine1', e.target.value)}
                      placeholder="NGÀY HỘI THIẾU NHI"
                      className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tiêu đề phụ dòng 2 (Headline 2)
                    </label>
                    <input
                      type="text"
                      value={currentInputs.headlineLine2 || ''}
                      onChange={(e) => handleInputChange('headlineLine2', e.target.value)}
                      placeholder="SÁNG TẠO VÀ BỨT PHÁ"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chủ thể nhận diện (Subject Identity) *
                    </label>
                    <input
                      type="text"
                      value={currentInputs.subjectIdentity || ''}
                      onChange={(e) => handleInputChange('subjectIdentity', e.target.value)}
                      placeholder="Học sinh tiểu học Việt Nam tự tin, năng động"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tư thế &amp; Đồ vật tương tác
                    </label>
                    <input
                      type="text"
                      value={currentInputs.deviceOrObject || ''}
                      onChange={(e) => handleInputChange('deviceOrObject', e.target.value)}
                      placeholder="Giơ sản phẩm STEM tự chế, nụ cười rạng rỡ"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sticker huy hiệu chiến dịch (Campaign Label)
                    </label>
                    <input
                      type="text"
                      value={currentInputs.campaignLabel || ''}
                      onChange={(e) => handleInputChange('campaignLabel', e.target.value)}
                      placeholder="CHI ĐỘI MẠNH · THIẾU NHI VUI HỌC"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chữ nền lớn mờ (Background Word)
                    </label>
                    <input
                      type="text"
                      value={currentInputs.backgroundWord || ''}
                      onChange={(e) => handleInputChange('backgroundWord', e.target.value)}
                      placeholder="SÁNG TẠO"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Thông tin chân trang chính (Footer Main)
                    </label>
                    <input
                      type="text"
                      value={currentInputs.footerMainText || ''}
                      onChange={(e) => handleInputChange('footerMainText', e.target.value)}
                      placeholder="Thời gian: 8:00 sáng Thứ Bảy tuần này tại Sân trường"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dòng chú thích chân trang (Footer Secondary)
                    </label>
                    <input
                      type="text"
                      value={currentInputs.footerSecondaryText || ''}
                      onChange={(e) => handleInputChange('footerSecondaryText', e.target.value)}
                      placeholder="Đăng ký cùng Ban chỉ huy Chi đội hoặc Thầy/Cô Chủ nhiệm"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                {/* Color System */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Màu nền than</label>
                    <input
                      type="color"
                      value={currentInputs.backgroundColor || '#0f172a'}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                      className="w-full h-8 rounded-md cursor-pointer border border-slate-200 p-0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Viền graphic</label>
                    <input
                      type="color"
                      value={currentInputs.contourColor || '#22c55e'}
                      onChange={(e) => handleInputChange('contourColor', e.target.value)}
                      className="w-full h-8 rounded-md cursor-pointer border border-slate-200 p-0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Điểm nhấn chữ</label>
                    <input
                      type="color"
                      value={currentInputs.headlineAccentColor || '#facc15'}
                      onChange={(e) => handleInputChange('headlineAccentColor', e.target.value)}
                      className="w-full h-8 rounded-md cursor-pointer border border-slate-200 p-0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PRESET 3: POSTER COLLAGE KỂ CHUYỆN 3 PHẦN */}
            {selectedPresetId === 'three_panel_story_collage' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên câu chuyện (Story Title) *
                    </label>
                    <input
                      type="text"
                      value={currentInputs.storyTitle || ''}
                      onChange={(e) => handleInputChange('storyTitle', e.target.value)}
                      placeholder="Đôi Bạn Cùng Tiến Trong Giờ Học Toán"
                      className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ý nghĩa / Bài học đạo đức (Story Theme)
                    </label>
                    <input
                      type="text"
                      value={currentInputs.storyTheme || ''}
                      onChange={(e) => handleInputChange('storyTheme', e.target.value)}
                      placeholder="Giúp đỡ bạn bè vượt qua khó khăn, cùng tiến bộ"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mô tả nhân vật chính (Character Description)
                  </label>
                  <input
                    type="text"
                    value={currentInputs.characterDescription || ''}
                    onChange={(e) => handleInputChange('characterDescription', e.target.value)}
                    placeholder="Hai bạn học sinh lớp 3: bạn An chăm chỉ và bạn Khang tiến bộ"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                  />
                </div>

                {/* Character Consistency Locks */}
                <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={currentInputs.lockCharacterFace ?? true}
                      onChange={(e) => handleInputChange('lockCharacterFace', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Khóa khuôn mặt &amp; kiểu tóc nhân vật qua cả 3 khung
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={currentInputs.lockCharacterOutfit ?? true}
                      onChange={(e) => handleInputChange('lockCharacterOutfit', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Khóa đồng nhất trang phục học sinh
                  </label>
                </div>

                {/* 3 Panels Editor */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    Nội dung 3 Khung Truyện (Tuần tự thời gian)
                  </div>
                  {(currentInputs.panels || []).map((panel: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Khung {idx + 1}: {idx === 0 ? 'Khởi đầu' : idx === 1 ? 'Diễn biến' : 'Thành quả'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={panel.panelTitle || ''}
                          onChange={(e) => {
                            const next = [...currentInputs.panels];
                            next[idx] = { ...next[idx], panelTitle: e.target.value };
                            handleInputChange('panels', next);
                          }}
                          placeholder="Tiêu đề khung"
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white font-medium"
                        />
                        <input
                          type="text"
                          value={panel.settingOrTime || ''}
                          onChange={(e) => {
                            const next = [...currentInputs.panels];
                            next[idx] = { ...next[idx], settingOrTime: e.target.value };
                            handleInputChange('panels', next);
                          }}
                          placeholder="Thời gian / Không gian"
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white"
                        />
                      </div>
                      <input
                        type="text"
                        value={panel.actionDescription || ''}
                        onChange={(e) => {
                          const next = [...currentInputs.panels];
                          next[idx] = { ...next[idx], actionDescription: e.target.value };
                          handleInputChange('panels', next);
                        }}
                        placeholder="Hành động chính của nhân vật"
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white"
                      />
                      <input
                        type="text"
                        value={panel.speechOrCaption || ''}
                        onChange={(e) => {
                          const next = [...currentInputs.panels];
                          next[idx] = { ...next[idx], speechOrCaption: e.target.value };
                          handleInputChange('panels', next);
                        }}
                        placeholder="Lời thoại hoặc chú thích (tiếng Việt)"
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white italic"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRESET 4: SỔ TAY THỰC VẬT – SCRAPBOOK THỦ CÔNG */}
            {selectedPresetId === 'botanical_scrapbook' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cây, hoa, lá, quả cần nghiên cứu (Subject) *
                  </label>
                  <input
                    type="text"
                    value={currentInputs.subject || ''}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="VD: Cây Bàng, Hoa Sen, Hoa Phượng, Quả Sim Rừng, Cây Lúa..."
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                {/* Short Notes Dynamic List */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Ghi chép quan sát &amp; Cảm nghĩ học sinh (Vùng chữ viết tay)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...(currentInputs.shortNotes || []), ''];
                        handleInputChange('shortNotes', next);
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm ghi chép
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(currentInputs.shortNotes || []).map((note: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">#{idx + 1}</span>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => {
                            const next = [...currentInputs.shortNotes];
                            next[idx] = e.target.value;
                            handleInputChange('shortNotes', next);
                          }}
                          placeholder={`Ghi chú quan sát ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = currentInputs.shortNotes.filter((_: any, i: number) => i !== idx);
                            handleInputChange('shortNotes', next);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Màu giấy nền (Base Paper)
                    </label>
                    <input
                      type="text"
                      value={currentInputs.basePaperColor || ''}
                      onChange={(e) => handleInputChange('basePaperColor', e.target.value)}
                      placeholder="Màu ngà tự nhiên (ivory) có xơ sợi giấy thủ công"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phong cách chữ máy đánh (Typewriter)
                    </label>
                    <input
                      type="text"
                      value={currentInputs.typewriterStyle || ''}
                      onChange={(e) => handleInputChange('typewriterStyle', e.target.value)}
                      placeholder="Font máy đánh chữ cơ học, mực xanh đen hoài niệm"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PRESET 5: MINH HỌA ĐỊA DANH TỐI GIẢN */}
            {selectedPresetId === 'minimal_geographic_editorial' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên địa danh / Di sản (Place Name) *
                    </label>
                    <input
                      type="text"
                      value={currentInputs.placeName || ''}
                      onChange={(e) => handleInputChange('placeName', e.target.value)}
                      placeholder="VD: Hà Nội, Cố Đô Huế, Phố Cổ Hội An, Vịnh Hạ Long, Tây Nguyên..."
                      className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dòng phụ đề (Subtitle)
                    </label>
                    <input
                      type="text"
                      value={currentInputs.subtitle || ''}
                      onChange={(e) => handleInputChange('subtitle', e.target.value)}
                      placeholder="VD: Dấu ấn ngàn năm văn hiến bên dòng sông Hồng"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Micro Vignettes Elements List */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Các yếu tố thu nhỏ tinh tế (Micro-Vignettes)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...(currentInputs.microVignetteElements || []), ''];
                        handleInputChange('microVignetteElements', next);
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm địa danh nhỏ
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(currentInputs.microVignetteElements || []).map((elem: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">📍 #{idx + 1}</span>
                        <input
                          type="text"
                          value={elem}
                          onChange={(e) => {
                            const next = [...currentInputs.microVignetteElements];
                            next[idx] = e.target.value;
                            handleInputChange('microVignetteElements', next);
                          }}
                          placeholder={`Chi tiết di sản ${idx + 1} (VD: Tháp Rùa, Cầu Thê Húc...)`}
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = currentInputs.microVignetteElements.filter((_: any, i: number) => i !== idx);
                            handleInputChange('microVignetteElements', next);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-sky-600" />
                    Đặc trưng phong cách Scandinavian + Japanese Editorial:
                  </div>
                  <p>
                    Nền ngà sáng liền mạch tràn viền, tuyệt đối không có viền bao tranh thô cứng; không mockup du lịch thương mại; nét vẽ fine-liner hữu cơ tinh xảo kết hợp loang màu nước nhẹ.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Reference Images Uploader (Ảnh Tham Chiếu) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  Ảnh Tham Chiếu Của Giáo Viên (Reference Images)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tùy chọn tải ảnh học sinh, trường lớp hoặc phong cách tham khảo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tải ảnh lên
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Privacy & Sandboxing Guarantee */}
            <div className="flex items-start gap-2.5 p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Quy tắc bảo mật sư phạm: </span>
                Ảnh tham chiếu được xử lý độc lập trong bộ nhớ phiên làm việc, <span className="font-semibold text-amber-950">hoàn toàn KHÔNG tự động lưu vào hồ sơ học sinh, sổ chủ nhiệm hay dữ liệu nghiệp vụ của nhà trường</span>.
              </div>
            </div>

            {/* Reference Images List */}
            {referenceImages.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50"
              >
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  Kéo thả hoặc bấm vào đây để tải ảnh tham chiếu
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hỗ trợ khóa nhận diện học sinh, khuôn mặt, trang phục hoặc bố cục
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {referenceImages.map((ref, idx) => (
                  <div
                    key={ref.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                  >
                    <img
                      src={ref.dataUrl}
                      alt={ref.name}
                      className="w-16 h-16 object-cover rounded-md border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 space-y-1.5 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                          Ảnh #{idx + 1}: {ref.name}
                        </span>
                        <button
                          onClick={() => handleRemoveReference(ref.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Purpose selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[11px] font-medium text-slate-500 block mb-0.5">Mục đích dùng:</label>
                          <select
                            value={ref.type}
                            onChange={(e) => handleUpdateReference(ref.id, 'type', e.target.value as ReferencePurpose)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md bg-white font-medium text-slate-700"
                          >
                            <option value="character">Dùng làm nhân vật chính</option>
                            <option value="face">Dùng làm nét mặt / khuôn mặt</option>
                            <option value="outfit">Dùng làm trang phục tham chiếu</option>
                            <option value="composition">Dùng làm bố cục không gian</option>
                            <option value="color">Dùng làm bảng màu tham khảo</option>
                            <option value="style">Dùng làm phong cách nghệ thuật</option>
                            <option value="object">Dùng làm vật thể</option>
                            <option value="inspiration">Cảm hứng tự do</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-500 block mb-0.5">Mức độ bảo lưu:</label>
                          <select
                            value={ref.preservationStrength}
                            onChange={(e) => handleUpdateReference(ref.id, 'preservationStrength', e.target.value as PreservationStrength)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md bg-white font-medium text-slate-700"
                          >
                            <option value="high">Cao (Khóa chuẩn nét)</option>
                            <option value="medium">Vừa (Linh hoạt)</option>
                            <option value="low">Thấp (Chỉ gợi cảm hứng)</option>
                          </select>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={ref.customInstruction || ''}
                        onChange={(e) => handleUpdateReference(ref.id, 'customInstruction', e.target.value)}
                        placeholder="Chỉ định riêng cho ảnh này (VD: Giữ nguyên màu áo trắng và nụ cười)..."
                        className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded-md bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Targeted Action & Local Edit (Chỉnh sửa cục bộ) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Chế Độ Tạo Hoặc Tinh Chỉnh Cục Bộ (Targeted Edit)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'normal', label: 'Tạo Mới 100%' },
                { id: 'edit_text', label: 'Sửa Chữ Tiếng Việt' },
                { id: 'change_character', label: 'Đổi Nhân Vật' },
                { id: 'change_palette', label: 'Đổi Bảng Màu' },
              ].map((act) => (
                <button
                  key={act.id}
                  onClick={() => setTargetedAction(act.id as any)}
                  className={`px-3 py-2 text-xs rounded-lg border font-semibold text-center transition-all ${
                    targetedAction === act.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {act.label}
                </button>
              ))}
            </div>

            {targetedAction !== 'normal' && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú điều chỉnh cục bộ ({targetedAction === 'edit_text' ? 'Nội dung chữ cần sửa' : targetedAction === 'change_character' ? 'Mô tả nhân vật mới' : 'Tông màu mới'}):
                </label>
                <input
                  type="text"
                  value={targetedNote}
                  onChange={(e) => setTargetedNote(e.target.value)}
                  placeholder="Nhập yêu cầu điều chỉnh chi tiết..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Custom Prompt Editor & GPT Image Suggestions Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                  <Edit3 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Sửa Prompt Tùy Ý &amp; Gợi Ý Prompt Chuẩn GPT-4o / DALL-E 3
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tùy chỉnh sâu câu lệnh sinh ảnh hoặc sao chép prompt tối ưu sẵn sàng dán vào ChatGPT / Midjourney
                  </p>
                </div>
              </div>

              {!isEditingPrompt ? (
                <button
                  type="button"
                  onClick={handleLoadCurrentPromptForEditing}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Trích xuất &amp; Tự sửa Prompt</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPromptText('');
                      setIsEditingPrompt(false);
                      showToast('Đã chuyển về chế độ tự động biên dịch từ biểu mẫu.', 'info');
                    }}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Hủy sửa
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadCurrentPromptForEditing}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Đồng bộ lại từ các trường dữ liệu ở trên"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Làm mới lại</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Prompt Modifier Suggestions (Gợi ý Prompt cho GPT Image / DALL-E) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Gợi ý bổ trợ nghệ thuật (Bấm 1 chạm để thêm vào Prompt):</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Ánh sáng ban mai ấm áp', snippet: 'Soft warm golden hour sunlight, gentle morning glow' },
                  { label: 'Phong cách vẽ màu nước thanh tao', snippet: 'Delicate watercolor wash, organic paper bleeding texture' },
                  { label: 'Đồng phục học sinh Việt Nam', snippet: 'Vietnamese elementary school students in clean uniform with red scarf' },
                  { label: 'Bố cục tạp chí Editorial thoáng đãng', snippet: 'Minimalist editorial layout, generous negative breathing space, clean typography hierarchy' },
                  { label: 'Màu sắc tươi sáng học đường', snippet: 'Vibrant harmonious pastel palette, friendly cheerful classroom atmosphere' },
                  { label: 'Chi tiết thủ công xé giấy', snippet: 'Handcrafted torn paper collage edges, realistic washi tape accents' },
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!isEditingPrompt) {
                        handleLoadCurrentPromptForEditing();
                      }
                      setCustomPromptText((prev) => {
                        const base = prev || '';
                        return base.includes(sug.snippet)
                          ? base
                          : `${base.trim()}\n\n[STYLE ENHANCEMENT]: ${sug.snippet}.`;
                      });
                      showToast(`Đã thêm gợi ý: "${sug.label}" vào Prompt.`, 'success');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-slate-400" />
                    <span>{sug.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt Textarea */}
            {isEditingPrompt && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span>Nội dung Prompt tùy chỉnh đang kích hoạt:</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {customPromptText.length} ký tự
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  placeholder="Nhập hoặc chỉnh sửa toàn bộ câu lệnh Master Prompt tại đây..."
                  className="w-full p-3 text-xs font-mono leading-relaxed bg-slate-50 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden text-slate-800 shadow-inner"
                />
                <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-lg text-[11px] text-blue-900 flex items-center justify-between gap-2">
                  <span>
                    💡 <strong>Ghi chú:</strong> Khi ô này có nội dung, hệ thống sẽ ưu tiên sử dụng chính xác câu lệnh này để sinh ảnh và đánh giá QA.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(customPromptText);
                      showToast('Đã sao chép prompt tùy chỉnh.', 'success');
                    }}
                    className="shrink-0 px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 font-bold rounded-md border border-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Execution Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerateImage}
              disabled={generating}
              className="flex-1 min-w-[200px] px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang thiết kế hình ảnh AI &amp; Kiểm định QA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  Tạo Tác Phẩm AI Ngay ({activePreset.nameVi})
                </>
              )}
            </button>

            <button
              onClick={handleInspectPrompt}
              className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm shadow-xs flex items-center gap-2"
              title="Xem Master Prompt đã biên dịch"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              Xem Prompt
            </button>
          </div>
        </div>

        {/* Right Column: Visual Preview, QA & History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Visual Showcase Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                Kết Quả Thiết Kế Thị Giác
              </h3>
              {currentArtifact && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDownload}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-slate-100"
                    title="Tải xuống vector SVG / Ảnh"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Artifact Preview Screen */}
            <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[380px] p-2 relative">
              {generating ? (
                <div className="text-center space-y-3 p-8">
                  <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    Đang chạy ImagePromptCompiler &amp; sinh bản vẽ...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Phong cách: {activePreset.artStyle}
                  </p>
                </div>
              ) : currentArtifact?.imageUrl ? (
                <div className="w-full flex flex-col items-center">
                  <img
                    src={currentArtifact.imageUrl}
                    alt={activePreset.nameVi}
                    className="max-h-[520px] w-auto object-contain rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <div className="text-center p-8 space-y-2 text-slate-400">
                  <Palette className="w-12 h-12 stroke-1 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">
                    Chưa tạo hình ảnh nào trong phiên này
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Bấm &quot;Tạo Tác Phẩm AI Ngay&quot; để thiết kế poster chuẩn sư phạm theo cấu hình bên trái.
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar under image */}
            {currentArtifact && (
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-500 font-medium">
                  Preset: <strong className="text-slate-700">{STYLE_PRESETS[currentArtifact.stylePreset]?.nameVi}</strong>
                </span>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" /> Tải về máy (SVG / Vector)
                </button>
              </div>
            )}
          </div>

          {/* Image QA Engine Report Card */}
          {currentArtifact?.qaResult && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Bộ Kiểm Định Chất Lượng QA (Image QA)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tiêu chuẩn văn hóa, an toàn học đường &amp; ngữ pháp tiếng Việt
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-xs border border-emerald-200">
                    {currentArtifact.qaResult.overallScore} / 100 Điểm
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-emerald-900">
                  {currentArtifact.qaResult.isApproved
                    ? 'ĐÃ DUYỆT ĐẠT CHUẨN SƯ PHẠM & VĂN HÓA VIỆT NAM'
                    : 'CẦN ĐIỀU CHỈNH THÊM'}
                </span>
              </div>

              {/* QA Checks Checklist */}
              <div className="space-y-2 text-xs">
                {Object.values(currentArtifact.qaResult.commonChecks)
                  .filter((item: any) => typeof item === 'object' && item.key)
                  .map((check: any) => (
                    <div key={check.key} className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          {check.label}
                        </span>
                        <span className="font-semibold text-emerald-700">{check.score}%</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{check.note}</p>
                    </div>
                  ))}

                {/* Style specific checks */}
                {currentArtifact.qaResult.styleSpecificChecks.map((check) => (
                  <div key={check.key} className="p-2 rounded-lg bg-sky-50/60 border border-sky-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-900 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-sky-600 stroke-[3]" />
                        {check.label}
                      </span>
                      <span className="font-semibold text-sky-700">{check.score}%</span>
                    </div>
                    <p className="text-[11px] text-sky-800/80">{check.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session History Carousel */}
          {historyArtifacts.length > 1 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lịch sử tạo trong phiên ({historyArtifacts.length})
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {historyArtifacts.map((hist) => (
                  <div
                    key={hist.id}
                    onClick={() => setCurrentArtifact(hist)}
                    className={`cursor-pointer rounded-lg border overflow-hidden p-1 transition-all ${
                      currentArtifact?.id === hist.id
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={hist.imageUrl}
                      alt={hist.stylePreset}
                      className="w-full h-16 object-cover rounded-sm"
                    />
                    <div className="text-[9px] font-bold text-slate-600 truncate mt-1 text-center">
                      {STYLE_PRESETS[hist.stylePreset]?.nameVi}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
      )}

      {/* Compiled Prompt Modal */}
      {showPromptModal && inspectedPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Chi Tiết Câu Lệnh Prompt &amp; Bản Dành Cho GPT Image
                </h3>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-4 pt-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setPromptModalTab('master')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  promptModalTab === 'master'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Master Prompt Nội Bộ</span>
              </button>
              <button
                type="button"
                onClick={() => setPromptModalTab('gpt_image')}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  promptModalTab === 'gpt_image'
                    ? 'border-blue-600 text-blue-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Bản Tối Ưu Cho GPT-4o / DALL-E 3</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {promptModalTab === 'master' ? (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Master Prompt Hoàn Chỉnh (Gửi tới Image Model):
                    </label>
                    <pre className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                      {inspectedPrompt.masterPrompt}
                    </pre>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Từ Khóa Tiếng Việt Khóa Chuẩn Dấu:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectedPrompt.vietnameseTextLocked.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium text-[11px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {inspectedPrompt.preservationRules.length > 0 && (
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Quy Tắc Bảo Lưu Ảnh Tham Chiếu (Preservation Rules):
                      </label>
                      <ul className="space-y-1 list-disc pl-4 text-slate-600">
                        {inspectedPrompt.preservationRules.map((rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Yếu Tố Bị Cấm (Prohibited Elements):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectedPrompt.prohibitedElements.map((el, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-medium text-[11px]"
                        >
                          ✕ {el}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* TAB 2: GPT IMAGE / DALL-E OPTIMIZED PROMPT */
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1 leading-relaxed">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <span>Hướng dẫn sử dụng với ChatGPT Plus / GPT Image / DALL-E 3:</span>
                    </div>
                    <p className="text-[11px]">
                      Sao chép đoạn prompt dưới đây và dán thẳng vào cuộc trò chuyện ChatGPT. Prompt đã được dịch và tối ưu hóa từ vựng tiếng Anh thị giác kết hợp câu lệnh khóa chữ tiếng Việt chính xác.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800">
                        Prompt Tinh Chỉnh Sẵn Sàng Cho GPT Image / DALL-E 3:
                      </label>
                      <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                        Aspect Ratio: {inspectedPrompt.aspectRatio}
                      </span>
                    </div>
                    <pre className="p-3.5 bg-slate-900 text-emerald-300 rounded-xl border border-slate-700 whitespace-pre-wrap font-mono text-[11px] leading-relaxed select-all">
{`Create a professional high-fidelity pedagogical poster in ${inspectedPrompt.aspectRatio} aspect ratio.
Art Style: ${STYLE_PRESETS[inspectedPrompt.stylePreset]?.artStyle || 'Clean Flat Editorial Illustration'}.
Topic & Context: Vietnamese educational environment, wholesome, culturally respectful.
Primary Scene: ${inspectedPrompt.vietnameseTextLocked[0] || 'Vietnamese School Poster'}.
Required Exact Vietnamese Text (Preserve accents and diacritics 100%):
${inspectedPrompt.vietnameseTextLocked.map((txt) => `- "${txt}"`).join('\n')}

Style Guidelines:
- Clean minimalist layout with clear visual hierarchy and generous negative breathing space.
- Highly readable modern sans-serif typography (Be Vietnam Pro / Inter).
- Warm, welcoming color harmony suitable for primary school students and teachers.
- Strict prohibition: No distorted anatomy, no nonsensical fake text, no commercial branding.`}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Tỷ lệ: {inspectedPrompt.aspectRatio} · Preset: {inspectedPrompt.stylePreset}
              </span>
              <button
                onClick={() => {
                  const textToCopy =
                    promptModalTab === 'master'
                      ? inspectedPrompt.masterPrompt
                      : `Create a professional high-fidelity pedagogical poster in ${inspectedPrompt.aspectRatio} aspect ratio.\nArt Style: ${STYLE_PRESETS[inspectedPrompt.stylePreset]?.artStyle || 'Clean Flat Editorial Illustration'}.\nTopic & Context: Vietnamese educational environment, wholesome, culturally respectful.\nRequired Exact Vietnamese Text (Preserve accents and diacritics 100%):\n${inspectedPrompt.vietnameseTextLocked.map((txt) => `- "${txt}"`).join('\n')}\n\nStrict prohibition: No distorted anatomy, no nonsensical fake text, no commercial branding.`;

                  navigator.clipboard.writeText(textToCopy);
                  showToast(
                    promptModalTab === 'master'
                      ? 'Đã sao chép Master Prompt.'
                      : 'Đã sao chép Prompt chuẩn GPT Image!',
                    'success'
                  );
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {promptModalTab === 'master' ? 'Sao chép Master Prompt' : 'Sao chép Prompt GPT Image'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

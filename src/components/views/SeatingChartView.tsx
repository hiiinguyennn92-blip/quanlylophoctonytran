import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, SeatingAssignment, SeatingLayoutConfig, DeskType, ClassroomModel } from '../../types';
import { SeatingRepository } from '../../repositories/dataRepository';
import {
  Grid,
  Printer,
  Sparkles,
  Save,
  Users,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Glasses,
  Crown,
  Search,
  ArrowLeftRight,
  ArrowRightLeft,
  X,
  Plus,
  DoorOpen,
  Sun,
  Columns,
  Rows,
  Layers,
  Check,
  Tv,
  BookOpen,
  Award,
  Trash2,
  Maximize2,
  SlidersHorizontal,
  Ban,
  RefreshCw,
  Zap,
  CheckCheck,
  Wand2,
  UserCheck,
  Smile,
  FileSpreadsheet,
  Info,
} from 'lucide-react';

const DEFAULT_CONFIG: SeatingLayoutConfig = {
  columns: 3,
  rows: 5,
  deskType: 'double',
  teacherDeskPos: 'right',
  boardTitle: 'BẢNG XANH LỚP HỌC · THI ĐUA DẠY TỐT - HỌC TỐT',
  mottoText: 'NÉT CHỮ NẾT NGƯỜI · MỖI NGÀY ĐẾN TRƯỜNG LÀ MỘT NGÀY VUI',
  showAvatars: true,
  showGroupBadge: true,
  showSpecialNotes: true,
  doorPos: 'left',
  windowPos: 'right',
  backDoorPos: 'right',
  smartTvPos: 'left',
  libraryCornerPos: 'left',
  honorCornerPos: 'right',
  aisleWidth: 'normal',
  themeStyle: 'chalkboard',
  columnLabels: ['Dãy 1 · Tổ 1', 'Dãy 2 · Tổ 2', 'Dãy 3 · Tổ 3', 'Dãy 4 · Tổ 4'],
  disabledSeats: [],
  syncWithRoster: true,
};

const PRESETS: Array<{
  name: string;
  desc: string;
  cols: number;
  rows: number;
  deskType: DeskType;
  icon: string;
  idealCount: string;
}> = [
  {
    name: 'Chuẩn 3 Dãy Bàn Đôi',
    desc: '3 Dãy x 5 Hàng = 30 chỗ (Mô hình phổ biến nhất Tiểu học)',
    cols: 3,
    rows: 5,
    deskType: 'double',
    icon: '🏫',
    idealCount: '28 - 30 học sinh',
  },
  {
    name: '3 Dãy Đôi Mở Rộng',
    desc: '3 Dãy x 6 Hàng = 36 chỗ (Lớp học chuẩn 35 - 36 học sinh)',
    cols: 3,
    rows: 6,
    deskType: 'double',
    icon: '📚',
    idealCount: '34 - 36 học sinh',
  },
  {
    name: 'Chuẩn 4 Dãy Bàn Đôi',
    desc: '4 Dãy x 5 Hàng = 40 chỗ (Lớp sĩ số đông đô thị)',
    cols: 4,
    rows: 5,
    deskType: 'double',
    icon: '🏢',
    idealCount: '36 - 40 học sinh',
  },
  {
    name: '4 Dãy Gọn 4 Hàng',
    desc: '4 Dãy x 4 Hàng = 32 chỗ (Tương ứng 4 Tổ học sinh)',
    cols: 4,
    rows: 4,
    deskType: 'double',
    icon: '🎒',
    idealCount: '30 - 32 học sinh',
  },
  {
    name: '3 Dãy Bàn Ba (3 em/bàn)',
    desc: '3 Dãy x 4 Hàng = 36 chỗ (Bàn dài 3 học sinh)',
    cols: 3,
    rows: 4,
    deskType: 'triple',
    icon: '👥',
    idealCount: '33 - 36 học sinh',
  },
  {
    name: 'Bàn Đơn / Phòng Thi',
    desc: '4 Dãy x 6 Hàng = 24 chỗ (Bàn đơn cá nhân, tập trung)',
    cols: 4,
    rows: 6,
    deskType: 'single',
    icon: '🎯',
    idealCount: '20 - 24 học sinh',
  },
];

// Helper to compute optimal layout based on target student count
function calculateOptimalLayout(studentCount: number, preferredDeskType: DeskType = 'double'): {
  columns: number;
  rows: number;
  deskType: DeskType;
  totalSeats: number;
} {
  const count = Math.max(1, studentCount);

  if (preferredDeskType === 'single') {
    const cols = count > 24 ? 5 : 4;
    const rows = Math.min(8, Math.max(3, Math.ceil(count / cols)));
    return { columns: cols, rows, deskType: 'single', totalSeats: cols * rows };
  }

  if (preferredDeskType === 'triple') {
    const cols = 3;
    const rows = Math.min(8, Math.max(3, Math.ceil(count / (cols * 3))));
    return { columns: cols, rows, deskType: 'triple', totalSeats: cols * rows * 3 };
  }

  // Standard Double Desks (most common in Vietnam)
  if (count <= 24) {
    return { columns: 3, rows: 4, deskType: 'double', totalSeats: 24 };
  }
  if (count <= 30) {
    return { columns: 3, rows: 5, deskType: 'double', totalSeats: 30 };
  }
  if (count <= 34) {
    return { columns: 4, rows: 4, deskType: 'double', totalSeats: 32 };
  }
  if (count <= 36) {
    return { columns: 3, rows: 6, deskType: 'double', totalSeats: 36 };
  }
  if (count <= 40) {
    return { columns: 4, rows: 5, deskType: 'double', totalSeats: 40 };
  }
  // Larger classes 41 - 48
  const cols = 4;
  const rows = Math.min(8, Math.max(5, Math.ceil(count / (cols * 2))));
  return { columns: cols, rows, deskType: 'double', totalSeats: cols * rows * 2 };
}

export const SeatingChartView: React.FC = () => {
  const { activeClass, currentUser, students, seatingAssignments, refreshSeating, showToast } = useApp();

  // Layout Configuration
  const [config, setConfig] = useState<SeatingLayoutConfig>(DEFAULT_CONFIG);
  const [tempConfig, setTempConfig] = useState<SeatingLayoutConfig>(DEFAULT_CONFIG);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Manual Target Student Count for teacher synchronization
  const [targetStudentCount, setTargetStudentCount] = useState<number>(() => {
    return students.length || 32;
  });

  // Seating Matrix State: key is `${row}_${col}_${pos}` -> studentId
  const [seats, setSeats] = useState<Record<string, string>>({});
  const [selectedSeat, setSelectedSeat] = useState<{ row: number; col: number; pos: string } | null>(null);
  const [selectedUnassignedStudentId, setSelectedUnassignedStudentId] = useState<string | null>(null);

  // Search & Filter in Unassigned Tray
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  // Saving state
  const [saving, setSaving] = useState(false);

  // Map of students for O(1) lookup
  const studentMap = useMemo(() => {
    return new Map(students.map((s) => [s.id, s]));
  }, [students]);

  // Keep target count in sync with students.length if not explicitly overridden
  useEffect(() => {
    if (students.length > 0) {
      setTargetStudentCount((prev) => (prev === 32 && students.length !== 32 ? students.length : prev));
    }
  }, [students.length]);

  // Load layout config from repository
  useEffect(() => {
    if (!activeClass || !currentUser) return;

    const loadConfig = async () => {
      try {
        const saved = await SeatingRepository.getLayoutConfig(activeClass.id, currentUser.uid);
        if (saved) {
          setConfig((prev) => ({
            ...prev,
            ...saved,
            columnLabels: saved.columnLabels || prev.columnLabels || ['Dãy 1 · Tổ 1', 'Dãy 2 · Tổ 2', 'Dãy 3 · Tổ 3', 'Dãy 4 · Tổ 4'],
            disabledSeats: saved.disabledSeats || [],
          }));
          if (saved.targetStudentCount) {
            setTargetStudentCount(saved.targetStudentCount);
          }
        } else {
          // Adjust default config according to student count
          const count = students.length || 30;
          const optimal = calculateOptimalLayout(count, 'double');
          setConfig((prev) => ({
            ...prev,
            columns: optimal.columns,
            rows: optimal.rows,
            deskType: optimal.deskType,
          }));
        }
      } catch (err) {
        console.warn('Error loading seating config:', err);
      }
    };

    loadConfig();
  }, [activeClass, currentUser, students.length]);

  // Sync seats from database
  useEffect(() => {
    const map: Record<string, string> = {};

    seatingAssignments.forEach((assign) => {
      if (studentMap.has(assign.studentId)) {
        map[`${assign.row}_${assign.col}_${assign.position}`] = assign.studentId;
      }
    });

    // If completely empty and we have students, assign default layout
    if (seatingAssignments.length === 0 && students.length > 0) {
      let stuIdx = 0;
      const cols = config.columns;
      const rows = config.rows;
      const positions = config.deskType === 'triple' ? ['left', 'middle', 'right'] : config.deskType === 'single' ? ['single'] : ['left', 'right'];
      const disabledSet = new Set(config.disabledSeats || []);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          for (const pos of positions) {
            const key = `${r}_${c}_${pos}`;
            if (!disabledSet.has(key) && stuIdx < students.length) {
              map[key] = students[stuIdx].id;
              stuIdx++;
            }
          }
        }
      }
    }

    setSeats(map);
  }, [seatingAssignments, studentMap, config.columns, config.rows, config.deskType, config.disabledSeats, students]);

  // Assigned student IDs
  const assignedStudentIds = useMemo(() => {
    const set = new Set<string>();
    Object.values(seats).forEach((id) => {
      if (id && studentMap.has(id)) set.add(id);
    });
    return set;
  }, [seats, studentMap]);

  // Unassigned students
  const unassignedStudents = useMemo(() => {
    return students.filter((s) => !assignedStudentIds.has(s.id));
  }, [students, assignedStudentIds]);

  // Filtered unassigned students
  const filteredUnassignedStudents = useMemo(() => {
    return unassignedStudents.filter((s) => {
      const matchName = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || (s.studentCode && s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchGroup = filterGroup === 'all' || s.groupId === filterGroup;
      return matchName && matchGroup;
    });
  }, [unassignedStudents, searchQuery, filterGroup]);

  // Unique groups for filtering
  const groupsList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.groupId) set.add(s.groupId);
    });
    return Array.from(set).sort();
  }, [students]);

  // Seats per desk based on deskType
  const seatPositions = useMemo(() => {
    if (config.deskType === 'triple') return ['left', 'middle', 'right'];
    if (config.deskType === 'single') return ['single'];
    return ['left', 'right'];
  }, [config.deskType]);

  // Raw physical capacity vs. active capacity (accounting for disabled/removed seats)
  const rawCapacity = config.columns * config.rows * seatPositions.length;
  const disabledSeatsCount = (config.disabledSeats || []).filter((k) => {
    const parts = k.split('_');
    if (parts.length >= 2) {
      const r = Number(parts[0]);
      const c = Number(parts[1]);
      return r < config.rows && c < config.columns;
    }
    return false;
  }).length;
  const activeCapacity = Math.max(0, rawCapacity - disabledSeatsCount);

  // Sync state analysis
  const currentRosterCount = students.length;
  const effectiveTargetCount = targetStudentCount || currentRosterCount;
  const isCapacitySufficient = activeCapacity >= effectiveTargetCount;
  const capacityDelta = activeCapacity - effectiveTargetCount;

  // Handle seat click
  const handleSeatClick = (row: number, col: number, pos: string) => {
    const seatKey = `${row}_${col}_${pos}`;

    // If seat is disabled (bàn khuyết)
    if ((config.disabledSeats || []).includes(seatKey)) {
      showToast('Vị trí này đang bị khóa / bỏ trống (bàn khuyết). Hãy nhấp "Cấu trúc bàn ghế" hoặc mở khóa nếu muốn sử dụng.', 'info');
      return;
    }

    // Case 1: An unassigned student was selected -> place them into this seat
    if (selectedUnassignedStudentId) {
      setSeats((prev) => {
        const next = { ...prev };
        next[seatKey] = selectedUnassignedStudentId;
        return next;
      });
      setSelectedUnassignedStudentId(null);
      showToast('Đã xếp học sinh vào chỗ ngồi!');
      return;
    }

    // Case 2: No seat currently selected -> select this seat
    if (!selectedSeat) {
      setSelectedSeat({ row, col, pos });
      return;
    }

    // Case 3: Clicked the exact same seat -> deselect
    if (selectedSeat.row === row && selectedSeat.col === col && selectedSeat.pos === pos) {
      setSelectedSeat(null);
      return;
    }

    // Case 4: Swap seats between two positions
    const key1 = `${selectedSeat.row}_${selectedSeat.col}_${selectedSeat.pos}`;
    const key2 = seatKey;

    setSeats((prev) => {
      const next = { ...prev };
      const id1 = next[key1];
      const id2 = next[key2];

      if (id2) next[key1] = id2;
      else delete next[key1];

      if (id1) next[key2] = id1;
      else delete next[key2];

      return next;
    });

    setSelectedSeat(null);
    showToast('Đã hoán đổi vị trí chỗ ngồi!');
  };

  // Remove student from selected seat
  const handleClearSelectedSeat = () => {
    if (!selectedSeat) return;
    const key = `${selectedSeat.row}_${selectedSeat.col}_${selectedSeat.pos}`;
    setSeats((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSelectedSeat(null);
    showToast('Đã đưa học sinh ra khỏi chỗ ngồi.');
  };

  // Toggle Disabled Seat (Bàn khuyết thực tế)
  const handleToggleDisabledSeat = (row: number, col: number, pos: string) => {
    const key = `${row}_${col}_${pos}`;
    const currentDisabled = config.disabledSeats || [];
    const isCurrentlyDisabled = currentDisabled.includes(key);

    let nextDisabled: string[];
    if (isCurrentlyDisabled) {
      nextDisabled = currentDisabled.filter((k) => k !== key);
      showToast('Đã mở lại chỗ ngồi này trong phòng học.');
    } else {
      nextDisabled = [...currentDisabled, key];
      // If a student was here, unseat them
      setSeats((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      showToast('Đã đánh dấu bàn khuyết / bỏ trống vị trí này.');
    }

    const updatedConfig = { ...config, disabledSeats: nextDisabled };
    setConfig(updatedConfig);

    if (activeClass && currentUser) {
      SeatingRepository.saveLayoutConfig(activeClass.id, currentUser.uid, updatedConfig).catch(console.warn);
    }
  };

  // Smart Auto-Fit: Sync classroom desks with target/roster count
  const handleAutoFitToRoster = async (customCount?: number) => {
    const count = customCount !== undefined ? customCount : effectiveTargetCount;
    const optimal = calculateOptimalLayout(count, config.deskType);

    const updatedConfig: SeatingLayoutConfig = {
      ...config,
      columns: optimal.columns,
      rows: optimal.rows,
      targetStudentCount: count,
      columnLabels:
        config.columnLabels && config.columnLabels.length >= optimal.columns
          ? config.columnLabels.slice(0, optimal.columns)
          : Array.from({ length: optimal.columns }, (_, i) => `Dãy ${i + 1} · Tổ ${i + 1}`),
    };

    setConfig(updatedConfig);

    if (activeClass && currentUser) {
      try {
        await SeatingRepository.saveLayoutConfig(activeClass.id, currentUser.uid, updatedConfig);
        showToast(`Đã đồng bộ phòng học vừa khớp sĩ số ${count} học sinh (${optimal.columns} dãy x ${optimal.rows} hàng = ${optimal.totalSeats} chỗ)!`);
      } catch (e) {
        console.warn('Auto fit save error:', e);
      }
    }
  };

  // Arrange by Groups (Xếp theo 4 Tổ học sinh)
  const handleArrangeByGroups = () => {
    if (students.length === 0) {
      showToast('Lớp chưa có học sinh để xếp chỗ.', 'info');
      return;
    }

    const cols = config.columns;
    const rows = config.rows;
    const disabledSet = new Set(config.disabledSeats || []);

    // Bucket students by group or unassigned
    const groupBuckets: Record<string, Student[]> = {
      group1: [],
      group2: [],
      group3: [],
      group4: [],
      other: [],
    };

    students.forEach((s) => {
      const g = (s.groupId || '').toLowerCase();
      if (g.includes('1')) groupBuckets.group1.push(s);
      else if (g.includes('2')) groupBuckets.group2.push(s);
      else if (g.includes('3')) groupBuckets.group3.push(s);
      else if (g.includes('4')) groupBuckets.group4.push(s);
      else groupBuckets.other.push(s);
    });

    // Helper to sort students in each group: nearsighted or short height in front, then leaders, then alternating gender
    const sortGroup = (arr: Student[]) => {
      return [...arr].sort((a, b) => {
        const aNear = a.notes?.toLowerCase().includes('cận') || a.notes?.toLowerCase().includes('thấp') || false;
        const bNear = b.notes?.toLowerCase().includes('cận') || b.notes?.toLowerCase().includes('thấp') || false;
        if (aNear && !bNear) return -1;
        if (!aNear && bNear) return 1;

        const aLeader = (a.roleTitle || a.notes || '').toLowerCase().includes('trưởng');
        const bLeader = (b.roleTitle || b.notes || '').toLowerCase().includes('trưởng');
        if (aLeader && !bLeader) return -1;
        if (!aLeader && bLeader) return 1;

        return a.fullName.localeCompare(b.fullName);
      });
    };

    const orderedBuckets = [
      sortGroup(groupBuckets.group1),
      sortGroup(groupBuckets.group2),
      sortGroup(groupBuckets.group3),
      sortGroup(groupBuckets.group4),
    ];

    // Combine remaining
    const overflow: Student[] = [...groupBuckets.other];

    const newSeats: Record<string, string> = {};

    // Map each column to a group bucket
    for (let c = 0; c < cols; c++) {
      const bucket = orderedBuckets[c] || [];
      let bIdx = 0;

      for (let r = 0; r < rows; r++) {
        for (const pos of seatPositions) {
          const key = `${r}_${c}_${pos}`;
          if (disabledSet.has(key)) continue;

          if (bIdx < bucket.length) {
            newSeats[key] = bucket[bIdx].id;
            bIdx++;
          } else if (overflow.length > 0) {
            const nextStudent = overflow.shift();
            if (nextStudent) newSeats[key] = nextStudent.id;
          }
        }
      }

      // If bucket has students left over, push to overflow
      while (bIdx < bucket.length) {
        overflow.push(bucket[bIdx]);
        bIdx++;
      }
    }

    // Second pass: fill any remaining empty seats with overflow students
    if (overflow.length > 0) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          for (const pos of seatPositions) {
            const key = `${r}_${c}_${pos}`;
            if (disabledSet.has(key) || newSeats[key]) continue;
            if (overflow.length > 0) {
              const s = overflow.shift();
              if (s) newSeats[key] = s.id;
            }
          }
        }
      }
    }

    setSeats(newSeats);
    setSelectedSeat(null);
    setSelectedUnassignedStudentId(null);
    showToast('Đã tổ chức xếp chỗ theo 4 Tổ học sinh: Mỗi Dãy 1 Tổ, bạn cận thị ngồi bàn đầu!');
  };

  // Smart Arrange (Ưu tiên cận thị & chiều cao)
  const handleSmartArrange = () => {
    if (students.length === 0) {
      showToast('Lớp chưa có học sinh để sắp xếp.', 'info');
      return;
    }

    const disabledSet = new Set(config.disabledSeats || []);

    // Sort priority: 'cận' or 'thấp' first, then group, then name
    const sorted = [...students].sort((a, b) => {
      const aNear = a.notes?.toLowerCase().includes('cận') || a.notes?.toLowerCase().includes('thấp') || false;
      const bNear = b.notes?.toLowerCase().includes('cận') || b.notes?.toLowerCase().includes('thấp') || false;
      if (aNear && !bNear) return -1;
      if (!aNear && bNear) return 1;

      if (a.groupId && b.groupId && a.groupId !== b.groupId) {
        return a.groupId.localeCompare(b.groupId);
      }

      return a.fullName.localeCompare(b.fullName);
    });

    const newSeats: Record<string, string> = {};
    let idx = 0;

    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.columns; c++) {
        for (const pos of seatPositions) {
          const key = `${r}_${c}_${pos}`;
          if (disabledSet.has(key)) continue;

          if (idx < sorted.length) {
            newSeats[key] = sorted[idx].id;
            idx++;
          }
        }
      }
    }

    setSeats(newSeats);
    setSelectedSeat(null);
    setSelectedUnassignedStudentId(null);
    showToast('Đã xếp chỗ thông minh: Học sinh cận thị & thấp bé được ưu tiên các bàn đầu!');
  };

  // Rotate Columns (Đảo dãy luân phiên chống tật khúc xạ / vẹo cột sống)
  const handleRotateColumns = () => {
    const cols = config.columns;
    const newSeats: Record<string, string> = {};

    Object.entries(seats).forEach(([key, stuId]) => {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const r = Number(parts[0]);
        const c = Number(parts[1]);
        const pos = parts.slice(2).join('_');
        const newCol = (c + 1) % cols;
        newSeats[`${r}_${newCol}_${pos}`] = stuId;
      }
    });

    setSeats(newSeats);
    showToast(`Đã đảo dãy luân phiên: Dãy 1 sang Dãy 2, Dãy ${cols} chuyển về Dãy 1!`);
  };

  // Rotate Rows (Đảo hàng bàn: Hàng 1 xuống cuối, các hàng sau đôn lên)
  const handleRotateRows = () => {
    const rows = config.rows;
    const newSeats: Record<string, string> = {};

    Object.entries(seats).forEach(([key, stuId]) => {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const r = Number(parts[0]);
        const c = Number(parts[1]);
        const pos = parts.slice(2).join('_');
        const newRow = (r + 1) % rows;
        newSeats[`${newRow}_${c}_${pos}`] = stuId;
      }
    });

    setSeats(newSeats);
    showToast(`Đã đảo hàng luân phiên: Hàng 1 chuyển xuống cuối, các hàng dưới đôn lên 1 bậc!`);
  };

  // Save Seating to database
  const handleSave = async () => {
    if (!activeClass || !currentUser) return;
    setSaving(true);
    try {
      const payload: any[] = [];
      Object.entries(seats).forEach(([key, studentId]) => {
        const parts = key.split('_');
        if (parts.length >= 3 && studentId && studentMap.has(studentId)) {
          payload.push({
            row: Number(parts[0]),
            col: Number(parts[1]),
            position: parts.slice(2).join('_'),
            studentId,
          });
        }
      });

      await Promise.all([
        SeatingRepository.saveSeating(activeClass.id, currentUser.uid, payload),
        SeatingRepository.saveLayoutConfig(activeClass.id, currentUser.uid, {
          ...config,
          targetStudentCount: effectiveTargetCount,
        }),
      ]);

      await refreshSeating();
      showToast('Đã lưu sơ đồ chỗ ngồi & cấu trúc phòng học thực tế thành công!');
    } catch (err: any) {
      showToast('Lỗi khi lưu sơ đồ: ' + (err.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Open config modal
  const openConfigModal = () => {
    setTempConfig(JSON.parse(JSON.stringify(config)));
    setIsConfigModalOpen(true);
  };

  const handleApplyConfig = async () => {
    setConfig(tempConfig);
    setIsConfigModalOpen(false);

    if (activeClass && currentUser) {
      try {
        await SeatingRepository.saveLayoutConfig(activeClass.id, currentUser.uid, tempConfig);
      } catch (err) {
        console.warn('Auto saving config error:', err);
      }
    }
    showToast('Đã cập nhật cấu trúc phòng học thành công!');
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setTempConfig((prev) => ({
      ...prev,
      columns: preset.cols,
      rows: preset.rows,
      deskType: preset.deskType,
      columnLabels:
        prev.columnLabels && prev.columnLabels.length >= preset.cols
          ? prev.columnLabels.slice(0, preset.cols)
          : Array.from({ length: preset.cols }, (_, i) => `Dãy ${i + 1} · Tổ ${i + 1}`),
    }));
  };

  const currentSelectedStudent = selectedSeat
    ? studentMap.get(seats[`${selectedSeat.row}_${selectedSeat.col}_${selectedSeat.pos}`] || '')
    : null;

  // Group Color Badge Helper
  const getGroupBadgeClass = (groupName?: string) => {
    if (!groupName) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    if (groupName.includes('1')) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    if (groupName.includes('2')) return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800';
    if (groupName.includes('3')) return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
    if (groupName.includes('4')) return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 no-print transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sơ Đồ Chỗ Ngồi & Cấu Trúc Lớp {activeClass?.className || '---'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {config.columns} dãy · {config.rows} hàng · {config.deskType === 'triple' ? 'Bàn ba' : config.deskType === 'single' ? 'Bàn đơn' : 'Bàn đôi'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sĩ số lớp: <strong className="text-slate-900 dark:text-slate-100">{currentRosterCount}</strong> HS ·
              Đã xếp chỗ: <strong className="text-emerald-600 dark:text-emerald-400">{assignedStudentIds.size}</strong>/{currentRosterCount} ·
              Sức chứa phòng: <strong className="text-slate-900 dark:text-slate-100">{activeCapacity}</strong> chỗ ({disabledSeatsCount > 0 ? `${disabledSeatsCount} ghế khuyết` : '100% bàn mở'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Cấu trúc phòng học Modal Button */}
          <button
            onClick={openConfigModal}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Tùy chỉnh số dãy, số hàng, loại bàn, cửa ra vào, bảng đen, tủ sách..."
          >
            <Settings2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Cấu trúc phòng học</span>
          </button>

          {/* Xếp theo 4 Tổ học sinh */}
          <button
            onClick={handleArrangeByGroups}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Tổ chức học sinh theo 4 Tổ: Mỗi dãy là một Tổ học tập"
          >
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Xếp theo 4 Tổ</span>
          </button>

          {/* Xếp chỗ thông minh (Cận thị) */}
          <button
            onClick={handleSmartArrange}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Xếp chỗ thông minh: Ưu tiên học sinh cận thị & chiều cao ngồi bàn đầu"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Ưu tiên cận thị</span>
          </button>

          {/* Rotate Dropdown / Actions */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={handleRotateColumns}
              className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-emerald-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="Đảo luân phiên các dãy bàn hàng tuần (tránh tật khúc xạ mắt)"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Đảo dãy</span>
            </button>
            <button
              onClick={handleRotateRows}
              className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-emerald-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="Đảo luân phiên hàng bàn (hàng 1 xuống cuối, các hàng sau đôn lên)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 rotate-90" />
              <span>Đảo hàng</span>
            </button>
          </div>

          {/* In Sơ Đồ */}
          <button
            onClick={() => window.print()}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="In sơ đồ chỗ ngồi chuẩn A4 cho Sổ Chủ Nhiệm"
          >
            <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>In sơ đồ</span>
          </button>

          {/* Lưu Sơ Đồ */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : 'Lưu sơ đồ'}</span>
          </button>
        </div>
      </div>

      {/* 2. Roster & Classroom Desk Synchronization Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs no-print transition-colors">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Left: Input Sĩ Số & Roster Count */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Sĩ số học sinh:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setTargetStudentCount((prev) => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center hover:bg-slate-200 cursor-pointer shadow-2xs"
                  title="Giảm 1 học sinh"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={targetStudentCount}
                  onChange={(e) => setTargetStudentCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 text-center text-xs font-bold bg-transparent border-0 text-slate-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setTargetStudentCount((prev) => Math.min(60, prev + 1))}
                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center hover:bg-slate-200 cursor-pointer shadow-2xs"
                  title="Tăng 1 học sinh"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">em</span>

              {targetStudentCount !== currentRosterCount && currentRosterCount > 0 && (
                <button
                  type="button"
                  onClick={() => setTargetStudentCount(currentRosterCount)}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold underline hover:text-emerald-700 cursor-pointer ml-1"
                >
                  (Khớp với {currentRosterCount} em trong danh sách)
                </button>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

            {/* Sync Meter Status */}
            <div className="flex items-center gap-2">
              {capacityDelta === 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold">
                  <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Khớp hoàn hảo 100% ({activeCapacity} chỗ / {effectiveTargetCount} HS)</span>
                </div>
              ) : capacityDelta < 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Thiếu {Math.abs(capacityDelta)} chỗ ngồi so với sĩ số ({activeCapacity}/{effectiveTargetCount})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-semibold">
                  <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Dư {capacityDelta} chỗ ngồi dự phòng ({activeCapacity} chỗ / {effectiveTargetCount} HS)</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: One-Click Auto Fit Desk Layout Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAutoFitToRoster()}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Tự động tính toán số hàng và dãy bàn tối ưu theo sĩ số đã nhập"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Đồng bộ bàn ghế vừa khít sĩ số ({effectiveTargetCount} em)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Selected Seat Interactive Helper Banner */}
      {selectedSeat && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/60 border border-amber-300 dark:border-amber-700 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-950 dark:text-amber-200 animate-in fade-in no-print shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></div>
            <span>
              Đang chọn: <strong>Hàng {selectedSeat.row + 1} · Dãy {selectedSeat.col + 1} ({selectedSeat.pos === 'left' ? 'Vị trí Trái' : selectedSeat.pos === 'right' ? 'Vị trí Phải' : selectedSeat.pos === 'middle' ? 'Vị trí Giữa' : 'Bàn Đơn'})</strong>
              {currentSelectedStudent ? (
                <span> — Học sinh: <strong className="text-emerald-800 dark:text-emerald-300">{currentSelectedStudent.fullName}</strong> ({currentSelectedStudent.groupId})</span>
              ) : (
                <span className="italic text-slate-500 dark:text-slate-400"> — (Bàn trống)</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-amber-800 dark:text-amber-300 hidden md:inline">
              👉 Chạm vào bất kỳ bàn khác để <strong>Hoán đổi vị trí</strong>
            </span>
            {currentSelectedStudent && (
              <button
                type="button"
                onClick={handleClearSelectedSeat}
                className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Rút khỏi bàn</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleToggleDisabledSeat(selectedSeat.row, selectedSeat.col, selectedSeat.pos)}
              className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              title="Đánh dấu chỗ này là bàn khuyết hoặc mở lại chỗ"
            >
              <Ban className="w-3.5 h-3.5 text-slate-500" />
              <span>Khóa/Bỏ bàn khuyết</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSeat(null)}
              className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Hủy chọn
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Classroom Visual Container (Podium, Blackboard, Desks, Doors, Corners) */}
      <div className="bg-slate-900/5 dark:bg-slate-950/40 rounded-3xl p-4 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs printable-area space-y-7 backdrop-blur-xs transition-colors">
        {/* Printable Header (Visible only when printed) */}
        <div className="hidden print:block text-center border-b border-slate-300 pb-3 mb-4">
          <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1">
            PHÒNG GD&ĐT QUẬN/HUYỆN · TRƯỜNG TIỂU HỌC {activeClass?.schoolName?.toUpperCase() || ''}
          </div>
          <h1 className="text-xl font-bold uppercase text-slate-900 tracking-tight">
            SƠ ĐỒ CHỖ NGỒI LỚP HỌC {activeClass?.className?.toUpperCase()}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Năm học: {activeClass?.schoolYear} · GVCN: {activeClass?.teacherName} · Sĩ số: {currentRosterCount} học sinh · Khung bàn: {config.columns} dãy x {config.rows} hàng
          </p>
        </div>

        {/* Classroom Front Wall: Blackboard, Teacher Desk, Smart TV, Doors, Windows */}
        <div className="relative max-w-4xl mx-auto space-y-3">
          {/* Class Motto / Khẩu hiệu lớp học */}
          {config.mottoText && (
            <div className="text-center">
              <span className="inline-block px-4 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800/80 shadow-2xs">
                ★ {config.mottoText} ★
              </span>
            </div>
          )}

          {/* Front Wall Elements: Doors, Windows, Podium indicator */}
          <div className="flex items-center justify-between text-xs font-semibold px-2 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-700">
              <DoorOpen className="w-4 h-4 text-amber-600" />
              <span>{config.doorPos === 'left' ? 'Cửa chính ra vào (Trước)' : 'Cửa sổ hành lang'}</span>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-400 uppercase tracking-widest font-bold hidden sm:block">
              ↑ HƯỚNG BỤC GIẢNG & BẢNG LỚP HỌC ↑
            </div>

            <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-700">
              <Sun className="w-4 h-4 text-sky-500" />
              <span>{config.windowPos === 'right' ? 'Dãy cửa sổ đón sáng' : 'Lối đi / Hành lang'}</span>
            </div>
          </div>

          {/* Realistic Blackboard with Smart TV & Wooden Frame */}
          <div className="relative mx-auto rounded-2xl overflow-hidden shadow-lg border-4 border-amber-900/90 bg-gradient-to-b from-[#173a2c] via-[#102d22] to-[#0c241b] text-white p-4 text-center">
            {/* Wooden frame corner bolts */}
            <div className="absolute top-1.5 left-2.5 w-2 h-2 rounded-full bg-amber-400/80 shadow-xs"></div>
            <div className="absolute top-1.5 right-2.5 w-2 h-2 rounded-full bg-amber-400/80 shadow-xs"></div>

            {/* Smart TV / Interactive Screen on corner of board */}
            {config.smartTvPos !== 'none' && (
              <div
                className={`absolute top-2 ${
                  config.smartTvPos === 'left' ? 'left-3' : 'right-3'
                } hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-[10px] text-sky-300 font-semibold shadow-xs`}
                title="Màn hình Smart TV tương tác / Máy chiếu bài giảng"
              >
                <Tv className="w-3.5 h-3.5 text-sky-400" />
                <span>Smart TV</span>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-emerald-200 font-sans">
                {config.boardTitle || 'BẢNG XANH LỚP HỌC · THI ĐUA DẠY TỐT - HỌC TỐT'}
              </h3>
              <p className="text-[11px] text-emerald-300/80 font-mono">
                Lớp {activeClass?.className} · GVCN: {activeClass?.teacherName || 'Cô Giáo'} · Sĩ số: {currentRosterCount} HS
              </p>
            </div>

            {/* Chalk tray & Eraser simulation */}
            <div className="mt-3 pt-1 border-t border-emerald-800/60 flex items-center justify-center gap-4 text-[10px] text-emerald-200/60">
              <span className="flex items-center gap-1">
                <span className="w-4 h-1 bg-white/80 rounded-full inline-block"></span>
                <span>Phấn trắng</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-5 h-1.5 bg-amber-200/90 rounded-sm inline-block"></span>
                <span>Khay khăn lau bảng</span>
              </span>
            </div>
          </div>

          {/* Teacher's Desk (Bục Giảng Sư Phạm & Bàn Giáo Viên) */}
          <div
            className={`flex ${
              config.teacherDeskPos === 'left'
                ? 'justify-start'
                : config.teacherDeskPos === 'center'
                ? 'justify-center'
                : 'justify-end'
            } px-4`}
          >
            <div className="w-60 p-3 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-amber-950/80 dark:via-amber-900/40 dark:to-orange-950/60 border-2 border-amber-300 dark:border-amber-700 rounded-2xl shadow-sm text-center flex items-center justify-between gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                GV
              </div>
              <div className="text-left flex-1">
                <div className="text-xs font-bold text-amber-950 dark:text-amber-200">Bàn Giáo Viên Chủ Nhiệm</div>
                <div className="text-[10px] text-amber-800/90 dark:text-amber-300/80 truncate">
                  {activeClass?.teacherName || 'Bục giảng sư phạm'}
                </div>
              </div>
              <span className="text-base" title="Bình hoa tươi góc bàn">🌸</span>
            </div>
          </div>
        </div>

        {/* 5. Dynamic Classroom Desks Grid (Columns x Rows) */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[780px] space-y-5 mx-auto max-w-5xl">
            {/* Column / Group Headers */}
            <div
              className="grid gap-3 sm:gap-4 px-2"
              style={{
                gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: config.columns }, (_, c) => {
                const label = (config.columnLabels && config.columnLabels[c]) || `Dãy ${c + 1} · Tổ ${c + 1}`;
                return (
                  <div
                    key={c}
                    className="text-center py-1.5 px-2 bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl"
                  >
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{label}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Rows of Desks */}
            {Array.from({ length: config.rows }, (_, r) => r).map((rowIdx) => (
              <div key={rowIdx} className="space-y-1.5">
                {/* Row Indicator */}
                <div className="flex items-center justify-between px-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                    Hàng {rowIdx + 1}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                    {rowIdx === 0
                      ? 'Gần bảng nhất (ưu tiên mắt cận & chiều cao)'
                      : rowIdx === config.rows - 1
                      ? 'Cuối lớp'
                      : ''}
                  </span>
                </div>

                {/* Column Desks */}
                <div
                  className="grid gap-3 sm:gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: config.columns }, (_, colIdx) => {
                    const deskNumber = rowIdx * config.columns + colIdx + 1;

                    return (
                      <div
                        key={colIdx}
                        className="bg-white/95 dark:bg-slate-900/90 rounded-2xl p-2.5 sm:p-3 shadow-xs border-2 border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 space-y-2 group"
                      >
                        {/* Desk Header Badge */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 pb-1.5 px-0.5">
                          <span className="text-slate-800 dark:text-slate-200 font-bold">
                            Dãy {colIdx + 1}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-mono">
                            Bàn {deskNumber}
                          </span>
                        </div>

                        {/* Desk Surface (Top-Down Realistic Wooden Desk simulation) */}
                        <div
                          className={`grid gap-2 ${
                            config.deskType === 'triple'
                              ? 'grid-cols-3'
                              : config.deskType === 'single'
                              ? 'grid-cols-1'
                              : 'grid-cols-2'
                          }`}
                        >
                          {seatPositions.map((pos) => {
                            const seatKey = `${rowIdx}_${colIdx}_${pos}`;
                            const isDisabled = (config.disabledSeats || []).includes(seatKey);
                            const studentId = seats[seatKey];
                            const student = studentMap.get(studentId || '');

                            const isSelected =
                              selectedSeat?.row === rowIdx &&
                              selectedSeat?.col === colIdx &&
                              selectedSeat?.pos === pos;

                            const isNearSighted = student?.notes?.toLowerCase().includes('cận');
                            const isClassLeader =
                              (student?.roleTitle || student?.notes || '').toLowerCase().includes('lớp') ||
                              (student?.roleTitle || student?.notes || '').toLowerCase().includes('trưởng') ||
                              (student?.roleTitle || student?.notes || '').toLowerCase().includes('phó');

                            // If seat is disabled/bàn khuyết
                            if (isDisabled) {
                              return (
                                <div
                                  key={pos}
                                  onClick={() => handleToggleDisabledSeat(rowIdx, colIdx, pos)}
                                  className="relative rounded-xl p-2 min-h-[82px] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors"
                                  title="Bàn khuyết / Đã khóa. Chạm để mở lại chỗ ngồi này."
                                >
                                  <Ban className="w-4 h-4 opacity-40 mb-1" />
                                  <span className="text-[10px] font-semibold text-slate-400 text-center">
                                    Bàn khuyết
                                  </span>
                                  <span className="text-[9px] text-slate-400/80">(Bỏ trống)</span>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={pos}
                                onClick={() => handleSeatClick(rowIdx, colIdx, pos)}
                                className={`relative rounded-xl p-2 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[82px] border ${
                                  isSelected
                                    ? 'bg-amber-100/90 dark:bg-amber-950/80 border-amber-500 ring-3 ring-amber-400/50 shadow-md scale-102 z-10'
                                    : student
                                    ? 'bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 border-slate-200/90 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xs hover:-translate-y-0.5'
                                    : 'bg-slate-100/60 dark:bg-slate-800/50 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 hover:border-emerald-300 hover:text-emerald-700'
                                }`}
                              >
                                {student ? (
                                  <>
                                    {/* Student Header & Indicators */}
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      {/* Gender / Avatar */}
                                      <div className="flex items-center gap-1">
                                        <div
                                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                            student.gender === 'nữ'
                                              ? 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                                              : 'bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800'
                                          }`}
                                        >
                                          {student.fullName.charAt(0)}
                                        </div>
                                        {config.showSpecialNotes && isClassLeader && (
                                          <span title="Ban cán sự lớp">
                                            <Crown className="w-3 h-3 text-amber-500" />
                                          </span>
                                        )}
                                        {config.showSpecialNotes && isNearSighted && (
                                          <span title="Mắt cận (ưu tiên ngồi bàn trước)">
                                            <Glasses className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                                          </span>
                                        )}
                                      </div>

                                      {/* Group Badge */}
                                      {config.showGroupBadge && student.groupId && (
                                        <span
                                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${getGroupBadgeClass(
                                            student.groupId
                                          )}`}
                                        >
                                          {student.groupId}
                                        </span>
                                      )}
                                    </div>

                                    {/* Student Name */}
                                    <div className="my-auto py-0.5">
                                      <p
                                        className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2"
                                        title={student.fullName}
                                      >
                                        {student.fullName}
                                      </p>
                                      {student.studentCode && (
                                        <p className="text-[9px] text-slate-400 dark:text-slate-400 font-mono">
                                          #{student.studentCode}
                                        </p>
                                      )}
                                    </div>

                                    {/* Position subtle label */}
                                    <div className="text-[9px] text-slate-400 dark:text-slate-400 text-right uppercase tracking-tighter">
                                      {pos === 'left' ? 'Trái' : pos === 'right' ? 'Phải' : pos === 'middle' ? 'Giữa' : 'Chỗ ngồi'}
                                    </div>
                                  </>
                                ) : (
                                  <div className="h-full flex flex-col items-center justify-center py-2 space-y-1">
                                    <Plus className="w-4 h-4 opacity-50" />
                                    <span className="text-[10px] font-semibold tracking-tight">
                                      {pos === 'left' ? 'Ghế trái' : pos === 'right' ? 'Ghế phải' : pos === 'middle' ? 'Ghế giữa' : 'Bàn trống'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Classroom Back Wall: Library Corner, Honor Board, Back Door, Cleaning Area */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="text-[11px] text-slate-400 dark:text-slate-400 uppercase tracking-widest font-bold text-center">
            ↓ PHÍA SAU PHÒNG HỌC & CÁC GÓC HOẠT ĐỘNG TIỂU HỌC ↓
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Library / Reading Corner */}
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200">Góc Thư Viện Lớp Học</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Tủ sách thiếu nhi & báo Đội</div>
              </div>
            </div>

            {/* Honor Board / Góc Hoa Điểm 10 */}
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200">Bảng Vinh Danh "Hoa Điểm 10"</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Trưng bày bài viết đẹp & sáng tạo</div>
              </div>
            </div>

            {/* Back Door & Cleaning Area */}
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <DoorOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200">Cửa Phụ Sau Lớp & Vệ Sinh</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Lối thoát hiểm & góc dụng cụ</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Unassigned Students Tray (Học sinh chưa xếp chỗ) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 no-print transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Học sinh chưa xếp chỗ ({unassignedStudents.length})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Chọn học sinh bên dưới rồi chạm vào một bàn trống trên sơ đồ
              </p>
            </div>
          </div>

          {/* Search & Group Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên học sinh..."
                className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 w-40 text-slate-800 dark:text-slate-200"
              />
            </div>

            {groupsList.length > 0 && (
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium cursor-pointer text-slate-800 dark:text-slate-200"
              >
                <option value="all">Tất cả tổ</option>
                {groupsList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Unassigned list */}
        {unassignedStudents.length === 0 ? (
          <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium bg-emerald-50/80 dark:bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Tuyệt vời! Toàn bộ <strong>{students.length} học sinh</strong> trong danh sách lớp đều đã được sắp xếp vị trí ngồi đầy đủ.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedUnassignedStudentId && (
              <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center justify-between">
                <span>
                  👉 Đang chọn: <strong>{studentMap.get(selectedUnassignedStudentId)?.fullName}</strong>. Bây giờ hãy chạm vào một bàn trống trên sơ đồ!
                </span>
                <button
                  onClick={() => setSelectedUnassignedStudentId(null)}
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold ml-2 cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
              {filteredUnassignedStudents.map((s) => {
                const isSelected = selectedUnassignedStudentId === s.id;
                const isNear = s.notes?.toLowerCase().includes('cận');

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSeat(null);
                      setSelectedUnassignedStudentId(isSelected ? null : s.id);
                    }}
                    className={`px-3 py-2 rounded-2xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400/40 scale-102'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-slate-700 shadow-2xs'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isSelected
                          ? 'bg-white text-emerald-800'
                          : s.gender === 'nữ'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                      }`}
                    >
                      {s.fullName.charAt(0)}
                    </div>
                    <span>{s.fullName}</span>
                    {s.groupId && (
                      <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {s.groupId}
                      </span>
                    )}
                    {isNear && (
                      <Glasses className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-200' : 'text-orange-600 dark:text-orange-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: Cấu hình cấu trúc phòng học & Xếp bàn             */}
      {/* ======================================================== */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Cấu Trúc Bàn Ghế & Phòng Học Thực Tế</h3>
                  <p className="text-xs text-emerald-100">
                    Đồng bộ số dãy, số hàng, loại bàn theo sĩ số học sinh và kiến trúc lớp học
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-6 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
              {/* Presets 1-Touch */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Chọn mẫu bố cục chuẩn trường học Việt Nam
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRESETS.map((p) => {
                    const isCurrent =
                      tempConfig.columns === p.cols &&
                      tempConfig.rows === p.rows &&
                      tempConfig.deskType === p.deskType;

                    return (
                      <div
                        key={p.name}
                        onClick={() => handleApplyPreset(p)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          isCurrent
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-400/30 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-xl shrink-0">{p.icon}</span>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{p.desc}</p>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block pt-0.5">
                            Phù hợp: {p.idealCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Grid Dimensions */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Tùy chỉnh chi tiết kích thước phòng học
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Columns */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Columns className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Số Dãy Bàn (Cột):</span>
                    </span>
                    <select
                      value={tempConfig.columns}
                      onChange={(e) => {
                        const newCols = Number(e.target.value);
                        setTempConfig({
                          ...tempConfig,
                          columns: newCols,
                          columnLabels: Array.from({ length: newCols }, (_, i) =>
                            (tempConfig.columnLabels && tempConfig.columnLabels[i]) || `Dãy ${i + 1} · Tổ ${i + 1}`
                          ),
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value={2}>2 Dãy bàn</option>
                      <option value={3}>3 Dãy bàn (Chuẩn Tiểu học)</option>
                      <option value={4}>4 Dãy bàn (4 Tổ lớp đông)</option>
                      <option value={5}>5 Dãy bàn</option>
                    </select>
                  </div>

                  {/* Rows */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Rows className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Số Hàng Bàn (Dọc):</span>
                    </span>
                    <select
                      value={tempConfig.rows}
                      onChange={(e) => setTempConfig({ ...tempConfig, rows: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value={3}>3 Hàng bàn</option>
                      <option value={4}>4 Hàng bàn</option>
                      <option value={5}>5 Hàng bàn (Chuẩn)</option>
                      <option value={6}>6 Hàng bàn</option>
                      <option value={7}>7 Hàng bàn</option>
                      <option value={8}>8 Hàng bàn</option>
                    </select>
                  </div>

                  {/* Desk Type */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Loại Bàn Ghế:</span>
                    </span>
                    <select
                      value={tempConfig.deskType}
                      onChange={(e) => setTempConfig({ ...tempConfig, deskType: e.target.value as DeskType })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="double">Bàn Đôi (2 học sinh/bàn)</option>
                      <option value="triple">Bàn Ba (3 học sinh/bàn)</option>
                      <option value="single">Bàn Đơn (1 học sinh/bàn)</option>
                    </select>
                  </div>
                </div>

                {/* Capacity Summary & Delta Alert */}
                <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-emerald-950 dark:text-emerald-200 font-medium">
                  <div>
                    <span>Tổng sức chứa thiết kế: </span>
                    <strong className="text-emerald-700 dark:text-emerald-400 text-sm font-extrabold">
                      {tempConfig.columns * tempConfig.rows * (tempConfig.deskType === 'triple' ? 3 : tempConfig.deskType === 'single' ? 1 : 2)} chỗ ngồi
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sĩ số học sinh: <strong>{students.length} em</strong> trong danh sách
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Classroom Furniture & Architectural Elements */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Vị trí Bục giảng & Không gian xung quanh phòng học
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Bàn Giáo Viên:</span>
                    <select
                      value={tempConfig.teacherDeskPos}
                      onChange={(e) => setTempConfig({ ...tempConfig, teacherDeskPos: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                    >
                      <option value="left">Phía bên Trái</option>
                      <option value="center">Ở Chính Giữa</option>
                      <option value="right">Phía bên Phải</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Cửa chính ra vào (Trước):</span>
                    <select
                      value={tempConfig.doorPos}
                      onChange={(e) => setTempConfig({ ...tempConfig, doorPos: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                    >
                      <option value="left">Góc bên Trái phòng</option>
                      <option value="right">Góc bên Phải phòng</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Dãy cửa sổ đón sáng:</span>
                    <select
                      value={tempConfig.windowPos}
                      onChange={(e) => setTempConfig({ ...tempConfig, windowPos: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                    >
                      <option value="right">Bên Phải lớp học</option>
                      <option value="left">Bên Trái lớp học</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Khẩu hiệu lớp học:</span>
                    <input
                      type="text"
                      value={tempConfig.mottoText || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, mottoText: e.target.value })}
                      placeholder="NÉT CHỮ NẾT NGƯỜI · MỖI NGÀY ĐẾN TRƯỜNG LÀ MỘT NGÀY VUI"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Tiêu đề trên Bảng xanh:</span>
                    <input
                      type="text"
                      value={tempConfig.boardTitle || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, boardTitle: e.target.value })}
                      placeholder="BẢNG XANH LỚP HỌC · THI ĐUA HỌC TỐT"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Display Options */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Tùy chọn hiển thị thông tin học sinh
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempConfig.showGroupBadge}
                      onChange={(e) => setTempConfig({ ...tempConfig, showGroupBadge: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Hiện huy hiệu Tổ học tập (Tổ 1-4)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempConfig.showSpecialNotes}
                      onChange={(e) => setTempConfig({ ...tempConfig, showSpecialNotes: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Hiện biểu tượng Mắt Cận & Ban Cán Sự</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleApplyConfig}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Áp dụng cấu trúc phòng học</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

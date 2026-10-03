import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, ParentContact } from '../../types';
import { StudentRepository, ParentRepository } from '../../repositories/dataRepository';
import { ImportExportService, ParsedStudentRow } from '../../services/importExportService';
import {
  UserPlus,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Cake,
  Users,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  Award,
  BookOpen,
  Calendar,
  BookMarked,
  MessageCircle,
  ArrowRight,
  RefreshCw,
  ArrowUpDown,
  Crown,
  GraduationCap,
  ShieldCheck,
  Flag,
  Music,
} from 'lucide-react';
import { format } from 'date-fns';
import { AIClientService } from '../../services/aiClientService';
import { SendZaloModal } from '../common/SendZaloModal';
import { EmptyState } from '../common/EmptyState';
import {
  getVietnameseInitial,
  getVietnameseNameParts,
  compareVietnameseNames,
} from '../../utils/vietnameseNameUtils';
import {
  ClassRoleBadge,
  CLASS_ROLES,
  CLASS_ROLE_LIST,
  getClassRoleConfig,
} from '../../utils/classRoleUtils';

export const StudentsView: React.FC = () => {
  const {
    activeClass,
    currentUser,
    students,
    parents,
    attendanceRecords,
    assessments,
    competencies,
    competitionEntries,
    journalEntries,
    refreshActiveData,
    refreshStudents,
    refreshParents,
    showToast,
    setActiveTab,
    selectedStudentForDetail,
    setSelectedStudentForDetail,
  } = useApp();

  // Search, Filter & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'student_code' | 'group' | 'role'>('name_asc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Student | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Import State (Preview -> Validate -> Confirm -> Persist)
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview_validate' | 'confirm'>('upload');
  const [importFilter, setImportFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [confirmPersistChecked, setConfirmPersistChecked] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [dob, setDob] = useState('2017-01-01');
  const [gender, setGender] = useState<'nam' | 'nữ' | 'khác'>('nam');
  const [groupId, setGroupId] = useState('Tổ 1');
  const [roleTitle, setRoleTitle] = useState<string>('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Parent form state
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentType, setParentType] = useState<'Bố' | 'Mẹ' | 'Người giám hộ' | 'Khác'>('Mẹ');

  const parentMap = React.useMemo(() => {
    const map = new Map<string, ParentContact>();
    parents.forEach((p) => {
      if (p.primary || !map.has(p.studentId)) {
        map.set(p.studentId, p);
      }
    });
    return map;
  }, [parents]);

  // Filtered & Sorted Students (Mặc định: Xếp số thứ tự theo chữ cái đầu tiên của Tên A-Z)
  const filteredStudents = React.useMemo(() => {
    const list = students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.roleTitle && s.roleTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (parentMap.get(s.id)?.phone.includes(searchTerm) ?? false);
      const matchGroup = selectedGroup === 'all' || s.groupId === selectedGroup;
      const matchGender = selectedGender === 'all' || s.gender === selectedGender;
      const matchRole =
        selectedRole === 'all'
          ? true
          : selectedRole === 'cadre_only'
          ? Boolean(s.roleTitle && s.roleTitle.trim())
          : s.roleTitle === selectedRole;
      return matchSearch && matchGroup && matchGender && matchRole;
    });

    // Sắp xếp thứ tự
    return [...list].sort((a, b) => {
      if (sortBy === 'name_asc') {
        // Chuẩn Việt Nam: Xếp theo chữ cái đầu của Tên (A-Z)
        return compareVietnameseNames(a, b);
      }
      if (sortBy === 'name_desc') {
        return compareVietnameseNames(b, a);
      }
      if (sortBy === 'student_code') {
        return (a.studentCode || '').localeCompare(b.studentCode || '', 'vi') || compareVietnameseNames(a, b);
      }
      if (sortBy === 'group') {
        return (a.groupId || '').localeCompare(b.groupId || '', 'vi') || compareVietnameseNames(a, b);
      }
      if (sortBy === 'role') {
        const hasA = Boolean(a.roleTitle && a.roleTitle.trim());
        const hasB = Boolean(b.roleTitle && b.roleTitle.trim());
        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        return compareVietnameseNames(a, b);
      }
      return compareVietnameseNames(a, b);
    });
  }, [students, searchTerm, selectedGroup, selectedGender, selectedRole, sortBy, parentMap]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFullName('');
    setStudentCode(`HS${(students.length + 1).toString().padStart(2, '0')}`);
    setDob('2017-01-01');
    setGender('nam');
    setGroupId('Tổ 1');
    setRoleTitle('');
    setAddress('');
    setNotes('');
    setParentName('');
    setParentPhone('');
    setParentType('Mẹ');
    setShowAddModal(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFullName(student.fullName);
    setStudentCode(student.studentCode || '');
    setDob(student.dob || '2017-01-01');
    setGender(student.gender);
    setGroupId(student.groupId || 'Tổ 1');
    setRoleTitle(student.roleTitle || '');
    setAddress(student.address || '');
    setNotes(student.notes || '');

    const p = parentMap.get(student.id);
    if (p) {
      setParentName(p.fullName);
      setParentPhone(p.phone);
      setParentType(p.type);
    } else {
      setParentName('');
      setParentPhone('');
      setParentType('Mẹ');
    }
    setShowAddModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !currentUser) return;
    if (!fullName.trim()) {
      showToast('Vui lòng nhập họ và tên học sinh', 'error');
      return;
    }

    try {
      if (editingStudent) {
        // Update
        await StudentRepository.updateStudent(editingStudent.id, {
          fullName,
          studentCode,
          dob,
          gender,
          groupId,
          roleTitle: roleTitle.trim() || undefined,
          address,
          notes,
        });

        if (parentName.trim() && parentPhone.trim()) {
          const existingParent = parentMap.get(editingStudent.id);
          await ParentRepository.saveContact({
            id: existingParent?.id,
            classId: activeClass.id,
            ownerId: currentUser.uid,
            studentId: editingStudent.id,
            fullName: parentName,
            phone: parentPhone,
            type: parentType,
            primary: true,
          });
        }

        showToast('Cập nhật thông tin học sinh thành công!');
      } else {
        // Create
        const newStu = await StudentRepository.createStudent({
          classId: activeClass.id,
          ownerId: currentUser.uid,
          fullName,
          studentCode,
          dob,
          gender,
          groupId,
          roleTitle: roleTitle.trim() || undefined,
          address,
          notes,
        });

        if (parentName.trim() && parentPhone.trim()) {
          await ParentRepository.saveContact({
            classId: activeClass.id,
            ownerId: currentUser.uid,
            studentId: newStu.id,
            fullName: parentName,
            phone: parentPhone,
            type: parentType,
            primary: true,
          });
        }

        showToast(`Đã thêm học sinh ${fullName} vào danh sách!`);
      }

      await refreshStudents();
      await refreshParents();
      setShowAddModal(false);
    } catch (err: any) {
      showToast('Lỗi khi lưu học sinh: ' + (err.message || ''), 'error');
    }
  };

  const handleDeleteStudent = async () => {
    if (!showDeleteConfirm) return;
    try {
      await StudentRepository.deleteStudent(showDeleteConfirm.id);
      showToast(`Đã xóa học sinh ${showDeleteConfirm.fullName}`, 'info');
      setShowDeleteConfirm(null);
      if (selectedStudentForDetail?.id === showDeleteConfirm.id) {
        setSelectedStudentForDetail(null);
      }
      await refreshStudents();
      await refreshParents();
    } catch (err: any) {
      showToast('Lỗi khi xóa học sinh: ' + (err.message || ''), 'error');
    }
  };

  // Import handler (Step 1 -> Step 2)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await ImportExportService.parseStudentFile(file);

      // Validate each row against students already in this class
      const existingCodes = new Set(
        students.map((s) => (s.studentCode || '').trim().toLowerCase()).filter(Boolean)
      );
      const existingNames = new Set(students.map((s) => s.fullName.trim().toLowerCase()));

      const validatedRows = rows.map((r) => {
        const extraErrors = [...r.errors];
        const lowerCode = (r.studentCode || '').trim().toLowerCase();
        const lowerName = r.fullName.trim().toLowerCase();

        if (lowerCode && existingCodes.has(lowerCode)) {
          extraErrors.push('Mã học sinh đã tồn tại trong lớp');
        }
        if (existingNames.has(lowerName)) {
          extraErrors.push('Trùng họ tên với học sinh đã có trong lớp');
        }

        return {
          ...r,
          errors: extraErrors,
          isValid: extraErrors.length === 0,
        };
      });

      setParsedRows(validatedRows);
      setImportStep('preview_validate');
      setImportFilter('all');
      setConfirmPersistChecked(false);
    } catch (err: any) {
      showToast('Không thể đọc file: ' + (err.message || 'Lỗi định dạng'), 'error');
    }
  };

  // Step 3 -> Step 4 (Persist)
  const handleConfirmImport = async () => {
    if (!activeClass || !currentUser) return;
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('Không có dữ liệu học sinh hợp lệ để nhập', 'error');
      return;
    }

    setImporting(true);
    try {
      const studentPayloads = validRows.map((r) => ({
        fullName: r.fullName,
        studentCode: r.studentCode || '',
        dob: r.dob || '2017-01-01',
        gender: r.gender,
        groupId: r.groupId || 'Tổ 1',
        address: r.address || '',
        notes: r.notes || '',
      }));

      const created = await StudentRepository.batchCreateStudents(activeClass.id, currentUser.uid, studentPayloads);

      // Create parent contacts for those with parent info
      for (let i = 0; i < created.length; i++) {
        const row = validRows[i];
        if (row.parentName && row.parentPhone) {
          await ParentRepository.saveContact({
            classId: activeClass.id,
            ownerId: currentUser.uid,
            studentId: created[i].id,
            type: (row.parentType as any) || 'Bố',
            fullName: row.parentName,
            phone: row.parentPhone,
            email: row.email,
            primary: true,
          });
        }
      }

      showToast(`Đã nhập thành công ${created.length} học sinh vào lớp!`);
      setShowImportModal(false);
      setParsedRows([]);
      setImportStep('upload');
      await refreshStudents();
      await refreshParents();
    } catch (err: any) {
      showToast('Lỗi khi nhập danh sách: ' + (err.message || ''), 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Bar / Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Danh sách Học sinh ({students.length} em)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lớp {activeClass?.className || '---'} · Quản lý hồ sơ, phụ huynh & nhóm học tập
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => ImportExportService.downloadTemplate()}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            title="Tải tệp mẫu Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Tải mẫu Excel</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Nhập Excel</span>
          </button>

          <button
            onClick={() => {
              if (activeClass) {
                ImportExportService.exportStudentsToExcel(activeClass.className, students, parents);
              }
            }}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm học sinh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo họ tên, tên gọi, mã HS, chức vụ cán bộ, SĐT phụ huynh..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sắp xếp chuẩn Bộ GD&ĐT */}
            <div className="flex items-center gap-1.5 bg-emerald-50/70 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="text-[11px] font-semibold text-emerald-900 hidden lg:inline">Thứ tự:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="text-xs bg-transparent border-none focus:outline-none font-bold text-emerald-900 cursor-pointer"
              >
                <option value="name_asc">Xếp theo Tên A-Z (Chuẩn Bộ GD&ĐT)</option>
                <option value="name_desc">Xếp theo Tên Z-A</option>
                <option value="role">⭐ Cán bộ lớp lên đầu</option>
                <option value="student_code">Mã học sinh</option>
                <option value="group">Theo Tổ sinh hoạt</option>
              </select>
            </div>

            {/* Lọc Cán bộ lớp */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700"
            >
              <option value="all">Tất cả chức vụ</option>
              <option value="cadre_only">⭐ Ban cán sự lớp</option>
              <option value="Lớp trưởng">👑 Lớp trưởng</option>
              <option value="Lớp phó học tập">🎓 Lớp phó học tập</option>
              <option value="Lớp phó lao động">✨ Lớp phó lao động</option>
              <option value="Lớp phó văn thể mỹ">🎵 Lớp phó văn thể mỹ</option>
              <option value="Lớp phó trật tự">🛡️ Lớp phó trật tự</option>
              <option value="Lớp phó">🎖️ Lớp phó (chung)</option>
              <option value="Tổ trưởng">👥 Tổ trưởng</option>
              <option value="Tổ phó">👤 Tổ phó</option>
              <option value="Cờ đỏ">🚩 Cờ đỏ (Sao đỏ)</option>
            </select>

            {/* Lọc Tổ */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700"
            >
              <option value="all">Tất cả Tổ</option>
              <option value="Tổ 1">Tổ 1</option>
              <option value="Tổ 2">Tổ 2</option>
              <option value="Tổ 3">Tổ 3</option>
              <option value="Tổ 4">Tổ 4</option>
            </select>

            {/* Lọc Giới tính */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700"
            >
              <option value="all">Tất cả giới tính</option>
              <option value="nam">Nam</option>
              <option value="nữ">Nữ</option>
            </select>
          </div>
        </div>

        {/* Thông báo quy tắc sắp xếp rõ ràng */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Quy tắc STT: <strong>Xếp theo chữ cái đầu của Tên</strong> (Ví dụ: <em>Bùi Thảo Linh</em> [<strong>L</strong>] xếp trước <em>Ngô Phương Thảo</em> [<strong>T</strong>]).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Hiển thị: <strong>{filteredStudents.length}</strong> / {students.length} học sinh</span>
            {filteredStudents.some((s) => s.roleTitle) && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                {filteredStudents.filter((s) => s.roleTitle).length} Cán bộ lớp
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Họ và tên học sinh</th>
                <th className="py-3 px-4">Chức vụ cán bộ</th>
                <th className="py-3 px-4">Mã HS</th>
                <th className="py-3 px-4">Ngày sinh</th>
                <th className="py-3 px-4">Giới tính</th>
                <th className="py-3 px-4">Tổ</th>
                <th className="py-3 px-4">Phụ huynh liên hệ</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center">
                    {students.length === 0 ? (
                      <EmptyState
                        icon={Users}
                        title="Chưa có học sinh nào trong danh sách lớp"
                        description="Thầy/Cô hãy bắt đầu năm học mới bằng cách thêm từng học sinh hoặc tải lên tệp Excel danh sách lớp có sẵn."
                        action={{
                          label: 'Thêm học sinh đầu tiên',
                          onClick: () => setShowAddModal(true),
                        }}
                      />
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Không tìm thấy học sinh nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const p = parentMap.get(student.id);
                  const nameParts = getVietnameseNameParts(student.fullName);
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedStudentForDetail(student)}
                    >
                      <td className="py-3 px-4 text-center font-bold text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 flex items-center justify-center text-xs font-black shrink-0 border border-emerald-200/60 shadow-2xs"
                          title={`Tên: ${nameParts.givenName} | Chữ cái đầu: ${nameParts.firstLetter}`}
                        >
                          {nameParts.firstLetter || '?'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors">
                            {student.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Tên: <strong className="text-slate-600">{nameParts.givenName}</strong> (chữ cái đầu: <strong className="text-emerald-700">{nameParts.firstLetter}</strong>)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {student.roleTitle ? (
                          <ClassRoleBadge roleTitle={student.roleTitle} size="sm" />
                        ) : (
                          <span className="text-slate-400 text-xs italic">Học sinh</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium font-mono text-xs">
                        {student.studentCode || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 tabular-nums text-xs">
                        {student.dob || '—'}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            student.gender === 'nữ'
                              ? 'bg-rose-50/80 text-rose-700 border-rose-200/60'
                              : 'bg-blue-50/80 text-blue-700 border-blue-200/60'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/60">
                          {student.groupId || 'Chưa xếp tổ'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {p ? (
                          <div className="text-[11px] leading-snug">
                            <div className="font-semibold text-slate-800">
                              {p.fullName} <span className="font-normal text-slate-400 text-[10px]">({p.type})</span>
                            </div>
                            <div className="text-slate-500 font-mono tracking-tight text-[10px]">
                              {p.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Chưa có liên hệ</span>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedStudentForDetail(student)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(student)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="bg-white p-8 text-center text-xs text-slate-400 rounded-2xl border border-slate-200">
            Không tìm thấy học sinh nào
          </div>
        ) : (
          filteredStudents.map((s, idx) => {
            const p = parentMap.get(s.id);
            const nameParts = getVietnameseNameParts(s.fullName);
            return (
              <div
                key={s.id}
                onClick={() => setSelectedStudentForDetail(s)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 cursor-pointer hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-black shrink-0 border border-emerald-200"
                      title={`Chữ cái đầu của tên: ${nameParts.firstLetter}`}
                    >
                      {nameParts.firstLetter || '?'}
                    </div>
                    <span className="text-xs font-bold text-slate-400 tabular-nums">#{idx + 1}</span>
                    <span className="text-sm font-bold text-slate-900">{s.fullName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {s.roleTitle && <ClassRoleBadge roleTitle={s.roleTitle} size="xs" />}
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {s.groupId}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 flex items-center justify-between">
                  <span>Mã: {s.studentCode || '-'} · Tên: <strong className="text-slate-700">{nameParts.givenName}</strong> ({nameParts.firstLetter})</span>
                  <span>Sinh: {s.dob}</span>
                </div>
                {p && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      {p.type}: {p.fullName}
                    </span>
                    <a
                      href={`tel:${p.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-emerald-700 font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{p.phone}</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* STUDENT PROFILE DRAWER / MODAL */}
      {/* ======================================================== */}
      {selectedStudentForDetail && (
        <StudentDetailDrawer
          student={selectedStudentForDetail}
          parent={parentMap.get(selectedStudentForDetail.id)}
          onClose={() => setSelectedStudentForDetail(null)}
          onEdit={() => {
            const s = selectedStudentForDetail;
            setSelectedStudentForDetail(null);
            openEditModal(s);
          }}
          onGoToAIComment={() => {
            setSelectedStudentForDetail(null);
            setActiveTab('ai-comments');
          }}
        />
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT STUDENT MODAL */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingStudent ? 'Sửa thông tin học sinh' : 'Thêm học sinh mới'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Thông tin học sinh
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên học sinh *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Minh An"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mã học sinh
                    </label>
                    <input
                      type="text"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      placeholder="HS01"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Giới tính
                    </label>
                    <select
                      value={gender}
                      onChange={(e: any) => setGender(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    >
                      <option value="nam">Nam</option>
                      <option value="nữ">Nữ</option>
                      <option value="khác">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tổ sinh hoạt
                    </label>
                    <select
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    >
                      <option value="Tổ 1">Tổ 1</option>
                      <option value="Tổ 2">Tổ 2</option>
                      <option value="Tổ 3">Tổ 3</option>
                      <option value="Tổ 4">Tổ 4</option>
                    </select>
                  </div>
                </div>

                {/* Class Officer Role Selection with custom icons */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Danh hiệu / Chức vụ Ban cán sự lớp
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">Gắn icon huy hiệu riêng biệt</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    >
                      <option value="">Học sinh (Không có chức vụ)</option>
                      <optgroup label="Ban cán sự lớp">
                        <option value="Lớp trưởng">👑 Lớp trưởng</option>
                        <option value="Lớp phó học tập">🎓 Lớp phó học tập</option>
                        <option value="Lớp phó lao động">✨ Lớp phó lao động</option>
                        <option value="Lớp phó văn thể mỹ">🎵 Lớp phó văn thể mỹ</option>
                        <option value="Lớp phó trật tự">🛡️ Lớp phó trật tự</option>
                        <option value="Lớp phó">🎖️ Lớp phó (chung)</option>
                      </optgroup>
                      <optgroup label="Ban chỉ huy Tổ">
                        <option value="Tổ trưởng">👥 Tổ trưởng</option>
                        <option value="Tổ phó">👤 Tổ phó</option>
                      </optgroup>
                      <optgroup label="Nhiệm vụ chuyên trách">
                        <option value="Cờ đỏ">🚩 Cờ đỏ (Sao đỏ)</option>
                        <option value="Quản ca">🎤 Quản ca</option>
                        <option value="Thủ quỹ">🪙 Thủ quỹ</option>
                        <option value="Ban cán sự">⭐ Ban cán sự</option>
                      </optgroup>
                    </select>

                    <div className="flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg min-h-[34px]">
                      <span className="text-[11px] text-slate-400 mr-2 shrink-0">Huy hiệu:</span>
                      {roleTitle ? (
                        <ClassRoleBadge roleTitle={roleTitle} size="sm" />
                      ) : (
                        <span className="text-xs text-slate-400 italic">Học sinh</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="Hoặc tự gõ tên chức vụ khác (VD: Đội trưởng Sao Nhi đồng, Phụ trách sách...)"
                      className="w-full px-3 py-1.5 text-[11px] border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Địa chỉ cư trú
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, đường, phường, quận..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ghi chú đặc điểm cá nhân
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tính cách, sở thích, lưu ý sức khỏe..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Parent Info */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Thông tin phụ huynh chính
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mối quan hệ
                    </label>
                    <select
                      value={parentType}
                      onChange={(e: any) => setParentType(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none bg-white"
                    >
                      <option value="Mẹ">Mẹ</option>
                      <option value="Bố">Bố</option>
                      <option value="Người giám hộ">Người giám hộ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Họ và tên phụ huynh
                    </label>
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Họ và tên"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại liên lạc
                  </label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingStudent ? 'Lưu thay đổi' : 'Thêm học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRM MODAL */}
      {/* ======================================================== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-center text-sm font-bold text-slate-900">
              Xóa học sinh khỏi lớp?
            </h3>
            <p className="text-center text-xs text-slate-600 mt-1">
              Thầy/Cô có chắc chắn muốn xóa học sinh{' '}
              <strong className="text-slate-800">{showDeleteConfirm.fullName}</strong>? Dữ liệu
              chuyên cần và đánh giá của học sinh này sẽ bị xóa.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteStudent}
                className="flex-1 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EXCEL IMPORT MODAL WITH LIVE PREVIEW */}
      {/* ======================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Nhập danh sách học sinh từ Excel / CSV
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống kiểm tra lỗi định dạng và hiển thị xem trước trước khi lưu
                </p>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setParsedRows([]);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Step 1: Upload */}
              {importStep === 'upload' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-emerald-400 transition-colors">
                    <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">
                      Chọn tệp Excel (.xlsx, .xls) hoặc CSV từ máy tính
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Đảm bảo tệp chứa các cột tiêu đề: STT, Họ và tên, Mã học sinh, Ngày sinh, Giới tính, Tổ, Tên phụ huynh, Số điện thoại...
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <label className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải tệp lên</span>
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => ImportExportService.downloadTemplate()}
                        className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tải file mẫu Excel chuẩn</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Preview & Validate */}
              {importStep === 'preview_validate' && parsedRows.length > 0 && (
                <div className="space-y-3">
                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="text-sm font-bold text-slate-900 tabular-nums">
                        {parsedRows.length}
                      </div>
                      <div className="text-[10px] text-slate-500">Tổng số dòng đọc được</div>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <div className="text-sm font-bold text-emerald-800 tabular-nums">
                        {parsedRows.filter((r) => r.isValid).length}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Hợp lệ sẵn sàng lưu</div>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      <div className="text-sm font-bold text-rose-800 tabular-nums">
                        {parsedRows.filter((r) => !r.isValid).length}
                      </div>
                      <div className="text-[10px] text-rose-600 font-semibold">Lỗi / Trùng lặp</div>
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setImportFilter('all')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          importFilter === 'all'
                            ? 'bg-white text-slate-900 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tất cả ({parsedRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportFilter('valid')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          importFilter === 'valid'
                            ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Hợp lệ ({parsedRows.filter((r) => r.isValid).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportFilter('invalid')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          importFilter === 'invalid'
                            ? 'bg-white text-rose-800 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Cần xử lý ({parsedRows.filter((r) => !r.isValid).length})
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setImportStep('upload')}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Chọn tệp khác
                    </button>
                  </div>

                  {/* Preview Table */}
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase sticky top-0">
                        <tr>
                          <th className="p-2">Dòng</th>
                          <th className="p-2">Họ và tên</th>
                          <th className="p-2">Mã HS</th>
                          <th className="p-2">Ngày sinh</th>
                          <th className="p-2">Giới tính</th>
                          <th className="p-2">Tổ</th>
                          <th className="p-2">Phụ huynh</th>
                          <th className="p-2">Thẩm định</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows
                          .filter((r) => {
                            if (importFilter === 'valid') return r.isValid;
                            if (importFilter === 'invalid') return !r.isValid;
                            return true;
                          })
                          .map((r, i) => (
                            <tr
                              key={i}
                              className={r.isValid ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50'}
                            >
                              <td className="p-2 text-slate-400 font-mono">#{r.rowNumber}</td>
                              <td className="p-2 font-medium text-slate-900">{r.fullName || '-'}</td>
                              <td className="p-2 text-slate-500 font-mono">{r.studentCode || '-'}</td>
                              <td className="p-2 text-slate-600">{r.dob || '-'}</td>
                              <td className="p-2 capitalize">{r.gender}</td>
                              <td className="p-2">{r.groupId}</td>
                              <td className="p-2">
                                {r.parentName ? `${r.parentName} (${r.parentPhone})` : '-'}
                              </td>
                              <td className="p-2">
                                {r.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Hợp lệ
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-rose-700 text-[11px] font-semibold bg-rose-50 px-2 py-0.5 rounded-full"
                                    title={r.errors.join(', ')}
                                  >
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    <span className="truncate max-w-[120px]">{r.errors[0]}</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm before Persist */}
              {importStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                    <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Xác nhận thông tin nhập danh sách học sinh</span>
                    </h4>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      Bạn sắp thêm <strong>{parsedRows.filter((r) => r.isValid).length} học sinh</strong> vào <strong>Lớp {activeClass?.className}</strong> ({activeClass?.schoolName}).
                    </p>
                    {parsedRows.some((r) => !r.isValid) && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        Lưu ý: Có {parsedRows.filter((r) => !r.isValid).length} dòng bị lỗi/trùng lặp sẽ được tự động bỏ qua để đảm bảo an toàn toàn vẹn dữ liệu lớp.
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div className="font-semibold text-slate-900">Chi tiết thực hiện:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                      <li>Tạo hồ sơ {parsedRows.filter((r) => r.isValid).length} học sinh với mã học sinh, ngày sinh, giới tính, tổ.</li>
                      <li>Tạo tự động sổ liên lạc phụ huynh tương ứng nếu có số điện thoại.</li>
                      <li>Cập nhật số lượng sĩ số và đồng bộ sang toàn bộ module Điểm danh, Đánh giá, Thi đua.</li>
                    </ul>
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmPersistChecked}
                      onChange={(e) => setConfirmPersistChecked(e.target.checked)}
                      className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Tôi đã đối soát kỹ lưỡng danh sách và xác nhận lưu các học sinh này vào danh sách lớp học.
                    </span>
                  </label>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setParsedRows([]);
                    setImportStep('upload');
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Đóng
                </button>

                <div className="flex items-center gap-2">
                  {importStep === 'preview_validate' && (
                    <button
                      type="button"
                      onClick={() => {
                        const validCount = parsedRows.filter((r) => r.isValid).length;
                        if (validCount === 0) {
                          showToast('Tệp tải lên chưa có học sinh hợp lệ nào. Vui lòng kiểm tra lại cột Họ và tên.', 'info');
                          return;
                        }
                        setImportStep('confirm');
                      }}
                      className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                        parsedRows.filter((r) => r.isValid).length === 0
                          ? 'bg-slate-400 hover:bg-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <span>Tiếp tục: Xác nhận ({parsedRows.filter((r) => r.isValid).length} em)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {importStep === 'confirm' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setImportStep('preview_validate')}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      >
                        Quay lại xem trước
                      </button>
                      <button
                        type="button"
                        disabled={importing}
                        onClick={() => {
                          if (!confirmPersistChecked) {
                            showToast('Vui lòng tích chọn ô xác nhận cam kết thêm danh sách vào lớp trước khi lưu.', 'info');
                            return;
                          }
                          handleConfirmImport();
                        }}
                        className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                          !confirmPersistChecked
                            ? 'bg-emerald-600/80 hover:bg-emerald-600'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {importing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang lưu vào lớp...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Xác nhận lưu vào lớp (Persist)</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========================================================
// STUDENT PROFILE DRAWER COMPONENT
// ========================================================
export interface StudentDetailDrawerProps {
  student: Student;
  parent?: ParentContact;
  onClose: () => void;
  onEdit?: () => void;
  onGoToAIComment?: () => void;
}

export const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({
  student,
  parent,
  onClose,
  onEdit,
  onGoToAIComment,
}) => {
  const {
    attendanceRecords,
    assessments,
    competencies,
    competitionEntries,
    journalEntries,
    studentLearningJournals,
    setActiveTab,
    setLearningJournalPrefill,
    showToast,
  } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<
    'info' | 'attendance' | 'learning' | 'competition' | 'journal' | 'learning-journal'
  >('info');
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiWeekSummary, setAiWeekSummary] = useState<string | null>(null);

  // Student specific data
  const studentAtt = attendanceRecords.filter((r) => r.studentId === student.id);
  const studentAssess = assessments.filter((a) => a.studentId === student.id);
  const studentComp = competencies.filter((c) => c.studentId === student.id);
  const studentEntries = competitionEntries.filter((e) => e.studentId === student.id);
  const studentJournals = journalEntries.filter((j) => j.studentId === student.id);
  const thisStudentLearningJournals = studentLearningJournals.filter((j) => j.studentId === student.id);

  const presentCount = studentAtt.filter((r) => r.status === 'present').length;
  const excusedCount = studentAtt.filter((r) => r.status === 'excused_absence').length;
  const unexcusedCount = studentAtt.filter((r) => r.status === 'unexcused_absence').length;
  const lateCount = studentAtt.filter((r) => r.status === 'late').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="p-5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-emerald-500/30"
              title={`Chữ cái đầu của tên: ${getVietnameseInitial(student.fullName)}`}
            >
              {getVietnameseInitial(student.fullName)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{student.fullName}</h3>
                {student.roleTitle && (
                  <ClassRoleBadge roleTitle={student.roleTitle} size="sm" />
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mã: {student.studentCode || '---'} · {student.groupId} · Giới tính: {student.gender} · Tên: <strong className="text-emerald-700 dark:text-emerald-400">{getVietnameseNameParts(student.fullName).givenName}</strong> ({getVietnameseInitial(student.fullName)})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('info')}
            className={`py-3 px-3 border-b-2 transition-colors shrink-0 ${
              activeSubTab === 'info'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Hồ sơ & Phụ huynh
          </button>
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`py-3 px-3 border-b-2 transition-colors shrink-0 ${
              activeSubTab === 'attendance'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Chuyên cần ({studentAtt.length})
          </button>
          <button
            onClick={() => setActiveSubTab('learning')}
            className={`py-3 px-3 border-b-2 transition-colors shrink-0 ${
              activeSubTab === 'learning'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Học tập ({studentAssess.length})
          </button>
          <button
            onClick={() => setActiveSubTab('competition')}
            className={`py-3 px-3 border-b-2 transition-colors shrink-0 ${
              activeSubTab === 'competition'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Thi đua ({studentEntries.length})
          </button>
          <button
            onClick={() => setActiveSubTab('journal')}
            className={`py-3 px-3 border-b-2 transition-colors shrink-0 ${
              activeSubTab === 'journal'
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Nhật ký lớp ({studentJournals.length})
          </button>
          <button
            onClick={() => setActiveSubTab('learning-journal')}
            className={`py-3 px-3 border-b-2 transition-colors shrink-0 flex items-center gap-1.5 ${
              activeSubTab === 'learning-journal'
                ? 'border-purple-600 text-purple-800 dark:text-purple-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Nhật ký học tập ({thisStudentLearningJournals.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeSubTab === 'info' && (
            <div className="space-y-4">
              {/* Class Role Banner */}
              {student.roleTitle && (
                <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200/90 dark:border-amber-800/80 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                      Ban cán sự lớp học
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <ClassRoleBadge roleTitle={student.roleTitle} size="md" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {getClassRoleConfig(student.roleTitle)?.description || student.roleTitle}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">Ngày sinh:</span>
                    <p className="font-semibold text-slate-800">{student.dob || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Giới tính:</span>
                    <p className="font-semibold text-slate-800 capitalize">{student.gender}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Địa chỉ cư trú:</span>
                    <p className="font-semibold text-slate-800">{student.address || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Ghi chú đặc điểm:</span>
                    <p className="font-semibold text-slate-800">{student.notes || 'Không có ghi chú'}</p>
                  </div>
                </div>
              </div>

              {/* Parent */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
                    Liên hệ Phụ huynh
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowZaloModal(true)}
                    className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <MessageCircle className="w-3 h-3 fill-white" />
                    <span>Nhắn Zalo</span>
                  </button>
                </div>
                {parent ? (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-sm">{parent.fullName} ({parent.type})</p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <a href={`tel:${parent.phone}`} className="font-bold text-emerald-700 hover:underline">
                        {parent.phone}
                      </a>
                    </p>
                    {parent.email && <p className="text-slate-500">Email: {parent.email}</p>}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-slate-400 italic">Chưa có thông tin liên hệ phụ huynh cho học sinh này.</p>
                    <p className="text-[11px] text-blue-600">Bấm "Nhắn Zalo" để nhập SĐT phụ huynh và gửi tin nhắn.</p>
                  </div>
                )}
              </div>

              {/* Quick AI comment trigger */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">Gợi ý nhận xét AI</h4>
                  <p className="text-[11px] text-indigo-700">Tạo bản thảo nhận xét Thông tư 27 dựa trên dữ liệu thật của em</p>
                </div>
                <button
                  onClick={onGoToAIComment}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tạo nhận xét</span>
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'attendance' && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <div className="text-emerald-700 font-bold text-lg">{presentCount}</div>
                  <div className="text-[10px] text-emerald-600">Có mặt</div>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                  <div className="text-amber-700 font-bold text-lg">{excusedCount}</div>
                  <div className="text-[10px] text-amber-600">Có phép</div>
                </div>
                <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                  <div className="text-red-700 font-bold text-lg">{unexcusedCount}</div>
                  <div className="text-[10px] text-red-600">Không phép</div>
                </div>
                <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                  <div className="text-purple-700 font-bold text-lg">{lateCount}</div>
                  <div className="text-[10px] text-purple-600">Đi muộn</div>
                </div>
              </div>

              <div className="space-y-1.5">
                {studentAtt.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Chưa có lịch sử điểm danh</p>
                ) : (
                  studentAtt.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{r.date}</span>
                        {r.notes && <span className="text-slate-500 ml-2 text-[11px]">- {r.notes}</span>}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'excused_absence'
                          ? 'bg-amber-100 text-amber-800'
                          : r.status === 'unexcused_absence'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {r.status === 'present' ? 'Có mặt' : r.status === 'excused_absence' ? 'Có phép' : r.status === 'unexcused_absence' ? 'Không phép' : 'Đi muộn'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'learning' && (
            <div className="space-y-3">
              {studentAssess.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">Chưa có đánh giá học tập nào</p>
              ) : (
                studentAssess.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{a.subjectId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.level === 'Hoàn thành tốt'
                          ? 'bg-emerald-100 text-emerald-800'
                          : a.level === 'Hoàn thành'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {a.level} {a.score !== undefined ? `(${a.score}đ)` : ''}
                      </span>
                    </div>
                    {a.teacherComment && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                        "{a.teacherComment}"
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400">Ngày ghi: {a.date}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === 'competition' && (
            <div className="space-y-2">
              {studentEntries.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">Chưa có điểm cộng/trừ thi đua cá nhân</p>
              ) : (
                studentEntries.map((e) => (
                  <div key={e.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{e.ruleTitle}</p>
                      {e.note && <p className="text-[11px] text-slate-500">{e.note}</p>}
                      <span className="text-[10px] text-slate-400">{e.date}</span>
                    </div>
                    <span className={`text-xs font-bold ${e.pointDelta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {e.pointDelta > 0 ? `+${e.pointDelta}` : e.pointDelta} điểm
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === 'journal' && (
            <div className="space-y-2">
              {studentJournals.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">Chưa có ghi chép nhật ký riêng về học sinh này</p>
              ) : (
                studentJournals.map((j) => (
                  <div key={j.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 capitalize">
                        {j.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{j.date}</span>
                    </div>
                    <p className="text-slate-800 mt-1">{j.content}</p>
                    {j.nextAction && (
                      <p className="text-[11px] text-emerald-700 font-medium">Kế hoạch: {j.nextAction}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === 'learning-journal' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                <div className="text-xs">
                  <p className="font-bold text-purple-900">Diễn biến & Minh chứng học tập</p>
                  <p className="text-[10px] text-purple-700">Tổng cộng {thisStudentLearningJournals.length} ghi nhận quan sát</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      if (thisStudentLearningJournals.length === 0) {
                        showToast('Chưa có đủ nhật ký để tổng hợp tuần cho em này.', 'info');
                        return;
                      }
                      setAiSummaryLoading(true);
                      try {
                        const entriesText = thisStudentLearningJournals
                          .map((j) => `- Ngày ${j.date} (${j.subject || 'môn học'}): ${j.observation}${j.evidence ? ` [Minh chứng: ${j.evidence}]` : ''}${j.supportAction ? ` [Hỗ trợ: ${j.supportAction}]` : ''}`)
                          .join('\n');
                        const prompt = `Dưới đây là các ghi chép nhật ký học tập của học sinh ${student.fullName}:\n${entriesText}\n\nHãy tổng hợp thành báo cáo tiến bộ tuần ngắn gọn theo 3 ý: 1. Nét nổi bật & tiến bộ, 2. Điểm cần tiếp tục rèn luyện, 3. Đề xuất hỗ trợ tiếp theo. Văn phong sư phạm tiểu học chuẩn TT27.`;
                        const res = await AIClientService.askAssistant({
                          userQuery: prompt,
                          contextData: {
                            className: student.groupId,
                            selectedStudent: { name: student.fullName, code: student.studentCode },
                          },
                        });
                        setAiWeekSummary(res.reply);
                        showToast('Đã tạo tổng hợp tiến bộ bằng AI!', 'success');
                      } catch (err: any) {
                        showToast('Lỗi tổng hợp: ' + (err.message || ''), 'error');
                      } finally {
                        setAiSummaryLoading(false);
                      }
                    }}
                    disabled={aiSummaryLoading || thisStudentLearningJournals.length === 0}
                    className="px-2.5 py-1.5 bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>{aiSummaryLoading ? 'Đang tổng hợp...' : 'Tổng hợp tuần (AI)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLearningJournalPrefill({
                        studentId: student.id,
                        studentName: student.fullName,
                      });
                      onClose();
                      setActiveTab('learning-journal');
                    }}
                    className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Ghi nhật ký</span>
                  </button>
                </div>
              </div>

              {aiWeekSummary && (
                <div className="p-3 bg-white rounded-xl border border-purple-300 shadow-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between text-purple-900 font-bold border-b border-purple-100 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Tổng hợp tiến bộ học tập (Gợi ý từ AI)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAiWeekSummary(null)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-slate-800 leading-relaxed whitespace-pre-line text-xs font-medium">
                    {aiWeekSummary}
                  </div>
                </div>
              )}

              {thisStudentLearningJournals.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Chưa có nhật ký học tập nào được ghi cho em này.
                </p>
              ) : (
                thisStudentLearningJournals.map((j) => (
                  <div
                    key={j.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs hover:border-purple-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{j.subject || 'Môn học'}</span>
                        {j.lessonTitle && <span className="text-slate-500">· {j.lessonTitle}</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">{j.date}</span>
                        {j.privateToTeacher && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                            Riêng tư
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-slate-800 leading-relaxed font-medium">
                        <span className="font-bold text-purple-900 mr-1">Quan sát:</span>
                        {j.observation}
                      </p>
                      {j.evidence && (
                        <p className="text-slate-600 pl-2 border-l-2 border-purple-300">
                          <span className="font-bold">Minh chứng: </span>
                          {j.evidence}
                        </p>
                      )}
                      {j.supportAction && (
                        <p className="text-emerald-800 bg-emerald-50/70 p-2 rounded-lg font-medium">
                          <span className="font-bold">Hướng hỗ trợ: </span>
                          {j.supportAction}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Send Zalo Modal */}
      {showZaloModal && (
        <SendZaloModal
          isOpen={showZaloModal}
          onClose={() => setShowZaloModal(false)}
          student={student}
          initialMessage=""
          defaultTopic={`Thông tin học tập & rèn luyện em ${student.fullName}`}
        />
      )}
    </div>
  );
};

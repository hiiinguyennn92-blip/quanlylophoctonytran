import * as XLSX from 'xlsx';
import { Student, ParentContact, AttendanceRecord, Assessment } from '../types';
import { compareVietnameseNames } from '../utils/vietnameseNameUtils';

export interface ParsedStudentRow {
  rowNumber: number;
  fullName: string;
  studentCode?: string;
  dob?: string;
  gender: 'nam' | 'nữ' | 'khác';
  groupId?: string;
  roleTitle?: string;
  parentName?: string;
  parentPhone?: string;
  parentType?: string;
  email?: string;
  address?: string;
  notes?: string;
  errors: string[];
  isValid: boolean;
}

/**
 * OWASP CSV / Formula Injection Mitigation:
 * Prefix any cell beginning with [=, +, -, @, \t, \r] with a single quote (')
 * to force spreadsheet software to treat the value strictly as text literal.
 */
export function sanitizeSpreadsheetCell(val: any): any {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${val}`;
  }
  return val;
}

export class ImportExportService {
  public static downloadTemplate() {
    const headers = [
      ['STT', 'Họ và tên', 'Mã học sinh', 'Ngày sinh (YYYY-MM-DD)', 'Giới tính (nam/nữ)', 'Tổ', 'Chức vụ cán bộ lớp', 'Tên phụ huynh', 'Số điện thoại', 'Email', 'Địa chỉ', 'Ghi chú'],
      [1, 'Bùi Thảo Linh', 'HS01', '2017-03-15', 'nữ', 'Tổ 1', 'Lớp trưởng', 'Bùi Văn Hùng', '0901234567', 'hung@example.com', 'Hà Nội', 'Chăm ngoan, gương mẫu'],
      [2, 'Ngô Phương Thảo', 'HS02', '2017-05-20', 'nữ', 'Tổ 2', 'Lớp phó học tập', 'Ngô Quang Minh', '0912345678', 'minh@example.com', 'Hà Nội', 'Học tốt, trách nhiệm'],
      [3, 'Trần Văn An', 'HS03', '2017-01-10', 'nam', 'Tổ 3', 'Tổ trưởng', 'Trần Văn Bình', '0923456789', 'binh@example.com', 'Hà Nội', 'Nhanh nhẹn'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 14 },
      { wch: 24 },
      { wch: 18 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 22 },
      { wch: 24 },
      { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_Hoc_Sinh');
    XLSX.writeFile(wb, 'Mau_Nhap_Danh_Sach_Hoc_Sinh_Tieu_Hoc.xlsx');
  }

  public static async parseStudentFile(file: File): Promise<ParsedStudentRow[]> {
    try {
      let arrayBuffer: ArrayBuffer;
      if (typeof file.arrayBuffer === 'function') {
        arrayBuffer = await file.arrayBuffer();
      } else {
        arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
          reader.onerror = (e) => reject(new Error('Lỗi khi đọc tệp'));
          reader.readAsArrayBuffer(file);
        });
      }

      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rawRows.length < 2) {
        return [];
      }

      // Map header column indices dynamically
      const headerRow = rawRows[0] || [];
      const colIndices: Record<string, number> = {};
      headerRow.forEach((col: any, idx: number) => {
        const str = String(col || '').toLowerCase().trim();
        if (str.includes('họ và tên') || str === 'tên học sinh' || str === 'họ tên') colIndices['fullName'] = idx;
        else if (str.includes('mã')) colIndices['studentCode'] = idx;
        else if (str.includes('ngày sinh') || str.includes('sinh')) colIndices['dob'] = idx;
        else if (str.includes('giới tính')) colIndices['gender'] = idx;
        else if (str.includes('tổ')) colIndices['groupId'] = idx;
        else if (str.includes('chức vụ') || str.includes('cán bộ') || str.includes('danh hiệu')) colIndices['roleTitle'] = idx;
        else if (str.includes('phụ huynh') || str.includes('người liên hệ')) colIndices['parentName'] = idx;
        else if (str.includes('quan hệ') || str.includes('mối quan hệ') || str.includes('vai trò ph')) colIndices['parentType'] = idx;
        else if (str.includes('điện thoại') || str.includes('sđt') || str.includes('phone')) colIndices['parentPhone'] = idx;
        else if (str.includes('email')) colIndices['email'] = idx;
        else if (str.includes('địa chỉ')) colIndices['address'] = idx;
        else if (str.includes('ghi chú')) colIndices['notes'] = idx;
      });

      // Fallbacks if headers weren't named standardly
      const hasNamedHeaders = Object.keys(colIndices).length >= 2;
      const getVal = (row: any[], key: string, fallbackIdx: number) => {
        if (hasNamedHeaders && colIndices[key] !== undefined) {
          return row[colIndices[key]];
        }
        return row[fallbackIdx];
      };

      const results: ParsedStudentRow[] = [];

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0 || row.every((c) => c === undefined || c === '')) {
          continue; // Skip empty row
        }

        const fullName = String(getVal(row, 'fullName', 1) || '').trim();
        const studentCode = String(getVal(row, 'studentCode', 2) || '').trim();
        let rawDob = String(getVal(row, 'dob', 3) || '').trim();
        let genderStr = String(getVal(row, 'gender', 4) || '').toLowerCase().trim();
        const groupId = String(getVal(row, 'groupId', 5) || '').trim() || 'Tổ 1';
        const roleTitle = String(getVal(row, 'roleTitle', 6) || '').trim();
        const parentName = String(getVal(row, 'parentName', colIndices['roleTitle'] !== undefined ? 7 : 6) || '').trim();
        const parentPhone = String(getVal(row, 'parentPhone', colIndices['roleTitle'] !== undefined ? 8 : 7) || '').trim();
        const email = String(getVal(row, 'email', colIndices['roleTitle'] !== undefined ? 9 : 8) || '').trim();
        const address = String(getVal(row, 'address', colIndices['roleTitle'] !== undefined ? 10 : 9) || '').trim();
        const notes = String(getVal(row, 'notes', colIndices['roleTitle'] !== undefined ? 11 : 10) || '').trim();

        const errors: string[] = [];

        if (!fullName) {
          errors.push('Họ và tên không được để trống');
        }

        // Normalize gender
        let gender: 'nam' | 'nữ' | 'khác' = 'nam';
        if (genderStr === 'nữ' || genderStr === 'nu' || genderStr === 'female' || genderStr === 'gái') {
          gender = 'nữ';
        } else if (genderStr === 'nam' || genderStr === 'male' || genderStr === 'trai') {
          gender = 'nam';
        } else if (genderStr) {
          gender = 'khác';
        }

        // Normalize DOB if Excel numeric date
        const dobVal = getVal(row, 'dob', 3);
        if (typeof dobVal === 'number') {
          const excelDate = new Date((dobVal - (25567 + 2)) * 86400 * 1000);
          if (!isNaN(excelDate.getTime())) {
            rawDob = excelDate.toISOString().split('T')[0];
          }
        }

        if (rawDob && !/^\d{4}-\d{2}-\d{2}$/.test(rawDob)) {
          // Try DD/MM/YYYY
          const parts = rawDob.split(/[/.-]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              rawDob = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else if (parts[2].length === 4) {
              rawDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Định dạng email phụ huynh không hợp lệ');
        }

        // Infer parentType dynamically
        let parentType: 'Bố' | 'Mẹ' | 'Người giám hộ' = 'Bố';
        const rawParentType = String(getVal(row, 'parentType', -1) || '').toLowerCase().trim();
        if (rawParentType.includes('mẹ') || rawParentType.includes('me') || rawParentType.includes('mother')) {
          parentType = 'Mẹ';
        } else if (rawParentType.includes('bố') || rawParentType.includes('ba') || rawParentType.includes('cha') || rawParentType.includes('father')) {
          parentType = 'Bố';
        } else if (rawParentType.includes('giám hộ') || rawParentType.includes('ông') || rawParentType.includes('bà')) {
          parentType = 'Người giám hộ';
        } else {
          const pNameLower = parentName.toLowerCase();
          if (pNameLower.startsWith('mẹ ') || pNameLower.startsWith('chị ') || pNameLower.includes('thị ')) {
            parentType = 'Mẹ';
          } else if (pNameLower.startsWith('bố ') || pNameLower.startsWith('ba ') || pNameLower.startsWith('anh ')) {
            parentType = 'Bố';
          } else if (pNameLower.startsWith('ông ') || pNameLower.startsWith('bà ')) {
            parentType = 'Người giám hộ';
          }
        }

        results.push({
          rowNumber: i + 1,
          fullName,
          studentCode,
          dob: rawDob || '2017-01-01',
          gender,
          groupId,
          roleTitle: roleTitle || undefined,
          parentName,
          parentPhone,
          parentType,
          email,
          address,
          notes,
          errors,
          isValid: errors.length === 0,
        });
      }

      return results;
    } catch (err: any) {
      throw new Error('Lỗi khi đọc tệp dữ liệu: ' + (err?.message || 'Không thể phân tích bảng tính'));
    }
  }

  public static exportStudentsToExcel(className: string, students: Student[], parents: ParentContact[]) {
    const parentMap = new Map(parents.map((p) => [p.studentId, p]));
    // Sort students by Vietnamese given name (Tên A-Z) before export
    const sortedStudents = [...students].sort(compareVietnameseNames);

    const data: any[][] = [
      [`DANH SÁCH HỌC SINH LỚP ${className.toUpperCase()}`],
      [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} (Sắp xếp theo thứ tự chữ cái đầu của Tên A-Z)`],
      [],
      ['STT', 'Họ và tên', 'Chức vụ cán bộ lớp', 'Mã học sinh', 'Ngày sinh', 'Giới tính', 'Tổ', 'Người liên hệ', 'Số điện thoại', 'Địa chỉ', 'Ghi chú'],
    ];

    sortedStudents.forEach((s, idx) => {
      const p = parentMap.get(s.id);
      data.push([
        idx + 1,
        sanitizeSpreadsheetCell(s.fullName),
        sanitizeSpreadsheetCell(s.roleTitle || 'Học sinh'),
        sanitizeSpreadsheetCell(s.studentCode || ''),
        sanitizeSpreadsheetCell(s.dob || ''),
        s.gender === 'nữ' ? 'Nữ' : 'Nam',
        sanitizeSpreadsheetCell(s.groupId || ''),
        p ? sanitizeSpreadsheetCell(`${p.type}: ${p.fullName}`) : '',
        p ? sanitizeSpreadsheetCell(p.phone) : '',
        sanitizeSpreadsheetCell(s.address || ''),
        sanitizeSpreadsheetCell(s.notes || ''),
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
      { wch: 22 },
      { wch: 16 },
      { wch: 26 },
      { wch: 26 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, `HocSinh_${className}`);
    XLSX.writeFile(wb, `Danh_Sach_Hoc_Sinh_${className}.xlsx`);
  }

  public static exportAttendanceToExcel(
    className: string,
    dates: string[],
    students: Student[],
    attendanceRecords: AttendanceRecord[]
  ) {
    const recordMap = new Map<string, AttendanceRecord['status']>();
    attendanceRecords.forEach((r) => {
      recordMap.set(`${r.studentId}_${r.date}`, r.status);
    });

    const headers = ['STT', 'Mã HS', 'Họ và tên', 'Tổ', ...dates.map((d) => d.slice(5))];
    const data: any[][] = [
      [`BẢNG ĐIỂM DANH CHUYÊN CẦN LỚP ${className.toUpperCase()}`],
      [`Kỳ báo cáo: ${dates[0] || ''} đến ${dates[dates.length - 1] || ''}`],
      [],
      headers,
    ];

    students.forEach((s, idx) => {
      const row: any[] = [
        idx + 1,
        sanitizeSpreadsheetCell(s.studentCode || ''),
        sanitizeSpreadsheetCell(s.fullName),
        sanitizeSpreadsheetCell(s.groupId || ''),
      ];
      dates.forEach((d) => {
        const st = recordMap.get(`${s.id}_${d}`);
        if (st === 'present') row.push('V');
        else if (st === 'excused_absence') row.push('P');
        else if (st === 'unexcused_absence') row.push('KP');
        else if (st === 'late') row.push('M');
        else row.push('-');
      });
      data.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, `DiemDanh_${className}`);
    XLSX.writeFile(wb, `Bao_Cao_Diem_Danh_${className}.xlsx`);
  }

  public static exportAttendanceSummaryReportToExcel(
    className: string,
    startDate: string,
    endDate: string,
    reportRows: Array<{
      stt: number;
      studentCode: string;
      fullName: string;
      groupId: string;
      totalDays: number;
      present: number;
      excused: number;
      unexcused: number;
      late: number;
      attendanceRate: number;
      statusNote: string;
    }>,
    summaryTotals: {
      totalStudents: number;
      avgAttendanceRate: number;
      totalExcused: number;
      totalUnexcused: number;
      totalLate: number;
      perfectAttendanceCount: number;
    }
  ) {
    const headers = [
      'STT',
      'Mã Học Sinh',
      'Họ và Tên',
      'Tổ',
      'Tổng Số Buổi',
      'Có Mặt',
      'Nghỉ Có Phép (P)',
      'Nghỉ Không Phép (KP)',
      'Đi Muộn (M)',
      'Tỷ Lệ Chuyên Cần (%)',
      'Đánh Giá / Phân Loại',
    ];

    const data: any[][] = [
      [`BÁO CÁO TỔNG KẾT ĐIỂM DANH CHUYÊN CẦN - LỚP ${className.toUpperCase()}`],
      [`Mốc thời gian báo cáo: Từ ngày ${startDate} đến ngày ${endDate}`],
      [
        `Tổng sĩ số: ${summaryTotals.totalStudents} em | Tỷ lệ chuyên cần bình quân: ${summaryTotals.avgAttendanceRate}% | Chuyên cần 100%: ${summaryTotals.perfectAttendanceCount} em`,
      ],
      [
        `Tổng vắng có phép: ${summaryTotals.totalExcused} lượt | Vắng không phép: ${summaryTotals.totalUnexcused} lượt | Đi muộn: ${summaryTotals.totalLate} lượt`,
      ],
      [],
      headers,
    ];

    reportRows.forEach((r) => {
      data.push([
        r.stt,
        sanitizeSpreadsheetCell(r.studentCode),
        sanitizeSpreadsheetCell(r.fullName),
        sanitizeSpreadsheetCell(r.groupId),
        r.totalDays,
        r.present,
        r.excused,
        r.unexcused,
        r.late,
        `${r.attendanceRate}%`,
        sanitizeSpreadsheetCell(r.statusNote),
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 24 },
      { wch: 10 },
      { wch: 14 },
      { wch: 10 },
      { wch: 18 },
      { wch: 20 },
      { wch: 14 },
      { wch: 20 },
      { wch: 26 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, `TongKet_${className}`);
    XLSX.writeFile(wb, `Bao_Cao_Tong_Ket_Diem_Danh_${className}_${startDate}_den_${endDate}.xlsx`);
  }
}

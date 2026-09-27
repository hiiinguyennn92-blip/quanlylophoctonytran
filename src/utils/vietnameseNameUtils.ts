/**
 * Vietnamese Name Sorting and Parsing Utilities
 * Theo quy tắc sư phạm Việt Nam (Sổ chủ nhiệm & Sổ điểm điện tử):
 * - Xếp danh sách theo CHỮ CÁI ĐẦU TIÊN CỦA TÊN (từ cuối cùng của Họ và tên).
 * - Ví dụ:
 *   + "Bùi Thảo Linh": Tên là "Linh" -> Chữ cái đầu là "L"
 *   + "Ngô Phương Thảo": Tên là "Thảo" -> Chữ cái đầu là "T"
 *   + "Linh" xếp trước "Thảo" (L trước T).
 * - Nếu trùng Tên (ví dụ cùng là "Linh"): xét tiếp Họ và Tên đệm (ví dụ "Bùi Thảo" vs "Nguyễn Diệu").
 */

export interface VietnameseNameParts {
  fullName: string;
  givenName: string;          // Tên (từ cuối cùng)
  firstLetter: string;        // Chữ cái đầu tiên của Tên (in hoa)
  middleAndLastName: string;  // Họ và tên đệm
}

/**
 * Trích xuất thành phần tên tiếng Việt chuẩn
 */
export function getVietnameseNameParts(fullName: string): VietnameseNameParts {
  const clean = (fullName || '').trim();
  if (!clean) {
    return { fullName: '', givenName: '', firstLetter: '', middleAndLastName: '' };
  }

  const parts = clean.split(/\s+/);
  const givenName = parts[parts.length - 1];
  const firstLetter = givenName.charAt(0).toUpperCase();
  const middleAndLastName = parts.slice(0, -1).join(' ');

  return {
    fullName: clean,
    givenName,
    firstLetter,
    middleAndLastName,
  };
}

/**
 * Lấy chữ cái đầu tiên của Tên để hiển thị avatar hoặc ký hiệu
 * Ví dụ: "Bùi Thảo Linh" -> "L", "Ngô Phương Thảo" -> "T"
 */
export function getVietnameseInitial(fullName: string): string {
  const parts = getVietnameseNameParts(fullName);
  return parts.firstLetter || '?';
}

/**
 * Hàm so sánh 2 học sinh hoặc 2 chuỗi tên theo thứ tự Alphabet tiếng Việt của TÊN
 */
export function compareVietnameseNames(
  a: string | { fullName: string },
  b: string | { fullName: string }
): number {
  const nameA = typeof a === 'string' ? a : a?.fullName || '';
  const nameB = typeof b === 'string' ? b : b?.fullName || '';

  const partsA = getVietnameseNameParts(nameA);
  const partsB = getVietnameseNameParts(nameB);

  // 1. So sánh Tên (Given name) bằng collation tiếng Việt
  const cmpGiven = partsA.givenName.localeCompare(partsB.givenName, 'vi', { sensitivity: 'base' }) ||
                   partsA.givenName.localeCompare(partsB.givenName, 'vi');
  if (cmpGiven !== 0) {
    return cmpGiven;
  }

  // 2. Nếu cùng Tên, so sánh Họ và Tên đệm
  const cmpRest = partsA.middleAndLastName.localeCompare(partsB.middleAndLastName, 'vi', { sensitivity: 'base' }) ||
                  partsA.middleAndLastName.localeCompare(partsB.middleAndLastName, 'vi');
  if (cmpRest !== 0) {
    return cmpRest;
  }

  // 3. Dự phòng so sánh nguyên chuỗi
  return nameA.localeCompare(nameB, 'vi');
}

/**
 * Sắp xếp danh sách học sinh theo chuẩn tiếng Việt (Tên A-Z)
 */
export function sortStudentsByVietnameseName<T extends { fullName: string }>(students: T[]): T[] {
  return [...students].sort(compareVietnameseNames);
}

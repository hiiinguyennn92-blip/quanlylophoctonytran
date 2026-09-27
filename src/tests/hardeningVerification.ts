/**
 * Hardening & Production Verification Test Suite
 * Validates P0-01 (Auth & Ownership), P0-02 (Anti-Hallucination & Groundedness),
 * P0-03 (Cascade Deletion & No Orphan Data), and P1-02 (Backup Schema Integrity).
 */

import { verifyToken, verifyClassOwnership } from '../server/authMiddleware.ts';
import { generateComment, generateCompetencyBatchRecommendation } from '../server/aiEndpoints.ts';
import { BackupService } from '../services/backupService.ts';
import {
  ClassRepository,
  StudentRepository,
  AttendanceRepository,
  LearningRepository,
  ParentRepository,
  CompetitionRepository,
} from '../repositories/dataRepository.ts';

// Mock localStorage for Node environment if not present
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    length: store.size,
  } as Storage;
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}: ${failureDetail || 'Assertion failed'}`);
    failed++;
  }
}

async function runAllVerificationTests() {
  console.log('\n======================================================');
  console.log('--- STARTING CTO HARDENING & PRODUCTION AUDIT TESTS ---');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // SECTION 1: P0-01 AI AUTHENTICATION & AUTHORIZATION
  // ----------------------------------------------------
  console.log('[SECTION 1] P0-01: AI API Authentication & Authorization');

  // TEST-AI-AUTH-01: Empty or missing token
  const emptyUser = await verifyToken('');
  assert(emptyUser === null, 'TEST-AI-AUTH-01: Missing token returns null (401)');

  // TEST-AI-AUTH-02: Invalid/garbage token
  const garbageUser = await verifyToken('random_garbage_token_xyz_123');
  assert(garbageUser === null, 'TEST-AI-AUTH-02: Invalid token rejected (401)');

  // TEST-AI-AUTH-03: Valid guest demo token format
  const validGuestToken = `guest_preview_teacher_${Date.now()}`;
  const validGuest = await verifyToken(validGuestToken);
  assert(
    validGuest !== null && validGuest.isGuest === true && validGuest.uid.includes('teacher'),
    'TEST-AI-AUTH-03: Valid preview token parsed safely'
  );

  // TEST-AI-AUTH-04: Expired guest token rejected
  const expiredGuestToken = `guest_preview_teacher_${Date.now() - 48 * 3600 * 1000}`;
  const expiredGuest = await verifyToken(expiredGuestToken);
  assert(expiredGuest === null, 'TEST-AI-AUTH-04: Stale token older than 24h rejected');

  // TEST-AI-AUTH-05: Resource Ownership - Guest attempting to access real teacher class
  if (validGuest) {
    const guestAccessRealClass = await verifyClassOwnership(validGuest, validGuestToken, 'real_teacher_class_456');
    assert(guestAccessRealClass === false, 'TEST-AI-AUTH-05: Guest cannot access non-demo teacher class (403)');

    const guestAccessDemoClass = await verifyClassOwnership(validGuest, validGuestToken, 'demo_class_3a1');
    assert(guestAccessDemoClass === true, 'TEST-AI-AUTH-05b: Guest can access permitted demo class');
  }

  // ----------------------------------------------------
  // SECTION 2: P0-02 GROUNDEDNESS & ANTI-HALLUCINATION
  // ----------------------------------------------------
  console.log('\n[SECTION 2] P0-02: Grounded AI Failure Contract & Anti-Fabrication');

  // Test generateComment with NO teacher notes (should not invent "chăm ngoan", "tiếp thu tốt")
  const commentResult = await generateComment({
    studentName: 'Nguyễn Văn A',
    subject: 'Toán',
    level: 'Hoàn thành',
    strengths: '',
    improvements: '',
  });

  assert(
    typeof commentResult.comment === 'string' && commentResult.comment.length > 0,
    'TEST-AI-GROUND-01: Comment generation returns valid string'
  );
  assert(
    !commentResult.comment.includes('tiếp thu bài tốt'),
    'TEST-AI-GROUND-02: Does NOT fabricate "tiếp thu bài tốt" without evidence'
  );
  assert(
    !commentResult.comment.includes('chăm ngoan'),
    'TEST-AI-GROUND-03: Does NOT fabricate "chăm ngoan" without evidence'
  );
  assert(
    typeof commentResult.status === 'string',
    `TEST-AI-GROUND-04: Structured status returned: "${commentResult.status}"`
  );
  assert(
    typeof commentResult.retryable === 'boolean',
    `TEST-AI-GROUND-05: Retryable flag present: ${commentResult.retryable}`
  );

  // Test generateCompetencyBatchRecommendation fallback behavior
  const compBatchResult = await generateCompetencyBatchRecommendation({
    studentName: 'Trần Thị B',
    period: 'Học kỳ 1',
    studentNotes: '',
    recentAssessmentLevels: '',
    attendanceRecord: '',
  });

  assert(
    typeof compBatchResult.status === 'string',
    'TEST-AI-GROUND-06: Competency batch returns structured status'
  );

  // If offline/fallback, evaluations must NOT be populated with 10 fabricated fake-5-star criteria
  if (compBatchResult.status === 'ai_unavailable') {
    assert(
      Object.keys(compBatchResult.evaluations).length === 0,
      'TEST-AI-GROUND-07: In ai_unavailable state, no fabricated 10 criteria are emitted'
    );
  }

  // ----------------------------------------------------
  // SECTION 3: P0-03 DATA CASCADE DELETION LIFECYCLE
  // ----------------------------------------------------
  console.log('\n[SECTION 3] P0-03: Complete Cascade Deletion & No Orphan Data');

  const testOwnerId = 'test_owner_999';
  const testClass = await ClassRepository.createClass({
    ownerId: testOwnerId,
    className: 'Lớp Kiểm Thử Cascade',
    grade: '4',
    schoolName: 'Tiểu Học Alpha',
    schoolYear: '2025 - 2026',
    teacherName: 'Thầy Kiểm Thử',
    session: 'morning',
  });

  assert(Boolean(testClass.id), 'TEST-CASCADE-01: Test class created');

  // Create dependent student
  const testStudent = await StudentRepository.createStudent({
    classId: testClass.id,
    ownerId: testOwnerId,
    studentCode: 'HS-TEST-01',
    fullName: 'Lê Văn Test',
    dob: '2016-05-10',
    gender: 'nam',
    groupId: 'Tổ 1',
  });
  assert(Boolean(testStudent.id), 'TEST-CASCADE-02: Test student created');

  // Populate localDb with dummy dependent records for this student and class
  const colKeys = [
    'local_db_parentContacts',
    'local_db_attendanceRecords',
    'local_db_assessments',
    'local_db_competencyEvaluations',
    'local_db_tasks',
    'local_db_taskCompletions',
  ];
  for (const colKey of colKeys) {
    localStorage.setItem(
      colKey,
      JSON.stringify([
        { id: 'rec_1', classId: testClass.id, studentId: testStudent.id },
        { id: 'rec_other', classId: 'other_class_123', studentId: 'other_student_456' },
      ])
    );
  }

  // Execute Cascade Delete of Class
  await ClassRepository.deleteClass(testClass.id);

  // Check that the class is gone
  const classesAfter = await ClassRepository.getClassesByOwner(testOwnerId);
  const classStillExists = classesAfter.some((c) => c.id === testClass.id);
  assert(!classStillExists, 'TEST-CASCADE-03: Root class document deleted');

  // Check that dependent records in collections were cascade-deleted
  let anyOrphansLeft = false;
  for (const colKey of colKeys) {
    const raw = localStorage.getItem(colKey);
    const list = raw ? JSON.parse(raw) : [];
    if (list.some((item: any) => item.classId === testClass.id)) {
      anyOrphansLeft = true;
      break;
    }
  }
  assert(!anyOrphansLeft, 'TEST-CASCADE-04: Zero orphan records remain after Class cascade delete');

  // Check that unrelated class data was NOT touched
  const otherRecordFound = JSON.parse(localStorage.getItem('local_db_parentContacts') || '[]').some(
    (item: any) => item.classId === 'other_class_123'
  );
  assert(otherRecordFound, 'TEST-CASCADE-05: Unrelated classes records preserved safely');

  // ----------------------------------------------------
  // SECTION 4: P1-02 BACKUP & RESTORE SCHEMA INTEGRITY
  // ----------------------------------------------------
  console.log('\n[SECTION 4] P1-02: Backup Schema Validation & Integrity');

  // Corrupted / empty backup
  const valEmpty = BackupService.validateBackupFile('');
  assert(!valEmpty.valid, 'TEST-BACKUP-01: Empty backup rejected');

  const valInvalidJson = BackupService.validateBackupFile('{ bad_json: ');
  assert(!valInvalidJson.valid, 'TEST-BACKUP-02: Malformed JSON rejected');

  const valMissingSchema = BackupService.validateBackupFile(JSON.stringify({ classes: [] }));
  assert(!valMissingSchema.valid, 'TEST-BACKUP-03: Missing schemaVersion rejected');

  const valMissingClasses = BackupService.validateBackupFile(
    JSON.stringify({ schemaVersion: '1.0.0', students: [] })
  );
  assert(!valMissingClasses.valid, 'TEST-BACKUP-04: Missing classes array rejected');

  // Valid backup payload
  const validBackupJson = JSON.stringify({
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    ownerId: 'teacher_123',
    classes: [
      { id: 'c1', className: 'Lớp 3A', grade: '3', schoolName: 'Trường Tiểu học' },
    ],
    students: [
      { id: 's1', classId: 'c1', fullName: 'Nguyễn Văn B' },
    ],
  });
  const valSuccess = BackupService.validateBackupFile(validBackupJson);
  assert(valSuccess.valid, 'TEST-BACKUP-05: Standard compliant backup payload accepted');
  assert(
    valSuccess.summary?.classCount === 1 && valSuccess.summary?.studentCount === 1,
    'TEST-BACKUP-06: Accurate backup summary extracted'
  );

  // ----------------------------------------------------
  // SECTION 5: CROSS-MODULE REGRESSION & ZERO-STALE DATA INTEGRITY
  // ----------------------------------------------------
  console.log('\n[SECTION 5] Cross-Module Regression: Name Edits, Deletions, Attendance, Assessments & Class Switching');

  const regOwnerId = 'regression_teacher_001';

  // 1. Setup two isolated classes for class-switching tests
  const classA = await ClassRepository.createClass({
    ownerId: regOwnerId,
    className: 'Lớp 3A Regression',
    grade: '3',
    schoolName: 'Tiểu học Chu Văn An',
    schoolYear: '2025 - 2026',
    teacherName: 'Cô Thu',
    session: 'full_day',
  });

  const classB = await ClassRepository.createClass({
    ownerId: regOwnerId,
    className: 'Lớp 4B Regression',
    grade: '4',
    schoolName: 'Tiểu học Chu Văn An',
    schoolYear: '2025 - 2026',
    teacherName: 'Thầy Hùng',
    session: 'morning',
  });

  assert(Boolean(classA.id && classB.id), 'TEST-REG-01: Isolated test classes created');

  // Create student in Class A
  const studentA = await StudentRepository.createStudent({
    classId: classA.id,
    ownerId: regOwnerId,
    studentCode: 'HS-REG-01',
    fullName: 'Hoàng Kim Chi Ban Đầu',
    dob: '2016-09-15',
    gender: 'nữ',
    groupId: 'Tổ 1',
  });

  // Create student in Class B
  const studentB = await StudentRepository.createStudent({
    classId: classB.id,
    ownerId: regOwnerId,
    studentCode: 'HS-REG-02',
    fullName: 'Đặng Tuấn Anh Lớp Khác',
    dob: '2015-04-12',
    gender: 'nam',
    groupId: 'Tổ 2',
  });

  // TEST-REG-02: Class Switch Isolation
  const studentsInClassA = await StudentRepository.getStudents(classA.id, regOwnerId);
  const studentsInClassB = await StudentRepository.getStudents(classB.id, regOwnerId);
  assert(
    studentsInClassA.length === 1 &&
      studentsInClassA[0].id === studentA.id &&
      !studentsInClassA.some((s) => s.id === studentB.id),
    'TEST-REG-02: Class A strictly isolates its students from Class B'
  );
  assert(
    studentsInClassB.length === 1 &&
      studentsInClassB[0].id === studentB.id &&
      !studentsInClassB.some((s) => s.id === studentA.id),
    'TEST-REG-03: Class B strictly isolates its students from Class A'
  );

  // TEST-REG-04: Sửa tên học sinh (Edit student name) -> Zero stale name references
  const updatedFullName = 'Hoàng Kim Chi Đã Cập Nhật';
  await StudentRepository.updateStudent(studentA.id, {
    fullName: updatedFullName,
  });
  const studentsAfterNameUpdate = await StudentRepository.getStudents(classA.id, regOwnerId);
  assert(
    studentsAfterNameUpdate[0].fullName === updatedFullName,
    'TEST-REG-04: Student name edit propagates cleanly to fresh fetches without stale values'
  );

  // TEST-REG-05: Đổi điểm danh (Change Attendance)
  const testDate = '2026-09-25';
  await AttendanceRepository.saveAttendanceBatch(classA.id, regOwnerId, testDate, [
    { studentId: studentA.id, status: 'unexcused_absence', notes: 'Nghỉ không phép buổi đầu' },
  ]);
  let attList = await AttendanceRepository.getAllAttendance(classA.id, regOwnerId);
  assert(
    attList.length === 1 && attList[0].status === 'unexcused_absence',
    'TEST-REG-05: Initial attendance saved as unexcused_absence'
  );

  // Switch attendance status to 'present'
  await AttendanceRepository.saveAttendanceBatch(classA.id, regOwnerId, testDate, [
    { studentId: studentA.id, status: 'present', notes: 'Đã bổ sung có mặt kịp thời' },
  ]);
  attList = await AttendanceRepository.getAllAttendance(classA.id, regOwnerId);
  assert(
    attList.length === 1 && attList[0].status === 'present',
    'TEST-REG-06: Attendance record updated in-place without duplicate records or stale status'
  );

  // TEST-REG-07: Đổi đánh giá học tập (Change Assessment)
  const assessmentDate = '2026-09-24';
  const initialAssess = await LearningRepository.saveAssessment({
    classId: classA.id,
    studentId: studentA.id,
    ownerId: regOwnerId,
    subjectId: 'Toán',
    assessmentType: 'định kỳ giữa kì',
    level: 'Chưa hoàn thành',
    score: 4,
    date: assessmentDate,
    teacherComment: 'Cần hướng dẫn thêm phép cộng có nhớ',
  });
  let allAssess = await LearningRepository.getAssessments(classA.id, regOwnerId);
  assert(
    allAssess.some((a) => a.id === initialAssess.id && a.level === 'Chưa hoàn thành'),
    'TEST-REG-07: Assessment recorded with initial level "Chưa hoàn thành"'
  );

  // Update assessment to 'Hoàn thành tốt'
  await LearningRepository.saveAssessment({
    id: initialAssess.id,
    classId: classA.id,
    studentId: studentA.id,
    ownerId: regOwnerId,
    subjectId: 'Toán',
    assessmentType: 'định kỳ giữa kì',
    level: 'Hoàn thành tốt',
    score: 9,
    date: assessmentDate,
    teacherComment: 'Em đã tiến bộ vượt bậc sau khi được kèm cặp',
  });
  allAssess = await LearningRepository.getAssessments(classA.id, regOwnerId);
  const updatedAssess = allAssess.find((a) => a.id === initialAssess.id);
  assert(
    updatedAssess?.level === 'Hoàn thành tốt' && updatedAssess?.score === 9,
    'TEST-REG-08: Assessment updated accurately to "Hoàn thành tốt" without stale level'
  );

  // TEST-REG-09: Xóa học sinh (Delete Student) & Zero Orphan Guarantee
  // Attach parent contact and competition entry to studentA
  await ParentRepository.saveContact({
    classId: classA.id,
    studentId: studentA.id,
    ownerId: regOwnerId,
    fullName: 'Bà Hoàng Thị Mẹ',
    phone: '0912345678',
    type: 'Mẹ',
    primary: true,
  });

  // Call student delete
  await StudentRepository.deleteStudent(studentA.id);

  // Verify student is gone
  const studentsAfterDelete = await StudentRepository.getStudents(classA.id, regOwnerId);
  assert(
    studentsAfterDelete.length === 0,
    'TEST-REG-09: Student document deleted from class roster'
  );

  // Verify dependent attendance, assessments, and parent contacts are purged
  const remainingAtt = await AttendanceRepository.getAllAttendance(classA.id, regOwnerId);
  const remainingAssess = await LearningRepository.getAssessments(classA.id, regOwnerId);
  const remainingParents = await ParentRepository.getContacts(classA.id, regOwnerId);
  assert(
    !remainingAtt.some((r) => r.studentId === studentA.id),
    'TEST-REG-10: Student attendance records purged cleanly on student deletion'
  );
  assert(
    !remainingAssess.some((a) => a.studentId === studentA.id),
    'TEST-REG-11: Student assessments purged cleanly on student deletion'
  );
  assert(
    !remainingParents.some((p) => p.studentId === studentA.id),
    'TEST-REG-12: Student parent contacts purged cleanly on student deletion'
  );

  // TEST-REG-13: Non-Silent Restore Conflict Detection
  const conflictBackupPayload = JSON.stringify({
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    ownerId: 'some_other_teacher',
    classes: [
      { id: classB.id, className: classB.className, grade: '4', schoolName: 'Trường Tiểu học' },
    ],
    students: [
      { id: 's_conflict', classId: classB.id, fullName: 'Học sinh trùng lớp' },
    ],
  });
  const valConflict = BackupService.validateBackupFile(conflictBackupPayload, {
    id: classB.id,
    className: classB.className,
  });
  assert(
    valConflict.valid && valConflict.summary?.conflictWithCurrentClass === true,
    'TEST-REG-13: Non-silent restore detects class conflict and flags conflictWithCurrentClass'
  );

  // Clean up regression classes
  await ClassRepository.deleteClass(classA.id);
  await ClassRepository.deleteClass(classB.id);

  console.log('\n======================================================');
  console.log(`--- TEST RESULTS: ${passed} PASSED | ${failed} FAILED ---`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runAllVerificationTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});

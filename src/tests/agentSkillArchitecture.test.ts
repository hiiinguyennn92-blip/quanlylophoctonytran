import {
  resolveSkillRoute,
  scoreSkillMatch,
  SKILL_DEFINITIONS,
  getAllSkillManifests,
} from '../services/agentSkills/skillRegistry';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    failCount++;
  }
}

export function runSkillArchitectureTests() {
  console.log('================================================================');
  console.log('  TEST SUITE: AGENTIC SKILL ARCHITECTURE & SEMANTIC ROUTER      ');
  console.log('================================================================\n');

  // Test 1: Skill Registry Integrity
  console.log('>> [TEST 1] Single Source of Truth Skill Registry Integrity');
  const manifests = getAllSkillManifests();
  assert(manifests.length >= 7, `Đăng ký tối thiểu 7 skills chuyên biệt (Thực tế: ${manifests.length})`);
  assert(manifests.every((s) => s.id && s.name && s.badge && s.capabilities.length > 0), 'Mọi Skill đều có đầy đủ Metadata & Capabilities');
  assert(manifests.every((s) => typeof s.createContextualPrompt === 'function'), 'Mọi Skill đều có Contextual Prompt Generator');

  // Test 2: Semantic Intent Matching & Routing
  console.log('\n>> [TEST 2] Semantic Intent Matching');
  const route1 = resolveSkillRoute('Có học sinh vắng học 3 ngày liên tiếp cần can thiệp');
  assert(route1.id === 'early_warning', `Định tuyến đúng early_warning (Thực tế: ${route1.id})`);

  const route2 = resolveSkillRoute('Hướng dẫn nhận xét học bạ theo Thông tư 27 năng lực Tự chủ');
  assert(route2.id === 'circular_27', `Định tuyến đúng circular_27 (Thực tế: ${route2.id})`);

  const route3 = resolveSkillRoute('Em học sinh bị cận thị và chiều cao thấp nên xếp bàn nào');
  assert(route3.id === 'classroom_dynamics', `Định tuyến đúng classroom_dynamics (Thực tế: ${route3.id})`);

  const route4 = resolveSkillRoute('Soạn tin nhắn Zalo gửi phụ huynh em Đức Anh');
  assert(route4.id === 'parent_bridge', `Định tuyến đúng parent_bridge (Thực tế: ${route4.id})`);

  const route5 = resolveSkillRoute('Lên kế hoạch kịch bản tiết sinh hoạt lớp 35 phút');
  assert(route5.id === 'lesson_schedule', `Định tuyến đúng lesson_schedule (Thực tế: ${route5.id})`);

  const route6 = resolveSkillRoute('Vẽ poster tuyên dương đôi bạn cùng tiến cho góc học tập');
  assert(route6.id === 'image_design', `Định tuyến đúng image_design (Thực tế: ${route6.id})`);

  const route7 = resolveSkillRoute('Rà soát nhật ký lớp và chuyển biến tâm lý các em gần đây');
  assert(route7.id === 'student_journal_analyzer', `Định tuyến đúng student_journal_analyzer (Thực tế: ${route7.id})`);

  // Test 3: Negative Keyword Exclusion & Conflict Resolution
  console.log('\n>> [TEST 3] Negative Keyword Exclusion & Anti-Collision');
  // "vẽ bức tranh về lớp học không vắng bóng nụ cười" -> có chữ "vắng" nhưng mục đích là vẽ tranh
  const routeConflict = resolveSkillRoute('Hãy vẽ một bức tranh về lớp học vắng bóng nỗi sợ hãi');
  assert(routeConflict.id === 'image_design', `Khử nhiễu thành công: 'vẽ tranh' ưu tiên hơn 'vắng' (Thực tế: ${routeConflict.id})`);

  // Test 4: Explicit User Selection Priority
  console.log('\n>> [TEST 4] Explicit User Selection Override');
  const routeExplicit = resolveSkillRoute('Hôm nay thời tiết đẹp', 'circular_27');
  assert(routeExplicit.id === 'circular_27', 'Lựa chọn tường minh của Giáo viên có độ ưu tiên cao nhất');

  console.log(`\n>> KẾT QUẢ KIỂM THỬ: ${passCount} PASSED / ${failCount} FAILED\n`);
  return { passCount, failCount };
}

runSkillArchitectureTests();

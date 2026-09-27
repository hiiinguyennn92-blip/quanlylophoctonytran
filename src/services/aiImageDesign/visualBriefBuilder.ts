import { VisualBrief, VisualIntent, CompiledImagePrompt } from './visualBrief';
import { ImageEngine, ModelRouter, RouteDecisionFactors } from './modelRouter';
import { BananaPromptAdapter } from './bananaPromptAdapter';
import { GptImagePromptAdapter } from './gptImagePromptAdapter';

export interface VisualBriefBuilderParams {
  userPrompt: string;
  targetAudience?: string;
  presentationType?: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16' | string;
  hasText?: boolean;
  exactStrings?: string[];
  styleMedium?: string;
  customPalette?: string[];
  referenceCount?: number;
  editContext?: VisualBrief['editContext'];
  // Advanced optional overrides
  compositionLayout?: string;
  focalPoint?: string;
  foreground?: string[];
  center?: string[];
  backgroundElements?: string[];
  preservationRules?: string[];
  prohibitedElements?: string[];
  culturalContext?: string;
  actionLogic?: string;
}

export class VisualBriefBuilder {
  /**
   * Phân loại ý định thị giác (Intent Classifier)
   */
  public static classifyIntent(prompt: string, explicitPresentation?: string): VisualIntent {
    const text = (prompt + ' ' + (explicitPresentation || '')).toLowerCase();

    if (text.includes('sửa') || text.includes('chỉnh sửa') || text.includes('thay nền') || text.includes('đổi áo')) {
      return 'EDIT_IMAGE';
    }
    if (text.includes('infographic') || text.includes('thông tin đồ họa')) {
      return 'INFOGRAPHIC';
    }
    if (text.includes('quy trình') || text.includes('bước') || text.includes('vòng đời') || text.includes('chu trình') || text.includes('các bước')) {
      return 'PROCESS';
    }
    if (text.includes('kể chuyện') || text.includes('truyện tranh') || text.includes('3 phần') || text.includes('diễn biến') || text.includes('khung truyện')) {
      return 'STORY';
    }
    if (text.includes('poster') || text.includes('áp phích') || text.includes('cổ động') || text.includes('tuyên truyền') || text.includes('khẩu hiệu')) {
      return 'POSTER';
    }
    if (text.includes('sơ đồ') || text.includes('biểu đồ') || text.includes('mindmap')) {
      return 'DIAGRAM';
    }
    if (text.includes('dòng thời gian') || text.includes('timeline') || text.includes('lịch sử') || text.includes('mốc thời gian')) {
      return 'TIMELINE';
    }
    if (text.includes('cắt lớp') || text.includes('cấu tạo') || text.includes('giải phẫu')) {
      return 'CUTAWAY';
    }
    if (text.includes('lớp học') || text.includes('tiết học') || text.includes('hoạt động') || text.includes('giờ học') || text.includes('sân trường')) {
      return 'CLASSROOM';
    }
    if (text.includes('địa danh') || text.includes('bản đồ') || text.includes('danh lam') || text.includes('di tích') || text.includes('thủ đô')) {
      return 'LOCATION';
    }
    if (text.includes('nhân vật') || text.includes('chân dung') || text.includes('học sinh') || text.includes('thầy cô')) {
      return 'CHARACTER';
    }
    return 'ILLUSTRATION';
  }

  /**
   * Tinh chỉnh cấu trúc chính theo chủ đề (Thematic Primary Structure)
   */
  public static inferThematicStructure(
    prompt: string,
    intent: VisualIntent,
    presentationType: string
  ): {
    form: string;
    details: string[];
    layoutRefinement: string;
    hierarchyLevels: string[];
  } {
    const text = prompt.toLowerCase();

    // 1. Chu trình nước / Khoa học tự nhiên
    if (text.includes('vòng tuần hoàn của nước') || text.includes('vòng tuần hoàn nước') || (text.includes('nước') && text.includes('bốc hơi'))) {
      return {
        form: 'Chu trình khép kín 4 cung tròn liên hoàn 360 độ (Circular Closed Cycle) với các mũi tên màu lam ngọc uốn lượn mềm mại theo chiều kim đồng hồ.',
        details: [
          'Cung 1 (Dưới lên trên): Bốc hơi từ mặt nước sông hồ biển lớn dưới ánh nắng mặt trời rực rỡ',
          'Cung 2 (Trên cao): Ngưng tụ tạo thành những đám mây trắng xốp bồng bềnh chuyển dần sang mây xám tích nước',
          'Cung 3 (Trên cao xuống dưới): Mưa rào với những giọt nước long lanh rơi xuống sườn núi và cánh đồng',
          'Cung 4 (Dưới mặt đất): Thu gom qua các dòng suối nhỏ, mạch nước ngầm và sông lớn đổ về biển cả bao la',
        ],
        layoutRefinement: 'Bố cục vòng cung trung tâm cân đối, mỗi bước là một đảo hình ảnh rõ ràng có tiêu đề bước ngay sát bên.',
        hierarchyLevels: ['Tiêu đề chu trình: VÒNG TUẦN HOÀN CỦA NƯỚC', '4 Bước chính: Bốc hơi -> Ngưng tụ -> Mưa -> Thu gom', 'Ghi chú phụ: Mũi tên hướng dòng chảy'],
      };
    }

    // 2. Vệ sinh y tế / 6 Bước rửa tay
    if (text.includes('rửa tay') || text.includes('vệ sinh tay')) {
      return {
        form: 'Ma trận tiến trình trực quan phân ô bàn cờ (Grid Sequence Process) gồm 6 bước chuẩn Bộ Y Tế, mỗi ô có số thứ tự tròn viền xanh ngọc nổi bật.',
        details: [
          'Bước 1: Làm ướt hai lòng bàn tay bằng nước sạch, lấy xà phòng và chà hai lòng bàn tay vào nhau tạo bọt',
          'Bước 2: Chà lòng bàn tay này lên mu và kẽ ngoài các ngón tay của bàn tay kia và ngược lại',
          'Bước 3: Chà hai lòng bàn tay vào nhau, miết mạnh các ngón tay vào các kẽ ngón',
          'Bước 4: Chà mặt ngoài các ngón tay của bàn tay này vào lòng bàn tay kia',
          'Bước 5: Xoay ngón tay cái của bàn tay này vào lòng bàn tay kia và ngược lại',
          'Bước 6: Xoay các đầu ngón tay của bàn tay này vào lòng bàn tay kia, xả sạch bọt xà phòng dưới vòi nước chảy và lau khô tay',
        ],
        layoutRefinement: 'Bố cục lưới 2 hàng x 3 cột (hoặc 6 ô liên tiếp ziczac), khung viền bo tròn thân thiện, đánh số bước từ 1 đến 6 to rõ.',
        hierarchyLevels: ['Tiêu đề lớn: QUY TRÌNH RỬA TAY SẠCH KHUẨN', 'Nhãn 6 bước: Bước 1 đến Bước 6', 'Khẩu hiệu chân trang: Đôi tay sạch - Cơ thể khỏe mạnh'],
      };
    }

    // 3. An toàn giao thông cổng trường
    if (text.includes('an toàn giao thông') || text.includes('cổng trường') || text.includes('đội mũ')) {
      return {
        form: 'Bố cục tháp truyền thông học đường (Educational Pyramid Structure) gồm Banner khẩu hiệu trên đỉnh, Khung cảnh hành động mẫu mực ở trung tâm, và Thanh chỉ dẫn 3 quy tắc vàng ở đáy.',
        details: [
          'Đỉnh áp phích: Băng rôn khẩu hiệu đỏ thắm chữ vàng: "CỔNG TRƯỜNG AN TOÀN GIAO THÔNG"',
          'Trung tâm: Em học sinh tiểu học đội mũ bảo hiểm cài quai đúng cách, mỉm cười chào chú bảo vệ/công an và dắt xe qua vạch đi bộ',
          'Thanh quy tắc chân trang: 1. Đội mũ bảo hiểm cài quai đúng quy cách | 2. Đi đúng làn đường và dừng trước đèn đỏ | 3. Không tụ tập dưới lòng đường trước cổng trường',
        ],
        layoutRefinement: 'Bố cục đối xứng, tầm mắt hướng thẳng vào nhân vật trung tâm, dải banner trên cùng tạo sự trang nghiêm, dải chân trang làm rõ các quy tắc.',
        hierarchyLevels: ['Khẩu hiệu chính: AN TOÀN GIAO THÔNG CỔNG TRƯỜNG', 'Thông điệp phụ: Vì nụ cười tương lai của em', 'Quy tắc vàng: 3 gạch đầu dòng ghi chú'],
      };
    }

    // 4. Kể chuyện đôi bạn cùng tiến / Đạo đức học sinh
    if (text.includes('đôi bạn') || text.includes('cùng tiến') || text.includes('giúp đỡ') || text.includes('bạn cùng bàn')) {
      return {
        form: 'Cấu trúc truyện tranh 3 phân cảnh điện ảnh (3-Panel Cinematic Strip) từ trái sang phải với đường phân khung mềm mại, chuyển tiếp cảm xúc mạch lạc.',
        details: [
          'Khung 1 (Khởi nguồn): Giờ tự học trên lớp, bạn học sinh băn khoăn trước bài toán khó với đôi mắt suy tư',
          'Khung 2 (Tương trợ): Bạn cùng bàn nghiêng người ân cần, ngón tay chỉ vào trang vở hướng dẫn từng bước chi tiết',
          'Khung 3 (Tiến bộ): Cả hai bạn cùng rạng rỡ tươi cười khi tìm ra đáp án đúng, được cô giáo khen ngợi hoa điểm mười',
        ],
        layoutRefinement: 'Bố cục 3 khung chữ nhật liền kề ngang (hoặc dọc nếu tỷ lệ đứng), mỗi khung mang tông màu tươi sáng, có khung thoại phụ nếu cần.',
        hierarchyLevels: ['Tiêu đề truyện: ĐÔI BẠN CÙNG TIẾN', 'Nhãn 3 khung cảnh: Khung 1 - Thử thách, Khung 2 - Giúp đỡ, Khung 3 - Cùng tiến bộ', 'Bài học: Đoàn kết là sức mạnh'],
      };
    }

    // 5. Cây xanh / Sinh học / Thực vật học
    if (text.includes('cây xanh') || text.includes('quang hợp') || text.includes('thực vật') || text.includes('lá cây')) {
      return {
        form: 'Sơ đồ cắt lớp & dòng năng lượng tự nhiên (Cutaway Energy-Flow Structure) thể hiện sự trao đổi chất của cây xanh với môi trường.',
        details: [
          'Phần lá (Trên cao): Hấp thụ ánh sáng mặt trời vàng óng và khí CO2, giải phóng khí O2 trong lành và hơi nước mát',
          'Phần thân (Trung tâm): Hệ mạch dẫn luân chuyển nước, muối khoáng từ rễ lên và chất hữu cơ nuôi cây',
          'Phần rễ (Dưới đất): Bộ rễ chùm/cọc cắm sâu vào lòng đất màu mỡ hút nước và chất dinh dưỡng',
        ],
        layoutRefinement: 'Bố cục trục dọc tự nhiên theo chiều phát triển của cây từ đất lên trời, có các mũi tên trao đổi khí và nước sinh động.',
        hierarchyLevels: ['Tiêu đề: CẤU TẠO & SỰ QUANG HỢP CỦA CÂY', 'Các bộ phận chính: Lá cây, Thân cây, Rễ cây', 'Ghi chú sinh học: Ánh sáng, Nước, Khí O2, Khí CO2'],
      };
    }

    // 6. Mặc định sư phạm cho các chủ đề khác
    return {
      form: `Cấu trúc trực quan phân tầng sư phạm (Pedagogical Layered Structure) phù hợp thể loại ${presentationType}, làm nổi bật trọng tâm chủ đề.`,
      details: [
        'Tầng 1 (Tiêu đề & Định hướng): Khối thông điệp chính rõ ràng, trang nhã ở phần trên',
        'Tầng 2 (Khối nội dung cốt lõi): Hình ảnh minh họa trực quan sinh động ở trung tâm',
        'Tầng 3 (Tổng kết & Ứng dụng thực tế): Các lưu ý hành động hoặc bài học ý nghĩa ở phần chân trang',
      ],
      layoutRefinement: 'Bố cục cân đối, lớp lang mạch lạc, ưu tiên khoảng trắng thở để học sinh tiếp thu kiến thức tự nhiên không bị quá tải.',
      hierarchyLevels: ['Tiêu đề bài học lớn', 'Khối minh họa trung tâm', 'Lưu ý ghi nhớ chân trang'],
    };
  }

  /**
   * Tinh chỉnh chữ trong hình theo từng chủ đề bài học cụ thể
   */
  public static inferThematicTexts(
    prompt: string,
    intent: VisualIntent,
    initialStrings: string[] = []
  ): {
    exactStrings: string[];
    textHierarchy: string[];
    fontNotes: string;
  } {
    const list = [...initialStrings];

    // Trích xuất các chuỗi nằm trong dấu ngoặc kép "..."
    const quotedMatches = prompt.match(/"([^"]+)"|“([^”]+)”|'([^']+)'/g);
    if (quotedMatches) {
      quotedMatches.forEach((m) => {
        const clean = m.replace(/["“”']/g, '').trim();
        if (clean && !list.includes(clean)) {
          list.push(clean);
        }
      });
    }

    const text = prompt.toLowerCase();

    // 1. Chủ đề: Vòng tuần hoàn của nước
    if (text.includes('vòng tuần hoàn của nước') || text.includes('vòng tuần hoàn nước') || (text.includes('nước') && text.includes('bốc hơi'))) {
      if (list.length === 0) {
        list.push(
          'VÒNG TUẦN HOÀN CỦA NƯỚC',
          '1. Bốc hơi',
          '2. Ngưng tụ',
          '3. Mưa',
          '4. Thu gom'
        );
      }
      return {
        exactStrings: list,
        textHierarchy: [
          'Tiêu đề chính: "VÒNG TUẦN HOÀN CỦA NƯỚC" (Font to đậm, nổi bật trên nền)',
          'Nhãn 4 bước: "1. Bốc hơi", "2. Ngưng tụ", "3. Mưa", "4. Thu gom" (Font rõ ràng, gắn kèm mũi tên)',
          'Ghi chú bổ trợ: Dòng chảy tự nhiên',
        ],
        fontNotes: 'Font không chân Be Vietnam Pro / Inter nét dày khỏe, màu chữ xanh thẫm (#0c4a6e) hoặc trắng tương phản cao, 100% tiếng Việt có dấu thanh chuẩn mực.',
      };
    }

    // 2. Chủ đề: Quy trình rửa tay
    if (text.includes('rửa tay') || text.includes('vệ sinh tay')) {
      if (list.length === 0) {
        list.push(
          'QUY TRÌNH RỬA TAY SẠCH KHUẨN',
          'Bước 1: Làm ướt & Xà phòng',
          'Bước 2: Mu bàn tay & Kẽ ngón',
          'Bước 3: Miết kẽ ngón tay',
          'Bước 4: Mặt ngoài ngón tay',
          'Bước 5: Xoay ngón tay cái',
          'Bước 6: Đầu ngón tay & Xả sạch',
          'Đôi tay sạch - Sức khỏe vàng'
        );
      }
      return {
        exactStrings: list,
        textHierarchy: [
          'Tiêu đề lớn trên cùng: "QUY TRÌNH RỬA TAY SẠCH KHUẨN"',
          'Nhãn 6 bước: "Bước 1" đến "Bước 6" kèm hành động tương ứng',
          'Khẩu hiệu chân trang: "Đôi tay sạch - Sức khỏe vàng"',
        ],
        fontNotes: 'Font chữ y tế học đường thân thiện, bo góc nhẹ, số thứ tự bước đặt trong vòng tròn màu xanh lá y tế (#059669), đầy đủ dấu thanh tiếng Việt.',
      };
    }

    // 3. Chủ đề: An toàn giao thông
    if (text.includes('an toàn giao thông') || text.includes('cổng trường') || text.includes('đội mũ')) {
      if (list.length === 0) {
        list.push(
          'CỔNG TRƯỜNG AN TOÀN GIAO THÔNG',
          'Đội mũ bảo hiểm khi ngồi xe máy',
          'Đi bộ trên vỉa hè, qua đường đúng vạch',
          'Dừng lại quan sát khi gặp đèn đỏ',
          'An toàn đến trường - Vững bước tương lai'
        );
      }
      return {
        exactStrings: list,
        textHierarchy: [
          'Khẩu hiệu áp phích: "CỔNG TRƯỜNG AN TOÀN GIAO THÔNG" (Font in hoa, viền vàng nổi bật)',
          'Checklist 3 quy tắc vàng: Gạch đầu dòng rõ ràng bên cạnh nhân vật',
          'Thông điệp khích lệ: "An toàn đến trường - Vững bước tương lai"',
        ],
        fontNotes: 'Font chữ tuyên truyền mạnh mẽ, rõ ràng, nét dày, màu chữ đỏ cờ (#dc2626) hoặc vàng kim (#d97706) trên nền sáng, tôn vinh văn hóa học đường.',
      };
    }

    // 4. Chủ đề: Đôi bạn cùng tiến / Đạo đức
    if (text.includes('đôi bạn') || text.includes('cùng tiến') || text.includes('giúp đỡ')) {
      if (list.length === 0) {
        list.push(
          'ĐÔI BẠN CÙNG TIẾN',
          'Khung 1: Bài toán khó',
          'Khung 2: Cùng nhau thảo luận',
          'Khung 3: Niềm vui tiến bộ',
          'Học thầy không tày học bạn'
        );
      }
      return {
        exactStrings: list,
        textHierarchy: [
          'Tiêu đề câu chuyện: "ĐÔI BẠN CÙNG TIẾN"',
          'Phụ đề 3 khung cảnh: "Khung 1: Bài toán khó" -> "Khung 2: Cùng nhau thảo luận" -> "Khung 3: Niềm vui tiến bộ"',
          'Châm ngôn học đường: "Học thầy không tày học bạn"',
        ],
        fontNotes: 'Font chữ kể chuyện mềm mại, gần gũi, nét chữ tròn trịa như nét chữ học sinh tiểu học, màu xanh dương ấm áp (#1d4ed8).',
      };
    }

    // 5. Chủ đề: Cây xanh / Quang hợp
    if (text.includes('cây xanh') || text.includes('quang hợp') || text.includes('thực vật')) {
      if (list.length === 0) {
        list.push(
          'CẤU TẠO VÀ SỰ QUANG HỢP CỦA CÂY',
          'Lá cây: Hấp thụ CO2 & Nhả O2',
          'Thân cây: Dẫn truyền nước & Khoáng',
          'Rễ cây: Hút nước & Giữ đất',
          'Ánh sáng mặt trời',
          'Khí O2 trong lành'
        );
      }
      return {
        exactStrings: list,
        textHierarchy: [
          'Tiêu đề bài học: "CẤU TẠO VÀ SỰ QUANG HỢP CỦA CÂY"',
          'Nhãn 3 phần chính: Lá cây, Thân cây, Rễ cây',
          'Nhãn chất trao đổi: CO2, O2, Ánh sáng mặt trời, Nước & Khoáng',
        ],
        fontNotes: 'Font chữ khoa học thường thức trong sáng, sạch sẽ, màu xanh lá cây (#15803d) và màu lam ngọc (#0e7490), không dùng font chữ cách điệu gây rối mắt.',
      };
    }

    // Mặc định: Trích xuất hoặc đặt tiêu đề thông minh theo chủ đề của giáo viên
    if (list.length === 0) {
      const title = prompt.length > 35 ? prompt.slice(0, 35).trim() + '...' : prompt.trim();
      list.push(title.toUpperCase(), 'Minh họa học đường', 'Kiến thức bổ ích');
    }

    return {
      exactStrings: list,
      textHierarchy: [
        `Tiêu đề bài giảng: "${list[0]}"`,
        'Các nhãn phân mục nội dung',
        'Ghi chú bổ trợ chân trang',
      ],
      fontNotes: 'Font chữ sans-serif chuẩn mực tiếng Việt (Be Vietnam Pro / Inter), nét vẽ rõ ràng, dấu thanh chính xác 100%, kích thước tương phản tốt.',
    };
  }

  /**
   * Suy luận Logic Trình bày (Presentation Type & Layout Strategy)
   */
  public static inferLogicalPresentation(
    prompt: string,
    audience: string,
    presentationType?: string
  ): {
    presentation: string;
    layout: string;
    focalPoint: string;
    readingOrder: string[];
    actionFlow: string;
  } {
    const text = (prompt + ' ' + (presentationType || '')).toLowerCase();
    const aud = audience.toLowerCase();
    const isYounger = aud.includes('lớp 1') || aud.includes('lớp 2') || aud.includes('mầm non');

    // 1. Process / Cycle / Steps
    if (text.includes('quy trình') || text.includes('chu trình') || text.includes('vòng tuần hoàn') || text.includes('rửa tay') || text.includes('bước')) {
      return {
        presentation: presentationType || 'Infographic quy trình tuần tự các bước (Step-by-step Process)',
        layout: 'Bố cục chu trình khép kín hoặc đường dẫn tiến trình ziczac tuần tự, mũi tên điều hướng mềm mại rõ ràng theo chiều kim đồng hồ.',
        focalPoint: 'Tâm điểm chu trình và biểu tượng minh họa bước đầu tiên.',
        readingOrder: [
          'Tiêu đề chính trên cùng',
          'Bước 1: Khởi đầu hành động',
          'Bước 2 & 3: Diễn tiến thực hiện',
          'Bước cuối: Hoàn thành & Kết quả sạch sẽ, an toàn',
        ],
        actionFlow: 'Các hành động nối tiếp nhau theo quy luật nhân quả, bàn tay hoặc nhân vật thao tác đúng tư thế mẫu mực.',
      };
    }

    // 2. Poster / Campaign / Awareness
    if (text.includes('poster') || text.includes('áp phích') || text.includes('tuyên truyền') || text.includes('cổ động') || text.includes('an toàn giao thông') || text.includes('phòng chống')) {
      return {
        presentation: presentationType || 'Poster sư phạm tuyên truyền trực quan (Educational Campaign Poster)',
        layout: 'Bố cục áp phích hiện đại: Khối tiêu đề lớn trên cùng, hình tượng học sinh hành động mẫu mực ở trung tâm, dải ghi chú hành động cụ thể ở phần dưới.',
        focalPoint: 'Nhân vật học sinh thực hiện hành vi đúng (đội mũ bảo hiểm, xếp hàng, chào thầy cô) với nụ cười tự tin.',
        readingOrder: [
          'Khẩu hiệu thông điệp chính nổi bật',
          'Hình ảnh nhân vật hành động trung tâm',
          'Các lưu ý quy tắc nhỏ bên cạnh',
          'Logo biểu tượng trường học & văn hóa học đường',
        ],
        actionFlow: 'Hành động tích cực, khích lệ tự giác, tư thế đứng/ngồi đoan trang, thể hiện tinh thần trách nhiệm.',
      };
    }

    // 3. Comic / 3-panel Story
    if (text.includes('truyện') || text.includes('kể chuyện') || text.includes('3 khung') || text.includes('3 phần') || text.includes('đôi bạn')) {
      return {
        presentation: presentationType || 'Truyện tranh 3 phân cảnh học đường (3-Panel Educational Narrative)',
        layout: 'Bố cục 3 khung hình chữ nhật liền kề cân xứng từ trái qua phải (hoặc từ trên xuống dưới nếu khung dọc): Khung 1 (Tình huống khởi đầu) -> Khung 2 (Hành động giúp đỡ / giải quyết) -> Khung 3 (Niềm vui và kết quả nhân văn).',
        focalPoint: 'Khung 2 và Khung 3: Khoảnh khắc tương tác ấm áp giữa các bạn học sinh.',
        readingOrder: [
          'Khung 1: Bối cảnh ban đầu',
          'Khung 2: Hành động tương trợ',
          'Khung 3: Nụ cười và bài học rút ra',
        ],
        actionFlow: 'Chuyển động nhân vật tự nhiên, biểu cảm gương mặt chuyển từ lo lắng/băn khoăn sang thấu hiểu và hạnh phúc.',
      };
    }

    // 4. Botanical / Nature / Scrapbook
    if (text.includes('thực vật') || text.includes('lá cây') || text.includes('hoa') || text.includes('sinh thái') || text.includes('scrapbook') || text.includes('sổ tay')) {
      return {
        presentation: presentationType || 'Sổ tay thực vật dã ngoại thủ công (Botanical Scrapbook Journal)',
        layout: 'Bố cục sổ tay thủ công: Mẫu thực vật tiêu bản ở trung tâm ép nổi, các thẻ ghi chú giấy kraft xung quanh chỉ dẫn gân lá, màu sắc, đặc tính sinh thái.',
        focalPoint: 'Mẫu vật cành lá / hoa tươi với chi tiết chân thực, sắc nét từng đường gân.',
        readingOrder: [
          'Tên loài cây/hoa trên thẻ nhãn thủ công',
          'Mẫu vật thực vật trung tâm',
          'Ghi chú cấu tạo (rễ, thân, lá, hoa)',
          'Hình vẽ ký họa phóng to chi tiết',
        ],
        actionFlow: 'Mô phỏng bàn tay học sinh đặt thước đo hoặc kính lúp quan sát khoa học cẩn trọng.',
      };
    }

    // 5. Default Educational Illustration
    return {
      presentation: presentationType || (isYounger ? 'Tranh minh họa sư phạm ngộ nghĩnh, nét to rõ ràng' : 'Tranh minh họa sư phạm hiện đại, bố cục cân đối'),
      layout: 'Bố cục trung tâm với không gian thoáng đãng (Generous Negative Space), chủ thể chính ở giữa, tiền cảnh và hậu cảnh phân tầng lớp lang rõ rệt.',
      focalPoint: 'Chủ thể chính của bài học hoặc nhóm học sinh đang tích cực tham gia hoạt động.',
      readingOrder: [
        'Tiêu đề / Ý niệm cốt lõi',
        'Chủ thể hành động trung tâm',
        'Các chi tiết học đường hoặc thiên nhiên xung quanh',
      ],
      actionFlow: 'Tương tác học đường thân thiện, trang nhã, đúng mực giữa thầy - trò và bạn bè đồng trang lứa.',
    };
  }

  /**
   * Suy luận Chuẩn mực Văn hóa Học đường Việt Nam (Cultural Context Engine)
   */
  public static inferCulturalContext(prompt: string, audience: string): {
    culturalRules: string[];
    costumeAndProps: string;
    settingEnvironment: string;
  } {
    const text = prompt.toLowerCase();
    const aud = audience.toLowerCase();
    const isPrimary = aud.includes('tiểu học') || aud.includes('lớp 1') || aud.includes('lớp 2') || aud.includes('lớp 3') || aud.includes('lớp 4') || aud.includes('lớp 5');

    const rules = [
      'Trang phục học sinh Việt Nam chuẩn mực: Áo sơ mi trắng tinh tươm, quần tây sẫm màu / váy học sinh xếp ly qua gối, quàng khăn đỏ Đội Thiếu niên Tiền phong Hồ Chí Minh đúng quy cách (với học sinh từ Lớp 3 trở lên).',
      'Thầy cô giáo trang nhã: Cô giáo mặc áo dài truyền thống thướt tha thanh lịch hoặc âu phục công sở chuẩn mực nhà giáo; thầy giáo mặc sơ mi gọn gàng, gương mặt hiền từ, ân cần.',
      'Hành vi văn hóa tôn sư trọng đạo: Học sinh khoanh tay chào lễ phép khi gặp thầy cô, lắng nghe chăm chú, bạn bè đoàn kết giúp đỡ nhau chan hòa.',
      'Không gian học đường thân thuộc: Lớp học có Quốc kỳ, ảnh Bác Hồ phía trên bảng đen xanh thân quen, góc thư viện 5 Điều Bác Hồ Dạy, cây bàng, cây phượng vĩ râm mát trên sân trường lót gạch đỏ.',
      'Khóa 100% ngữ pháp và chính tả tiếng Việt có dấu: Tôn trọng dấu thanh (sắc, huyền, hỏi, ngã, nặng), không viết sai chính tả, không dùng chữ ký tự giả tạo vô nghĩa.',
    ];

    if (text.includes('an toàn giao thông') || text.includes('cổng trường')) {
      rules.push('Cổng trường an toàn: Học sinh đội mũ bảo hiểm cài quai đúng cách khi ngồi sau xe máy của bố mẹ, dắt bộ qua vạch kẻ đường cho người đi bộ, không tụ tập dưới lòng đường.');
    }

    if (text.includes('rửa tay') || text.includes('vệ sinh')) {
      rules.push('Khu vực vệ sinh sạch sẽ: Bồn rửa tay học đường vừa tầm với học sinh tiểu học, vòi nước sạch, xà phòng thơm diệt khuẩn, hình ảnh cổ động giữ gìn vệ sinh chung.');
    }

    const costume = isPrimary
      ? 'Đồng phục tiểu học Việt Nam: Sơ mi trắng cổ bẻ, khăn quàng đỏ thắm bay nhẹ, bảng tên gắn ngực áo, cặp sách quai đeo ngay ngắn, giày quai hậu hoặc bata trắng.'
      : 'Trang phục học đường Việt Nam thanh lịch, nhã nhặn, tôn nghiêm.';

    const setting = text.includes('thiên nhiên') || text.includes('môi trường')
      ? 'Không gian thiên nhiên làng quê hoặc vườn sinh thái trường học Việt Nam xanh mát, có luống rau xanh, rặng tre, ao cá hoặc hàng cây râm mát.'
      : 'Không gian trường tiểu học Việt Nam khang trang, sân trường rợp bóng cây bàng phượng vĩ, khẩu hiệu "Tiên học lễ, Hậu học văn" trang trọng.';

    return {
      culturalRules: rules,
      costumeAndProps: costume,
      settingEnvironment: setting,
    };
  }

  /**
   * Suy luận Logic Hành động (Action Logic Engine)
   */
  public static inferActionLogic(prompt: string, audience: string, intent: VisualIntent): {
    actionDescription: string;
    anatomyPosture: string;
    interactionDynamics: string;
  } {
    const text = prompt.toLowerCase();

    if (text.includes('rửa tay')) {
      return {
        actionDescription: 'Quy trình động tác chuẩn 6 bước của Bộ Y Tế: Bàn tay chà lòng vào lòng, mu bàn tay, miết kẽ ngón tay, xoay ngón cái, chụm đầu ngón tay xoa xoay, và xả sạch dưới vòi nước chảy.',
        anatomyPosture: 'Bàn tay trẻ nhỏ bụ bẫm, các ngón tay tạo hình rõ ràng 5 ngón đầy đủ, không biến dạng, bọt xà phòng trắng mịn tinh nghịch.',
        interactionDynamics: 'Ánh mắt vui tươi, chăm chú làm theo từng bước, gương mặt rạng rỡ biểu lộ niềm vui khi giữ gìn đôi tay sạch.',
      };
    }

    if (text.includes('an toàn giao thông') || text.includes('đội mũ')) {
      return {
        actionDescription: 'Học sinh hai tay kéo dây quai mũ bảo hiểm và bấm khóa "tách" cẩn thận; em học sinh khác giơ tay xin đường khi qua vạch kẻ dành cho người đi bộ.',
        anatomyPosture: 'Dáng đứng thẳng tự tin, lưng ngay ngắn, hai tay thao tác dứt khoát chuẩn xác, mũ bảo hiểm ôm khít đầu vừa vặn.',
        interactionDynamics: 'Phụ huynh ân cần mỉm cười gật đầu khích lệ con, các bạn cùng lớp đi thành hàng lối trật tự văn minh.',
      };
    }

    if (text.includes('vòng tuần hoàn') || text.includes('nước')) {
      return {
        actionDescription: 'Hạt nước tinh nghịch bốc hơi bay lên theo những làn sóng uốn lượn mềm mại, ngưng tụ thành từng đám mây bồng bềnh, rơi xuống thành mưa rào tưới mát ruộng đồng, rồi chảy về sông hồ biển lớn.',
        anatomyPosture: 'Hình tượng giọt nước nhân hóa có đôi mắt to tròn, nụ cười rạng rỡ, tay cầm các biểu tượng chỉ dẫn luân chuyển sinh động.',
        interactionDynamics: 'Mũi tên điều hướng dòng chảy uốn lượn liên tục 360 độ tạo sự logic chặt chẽ của định luật bảo toàn tự nhiên.',
      };
    }

    if (text.includes('giúp đỡ') || text.includes('đôi bạn') || text.includes('học tập')) {
      return {
        actionDescription: 'Bạn học sinh nghiêng người chỉ tay vào trang sách giải thích bài toán khó cho bạn cùng bàn; bạn được giúp đỡ chăm chú gật đầu lắng nghe và tự tay viết lời giải.',
        anatomyPosture: 'Tư thế ngồi học chuẩn công thái học: Lưng thẳng, ngực không tì vào bàn, khoảng cách mắt tới vở 25-30cm, tay cầm bút đúng chuẩn 3 ngón tay.',
        interactionDynamics: 'Giao tiếp ánh mắt ấm áp, chân thành, nụ cười sẻ chia lan tỏa tinh thần "Đôi bạn cùng tiến" đẹp đẽ của tuổi học trò.',
      };
    }

    // Default action logic
    return {
      actionDescription: 'Nhân vật tham gia hoạt động học tập tích cực, thao tác đồ dùng học tập hoặc tương tác với bạn bè tự nhiên, sinh động.',
      anatomyPosture: 'Giải phẫu cơ thể chuẩn mực lứa tuổi thiếu nhi: Tỷ lệ đầu - thân cân đối (khoảng 1:5 hoặc 1:6 đối với học sinh tiểu học), ngón tay ngón chân đầy đủ, cử chỉ mềm mại, không cứng nhắc.',
      interactionDynamics: 'Không khí lớp học rộn ràng, giàu tính kết nối và tràn đầy năng lượng tích cực.',
    };
  }

  /**
   * Trích xuất danh sách chuỗi chữ tiếng Việt chính xác (tương thích backward)
   */
  public static extractExactStrings(prompt: string, initialStrings: string[] = []): string[] {
    const thematic = this.inferThematicTexts(prompt, 'ILLUSTRATION', initialStrings);
    return thematic.exactStrings;
  }

  /**
   * Xây dựng VisualBrief hoàn chỉnh theo tư duy Visual Designer
   * Tự động dung hợp: LOGIC THỊ GIÁC + VĂN HÓA HỌC ĐƯỜNG VIỆT NAM + LOGIC HÀNH ĐỘNG
   * ĐẶC BIỆT TINH CHỈNH: CẤU TRÚC CHÍNH & CHỮ TRONG HÌNH THEO TỪNG CHỦ ĐỀ
   */
  public static build(params: VisualBriefBuilderParams): VisualBrief {
    const intent = params.editContext?.isEdit ? 'EDIT_IMAGE' : this.classifyIntent(params.userPrompt, params.presentationType);
    const audience = params.targetAudience || 'Học sinh tiểu học Việt Nam (Lớp 1 đến Lớp 5)';
    const subject = params.userPrompt.trim() || 'Minh họa sư phạm học đường';
    const aspectRatio = params.aspectRatio || '16:9';

    // 1. Logic Trình bày (Presentation Logic)
    const presentationLogic = this.inferLogicalPresentation(params.userPrompt, audience, params.presentationType);

    // 2. Tinh chỉnh Cấu trúc chính theo chủ đề (Thematic Primary Structure)
    const thematicStructure = this.inferThematicStructure(params.userPrompt, intent, presentationLogic.presentation);
    const layout = params.compositionLayout || `${presentationLogic.layout} · ${thematicStructure.layoutRefinement}`;
    const focalPoint = params.focalPoint || presentationLogic.focalPoint;
    const readingOrder = presentationLogic.readingOrder;

    // 3. Tinh chỉnh Chữ trong hình theo chủ đề (Thematic Texts & Typography Hierarchy)
    const thematicText = this.inferThematicTexts(params.userPrompt, intent, params.exactStrings || []);
    const exactStrings = thematicText.exactStrings;
    const textEnabled = params.hasText !== undefined ? params.hasText : exactStrings.length > 0;

    // 4. Văn hóa Học đường Việt Nam (Cultural Context)
    const culturalContext = this.inferCulturalContext(params.userPrompt, audience);

    // 5. Logic Hành động & Giải phẫu (Action Logic)
    const actionLogic = this.inferActionLogic(params.userPrompt, audience, intent);

    // 6. Palette & Style
    const palette = params.customPalette || ['#0284c7', '#059669', '#f59e0b', '#f8fafc', '#1e293b'];
    const medium = params.styleMedium || 'Minh họa phẳng giáo dục hiện đại (Modern Educational Flat Illustration)';

    // 7. Quy tắc cấm & bảo tồn mở rộng
    const prohibitedElements = params.prohibitedElements || [
      'watermark',
      'logo thương mại lạ',
      'chữ tiếng Anh vô nghĩa',
      'chữ biến dạng méo mó',
      'chi tiết bạo lực, phản cảm hoặc gây sợ hãi cho trẻ em',
      'sai lệch kiến thức khoa học hoặc sai tư thế ngồi/thao tác',
      'bàn tay thiếu/thừa ngón, giải phẫu méo mó',
      'trang phục hở hang hoặc sai chuẩn mực tác phong học sinh/giáo viên Việt Nam',
    ];

    const preservationRules = params.preservationRules || [
      ...culturalContext.culturalRules,
      `Cấu trúc chính theo chủ đề: ${thematicStructure.form}`,
      `Logic hành động: ${actionLogic.actionDescription}`,
      `Quy chuẩn giải phẫu: ${actionLogic.anatomyPosture}`,
      'Giữ sự trong sáng, chuẩn mực văn hóa học đường Việt Nam',
      'Hình ảnh rõ ràng, sắc nét, thân thiện và giàu tính giáo dục',
      'Đảm bảo thứ tự logic khoa học của các bước',
    ];

    return {
      intent,
      subject,
      audience,
      purpose: `Giảng dạy, truyền thông và sinh hoạt lớp học sinh động cho: ${subject}`,
      presentationType: presentationLogic.presentation,
      aspectRatio,
      background: culturalContext.settingEnvironment,
      composition: {
        layout,
        focalPoint,
        readingOrder,
      },
      foreground: params.foreground || [
        'Các chi tiết tiền cảnh thanh thoát, trang phục chỉn chu (' + culturalContext.costumeAndProps + '), không che khuất trọng tâm',
      ],
      center: params.center || [
        `${subject} - Hành động: ${actionLogic.actionDescription}. Tương tác: ${actionLogic.interactionDynamics}`,
      ],
      backgroundElements: params.backgroundElements || [
        culturalContext.settingEnvironment,
        'Cây bàng, phượng vĩ, ánh nắng dịu mát, không gian sư phạm Việt Nam ấm áp',
      ],
      primaryStructure: {
        form: thematicStructure.form,
        details: thematicStructure.details,
      },
      flankingElements: ['Họa tiết học đường, cờ nheo, hoa điểm tốt, ngôi sao nhỏ tạo sự tươi vui'],
      text: {
        enabled: textEnabled,
        exactStrings,
        hierarchy: thematicText.textHierarchy,
        fontPreference: thematicText.fontNotes,
      },
      style: {
        medium,
        visualCharacter: 'Thân thiện, trong sáng, tích cực, truyền cảm hứng học tập theo thuần phong mỹ tục Việt Nam',
        linework: 'Nét vẽ sắc nét, mềm mại, viền gọn gàng, bàn tay chuẩn xác 5 ngón',
        shading: 'Đổ bóng nhẹ tinh tế, tương phản vừa phải tạo độ sâu ấm áp',
        colorPalette: palette,
      },
      preservationRules,
      prohibitedElements,
      editContext: params.editContext,
    };
  }
}

/**
 * Prompt Compiler chính - chuyển VisualBrief thành CompiledImagePrompt cho từng Model Engine
 */
export class PromptCompiler {
  public static compile(brief: VisualBrief, engine: ImageEngine = 'banana-2'): CompiledImagePrompt {
    if (engine === 'gpt-image') {
      return GptImagePromptAdapter.compile(brief);
    }
    // Default: Google Nano Banana (banana-2 or banana-pro)
    return BananaPromptAdapter.compile(brief, engine);
  }
}

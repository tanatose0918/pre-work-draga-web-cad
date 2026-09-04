export default {
  app: {
    title: 'DRAGA 2D BLUEPRINT CAD',
    subtitle: 'ระบบบูรณาการพลังงานความร้อน AI Data Center และ Ammonia ORC',
    versionTag: 'Interactive SVG v1.0',
    viewport: 'มุมมองทางวิศวกรรม: 1920x1080',
    zoom: 'ซูม',
    pan: 'เลื่อน',
    resetView: 'รีเซ็ตมุมมอง',
    cadSymbols: 'สัญลักษณ์ CAD',
    cadLayers: 'เลเยอร์ CAD',
    simulationActive: 'จำลองการทำงาน: กำลังรัน',
    simulationPaused: 'จำลองการทำงาน: หยุดชั่วคราว',
    operatorControls: 'แผงควบคุมผู้ปฏิบัติการ',
    zones: 'โซนพื้นที่'
  },
  kpis: {
    totalItLoad: 'ภาระโหลดไอทีรวม',
    orcPowerGen: 'กำลังไฟฟ้าผลิตจาก ORC',
    hotReturnRiser: 'ท่อรวมน้ำร้อนกลับ (RISER)',
    chwFlowRate: 'อัตราไหลน้ำเย็น (CHW)'
  },
  layers: {
    title: 'เลเยอร์พิมพ์เขียว (CAD)',
    grid: 'ตารางพิกัด (Grid)',
    centralRisers: 'ท่อส่งหลักแนวตั้ง (DN250)',
    rooftopOrc: 'ลูปความร้อนดาดฟ้า (ORC)',
    floors: 'โซน AI เซิร์ฟเวอร์ ชั้น 1 - 4',
    groundBasin: 'บ่อพักน้ำ & ปั๊มหลักชั้นล่าง',
    flowAnimations: 'แอนิเมชันการไหลของของไหล',
    telemetryLabels: 'ป้ายแสดงค่าโทรมาตร'
  },
  zones: {
    rooftop: 'ดาดฟ้า ORC (เครื่องแลกเปลี่ยน/กังหัน)',
    floor4: 'ชั้น 4 คลัสเตอร์ AI',
    floor3: 'ชั้น 3 คลัสเตอร์ AI',
    floor2: 'ชั้น 2 คลัสเตอร์ AI',
    floor1: 'ชั้น 1 คลัสเตอร์ AI',
    groundBasin: 'ชั้นล่าง บ่อบำบัดน้ำ & ปั๊มหลัก'
  },
  drawer: {
    liveSensorFeed: 'สัญญาณเซนเซอร์ Real-time',
    engineeringSpecs: 'สเปกทางวิศวกรรม',
    faultAnomaly: '⚠️ จำลองสถานะความผิดปกติ (Fault)',
    resetStatus: 'รับทราบ / รีเซ็ตสถานะปกติ',
    streaming: 'สตรีมมิ่ง 1Hz',
    nominal: 'ค่าพิกัด',
    warn: 'เตือน',
    zone: 'โซน',
    anchor: 'พิกัดอ้างอิง (X, Y)',
    floorZone: 'โซนชั้นอาคาร'
  },
  operator: {
    title: 'ระบบโทรมาตรและสั่งการสองทาง',
    sub: 'Fastify WebSocket (บรอดแคสต์ทุก 500ms)',
    computeLoad: 'ภาระโหลดประมวลผล AI Cluster',
    pumpSpeed: 'ความเร็วรอบปั๊มน้ำเย็นหลัก (P-101)',
    fcvValves: 'วาล์วปรับอัตราการไหลประจำชั้น (FCV)',
    idle: 'สแตนด์บาย (10%)',
    nominalLoad: 'พิกัดปกติ (80%)',
    peak: 'สูงสุด (100%)',
    facility: 'โรงงาน',
    seq: 'ลำดับชุดข้อมูล'
  },
  symbols: {
    title: 'คลังสัญลักษณ์และ GLYPH มาตรฐาน ISA-5.1',
    subtitle: 'สัญลักษณ์มาตรฐานทางวิศวกรรมสำหรับ 2D P&ID Digital Twin',
    close: '✕ ปิด',
    standardsNote: 'มาตรฐาน ANSI/ISA-5.1-2009 และ DEXPI Plant Topology',
    dragaLibrary: 'DRAGA High-Density AI CAD Library'
  }
};

import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workbookDirectory = path.join(root, 'TKB');
const dataDirectory = path.join(root, 'src/data');
const actualDataPath = path.join(root, 'src/data/dbkActualData.ts');
const aliasSourcePath = path.join(root, 'parse_pdf_data.py');
const registryPath = path.join(dataDirectory, 'dbkWeeklyScheduleData.ts');
const termId = 'HK1_2026_2027';
const options = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=');
  return [key, value.join('=')];
}));
const weekNumber = Number(options.week || 4);
const sourceDate = options.date || (weekNumber === 4 ? '2026-09-28' : '');
const workbookNames = [
  options.morning || 'TKB 28.09.2026 SÁNG.xlsx',
  options.afternoon || 'TKB 28.09.2026 CHIỀU.xlsx',
];
const outputPath = path.join(dataDirectory, weekNumber === 4 ? 'dbkWeek4Data.json' : `dbkWeek${weekNumber}Data.json`);

const normalize = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[đĐ]/g, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '');

const actualData = fs.readFileSync(actualDataPath, 'utf8');
const classes = new Map();
for (const match of actualData.matchAll(
  /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*grade:\s*(\d+),\s*gradeLevel:\s*'([^']+)',\s*campusId:\s*'([^']+)',\s*shift:\s*'([^']+)'/g
)) {
  classes.set(match[2], {
    id: match[1],
    name: match[2],
    grade: Number(match[3]),
    gradeLevel: match[4],
    campusId: match[5],
    shift: match[6],
  });
}

const teachers = new Map();
for (const match of actualData.matchAll(
  /id:\s*'([^']+)',\s*code:\s*'([^']+)',\s*fullName:\s*'([^']+)'/g
)) {
  teachers.set(match[1], { id: match[1], code: match[2], fullName: match[3] });
}

const subjects = new Map();
for (const match of actualData.matchAll(
  /id:\s*'([^']+)',\s*code:\s*'[^']+',\s*name:\s*'([^']+)'/g
)) {
  subjects.set(match[1], { id: match[1], name: match[2] });
}

const subjectIds = new Map([
  ['amnhac', 'sub_amnhac'],
  ['chaoco', 'sub_chao_co'],
  ['congnghe', 'sub_cn'],
  ['dialy', 'sub_dia'],
  ['diali', 'sub_dia'],
  ['gdcd', 'sub_gdcd'],
  ['gdktpl', 'sub_gdktpl'],
  ['gdqpan', 'sub_gdqp'],
  ['gdtc', 'sub_gdtc'],
  ['hoahoc', 'sub_hoa'],
  ['hdt nhn', 'sub_hdtn_lop'],
  ['hdt nhncd', 'sub_hdtn_cd'],
  ['hdt nhnshl', 'sub_hdtn_lop'],
  ['khtn', 'sub_khtn'],
  ['lichsu', 'sub_su'],
  ['lichsuvadialy', 'sub_lsdl'],
  ['mythuat', 'sub_mythuat'],
  ['ngoaingu', 'sub_anh'],
  ['nguvan', 'sub_van'],
  ['shl', 'sub_shl'],
  ['sinhhoc', 'sub_sinh'],
  ['tinhoc', 'sub_tin'],
  ['toan', 'sub_toan'],
  ['vatli', 'sub_ly'],
]);

const aliases = {};
const aliasSource = fs.readFileSync(aliasSourcePath, 'utf8');
for (const match of aliasSource.matchAll(/'([^']+)':\s*'([^']+)'/g)) {
  aliases[match[1]] = match[2];
}
Object.assign(aliases, {
  'Thị Hiếu': 'gv_nguyen_thi_hieu',
  'Vi': 'gv_nguyen_hien_vi',
  'Tuyền': 'gv_le_thi_ngoc_tuyen',
  'Phượng': 'gv_nguyen_thi_bich_phuong',
  'Văn Tài': 'gv_nguyen_van_tai',
  'Diễm': 'gv_le_thi_thu_diem',
});

function getSubjectId(label, className) {
  const key = normalize(label);
  if (key === 'hdtnhn' || key === 'hdtnhnshl') {
    return Number(className.slice(0, 2)) >= 10 ? 'sub_hdtn_cd' : 'sub_hdtn_lop';
  }
  if (key === 'hdtnhncd') return 'sub_hdtn_cd';
  const subjectId = subjectIds.get(key);
  if (!subjectId) throw new Error(`Không ánh xạ được môn học: ${label}`);
  return subjectId;
}

function getTeacherId(alias, subjectLabel, className) {
  const subject = normalize(subjectLabel);
  if (alias === 'Hiếu' && subject === 'tinhoc') return 'gv_nguyen_trung_hieu';
  if (alias === 'Thảo' && subject === 'ngoaingu') return 'gv_ho_mai_thao';
  if (alias === 'Thảo' && className === '9A5' && ['chaoco', 'shl', 'hdtnhnshl', 'hdtnhn'].includes(subject)) {
    return 'gv_ho_mai_thao';
  }
  if (alias === 'Phương') {
    const isTrankimPhuongAssignment = className === '7A7' ||
      (['7A8', '7A9'].includes(className) && subject === 'khtn');
    return isTrankimPhuongAssignment ? 'gv_tran_kim_phuong' : 'gv_le_thai_phuong';
  }
  if (alias === 'Thị Hậu' && className === '8A4' && subject === 'vatli') return 'gv_nguyen_thi_tham';
  if (alias === 'Hậu') {
    if (subject === 'tinhoc') return 'gv_le_phuoc_hau';
    if (subject === 'ngoaingu') return 'gv_tran_thanh_hau';
  }
  if (alias === 'Ngân' && subject === 'gdtc') return 'gv_ho_hoai_ngan';
  if (alias === 'Văn' && subject === 'hoahoc') return 'gv_vo_ngoc_dinh_van';
  if (alias === 'Quốc') {
    if (subject === 'mythuat') return 'gv_tran_thi_my_quoc';
    if (subject === 'ngoaingu') return 'gv_ngo_bao_quoc';
  }

  const teacherId = aliases[alias];
  if (!teacherId || !teachers.has(teacherId)) {
    throw new Error(`Không ánh xạ được giáo viên "${alias}" (${subjectLabel}, ${className})`);
  }
  return teacherId;
}

const slots = [];
const collisions = new Set();
const sourceAliases = new Set();
const ruleViolations = [];

for (const workbookName of workbookNames) {
  const workbookPath = path.join(workbookDirectory, workbookName);
  const workbook = XLSX.readFile(workbookPath);
  const sheet = workbook.Sheets.DSHS;
  if (!sheet) throw new Error(`Không tìm thấy sheet DSHS trong ${workbookName}`);

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  const classNames = rows[3].slice(3).map((name) => String(name).trim()).filter(Boolean);
  let day = 0;
  let shift = '';

  for (let rowIndex = 4; rowIndex <= 33; rowIndex += 1) {
    const row = rows[rowIndex];
    if (row[0]) day = Number(row[0]);
    if (row[1]) shift = String(row[1]).trim();
    const period = Number(row[2]);
    if (!day || !period || !['S', 'C'].includes(shift)) continue;

    for (let column = 3; column < rows[3].length; column += 1) {
      const value = String(row[column] || '').trim();
      if (!value) continue;

      const className = String(rows[3][column]).trim();
      const classInfo = classes.get(className);
      if (!classInfo) throw new Error(`Không tìm thấy lớp trong danh mục: ${className}`);

      const splitAt = value.lastIndexOf('-');
      if (splitAt < 1) throw new Error(`Ô thời khóa biểu không đúng định dạng: ${value}`);
      const subjectLabel = value.slice(0, splitAt).trim();
      const teacherAlias = value.slice(splitAt + 1).trim();
      const subjectId = getSubjectId(subjectLabel, className);
      const teacherId = getTeacherId(teacherAlias, subjectLabel, className);
      const isMorning = shift === 'S';
      const isOppositeShift = isMorning && classInfo.grade <= 7 && /^(?:6A[1-6]|7A[1-6])$/.test(className);
      const isFlagSalute = subjectId === 'sub_chao_co';
      const isClassMeeting = subjectId === 'sub_shl';
      const subject = subjects.get(subjectId);
      const teacher = teachers.get(teacherId);
      const slotId = `slot_w${weekNumber}_${className.toLowerCase()}_d${day}_p${period}_${shift.toLowerCase()}`;
      const collisionKey = `${classInfo.id}|${day}|${shift}|${period}`;

      if (collisions.has(collisionKey)) throw new Error(`Trùng tiết lớp: ${className}, thứ ${day}, ca ${shift}, tiết ${period}`);
      collisions.add(collisionKey);
      sourceAliases.add(teacherAlias);

      const slot = {
        id: slotId,
        dayOfWeek: day,
        periodNumber: period,
        shift: isMorning ? 'morning' : 'afternoon',
        classId: classInfo.id,
        className,
        subjectId,
        subjectName: subject?.name || subjectLabel,
        teacherId,
        teacherName: teacher.fullName,
        campusId: classInfo.campusId,
        roomId: '',
        weekNumber,
        termId,
        isFlagSalute,
        isClassMeeting,
        isLocked: isFlagSalute || isClassMeeting,
        isOppositeShift,
        note: isOppositeShift ? 'Trái buổi sáng' : undefined,
        sourceWorkbook: workbookName,
        sourceSubjectLabel: subjectLabel,
        sourceTeacherAlias: teacherAlias,
      };

      const isClass7A6 = className === '7A6';
      const isExperientialSubject = subjectId === 'sub_hdtn_cd' || subjectId === 'sub_hdtn_lop';
      const violatesOppositeShiftRule = isClass7A6
        ? (isMorning && !isExperientialSubject) || (subjectId === 'sub_gdtc' && isMorning) || (!isMorning && isExperientialSubject)
        : isOppositeShift && subjectId !== 'sub_gdtc';

      if (violatesOppositeShiftRule) {
        ruleViolations.push({
          className,
          dayOfWeek: day,
          periodNumber: period,
          subjectName: subjectLabel,
          teacherName: teacher.fullName,
          description: isClass7A6
            ? 'Riêng 7A6 học HĐTNHN buổi sáng và GDTC buổi chiều theo quy tắc cứng.'
            : 'Tiết GDTC trái buổi khối 6-7 phải học vào buổi sáng theo quy tắc cứng.',
        });
      }
      slots.push(slot);
    }
  }
}

const assignmentMap = new Map();
for (const slot of slots) {
  const key = [slot.classId, slot.subjectId, slot.teacherId].join('|');
  const assignment = assignmentMap.get(key) || {
    id: `pcgd_w${weekNumber}_${slot.classId}_${slot.subjectId}_${slot.teacherId}`,
    teacherId: slot.teacherId,
    teacherName: slot.teacherName,
    classId: slot.classId,
    className: slot.className,
    subjectId: slot.subjectId,
    subjectName: slot.subjectName,
    weeklyPeriods: 0,
    campusId: slot.campusId,
    grade: classes.get(slot.className).grade,
    gradeLevel: classes.get(slot.className).gradeLevel,
    subComponentName: slot.sourceSubjectLabel,
    termId,
  };
  assignment.weeklyPeriods += 1;
  assignmentMap.set(key, assignment);
}

if (weekNumber === 4 && slots.length !== 1538) throw new Error(`Tổng slot không khớp: ${slots.length}, cần 1538`);
if (weekNumber === 4 && new Set(slots.map((slot) => slot.classId)).size !== 53) throw new Error('Tệp tuần 4 không bao phủ đủ 53 lớp');
if (weekNumber === 4 && sourceAliases.size !== 93) throw new Error(`Số alias giáo viên khác dự kiến: ${sourceAliases.size}`);

const output = {
  revision: '',
  sourceDate,
  sourceFiles: workbookNames,
  weekNumber,
  slots,
  assignments: [...assignmentMap.values()].sort((a, b) =>
    a.teacherName.localeCompare(b.teacherName, 'vi') ||
    a.className.localeCompare(b.className, 'vi') ||
    a.subjectName.localeCompare(b.subjectName, 'vi')
  ),
  ruleViolations,
};

if (weekNumber === 4 && fs.existsSync(outputPath)) {
  const existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  const workloadCorrections = new Map([
    ['gv_pht_tri', { weeklyTeachingPeriods: 2, dutyPeriods: 0, totalQuotaPeriods: 2, quotaBalance: -8 }],
    ['gv_nguyen_thanh_tong', { weeklyTeachingPeriods: 2, dutyPeriods: 0, totalQuotaPeriods: 2, quotaBalance: -8 }],
    ['gv_vo_ngoc_dinh_van', { weeklyTeachingPeriods: 9, dutyPeriods: 0, totalQuotaPeriods: 9, quotaBalance: -4 }],
    ['gv_tran_thanh_hau', { weeklyTeachingPeriods: 18, dutyPeriods: 0, totalQuotaPeriods: 18, quotaBalance: -4 }],
  ]);
  output.teacherWorkloads = (existingData.teacherWorkloads || []).map((profile) => ({
    ...profile,
    ...workloadCorrections.get(profile.teacherId),
  }));
}

output.revision = createHash('sha256')
  .update(JSON.stringify({ weekNumber, sourceDate, sourceFiles: workbookNames, slots, assignments: output.assignments, teacherWorkloads: output.teacherWorkloads || [] }))
  .digest('hex')
  .slice(0, 16);

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

const weekFiles = fs.readdirSync(dataDirectory)
  .map((name) => ({ name, match: name.match(/^dbkWeek(\d+)Data\.json$/) }))
  .filter((entry) => entry.match)
  .map((entry) => ({ name: entry.name, week: Number(entry.match[1]) }))
  .sort((a, b) => a.week - b.week);
const imports = weekFiles.map(({ name, week }) => `import week${week}Data from './${name}';`).join('\n');
const weekData = weekFiles.map(({ week }) => `  week${week}Data as unknown as WeeklyScheduleSnapshot,`).join('\n');
const registrySource = `import { PeriodSlot, TeacherAssignmentItem } from '../types';
${imports}

export interface WeeklyTeacherWorkload {
  teacherId: string;
  teacherName: string;
  weeklyTeachingPeriods: number;
  dutyPeriods: number;
  totalQuotaPeriods: number;
  quotaBalance: number;
  sourcePdf: string;
}

export interface WeeklyScheduleSnapshot {
  revision: string;
  sourceDate: string;
  sourceFiles: string[];
  weekNumber: number;
  slots: PeriodSlot[];
  assignments: TeacherAssignmentItem[];
  teacherWorkloads: WeeklyTeacherWorkload[];
  ruleViolations: {
    className: string;
    dayOfWeek: number;
    periodNumber: number;
    subjectName: string;
    teacherName: string;
    description: string;
  }[];
}

const scheduleSnapshots: WeeklyScheduleSnapshot[] = [
${weekData}
];

export const DBK_WEEKLY_SCHEDULES: Record<number, WeeklyScheduleSnapshot> = Object.fromEntries(
  scheduleSnapshots.map((snapshot) => [snapshot.weekNumber, snapshot])
);
export const DBK_AVAILABLE_WEEKS = scheduleSnapshots.map((snapshot) => snapshot.weekNumber).sort((a, b) => a - b);
export const DBK_LATEST_WEEK = Math.max(...DBK_AVAILABLE_WEEKS);
`;
fs.writeFileSync(registryPath, registrySource, 'utf8');

console.log(JSON.stringify({
  output: path.relative(root, outputPath),
  registry: path.relative(root, registryPath),
  revision: output.revision,
  weekNumber,
  slots: slots.length,
  classes: new Set(slots.map((slot) => slot.classId)).size,
  assignments: output.assignments.length,
  teachers: new Set(slots.map((slot) => slot.teacherId)).size,
  ruleViolations,
}, null, 2));
import { createHash, createHmac } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const session = process.env.TALENT_CAPTURE_SESSION;
if (!session) throw new Error('Set TALENT_CAPTURE_SESSION for the authorized original-site session.');
const destination = path.join(import.meta.dirname, 'data.json');
const captured = fs.existsSync(destination) ? JSON.parse(fs.readFileSync(destination, 'utf8')) : {};
const curl = promisify(execFile);
const userKey = 'GET /biz-oim/user/get.do {}';
if (captured[userKey]?.bizResult) {
  const { userId, corpCode } = captured[userKey].bizResult;
  captured[userKey].bizResult = { userId, corpCode };
  fs.writeFileSync(destination, JSON.stringify(captured, null, 2));
}
export function key(method, url, data = {}) {
  const u = new URL(url, 'https://v4.21tb.com');
  const params = { ...Object.fromEntries(u.searchParams), ...data };
  return `${method} ${u.pathname} ${JSON.stringify(Object.fromEntries(Object.entries(params).sort(([a], [b]) => a.localeCompare(b))))}`;
}
export async function read(url, data = {}, method = 'POST', form = false) {
  const k = key(method, url, data);
  if (captured[k]) return captured[k];
  const u = new URL(url, 'https://v4.21tb.com');
  const parts = u.pathname.split('/');
  const time = Date.now();
  const message = `module=${parts.at(-2)}&method=${parts.at(-1)}&time=${time}`;
  const sign = createHmac('sha1', createHash('md5').update(session).digest('hex')).update(message).digest('base64');
  const args = ['-sS', '--max-time', '45', '-X', method, '-H', `-TIME: ${time}`, '-H', `-SID: ${session}`, '-H', `-SIGN: ${sign}`, '-H', '-local: zh_CN', '-H', `Cookie: eln_session_id=${session}`];
  if (method === 'GET') Object.entries(data).forEach(([name, value]) => u.searchParams.set(name, value));
  else args.push('-H', `Content-Type: ${form ? 'application/x-www-form-urlencoded' : 'application/json'}`, '--data', form ? new URLSearchParams(data).toString() : JSON.stringify(data));
  let result;
  try { result = (await curl('curl', [...args, u.href], { maxBuffer: 16 * 1024 * 1024 })).stdout; }
  catch { throw new Error(`Source query failed: ${u.pathname}`); }
  let response;
  try { response = JSON.parse(result); } catch { throw new Error(`Non-JSON response: ${u.pathname} (${result.length} bytes)`); }
  if (u.pathname === '/biz-oim/user/get.do' && response.bizResult) {
    const { userId, corpCode } = response.bizResult;
    response.bizResult = { userId, corpCode };
  }
  captured[k] = response;
  fs.writeFileSync(destination, JSON.stringify(captured, null, 2));
  console.log(u.pathname, response.code ?? response.status, response.bizResult?.total ?? '');
  return response;
}
if (process.argv[2] === 'map') {
  await read('/uc/html/h5/rank/findSystemSetting.do');
  await read('/uc/html/h5/positiongrade/curLoginPositionCart.do');
  await read('/uc/html/h5/rank/findRankDevChannelTopInfo.do');
}
if (process.argv[2] === 'all') {
  const positions = await read('/uc/html/h5/positiongrade/curLoginPositionCart.do');
  const tops = await read('/uc/html/h5/rank/findRankDevChannelTopInfo.do');
  const user = await read('/biz-oim/user/get.do', {}, 'GET');
  await read('/cpm/admin/setting/get', {}, 'GET');
  const ids = positions.bizResult.flatMap(s => s.positionSequenceDetails.flatMap(n => n.positionVos));
  const details = [];
  for (const top of tops.bizResult) {
    const nodes = await read('/uc/html/h5/rank/findRankDevChannel.do', {
      positionGradeId: top.positionGradeId, currentPositionGradeDetailId: top.positionGradeDetailId, positionSequenceId: top.positionSequenceId,
    });
    for (const n of nodes.bizResult || []) {
      const match = await read('/uc/html/h5/rank/findSequenceDetail.do', { positionSequenceId: top.positionSequenceId, positionGradeDetailId: n.positionGradeDetailId });
      if (match.code === 200) details.push({ id: match.bizResult.positionSequenceDetailId, type: 'rank' });
    }
  }
  details.push(...ids.map(p => ({ id: p.positionId, type: 'position' })));
  const pending = [...details];
  async function captureDetail({ id, type }) {
    const prefix = `/uc/html/h5/${type}`;
    const idParam = type === 'position' ? { positionId: id } : { rankSequenceDetailId: id };
    const base = await read(`${prefix}/${type === 'position' ? 'findPositionBaseInfo' : 'findRankDevelBaseInfo'}.do`, type === 'position' ? { positionId: id, curUserId: user.bizResult.userId } : { positionSeqDetailId: id });
    await read('/uc/html/h5/position/positionSkillsRadarData.do?positionId=' + id);
    await read('/uc/html/h5/position/findPostQualification.do', { positionId: id });
    if (type === 'rank') await read(prefix + '/findRankQualif.do', { positionSeqDetailId: id });
    if (type === 'position' && base.bizResult?.positionDetail) {
      const p = base.bizResult.positionDetail;
      const annual = { timeType: p.annualTargetCreditsTimeType, creditQueryType: true, annualCreditsType: p.annualTargetCreditsSource, annualTargetCredits: p.annualTargetCredits, curUserId: user.bizResult.userId };
      if (p.annualTargetCreditsTimeType === 'DEFINE') Object.assign(annual, { startTime: p.annualTargetCreditsStartTime?.split(' ')[0] || '', endTime: p.annualTargetCreditsEndTime?.split(' ')[0] || '' });
      await read('/rtr/html/studentsituation/studentsituation.AnnualCredits.do', annual, 'POST', true);
    }
    for (const learningType of ['ALL', 'COMPULSORY', 'ELECTIVE']) {
      let pageNo = 1, totalPages = 1;
      do {
        const r = await read(prefix + '/findUserLearnPlanCourse.do', { ...idParam, pageNo, pageSize: 18, learningType });
        totalPages = Math.ceil((r.bizResult?.total || 0) / 18);
      } while (++pageNo <= totalPages);
    }
    await read(prefix + '/findUserLearnPlanTask.do', { ...idParam, pageNo: 1, pageSize: type === 'rank' ? 10 : 12 });
    for (const status of ['ALL', 'DRAFT', 'NOTSTART', 'ENABLE', 'FINISH']) await read(prefix + '/findUserLearnPlanIdp.do', { ...idParam, pageNo: 1, pageSize: 8, status });
    const examTypes = type === 'position' ? ['pre', 'post'] : [null];
    for (const examType of examTypes) await read(prefix + '/findUserLearnPlanExam.do', { ...idParam, pageNo: 1, pageSize: type === 'rank' ? 10 : 12, examStatus: 'ALL', ...(examType ? { examType } : {}) });
    await read(`/face/client/mix/queryPositionGradeProjectList?pageNo=1&pageSize=18&referType=${type === 'position' ? 'POSITION' : 'POSITION_GRADE_SEQ'}&mina_type=H5`, { mixStatus: '', devRankId: id });
  }
  await Promise.all(Array.from({ length: 4 }, async () => { while (pending.length) await captureDetail(pending.shift()); }));
  console.log('Nodes captured:', details.length);
}
if (process.argv[2] === 'abilities') {
  const ids = new Set();
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (value.qualityId) ids.add(value.qualityId);
    Object.values(value).forEach(walk);
  }
  Object.values(captured).forEach(walk);
  const pending = [...ids];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (pending.length) await read('/cpm/admin/quality/detail', { qualityId: pending.shift() }, 'GET');
  }));
  console.log('Ability dimensions captured:', ids.size);
}
if (process.argv[2] === 'projects') {
  for (const [k, response] of Object.entries(captured)) {
    if (!k.includes('queryPositionGradeProjectList') || !response.data?.rows?.length) continue;
    const p = JSON.parse(k.slice(k.indexOf(' {') + 1));
    if (p.mixStatus) continue;
    for (const mixStatus of ['LIVING', 'NO_START', 'KNOT']) {
      await read(`/face/client/mix/queryPositionGradeProjectList?pageNo=${p.pageNo}&pageSize=${p.pageSize}&referType=${p.referType}&mina_type=H5`, { mixStatus, devRankId: p.devRankId });
    }
  }
}

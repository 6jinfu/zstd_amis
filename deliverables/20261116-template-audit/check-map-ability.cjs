const fs=require('node:fs');
const vm=require('node:vm');
const JSZip=require('../../app/vendor/jszip.min.js');
const code=fs.readFileSync('app/review-ability-import.js','utf8');
const create=vm.runInNewContext(code.slice(0,code.indexOf('  async function readFile'))+'return template;})()', {JSZip});
(async()=>{
  const blob=await create([{id:'EMP-1026',name:'张明'},{id:'EMP-1088',name:'李华'}]);
  const zip=await JSZip.loadAsync(await blob.arrayBuffer());
  const sheet=await zip.file('xl/worksheets/sheet1.xml').async('string');
  for(const value of ['工号','姓名','能力编号','能力名称','能力得分','能力等级','测评日期','来源说明','EMP-1026','张明','EMP-1088','李华']){
    if(!sheet.includes(value))throw new Error('模板缺少：'+value);
  }
  process.stdout.write('人才图谱能力模板生成、表头及预填人员通过\n');
})().catch(error=>{console.error(error);process.exitCode=1;});

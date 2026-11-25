import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const book=Workbook.create(),sheet=book.worksheets.add('测评结果');
sheet.getRange('A7:F10').values=[['工号','姓名','项目名称','项目开始日期','项目结束日期','能力得分'],['示例','示例','示例','2026-01-01','2026-01-02',0],['EMP-1026','张明','基础管理者评估','2026-01-01','2026-02-01',5],['EMP-1088','李华','基础管理者评估','2026-01-01','2026-02-01',1.5]];
await (await SpreadsheetFile.exportXlsx(book)).save('deliverables/20261116-template-audit/监控测试.xlsx');

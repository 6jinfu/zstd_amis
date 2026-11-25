from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.etree import ElementTree as ET
import shutil

base = Path(__file__).parent
path = base / '人员能力数据导入模板.xlsx'
ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
ET.register_namespace('', ns)
with ZipFile(path) as archive:
    entries = {item.filename: archive.read(item.filename) for item in archive.infolist()}
root = ET.fromstring(entries['xl/worksheets/sheet1.xml'])
rules = root.find(f'{{{ns}}}dataValidations')
assert rules is not None
# The authoring API supports level lists; custom two-decimal score validation is added in OOXML.
rule = ET.SubElement(rules, f'{{{ns}}}dataValidation', type='custom', sqref='F9:F2008', allowBlank='1', showErrorMessage='1', errorStyle='stop', errorTitle='能力得分格式错误', error='请输入 0–999 的数值，最多两位小数；得分可留空。')
ET.SubElement(rule, f'{{{ns}}}formula1').text = 'AND(ISNUMBER(F9),F9>=0,F9<=999,ROUND(F9,2)=F9)'
rules.set('count', str(len(rules)))
entries['xl/worksheets/sheet1.xml'] = ET.tostring(root, encoding='utf-8', xml_declaration=True)
with ZipFile(path, 'w', ZIP_DEFLATED) as archive:
    for name, content in entries.items():
        archive.writestr(name, content)
shutil.copyfile(path, base.parents[1] / 'app/templates/talent-person-ability.xlsx')
print('Exported template with level list and score validation')

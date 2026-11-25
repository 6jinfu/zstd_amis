from pathlib import Path
from PIL import Image, ImageDraw
import json

root = Path(__file__).parent
marks = {
    '01-能力数据入口': [(413, 197, 666, 243)],
    '02-能力结果导入': [(558, 82, 1375, 205), (558, 220, 1375, 340), (558, 358, 1375, 550)],
    '03-绩效数据导入': [(558, 82, 1375, 205), (558, 220, 1375, 340), (558, 358, 1375, 550)],
    '04-两轴档数配置': [(429, 265, 1140, 334)],
    '05-绩效排名分档': [(430, 95, 1140, 584)],
    '06-25格名称预览': [(430, 338, 1140, 746)],
    '07-5x5盘点结果': [(436, 305, 1327, 788)],
    '08-分格解读与建议': [(390, 476, 1345, 650)],
}
metadata = []
for name, boxes in marks.items():
    source = root / 'raw' / (name + '.jpg')
    image = Image.open(source).convert('RGB')
    draw = ImageDraw.Draw(image)
    for box in boxes:
        draw.rectangle(box, outline='#ed1c0a', width=3)
    image.save(root / 'images' / (name + '.png'))
    width, height = image.size
    rects = ''.join(f'<rect x="{x}" y="{y}" width="{right-x}" height="{bottom-y}" fill="none" stroke="#ed1c0a" stroke-width="3"/>' for x, y, right, bottom in boxes)
    (root / 'annotations' / (name + '.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">{rects}</svg>')
    metadata.append({'name': name, 'size': [width, height], 'rectangles': boxes})
(root / 'annotations.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2))

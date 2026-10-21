from PIL import Image, ImageDraw
import glob
import math

files = sorted(glob.glob('slide-*.png'))
images = [Image.open(file).convert('RGB') for file in files]
thumb_width = 520
thumbs = []
for index, image in enumerate(images):
    height = round(image.height * thumb_width / image.width)
    thumb = image.resize((thumb_width, height))
    card = Image.new('RGB', (thumb_width, height + 28), 'white')
    card.paste(thumb, (0, 28))
    ImageDraw.Draw(card).text((10, 6), f'{index + 1:02d}', fill='black')
    thumbs.append(card)

columns = 3
rows = math.ceil(len(thumbs) / columns)
card_height = max(thumb.height for thumb in thumbs)
sheet = Image.new('RGB', (columns * thumb_width, rows * card_height), (225, 225, 225))
for index, thumb in enumerate(thumbs):
    sheet.paste(thumb, ((index % columns) * thumb_width, (index // columns) * card_height))
sheet.save('contact-sheet.png')

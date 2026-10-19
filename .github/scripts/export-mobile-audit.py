from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import json, io, zipfile, base64

root = Path('audit-results')
output = Path('audit-export')
output.mkdir(exist_ok=True)

groups = {
    'staging-mobile': [f'staging-{p}-390-{v}-home.png' for p in ['home', 'services'] for v in ['baseline', 'candidate']],
    'staging-desktop': [f'staging-{p}-1440-{v}-home.png' for p in ['home', 'services'] for v in ['baseline', 'candidate']],
    'production': [f'production-{p}-{w}-current-home.png' for p in ['home', 'services'] for w in [390, 1440]],
    'staging-interactions': [f'staging-{p}-390-candidate-{view}.png' for p in ['home', 'services'] for view in ['menu', 'consultation']],
}
for group, names in groups.items():
    width, height = (720, 525) if group == 'staging-desktop' else ((720, 870) if group == 'production' else (390, 870))
    canvas = Image.new('RGB', (width * 2, height * 2), '#eeeeee')
    draw = ImageDraw.Draw(canvas)
    for index, name in enumerate(names):
        image = Image.open(root / name).convert('RGB')
        image.thumbnail((width, height - 26))
        x, y = index % 2 * width, index // 2 * height
        canvas.paste(image, (x, y + 26))
        draw.text((x + 5, y + 5), name, fill='#000000')
    canvas.save(output / (group + '.jpg'), quality=85, optimize=True)

buffer = io.BytesIO()
with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in root.glob('*.json'):
        data = json.loads(file.read_text())
        if file.name.endswith('.lighthouse.json'):
            # Preserve all audits and metrics; original screenshots remain in the primary artifact.
            for key in ['full-page-screenshot', 'screenshot-thumbnails', 'final-screenshot']:
                data.get('audits', {}).pop(key, None)
        archive.writestr(file.name, json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    for file in output.glob('*.jpg'):
        archive.write(file, file.name)
encoded = base64.b64encode(buffer.getvalue()).decode('ascii')
print('AUDIT_EXPORT_BEGIN bytes=' + str(len(buffer.getvalue())))
for index, offset in enumerate(range(0, len(encoded), 12000)):
    print('AUDIT_EXPORT_CHUNK ' + str(index) + ' ' + encoded[offset:offset+12000])
print('AUDIT_EXPORT_END')

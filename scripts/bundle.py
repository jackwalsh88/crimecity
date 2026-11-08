"""Build a portable single-file HTML from the current static game."""
import argparse,base64,json
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--output',default='Crime-City-v0.5.html');args=parser.parse_args()
root=Path(__file__).resolve().parents[1];dist=root/'dist'
manifest=json.loads((dist/'assets.js').read_text().split('=',1)[1].strip().rstrip(';'))
for key,files in manifest.items():
 manifest[key]=['data:image/webp;base64,'+base64.b64encode((dist/f).read_bytes()).decode() for f in files]
html=(dist/'index.html').read_text().replace('<link rel="stylesheet" href="style.css">','<style>'+(dist/'style.css').read_text()+'</style>')
html=html.replace('<script src="assets.js"></script>','<script>window.ASSETS='+json.dumps(manifest)+';</script>')
html=html.replace('<link rel="stylesheet" href="presentation.css">','<style>'+(dist/'presentation.css').read_text()+'</style>')
font='data:font/ttf;base64,'+base64.b64encode((dist/'fonts/BowlbyOneSC-Regular.ttf').read_bytes()).decode()
typography=(dist/'typography.css').read_text().replace('fonts/BowlbyOneSC-Regular.ttf',font)
license=(dist/'fonts/OFL-Bowlby-One-SC.txt').read_text()
html=html.replace('<link rel="stylesheet" href="typography.css">','<!--\n'+license+'\n--><style>'+typography+'</style>')
html=html.replace('<link rel="stylesheet" href="performance.css">','<style>'+(dist/'performance.css').read_text()+'</style>')
for script in ['engine.js','presentation.js','app.js']:
 html=html.replace(f'<script src="{script}"></script>','<script>'+(dist/script).read_text()+'</script>')
p=Path(args.output);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(html);print(str(p.resolve()),p.stat().st_size)


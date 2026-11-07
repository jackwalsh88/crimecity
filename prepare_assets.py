from PIL import Image
from pathlib import Path
import json,argparse
parser=argparse.ArgumentParser();parser.add_argument('--source',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parent;src=Path(args.source);out=root/'dist/assets';out.mkdir(parents=True,exist_ok=True)
mapping={
'H1':['Gold revolver sunset portrait emblem.png'],'H2':['Blonde Swordswoman in a Golden Frame.png'],'H3':['H3.png'],'H4':['H4-B.png'],
'L1':['L1.png','L1 copy.png'],'L2':['L2.png','L2 copy.png'],'L3':['L3_v1.png','L3-B.png','L3-C.png'],'L4':['L4 copy.png'],
'SCATTER':['SCATTER-B.png'],'WILD':['Glowing briefcase within a golden frame.png'],
'beam':['wild_expanded_beam_1x3.png','Gold-and-purple treasure chest with lightning.png'],
'sticky':['wild_sticky_frame_1x3-A.png','wild_sticky_frame_v1.png'],
'bullet':[f'fx_bullet_hole_gold-{i}.png' for i in range(1,5)],'slash':['fx_katana_slash_beam.png'],
'frame':['reel_frame_5x3-B.png','reel_frame_5x3_v2.png'],'crest':['wild_mult_crest_blank.png'],
'logo':['Crime City Logo Cutout.png'],'hero':['Slick Agent with Golden Briefcase.png'],'ribbon':['win_banner_ribbon.png'],
'wildlabel':['wild_text_plaque.png'],'scatterlabel':['scatter_text_plaque.png'],
'vault':['bg_freegame.png'],'chase':['bg_superbonus.png'],'chaseMobile':['bg_superbonus_9x16.png'],
'bg':['bg_basegame_parallax/bg_basegame_parallax_'+s+'.png' for s in ['Purple-pink sunset over wet asphalt','Palm-Lined Cityscape Parallax Layer','Neon art deco diner facade','Red Muscle Car and Soft Shadow','Framing palms for a parallax scene']],
'bgMobile':['bg_basegame_9x16_parallax/'+s+'.png' for s in ['05_sky_road_background','04_distant_city','03_midground_palms','01_car','02_foreground_palms']]}
manifest={};inventory=[]
for key,files in mapping.items():
 manifest[key]=[]
 for i,f in enumerate(files):
  im=Image.open(src/f);original=im.size
  size=1600 if key in ['bg','bgMobile','vault','chase','chaseMobile'] else 1100 if key=='frame' else 700 if key=='logo' else 650 if key in ['beam','sticky','hero'] else 320
  im.thumbnail((size,size),Image.Resampling.LANCZOS)
  name=f'{key}-{i}.webp';im.save(out/name,'WEBP',quality=86,method=6)
  manifest[key].append('assets/'+name)
  inventory.append({'id':key,'variant':i,'source':f,'original_dimensions':original,'output_dimensions':im.size,'alpha':'A' in im.getbands(),'output':name})
(out.parent/'assets.js').write_text('window.ASSETS = '+json.dumps(manifest)+';')
(root/'asset-inventory.json').write_text(json.dumps(inventory,indent=2))
print('Mapped',len(inventory),'assets;',round(sum(p.stat().st_size for p in out.iterdir())/1024/1024,2),'MiB')

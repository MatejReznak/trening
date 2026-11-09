# Spojí zdrojové časti do ../index.html (avatars.js je už v koreni repozitára)
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sh=open('shell.html').read()
js='\n'.join(open(f).read() for f in ['av_runtime.js','ex_lib.js','scene3d.js','app_data.js','app_extra.js','app_ui.js','app_log.js','app_clips.js','app_work.js','app_push.js','app_body.js','app_boot.js'])
pwa=('<link rel="manifest" href="manifest.json">\n<meta name="theme-color" content="#1f2a33">\n'
     '<link rel="apple-touch-icon" href="icon-180.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
     '<meta name="apple-mobile-web-app-title" content="Tréning">\n')
open('../index.html','w').write(sh.replace('/*__SCRIPTS__*/',js).replace('<title>',pwa+'<title>',1))
print('index.html ok')

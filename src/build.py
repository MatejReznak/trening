import os, shutil
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sh=open('shell.html').read()
js='\n'.join(open(f).read() for f in ['av_runtime.js','ex_lib.js','scene3d.js','app_data.js','app_extra.js','app_ui.js','app_log.js','app_work.js','app_boot.js'])
html=sh.replace('/*__SCRIPTS__*/',js)
open('index.html','w').write(html)   # verzia pre artifact
pwa=('<link rel="manifest" href="manifest.json">\n<meta name="theme-color" content="#1f2a33">\n'
     '<link rel="apple-touch-icon" href="icon-180.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
     '<meta name="apple-mobile-web-app-title" content="Tréning">\n')
SITE=os.path.join('..');os.makedirs('site',exist_ok=True)
open('site/index.html','w').write(html.replace('<title>',pwa+'<title>',1))  # verzia pre GitHub Pages
shutil.copy('avatars.js','site/avatars.js')
print('index.html',len(js))

@echo off
cd /d "c:\Users\Tomas\Desktop\ANTIGRAVITY\libreria 3d upaidown"
echo --- START --- > "c:\Users\Tomas\Desktop\ANTIGRAVITY\libreria 3d upaidown\git_push.log" 2>&1
git add . >> "c:\Users\Tomas\Desktop\ANTIGRAVITY\libreria 3d upaidown\git_push.log" 2>&1
echo Added files >> "c:\Users\Tomas\Desktop\ANTIGRAVITY\libreria 3d upaidown\git_push.log" 2>&1
git commit -m "feat: tanque australiano 2000m3 y restauracion de modelos" >> "c:\Users\Tomas\Desktop\ANTIGRAVITY\libreria 3d upaidown\git_push.log" 2>&1
echo Committed >> "c:\Users\Tomas\Desktop\ANTIGRAVITY\libreria 3d upaidown\git_push.log" 2>&1
git push origin main >> "c:\Users\Tomas\Desktop\ANTIGRAVITY\libreria 3d upaidown\git_push.log" 2>&1
echo DONE >> "c:\Users\Tomas\Desktop\ANTIGRAVITY\libreria 3d upaidown\git_push.log" 2>&1

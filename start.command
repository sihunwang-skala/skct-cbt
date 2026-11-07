#!/bin/zsh
# 더블클릭으로 실행: 서버 시작 + Chrome으로 열기. 종료는 이 창에서 Ctrl+C 또는 창 닫기.
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
(sleep 2; open -a "Google Chrome" http://localhost:5173 || open http://localhost:5173) &
npm run dev -- --port 5173

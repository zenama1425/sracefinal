/* -------- 0. 모듈 import 삭제! -------- */
// import { loadImages } from './loader.js';  ← 이 줄 지움

/* -------- 1. 이미지 한꺼번에 불러오기 함수 -------- */
function loadImages(paths){
  const jobs = Object.entries(paths).map(([key,src])=>new Promise(res=>{
    const img = new Image();
    img.src = src;
    img.onload = () => res([key, img]);
  }));
  return Promise.all(jobs).then(arr => Object.fromEntries(arr));
}

/* ====== ↓↓↓ 아래는 기존 main.js 내용 그대로, + 인트로 영상 로직 추가 ↓↓↓ ====== */

/* ---------- 캔버스 & UI ---------- */
const canvasL = document.getElementById('left');
const canvasR = document.getElementById('right');
const ctxL    = canvasL.getContext('2d');
const ctxR    = canvasR.getContext('2d');
const timerEl = document.getElementById('timer');
const recordEl= document.getElementById('record');
const startBtn= document.getElementById('start');

/* ---------- 그림 경로 ---------- */
const IMG_SRC = {
  cover:'assets/images/cover.png',
  background:'assets/images/background.png',
  rabbit:'assets/images/rabbit.png',
  turtle:'assets/images/turtle.png',
  chocolate:'assets/images/chocolate.png',
  gummy:'assets/images/gummy.png',
  blackhole:'assets/images/blackhole.png',
  puddle:'assets/images/puddle.png',
  caterpillar:'assets/images/caterpillar.png',
  poop:'assets/images/poop.png',
  finish:'assets/images/finish.png',
};

/* ---------- 음악 ---------- */
const bgm = new Audio('assets/audio/bgm.m4a');
bgm.loop = true;
bgm.volume = 0.4;

/* ---------- 상태 ---------- */
let SPR = {}, phase = 'cover', state, animID, startTime, timerID;
const fmt = ms => {
  const s = Math.floor(ms/1000), m = Math.floor(s/60);
  return `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
};
const startTimer = () => {
  startTime = Date.now();
  timerEl.textContent = '00:00';
  timerID = setInterval(() => {
    timerEl.textContent = fmt(Date.now() - startTime);
  }, 1000);
};
const stopTimer = () => clearInterval(timerID);

/* ---------- 표지 ---------- */
function drawCover(){
  ctxL.drawImage(SPR.cover, 0, 0, 400, 600);
  ctxR.drawImage(SPR.cover, 0, 0, 400, 600);
  ctxL.fillStyle = '#ffffffcc';
  ctxL.font = '20px Arial';
  ctxL.fillText('👉 [게임 시작] 버튼을 눌러 주세요!', 20, 560);
}

/* ---------- 게임 준비 ---------- */
function initGame(){
  phase = 'game';
  state = {
    players: {
      rabbit: { x:180, y:550, stamina:3, row:0 },
      turtle: { x:180, y:550, stamina:3, row:0 }
    },
    items: [],
    obstacles: [],
    frame: 0,
    goal: 100,
    isWin: false,
    isOver: false,
    best: state?.best || null
  };
  startTimer();
  loop();
  bgm.play();
}

/* ---------- 스폰 ---------- */
function spawn(){
  const ITEM_COUNT = Math.floor(Math.random()*1) + 2;   // 2~3
  const OBST_COUNT = Math.floor(Math.random()*1) + 2;   // 2~3

  for(let i=0; i<ITEM_COUNT*2; i++){
    state.items.push({
      x: Math.random()*360,
      y: -Math.random()*100 - 20,
      type: Math.random() < 0.5 ? 'chocolate' : 'gummy'
    });
  }

  const kinds = ['blackhole','puddle','caterpillar','poop'];
  for(let i=0; i<OBST_COUNT*2; i++){
    state.obstacles.push({
      x: Math.random()*360,
      y: -Math.random()*100 - 20,
      type: kinds[Math.floor(Math.random()*kinds.length)]
    });
  }
}

/* ---------- 업데이트 ---------- */
function update(){
  state.frame++;
  if(state.frame % 30 === 0) spawn();

  state.items.forEach(i => i.y += 3);
  state.obstacles.forEach(o => o.y += 4);

  ['rabbit','turtle'].forEach(p => {
    const pl = state.players[p];
    state.items = state.items.filter(i => {
      if(Math.abs(i.x-pl.x)<30 && Math.abs(i.y-pl.y)<30){
        if(i.type==='chocolate') pl.row += 5;
        if(i.type==='gummy')     pl.stamina = Math.min(pl.stamina+1, 3);
        return false;
      }
      return true;
    });
    state.obstacles = state.obstacles.filter(o => {
      if(Math.abs(o.x-pl.x)<30 && Math.abs(o.y-pl.y)<30){
        pl.stamina--;
        return false;
      }
      return true;
    });
    pl.row += 0.1;
    if(p==='rabbit' && pl.stamina <= 0) state.isOver = true;
    if(pl.row >= state.goal)            state.isWin  = true;
  });
}

/* ---------- 그리기 ---------- */
function draw(){
  if(phase === 'cover'){
    drawCover();
    return;
  }

  ctxL.clearRect(0,0,400,600);
  ctxR.clearRect(0,0,400,600);

  ctxL.drawImage(SPR.background, 0, 0, 400, 600);
  ctxR.drawImage(SPR.background, 0, 0, 400, 600);

  const d = (ctx, img, x, y) => ctx.drawImage(img, x, y, 32, 32);
  state.items.forEach(i => {
    d(ctxL, SPR[i.type], i.x, i.y);
    d(ctxR, SPR[i.type], i.x, i.y);
  });
  state.obstacles.forEach(o => {
    d(ctxL, SPR[o.type], o.x, o.y);
    d(ctxR, SPR[o.type], o.x, o.y);
  });

  const r = state.players.rabbit;
  const t = state.players.turtle;
  d(ctxL, SPR.rabbit, r.x, r.y);
  d(ctxL, SPR.turtle, t.x, t.y);
  d(ctxR, SPR.rabbit, r.x, r.y);
  d(ctxR, SPR.turtle, t.x, t.y);

  ctxL.fillStyle = 'black';
  ctxL.font = '16px Arial';
  ctxL.fillText(`체력:${r.stamina} 줄:${r.row.toFixed(1)}`, 10, 20);
  ctxR.fillText(`체력:${t.stamina} 줄:${t.row.toFixed(1)}`, 10, 20);

  if(state.isWin){
    ctxL.drawImage(SPR.finish, 0, 0, 400, 600);
    ctxR.drawImage(SPR.finish, 0, 0, 400, 600);
    stopTimer();
    recordCheck();
    return;
  }

  if(state.isOver){
    ctxL.fillStyle = 'red';
    ctxL.font = '30px Arial';
    ctxL.fillText('Game Over', 80, 300);
    stopTimer();
  }
}

/* ---------- 기록 ---------- */
function recordCheck(){
  const t = Date.now() - startTime;
  if(!state.best || t < state.best){
    state.best = t;
    recordEl.style.display = 'block';
  }
}

/* ---------- 루프 ---------- */
function loop(){
  if(state.isWin || state.isOver) return;
  update();
  draw();
  animID = requestAnimationFrame(loop);
}

/* ---------- 입력 ---------- */
window.addEventListener('keydown', e => {
  const r = state.players?.rabbit;
  if(!r) return;
  if(e.key === 'ArrowLeft')  r.x = Math.max(0,   r.x - 20);
  if(e.key === 'ArrowRight') r.x = Math.min(360, r.x + 20);
});

/* ---------- 버튼 ---------- */
startBtn.onclick = () => {
  if(phase === 'cover'){
    ctxL.clearRect(0,0,400,600);
    ctxR.clearRect(0,0,400,600);
  }
  cancelAnimationFrame(animID);
  initGame();
};

/* ---------- 시작: 그림 로드 + 인트로 재생 처리 ---------- */
loadImages(IMG_SRC).then(imgs => {
  SPR = imgs;
  const introContainer = document.getElementById('intro-container');
  const introVideo     = document.getElementById('introVideo');

  if(introContainer && introVideo){
    // 영상 재생 시작
    introVideo.play();

    // 영상 끝나면 컨테이너 숨기고 커버 그리기
    introVideo.addEventListener('ended', () => {
      introContainer.style.display = 'none';
      drawCover();
    });

    // 클릭 시 스킵
    introContainer.addEventListener('click', () => {
      introVideo.pause();
      introContainer.style.display = 'none';
      drawCover();
    });
  } else {
    // 인트로 요소가 없으면 바로 커버 그리기
    drawCover();
  }
});

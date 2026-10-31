(() => {
const D = window.APP_DATA;
const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const EXAM = new Date('2026-11-03T00:00:00+08:00');

// Traditional-character versions of Susu's lines (audio uses Mandarin TTS)
const DOLL_TC = {
  hello:'小朋友，你好呀！我是 Susu，這是我的好朋友 Neko。十一月三號就要考普通話啦，我們一起開開心心地溫習，好不好呀？',
  learn:'我們先來學習吧！點一點卡片，我就會讀給你聽哦。',
  games:'哇，歡迎來到遊戲樂園！玩遊戲，贏星星咯！',
  initials:'這是聲母表哦。跟着我讀一讀：b、p、m、f。',
  finals:'這是韻母表哦。i 行和 u 行的韻母，前面沒有聲母的時候，要寫成 y 和 w 開頭呢。',
  tones:'普通話有四個聲調哦：一聲平，二聲揚，三聲拐彎，四聲降。',
  lesson:'我們來讀課文吧！點一點句子，聽一聽，再跟着我讀哦。',
  g_listen:'豎起小耳朵，仔細聽哦，我讀的是哪一個拼音呢？',
  g_tone:'聽一聽，這是第幾聲呀？快來打破正確的氣球吧！',
  g_yw:'魔法變身咯！前面沒有聲母的時候，韻母要怎樣寫呢？',
  g_memory:'翻開卡片，找出漢字和拼音的好朋友吧！',
  g_initial:'聽一聽，我讀的是哪一個聲母呀？',
  g_spell:'拼拼樂來啦！選出聲母、韻母和聲調，拼出這個字吧。',
  right1:'哇，答對了，你真棒！', right2:'耶，太厲害了！', right3:'好極了，繼續加油哦！',
  wrong1:'沒關係哦，再聽一次吧。', wrong2:'差一點點啦，再試一試！',
  finish:'哇，恭喜你完成了！Neko 也為你拍手，你得到了一顆星星！',
  rest:'學累了嗎？Neko 陪你休息一下，喝口水，再回來玩吧。',
  exam:'小朋友，加油哦！你一定可以的！',
  g_mole:'小地鼠出來啦！聽一聽，快打中正確的拼音吧！', g_cake:'月餅掉下來啦！聽一聽是哪個韻母，快接住它！',
  g_fill:'拼音缺了一塊，聽一聽，幫它補回來吧！', g_code:'聽一聽這個詞語，兩個字分別是第幾聲呀？',
  sticker_new:'哇，你得到一張新貼紙！快貼到貼紙簿裏吧！', sticker_pack:'你有貼紙包可以打開哦！', book:'這是你的貼紙簿，集齊所有貼紙吧！'
};

/* ---------------- state ---------------- */
let memStore = {};
const KEY = 'susu-neko-ptH-v1';
const store = { get(){ try { return JSON.parse(window['local'+'Storage'].getItem(KEY)) || memStore; } catch(e){ return memStore; } }, set(v){ memStore = v; try { window['local'+'Storage'].setItem(KEY, JSON.stringify(v)); } catch(e){} } };
let S = Object.assign({ stars:0, done:{}, plays:0, stickers:[], board:[], boardBg:'park' }, store.get());
const save = () => { store.set(S); $('#starCount').textContent = S.stars; };
save();
let slow = false;

/* ---------------- audio ---------------- */
let cur = null, curEl = null;
function stopAudio(){ if (cur){ cur.pause(); cur = null; } if (window.speechSynthesis) speechSynthesis.cancel(); if (curEl){ curEl.classList.remove('playing'); curEl = null; } }
function say(id, fallback, el){
  return new Promise(res => {
    stopAudio();
    if (el){ curEl = el; el.classList.add('playing'); }
    const done = () => { if (el) el.classList.remove('playing'); res(); };
    const a = new Audio('audio/' + id.replace('ü','v') + '.mp3');
    a.playbackRate = slow ? 0.72 : 1;
    if ('preservesPitch' in a) a.preservesPitch = true;
    cur = a;
    a.onended = done;
    a.onerror = () => { speak(fallback).then(done); };
    a.play().catch(() => { speak(fallback).then(done); });
  });
}
function speak(t){
  return new Promise(res => {
    if (!t || !window.speechSynthesis) return res();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'zh-CN'; u.rate = slow ? .6 : .85;
    const v = speechSynthesis.getVoices().find(v => /zh[-_]CN/i.test(v.lang));
    if (v) u.voice = v;
    u.onend = res; u.onerror = res;
    speechSynthesis.speak(u);
  });
}
$('#slowBtn').onclick = e => { slow = !slow; e.currentTarget.setAttribute('aria-pressed', slow); dollSay(null, slow ? '慢速模式開啟，我會讀慢一點。' : '回到正常速度。'); };

/* ---------------- doll buddy ---------------- */
const IMG = { wave:'img/doll-wave.webp', teach:'img/doll-teach.webp', cheer:'img/doll-cheer.webp', think:'img/doll-think.webp', clap:'img/baby-clap.webp', sleep:'img/baby-sleep.webp' };
let bubbleT, lastDoll = 'hello';
function setDoll(pose){ $('#buddyImg').src = IMG[pose] || IMG.wave; }
function dollSay(key, textOverride, pose){
  const b = $('#bubble'), buddy = $('#buddy');
  b.textContent = textOverride || DOLL_TC[key] || '';
  const hi = document.querySelector('.hero-doll .hi'); if (hi && document.body.classList.contains('home')) hi.textContent = b.textContent;
  b.classList.add('show');
  if (pose) setDoll(pose);
  clearTimeout(bubbleT);
  buddy.classList.add('talk');
  if (key){ lastDoll = key; return say('doll_' + key, D.DOLL[key]).then(() => { buddy.classList.remove('talk'); bubbleT = setTimeout(() => b.classList.remove('show'), 4000); }); }
  bubbleT = setTimeout(() => { b.classList.remove('show'); buddy.classList.remove('talk'); }, 3200);
  return Promise.resolve();
}
$('#buddyDoll').onclick = () => dollSay(lastDoll);
const praise = () => dollSay(['right1','right2','right3'][Math.floor(Math.random()*3)], null, 'cheer');
const comfort = () => dollSay(['wrong1','wrong2'][Math.floor(Math.random()*2)], null, 'think');

/* ---------------- helpers ---------------- */
const shuffle = a => { a = a.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content; };
const starSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
const speakerSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
const LCOL = { 1:['var(--coral)','var(--coral-l)'], 2:['var(--sun-d)','var(--sun-l)'], 3:['var(--sky)','var(--sky-l)'] };
function confetti(){
  const c = $('#confetti'); const cols = ['#ff6b5e','#ffc93c','#3fbf98','#4ea8ff','#9b85e6'];
  for (let i=0;i<60;i++){ const e=document.createElement('i'); e.style.left=Math.random()*100+'vw'; e.style.background=cols[i%5]; e.style.animationDelay=Math.random()*.6+'s'; e.style.animationDuration=(1.4+Math.random())+'s'; c.appendChild(e); setTimeout(()=>e.remove(),3200); }
}
function modal({img='clap', title, text, actions}){
  $('#modalImg').src = IMG[img]; $('#modalTitle').textContent = title; $('#modalText').textContent = text;
  const box = $('#modalActions'); box.innerHTML = '';
  actions.forEach(([label, cls, fn]) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = label; b.onclick = () => { $('#modal').hidden = true; fn && fn(); }; box.appendChild(b); });
  $('#modal').hidden = false;
}

/* pinyin tone utilities */
const TONE_MAP = { a:'āáǎà', o:'ōóǒò', e:'ēéěè', i:'īíǐì', u:'ūúǔù', ü:'ǖǘǚǜ' };
const PLAIN = {}; Object.entries(TONE_MAP).forEach(([v, s]) => [...s].forEach((c, i) => PLAIN[c] = [v, i+1]));
function addTone(syl, tone){
  if (!tone) return syl;
  let idx = -1;
  if (syl.includes('a')) idx = syl.indexOf('a');
  else if (syl.includes('o')) idx = syl.indexOf('o');
  else if (syl.includes('e')) idx = syl.indexOf('e');
  else { for (let i=syl.length-1;i>=0;i--){ if ('iuü'.includes(syl[i])) { idx = i; break; } } }
  if (idx < 0) return syl;
  return syl.slice(0, idx) + TONE_MAP[syl[idx]][tone-1] + syl.slice(idx+1);
}
function toneVariant(py){
  const chars = [...py]; const marks = chars.map((c,i)=>PLAIN[c]?i:-1).filter(i=>i>=0);
  if (!marks.length) return null;
  const i = marks[Math.floor(Math.random()*marks.length)];
  const [v, t] = PLAIN[chars[i]]; const opts = [1,2,3,4].filter(x=>x!==t);
  chars[i] = TONE_MAP[v][opts[Math.floor(Math.random()*3)]-1];
  return chars.join('');
}
const SWAPS = [['zh','z'],['ch','c'],['sh','s'],['ing','in'],['eng','en'],['ang','an'],['n','l'],['b','p'],['d','t'],['g','k'],['j','q'],['f','h']];
function soundVariant(py){
  const sw = shuffle(SWAPS);
  for (const [a,b] of sw){
    const re = new RegExp(a); if (re.test(py)) return py.replace(re, b);
    const re2 = new RegExp(b); if (re2.test(py) && b.length>1) return py.replace(re2, a);
  }
  return null;
}

/* ---------------- router ---------------- */
const routes = {};
function go(r, arg){ stopAudio(); document.body.classList.remove('in-game','home'); location.hash = r + (arg!==undefined ? '/' + arg : ''); }
function render(){
  const [r, arg] = location.hash.replace('#','').split('/');
  document.querySelectorAll('.topnav button').forEach(b => b.classList.toggle('on', b.dataset.go === (r||'home') || (r==='game' && b.dataset.go==='games') || (r==='lesson' && b.dataset.go==='learn')));
  document.body.classList.remove('home','in-game');
  (routes[r] || routes.home)(arg);
  updBadge();
  window.scrollTo({ top:0, behavior:'instant' in window ? 'instant' : 'auto' });
}
window.addEventListener('hashchange', render);
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g){ e.preventDefault(); go(g.dataset.go, g.dataset.arg); } });

/* ---------------- HOME ---------------- */
const GAMES = [
  { id:'listen',  name:'聽音找拼音', desc:'Susu 讀詞語，你來選出正確的拼音。', ic:'ā?', c:'var(--coral)', cl:'var(--coral-l)' },
  { id:'tone',    name:'聲調氣球',   desc:'聽聲調，打破正確的氣球！',       ic:'mǎ', c:'var(--sky-d)', cl:'var(--sky-l)' },
  { id:'initial', name:'聲母小耳朵', desc:'聽聽是哪一個聲母？zh 還是 z？', ic:'zh', c:'var(--mint-d)', cl:'var(--mint-l)' },
  { id:'yw',      name:'y w 魔法變身', desc:'i 行、u 行韻母自成音節要怎樣寫？', ic:'y w', c:'var(--lav-d)', cl:'var(--lav-l)' },
  { id:'memory',  name:'翻牌好朋友', desc:'翻開卡片，把漢字和拼音配成對。', ic:'字', c:'var(--sun-d)', cl:'var(--sun-l)' },
  { id:'spell',   name:'拼拼樂',     desc:'選聲母、韻母、聲調，自己拼出字音。', ic:'b+a', c:'var(--coral-d)', cl:'var(--coral-l)' },
  { id:'mole',    name:'聽音打地鼠', desc:'小地鼠舉着拼音牌，聽清楚再打！', ic:'hǎo', c:'var(--sun-d)', cl:'var(--sun-l)', isNew:1 },
  { id:'cake',    name:'Neko 接月餅', desc:'聽字音找韻母，ian 還是 iang？', ic:'ing', c:'var(--coral)', cl:'var(--coral-l)', isNew:1 },
  { id:'fill',    name:'拼音補一補', desc:'拼音缺了聲母、韻母或聲調，聽完補回來。', ic:'zh?', c:'var(--mint-d)', cl:'var(--mint-l)', isNew:1 },
  { id:'code',    name:'聲調密碼',   desc:'聽詞語，猜出兩個字的聲調密碼。', ic:'ˉ ˋ', c:'var(--lav-d)', cl:'var(--lav-l)', isNew:1 },
];
function daysLeft(){ const now = new Date(); return Math.max(0, Math.ceil((EXAM - now) / 86400000)); }

routes.home = () => {
  const dl = daysLeft();
  app.innerHTML = '';
  document.body.classList.add('home');
  app.append(h(`
  <section class="hero">
    <div>
      <span class="countdown"><b>${dl}</b>${dl>0 ? '天後就是 11 月 3 日普通話拼音考試' : '今天考試，加油！'}</span>
      <h1>小朋友，<br><em>Susu</em> 和 <em class="neko">Neko</em><br>陪你溫習普通話</h1>
      <p class="lead">二上《活學普通話》第一至三課：聲母、韻母、聲調、課文朗讀，再玩小遊戲贏星星。</p>
      <div class="cta">
        <button class="btn" data-go="learn">開始學習</button>
        <button class="btn mint" data-go="games">遊戲樂園</button>
      </div>
    </div>
    <div class="hero-doll"><img src="img/doll-wave.webp" alt="穿紅色波點裙的 Susu 娃娃在揮手"><img class="neko-mini" src="img/baby-clap.webp" alt="穿白色連身衣的 Neko 娃娃在拍手"><span class="hi">你好！<span class="py">Nǐ hǎo!</span></span></div>
  </section>

  <div class="section-title"><h2>三課重點</h2><p>點卡片進入課文</p></div>
  <div class="grid g-l">
    ${[1,2,3].map(n => { const l = D.L[n]; return `
    <button class="card lesson-card" style="--c:${LCOL[n][0]}" data-go="lesson" data-arg="${n}">
      <div class="num">${n}</div>
      <h3>${l.title}<small style="font-size:.9rem;color:var(--ink-2)">（${l.sub}）</small></h3>
      <div class="py">${l.py}</div>
      <p class="d">${['問候用語、複習聲母和韻母','中秋節詞語、i 行韻母','學校科目、u 行韻母'][n-1]}</p>
    </button>`; }).join('')}
  </div>

  <div class="section-title"><h2>習作溫習</h2><p>老師派回的普通話習作，可能會考</p></div>
  <div class="grid g-l">
    ${[1,2,3].map(n => { const u = W.WB[n]; return `
    <button class="card lesson-card wb-card" style="--c:${LCOL[n][0]}" data-go="wb" data-arg="${n}">
      <div class="num">習${n}</div>
      <h3>${u.title}<small style="font-size:.9rem;color:var(--ink-2)">（${u.sub}）</small></h3>
      <p class="d">${['聽對話答題、拼音配圖畫三關','聽對話答題、i 行韻母月餅、走雲朵去月宮','聽對話答題、u 行韻母聖誕樹、圈韻母'][n-1]}</p>
    </button>`; }).join('')}
  </div>

  <div class="section-title"><h2>我的貼紙簿</h2><p>每顆星星可以換一個貼紙包</p></div>
  <button class="card book-card" data-go="book">
    <div class="book-peek">${STICKERS.slice(0,6).map(st => S.stickers.includes(st[0]) ? stickerImg(st) : `<div class="stk locked ${st[3]?'scene':'pose'}"><img src="${st[2]}" alt=""></div>`).join('')}</div>
    <div><h3>已收集 ${S.stickers.length} / ${STICKERS.length} 張貼紙</h3><p>${packs() ? `你有 <b>${packs()}</b> 個貼紙包未打開，快去看看！` : '有 Susu 和 Neko 的各種造型：中秋、月宮、太空、海邊、聖誕……'}</p></div>
    <span class="btn sun small">打開貼紙簿</span>
  </button>
  `));
  setDoll('wave');
};

/* ---------------- LEARN ---------------- */
routes.learn = (tab='initials') => {
  app.innerHTML = '';
  const tabs = [['initials','聲母'],['finals','韻母'],['tones','聲調'],['l1','第一課'],['l2','第二課'],['l3','第三課']];
  app.append(h(`<div class="tabs" role="tablist">${tabs.map(([k,n]) => `<button class="tab ${k===tab?'on':''}" data-go="learn" data-arg="${k}">${n}</button>`).join('')}</div><div id="panel"></div>`));
  const p = $('#panel');
  if (tab.startsWith('l')) return renderLesson(p, +tab.slice(1));
  if (tab === 'initials'){
    p.append(h(`<section class="panel" style="--c:var(--coral)">
      <div class="panel-head"><img src="img/doll-teach.webp" alt=""><div><h2>聲母表</h2><p>普通話有 23 個聲母（連 y、w）。點一點，聽Susu 讀。</p></div></div>
      <div class="read-all"><button class="btn small" id="readIni">從頭讀一遍</button></div>
      <h3 class="sub-h">聲母</h3>
      <div class="tiles" id="iniTiles">${D.INITIALS.map(([k,c,py]) => `<button class="tile" data-ini="${k}"><div class="big">${k}</div><div class="small">${c}</div></button>`).join('')}</div>
      <p class="hint">小貼士：zh、ch、sh 要捲起舌頭；z、c、s 舌頭平平的。n 和 l 也要分清楚。</p>
    </section>`));
    p.querySelectorAll('[data-ini]').forEach(b => b.onclick = () => say('ini_' + b.dataset.ini, D.INITIALS.find(x=>x[0]===b.dataset.ini)[1], b));
    $('#readIni').onclick = async () => { for (const b of p.querySelectorAll('[data-ini]')) { if (!document.body.contains(b)) return; await say('ini_' + b.dataset.ini, '', b); } };
    dollSay('initials', null, 'teach');
  }
  if (tab === 'finals'){
    const groups = ['單韻母','複韻母','鼻韻母','特別韻母'];
    p.append(h(`<section class="panel" style="--c:var(--mint-d)">
      <div class="panel-head"><img src="img/doll-teach.webp" alt=""><div><h2>韻母表</h2><p>點一點韻母，聽聽例字的讀音。</p></div></div>
      ${groups.map(g => `<h3 class="sub-h">${g}</h3><div class="tiles">${D.FINALS.filter(f=>f[1]===g).map(f => `<button class="tile wide" data-fin="${f[0]}"><div class="big">${f[0]}</div><div class="small">${f[3]} <span class="py">${f[4]}</span></div></button>`).join('')}</div>`).join('')}
      <h3 class="sub-h" style="--c:var(--sun-d)">i 行韻母（第二課）</h3>
      <p class="rule">i 行的韻母前面<b>沒有聲母</b>時：<b>i → yi</b>、<b>in → yin</b>、<b>ing → ying</b>；其他把 <b>i 改成 y</b>，例如 ia → ya、iou → you。</p>
      <div class="yw-row" style="margin-top:12px;--c:var(--sun-d)">${['i'].concat(D.FINALS.filter(f=>f[1]==='i 行韻母').map(f=>f[0])).map(k => yw(k)).join('')}</div>
      <h3 class="sub-h" style="--c:var(--sky)">u 行韻母（第三課）</h3>
      <p class="rule">u 行的韻母前面<b>沒有聲母</b>時：<b>u → wu</b>；其他把 <b>u 改成 w</b>，例如 ua → wa、uei → wei、uen → wen。<br>有聲母時：uei 寫成 <b>ui</b>（guī），uen 寫成 <b>un</b>（tūn），iou 寫成 <b>iu</b>（qiū）。</p>
      <div class="yw-row" style="margin-top:12px;--c:var(--sky-d)">${['u'].concat(D.FINALS.filter(f=>f[1]==='u 行韻母').map(f=>f[0])).map(k => yw(k)).join('')}</div>
    </section>`));
    p.querySelectorAll('[data-fin]').forEach(b => b.onclick = () => { const f = D.FINALS.find(x=>x[0]===b.dataset.fin); say('fin_' + f[0], f[5], b); });
    dollSay('finals', null, 'teach');
  }
  if (tab === 'tones'){
    const curve = ['M8 14 H92','M8 40 L92 8','M8 16 L46 40 L92 8','M8 6 L92 42'];
    const names = [['第一聲','平平的 ˉ'],['第二聲','向上揚 ˊ'],['第三聲','先降再升 ˇ'],['第四聲','從高降下 ˋ']];
    p.append(h(`<section class="panel" style="--c:var(--sky-d)">
      <div class="panel-head"><img src="img/doll-teach.webp" alt=""><div><h2>四個聲調</h2><p>一聲平，二聲揚，三聲拐彎，四聲降。點一點每組字，比較聲調的分別。</p></div></div>
      <div class="tone-legend">${names.map((n,i)=>`<div class="tl"><svg viewBox="0 0 100 48"><path d="${curve[i]}" stroke="${['#ff6b5e','#ffc93c','#3fbf98','#4ea8ff'][i]}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><b>${n[0]}</b><span>${n[1]}</span></div>`).join('')}</div>
      <div class="tone-sets">${D.TONES.map((g,gi) => `<div class="tone-set">${g.map((t,ti)=>`<button class="tile" data-tone="${gi}_${ti+1}"><div class="big">${t[1]}</div><div class="small">${t[0]}</div></button>`).join('')}</div>`).join('')}</div>
      <p class="hint">小貼士：拼音的聲調符號標在主要元音上：先看 a，再看 o、e；iu、ui 標在後面那個字母上。</p>
    </section>`));
    p.querySelectorAll('[data-tone]').forEach(b => b.onclick = () => { const [gi,ti] = b.dataset.tone.split('_'); say('tone_' + b.dataset.tone, D.TONES[gi][ti-1][2], b); });
    dollSay('tones', null, 'teach');
  }
};
function yw(k){
  const f = D.FINALS.find(x=>x[0]===k); const written = f ? f[2] : (k==='i'?'yi':'wu');
  const ex = f ? `${f[3]} <span class="py">${f[4]}</span>` : (k==='i'?'衣 <span class="py">yī</span>':'烏 <span class="py">wū</span>');
  return `<button class="yw" data-fin="${k}"><div class="from">${k}</div><div class="arrow">↓</div><div class="to">${written}</div><div class="ex">${ex}</div></button>`;
}
routes.lesson = n => go('learn', 'l' + (n||1));

function renderLesson(p, n){
  const l = D.L[n]; const [c, cl] = LCOL[n];
  const speakers = [...new Set(l.dialog.map(d=>d[0]))];
  const whoCol = ['var(--coral)','var(--lav)','var(--mint)','var(--sky)'];
  p.append(h(`<section class="panel" style="--c:${c}">
    <div class="panel-head"><img src="img/doll-teach.webp" alt=""><div><h2>第${'一二三'[n-1]}課　${l.title}</h2><p class="py" style="color:${c}">${l.py}</p></div></div>
    <h3 class="sub-h">課文朗讀</h3>
    <div class="read-all"><button class="btn small" id="readAll" style="--c:${c};--cd:rgba(0,0,0,.25)">整篇聽一遍</button></div>
    <div class="dialog" style="margin-top:12px">${l.dialog.map((d,i)=>{ const si = speakers.indexOf(d[0]); return `
      <button class="line ${si%2?'alt':''}" data-d="${i}" style="--c:${whoCol[si%4]}"><span class="who">${d[0]}</span><span class="say"><div class="py">${d[2]}</div><div class="zh">${d[1]}</div></span></button>`; }).join('')}</div>
    <h3 class="sub-h">詞語</h3>
    <div class="words">${l.words.map((w,i)=>`<button class="word" data-w="w${i}"><div class="py">${w[1]}</div><div class="zh">${w[0]}</div></button>`).join('')}</div>
    <h3 class="sub-h">${l.extra_title}</h3>
    <div class="words">${l.extra.map((w,i)=>`<button class="word" data-w="x${i}"><div class="em" aria-hidden="true">${w[3]}</div><div class="py">${w[1]}</div><div class="zh">${w[0]}</div></button>`).join('')}</div>
    ${l.rhymes.length ? `<h3 class="sub-h">${n===2?'i':'u'} 行韻母兒歌</h3><div class="words">${l.rhymes.map((r,i)=>`<button class="word" data-w="r${i}"><div class="py">${r[1]}</div><div class="zh">${r[0]}</div><span class="tag">${r[3]}</span></button>`).join('')}</div>` : ''}
    ${l.quiz.length ? `<h3 class="sub-h">拼音森林（做一做）</h3><div class="words">${l.quiz.map((q,i)=>`<button class="word" data-w="q${i}"><div class="em" aria-hidden="true">${q[4]}</div><div class="py">${q[1]}</div><div class="zh">${q[0]}</div></button>`).join('')}</div>` : ''}
    <div style="margin-top:26px;display:flex;gap:12px;flex-wrap:wrap">
      <button class="btn mint" data-go="game" data-arg="listen">玩「聽音找拼音」</button>
      <button class="btn sun" data-go="game" data-arg="memory">玩「翻牌好朋友」</button>
    </div>
  </section>`));
  p.querySelectorAll('[data-d]').forEach(b => b.onclick = () => say(`l${n}_d${b.dataset.d}`, l.dialog[b.dataset.d][3], b));
  p.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { const k = b.dataset.w; const arr = {w:l.words,x:l.extra,r:l.rhymes,q:l.quiz}[k[0]]; const it = arr[+k.slice(1)]; say(`l${n}_${k}`, k[0]==='q' ? it[3] : it[2], b); });
  $('#readAll').onclick = async () => { for (const b of p.querySelectorAll('[data-d]')) { if (!document.body.contains(b)) return; await say(`l${n}_d${b.dataset.d}`, l.dialog[b.dataset.d][3], b); await new Promise(r=>setTimeout(r,350)); } };
  dollSay('lesson', null, 'teach');
}

/* ---------------- GAMES HUB ---------------- */
routes.games = () => {
  app.innerHTML = '';
  app.append(h(`
    <div class="panel-head"><img src="img/doll-cheer.webp" alt="" style="width:96px"><div><h2 style="font-size:clamp(1.6rem,3vw,2.2rem)">遊戲樂園</h2><p>每個遊戲 8 題，完成得一顆星星，全對再多送一顆。星星可以去貼紙簿換貼紙包。</p></div></div>
    <div class="grid g3">${GAMES.map(g=>`
      <button class="card game-card" style="--c:${g.c};--cl:${g.cl}" data-go="game" data-arg="${g.id}">
        <div class="ic">${g.ic}</div><div><h3>${g.name}${g.isNew ? '<span class="new-tag">新</span>' : ''}</h3><p>${g.desc}</p></div>
        ${S.done[g.id] ? `<span class="done">${starSvg}</span>` : ''}
      </button>`).join('')}</div>
    <div class="card" style="margin-top:22px;display:flex;align-items:center;gap:16px;background:var(--lav-l)">
      <img src="img/baby-sleep.webp" alt="" style="width:90px">
      <div><h3>學累了嗎？Neko 陪你休息一下</h3><p style="color:var(--ink-2);margin-top:4px">玩了一會兒，記得休息眼睛，喝口水。</p></div>
      <button class="btn lav small" style="margin-left:auto" id="restBtn">休息一下</button>
    </div>`));
  $('#restBtn').onclick = () => { modal({ img:'sleep', title:'休息一下', text:DOLL_TC.rest, actions:[['好的','lav']] }); nekoSay('rest'); };
  dollSay('games', null, 'cheer');
};

/* ---------------- GAME ENGINE ---------------- */
function allVocab(){
  const out = [];
  [1,2,3].forEach(n => { const l = D.L[n];
    l.words.forEach((w,i)=>out.push({ id:`l${n}_w${i}`, zh:w[0], py:w[1], tts:w[2], n }));
    l.extra.forEach((w,i)=>out.push({ id:`l${n}_x${i}`, zh:w[0], py:w[1], tts:w[2], em:w[3], n }));
    l.quiz.forEach((w,i)=>out.push({ id:`l${n}_q${i}`, zh:w[0], py:w[1], tts:w[3], em:w[4], wrong:w[2], n }));
  });
  return out;
}
function frame(g, total){
  document.body.classList.add('in-game');
  app.innerHTML = '';
  app.append(h(`<button class="btn ghost small back" data-go="games">← 返回遊戲樂園</button>
    <section class="stage"><div class="stage-top"><h2>${g.name}</h2><div class="progress"><i id="prog" style="width:0"></i></div><span class="score" id="score">0 / ${total}</span></div><div id="body"></div></section>`));
  return $('#body');
}
function runGame(gid, rounds, renderRound){
  const g = GAMES.find(x=>x.id===gid);
  const body = frame(g, rounds.length);
  let i = 0, right = 0, first = true;
  const next = () => {
    if (!document.body.contains(body)) return;
    $('#prog').style.width = (i / rounds.length * 100) + '%';
    $('#score').textContent = `${right} / ${rounds.length}`;
    if (i >= rounds.length) return finish();
    body.innerHTML = '';
    first = true;
    renderRound(body, rounds[i], {
      correct(){ if (first) right++; i++; praise(); confetti(); setTimeout(next, 1300); },
      wrong(){ first = false; comfort(); }
    });
  };
  const finish = () => {
    const was = S.done[gid];
    const bonus = right === rounds.length ? 1 : 0;
    S.done[gid] = true; S.stars += 1 + bonus; S.plays += 1; save(); updBadge();
    confetti();
    $('#prog').style.width = '100%';
    say('doll_finish', D.DOLL.finish).then(() => document.querySelector('#modal:not([hidden])') && nekoSay('finish'));
    modal({ img:'clap', title: bonus ? '全對了，太厲害了！' : '完成了！', text:`你答對了 ${right} / ${rounds.length} 題，得到${bonus ? '兩顆星星（全對多送一顆）' : '一顆星星'}，可以打開${bonus ? '兩' : '一'}個貼紙包！${S.plays % 3 === 0 ? '玩了幾個遊戲，休息一下眼睛吧。' : ''}`,
      actions:[['開貼紙包','sun',()=>go('book')],['再玩一次','mint',()=>routes.game(gid)],['返回遊戲樂園','',()=>go('games')]] });
    setDoll('cheer');
  };
  dollSay('g_' + gid, null, 'think').then(() => {});
  next();
}

const ROUNDS = 8;
const GAME_IMPL = {
  listen(){
    const pool = allVocab();
    const rounds = pick(pool, ROUNDS).map(it => {
      const opts = new Set([it.py]);
      if (it.wrong) opts.add(it.wrong);
      let tries = 0;
      while (opts.size < 3 && tries++ < 20){ const v = Math.random() < .55 ? toneVariant(it.py) : soundVariant(it.py); if (v && v !== it.py) opts.add(v); }
      while (opts.size < 3){ opts.add(pick(pool,1)[0].py); }
      return { it, opts: shuffle([...opts]) };
    });
    runGame('listen', rounds, (body, r, cb) => {
      body.append(h(`<p class="q-prompt">聽一聽，選出正確的拼音</p>
        <button class="speaker pulse" id="sp" aria-label="再聽一次">${speakerSvg}</button>
        ${r.it.em ? `<div class="emoji-pic" aria-hidden="true">${r.it.em}</div>` : ''}
        <div class="big-hanzi" style="font-size:clamp(2.4rem,6vw,3.6rem)">${r.it.zh}</div>
        <div class="opts" style="margin-top:16px">${r.opts.map(o=>`<button class="opt" data-o="${o}">${o}</button>`).join('')}</div>`));
      const play = () => say(r.it.id, r.it.tts);
      $('#sp', body).onclick = play; setTimeout(play, 500);
      body.querySelectorAll('.opt').forEach(b => b.onclick = () => { if (b.dataset.o === r.it.py){ b.classList.add('ok'); cb.correct(); } else { b.classList.add('no'); setTimeout(()=>b.classList.remove('no'),500); cb.wrong(); setTimeout(play, 1600); } });
    });
  },
  tone(){
    const rounds = Array.from({length:ROUNDS}, () => { const gi = Math.floor(Math.random()*D.TONES.length); const t = 1 + Math.floor(Math.random()*4); return { gi, t }; });
    const cols = ['var(--coral)','var(--sun-d)','var(--mint)','var(--sky)'];
    runGame('tone', rounds, (body, r, cb) => {
      const set = D.TONES[r.gi];
      body.append(h(`<p class="q-prompt">聽一聽是第幾聲，點正確的氣球</p>
        <button class="speaker pulse" id="sp" aria-label="再聽一次">${speakerSvg}</button>
        <div class="skybox" id="sky"></div>`));
      const sky = $('#sky', body);
      const order = shuffle([1,2,3,4]);
      order.forEach((t, k) => {
        const b = document.createElement('button');
        b.className = 'balloon'; b.style.left = `${3 + k*24}%`; b.style.setProperty('--c', cols[t-1]);
        b.style.bottom = (40 + Math.random()*90) + 'px'; b.style.animationDelay = (-Math.random()*2.6) + 's'; b.style.animationDuration = (2.2 + Math.random()) + 's';
        b.innerHTML = `<div class="b">${set[t-1][1]}</div><div class="s"></div>`;
        b.setAttribute('aria-label', `第${t}聲 ${set[t-1][1]}`);
        b.onclick = () => { if (t === r.t){ b.classList.add('popped'); cb.correct(); } else { b.classList.add('wrong'); setTimeout(()=>b.classList.remove('wrong'),500); cb.wrong(); setTimeout(play,1600); } };
        sky.appendChild(b);
      });
      const play = () => say(`tone_${r.gi}_${r.t}`, set[r.t-1][2]);
      $('#sp', body).onclick = play; setTimeout(play, 500);
    });
  },
  initial(){
    const CONF = { zh:['z','ch','sh'], ch:['c','zh','q'], sh:['s','x','zh'], z:['zh','c','s'], c:['ch','z','s'], s:['sh','x','c'], n:['l','m','r'], l:['n','r','d'], b:['p','d','m'], p:['b','f','t'], d:['t','b','n'], t:['d','k','p'], g:['k','h','d'], k:['g','h','t'], h:['f','k','x'], f:['h','b','p'], j:['q','x','zh'], q:['j','x','ch'], x:['sh','q','s'], r:['l','sh','y'], m:['n','b','f'], y:['w','j','r'], w:['y','h','f'] };
    const rounds = pick(D.INITIALS.map(x=>x[0]), ROUNDS).map(k => ({ k, opts: shuffle([k, ...CONF[k]]) }));
    runGame('initial', rounds, (body, r, cb) => {
      body.append(h(`<p class="q-prompt">Susu 讀的是哪一個聲母？</p>
        <button class="speaker pulse" id="sp" aria-label="再聽一次">${speakerSvg}</button>
        <div class="opts" style="grid-template-columns:repeat(4,1fr);max-width:600px">${r.opts.map(o=>`<button class="opt" data-o="${o}">${o}</button>`).join('')}</div>`));
      const play = () => say('ini_' + r.k, D.INITIALS.find(x=>x[0]===r.k)[1]);
      $('#sp', body).onclick = play; setTimeout(play, 500);
      body.querySelectorAll('.opt').forEach(b => b.onclick = () => { say('ini_' + b.dataset.o, ''); if (b.dataset.o === r.k){ b.classList.add('ok'); cb.correct(); } else { b.classList.add('no'); setTimeout(()=>b.classList.remove('no'),500); cb.wrong(); } });
    });
  },
  yw(){
    const keys = ['i','u','ü'].concat(D.FINALS.filter(f=>/行/.test(f[1])).map(f=>f[0]));
    const writ = k => ({i:'yi',u:'wu','ü':'yu'})[k] || D.FINALS.find(f=>f[0]===k)[2];
    const rounds = pick(keys, ROUNDS).map(k => {
      const ok = writ(k); const isI = k[0]==='i' || k==='ü';
      const cand = new Set([ok]);
      const alts = isI ? ['y'+k, k, 'y'+k.slice(1), k.replace('i','y')+'i', 'w'+k.slice(1)] : ['w'+k, k, 'w'+k.slice(1)+'u', 'y'+k.slice(1)];
      if (k==='ü') alts.unshift('yü','wu');
      shuffle(alts).forEach(a => { if (cand.size < 3 && a && a !== ok) cand.add(a); });
      return { k, ok, opts: shuffle([...cand]) };
    });
    runGame('yw', rounds, (body, r, cb) => {
      const f = D.FINALS.find(x=>x[0]===r.k);
      const id = f ? 'fin_' + r.k : (r.k==='i' ? 'fin_i' : r.k==='u' ? 'fin_u' : 'fin_ü');
      body.append(h(`<p class="q-prompt">前面沒有聲母時，<b style="font-family:var(--py);font-size:1.6rem;color:var(--lav-d)">${r.k}</b> 要寫成甚麼？</p>
        <button class="speaker" id="sp" aria-label="聽一聽" style="width:84px;height:84px">${speakerSvg}</button>
        <div class="opts" style="max-width:560px">${r.opts.map(o=>`<button class="opt" data-o="${o}">${o}</button>`).join('')}</div>
        <p class="hint">記住：i 行換 y，u 行換 w；i、in、ing 前面加 y，u 前面加 w，ü 寫成 yu。</p>`));
      const play = () => say(id, f ? f[5] : '');
      $('#sp', body).onclick = play;
      body.querySelectorAll('.opt').forEach(b => b.onclick = () => { if (b.dataset.o === r.ok){ b.classList.add('ok'); play(); cb.correct(); } else { b.classList.add('no'); setTimeout(()=>b.classList.remove('no'),500); cb.wrong(); } });
    });
  },
  memory(){
    const g = GAMES.find(x=>x.id==='memory');
    const body = frame(g, 6);
    const items = pick(allVocab().filter(v => v.zh.length <= 4), 6);
    const cards = shuffle(items.flatMap((it, i) => [{ i, t:it.zh, kind:'zh', it }, { i, t:it.py, kind:'py', it }]));
    body.append(h(`<p class="q-prompt">翻兩張卡，找出漢字和拼音的好朋友</p><div class="mem">${cards.map((c,k)=>`<button class="mcard" data-k="${k}" aria-label="卡片"><div class="in"><div class="f"></div><div class="b ${c.kind==='py'?'py':''}">${c.t}</div></div></button>`).join('')}</div>`));
    let open = [], matched = 0, lock = false, tries = 0;
    body.querySelectorAll('.mcard').forEach(el => el.onclick = () => {
      if (lock || el.classList.contains('flip') || el.classList.contains('match')) return;
      const c = cards[+el.dataset.k]; el.classList.add('flip'); open.push([el, c]);
      say(c.it.id, c.it.tts);
      if (open.length === 2){
        tries++; lock = true;
        const [[e1,c1],[e2,c2]] = open;
        if (c1.i === c2.i && c1.kind !== c2.kind){
          setTimeout(() => { e1.classList.add('match'); e2.classList.add('match'); open = []; lock = false; matched++;
            $('#prog').style.width = (matched/6*100)+'%'; $('#score').textContent = `${matched} / 6`;
            if (matched === 6){ S.done.memory = true; S.stars++; S.plays++; save(); updBadge(); confetti(); say('doll_finish', D.DOLL.finish); setDoll('cheer');
              modal({ img:'clap', title:'全部配對成功！', text:`你用了 ${tries} 次就找齊 6 對好朋友，得到一顆星星，可以打開一個貼紙包！`, actions:[['開貼紙包','sun',()=>go('book')],['再玩一次','mint',()=>routes.game('memory')],['返回遊戲樂園','',()=>go('games')]] });
            } else { praise(); }
          }, 700);
        } else {
          setTimeout(() => { e1.classList.remove('flip'); e2.classList.remove('flip'); open = []; lock = false; }, 1200);
        }
      }
    });
    dollSay('g_memory', null, 'think');
  },
  spell(){
    const ALLI = ['b','p','m','f','d','t','n','l','g','k','h','j','q','x','zh','ch','sh','r','z','c','s'];
    const ALLF = ['a','ia','ua','uo','ie','iao','iu','ui','un','uai','uan','uang','ian','ing','in','u','an','ang'];
    const rounds = pick(D.SPELL.map((s,i)=>({ s, i })), ROUNDS).map(({s,i}) => {
      const [ch, ini, fin, tone] = s;
      const io = new Set([ini]); shuffle(ALLI).forEach(x=>{ if (io.size<4) io.add(x); });
      const fo = new Set([fin]); const near = ALLF.filter(f => f !== fin && (f.includes(fin.slice(-1)) || fin.includes(f))); shuffle(near.concat(shuffle(ALLF))).forEach(x=>{ if (fo.size<4) fo.add(x); });
      return { ch, ini, fin, tone, id:'sp_' + i, tts:s[4], io: shuffle([...io]), fo: shuffle([...fo]) };
    });
    runGame('spell', rounds, (body, r, cb) => {
      let si = null, sf = null, st = null;
      body.append(h(`<p class="q-prompt">聽一聽，把這個字的拼音拼出來</p>
        <div style="display:flex;align-items:center;justify-content:center;gap:18px"><button class="speaker" id="sp" aria-label="再聽一次" style="width:84px;height:84px;margin:0">${speakerSvg}</button><div class="big-hanzi">${r.ch}</div></div>
        <div class="answer-box" id="ans">？</div>
        <div class="spell-rows">
          <div class="spell-row"><h4>① 選聲母</h4><div class="opts">${r.io.map(o=>`<button class="opt" data-i="${o}">${o}</button>`).join('')}</div></div>
          <div class="spell-row"><h4>② 選韻母</h4><div class="opts">${r.fo.map(o=>`<button class="opt" data-f="${o}">${o}</button>`).join('')}</div></div>
          <div class="spell-row"><h4>③ 選聲調</h4><div class="opts">${[1,2,3,4].map(t=>`<button class="opt" data-t="${t}">${['ˉ','ˊ','ˇ','ˋ'][t-1]}<small style="font-size:.9rem;display:block;font-family:var(--zh);font-weight:400">第${'一二三四'[t-1]}聲</small></button>`).join('')}</div></div>
        </div>
        <button class="btn sky" id="check" style="margin-top:22px">拼好了！</button>`));
      const play = () => say(r.id, r.tts);
      $('#sp', body).onclick = play; setTimeout(play, 500);
      const upd = () => { $('#ans', body).textContent = (si||'') + (sf ? addTone(sf, st) : (st ? ['ˉ','ˊ','ˇ','ˋ'][st-1] : '')) || '？'; };
      const selr = (attr, set) => body.querySelectorAll(`[data-${attr}]`).forEach(b => b.onclick = () => { body.querySelectorAll(`[data-${attr}]`).forEach(x=>x.classList.remove('sel','no')); b.classList.add('sel'); set(b.dataset[attr]); upd(); });
      selr('i', v => si = v); selr('f', v => sf = v); selr('t', v => st = +v);
      $('#check', body).onclick = () => {
        if (!si || !sf || !st){ dollSay(null, '記得三樣都要選：聲母、韻母、聲調。', 'think'); return; }
        const ok = si === r.ini && sf === r.fin && st === r.tone;
        if (ok){ $('#ans', body).style.color = 'var(--mint-d)'; cb.correct(); }
        else {
          if (si !== r.ini) body.querySelector(`[data-i="${si}"]`).classList.add('no');
          if (sf !== r.fin) body.querySelector(`[data-f="${sf}"]`).classList.add('no');
          if (st !== r.tone) body.querySelector(`[data-t="${st}"]`).classList.add('no');
          cb.wrong(); setTimeout(play, 1700);
        }
      };
    });
  }
};
routes.game = id => { (GAME_IMPL[id] || GAME_IMPL.listen)(); };

/* ---------------- WORKBOOK (習作溫習) ---------------- */
const W = window.WB_DATA;
Object.assign(DOLL_TC, W.SUSU_TC); Object.assign(D.DOLL, W.SUSU);
Object.assign(W.NEKO, { sticker:'Neko也好喜欢这张贴纸呀！' }); Object.assign(W.NEKO_TC, { sticker:'Neko 也好喜歡這張貼紙呀！' }); Object.assign(D.DOLL, { g_mole:'小地鼠出来啦！', g_cake:'月饼掉下来啦！', g_fill:'拼音缺了一块！', g_code:'听一听这个词语！', sticker_new:'你得到一张新贴纸！', sticker_pack:'你有贴纸包可以打开哦！', book:'这是你的贴纸簿！' });
function nekoSay(key){
  const b = $('#bubble'), buddy = $('#buddy');
  b.textContent = W.NEKO_TC[key] || ''; b.classList.add('show'); setDoll('clap'); buddy.classList.add('talk','neko');
  clearTimeout(bubbleT);
  return say('neko_' + key, W.NEKO[key]).then(() => { buddy.classList.remove('talk'); bubbleT = setTimeout(() => { b.classList.remove('show'); buddy.classList.remove('neko'); setDoll('wave'); }, 2600); });
}
const cubeSvg = '<svg viewBox="0 0 60 60" class="cube" aria-hidden="true"><path d="M30 4 56 17 30 30 4 17z" fill="#ffd43b" stroke="#333" stroke-width="2"/><path d="M4 17 30 30v26L4 43z" fill="#ff6b5e" stroke="#333" stroke-width="2"/><path d="M56 17 30 30v26l26-13z" fill="#4ea8ff" stroke="#333" stroke-width="2"/><path d="M12.7 12.7 39 25.7M21.3 8.4 47.4 21.3M12.7 21.3 38.7 8.4M21.3 25.7 47.3 12.7M4 25.7l26 13M4 34.3l26 13M12.7 21.3v26M21.3 25.7v26M56 25.7l-26 13M56 34.3l-26 13M47.3 21.3v26M38.7 25.7v26" stroke="#333" stroke-width="1.6" fill="none"/></svg>';
const picEm = e => e === 'CUBE' ? cubeSvg : e;
const WB_DONE = {};
function wbStar(key){ if (WB_DONE[key]) return; WB_DONE[key] = true; S.stars++; save(); updBadge(); confetti(); nekoSay('cheer'); }

routes.wb = (tab='1') => {
  app.innerHTML = '';
  const n = +tab || 1; const u = W.WB[n]; const c = LCOL[n][0];
  app.append(h(`<div class="tabs" role="tablist">${[1,2,3].map(k=>`<button class="tab ${k===n?'on':''}" data-go="wb" data-arg="${k}">習作 ${k}　${W.WB[k].title}</button>`).join('')}</div>
  <section class="panel wb" style="--c:${c}">
    <div class="panel-head"><img src="img/doll-teach.webp" alt=""><div><h2>習作 ${n}　${u.title}（${u.sub}）</h2><p>根據普通話習作溫習：聽前準備、仔細聽、練語音。考試時會聽錄音答題，所以先聽，再看文字。</p></div></div>
    <h3 class="sub-h">聽前準備</h3>
    <div class="words">${u.pre.map((w,i)=>`<button class="word" data-p="${i}"><div class="em" aria-hidden="true">${w[3]}</div><div class="py">${w[1]}</div><div class="zh">${w[0]}</div></button>`).join('')}</div>
    <h3 class="sub-h">仔細聽</h3>
    <div class="listen-bar">
      <button class="btn small" id="playDlg" style="--c:${c};--cd:rgba(0,0,0,.25)">播放對話</button>
      <button class="btn ghost small" id="showTxt" aria-pressed="false">顯示對話文字</button>
      <span class="cast">${Object.keys(u.cast).map(k=>`<b>${k}</b>`).join(' 和 ')}的對話</span>
    </div>
    <div class="dialog wb-dialog hide-txt" id="dlg">${u.dialog.map((d,i)=>{ const si = Object.keys(u.cast).indexOf(d[0]); return `
      <button class="line ${si%2?'alt':''}" data-d="${i}" style="--c:${['var(--coral)','var(--lav)','var(--mint)'][si]}"><span class="who">${d[0]}</span><span class="say"><div class="zh">${d[1]}</div><div class="zh mask">第 ${i+1} 句　點一點，再聽一次</div></span></button>`; }).join('')}</div>
    <div class="qs" id="qs">${u.qs.map((q,qi)=>`<div class="q" data-q="${qi}"><p class="qt"><b>${qi+1}.</b> ${q.q}</p><div class="qopts ${q.o.some(o=>o[0])?'pic':''}">${q.o.map((o,oi)=>`<button class="qo" data-o="${oi}"><span class="lt">${'ABCD'[oi]}</span>${o[0]?`<span class="em">${o[0]}</span>`:''}<span>${o[1]}</span></button>`).join('')}</div></div>`).join('')}</div>
    <div class="check-row"><button class="btn mint" id="chk">核對答案</button><span id="chkMsg"></span></div>
    <p class="hint" id="note" hidden>${u.note}</p>
    <h3 class="sub-h">練語音</h3>
    <div id="practice"></div>
  </section>`));
  const p = $('.wb');
  p.querySelectorAll('[data-p]').forEach(b => b.onclick = () => say(`wb${n}_p${b.dataset.p}`, u.pre[b.dataset.p][2], b));
  p.querySelectorAll('[data-d]').forEach(b => b.onclick = () => say(`wb${n}_d${b.dataset.d}`, u.dialog[b.dataset.d][2], b));
  $('#playDlg').onclick = async () => { for (const b of p.querySelectorAll('[data-d]')) { if (!document.body.contains(b)) return; await say(`wb${n}_d${b.dataset.d}`, u.dialog[b.dataset.d][2], b); await new Promise(r=>setTimeout(r,450)); } };
  $('#showTxt').onclick = e => { const on = $('#dlg').classList.toggle('hide-txt'); e.currentTarget.textContent = on ? '顯示對話文字' : '隱藏對話文字'; e.currentTarget.setAttribute('aria-pressed', !on); };
  p.querySelectorAll('.q').forEach(qe => { const q = u.qs[+qe.dataset.q]; const multi = q.a.length > 1;
    qe.querySelectorAll('.qo').forEach(b => b.onclick = () => { qe.querySelectorAll('.qo').forEach(x=>x.classList.remove('ok','no')); if (!multi) qe.querySelectorAll('.qo').forEach(x=>x!==b && x.classList.remove('sel')); b.classList.toggle('sel'); }); });
  $('#chk').onclick = () => {
    let right = 0;
    p.querySelectorAll('.q').forEach(qe => { const q = u.qs[+qe.dataset.q];
      const sel = [...qe.querySelectorAll('.qo.sel')].map(b=>+b.dataset.o);
      const ok = sel.length === q.a.length && q.a.every(a => sel.includes(a));
      if (ok) right++;
      qe.classList.toggle('right', ok); qe.classList.toggle('wrongq', !ok);
      qe.querySelectorAll('.qo').forEach(b => { const o = +b.dataset.o; b.classList.toggle('ok', ok && q.a.includes(o)); b.classList.toggle('no', !ok && sel.includes(o) && !q.a.includes(o)); });
    });
    $('#chkMsg').textContent = `答對 ${right} / ${u.qs.length} 題` + (right === u.qs.length ? '，全對了！' : '，再聽一次對話，改一改吧。');
    $('#note').hidden = false;
    if (right === u.qs.length){ praise(); wbStar('q'+n); } else comfort();
  };
  ({1:practice1, 2:practice2, 3:practice3})[n]($('#practice'));
  dollSay('wb', null, 'teach');
};

/* 習作 1：拼音配圖畫（三關） */
function practice1(box){
  box.append(h(`<div class="act"><h4>聽錄音，把拼音和相關的圖片配起來（三關）</h4>
    <div class="pic-row" id="pyRow">${W.PIC_Q.map((pi,k)=>`<button class="pychip" data-k="${k}"><small>${k<1?'第一關':k<3?'第二關':'第三關'}</small>${W.PIC[pi][0]}</button>`).join('')}</div>
    <p class="act-tip" id="picTip">先點一個拼音，聽一聽，再點正確的圖片。</p>
    <div class="pic-grid" id="picGrid">${shuffle(W.PIC.map((x,i)=>i)).map(i=>`<button class="picc" data-i="${i}"><span class="em">${picEm(W.PIC[i][2])}</span><span class="lb">${W.PIC[i][3]}</span></button>`).join('')}</div></div>`));
  let curK = null, done = 0;
  const chips = box.querySelectorAll('.pychip');
  chips.forEach(c => c.onclick = () => { if (c.classList.contains('done')) return; chips.forEach(x=>x.classList.remove('sel')); c.classList.add('sel'); curK = +c.dataset.k; say('wbpic_' + W.PIC_Q[curK], W.PIC[W.PIC_Q[curK]][1], c); });
  box.querySelectorAll('.picc').forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    if (curK === null){ say('wbpic_' + i, W.PIC[i][1], b); $('#picTip').textContent = '先點上面的拼音，再選圖片哦。'; return; }
    if (i === W.PIC_Q[curK]){ b.classList.add('ok','show'); const c = chips[curK]; c.classList.remove('sel'); c.classList.add('done'); c.innerHTML += ` <span class="em">${picEm(W.PIC[i][2])}</span>`; curK = null; done++; praise();
      if (done === W.PIC_Q.length){ $('#picTip').textContent = '三關都過了！記住：mó fāng 是魔方哦。'; wbStar('pic'); } }
    else { b.classList.add('no'); setTimeout(()=>b.classList.remove('no'),500); comfort(); }
  });
}

/* 習作 2：i 行韻母月餅 + 走雲朵去月宮 */
function practice2(box){
  box.append(h(`<div class="act"><h4>一、聽錄音，把 i 行韻母填在月餅裏</h4>
    <div class="cakes">${W.IFILL.map(f=>{ const blank = W.IFILL_BLANK.includes(f); return `<button class="cake ${blank?'blank':''}" data-f="${f}"><span>${blank?'?':f}</span></button>`; }).join('')}</div>
    <div class="fill-opts" id="fillOpts" hidden><span>這個月餅是：</span>${shuffle(W.IFILL_BLANK.concat(['ie','in'])).map(f=>`<button class="opt" data-v="${f}">${f}</button>`).join('')}</div>
    <p class="act-tip" id="cakeTip">點有 ? 的月餅，聽一聽，再選出韻母。</p></div>
    <div class="act"><h4>二、聽錄音，按讀的順序走雲朵，去到真正的月宮</h4>
    <div class="clouds" id="clouds"><svg class="paths" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline id="cpath" points="" /></svg>
      <div class="castle" style="left:4%;top:1%">🏯</div><div class="castle" style="right:4%;top:1%">🏯</div>
      ${W.CLOUDS.map((c,i)=>`<button class="cloud" data-i="${i}" style="left:${[22,72,14,48,82,18,53,84,30,65][i]}%;top:${[10,10,32,32,32,54,54,54,76,76][i]}%"><span class="py">${c[0]}</span><span class="zh">${c[1]}</span></button>`).join('')}
      <div class="startpt" style="left:50%;top:95%">開始</div></div>
    <div class="check-row"><button class="btn sky small" id="nextCloud">聽下一朵雲</button><span id="cloudTip">按「聽下一朵雲」開始。</span></div></div>`));
  // cakes
  let curF = null; const opts = $('#fillOpts'); let filled = 0;
  box.querySelectorAll('.cake').forEach(c => c.onclick = () => { const f = c.dataset.f; say('fin_' + f, f, c); if (c.classList.contains('blank')){ box.querySelectorAll('.cake').forEach(x=>x.classList.remove('sel')); c.classList.add('sel'); curF = c; opts.hidden = false; } });
  opts.querySelectorAll('.opt').forEach(o => o.onclick = () => { if (!curF) return;
    if (o.dataset.v === curF.dataset.f){ curF.classList.remove('blank','sel'); curF.classList.add('filled'); curF.querySelector('span').textContent = curF.dataset.f; curF = null; opts.hidden = true; filled++; praise();
      if (filled === W.IFILL_BLANK.length){ $('#cakeTip').textContent = '月餅都填好了：ia、iao、ian、iang、iong。'; wbStar('cake'); } }
    else { o.classList.add('no'); setTimeout(()=>o.classList.remove('no'),500); comfort(); } });
  // clouds
  let step = 0; const pts = [[50,95]]; const pos = i => { const el = box.querySelector(`.cloud[data-i="${i}"]`); return [parseFloat(el.style.left), parseFloat(el.style.top)]; };
  const playStep = () => { if (step < W.CLOUD_PATH.length){ const i = W.CLOUD_PATH[step]; say('wbcl_' + i, W.CLOUDS[i][2]); $('#cloudTip').textContent = `第 ${step+1} 朵雲：聽一聽，點正確的雲朵。`; } };
  $('#nextCloud').onclick = playStep;
  box.querySelectorAll('.cloud').forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    if (step >= W.CLOUD_PATH.length || step === 0 && !$('#cloudTip').textContent.startsWith('第')){ say('wbcl_' + i, W.CLOUDS[i][2], b); return; }
    if (i === W.CLOUD_PATH[step]){ b.classList.add('ok'); pts.push(pos(i)); $('#cpath').setAttribute('points', pts.map(p=>p.join(',')).join(' ')); step++;
      if (step === W.CLOUD_PATH.length){ $('#cloudTip').textContent = '到達月宮了！順序是：謎、家、心、永、遊、面、想。'; box.querySelectorAll('.castle')[1].classList.add('win'); dollSay('wb_moon_done', null, 'cheer'); wbStar('cloud'); }
      else { praise(); setTimeout(playStep, 1500); } }
    else { b.classList.add('no'); setTimeout(()=>b.classList.remove('no'),500); comfort(); setTimeout(playStep, 1700); }
  });
}

/* 習作 3：u 行韻母連線聖誕樹 + 圈韻母 */
function practice3(box){
  const P = { u0:[6,93], u1:[30,67], uo:[10,67], ua:[34,40], uai:[16,40], uei:[50,6], uang:[84,40], ueng:[66,40], uan:[92,67], uen:[72,67], u9:[96,93], ei:[12,12], eng:[56,26], ai:[14,54], an:[64,54], ang:[86,16] };
  const seqKeys = ['u1','uo','ua','uai','uei','uang','ueng','uan','uen','u9'];
  const dots = Object.entries(P).filter(([k])=>k!=='u0');
  box.append(h(`<div class="act"><h4>一、聽錄音，按所讀的順序把韻母連起來，看看畫了甚麼畫兒</h4>
    <div class="tree" id="tree"><svg viewBox="0 0 100 100" preserveAspectRatio="none" class="paths"><polygon id="tfill" points="" /><polyline id="tpath" points="6,93" /><rect id="trunk" x="42" y="93" width="16" height="7" /></svg>
      ${dots.map(([k,[x,y]])=>`<button class="dot" data-k="${k}" style="left:${x}%;top:${y}%"><i></i><span>${({uei:'uei (ui)',uen:'uen (un)'})[k] || k.replace(/\d/,'')}</span></button>`).join('')}
      <div class="dot start" style="left:6%;top:93%"><i></i></div><div class="startpt" style="left:9%;top:84%">開始 →</div></div>
    <div class="check-row"><button class="btn sky small" id="nextDot">聽下一個韻母</button><span id="treeTip">按「聽下一個韻母」開始。</span></div></div>
    <div class="act"><h4>二、聽錄音，把正確的韻母圈起來</h4>
    <div class="circles">${W.CIRCLE.map((c,i)=>`<div class="circ" data-i="${i}"><button class="spk" aria-label="聽 ${c[0]}">${speakerSvg}</button><div class="zh">${c[0]}</div><div class="two">${c[3].map((f,fi)=>`<button class="opt" data-fi="${fi}">${f}</button>`).join('<span>/</span>')}</div></div>`).join('')}</div></div>`));
  let step = -1; const pts = [P.u0];
  const finOf = k => k.replace(/\d/,'');
  const playStep = () => { if (step < 0) step = 0; if (step < seqKeys.length){ const f = finOf(seqKeys[step]); say('fin_' + f, f); $('#treeTip').textContent = `第 ${step+1} 個：聽一聽，點正確的韻母。`; } };
  $('#nextDot').onclick = playStep;
  box.querySelectorAll('.dot').forEach(b => b.onclick = () => {
    const k = b.dataset.k;
    if (step < 0 || step >= seqKeys.length){ say('fin_' + finOf(k), finOf(k)); return; }
    const want = seqKeys[step];
    if (k === want){ b.classList.add('ok'); pts.push(P[k]); $('#tpath').setAttribute('points', pts.map(p=>p.join(',')).join(' ')); step++;
      if (step === seqKeys.length){ pts.push(P.u0); $('#tpath').setAttribute('points', pts.map(p=>p.join(',')).join(' ')); $('#tfill').setAttribute('points', pts.map(p=>p.join(',')).join(' ')); $('#tree').classList.add('done'); $('#treeTip').textContent = '是一棵聖誕樹！順序：u、uo、ua、uai、uei、uang、ueng、uan、uen、u。'; dollSay('wb_tree_done', null, 'cheer'); wbStar('tree'); }
      else { praise(); setTimeout(playStep, 1500); } }
    else { b.classList.add('no'); setTimeout(()=>b.classList.remove('no'),500); comfort(); setTimeout(playStep, 1700); }
  });
  let cdone = 0;
  box.querySelectorAll('.circ').forEach(ce => { const c = W.CIRCLE[+ce.dataset.i]; const play = () => say('wbci_' + ce.dataset.i, c[2]);
    ce.querySelector('.spk').onclick = play; ce.querySelector('.zh').onclick = play;
    ce.querySelectorAll('.opt').forEach(o => o.onclick = () => { if (ce.classList.contains('done')) return;
      if (+o.dataset.fi === c[4]){ o.classList.add('ok','circled'); ce.classList.add('done'); ce.querySelector('.zh').innerHTML = `${c[0]}<small class="py">${c[1]}</small>`; play(); cdone++; if (cdone === W.CIRCLE.length) wbStar('circle'); else praise(); }
      else { o.classList.add('no'); setTimeout(()=>o.classList.remove('no'),500); comfort(); } }); });
}

/* ---------------- STICKER BOOK (貼紙簿) ---------------- */
const STICKERS = [
  ['p_wave','Susu 打招呼','img/doll-wave.webp',0],['p_clap','Neko 拍拍手','img/baby-clap.webp',0],['p_teach','Susu 小老師','img/doll-teach.webp',0],
  ['p_cheer','Susu 好開心','img/doll-cheer.webp',0],['p_think','Susu 想一想','img/doll-think.webp',0],['p_sleep','Neko 睡覺覺','img/baby-sleep.webp',0],
  ['st_moon','中秋提燈籠','img/stk/st_moon.webp',1],['st_palace','飛上月宮','img/stk/st_palace.webp',1],['st_space','太空飛船','img/stk/st_space.webp',1],
  ['st_beach','海邊拾貝殼','img/stk/st_beach.webp',1],['st_art','視藝課畫花兒','img/stk/st_art.webp',1],['st_park','公園野餐','img/stk/st_park.webp',1],
  ['st_sport','運動會','img/stk/st_sport.webp',1],['st_birthday','生日派對','img/stk/st_birthday.webp',1],['st_snow','下雪堆雪人','img/stk/st_snow.webp',1],
  ['st_fairy','花園小仙子','img/stk/st_fairy.webp',2],['st_xmas','聖誕樹','img/stk/st_xmas.webp',2],['st_teacher','普通話小博士','img/stk/st_teacher.webp',2]
];
const RAR = ['普通','漂亮','閃亮'];
const stkById = id => STICKERS.find(s => s[0] === id);
const packs = () => Math.max(0, Math.min(S.stars - S.stickers.length, STICKERS.length - S.stickers.length));
function updBadge(){ const b = $('#bookBadge'); if (!b) return; const n = packs(); b.textContent = n; b.hidden = !n; }
function earn(n=1, why=''){ S.stars += n; save(); updBadge(); }
function stickerImg(s, cls=''){ return `<div class="stk ${s[3]?'scene':'pose'} r${s[3]} ${cls}"><img src="${s[2]}" alt="${s[1]}" loading="lazy" draggable="false"></div>`; }

const BOARDS = [['park','公園','linear-gradient(#bfe6ff 0 55%,#9be08f 55%)'],['night','月夜','radial-gradient(circle at 78% 22%,#fff6c9 0 8%,transparent 9%),linear-gradient(#26305c,#5a4c8f)'],['sea','海邊','linear-gradient(#bfe6ff 0 45%,#5ec4f0 45% 70%,#ffe2a8 70%)'],['class','課室','linear-gradient(#fff3e0 0 70%,#d9a877 70%)']];
routes.book = (tab='album') => {
  app.innerHTML = '';
  const got = S.stickers.length, n = packs();
  app.append(h(`<div class="panel-head"><img src="img/baby-clap.webp" alt="" style="width:90px"><div><h2 style="font-size:clamp(1.6rem,3vw,2.2rem)">我的貼紙簿</h2><p>每得到一顆星星，就可以打開一個貼紙包。全對還會多送一顆星星。</p></div></div>
  <section class="pack-zone">
    <button class="pack ${n?'has':''}" id="openPack" ${n?'':'disabled'}><span class="foil"></span><span class="pk-t">貼紙包</span><span class="pk-n">${n}</span></button>
    <div class="pack-info"><h3>${got >= STICKERS.length ? '全部貼紙集齊了，你真厲害！' : n ? `你有 ${n} 個貼紙包可以打開` : '去玩遊戲、做習作，贏星星換貼紙包吧'}</h3>
      <div class="meter"><i style="width:${got/STICKERS.length*100}%"></i></div><p>已收集 <b>${got}</b> / ${STICKERS.length} 張</p>
      ${n ? '' : '<div class="cta"><button class="btn mint small" data-go="games">去遊戲樂園</button><button class="btn sky small" data-go="wb">去習作溫習</button></div>'}</div>
  </section>
  <div class="tabs"><button class="tab ${tab==='album'?'on':''}" data-go="book" data-arg="album">收集冊</button><button class="tab ${tab==='board'?'on':''}" data-go="book" data-arg="board">貼紙畫板</button></div>
  <div id="bookBody"></div>`));
  const body = $('#bookBody');
  if (tab === 'board') renderBoard(body); else {
    body.append(h(`<div class="album">${STICKERS.map((s,i)=>{ const has = S.stickers.includes(s[0]); return `<div class="slot ${has?'got':''}"><span class="no">${i+1}</span>${has ? stickerImg(s) : `<div class="stk locked ${s[3]?'scene':'pose'}"><img src="${s[2]}" alt="" loading="lazy"></div>`}<p>${has ? s[1] : '？？？'}</p>${has && s[3]?`<span class="rar r${s[3]}">${RAR[s[3]]}</span>`:''}</div>`; }).join('')}</div>`));
  }
  $('#openPack').onclick = openPack;
  dollSay(n ? 'sticker_pack' : 'book', null, 'cheer');
};
function openPack(){
  if (!packs()) return;
  const left = STICKERS.filter(s => !S.stickers.includes(s[0]));
  // rarer stickers come a bit later so there is always something to look forward to
  const w = left.map(s => s[3]===2 ? (S.stickers.length > 8 ? 2 : .4) : s[3]===1 ? 2 : 1.4);
  let r = Math.random() * w.reduce((a,b)=>a+b,0), s = left[0];
  for (let i=0;i<left.length;i++){ r -= w[i]; if (r <= 0){ s = left[i]; break; } }
  S.stickers.push(s[0]); save(); updBadge();
  const ov = h(`<div class="reveal" id="reveal"><div class="rv-card"><div class="rv-inner"><div class="rv-back"><span>?</span></div><div class="rv-front">${stickerImg(s)}<h3>${s[1]}</h3>${s[3]?`<span class="rar r${s[3]}">${RAR[s[3]]}</span>`:''}</div></div></div>
    <div class="rv-actions"><button class="btn mint" id="rvOk">貼進貼紙簿</button>${packs()?`<button class="btn sun" id="rvMore">再開一包（${packs()}）</button>`:''}</div></div>`);
  document.body.append(ov);
  setTimeout(() => { $('#reveal .rv-card').classList.add('flip'); confetti(); say('doll_sticker_new', '').then(() => nekoSay('sticker')); }, 500);
  $('#rvOk').onclick = () => { $('#reveal').remove(); routes.book('album'); };
  const m = $('#rvMore'); if (m) m.onclick = () => { $('#reveal').remove(); openPack(); };
}
function renderBoard(body){
  const own = STICKERS.filter(s => S.stickers.includes(s[0]));
  const bg = BOARDS.find(b => b[0] === S.boardBg) || BOARDS[0];
  body.append(h(`<p class="hint" style="margin:6px 0 12px">點一下或拖動下面的貼紙，把它貼到畫板上，自己砌一幅圖畫。點一下畫板上的貼紙可以轉一轉，拖出畫板就會拿走。</p>
    <div class="bg-pick">${BOARDS.map(b=>`<button class="chip ${b===bg?'on':''}" data-bg="${b[0]}">${b[1]}</button>`).join('')}<button class="chip" id="clearBoard">清空畫板</button></div>
    <div class="board" id="board" style="background:${bg[2]}"></div>
    <div class="tray">${own.length ? own.map(s=>`<button class="tray-i" data-id="${s[0]}">${stickerImg(s)}</button>`).join('') : '<p class="hint">還未有貼紙，先去打開貼紙包吧。</p>'}</div>`));
  const board = $('#board');
  const draw = () => { board.innerHTML = ''; S.board.forEach((p, k) => { const s = stkById(p.id); if (!s) return;
      const el = h(`<div class="placed" data-k="${k}" style="left:${p.x}%;top:${p.y}%;--rot:${p.r}deg">${stickerImg(s)}</div>`).firstElementChild; board.append(el); dragPlaced(el, k); }); };
  const dragPlaced = (el, k) => {
    let sx, sy, moved = false;
    el.onpointerdown = e => { e.preventDefault(); el.setPointerCapture(e.pointerId); sx = e.clientX; sy = e.clientY; moved = false; el.classList.add('lift'); };
    el.onpointermove = e => { if (!el.hasPointerCapture(e.pointerId)) return; if (Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy) > 6) moved = true; const b = board.getBoundingClientRect(); el.style.left = ((e.clientX-b.left)/b.width*100)+'%'; el.style.top = ((e.clientY-b.top)/b.height*100)+'%'; };
    el.onpointerup = e => { el.classList.remove('lift'); const b = board.getBoundingClientRect(); const x = (e.clientX-b.left)/b.width*100, y = (e.clientY-b.top)/b.height*100;
      if (!moved){ S.board[k].r = (S.board[k].r + 20) % 360; }
      else if (x < -5 || x > 105 || y < -5 || y > 105){ S.board.splice(k,1); }
      else { S.board[k].x = Math.max(0,Math.min(100,x)); S.board[k].y = Math.max(0,Math.min(100,y)); }
      save(); draw(); };
  };
  body.querySelectorAll('.tray-i').forEach(t => t.onpointerdown = e => {
    e.preventDefault(); const s = stkById(t.dataset.id);
    const ghost = h(`<div class="placed ghost" style="--rot:0deg">${stickerImg(s)}</div>`).firstElementChild; document.body.append(ghost);
    const mv = ev => { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }; mv(e);
    const sx = e.clientX, sy = e.clientY;
    const up = ev => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); ghost.remove();
      const b = board.getBoundingClientRect(); let x = (ev.clientX-b.left)/b.width*100, y = (ev.clientY-b.top)/b.height*100;
      if (Math.abs(ev.clientX-sx) + Math.abs(ev.clientY-sy) < 8){ x = 15 + Math.random()*70; y = 20 + Math.random()*60; }
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100){ S.board.push({ id:s[0], x, y, r:Math.round(Math.random()*30-15) }); save(); draw(); say(s[3] ? 'doll_right2' : 'doll_right3', ''); } };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  });
  body.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => { S.boardBg = b.dataset.bg; save(); routes.book('board'); });
  $('#clearBoard').onclick = () => { S.board = []; save(); draw(); };
  draw();
}

/* ---------------- NEW GAMES ---------------- */
const PY_RE = /(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?(iang|iong|uang|ueng|ang|eng|ing|ong|ian|iao|uai|uan|üan|iu|ui|un|ün|ai|ei|ao|ou|an|en|in|ia|ie|ua|uo|üe|ue|er|a|o|e|i|u|ü)(r)?/g;
function parsePy(py){
  const toned = py.toLowerCase().replace(/[^a-zāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜü]/g, '');
  const plain = [...toned].map(c => PLAIN[c] ? PLAIN[c][0] : c).join('');
  const out = []; let m, pos = 0; PY_RE.lastIndex = 0;
  while ((m = PY_RE.exec(plain))){ if (m.index !== pos) return null; pos = m.index + m[0].length;
    const span = [...toned].slice(m.index, pos); const tc = span.find(c => PLAIN[c]); out.push({ ini:m[1]||'', fin:m[2] + (m[3]||''), base:m[2], er:m[3]||'', tone: tc ? PLAIN[tc][1] : 0 }); }
  return pos === plain.length ? out : null;
}
const sylStr = s => s.ini + addTone(s.base, s.tone) + s.er;
const FIN_CONF = { an:['ang','en','ian'], ang:['an','eng','iang'], en:['eng','in','an'], eng:['en','ing','ong'], in:['ing','en','ian'], ing:['in','eng','iong'], ian:['iang','an','in'], iang:['ian','ang','iong'], uan:['uang','an','uen'], uang:['uan','ang','ueng'], un:['ong','uan','en'], ong:['eng','iong','un'], iong:['ong','iang','ing'], ia:['ie','a','ua'], ie:['ia','ei','üe'], ua:['uo','a','ia'], uo:['ua','o','ou'], uai:['ai','ui','ua'], ui:['ei','uai','iu'], iu:['ou','ui','iao'], iao:['ao','iu','ia'], ai:['ei','ao','uai'], ei:['ai','ui','ie'], ao:['ou','iao','ai'], ou:['ao','iu','uo'], a:['o','e','ia'], o:['uo','ou','e'], e:['ei','o','er'], i:['ü','ie','ei'], u:['ü','uo','ou'], ü:['u','i','üe'], ue:['ie','üe','ei'], üe:['ie','ue','ei'], er:['e','ai','a'], ün:['un','in','ing'], üan:['uan','ian','an'] };
const INI_CONF = { zh:['z','ch','j'], ch:['c','zh','q'], sh:['s','x','zh'], z:['zh','c','s'], c:['ch','z','s'], s:['sh','x','c'], n:['l','m','r'], l:['n','r','d'], b:['p','d','m'], p:['b','f','t'], d:['t','b','n'], t:['d','k','p'], g:['k','h','d'], k:['g','h','t'], h:['f','k','x'], f:['h','b','p'], j:['q','x','zh'], q:['j','x','ch'], x:['sh','q','s'], r:['l','sh','y'], m:['n','b','f'] };
function pyOpts(py, pool, n=4){
  const opts = new Set([py]); let tries = 0;
  while (opts.size < n && tries++ < 30){ const v = Math.random() < .55 ? toneVariant(py) : soundVariant(py); if (v && v !== py) opts.add(v); }
  while (opts.size < n) opts.add(pick(pool,1)[0].py);
  return shuffle([...opts]);
}
const toneSvg = t => `<svg viewBox="0 0 40 40" class="tsvg" aria-hidden="true">${['<circle cx="20" cy="22" r="5"/>','<path d="M6 12H34"/>','<path d="M8 32L32 8"/>','<path d="M6 12Q20 44 34 10"/>','<path d="M8 8L32 32"/>'][t]}</svg>`;
const TONE_NAME = ['輕聲','第一聲','第二聲','第三聲','第四聲'];

Object.assign(GAME_IMPL, {
  mole(){
    const pool = allVocab();
    const rounds = pick(pool, ROUNDS).map(it => ({ it, opts: pyOpts(it.py, pool, 4) }));
    runGame('mole', rounds, (body, r, cb) => {
      body.append(h(`<p class="q-prompt">聽一聽，打中寫着正確拼音的小地鼠</p>
        <button class="speaker pulse" id="sp" aria-label="再聽一次">${speakerSvg}</button>
        <div class="big-hanzi" style="font-size:clamp(2rem,5vw,3rem)">${r.it.zh}</div>
        <div class="garden">${r.opts.map((o,k)=>`<div class="hole"><button class="mole" data-o="${o}" style="animation-delay:${(k*0.55+Math.random()*.4).toFixed(2)}s;animation-duration:${(2.6+Math.random()*.8).toFixed(2)}s"><span class="face"><i></i><i></i><b></b></span><span class="sign">${o}</span></button><div class="mound"></div></div>`).join('')}</div>`));
      const play = () => say(r.it.id, r.it.tts);
      $('#sp', body).onclick = play; setTimeout(play, 400);
      body.querySelectorAll('.mole').forEach(b => b.onclick = () => { if (b.dataset.o === r.it.py){ b.classList.add('bonk'); body.querySelectorAll('.mole').forEach(x=>x.style.animationPlayState='paused'); cb.correct(); } else { b.classList.add('miss'); setTimeout(()=>b.classList.remove('miss'),450); cb.wrong(); setTimeout(play,1500); } });
    });
  },
  cake(){
    const keys = D.FINALS.map(f => f[0]).filter(k => k !== 'er');
    const rounds = pick(keys, ROUNDS).map(k => {
      const disp = { iou:'iu', uei:'ui', uen:'un' }[k] || k;
      const conf = (FIN_CONF[disp] || []).map(x => ({ iu:'iou', ui:'uei', un:'uen' }[x] || x)).filter(x => keys.includes(x));
      const o = new Set([k]); shuffle(conf).forEach(x => o.size < 4 && o.add(x)); shuffle(keys).forEach(x => o.size < 4 && o.add(x));
      return { k, opts: shuffle([...o]) };
    });
    runGame('cake', rounds, (body, r, cb) => {
      const f = D.FINALS.find(x => x[0] === r.k);
      body.append(h(`<p class="q-prompt">聽一聽 Susu 讀的字，它的韻母是哪一個？接住那個月餅</p>
        <button class="speaker pulse" id="sp" aria-label="再聽一次">${speakerSvg}</button>
        <div class="cakesky">${r.opts.map((o,k)=>`<button class="fcake" data-o="${o}" style="left:${4+k*24}%;animation-delay:-${(k*1.1+Math.random()*.6).toFixed(2)}s;animation-duration:${(4.6+Math.random()*1.2).toFixed(2)}s"><span>${o}</span></button>`).join('')}<img class="catcher" src="img/baby-clap.webp" alt="Neko 在下面接月餅"></div>`));
      const play = () => say('fin_' + r.k, f ? f[5] : r.k);
      $('#sp', body).onclick = play; setTimeout(play, 400);
      body.querySelectorAll('.fcake').forEach(b => b.onclick = () => { if (b.dataset.o === r.k){ b.classList.add('caught'); $('.catcher', body).classList.add('yum'); say('fin_' + r.k, ''); cb.correct(); } else { b.classList.add('miss'); setTimeout(()=>b.classList.remove('miss'),450); cb.wrong(); setTimeout(play,1500); } });
    });
  },
  fill(){
    const pool = allVocab().map(v => ({ ...v, syl: parsePy(v.py) })).filter(v => v.syl && v.syl.length && v.syl.length <= 4);
    const rounds = pick(pool, ROUNDS).map(v => {
      const cand = v.syl.map((s,i)=>i).filter(i => v.syl[i].tone || v.syl[i].ini);
      const si = pick(cand.length ? cand : [0], 1)[0]; const s = v.syl[si];
      const kinds = []; if (INI_CONF[s.ini]) kinds.push('ini'); if (FIN_CONF[s.base]) kinds.push('fin'); if (s.tone) kinds.push('tone');
      const kind = pick(kinds.length ? kinds : ['tone'], 1)[0];
      let ans, opts;
      if (kind === 'ini'){ ans = s.ini; opts = shuffle([ans, ...INI_CONF[ans]]); }
      else if (kind === 'fin'){ ans = s.base; opts = shuffle([ans, ...FIN_CONF[ans].filter(x => x !== ans)].slice(0,4)).map(x=>x); }
      else { ans = s.tone; opts = [1,2,3,4]; }
      return { v, si, s, kind, ans, opts };
    });
    runGame('fill', rounds, (body, r, cb) => {
      const show = r.v.syl.map((s,i) => { if (i !== r.si) return `<span class="syl">${sylStr(s)}</span>`;
        if (r.kind === 'ini') return `<span class="syl"><b class="gap">?</b>${addTone(s.base,s.tone)}${s.er}</span>`;
        if (r.kind === 'fin') return `<span class="syl">${s.ini}<b class="gap">?</b>${s.er}</span>`;
        return `<span class="syl">${s.ini}${s.base}${s.er}<b class="gap tone">?</b></span>`; }).join(' ');
      const lab = { ini:'聲母', fin:'韻母', tone:'聲調' }[r.kind];
      const optLabel = o => r.kind === 'tone' ? `${toneSvg(o)}<small>${TONE_NAME[o]}</small>` : r.kind === 'fin' ? addTone(o, r.s.tone) : o;
      body.append(h(`<p class="q-prompt">聽一聽，拼音缺了<b style="color:var(--coral-d)">${lab}</b>，把它補回來</p>
        <div style="display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap"><button class="speaker" id="sp" aria-label="再聽一次" style="width:84px;height:84px;margin:0">${speakerSvg}</button>${r.v.em?`<div class="emoji-pic" style="margin:0">${r.v.em}</div>`:''}<div class="big-hanzi" style="font-size:clamp(2rem,5vw,3rem)">${r.v.zh}</div></div>
        <div class="fill-py" id="fp">${show}</div>
        <div class="opts ${r.kind==='tone'?'tone-opts':''}" style="max-width:640px;grid-template-columns:repeat(4,1fr)">${r.opts.map(o=>`<button class="opt" data-o="${o}">${optLabel(o)}</button>`).join('')}</div>`));
      const play = () => say(r.v.id, r.v.tts);
      $('#sp', body).onclick = play; setTimeout(play, 400);
      body.querySelectorAll('.opt').forEach(b => b.onclick = () => { const o = r.kind === 'tone' ? +b.dataset.o : b.dataset.o;
        if (o === r.ans){ b.classList.add('ok'); $('#fp', body).innerHTML = r.v.syl.map((s,i)=>`<span class="syl ${i===r.si?'fixed':''}">${sylStr(s)}</span>`).join(' '); play(); cb.correct(); }
        else { b.classList.add('no'); setTimeout(()=>b.classList.remove('no'),500); cb.wrong(); setTimeout(play,1500); } });
    });
  },
  code(){
    const pool = allVocab().map(v => ({ ...v, syl: parsePy(v.py) })).filter(v => v.syl && v.syl.length === 2 && !v.syl.some(s => s.er));
    const pat = v => v.syl.map(s => s.tone);
    const rounds = pick(pool, ROUNDS).map(v => {
      const p = pat(v); const key = p.join('');
      const o = new Map([[key, p]]); let t = 0;
      while (o.size < 4 && t++ < 60){ const q = p.slice(); const i = Math.random() < .5 ? 0 : 1; const alt = [1,2,3,4].concat(p.includes(0) ? [0] : []).filter(x => x !== q[i]); q[i] = alt[Math.floor(Math.random()*alt.length)]; o.set(q.join(''), q); }
      return { v, key, opts: shuffle([...o.values()]) };
    });
    runGame('code', rounds, (body, r, cb) => {
      body.append(h(`<p class="q-prompt">聽一聽這個詞語，兩個字分別是第幾聲？選出正確的聲調密碼</p>
        <div style="display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap"><button class="speaker" id="sp" aria-label="再聽一次" style="width:84px;height:84px;margin:0">${speakerSvg}</button>${r.v.em?`<div class="emoji-pic" style="margin:0">${r.v.em}</div>`:''}<div class="big-hanzi" style="font-size:clamp(2.2rem,6vw,3.4rem)">${r.v.zh}</div></div>
        <div class="fill-py" id="fp">${r.v.syl.map(s=>`<span class="syl">${s.ini}${s.base}</span>`).join(' ')}</div>
        <div class="opts code-opts" style="max-width:680px;grid-template-columns:repeat(2,1fr)">${r.opts.map(q=>`<button class="opt" data-o="${q.join('')}"><span class="pair">${q.map(t=>`<span>${toneSvg(t)}<small>${TONE_NAME[t]}</small></span>`).join('<em>+</em>')}</span></button>`).join('')}</div>`));
      const play = () => say(r.v.id, r.v.tts);
      $('#sp', body).onclick = play; setTimeout(play, 400);
      body.querySelectorAll('.opt').forEach(b => b.onclick = () => { if (b.dataset.o === r.key){ b.classList.add('ok'); $('#fp', body).innerHTML = r.v.syl.map(s=>`<span class="syl fixed">${sylStr(s)}</span>`).join(' '); play(); cb.correct(); } else { b.classList.add('no'); setTimeout(()=>b.classList.remove('no'),500); cb.wrong(); setTimeout(play,1500); } });
    });
  }
});

/* ---------------- start ---------------- */
function start(){
  const ov = h(`<div class="start" id="start"><div><div class="start-pair"><img src="img/doll-wave.webp" alt="Susu 娃娃"><img class="n" src="img/baby-clap.webp" alt="Neko 娃娃"></div><h1>小朋友，你好！</h1><p>我是 Susu，我和 Neko 一起陪你溫習普通話吧。</p><button class="btn" id="go" style="font-size:1.35rem;padding:16px 36px">點我開始</button><p class="hint" style="margin-top:14px">請打開聲音</p></div></div>`);
  document.body.append(ov);
  $('#go').onclick = () => { $('#start').remove(); dollSay('hello', null, 'wave').then(() => nekoSay('hello')); };
}
render();
start();
})();

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
  exam:'小朋友，加油哦！你一定可以的！'
};

/* ---------------- state ---------------- */
let memStore = {};
const store = { get(){ return memStore; }, set(v){ memStore = v; } };
let S = Object.assign({ stars:0, done:{}, plays:0 }, store.get());
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

  <div class="section-title"><h2>我的星星貼紙</h2><p>每完成一個遊戲，就得到一顆星星</p></div>
  <div class="stickers" id="stk">
    ${GAMES.map(g => `<div class="sticker ${S.done[g.id] ? 'got' : ''}" title="${g.name}">${starSvg}</div>`).join('')}
    <span style="margin-left:8px;color:var(--ink-2)">共 <b style="color:var(--ink)">${S.stars}</b> 顆星星</span>
  </div>
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
    <div class="panel-head"><img src="img/doll-cheer.webp" alt="" style="width:96px"><div><h2 style="font-size:clamp(1.6rem,3vw,2.2rem)">遊戲樂園</h2><p>每個遊戲 8 題，完成就得到星星貼紙。</p></div></div>
    <div class="grid g3">${GAMES.map(g=>`
      <button class="card game-card" style="--c:${g.c};--cl:${g.cl}" data-go="game" data-arg="${g.id}">
        <div class="ic">${g.ic}</div><div><h3>${g.name}</h3><p>${g.desc}</p></div>
        ${S.done[g.id] ? `<span class="done">${starSvg}</span>` : ''}
      </button>`).join('')}</div>
    <div class="card" style="margin-top:22px;display:flex;align-items:center;gap:16px;background:var(--lav-l)">
      <img src="img/baby-sleep.webp" alt="" style="width:90px">
      <div><h3>學累了嗎？Neko 陪你休息一下</h3><p style="color:var(--ink-2);margin-top:4px">玩了一會兒，記得休息眼睛，喝口水。</p></div>
      <button class="btn lav small" style="margin-left:auto" id="restBtn">休息一下</button>
    </div>`));
  $('#restBtn').onclick = () => { modal({ img:'sleep', title:'休息一下', text:DOLL_TC.rest, actions:[['好的','lav']] }); say('doll_rest', D.DOLL.rest); };
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
    S.done[gid] = true; S.stars += 1; S.plays += 1; save();
    confetti();
    $('#prog').style.width = '100%';
    say('doll_finish', D.DOLL.finish);
    modal({ img:'clap', title:'完成了！', text:`你答對了 ${right} / ${rounds.length} 題，得到一顆星星！${S.plays % 3 === 0 ? '玩了幾個遊戲，休息一下眼睛吧。' : ''}`,
      actions:[['再玩一次','mint',()=>routes.game(gid)],['返回遊戲樂園','',()=>go('games')]] });
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
            if (matched === 6){ S.done.memory = true; S.stars++; S.plays++; save(); confetti(); say('doll_finish', D.DOLL.finish); setDoll('cheer');
              modal({ img:'clap', title:'全部配對成功！', text:`你用了 ${tries} 次就找齊 6 對好朋友，得到一顆星星！`, actions:[['再玩一次','mint',()=>routes.game('memory')],['返回遊戲樂園','',()=>go('games')]] });
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

/* ---------------- start ---------------- */
function start(){
  const ov = h(`<div class="start" id="start"><div><div class="start-pair"><img src="img/doll-wave.webp" alt="Susu 娃娃"><img class="n" src="img/baby-clap.webp" alt="Neko 娃娃"></div><h1>小朋友，你好！</h1><p>我是 Susu，我和 Neko 一起陪你溫習普通話吧。</p><button class="btn" id="go" style="font-size:1.35rem;padding:16px 36px">點我開始</button><p class="hint" style="margin-top:14px">請打開聲音</p></div></div>`);
  document.body.append(ov);
  $('#go').onclick = () => { $('#start').remove(); dollSay('hello', null, 'wave'); };
}
render();
start();
})();

/* ===== CONFIG: card palettes [from, to, text]. No green / blue. ===== */
const PALETTES=[
  ['#ff8fab','#c9184a','#ffffff'],['#ffd166','#f77f00','#3a1a00'],['#6a1b4d','#2b0a2e','#ffe5ec'],
  ['#fff1e6','#f3c9d4','#4a1530'],['#ff6b6b','#9d0208','#ffffff'],['#c77dba','#6d2077','#ffffff'],
  ['#f9dc8b','#b8860b','#2f1b00'],['#3d2c3e','#1b1220','#f4d9c6']];
const MOOD_PAL={love:[0,3,5],happy:[1,6,3],sad:[2,7,5],strong:[4,1,7],jealous:[5,2,4]};
const LABEL={love:'Love',happy:'Happy',sad:'Sad',strong:'Strong',jealous:'Jealous'};
const PAGE=30;

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const DATA=window.SHAYARI_DATA, ALL=DATA.shayaris;
const S={q:'',f:{emotion:new Set(),categories:new Set(),perspective:new Set(),tone:new Set(),form:new Set()},
  lang:store.get('lang','both'),sound:store.get('sound',true),theme:store.get('theme',matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),
  pal:store.get('pal',{}),list:[],shown:0,cur:null,mood:'love'};
const hash=s=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const palOf=x=>S.pal[x.id]??MOOD_PAL[x.mood][hash(x.id)%3];
const pretty=s=>s.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());

/* ---- sounds (synthesised, no files) ---- */
let AC;
function tone(f=520,d=.09,t='sine',v=.07,f2){
  if(!S.sound)return;
  try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();
    o.type=t;o.frequency.setValueAtTime(f,AC.currentTime);if(f2)o.frequency.exponentialRampToValueAtTime(f2,AC.currentTime+d);
    g.gain.setValueAtTime(v,AC.currentTime);g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);
    o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch{}}
const sfx={chip:()=>tone(620,.06,'triangle',.05),card:()=>{tone(392,.14,'sine',.08,784)},close:()=>tone(560,.12,'sine',.06,280),ok:()=>{tone(660,.08);setTimeout(()=>tone(880,.12),80)}};

function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),1800)}

/* ---- background effect: drawn vector particles on canvas (edit FX to change shapes / colours) ---- */
const FX={love:{t:['heart','heart','spark'],c:['#ff5d8f','#e0457b','#ff8fab','#c9184a']},
 happy:{t:['smile','spark','smile'],c:['#ffc93c','#f4a261','#ffd166']},
 sad:{t:['drop','petal','drop'],c:['#c77dba','#9b59b6','#a8466e']},
 strong:{t:['spark','dot','spark'],c:['#ff9f43','#ff6b6b','#ffd166']},
 jealous:{t:['crack','petal','heart'],c:['#d6336c','#a4133c','#c9184a']}};
const EM={};ALL.forEach(x=>EM[x.emotion]=x.mood);
const fxMood=()=>{const s=[...S.f.emotion];return s.length?EM[s[Math.random()*s.length|0]]:Object.keys(FX)[Math.random()*5|0]};
const cv=$('#fx'),cx=cv.getContext('2d');let P=[],raf=0,fxT=0,last=0,W,H;
function size(){const d=devicePixelRatio||1;W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',size);size();
const heartPath=s=>{cx.beginPath();cx.moveTo(0,s*.4);cx.bezierCurveTo(-s*1.2,-s*.35,-s*.6,-s*1.1,0,-s*.5);cx.bezierCurveTo(s*.6,-s*1.1,s*1.2,-s*.35,0,s*.4)};
const glossy=(s,c)=>{const g=cx.createRadialGradient(-s*.3,-s*.4,s*.05,0,0,s*1.2);g.addColorStop(0,'#ffffffdd');g.addColorStop(.3,c);g.addColorStop(1,c);return g};
const SH={
 heart(s,c){heartPath(s);cx.fillStyle=glossy(s,c);cx.fill()},
 crack(s,c){SH.heart(s,c);cx.strokeStyle='#2b0a2e';cx.lineWidth=s*.09;cx.lineJoin='round';cx.beginPath();cx.moveTo(0,-s*.5);cx.lineTo(s*.18,-s*.1);cx.lineTo(-s*.15,s*.08);cx.lineTo(.02*s,s*.38);cx.stroke()},
 smile(s,c){cx.beginPath();cx.arc(0,0,s,0,7);cx.fillStyle=glossy(s,c);cx.fill();cx.fillStyle='#5a1e4a';
  [-1,1].forEach(k=>{cx.beginPath();cx.arc(k*s*.35,-s*.2,s*.11,0,7);cx.fill()});
  cx.strokeStyle='#5a1e4a';cx.lineWidth=s*.13;cx.lineCap='round';cx.beginPath();cx.arc(0,s*.05,s*.52,.15*Math.PI,.85*Math.PI);cx.stroke()},
 spark(s,c){cx.beginPath();cx.moveTo(0,-s);cx.quadraticCurveTo(0,0,s,0);cx.quadraticCurveTo(0,0,0,s);cx.quadraticCurveTo(0,0,-s,0);cx.quadraticCurveTo(0,0,0,-s);cx.fillStyle=c;cx.fill()},
 drop(s,c){cx.beginPath();cx.moveTo(0,-s);cx.quadraticCurveTo(s*1.1,s*.3,0,s);cx.quadraticCurveTo(-s*1.1,s*.3,0,-s);cx.fillStyle=glossy(s,c);cx.fill()},
 petal(s,c){cx.beginPath();cx.ellipse(0,0,s*.55,s,0,0,7);cx.fillStyle=glossy(s,c);cx.fill();cx.strokeStyle='#ffffff55';cx.lineWidth=1;cx.beginPath();cx.moveTo(0,-s*.8);cx.lineTo(0,s*.8);cx.stroke()},
 dot(s,c){cx.beginPath();cx.arc(0,0,s*.45,0,7);cx.fillStyle=c;cx.fill()}};
function spawn(){const f=FX[fxMood()];P.push({t:f.t[Math.random()*f.t.length|0],c:f.c[Math.random()*f.c.length|0],x:Math.random()*W,y:H+30,s:9+Math.random()*15,vy:45+Math.random()*60,ph:Math.random()*6.3,r:(Math.random()-.5)*.6,vr:(Math.random()-.5)*.7,age:0});if(!raf){last=performance.now();raf=requestAnimationFrame(tick)}}
function tick(t){
  const dt=Math.min(.05,(t-last)/1000||.016);last=t;cx.clearRect(0,0,W,H);
  P=P.filter(p=>p.y>-40);
  for(const p of P){p.age+=dt;p.y-=p.vy*dt;p.x+=Math.sin(p.age*1.4+p.ph)*20*dt;p.r+=p.vr*dt;
    cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.globalAlpha=.3*Math.min(1,p.age/1.2)*Math.min(1,p.y/(H*.3));cx.shadowColor=p.c;cx.shadowBlur=p.s*.9;SH[p.t](p.s,p.c);cx.restore()}
  raf=(P.length||fxT)?requestAnimationFrame(tick):0}
function fxStart(){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;clearInterval(fxT);spawn();fxT=setInterval(spawn,300)}
function fxStop(){clearInterval(fxT);fxT=0}

/* ---- site language (follows the हिं / Abc / दोनों switch) ---- */
const TXT={search:['खोजें: इश्क़, वक़्त, intezaar…','Search: ishq, waqt, intezaar…'],heroA:['जो लबों से न कहा गया,','What the lips could not say,'],heroB:['वो यहाँ लिखा है','is written here'],
 emotion:['भाव','Emotion'],categories:['श्रेणी','Category'],perspective:['आवाज़','Voice'],tone:['अंदाज़','Tone'],form:['रूप','Form'],
 random:['कोई एक शायरी','Surprise me'],clear:['फ़िल्टर हटाएँ','Clear filters'],none:['कोई शायरी नहीं मिली। दूसरा शब्द या फ़िल्टर आज़माएँ।','No shayari found. Try another word or filter.'],
 copy:['कॉपी','Copy'],share:['शेयर','Share'],download:['डाउनलोड','Download'],copied:['कॉपी हो गया ✓','Copied ✓'],making:['इमेज बन रही है…','Making image…'],saved:['डाउनलोड हो गया ✓','Downloaded ✓'],imgfail:['इमेज लाइब्रेरी नहीं खुली, इंटरनेट जाँचें','Image library failed to load, check internet']};
const HI={acceptance:'स्वीकार',betrayal:'धोखा',determination:'हौसला',gratitude:'शुक्रिया',happiness:'ख़ुशी',hope:'उम्मीद',insecurity:'असुरक्षा',jealousy:'जलन',longing:'तड़प',love:'मोहब्बत',nostalgia:'यादें',sadness:'उदासी',strength:'ताक़त',crush:'क्रश',friendship:'दोस्ती',heartbreak:'टूटा दिल',motivation:'प्रेरणा','missing-someone':'किसी की याद','moving-on':'आगे बढ़ना','one-sided-love':'एकतरफ़ा इश्क़','positive-vibes':'सकारात्मक','sad-love':'उदास इश्क़','self-respect':'ख़ुद्दारी','unspoken-love':'अनकहा इश्क़',female:'स्त्री',male:'पुरुष',neutral:'तटस्थ',romantic:'रूमानी',melancholic:'उदास',hopeful:'आशावान',playful:'चंचल',introspective:'आत्ममंथन',bittersweet:'मीठा-कड़वा',couplet:'दो पंक्ति','four-line':'चार पंक्ति','short-shayari':'छोटी शायरी'};
const tx=k=>{const [h,e]=TXT[k];return S.lang==='dev'?h:S.lang==='roman'?e:h+' / '+e};
const nm=o=>S.lang==='roman'||!HI[o]?pretty(o):S.lang==='dev'?HI[o]:HI[o]+' / '+pretty(o);
function ui(){
  document.documentElement.lang=S.lang==='roman'?'en':'hi';
  $$('[data-t]').forEach(e=>e.textContent=tx(e.dataset.t));
  $('#q').placeholder=S.lang==='roman'?TXT.search[1]:TXT.search[0];
  $('#b1').textContent=S.lang==='dev'?'उसकी':'Uski';$('#b2').textContent=S.lang==='dev'?'बालकनी':'Balcony';
  const r=S.lang==='roman'?1:0;
  $('#hero').innerHTML=TXT.heroA[r]+'<br>'+TXT.heroB[r]+(S.lang==='both'?`<small>${TXT.heroA[1]} ${TXT.heroB[1]}</small>`:'');
  buildFilters()}

/* ---- theme / settings ---- */
function applyTheme(){document.documentElement.dataset.theme=S.theme;store.set('theme',S.theme)}
function applySound(){$('#sound').innerHTML=S.sound?ICON.on:ICON.off;$('#sound').title=S.sound?'Click sounds on':'Click sounds off';store.set('sound',S.sound)}
const ICON={on:'<svg viewBox="0 0 24 24"><path d="M3 10v4h4l5 4V6L7 10zm13.5 2A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
 off:'<svg viewBox="0 0 24 24"><path d="M3 10v4h4l5 4V6L7 10zm13 .6L14.6 12 16 13.4 14.6 14.8 16 16.2l1.4-1.4 1.4 1.4 1.4-1.4-1.4-1.4 1.4-1.4-1.4-1.4-1.4 1.4z"/></svg>',
 moon:'<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 11.5A7 7 0 0 1 12 3z"/></svg>',sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zm12.1 12.1l1.4-1.4 2.1 2.1-1.4 1.4z"/></svg>'};

/* ---- filters (dropdowns) ---- */
const GROUPS=[['emotion',DATA.filters.emotions],['categories',DATA.filters.categories],['perspective',DATA.filters.perspectives],['tone',DATA.filters.tones],['form',DATA.filters.forms]];
const badge=k=>{$(`.dd[data-k="${k}"]>button`).innerHTML=tx(k)+(S.f[k].size?` <b>${S.f[k].size}</b>`:'')};
function buildFilters(){
  const open=$$('.dd.open').map(d=>d.dataset.k);
  $('#filters').innerHTML=GROUPS.map(([k,v])=>`<div class="dd" data-k="${k}"><button type="button"></button><div class="panel">${v.map(o=>`<button class="chip${S.f[k].has(o)?' on':''}" data-v="${o}">${nm(o)}</button>`).join('')}</div></div>`).join('')+`<button class="fbtn" id="random">${tx('random')}</button><button class="fbtn" id="clear">${tx('clear')}</button>`;
  GROUPS.forEach(g=>badge(g[0]));open.forEach(k=>$(`.dd[data-k="${k}"]`).classList.add('open'))}

/* ---- smart search: spelling-tolerant, Hinglish-aware ---- */
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ph/g,'f').replace(/v/g,'w').replace(/q/g,'k').replace(/z/g,'j').replace(/ee/g,'i').replace(/oo/g,'u').replace(/aa/g,'a').replace(/([bcdgjkpstr])h/g,'$1').replace(/(.)\1+/g,'$1');
const lev=(a,b)=>{if(Math.abs(a.length-b.length)>2)return 9;const d=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return d[b.length]};
const SYN={wait:'intezaar waqt',time:'waqt',love:'ishq pyar mohabbat',sad:'udaas dard gham',happy:'khushi',tears:'ansu aansu',night:'raat',rain:'baarish',memory:'yaad',memories:'yaad',friend:'dost dosti',dream:'sapna khwab',miss:'yaad',pain:'dard',hope:'ummeed',heart:'dil'};
function tokOk(x,t){const v=[t,...(SYN[t]||'').split(' ').filter(Boolean)].map(norm);return v.some(n=>x._h.includes(n)||(n.length>=4&&x._w.some(w=>lev(w,n)<=(n.length>=7?2:1))))}
function match(x){
  for(const [k,s] of Object.entries(S.f)){if(!s.size)continue;const val=k==='categories'?x.categories:[x[k]];if(!val.some(v=>s.has(v)))return false}
  return !S.q||S.q.split(/\s+/).filter(Boolean).every(t=>tokOk(x,t.replace(/^#/,'')))}
function apply(){S.list=ALL.filter(match);S.shown=0;$('#grid').innerHTML='';
  if(!S.list.length)$('#grid').innerHTML=`<div class="empty">${tx('none')}</div>`;more()}

/* ---- cards ---- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -6% 0px'});
function body(x,cls=''){const d=S.lang!=='roman'?`<div class="poem">${x.text}</div>`:'',r=S.lang!=='dev'?`<div class="rom">${x.textRomanized}</div>`:'';return d+r}
function setPal(el,i){const p=PALETTES[i];el.style.setProperty('--c1',p[0]);el.style.setProperty('--c2',p[1]);el.style.setProperty('--ink-c',p[2])}
const dots=x=>PALETTES.map((p,i)=>`<i data-p="${i}" style="background:${p[0]}" title="Palette ${i+1}"></i>`).join('');
function more(){
  const g=$('#grid'),sl=S.list.slice(S.shown,S.shown+PAGE);S.shown+=sl.length;
  sl.forEach((x,i)=>{const c=document.createElement('article');c.className='card';c.tabIndex=0;c.dataset.id=x.id;setPal(c,palOf(x));
    c.style.transitionDelay=(i%3)*90+'ms';
    c.innerHTML=body(x)+`<div class="meta"><span class="pill">${nm(x.emotion)}</span><span>${nm(x.categories[0])}</span></div>`;
    c.onmouseenter=fxStart;c.onmouseleave=fxStop;
    c.onclick=()=>openModal(x,c);c.onkeydown=e=>{if(e.key==='Enter')openModal(x,c)};
    g.append(c);io.observe(c);c.addEventListener('transitionend',()=>c.style.transitionDelay='0ms',{once:true})})}
new IntersectionObserver(e=>{if(e[0].isIntersecting&&S.shown<S.list.length)more()},{rootMargin:'600px'}).observe($('#more'));

/* ---- modal ---- */
const ov=$('#overlay'),md=$('#modal');
function renderModal(){const x=S.cur;setPal(md,palOf(x));
  md.querySelector('.content').innerHTML=`<h3>${pretty(x.title)}</h3>`+body(x)+`<div class="tags">${x.tags.slice(0,6).map(t=>`<button data-t="${t}">#${t}</button>`).join('')}</div><div class="dots">${dots()}</div>`}
function openModal(x,card){S.cur=x;renderModal();sfx.card();fxStart();
  ov.classList.add('open');document.body.style.overflow='hidden';
  const r=card.getBoundingClientRect(),m=md.getBoundingClientRect();
  md.style.transformOrigin=`${r.left+r.width/2-m.left}px ${r.top+r.height/2-m.top}px`;$('.close',md).focus()}
function closeModal(){if(!ov.classList.contains('open'))return;ov.classList.remove('open');document.body.style.overflow='';sfx.close();$('#shareMenu').classList.remove('show');fxStop()}
ov.onclick=e=>{if(e.target===ov)closeModal()};$('.close').onclick=closeModal;
addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
md.addEventListener('click',e=>{
  const p=e.target.closest('.dots i'),t=e.target.closest('.tags button');
  if(p){S.pal[S.cur.id]=+p.dataset.p;store.set('pal',S.pal);renderModal();const c=$(`.card[data-id="${S.cur.id}"]`);c&&setPal(c,+p.dataset.p);sfx.chip()}
  if(t){closeModal();$('#q').value=t.dataset.t;S.q=t.dataset.t;apply();scrollTo({top:0,behavior:'smooth'})}});

/* ---- copy / share / download ---- */
const plain=x=>(S.lang==='roman'?x.textRomanized:S.lang==='dev'?x.text:x.text+'\n\n'+x.textRomanized)+'\n\n— Uski Balcony';
$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(plain(S.cur))}catch{const t=document.createElement('textarea');t.value=plain(S.cur);document.body.append(t);t.select();document.execCommand('copy');t.remove()}sfx.ok();toast(tx('copied'))};
async function makeImage(x){
  if(!window.html2canvas){toast(tx('imgfail'));return null}
  const p=PALETTES[palOf(x)],n=document.createElement('div'),len=x.text.length;
  n.style.cssText=`position:fixed;left:-9999px;top:0;width:1080px;height:1920px;padding:150px 100px;display:flex;flex-direction:column;justify-content:center;gap:50px;text-align:center;background:linear-gradient(160deg,${p[0]},${p[1]});color:${p[2]};font-family:'Tiro Devanagari Hindi',serif`;
  const fs=len>200?50:len>120?58:68;
  n.innerHTML=(S.lang!=='roman'?`<div style="font-size:${fs}px;line-height:1.7;white-space:pre-line">${x.text}</div>`:'')+(S.lang!=='dev'?`<div style="font-size:${S.lang==='roman'?fs-6:fs-18}px;line-height:1.6;font-style:italic;white-space:pre-line;opacity:.9">${x.textRomanized}</div>`:'')+`<div style="font-size:36px;opacity:.75;margin-top:40px">Uski Balcony</div>`;
  document.body.append(n);
  try{await document.fonts.ready;const c=await html2canvas(n,{scale:1,backgroundColor:null});return await new Promise(r=>c.toBlob(r,'image/png'))}finally{n.remove()}}
$('#download').onclick=async()=>{toast(tx('making'));const b=await makeImage(S.cur);if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`shayari-${S.cur.id}.png`;a.click();sfx.ok();toast(tx('saved'))};
$('#share').onclick=async()=>{
  const x=S.cur,txt=encodeURIComponent(plain(x)),m=$('#shareMenu');
  m.innerHTML=`<a target=_blank rel=noopener href="https://wa.me/?text=${txt}">WhatsApp</a><a target=_blank rel=noopener href="https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${txt}">Telegram</a><a target=_blank rel=noopener href="https://twitter.com/intent/tweet?text=${txt}">X</a><a target=_blank rel=noopener href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}&quote=${txt}">Facebook</a>`;
  if(navigator.canShare&&window.html2canvas){toast(tx('making'));const b=await makeImage(x);
    if(b){const f=new File([b],'shayari.png',{type:'image/png'});if(navigator.canShare({files:[f]})){try{await navigator.share({files:[f],text:plain(x)});return}catch(e){if(e.name==='AbortError')return}}}}
  m.classList.toggle('show');sfx.chip()};

/* ---- init ---- */
$('#theme').onclick=()=>{S.theme=S.theme==='dark'?'light':'dark';applyTheme();$('#theme').innerHTML=S.theme==='dark'?ICON.sun:ICON.moon;sfx.chip()};
$('#sound').onclick=()=>{S.sound=!S.sound;applySound();S.sound&&sfx.chip()};
$$('#lang button').forEach(b=>{b.classList.toggle('on',b.dataset.l===S.lang);b.onclick=()=>{S.lang=b.dataset.l;store.set('lang',S.lang);$$('#lang button').forEach(o=>o.classList.toggle('on',o===b));sfx.chip();ui();apply();if(S.cur&&ov.classList.contains('open'))renderModal()}});
let qt;$('#q').oninput=e=>{clearTimeout(qt);qt=setTimeout(()=>{S.q=e.target.value.trim();apply()},200)};
function clearAll(){S.q='';$('#q').value='';Object.values(S.f).forEach(s=>s.clear());$$('.chip.on').forEach(c=>c.classList.remove('on'));GROUPS.forEach(g=>badge(g[0]));sfx.chip();apply()}
$('#filters').onclick=e=>{
  const c=e.target.closest('.chip'),d=e.target.closest('.dd');
  if(c){const k=d.dataset.k,v=c.dataset.v,s=S.f[k];s.has(v)?s.delete(v):s.add(v);c.classList.toggle('on',s.has(v));badge(k);sfx.chip();apply();return}
  if(d&&e.target.closest('.dd>button')){const o=d.classList.contains('open');$$('.dd.open').forEach(x=>x.classList.remove('open'));d.classList.toggle('open',!o);sfx.chip();return}
  const r=e.target.closest('#random');if(r)openModal(ALL[Math.random()*ALL.length|0],r);
  if(e.target.closest('#clear'))clearAll()};
document.addEventListener('click',e=>{if(!e.target.closest('.dd'))$$('.dd.open').forEach(d=>d.classList.remove('open'))});
ALL.forEach(x=>{x._h=norm((x.text+' '+x.textRomanized+' '+x.tags.join(' ')+' '+x.categories.join(' ')+' '+x.title+' '+x.emotion).toLowerCase());x._w=[...new Set(x._h.split(/[^a-z\u0900-\u097f]+/))].filter(Boolean)});
applyTheme();applySound();$('#theme').innerHTML=S.theme==='dark'?ICON.sun:ICON.moon;ui();
function go(){if(go.d)return;go.d=1;$('#loader').classList.add('done');document.body.classList.add('ready');apply()}
addEventListener('load',()=>setTimeout(go,2200));setTimeout(go,6000);

const prog=$('#prog');addEventListener('scroll',()=>{prog.style.transform=`scaleX(${scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)})`},{passive:true});

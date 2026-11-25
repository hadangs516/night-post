'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const shapes={
    mail:'M3 5h18v14H3z M3 6l9 7 9-7',calendar:'M3 5h18v16H3z M3 10h18 M7 2v5 M17 2v5 M8 14h2 M14 14h2',
    album:'M5 3h14v18H5z M3 7h4 M3 12h4 M3 17h4 M10 8h6v7h-6z',
    full:'M3 9V3h6 M15 3h6v6 M21 15v6h-6 M9 21H3v-6',help:'M8 7V5h2V4h4v1h2v4l-4 4v2 M12 18v2',
    quiet:'M3 9h4l5-5v16l-5-5H3z M16 9l6 6 M22 9l-6 6',loud:'M3 9h4l5-5v16l-5-5H3z M16 8l3 4-3 4 M19 4l4 8-4 8',
    pause:'M7 4v16 M16 4v16'
  };
  const icon=key=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="'+(key==='pause'?4:2)+'" stroke-linejoin="miter"><path d="'+shapes[key]+'"/></svg>';
  document.querySelectorAll('[data-icon]').forEach(n=>n.innerHTML=icon(n.dataset.icon));
  for(const id of ['full','help','pause']) $(id).innerHTML=icon(id);

  const catalog=[
    ['box','첫 소인','첫 배달 성공'],['star','정중앙','정확한 착지 1번'],['cat','밤의 집배원','여덟 통 완주'],
    ['moon','보름달','연속 정중앙 3번'],['house','오늘의 지붕','오늘의 배달 완주'],['mail','단골 우편함','누적 배달 30통']
  ];
  let saved={stamps:[],total:0,best:0,day:'',dailyBest:0,sound:false};
  try{
    const data=JSON.parse(localStorage.getItem('night-post-save-v1'));
    if(data && typeof data==='object'){
      for(const k of ['best','dailyBest','total']) if(Number.isFinite(data[k])&&data[k]>=0)saved[k]=data[k];
      saved.sound=data.sound===true;saved.day=typeof data.day==='string'?data.day:'';
      if(Array.isArray(data.stamps))saved.stamps=data.stamps.filter(k=>catalog.some(a=>a[0]===k));
    }
  }catch{}
  function persist(){try{localStorage.setItem('night-post-save-v1',JSON.stringify(saved));}catch{}}
  const today=()=>new Date(Date.now()+9*36e5).toISOString().slice(0,10);
  function homeStats(){
    $('album-count').textContent=saved.stamps.length+' / '+catalog.length;
    $('best-home').textContent='최고 기록　'+saved.best.toLocaleString()+'점';
    document.querySelector('.samples').innerHTML=['box','moon','cat'].map(k=>'<img src="assets/stamp-'+k+'.png" alt="">').join('');
  }
  let audio=null;
  function wakeSound(){if(!saved.sound)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!audio)audio=new Audio();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
  function tone(freq,duration=.1,delay=0,wave='triangle'){
    if(!saved.sound || !audio || audio.state!=='running')return;
    const t=audio.currentTime+delay, osc=audio.createOscillator(), gain=audio.createGain();
    osc.type=wave;osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.11,t+.01);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+duration+.01);
  }
  function soundLabel(){const el=$('sound'),label=saved.sound?'소리 끄기':'소리 켜기';el.innerHTML=icon(saved.sound?'loud':'quiet');el.setAttribute('aria-label',label);el.setAttribute('aria-pressed',String(saved.sound));el.title=label;}
  $('sound').onclick=()=>{saved.sound=!saved.sound;persist();soundLabel();wakeSound();tone(659);};
  const sheet=$('sheet');
  let closeAction=null;
  function button(label,fn,variant='primary'){const b=document.createElement('button');b.textContent=label;b.className=variant;b.onclick=fn;return b;}
  function dialog(title,html,buttons,onClose=null){
    $('sheet-title').textContent=title;$('sheet-body').innerHTML=html;$('sheet-actions').replaceChildren(...buttons);
    closeAction=onClose;sheet.setAttribute('aria-labelledby','sheet-title');
    if(!sheet.open)sheet.showModal();
  }
  function dismiss(){closeAction=null;if(sheet.open)sheet.close();}
  function closeSheet(){const action=closeAction;dismiss();if(action)action();}
  $('close').onclick=closeSheet;sheet.addEventListener('cancel',e=>{e.preventDefault();closeSheet();});
  $('album').onclick=()=>dialog('우표 수집첩','<div class="stamp-grid">'+catalog.map(([k,n,c])=>'<div class="'+(saved.stamps.includes(k)?'unlocked':'locked')+'"><img alt="'+(saved.stamps.includes(k)?'수집 완료':'미수집')+'" src="assets/stamp-'+k+'.png"><span>'+n+'</span><small>'+c+'</small></div>').join('')+'</div>',[button('닫기',dismiss,'secondary')]);
  function help(){
    const playing=!!s && s.phase!=='end';if(playing)freeze();
    const back=()=>{if(playing)resume();};
    dialog('지붕 건너는 법','<ol class="help-list"><li>화면이나 점프 버튼을 꾹 누르세요. PC에서는 스페이스바를 쓰세요.</li><li>흰 눈금이 금색 구간에 들어오면 손을 떼세요. 점선 끝이 착지할 자리예요.</li><li>우편함 앞에 연속으로 내리면 추가 점수! 공중의 금빛 편지를 챙겨 착지하면 80점이에요.</li></ol><p>기회는 세 번, 목적지는 여덟 곳. 오늘의 배달 코스는 한국 시간 자정에 바뀌어요.</p>',[button('알겠어요',closeSheet)],back);
  }
  $('help').onclick=help;
  const root=document.documentElement;
  async function fullscreen(manual){
    try{
      if(document.fullscreenElement||document.webkitFullscreenElement){
        if(manual)await (document.exitFullscreen||document.webkitExitFullscreen).call(document);return;
      }
      const enter=root.requestFullscreen||root.webkitRequestFullscreen;
      if(!enter)throw Error();
      await enter.call(root);
    }catch{
      if(manual){const wasPlaying=!!s;if(wasPlaying)freeze();dialog('전체 화면','<p>이 브라우저에서는 현재 보이는 높이에 맞춰 플레이할 수 있어요. 아이폰에서는 Safari의 공유 메뉴에서 ‘홈 화면에 추가’를 선택하면 더 넓게 열려요.</p>',[button('확인',closeSheet)],wasPlaying?resume:null);}
    }
  }
  $('full').onclick=()=>fullscreen(true);
  const wideTouch=matchMedia('(orientation: landscape) and (pointer: coarse)');
  let needsWideScreen=false;
  function onOrientation(){needsWideScreen=wideTouch.matches;}
  if(wideTouch.addEventListener)wideTouch.addEventListener('change',onOrientation);
  else wideTouch.addListener(onOrientation);
  function fitLandscape(){
    if(!needsWideScreen)return;
    needsWideScreen=false;
    if(!document.fullscreenElement && !document.webkitFullscreenElement)fullscreen(false);
  }
  const randomSource=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function route(seed){
    const rng=randomSource(seed),roofs=[{id:0,x:-42,y:0,w:84}];
    for(let id=1;id<=8;id++){
      const last=roofs[id-1],w=Math.floor(64-id*2+rng()*8);
      const center=last.x+last.w/2+Math.round(99+rng()*47+id*1.6);
      roofs.push({id,x:Math.round(center-w/2),w,y:Math.round((rng()-.5)*Math.min(37,12+id*4)),bonusSide:rng()>.5?1:-1});
    }
    return roofs;
  }
  let s=null,raf=0,previous=0,input=null;
  const minDist=26,spread=185;
  const addresses=['다락방','별책방','수선집','별빛분식','시장 꽃집','옥상극장','새벽빵집','달빛우체통'];
  function prepareBonus(){
    const q=s.roofs[s.index+1];s.bonus=null;
    if(!q || q.id%2!==0)return;
    const t=.59,d=q.x+q.w/2+q.bonusSide*q.w*.34-s.x;
    s.bonus={x:s.x+d*t,y:s.y+(q.y-s.y)*t-4*(24+d*.24)*t*(1-t),taken:false};
  }
  function start(mode){
    dismiss();cancelAnimationFrame(raf);wakeSound();
    onOrientation();fitLandscape();
    const date=today(),seed=mode==='daily'?Number(date.replaceAll('-','')):Math.floor(Math.random()*4294967296);
    s={mode,date,roofs:route(seed),index:0,x:0,y:0,camera:0,score:0,lives:3,streak:0,perfect:0,
      phase:'ready',paused:false,time:0,age:0,power:0,distance:minDist,sparks:[],newStamps:[],messageAge:0};
    input=null;$('home').hidden=true;$('play').hidden=false;document.body.classList.add('playing');window.scrollTo(0,0);
    $('mode-label').textContent=mode==='daily'?'오늘의 배달':'자유 배달';
    updateHUD();shout(mode==='daily'?date.slice(5).replace('-','월 ')+'일의 배달':'첫 번째 우편함으로!',1.25);
    Scene.resize();Scene.render(s);previous=performance.now();raf=requestAnimationFrame(frame);
    $('jump').focus({preventScroll:true});
  }
  function lobby(){
    dismiss();cancelAnimationFrame(raf);s=null;input=null;$('play').hidden=true;$('home').hidden=false;
    document.body.classList.remove('playing');homeStats();$('free').focus({preventScroll:true});
  }
  $('free').onclick=()=>start('free');$('daily').onclick=()=>start('daily');
  function award(k){if(!saved.stamps.includes(k)){saved.stamps.push(k);s.newStamps.push(k);}}
  function shout(msg,seconds){$('shout').textContent=msg;s.messageAge=seconds;}
  function updateHUD(){
    $('progress').textContent=s.index+' / 8통';$('score').textContent=s.score+'점';$('lives').textContent='♥'.repeat(s.lives)+'♡'.repeat(3-s.lives);
    $('district').textContent=['달맞이동','별빛시장','새벽 골목'][s.index<3?0:s.index<6?1:2]+'　·　'+(addresses[s.index]||'배달 완료');
    const target=s.roofs[s.index+1];
    if(target){const left=(target.x-s.x-minDist)/spread;const width=target.w/spread;
      $('zone').style.left=Math.max(0,left*100)+'%';$('zone').style.width=(Math.min(1,left+width)-Math.max(0,left))*100+'%';}
    $('needle').style.left='0';$('jump').setAttribute('aria-label','길게 눌렀다 떼어 점프');
  }
  function charge(id){
    if(!s || s.paused || s.phase!=='ready' || input!==null || sheet.open)return false;
    fitLandscape();
    input=id;s.phase='charge';s.age=0;s.power=0;s.distance=minDist;shout('',0);wakeSound();
    $('jump').firstChild.textContent='손을 떼어 점프! ';return true;
  }
  function resetInput(){input=null;if(s && s.phase==='charge'){s.phase='ready';s.power=0;$('needle').style.left='0';}$('jump').firstChild.textContent='꾹 눌렀다 떼기 ';}
  function release(id){
    if(!s || input!==id || s.phase!=='charge' || s.paused)return;
    input=null;s.phase='flying';s.age=0;s.fromX=s.x;s.fromY=s.y;s.arc=24+s.distance*.24;s.duration=.48+s.power*.24;
    $('jump').firstChild.textContent='꾹 눌렀다 떼기 ';tone(330+s.power*260,.12);
  }
  for(const el of [$('field'),$('jump')]){
    el.addEventListener('pointerdown',e=>{if(e.button!==0||!charge(e.pointerId))return;e.preventDefault();el.setPointerCapture(e.pointerId);});
    el.addEventListener('pointerup',e=>release(e.pointerId));
    el.addEventListener('pointercancel',e=>{if(e.pointerId===input)resetInput();});
    el.addEventListener('lostpointercapture',e=>{if(e.pointerId===input)resetInput();});
    el.addEventListener('contextmenu',e=>e.preventDefault());
  }
  window.addEventListener('keydown',e=>{
    if(e.code==='Escape' && s && !sheet.open && s.phase!=='end'){e.preventDefault();pause();return;}
    if(e.code!=='Space'||!s||sheet.open||s.paused||s.phase==='end')return;
    if(document.activeElement?.tagName==='BUTTON' && document.activeElement!==$('jump'))return;
    e.preventDefault();if(!e.repeat)charge('space');
  });
  window.addEventListener('keyup',e=>{if(input==='space' && e.code==='Space'){e.preventDefault();release('space');}});
  function freeze(){if(!s)return;resetInput();s.paused=true;cancelAnimationFrame(raf);}
  function resume(){if(!s || s.phase==='end')return;dismiss();s.paused=false;previous=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);$('jump').focus({preventScroll:true});}
  function pause(){
    if(!s||s.phase==='end'||s.paused)return;freeze();
    dialog('잠시 쉬는 중','<p>다음 우편함은 그대로 기다리고 있어요.</p>',[button('계속 배달',resume),button('우체국으로',lobby,'secondary')],resume);
  }
  $('pause').onclick=pause;
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('blur',()=>{if(s && !sheet.open)pause();});
  new ResizeObserver(()=>{if(s){Scene.resize();Scene.render(s);}}).observe($('field'));
  function finish(){
    s.phase='end';const win=s.index===8;
    if(win){award('cat');if(s.mode==='daily')award('house');}
    saved.best=Math.max(saved.best,s.score);
    if(s.mode==='daily'){if(saved.day!==s.date){saved.day=s.date;saved.dailyBest=0;}saved.dailyBest=Math.max(saved.dailyBest,s.score);}
    persist();const mode=s.mode, recorded=mode==='daily'?saved.dailyBest:saved.best;
    const stamps=s.newStamps.map(k=>catalog.find(a=>a[0]===k)[1]);
    dialog(win?'여덟 통, 배달 완료!':'오늘의 배달 일지','<p class="summary">'+s.score+'점</p><p>배달 '+s.index+' / 8통　·　정중앙 '+s.perfect+'번</p><p>'+(mode==='daily'?'오늘 코스 최고':'내 최고 기록')+' '+recorded+'점</p>'+(stamps.length?'<p class="new-stamps">새 우표　'+stamps.join(' · ')+'</p>':''),
      [button('다시 배달',()=>start(mode)),button('우체국으로',lobby,'secondary')],lobby);
  }
  function land(p){
    s.index++;s.y=p.y;s.phase='land';s.age=0;
    const perfect=Math.abs(s.x-(p.x+p.w/2))<=8;
    s.streak=perfect?s.streak+1:0;if(perfect)s.perfect++;
    const bonus=s.bonus?.taken?80:0;
    const points=(perfect?100+50*Math.min(3,s.streak):100)+bonus;s.score+=points;
    saved.total++;award('box');if(perfect)award('star');if(s.streak>=3)award('moon');if(saved.total>=30)award('mail');
    saved.best=Math.max(saved.best,s.score);persist();
    for(let i=0;i<10;i++){const angle=-Math.PI*i/9;s.sparks.push({x:s.x,y:s.y-2,vx:Math.cos(angle)*26,vy:Math.sin(angle)*40-8,age:0,color:i%2?'#ffd384':'#f79b7d'});}
    tone(perfect?660:520,.11);tone(perfect?880:650,.13,.08);
    shout((bonus?'금빛 편지!':perfect?(s.streak>1?'연속 정중앙 ×'+s.streak:'정중앙!'):'배달 성공')+'　+'+points,.9);
    prepareBonus();
    updateHUD();
  }
  function frame(now){
    if(!s||s.paused||s.phase==='end')return;
    const dt=Math.min(.045,Math.max(0,(now-previous)/1000));previous=now;s.time+=dt;s.age+=dt;
    const q=s.roofs[s.index+1];
    if(s.phase==='charge'){
      // The needle comes back for another pass if the player keeps holding.
      const t=(s.age/1.20)%2;s.power=1-Math.abs(1-t);s.distance=minDist+s.power*spread;
      $('needle').style.left='calc('+s.power*100+'% - '+(4*s.power)+'px)';
    }else if(s.phase==='flying'){
      const t=Math.min(1,s.age/s.duration);
      s.x=s.fromX+s.distance*t;s.y=s.fromY+(q.y-s.fromY)*t-4*s.arc*t*(1-t);
      if(s.bonus && !s.bonus.taken && Math.abs(s.x-s.bonus.x)<7 && Math.abs(s.y-s.bonus.y)<5){
        s.bonus.taken=true;tone(1047,.10);shout('금빛 편지!',.6);
      }
      if(t===1){
        if(s.x>=q.x && s.x<=q.x+q.w)land(q);
        else{s.phase='fall';s.age=0;s.fallY=s.y;tone(180,.24);shout(s.x<q.x?'조금 더 길게!':'조금 더 짧게!',1.6);}
      }
    }else if(s.phase==='fall'){
      s.y=s.fallY+125*s.age+260*s.age*s.age;
      if(s.age>.53){s.lives--;s.streak=0;s.x=s.fromX;s.y=s.fromY;s.power=0;s.phase='ready';s.age=0;prepareBonus();updateHUD();if(s.lives===0)finish();}
    }else if(s.phase==='land' && s.age>.42){
      if(s.index===8)finish();else{s.phase='ready';s.age=0;}
    }
    const focus=s.phase==='flying'||s.phase==='fall'?s.fromX+(s.x-s.fromX)*.52:s.x;
    s.camera+=(focus-s.camera)*(1-Math.exp(-dt*9));
    for(const p of s.sparks){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=90*dt;p.age+=dt;}
    s.sparks=s.sparks.filter(p=>p.age<.45);
    if(s.messageAge>0 && (s.messageAge-=dt)<=0)$('shout').textContent='';
    Scene.render(s);if(s.phase!=='end')raf=requestAnimationFrame(frame);
  }
  soundLabel();homeStats();
})();

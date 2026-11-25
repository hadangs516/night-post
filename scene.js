'use strict';
const Scene = (() => {
  const canvas = document.querySelector('#world');
  const ctx = canvas.getContext('2d');
  const image = name => { const im = new Image(); im.src = 'assets/' + name + '.png'; return im; };
  const sky = image('sky'), tallSky=image('sky-tall'), cat = image('courier');
  const rect = (x,y,w,h,c) => {ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
  const ink='#20243b', cream='#ffe4ba';
  const sprite=[
    '.............kk.....kk..','.............kck...kck..','.............kcpkkkcck..','.............kccccccck..','.............kcccccccek.','...kk.......kccckccckck.','..kcck......kccccccccpk.','..kcck....kkkcchhccccck.','...kck..kkcccckkccccck..','...kckkkcccrrrrckkkkk...','....kcccccrrrrrockck....','.....kcckrrrraarccck....','.....kcckrrrraarccck....','.....kccckrrrrrkcchk....','......kccckkkkkcckck....','......kchhk..kcckcck....','......kkkkk..kkkkkkk....'
  ];
  const colors={k:ink,c:cream,h:'#c39382',p:'#de9483',e:'#ba816e',r:'#d95d50',a:'#ffd486',o:'#9e4c4c'};
  const stand = document.createElement('canvas'); stand.width=24;stand.height=sprite.length;
  const pen=stand.getContext('2d');
  sprite.forEach((row,y)=>[...row].forEach((v,x)=>{if(colors[v]){pen.fillStyle=colors[v];pen.fillRect(x,y,1,1);}}));
  function resize(){
    const w=canvas.clientWidth,h=canvas.clientHeight;
    if(!w || !h)return;
    const scale=Math.min(w/305,h/138,2.7);
    canvas.width=Math.round(w/scale);canvas.height=Math.round(h/scale);
    ctx.imageSmoothingEnabled=false;
  }
  function roof(p,x,y,height){
    const w=p.w;
    rect(x+2,y+3,w-4,height,'#313449');rect(x+3,y+5,3,height,'#464356');
    rect(x,y,w,4,ink);rect(x,y,w,1,'#edb28f');rect(x+2,y+4,w-4,2,'#787087');
    rect(x+3,y+7,w-6,2,'#1c233a');
    for(let a=8;a<w-8;a+=16){
      for(let b=14;b<height;b+=20){
        const palette=['#a57a78','#656a83','#deb28a','#58637c'];
        rect(x+a,y+b,8,10,ink);rect(x+a+1,y+b+1,6,8,palette[(p.id+a+Math.floor(b/10))%4]);
        rect(x+a+4,y+b+1,1,8,'#484454');rect(x+a+1,y+b+5,6,1,'#484454');
      }
    }
    const trim=['#718497','#c07570','#829998','#8982a1'][p.id%4];
    const pipe=x+w-7;
    rect(pipe,y+8,2,height,'#555168');rect(pipe+2,y+8,1,height,'#24283e');
    for(let b=21;b<height;b+=29)rect(pipe-1,y+b,4,2,'#777181');
    if(p.id%3===1){
      rect(x+4,y+31,w-15,5,ink);
      for(let a=6;a<w-12;a+=8){rect(x+a,y+31,4,3,trim);rect(x+a+4,y+31,3,3,'#d8b899');}
    }else if(p.id%3===2){
      rect(x+7,y+29,19,9,'#22273c');rect(x+8,y+30,17,6,'#a09a9e');
      for(let a=10;a<23;a+=3)rect(x+a,y+31,1,4,'#585c72');
    }else{
      rect(x+6,y+28,w-18,3,trim);
      for(let a=7;a<w-12;a+=7)rect(x+a,y+24,1,5,'#79768b');
      rect(x+6,y+23,w-18,1,'#a899a3');
    }
    if(p.id>0){
      const middle=x+w/2;
      rect(middle-1,y-8,3,8,ink);rect(middle-6,y-15,12,9,ink);rect(middle-5,y-14,10,7,'#eb795f');
      rect(middle-4,y-12,8,1,ink);rect(middle-2,y-10,4,2,cream);
      rect(middle-7,y,14,2,'#ffe59c');
    }
  }
  function render(s){
    const W=canvas.width,H=canvas.height;
    const cx=s.camera-W*.22,base=Math.round(H*.70);
    const background=H>W*.83?tallSky:sky;
    if(background.complete && background.naturalWidth){
      const bw=W+Math.ceil(W*.11), bh=H;
      const left=-Math.round((1-Math.exp(-Math.max(0,s.camera)/900))*(bw-W));
      ctx.drawImage(background,left,0,bw,bh);
    }else rect(0,0,W,H,'#545474');
    if(s.index>=4){ctx.fillStyle=s.index>=6?'#eab08120':'#a491bd15';ctx.fillRect(0,0,W,H);}
    for(const p of s.roofs){
      const x=p.x-cx,y=base+p.y;
      if(x<W && x+p.w>=0)roof(p,x,y,H-y);
    }
    const q=s.roofs[s.index+1],next=q && q.x+q.w/2-cx;
    if(s.bonus && !s.bonus.taken){
      const bx=s.bonus.x-cx,by=base+s.bonus.y-11;
      rect(bx-6,by-4,13,9,ink);rect(bx-5,by-3,11,7,'#ffd37c');
      for(let i=0;i<5;i++){rect(bx-5+i,by-3+Math.floor(i/2),1,1,'#ad6557');rect(bx+5-i,by-3+Math.floor(i/2),1,1,'#ad6557');}
      rect(bx-1,by,3,2,'#da7053');const glint=Math.sin(s.time*5)>.1;
      if(glint){rect(bx+8,by-6,3,1,cream);rect(bx+9,by-7,1,3,cream);}
    }
    if(q && s.phase!=='flying' && s.phase!=='fall' && s.phase!=='end'){
      const n=base+q.y-24+Math.round(Math.sin(s.time*4)*1.5);
      rect(next-3,n-2,7,1,'#ffe5a1');rect(next-2,n-1,5,1,'#ffe5a1');rect(next-1,n,3,1,'#ffe5a1');
    }
    if(s.phase==='charge' && q){
      const distance=s.distance, arc=24+distance*.24;
      for(let t=.125;t<=1;t+=.125){
        const px=s.x+distance*t-cx, py=base+s.y+(q.y-s.y)*t-4*arc*t*(1-t);
        rect(px-1,py-2,t===1?4:2,t===1?3:2,t===1?'#ffbb80':'#ffe9b8');
      }
    }
    const ax=Math.round(s.x-cx),ay=Math.round(base+s.y);
    if(s.phase==='flying'||s.phase==='fall'){
      if(cat.complete && cat.naturalWidth)ctx.drawImage(cat,ax-17,ay-20,34,24);
      else ctx.drawImage(stand,ax-12,ay-17);
    }else{
      const squat=s.phase==='charge'?Math.round(3*s.power):0;
      ctx.drawImage(stand,ax-15,ay-21+squat,30,21-squat);
    }
    for(const p of s.sparks){rect(p.x-cx,base+p.y,2,2,p.color);}
  }
  return {resize,render};
})();

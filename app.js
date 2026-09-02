const $=s=>document.querySelector(s),video=$('#video'),sampler=$('#sampler'),chart=$('#chart');
const ctx=sampler.getContext('2d',{willReadFrequently:true}),plot=chart.getContext('2d');
let stream=null,running=false,raf=0,startAt=0,lastSample=0,samples=[],times=[],lastBeat=0;
const MAX_SECONDS=15,MEASUREMENT_SECONDS=30;

function setStatus(text){$('#status').textContent=text}
function resizeChart(){const d=devicePixelRatio||1;chart.width=chart.clientWidth*d;chart.height=chart.clientHeight*d;plot.setTransform(d,0,0,d,0,0)}
addEventListener('resize',resizeChart);resizeChart();

async function start(){
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:640},height:{ideal:480},frameRate:{ideal:30}},audio:false});
    video.srcObject=stream;await video.play();
    const track=stream.getVideoTracks()[0],caps=track.getCapabilities?.()||{};
    if(caps.torch){try{await track.applyConstraints({advanced:[{torch:true}]})}catch{}}
    sampler.width=64;sampler.height=48;samples=[];times=[];lastBeat=0;running=true;startAt=performance.now();lastSample=0;
    $('#cameraPlaceholder').hidden=true;$('.camera-card').classList.add('measuring');$('#liveBadge').textContent='測量中';
    $('#startBtn').disabled=true;$('#stopBtn').disabled=false;$('#bpm').textContent='--';$('#quality').textContent='--';$('#qualityBar').style.width='0';
    $('#goalRing').classList.remove('complete');$('#goalRing').style.setProperty('--progress','0deg');$('#timer').textContent='00:30';$('#phase').textContent='準備訊號';
    setStatus('請將指腹覆蓋鏡頭並保持穩定');loop();
  }catch(e){setStatus(e.name==='NotAllowedError'?'相機權限遭拒，請在瀏覽器設定中允許':'無法啟用相機：'+e.message)}
}
function releaseCamera(){running=false;cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;$('.camera-card').classList.remove('measuring');$('#cameraPlaceholder').hidden=false;$('#startBtn').disabled=false;$('#stopBtn').disabled=true}
function stop(){releaseCamera();$('#liveBadge').textContent='已取消';$('#timer').textContent='00:30';$('#phase').textContent='尚未開始';$('#goalRing').style.setProperty('--progress','0deg');setStatus('測量已取消，按下按鈕可重新開始')}
function complete(){releaseCamera();$('#liveBadge').textContent='完成';$('#timer').textContent='完成';$('#phase').textContent='測量完成';$('#goalRing').style.setProperty('--progress','360deg');$('#goalRing').classList.add('complete');setStatus(lastBeat?'測量完成，結果已保留':'測量完成，但訊號不足，建議重新測量');$('#startBtn').textContent='重新測量'}

function loop(now=performance.now()){
  if(!running)return;raf=requestAnimationFrame(loop);if(now-lastSample<30)return;lastSample=now;
  ctx.drawImage(video,0,0,64,48);const px=ctx.getImageData(0,0,64,48).data;let red=0,green=0;
  for(let i=0;i<px.length;i+=4){red+=px[i];green+=px[i+1]}
  const n=px.length/4,t=(now-startAt)/1000;samples.push(red/n);times.push(t);
  while(times.length&&t-times[0]>MAX_SECONDS){times.shift();samples.shift()}
  const remaining=Math.max(0,Math.ceil(MEASUREMENT_SECONDS-t));$('#timer').textContent=`00:${String(remaining).padStart(2,'0')}`;
  $('#goalRing').style.setProperty('--progress',`${Math.min(360,t/MEASUREMENT_SECONDS*360)}deg`);$('#phase').textContent=t<6?'建立訊號':'保持穩定';
  const fps=times.length>1?(times.length-1)/(times.at(-1)-times[0]):0;$('#sampleRate').textContent=`${fps.toFixed(0)} FPS`;
  const covered=red/n>80&&red/n>green/n*1.15;
  if(!covered){$('#quality').textContent='請覆蓋';$('#qualityBar').style.width='8%';setStatus('請用指腹完整覆蓋鏡頭與閃光燈');$('#bpm').textContent='--'}
  else if(times.at(-1)<6){$('#quality').textContent='建立中';$('#qualityBar').style.width=`${20+times.at(-1)*8}%`;setStatus('正在建立穩定訊號…')}
  else analyze(fps);
  draw();
  if(t>=MEASUREMENT_SECONDS)complete();
}

function analyze(fs){
  const count=Math.min(samples.length,Math.floor(fs*10)),raw=samples.slice(-count),mean=raw.reduce((a,b)=>a+b,0)/count;
  const x=raw.map(v=>v-mean),minLag=Math.floor(fs*60/180),maxLag=Math.floor(fs*60/45);let bestLag=0,best=-Infinity;
  for(let lag=minLag;lag<=maxLag;lag++){let c=0,a=0,b=0;for(let i=lag;i<x.length;i++){c+=x[i]*x[i-lag];a+=x[i]*x[i];b+=x[i-lag]*x[i-lag]}const r=c/Math.sqrt(a*b||1);if(r>best){best=r;bestLag=lag}}
  const bpm=bestLag?Math.round(60*fs/bestLag):0,quality=Math.max(0,Math.min(100,Math.round((best-.15)*130)));
  $('#quality').textContent=quality>70?'良好':quality>40?'普通':'不穩定';$('#qualityBar').style.width=quality+'%';
  if(best>.35&&bpm>=45&&bpm<=180){$('#bpm').textContent=bpm;setStatus(quality>60?'訊號穩定，繼續保持':'請減少手部移動');lastBeat=bpm}else{$('#bpm').textContent=lastBeat||'--';setStatus('訊號較弱，請調整指腹位置')}
}
function draw(){
  const w=chart.clientWidth,h=chart.clientHeight;plot.clearRect(0,0,w,h);plot.strokeStyle='#173945';plot.lineWidth=1;
  for(let y=0;y<=4;y++){plot.beginPath();plot.moveTo(0,y*h/4);plot.lineTo(w,y*h/4);plot.stroke()}
  if(samples.length<2)return;const recent=samples.slice(-300),mean=recent.reduce((a,b)=>a+b,0)/recent.length,dev=Math.sqrt(recent.reduce((a,v)=>a+(v-mean)**2,0)/recent.length)||1;
  plot.beginPath();plot.strokeStyle='#5ef2bc';plot.lineWidth=2;recent.forEach((v,i)=>{const x=i/(recent.length-1)*w,y=h/2-(v-mean)/(dev*4)*h;(i?plot.lineTo(x,y):plot.moveTo(x,y))});plot.stroke();
}
$('#startBtn').addEventListener('click',start);$('#stopBtn').addEventListener('click',stop);addEventListener('pagehide',releaseCamera);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});

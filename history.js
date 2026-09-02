const HISTORY_KEY='pulselens-history-v1';
const $=selector=>document.querySelector(selector);
function getHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch{return[]}}
function makeValue(label,value,note){const box=document.createElement('div'),name=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');name.textContent=label;strong.textContent=value;small.textContent=note;box.append(name,strong,small);return box}
function renderHistory(){
  const records=getHistory();$('#historyEmpty').hidden=records.length>0;$('#clearHistory').hidden=records.length===0;
  $('#historyList').replaceChildren(...records.map(record=>{
    const item=document.createElement('article'),date=document.createElement('time');item.className='history-item';date.dateTime=record.at;date.textContent=new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(record.at));
    item.append(date,makeValue('脈搏',String(Number(record.pulse)),'BPM'),makeValue('心律',String(record.rhythm),`品質 ${Number(record.quality)}%`));return item;
  }));
}
$('#clearHistory').addEventListener('click',()=>{if(confirm('確定要清除這台裝置上的全部測量紀錄嗎？')){localStorage.removeItem(HISTORY_KEY);renderHistory()}});
renderHistory();

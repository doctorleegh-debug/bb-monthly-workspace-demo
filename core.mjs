export const STATUSES = ['미지정', '예정', '진행 중', '검토 요청', '완료'];
export const dateKey = (y,m,d) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
export const localToday = () => { const d=new Date(); return dateKey(d.getFullYear(),d.getMonth()+1,d.getDate()); };
export function validDate(s) { if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false; const [y,m,d]=s.split('-').map(Number),x=new Date(y,m-1,d); return y>=1900&&y<=2199&&x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d; }
export function shiftMonth(month, delta) {const [y,m]=month.split('-').map(Number),d=new Date(y,m-1+delta,1);return dateKey(d.getFullYear(),d.getMonth()+1,1).slice(0,7);}
export function monthDays(month) {const [y,m]=month.split('-').map(Number),offset=(new Date(y,m-1,1).getDay()+6)%7,n=new Date(y,m,0).getDate(),total=Math.ceil((offset+n)/7)*7; return Array.from({length:total},(_,i)=>{const x=new Date(y,m-1,i-offset+1);return dateKey(x.getFullYear(),x.getMonth()+1,x.getDate());});}
export function matchesTask(t,filters,members) {const p=members.find(p=>p.id===t.owner);return t.date.startsWith(filters.month)&&(!filters.day||t.date===filters.day)&&(!filters.owner||t.owner===filters.owner)&&(!filters.dept||p?.dept===filters.dept)&&(!filters.status||t.status===filters.status)&&(!filters.q||[t.title,t.note,p?.name,p?.dept].join(' ').toLocaleLowerCase().includes(filters.q.toLocaleLowerCase()));}
export function eventsInMonth(events,month) {return events.filter(e=>e.date<=`${month}-31`&&(e.end||e.date)>=`${month}-01`).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));}
export const escapeHTML = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeLink(s) {try {const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export function validateState(s) {
  if(!s||s.version!==1||!Array.isArray(s.members)||!Array.isArray(s.tasks)||!Array.isArray(s.events)||!s.duties||typeof s.duties!=='object')throw Error('지원하지 않는 백업 형식입니다.');
  if(s.members.length>100||s.tasks.length>10000||s.events.length>3000)throw Error('초안에서 지원하는 데이터 크기를 초과했습니다.');
  const str=(v,n)=>typeof v==='string'&&v.length<=n;
  const ids=new Set();for(const p of s.members){if(!str(p.id,80)||!/^[-a-zA-Z0-9_]+$/.test(p.id)||ids.has(p.id)||!str(p.name,80)||!p.name.trim()||!str(p.dept,80)||!Number.isInteger(p.color)||p.color<0||p.color>5)throw Error('담당자 정보를 확인해 주세요.');ids.add(p.id);}if(!ids.size)throw Error('담당자 정보가 비어 있습니다.');
  const records=new Set();for(const [kind,list] of [['task',s.tasks],['event',s.events]])for(const t of list){if(!str(t.id,100)||!/^[-a-zA-Z0-9_]+$/.test(t.id)||records.has(t.id)||!str(t.title,200)||!t.title.trim()||!validDate(t.date)||!str(t.note,5000)||!str(t.link,2000)||(t.link&&!safeLink(t.link)))throw Error('업무 또는 일정 형식이 올바르지 않습니다.');records.add(t.id);if(kind==='task'&&(!ids.has(t.owner)||!STATUSES.includes(t.status)||!['보통','높음','낮음'].includes(t.priority)))throw Error('업무 담당자·상태를 확인해 주세요.');if(kind==='event'&&(!validDate(t.end)||t.end<t.date||!str(t.time,5)||(t.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(t.time))))throw Error('일정 기간·시간을 확인해 주세요.');}
  for(const [month,d]of Object.entries(s.duties)){if(!validDate(month+'-01')||!d||!str(d.person,80)||!str(d.dept,80))throw Error('월 당번 정보를 확인해 주세요.');}
  return s;
}

const C=window.CFG,sb=supabase.createClient(C.SUPABASE_URL,C.SUPABASE_KEY);
const app=document.getElementById('app'),ov=document.getElementById('ov');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let me=null,inExam=false,leaveT=null,subs=[];
const fs=()=>document.documentElement.requestFullscreen?.().catch(()=>{});
const hideOv=()=>{ov.style.display='none'};
const showOv=m=>{ov.innerHTML=`<div class=box><p>${m}</p><button onclick="fs();hideOv()">กลับเข้าโหมดเต็มจอ</button></div>`;ov.style.display='flex'};
const g=(u,k)=>subs.find(s=>s.unit===u&&s.kind===k);
const susp=()=>me.suspended_until&&new Date(me.suspended_until)>new Date();
const save=()=>sessionStorage.setItem('me',JSON.stringify(me));

function guard(){
 if(guard.on)return;guard.on=true;
 document.addEventListener('fullscreenchange',()=>{
  if(!me||me.admin)return;
  if(document.fullscreenElement){clearTimeout(leaveT);hideOv();return}
  showOv(`คุณออกจากโหมดเต็มจอ กรุณากลับภายใน ${C.LEAVE_SEC} วินาที`);
  leaveT=setTimeout(violation,C.LEAVE_SEC*1000)});
 const blk=e=>{if(me&&!me.admin)e.preventDefault()};
 ['copy','cut','paste','contextmenu','dragstart'].forEach(ev=>document.addEventListener(ev,blk));
 document.addEventListener('keydown',e=>{if(me&&!me.admin&&((e.ctrlKey||e.metaKey)&&'cvxaups'.includes(e.key.toLowerCase())||e.key==='PrintScreen'||e.key==='F12'))e.preventDefault()});
}
async function violation(){
 const n=(me.violations||0)+1,upd={violations:n};let m;
 if(n===1)m='⚠️ แจ้งเตือน: คุณออกจากโหมดเต็มจอเกิน '+C.LEAVE_SEC+' วินาที';
 else if(n===2)m='🚨 คำเตือน: หากออกจากเต็มจออีกครั้ง คุณจะถูกระงับการทำใบงาน '+C.SUSPEND_HOURS+' ชั่วโมง';
 else{upd.suspended_until=new Date(Date.now()+C.SUSPEND_HOURS*36e5).toISOString();m='⛔ คุณถูกระงับการทำใบงาน '+C.SUSPEND_HOURS+' ชั่วโมง'}
 Object.assign(me,upd);save();await sb.from('cm21910_students').update(upd).eq('id',me.id);
 showOv(m);if(n>=3)home();
}
const hdr=(back)=>`<header><div>${back?`<button class=g onclick="${back}">← กลับ</button> `:''}<b>${esc(me.name)}</b> ${me.admin?'':`<span class=tag>${esc(me.id)}</span>`}</div><button class="g" onclick="logout()">ออกจากระบบ</button></header>`;

function loginPage(){
 app.innerHTML=`<div class=card style="max-width:380px;margin:12vh auto"><h2>21910-2018</h2><p>คอมพิวเตอร์และการบำรุงรักษา</p>
 <input id=u placeholder="รหัสนักศึกษา / ผู้ดูแล" autocomplete=off><input id=p type=password placeholder="รหัสผ่าน">
 <button onclick="doLogin()" style="width:100%">เข้าสู่ระบบ</button><p id=err style="color:#f87171"></p></div>`}
async function doLogin(){
 fs();const u=document.getElementById('u').value.trim(),p=document.getElementById('p').value;
 if(u===C.ADMIN_USER&&p===C.ADMIN_PASS)me={id:u,admin:true,name:'ผู้ดูแลระบบ'};
 else{const{data}=await sb.from('cm21910_students').select('*').eq('id',u).eq('password',p).maybeSingle();
  if(!data){document.exitFullscreen?.().catch(()=>{});return document.getElementById('err').textContent='รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'}me=data}
 save();guard();me.admin?admin():home()}
function logout(){sessionStorage.clear();me=null;document.exitFullscreen?.().catch(()=>{});loginPage()}

async function load(){
 const{data:s}=await sb.from('cm21910_students').select('*').eq('id',me.id).single();if(s){me=s;save()}
 const{data}=await sb.from('cm21910_submissions').select('*').eq('student_id',me.id);subs=data||[]}
async function home(){
 inExam=false;await load();
 app.innerHTML=hdr()+`<div class=rules><b>คำอธิบาย / กติกา</b><ul>
 <li>เมื่อเข้าระบบจะเป็นหน้าจอเต็มทันที และห้ามคัดลอก/วางข้อความ</li>
 <li>อ่านใบความรู้ → ทำใบงาน (≥7 ข้อ) → ทำข้อสอบ 20 ข้อ (พื้นฐาน 10 / ยาก 10)</li>
 <li>ย้อนกลับไปอ่านใบความรู้ได้ทุกเมื่อ <b>ยกเว้นระหว่างทำข้อสอบ</b></li>
 <li>ออกจากโหมดเต็มจอเกิน ${C.LEAVE_SEC} วินาที: ครั้งที่ 1 แจ้งเตือน, ครั้งที่ 2 เตือนว่าจะถูกระงับ, ครั้งที่ 3 ระงับการทำใบงาน ${C.SUSPEND_HOURS} ชั่วโมง</li>
 <li>การส่งงานนับเวลาจาก<b>คนแรกที่ส่งใบงาน</b> หากส่งช้ากว่าคนแรกเกิน ${C.LATE_HOURS} ชั่วโมง จะถือว่า<b>ส่งช้าทันที</b></li></ul></div>
 ${susp()?`<div class=rules style="background:#7f1d1d">ถูกระงับการทำใบงานถึง ${new Date(me.suspended_until).toLocaleString('th-TH')}</div>`:''}
 <div class=grid>${UNITS.map((u,i)=>{const n=i+1,w=g(n,'work'),e=g(n,'exam');return`<div class=card><b>หน่วยที่ ${n}</b><br>${esc(u.t)}<p>
 <span class="tag ${g(n,'read')?'ok':''}">อ่าน</span><span class="tag ${w?(w.late?'late':'ok'):''}">ใบงาน${w&&w.late?' (ส่งช้า)':''}${w&&w.score!=null?' '+w.score+'/'+w.total:''}</span><span class="tag ${e?'ok':''}">สอบ${e?' '+e.score+'/'+e.total:''}</span></p>
 <button onclick="unit(${n})">เปิดหน่วยนี้</button></div>`}).join('')}</div>`}

function unit(n){
 const u=UNITS[n-1],r=g(n,'read'),w=g(n,'work'),e=g(n,'exam');
 app.innerHTML=hdr('home()')+`<article>${u.k}</article><div class=card>
 ${r?'':`<button onclick="markRead(${n})">อ่านจบแล้ว → ไปทำใบงาน</button>`}
 <button ${r&&!w?'':'disabled'} onclick="work(${n})">ใบงาน (${u.w.length} ข้อ)${w?' ✓ ส่งแล้ว':''}</button>
 <button ${w&&!e?'':'disabled'} onclick="exam(${n})">ทำข้อสอบ${e?' ✓ '+e.score+'/'+e.total:''}</button></div>`}
async function markRead(n){
 await sb.from('cm21910_submissions').upsert({student_id:me.id,unit:n,kind:'read'},{onConflict:'student_id,unit,kind'});
 await load();work(n)}

function work(n){
 if(susp())return alert('ถูกระงับการทำใบงานชั่วคราว');
 if(g(n,'work'))return unit(n);
 const u=UNITS[n-1];
 app.innerHTML=hdr(`unit(${n})`)+`<h2>ใบงานหน่วยที่ ${n}: ${esc(u.t)}</h2><p class=tag>กลับไปอ่านใบความรู้ได้ด้วยปุ่ม "กลับ"</p>
 ${u.w.map((q,i)=>`<div class=q><b>${i+1}.</b> ${esc(q)}<textarea class=ans rows=3></textarea></div>`).join('')}
 <button onclick="submitWork(${n})">ส่งใบงาน</button>`}
async function submitWork(n){
 const a=[...document.querySelectorAll('.ans')].map(t=>t.value.trim());
 if(a.some(x=>!x))return alert('กรุณาตอบให้ครบทุกข้อ');
 if(susp())return alert('ถูกระงับการทำใบงานชั่วคราว');
 const{data:f}=await sb.from('cm21910_submissions').select('submitted_at').eq('unit',n).eq('kind','work').order('submitted_at').limit(1);
 const late=f&&f.length?Date.now()-new Date(f[0].submitted_at)>C.LATE_HOURS*36e5:false;
 const{error}=await sb.from('cm21910_submissions').insert({student_id:me.id,unit:n,kind:'work',answers:a,late});
 if(error)return alert('ส่งไม่สำเร็จ: '+error.message);
 await load();alert(late?'ส่งแล้ว (ส่งช้า)':'ส่งใบงานเรียบร้อย');unit(n)}

function exam(n){
 const u=UNITS[n-1];
 if(susp())return alert('ถูกระงับการทำใบงานชั่วคราว');
 if(!u.e.length)return alert('หน่วยนี้ยังไม่มีข้อสอบ');
 inExam=true;
 app.innerHTML=`<header><b>ข้อสอบหน่วยที่ ${n}</b><span class=tag>ห้ามย้อนดูใบความรู้ระหว่างสอบ</span></header>
 ${u.e.map((q,i)=>`<div class=q><b>${i+1}. [${q[0]==='b'?'พื้นฐาน':'ยาก'}]</b> ${esc(q[1])}${q[2].map((c,j)=>`<label><input type=radio name=q${i} value=${j} style="width:auto"> ${esc(c)}</label>`).join('')}</div>`).join('')}
 <button onclick="submitExam(${n})">ส่งข้อสอบ</button>`}
async function submitExam(n){
 const u=UNITS[n-1],idx=u.e.map((_,i)=>{const r=document.querySelector(`input[name=q${i}]:checked`);return r?+r.value:-1});
 if(idx.includes(-1)&&!confirm('ยังตอบไม่ครบ ต้องการส่งหรือไม่'))return;
 const score=idx.filter((x,i)=>x===u.e[i][3]).length,a=idx.map((x,i)=>x<0?null:u.e[i][2][x]);
 const{error}=await sb.from('cm21910_submissions').insert({student_id:me.id,unit:n,kind:'exam',answers:a,score,total:u.e.length});
 if(error)return alert('ส่งไม่สำเร็จ: '+error.message);
 inExam=false;await load();alert(`ส่งแล้ว คะแนน ${score}/${u.e.length}`);home()}

try{me=JSON.parse(sessionStorage.getItem('me'))}catch{}
if(me){guard();showOv('กดปุ่มเพื่อเข้าโหมดเต็มจอ');me.admin?admin():home()}else loginPage();

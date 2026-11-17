// ===== ระบบผู้ดูแล: แดชบอร์ด / ตารางรวม / ตรวจใบงาน / พิมพ์คะแนน =====
let A={st:[],sm:[],tab:'dash',room:'',q:'',gu:1,gf:'all',from:'dash'};
const T_ST='cm21910_students',T_SM='cm21910_submissions';
const sf=(id,n,k)=>A.sm.find(x=>x.student_id===id&&x.unit===n&&x.kind===k);
const fmt=d=>new Date(d).toLocaleString('th-TH');
const nm=id=>A.st.find(s=>s.id===id)||{name:id,room:''};
const rooms=()=>[...new Set(A.st.map(s=>s.room))];
const isSus=s=>s.suspended_until&&new Date(s.suspended_until)>new Date();
const pct=(x)=>x.total?x.score/x.total*100:0;
async function loadAdm(){
 const[a,b]=await Promise.all([sb.from(T_ST).select('*').order('id'),sb.from(T_SM).select('*').limit(5000)]);
 A.st=a.data||[];A.sm=b.data||[]}
async function admin(tab){if(tab)A.tab=tab;await loadAdm();drawAdmin()}
function nav(){return`<div class="noprint tabs">${[['dash','📊 แดชบอร์ด'],['table','📋 ตารางรวม'],['grade','✍️ ตรวจใบงาน'],['print','🖨️ พิมพ์คะแนน'],['manage','👥 จัดการรายชื่อ']].map(([k,l])=>`<button class="${A.tab===k?'':'g'}" onclick="admin('${k}')">${l}</button>`).join(' ')}</div>`}
function drawAdmin(){app.innerHTML=hdr()+nav()+({dash,table:tbl,grade:gradeList,print:printPage,manage}[A.tab])()}
function goBack(){A.from&&A.from.startsWith('stu:')?studentView(A.from.slice(4)):admin(A.from||'dash')}

function dash(){
 const w=A.sm.filter(x=>x.kind==='work'),e=A.sm.filter(x=>x.kind==='exam'),n=A.st.length;
 const pend=w.filter(x=>x.score==null).length,late=w.filter(x=>x.late).length;
 const avg=e.length?(e.reduce((s,x)=>s+pct(x),0)/e.length).toFixed(1)+'%':'-';
 const sus=A.st.filter(isSus),vio=A.st.filter(s=>s.violations>0);
 const card=(t,v,c='')=>`<div class="card stat ${c}"><small>${t}</small><div class=big>${v}</div></div>`;
 const bars=UNITS.map((u,i)=>{const k=i+1,wc=w.filter(x=>x.unit===k).length,ee=e.filter(x=>x.unit===k),av=ee.length?ee.reduce((s,x)=>s+pct(x),0)/ee.length:0;
  return`<tr><td>หน่วย ${k}</td><td style="width:38%"><div class=pb><i style="width:${n?wc/n*100:0}%"></i></div></td><td>${wc}/${n}</td><td style="width:28%"><div class="pb b2"><i style="width:${av}%"></i></div></td><td>${ee.length?av.toFixed(0)+'%':'-'}</td></tr>`}).join('');
 const rec=[...A.sm].filter(x=>x.kind!=='read').sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at)).slice(0,8)
  .map(x=>`<tr><td>${esc(nm(x.student_id).name)}</td><td>หน่วย ${x.unit}</td><td>${x.kind==='work'?'ใบงาน':'สอบ '+x.score+'/'+x.total}${x.late?' <span class="tag late">ช้า</span>':''}</td><td>${fmt(x.submitted_at)}</td></tr>`).join('');
 return`<div class=grid4>${card('นักศึกษาทั้งหมด',n)}${card('ส่งใบงานแล้ว',w.length)}${card('รอตรวจใบงาน',pend,pend?'warn':'')}${card('ส่งช้า',late,late?'bad':'')}
 ${card('ทำข้อสอบแล้ว',e.length)}${card('คะแนนสอบเฉลี่ย',avg)}${card('ถูกระงับตอนนี้',sus.length,sus.length?'bad':'')}${card('เคยออกเต็มจอ',vio.length,vio.length?'warn':'')}</div>
 <div class=card><b>ความคืบหน้ารายหน่วย</b> <small>(ฟ้า = ส่งใบงาน, เขียว = คะแนนสอบเฉลี่ย)</small><div class=sc><table class=full>${bars}</table></div></div>
 <div class=card><b>ส่งงานล่าสุด</b><div class=sc><table class=full>${rec||'<tr><td>ยังไม่มีการส่งงาน</td></tr>'}</table></div></div>
 ${vio.length?`<div class=card><b>ผู้ที่ออกจากเต็มจอ</b><div class=sc><table class=full>${vio.map(s=>`<tr><td>${esc(s.name)}</td><td>${s.violations} ครั้ง</td><td>${isSus(s)?'ระงับถึง '+fmt(s.suspended_until):'-'}</td><td><button class=r onclick="resetStu('${s.id}')">ล้างระงับ</button></td></tr>`).join('')}</table></div></div>`:''}`}

function tbl(){
 const q=A.q.toLowerCase(),ss=A.st.filter(s=>(!A.room||s.room===A.room)&&(!q||s.name.toLowerCase().includes(q)||s.id.includes(q)));
 const c=(id,n)=>{const w=sf(id,n,'work'),e=sf(id,n,'exam');return`<td>${!w?'–':(w.score!=null?w.score:'รอ')+(w.late?'<b class=lt>*</b>':'')} / ${e?e.score:'–'}</td>`};
 return`<div class="card noprint"><select onchange="A.room=this.value;drawAdmin()"><option value="">ทุกห้อง</option>${rooms().map(r=>`<option ${A.room===r?'selected':''}>${esc(r)}</option>`).join('')}</select>
 <input placeholder="ค้นหาชื่อ/รหัส" value="${esc(A.q)}" onchange="A.q=this.value;drawAdmin()" style="max-width:260px"> <small>ช่อง = คะแนนใบงาน / คะแนนสอบ · * = ส่งช้า · รอ = ยังไม่ตรวจ</small></div>
 <div class=sc><table class=full><tr><th>ห้อง<th>รหัส<th>ชื่อ<th>ออกจอ${UNITS.map((_,i)=>`<th>ห.${i+1}`).join('')}<th>รวมงาน<th>รวมสอบ<th></tr>
 ${ss.map(s=>{const sw=A.sm.filter(x=>x.student_id===s.id&&x.kind==='work'&&x.score!=null).reduce((a,x)=>a+x.score,0),se=A.sm.filter(x=>x.student_id===s.id&&x.kind==='exam').reduce((a,x)=>a+x.score,0);
 return`<tr class=hv><td>${esc(s.room)}<td>${s.id}<td>${esc(s.name)}<td>${s.violations}${isSus(s)?' 🚫':''}${UNITS.map((_,i)=>c(s.id,i+1)).join('')}<td><b>${sw}</b><td><b>${se}</b><td><button onclick="studentView('${s.id}')">เปิด</button></tr>`}).join('')}</table></div>`}

function studentView(id){
 A.from='stu:'+id;const s=nm(id);
 const rows=UNITS.map((u,i)=>{const n=i+1,w=sf(id,n,'work'),e=sf(id,n,'exam');
  return`<tr><td>หน่วย ${n}<br><small>${esc(u.t)}</small><td>${!w?'ยังไม่ส่ง':`${w.score!=null?w.score+'/'+w.total:'<b style=color:#fbbf24>รอตรวจ</b>'} ${w.late?'<span class="tag late">ช้า</span>':''}<br><small>${fmt(w.submitted_at)}</small>`}<td>${w?`<button onclick="gradeView(${w.id})">ดูใบงาน/ให้คะแนน</button>`:''}
  <td>${e?e.score+'/'+e.total:'–'}<td>${e?`<button class=g onclick="examView(${e.id})">ดูข้อสอบ</button>`:''}</tr>`}).join('');
 app.innerHTML=hdr('admin(A.tab)')+nav()+`<div class=card><h3>${esc(s.name)}</h3>${s.id} · ${esc(s.room)} · ออกเต็มจอ ${s.violations} ครั้ง ${isSus(s)?'· ระงับถึง '+fmt(s.suspended_until):''}
 <br><button class=r onclick="resetStu('${id}')">ล้างการระงับ</button></div><div class=sc><table class=full><tr><th>หน่วย<th>ใบงาน<th><th>สอบ<th></tr>${rows}</table></div>`}
async function resetStu(id){await sb.from(T_ST).update({violations:0,suspended_until:null}).eq('id',id);await loadAdm();A.from&&A.from.startsWith('stu:')?studentView(id):drawAdmin()}

function gradeView(id){
 const x=A.sm.find(s=>s.id===id),u=UNITS[x.unit-1],s=nm(x.student_id);
 app.innerHTML=hdr('goBack()')+`<div class=card><h3>${esc(s.name)}</h3>${s.id} · ${esc(s.room)}<br>หน่วย ${x.unit}: ${esc(u.t)} · ส่งเมื่อ ${fmt(x.submitted_at)} ${x.late?'<span class="tag late">ส่งช้า</span>':''}</div>
 ${u.w.map((q,i)=>`<div class=q><b>${i+1}. ${esc(q)}</b><div class=ansbox>${esc((x.answers||[])[i])}</div></div>`).join('')}
 <div class=card><b>ให้คะแนนใบงาน</b><br><input id=sc type=number min=0 step=0.5 value="${x.score??''}" style="width:100px" placeholder="คะแนน"> / <input id=mx type=number min=1 value="${x.total??10}" style="width:100px">
 <textarea id=cm rows=2 placeholder="ความเห็น/ข้อเสนอแนะ">${esc(x.comment||'')}</textarea>
 <button onclick="saveGrade(${id},false)">บันทึกคะแนน</button> <button class=g onclick="saveGrade(${id},true)">บันทึกและตรวจคนถัดไป</button></div>`}
async function saveGrade(id,next){
 const sc=parseFloat(document.getElementById('sc').value),mx=parseInt(document.getElementById('mx').value);
 if(isNaN(sc)||sc<0||isNaN(mx)||sc>mx)return alert('กรุณากรอกคะแนนให้ถูกต้อง (0 ถึงคะแนนเต็ม)');
 const{error}=await sb.from(T_SM).update({score:sc,total:mx,comment:document.getElementById('cm').value}).eq('id',id);
 if(error)return alert('บันทึกไม่สำเร็จ: '+error.message);
 const x=A.sm.find(s=>s.id===id);Object.assign(x,{score:sc,total:mx,comment:document.getElementById('cm').value});
 if(next){const nx=A.sm.find(s=>s.kind==='work'&&s.unit===x.unit&&s.score==null);if(nx)return gradeView(nx.id);alert('ตรวจครบทุกคนในหน่วยนี้แล้ว')}
 goBack()}
function examView(id){
 const x=A.sm.find(s=>s.id===id),u=UNITS[x.unit-1],s=nm(x.student_id);
 app.innerHTML=hdr('goBack()')+`<div class=card><h3>${esc(s.name)} — สอบหน่วย ${x.unit}</h3>คะแนน ${x.score}/${x.total}</div>`+u.e.map((q,i)=>{const a=(x.answers||[])[i],c=q[2][q[3]],ok=a===c;
  return`<div class=q><b>${i+1}. [${q[0]==='b'?'พื้นฐาน':'ยาก'}] ${esc(q[1])}</b><br>${ok?'✅':'❌'} คำตอบนักศึกษา: ${esc(a??'ไม่ตอบ')}${ok?'':`<br>คำตอบที่ถูก: ${esc(c)}`}</div>`}).join('')}

function gradeList(){
 const n=A.gu,w=A.sm.filter(x=>x.kind==='work'&&x.unit===n),pend=w.filter(x=>x.score==null).length;
 let ss=A.st.filter(s=>A.gf==='all'||(sf(s.id,n,'work')&&(A.gf==='pending')===(sf(s.id,n,'work').score==null)));
 return`<div class="card noprint"><select onchange="A.gu=+this.value;drawAdmin()">${UNITS.map((u,i)=>`<option value=${i+1} ${n===i+1?'selected':''}>หน่วย ${i+1} ${esc(u.t)}</option>`).join('')}</select>
 <select onchange="A.gf=this.value;drawAdmin()"><option value=all ${A.gf==='all'?'selected':''}>ทั้งหมด</option><option value=pending ${A.gf==='pending'?'selected':''}>รอตรวจ</option><option value=done ${A.gf==='done'?'selected':''}>ตรวจแล้ว</option></select>
 ส่งแล้ว ${w.length}/${A.st.length} · รอตรวจ ${pend} ${pend?`<button onclick="gradeView(${w.find(x=>x.score==null).id})">เริ่มตรวจคนแรกที่รอ</button>`:''}</div>
 <div class=sc><table class=full><tr><th>ห้อง<th>รหัส<th>ชื่อ<th>ส่งเมื่อ<th>สถานะ<th>คะแนน<th></tr>
 ${ss.map(s=>{const x=sf(s.id,n,'work');return`<tr class=hv><td>${esc(s.room)}<td>${s.id}<td>${esc(s.name)}<td>${x?fmt(x.submitted_at):'-'}<td>${x?(x.late?'<span class="tag late">ส่งช้า</span>':'<span class="tag ok">ตรงเวลา</span>'):'ยังไม่ส่ง'}<td>${x?(x.score!=null?x.score+'/'+x.total:'รอตรวจ'):'-'}<td>${x?`<button onclick="A.from='grade';gradeView(${x.id})">${x.score!=null?'แก้คะแนน':'ตรวจ'}</button>`:''}</tr>`}).join('')}</table></div>`}

function printPage(){
 return`<div class=card><h3>พิมพ์รายงานคะแนน</h3>
 ห้อง <select id=pr><option value="">ทุกห้อง (แยกหน้าตามห้อง)</option>${rooms().map(r=>`<option>${esc(r)}</option>`).join('')}</select>
 หน่วย <select id=pu><option value="">ทุกหน่วย</option>${UNITS.map((u,i)=>`<option value=${i+1}>หน่วย ${i+1} ${esc(u.t)}</option>`).join('')}</select><br><br>
 <button onclick="printReport('work')">🖨️ คะแนนใบงาน</button> <button onclick="printReport('exam')">🖨️ คะแนนสอบ</button>
 <p><small>ระบบจะแสดงตัวอย่างก่อน แล้วกดปุ่มพิมพ์ (ใบงานและสอบพิมพ์แยกกัน, สามารถบันทึกเป็น PDF ได้)</small></p></div>`}
function printReport(kind){
 const rm=document.getElementById('pr').value,un=document.getElementById('pu').value,units=un?[+un]:UNITS.map((_,i)=>i+1);
 const mx=n=>{const x=A.sm.find(y=>y.unit===n&&y.kind===kind&&y.total);return x?x.total:(kind==='work'?10:UNITS[n-1].e.length)};
 const rs=rm?[rm]:rooms(),title=kind==='work'?'คะแนนใบงาน':'คะแนนสอบ';
 const body=rs.map(r=>{const ss=A.st.filter(s=>s.room===r);return`<section class=pg><h2>รายงาน${title}</h2><p>วิชา 21910-2018 คอมพิวเตอร์และการบำรุงรักษา · ห้อง ${esc(r)} · ${un?'หน่วยที่ '+un+' '+esc(UNITS[un-1].t):'ทุกหน่วย'} · พิมพ์เมื่อ ${fmt(new Date())}</p>
 <table class=rt><tr><th>ที่<th>รหัสนักศึกษา<th>ชื่อ-สกุล${units.map(n=>`<th>ห.${n}<br><small>(${mx(n)})</small>`).join('')}<th>รวม</tr>
 ${ss.map((s,i)=>{let sum=0;const cs=units.map(n=>{const x=sf(s.id,n,kind);if(!x)return'-';if(x.score==null)return'รอตรวจ';sum+=x.score;return x.score+(x.late?'*':'')});
 return`<tr><td>${i+1}<td>${s.id}<td class=l>${esc(s.name)}${cs.map(c=>`<td>${c}`).join('')}<td><b>${sum}</b></tr>`}).join('')}</table>
 <p>${kind==='work'?'* = ส่งช้า · ':''}"-" = ยังไม่ส่ง</p><p style="margin-top:36px">ลงชื่อ .................................................. ครูผู้สอน</p></section>`}).join('');
 app.innerHTML=hdr("admin('print')")+`<div class=noprint><button onclick="window.print()">🖨️ พิมพ์ / บันทึกเป็น PDF</button></div><div class=printable>${body}</div>`}

// ===== จัดการรายชื่อนักศึกษา (เพิ่ม/แก้ไข/ลบ/รีเซ็ตรหัสผ่าน) =====
function manage(){
 const rs=rooms(),v=id=>document.getElementById(id)?.value??'';
 return`<datalist id=rl>${rs.map(r=>`<option value="${esc(r)}">`).join('')}</datalist>
 <div class=card><h3>เพิ่มนักศึกษาทีละคน</h3><input id=ni placeholder="รหัสนักศึกษา (ตัวเลข)"><input id=nn placeholder="ชื่อ-สกุล"><input id=nr list=rl placeholder="ห้อง" value="${esc(rs[0]||'')}">
 <button onclick="addStu()">เพิ่มนักศึกษา</button> <small>รหัสผ่านเริ่มต้น = ${esc(C.STUDENT_PASS)}</small></div>
 <div class=card><h3>เพิ่มหลายคนพร้อมกัน</h3><small>วางรายชื่อจากตารางได้เลย (รหัส + ชื่อ-สกุล บรรทัดละคน ระบบตัดลำดับและคำว่า "กำลังศึกษา" ให้)</small>
 <textarea id=nb rows=6 placeholder="1    69219100099    นางสาวตัวอย่าง ชื่อดี    กำลังศึกษา"></textarea><input id=nbr list=rl placeholder="ห้อง" value="${esc(rs[0]||'')}">
 <button onclick="bulkStu()">เพิ่มทั้งหมด</button></div>
 <div class=card><b>รายชื่อทั้งหมด ${A.st.length} คน</b></div>
 <div class=sc><table class=full><tr><th>ห้อง<th>รหัส<th>ชื่อ<th></tr>${A.st.map(s=>`<tr class=hv><td>${esc(s.room)}<td>${s.id}<td>${esc(s.name)}<td><button class=g onclick="editStu('${s.id}')">แก้ไข</button> <button class=g onclick="pwStu('${s.id}')">รีเซ็ตรหัสผ่าน</button> <button class=r onclick="delStu('${s.id}')">ลบ</button></tr>`).join('')}</table></div>`}
async function addStu(){
 const g=i=>document.getElementById(i).value.trim(),id=g('ni'),name=g('nn'),room=g('nr');
 if(!/^\d{6,}$/.test(id)||!name||!room)return alert('กรุณากรอกรหัส (ตัวเลข) ชื่อ และห้องให้ครบ');
 if(A.st.some(s=>s.id===id))return alert('มีรหัสนักศึกษานี้อยู่แล้ว');
 const{error}=await sb.from(T_ST).insert({id,name,room,password:C.STUDENT_PASS});
 if(error)return alert('เพิ่มไม่สำเร็จ: '+error.message);
 alert('เพิ่มแล้ว: '+name);admin('manage')}
async function bulkStu(){
 const room=document.getElementById('nbr').value.trim(),txt=document.getElementById('nb').value;
 if(!room)return alert('กรุณาระบุห้อง');
 const seen=new Set(A.st.map(s=>s.id)),rows=[];let dup=0;
 txt.split('\n').map(l=>l.trim()).filter(Boolean).forEach(l=>{
  const p=l.split(/\s+/).filter(Boolean),i=p.findIndex(x=>/^\d{8,}$/.test(x));if(i<0)return;
  const name=p.slice(i+1).filter(x=>x!=='กำลังศึกษา').join(' ');if(!name)return;
  if(seen.has(p[i])){dup++;return}seen.add(p[i]);rows.push({id:p[i],name,room,password:C.STUDENT_PASS})});
 if(!rows.length)return alert('ไม่พบรายชื่อใหม่ที่เพิ่มได้'+(dup?` (ซ้ำกับที่มีอยู่ ${dup} คน)`:''));
 if(!confirm(`เพิ่มนักศึกษา ${rows.length} คน เข้าห้อง ${room}${dup?` (ข้ามที่ซ้ำ ${dup} คน)`:''} ?`))return;
 const{error}=await sb.from(T_ST).insert(rows);
 if(error)return alert('เพิ่มไม่สำเร็จ: '+error.message);
 alert('เพิ่มแล้ว '+rows.length+' คน');admin('manage')}
async function editStu(id){
 const s=nm(id),name=prompt('ชื่อ-สกุล',s.name);if(name===null)return;
 const room=prompt('ห้อง',s.room);if(room===null||!name.trim()||!room.trim())return;
 const{error}=await sb.from(T_ST).update({name:name.trim(),room:room.trim()}).eq('id',id);
 if(error)return alert('แก้ไขไม่สำเร็จ: '+error.message);admin('manage')}
async function pwStu(id){
 if(!confirm('รีเซ็ตรหัสผ่านของ '+nm(id).name+' เป็นค่าเริ่มต้น?'))return;
 await sb.from(T_ST).update({password:C.STUDENT_PASS}).eq('id',id);alert('รีเซ็ตแล้ว')}
async function delStu(id){
 if(!confirm('ลบ '+nm(id).name+' ?\nผลใบงานและคะแนนสอบของนักศึกษาคนนี้จะถูกลบทั้งหมด'))return;
 const{error}=await sb.from(T_ST).delete().eq('id',id);
 if(error)return alert('ลบไม่สำเร็จ: '+error.message);admin('manage')}

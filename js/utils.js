const money = n => `₹${(Number(n)||0).toFixed(2)}`;
const pct = n => `${(Number(n)||0).toFixed(2)}%`;
const num = v => Number(v)||0;
const val = id => document.getElementById(id)?.value ?? '';
const setVal = (id,v) => { const el=document.getElementById(id); if(el) el.value = v ?? ''; };
const byId = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const uuidZero = '00000000-0000-0000-0000-000000000000';
function escapeHtml(s=''){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function table(headers, rows){return `<table><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.join('')}</table>`;}
function kpi(title,value,klass=''){return `<div class="kpi ${klass}"><span>${title}</span><strong>${value}</strong></div>`;}
function optionList(list, selected='', label='name'){
  return `<option value="">Select</option>` + (list||[]).map(x=>`<option value="${x.id}" ${x.id==selected?'selected':''}>${escapeHtml(x[label]||x.name||'')}</option>`).join('');
}
function selectOptions(list, selected='', emptyLabel='Select', label='name'){
  const first = emptyLabel === null ? '' : `<option value="">${escapeHtml(emptyLabel)}</option>`;
  return first + (list||[]).map(x=>`<option value="${x.id}" ${x.id==selected?'selected':''}>${escapeHtml(x[label]||x.name||'')}</option>`).join('');
}
function setSelectOptions(id, list, selected='', emptyLabel='Select', label='name'){
  const el=byId(id); if(!el) return;
  const current = selected !== undefined ? selected : el.value;
  el.innerHTML = selectOptions(list, current, emptyLabel, label);
  if(current) el.value = current;
}
function downloadCSV(filename, rows){
  if(!rows || !rows.length){
    rows=[{'Sample Column':'Add data here'}];
    filename=filename.replace(/\.csv$/,'_sample_schema.csv');
  }
  const headers=Object.keys(rows[0]);
  const csv=[headers.join(','),...rows.map(r=>headers.map(h=>`"${String(r[h]??'').replace(/"/g,'""')}"`).join(','))].join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=filename;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
  showToast(`Downloaded ${filename}`,'success');
}
function effectiveCost(price,waste){ const w=Math.min(num(waste),99.99)/100; return w>=1?num(price):num(price)/(1-w); }
function margin(profit,revenue){ return revenue ? profit/revenue*100 : 0; }
function toBaseUnit(qty, unit){ unit=(unit||'').toLowerCase(); qty=num(qty); if(unit==='kg') return qty*1000; if(unit==='l'||unit==='litre'||unit==='liter') return qty*1000; return qty; }
function unitFamily(unit){ unit=(unit||'').toLowerCase(); if(['kg','g','gram','grams'].includes(unit)) return 'g'; if(['l','litre','liter','ml'].includes(unit)) return 'ml'; return unit || 'piece'; }
async function readSheetFile(file){ const buf=await file.arrayBuffer(); if(file.name.toLowerCase().endsWith('.csv')){ const text=new TextDecoder().decode(buf); return parseCSV(text); } const wb=XLSX.read(buf,{type:'array'}); return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''}); }
function parseCSV(text){ const rows=[]; const lines=text.split(/\r?\n/).filter(x=>x.trim()); if(!lines.length) return rows; const headers=splitCsvLine(lines[0]); for(let i=1;i<lines.length;i++){ const cols=splitCsvLine(lines[i]); const row={}; headers.forEach((h,idx)=>row[h.trim()]=cols[idx]??''); rows.push(row); } return rows; }
function splitCsvLine(line){ const out=[]; let cur='', q=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"'){ if(q && line[i+1]==='"'){cur+='"'; i++;} else q=!q; } else if(c===','&&!q){out.push(cur); cur='';} else cur+=c;} out.push(cur); return out; }
function pick(row, names){ const keys=Object.keys(row); for(const n of names){ const hit=keys.find(k=>k.toLowerCase().replace(/\s|_/g,'').includes(n.toLowerCase().replace(/\s|_/g,''))); if(hit) return row[hit]; } return ''; }

function ensureToastContainer(){
  let el=byId('toastContainer');
  if(!el){ el=document.createElement('div'); el.id='toastContainer'; el.className='toast-container'; document.body.appendChild(el); }
  return el;
}
function showToast(message, type='success', title=''){
  const wrap=ensureToastContainer();
  const item=document.createElement('div');
  item.className=`toast toast-${type}`;
  item.innerHTML=`<div><strong>${escapeHtml(title || (type==='error'?'Action failed':type==='warning'?'Check this':'Done'))}</strong><p>${escapeHtml(message)}</p></div><button type="button" aria-label="Close" onclick="this.closest('.toast').remove()">×</button>`;
  wrap.appendChild(item);
  setTimeout(()=>item.remove(), type==='error'?7000:4200);
}
function showError(message){ showToast(message,'error','Error'); }
function showWarning(message){ showToast(message,'warning','Warning'); }

function ensureDeleteModal(){
  let el=byId('deleteConfirmModal');
  if(el) return el;
  el=document.createElement('div');
  el.id='deleteConfirmModal';
  el.className='modal-backdrop hidden';
  el.innerHTML=`<div class="modal-card"><h3 id="deleteModalTitle">Confirm deletion</h3><p id="deleteModalMessage" class="muted"></p><p class="delete-instruction">Type <strong>DELETE</strong> to confirm.</p><input id="deleteConfirmInput" autocomplete="off" placeholder="Type DELETE"><div class="modal-actions"><button id="deleteCancelBtn" class="btn-secondary">Cancel</button><button id="deleteConfirmBtn" class="btn-danger">Delete</button></div></div>`;
  document.body.appendChild(el);
  return el;
}
function confirmTypedDelete(message='This action cannot be undone.', title='Confirm deletion'){
  return new Promise(resolve=>{
    const modal=ensureDeleteModal();
    const input=byId('deleteConfirmInput');
    byId('deleteModalTitle').textContent=title;
    byId('deleteModalMessage').textContent=message;
    input.value='';
    modal.classList.remove('hidden');
    setTimeout(()=>input.focus(), 50);
    const cleanup=(answer)=>{
      modal.classList.add('hidden');
      byId('deleteCancelBtn').onclick=null;
      byId('deleteConfirmBtn').onclick=null;
      input.onkeydown=null;
      resolve(answer);
    };
    byId('deleteCancelBtn').onclick=()=>cleanup(false);
    byId('deleteConfirmBtn').onclick=()=>{
      if(input.value.trim()==='DELETE') cleanup(true);
      else showWarning('Please type DELETE exactly to confirm.');
    };
    input.onkeydown=(e)=>{ if(e.key==='Enter') byId('deleteConfirmBtn').click(); if(e.key==='Escape') cleanup(false); };
  });
}

function getCheckedValues(selector){ return [...document.querySelectorAll(selector+':checked')].map(x=>x.value); }
function setChecked(selector, checked){ document.querySelectorAll(selector).forEach(x=>x.checked=checked); }
function safeRefresh(fn){ try{ fn && fn(); }catch(e){ console.warn(e); } }

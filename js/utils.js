const money = n => `₹${(Number(n)||0).toFixed(2)}`;
const pct = n => `${(Number(n)||0).toFixed(2)}%`;
const num = v => Number(String(v??'').replace(/,/g,''))||0;
const val = id => document.getElementById(id)?.value ?? '';
const setVal = (id,v) => { const el=document.getElementById(id); if(el) el.value = v ?? ''; };
const byId = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const uuidZero = '00000000-0000-0000-0000-000000000000';
function escapeHtml(s=''){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function table(headers, rows){return `<table class="data-table structured-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="${headers.length}" class="empty-cell">No data yet.</td></tr>`}</tbody></table>`;}
function expandableNote(text,max=56){ const raw=String(text||'').trim(); if(!raw) return ''; const safe=escapeHtml(raw); if(raw.length<=max) return `<span class="note-text">${safe}</span>`; const preview=escapeHtml(raw.slice(0,max).trim())+'…'; return `<details class="note-details"><summary><span>${preview}</span><em>More</em></summary><div>${safe}</div></details>`;}
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
function unitOptions(selected='', emptyLabel='Select Unit'){
  const fallback=['kg','g','gm','ltr','litre','ml','piece','pcs','portion','packet','box','tray','carton'];
  const fromMaster=(state.units||[]).filter(u=>u.active!==false).map(u=>({value:u.symbol||u.name,label:u.name&&u.symbol&&u.name!==u.symbol?`${u.name} (${u.symbol})`:(u.symbol||u.name)}));
  const fromData=[...state.ingredients.flatMap(i=>[i.purchase_unit,i.consumption_unit]),...state.recipes.map(r=>r.yield_unit),...state.recipeItems.map(r=>r.unit),...state.productRecipes.map(r=>r.unit),...fallback].filter(Boolean).map(x=>({value:String(x),label:String(x)}));
  const seen=new Set();
  const all=[...fromMaster,...fromData].filter(x=>{ const key=String(x.value||'').toLowerCase(); if(!key||seen.has(key)) return false; seen.add(key); return true; }).sort((a,b)=>String(a.label).localeCompare(String(b.label)));
  return `<option value="">${escapeHtml(emptyLabel)}</option>`+all.map(x=>`<option value="${escapeHtml(x.value)}" ${String(x.value)===String(selected)?'selected':''}>${escapeHtml(x.label)}</option>`).join('');
}
function setUnitSelect(id, selected='', emptyLabel='Select Unit'){
  const el=byId(id); if(!el) return;
  const current=selected!==undefined?selected:el.value;
  el.innerHTML=unitOptions(current, emptyLabel);
  if(current) el.value=current;
}
function downloadCSV(filename, rows){
  if(!rows || !rows.length){ rows=[{'Sample Column':'Add data here'}]; filename=filename.replace(/\.csv$/,'_sample_schema.csv'); }
  const headers=Object.keys(rows[0]);
  const csv=[headers.join(','),...rows.map(r=>headers.map(h=>`"${String(r[h]??'').replace(/"/g,'""')}"`).join(','))].join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=filename;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
  showToast(`Downloaded ${filename}`,'success');
}
function downloadImportIssues(filename, issues=[]){
  if(!issues.length) return '';
  const rows=issues.map(x=>({'Row':x.rowNumber||'', 'Sheet':x.sheetName||'', 'Reason':x.reason||'', 'Name / Item':x.name||'', 'Source File':x.sourceFile||''}));
  downloadCSV(filename, rows);
  return `<button class="btn-secondary" onclick='downloadCSV("${filename.replace(/"/g,'')}", ${JSON.stringify(rows).replace(/'/g,"&#39;")})'>Download skipped reason CSV</button>`;
}
function effectiveCost(price,waste){ const w=Math.min(num(waste),99.99)/100; return w>=1?num(price):num(price)/(1-w); }
function margin(profit,revenue){ return revenue ? profit/revenue*100 : 0; }
function toBaseUnit(qty, unit){ unit=(unit||'').toLowerCase().replace(/\./g,''); qty=num(qty); if(['kg','kilogram','kilograms'].includes(unit)) return qty*1000; if(['ltr','l','litre','liter','litres','liters'].includes(unit)) return qty*1000; return qty; }
function unitFamily(unit){ unit=(unit||'').toLowerCase().replace(/\./g,''); if(['kg','g','gm','gram','grams','kilogram','kilograms'].includes(unit)) return 'g'; if(['l','ltr','litre','liter','ml'].includes(unit)) return 'ml'; if(['pcs','pc','piece','pieces'].includes(unit)) return 'piece'; return unit || 'piece'; }
function uniqueCleanValues(values){ return [...new Set((values||[]).map(v=>String(v||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b)); }
function setDatalistOptions(id, values){ const el=byId(id); if(!el) return; el.innerHTML=uniqueCleanValues(values).map(v=>`<option value="${escapeHtml(v)}"></option>`).join(''); }

const smartSuggestStore = {};

function suggestionItemsFromValues(values, typeLabel='Suggestion'){
  return uniqueCleanValues(values).map(v=>({value:v, label:v, meta:typeLabel}));
}
function setSmartSuggestions(inputId, values){
  const input=byId(inputId); if(!input) return;
  const prepared=(values||[]).map(v=>{
    if(typeof v==='object' && v!==null){
      const value=String(v.value ?? v.label ?? '').trim();
      if(!value) return null;
      return {value, label:String(v.label ?? value), meta:String(v.meta ?? ''), badge:String(v.badge ?? '')};
    }
    const value=String(v||'').trim();
    return value?{value, label:value, meta:'', badge:''}:null;
  }).filter(Boolean);
  const seen=new Set();
  smartSuggestStore[inputId]=prepared.filter(x=>{ const k=x.value.toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true; }).sort((a,b)=>a.label.localeCompare(b.label));
  input.removeAttribute('list');
  input.classList.add('smart-input');
  input.setAttribute('autocomplete','off');
  if(input.dataset.smartSuggestBound==='true') return;
  input.dataset.smartSuggestBound='true';
  const render=()=>showSmartSuggestions(inputId);
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('keydown', e=>{
    const panel=byId('smartSuggestPanel');
    if(e.key==='Escape') hideSmartSuggestions();
    if(e.key==='ArrowDown' && panel && !panel.classList.contains('hidden')){ e.preventDefault(); panel.querySelector('.smart-suggest-option')?.focus(); }
  });
}
function hideSmartSuggestions(){ const panel=byId('smartSuggestPanel'); if(panel) panel.classList.add('hidden'); }
function showSmartSuggestions(inputId){
  const input=byId(inputId); if(!input) return;
  let panel=byId('smartSuggestPanel');
  if(!panel){ panel=document.createElement('div'); panel.id='smartSuggestPanel'; panel.className='smart-suggest-panel hidden'; document.body.appendChild(panel); bindDropdownScrollContainment(panel); }
  bindDropdownScrollContainment(panel);
  const raw=String(input.value||'').toLowerCase();
  const values=(smartSuggestStore[inputId]||[]).filter(v=>!raw || `${v.value} ${v.label} ${v.meta} ${v.badge}`.toLowerCase().includes(raw)).slice(0,14);
  if(!values.length){ hideSmartSuggestions(); return; }
  const rect=input.getBoundingClientRect();
  panel.style.left=`${rect.left + window.scrollX}px`;
  panel.style.top=`${rect.bottom + window.scrollY + 6}px`;
  panel.style.width=`${Math.max(rect.width,280)}px`;
  panel.innerHTML=`<div class="smart-suggest-header">Suggestions</div>`+values.map(v=>`<button type="button" class="smart-suggest-option" data-value="${escapeHtml(v.value)}"><span><strong>${escapeHtml(v.label)}</strong>${v.meta?`<small>${escapeHtml(v.meta)}</small>`:''}</span>${v.badge?`<em>${escapeHtml(v.badge)}</em>`:''}</button>`).join('');
  panel.classList.remove('hidden');
  panel.querySelectorAll('.smart-suggest-option').forEach((btn,idx)=>{
    btn.onmousedown=(e)=>{ e.preventDefault(); input.value=btn.dataset.value || ''; hideSmartSuggestions(); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); };
    btn.onkeydown=(e)=>{
      const options=[...panel.querySelectorAll('.smart-suggest-option')];
      if(e.key==='ArrowDown'){ e.preventDefault(); (options[idx+1]||options[0]).focus(); }
      if(e.key==='ArrowUp'){ e.preventDefault(); (options[idx-1]||options[options.length-1]).focus(); }
      if(e.key==='Escape'){ hideSmartSuggestions(); input.focus(); }
      if(e.key==='Enter'){ e.preventDefault(); btn.dispatchEvent(new MouseEvent('mousedown',{bubbles:true})); }
    };
  });
}
function refreshGlobalSmartSuggestions(){
  const productSuggestions=(state.products||[]).flatMap(p=>[
    {value:p.name, label:p.name, meta:[p.category, branchName(p.branch_id)].filter(Boolean).join(' · ') || 'Product', badge:'Product'},
    p.category?{value:p.category, label:p.category, meta:'Product category', badge:'Category'}:null
  ]).filter(Boolean);
  const ingredientSuggestions=(state.ingredients||[]).flatMap(i=>[
    {value:i.name, label:i.name, meta:[i.category, i.purchase_unit].filter(Boolean).join(' · ') || 'Ingredient', badge:'Ingredient'},
    i.category?{value:i.category, label:i.category, meta:'Ingredient category', badge:'Category'}:null
  ]).filter(Boolean);
  const recipeSuggestions=(state.recipes||[]).flatMap(r=>[
    {value:r.name, label:r.name, meta:[r.category, r.yield_unit].filter(Boolean).join(' · ') || 'Recipe', badge:'Recipe'},
    r.category?{value:r.category, label:r.category, meta:'Recipe category', badge:'Category'}:null
  ]).filter(Boolean);
  const branchSuggestions=(state.branches||[]).map(b=>({value:b.name,label:b.name,meta:b.location||'Branch',badge:'Branch'}));
  const unitSuggestions=(state.units||[]).map(u=>({value:u.symbol||u.name,label:u.name||u.symbol,meta:u.symbol&&u.name!==u.symbol?u.symbol:(u.type||'Unit'),badge:'Unit'}));
  const expenseCategories=['Raw Material','Packaging','Salary','Utilities','Marketing','Transport','Rent','Miscellaneous'].map(x=>({value:x,label:x,meta:'Expense category',badge:'Category'}));
  const map={
    productName:productSuggestions, productCategory:productSuggestions, productSearch:productSuggestions, bulkProductCategory:productSuggestions,
    ingredientName:ingredientSuggestions, ingredientCategory:ingredientSuggestions, ingredientSearch:ingredientSuggestions, bulkIngredientCategory:ingredientSuggestions,
    recipeName:recipeSuggestions, recipeCategory:recipeSuggestions, recipeSearch:recipeSuggestions,
    expenseDescription:[...ingredientSuggestions,...expenseCategories], expenseItemName:[...ingredientSuggestions,...expenseCategories], expenseCategory:expenseCategories,
    userSearch:branchSuggestions, branchName:branchSuggestions, branchLocation:branchSuggestions,
    unitName:unitSuggestions, unitSymbol:unitSuggestions
  };
  Object.entries(map).forEach(([id,items])=>setSmartSuggestions(id,items));
}
document.addEventListener('click', e=>{ const p=byId('smartSuggestPanel'); if(!p) return; if(p.contains(e.target) || e.target.classList?.contains('smart-input')) return; hideSmartSuggestions(); });
function bindDropdownScrollContainment(panel){
  if(!panel || panel.dataset.scrollContainmentBound==='true') return;
  panel.dataset.scrollContainmentBound='true';
  ['touchstart','touchmove','wheel'].forEach(evt=>panel.addEventListener(evt, e=>e.stopPropagation(), {passive:true}));
}
function isDropdownPanelScrollTarget(target){
  const smart=byId('smartSuggestPanel');
  const kh=byId('khSelectPanel');
  return !!(target && ((smart && smart.contains(target)) || (kh && kh.contains(target))));
}
function handleDropdownWindowScroll(e){
  if(isDropdownPanelScrollTarget(e.target)) return;
  hideSmartSuggestions();
  if(typeof closeKhSelectPanel==='function') closeKhSelectPanel();
}
window.addEventListener('scroll', handleDropdownWindowScroll, true);
window.addEventListener('resize', ()=>{ hideSmartSuggestions(); if(typeof closeKhSelectPanel==='function') closeKhSelectPanel(); });

function excelSerialToDate(value){
  if(value instanceof Date) return value.toISOString().slice(0,10);
  if(typeof value==='number' && value>20000 && value<60000){
    const utc = Math.round((value - 25569) * 86400 * 1000);
    return new Date(utc).toISOString().slice(0,10);
  }
  const str=String(value||'').trim();
  if(!str) return '';
  const date=new Date(str);
  if(!Number.isNaN(date.getTime())) return date.toISOString().slice(0,10);
  return str;
}
function normaliseHeader(h){ return String(h||'').trim().replace(/\s+/g,' '); }
function compactKey(s){ return String(s||'').toLowerCase().replace(/\s|_|\.|\(|\)|₹|%|-|\//g,''); }
function detectHeaderRow(rows){
  const keywords=['date','item','item name','category','qty','qty.','total','amount','name','purchase unit','consumption unit','conversion qty','restaurants','my amount','net sales','paid by','paid to','dr','cr','balance','code','sap code'];
  let best={idx:0,score:-1};
  rows.forEach((row,idx)=>{
    const cells=row.map(x=>String(x||'').trim().toLowerCase()).filter(Boolean);
    const score=cells.reduce((s,c)=>s+(keywords.some(k=>c===k || c.includes(k))?1:0),0);
    if(score>best.score) best={idx,score};
  });
  return best.score>=2 ? best.idx : 0;
}
function rowsFromAoa(aoa, meta={}){
  if(!aoa || !aoa.length) return [];
  const headerIndex=detectHeaderRow(aoa);
  const headers=(aoa[headerIndex]||[]).map((h,i)=>normaliseHeader(h)||`Column ${i+1}`);
  const out=[];
  for(let r=headerIndex+1; r<aoa.length; r++){
    const arr=aoa[r]||[];
    if(!arr.some(v=>String(v??'').trim()!=='')) continue;
    const first=String(arr[0]??'').trim().toLowerCase();
    if(['total','min.','max.','avg.','average','sub total','subtotal'].includes(first)) continue;
    const obj={...meta,__headerRowIndex:headerIndex+1,__rowNumber:r+1};
    headers.forEach((h,i)=>obj[h]=arr[i]??'');
    out.push(obj);
  }
  return out;
}
function workbookMetaFromAoa(aoa, sheetName, fileName){
  const meta={__sheetName:sheetName,__sourceFile:fileName};
  for(const row of aoa.slice(0,8)){
    for(let i=0;i<row.length-1;i++){
      const k=String(row[i]||'').trim().toLowerCase();
      const v=row[i+1];
      if(k==='date:'){
        meta.__dateRange=String(v||'');
        const parts=String(v||'').split(/\s+to\s+/i);
        meta.__dateRangeStart=excelSerialToDate(parts[0]||'');
        meta.__dateRangeEnd=excelSerialToDate(parts[1]||parts[0]||'');
      }
      if(k==='restaurant name:') meta.__restaurantName=String(v||'');
      if(k==='name:') meta.__reportName=String(v||'');
    }
  }
  return meta;
}
async function readSheetFile(file, options={}){
  const buf=await file.arrayBuffer();
  if(file.name.toLowerCase().endsWith('.csv')){
    const text=new TextDecoder().decode(buf);
    return parseCSV(text).map((r,idx)=>({...r,__sourceFile:file.name,__sheetName:'CSV',__rowNumber:idx+2}));
  }
  const wb=XLSX.read(buf,{type:'array',cellDates:true});
  const sheetNames=options.allSheets ? wb.SheetNames : [wb.SheetNames[0]];
  let all=[];
  for(const name of sheetNames){
    const aoa=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:'',blankrows:false,raw:true});
    const meta=workbookMetaFromAoa(aoa,name,file.name);
    all=all.concat(rowsFromAoa(aoa,meta));
  }
  return all;
}
function parseCSV(text){ const rows=[]; const lines=text.split(/\r?\n/).filter(x=>x.trim()); if(!lines.length) return rows; const headers=splitCsvLine(lines[0]); for(let i=1;i<lines.length;i++){ const cols=splitCsvLine(lines[i]); const row={}; headers.forEach((h,idx)=>row[h.trim()]=cols[idx]??''); rows.push(row); } return rows; }
function splitCsvLine(line){ const out=[]; let cur='', q=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"'){ if(q && line[i+1]==='"'){cur+='"'; i++;} else q=!q; } else if(c===','&&!q){out.push(cur); cur='';} else cur+=c;} out.push(cur); return out; }
function pick(row, names){ const keys=Object.keys(row||{}); for(const n of names){ const target=compactKey(n); const hit=keys.find(k=>compactKey(k).includes(target)); if(hit) return row[hit]; } return ''; }
function pickExact(row, names){ const keys=Object.keys(row||{}); for(const n of names){ const target=compactKey(n); const hit=keys.find(k=>compactKey(k)===target); if(hit) return row[hit]; } return ''; }
function inferExpenseCategory(text=''){
  const s=String(text).toLowerCase();
  if(/box|pack|container|tissue|spoon|straw|bag|tape|foil|cup|plate|packers|plastic/.test(s)) return 'Packaging';
  if(/ad|marketing|zomato|swiggy|promotion|apna|hiring/.test(s)) return 'Marketing';
  if(/rent/.test(s)) return 'Rent';
  if(/salary|wage|staff|helper/.test(s)) return 'Salary';
  if(/electric|water|gas|internet|utility|bses|bill|ebill/.test(s)) return 'Utilities';
  if(/transport|auto|rapido|fuel|delivery/.test(s)) return 'Transport';
  if(/chicken|paneer|onion|garlic|ginger|cabbage|carrot|oil|sauce|ragi|maida|milk|coriander|keema|vegetable|dhaniya|spring onion|sugar|timbur|hyperpure|zepto|blinkit|chilli|mutton/.test(s)) return 'Raw Material';
  return 'Miscellaneous';
}
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
  setTimeout(()=>item.remove(), type==='error'?9000:5200);
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
    const cleanup=(answer)=>{ modal.classList.add('hidden'); byId('deleteCancelBtn').onclick=null; byId('deleteConfirmBtn').onclick=null; input.onkeydown=null; resolve(answer); };
    byId('deleteCancelBtn').onclick=()=>cleanup(false);
    byId('deleteConfirmBtn').onclick=()=>{ if(input.value.trim()==='DELETE') cleanup(true); else showWarning('Please type DELETE exactly to confirm.'); };
    input.onkeydown=(e)=>{ if(e.key==='Enter') byId('deleteConfirmBtn').click(); if(e.key==='Escape') cleanup(false); };
  });
}
function getCheckedValues(selector){ return [...document.querySelectorAll(selector+':checked')].map(x=>x.value); }
function setChecked(selector, checked){ document.querySelectorAll(selector).forEach(x=>x.checked=checked); }
function safeRefresh(fn){ try{ fn && fn(); }catch(e){ console.warn(e); } }
function inDateRange(dateValue, start, end){
  const d=excelSerialToDate(dateValue||'');
  if(!d) return true;
  if(start && d < start) return false;
  if(end && d > end) return false;
  return true;
}
function startOfCurrentMonth(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; }

// V1.5 standard card-style select dropdowns
const khSelectState = { activeSelect: null, observer: null, initialised: false };

function getSelectDisplayText(select){
  const selected = select?.selectedOptions?.[0];
  return selected ? selected.textContent.trim() : '';
}
function updateKhSelectTrigger(select){
  if(!select) return;
  const shell = select.closest('.kh-select-shell');
  const valueEl = shell?.querySelector('.kh-select-value');
  const trigger = shell?.querySelector('.kh-select-trigger');
  if(!valueEl || !trigger) return;
  const label = getSelectDisplayText(select) || select.getAttribute('aria-label') || select.getAttribute('placeholder') || 'Select';
  const isPlaceholder = !select.value;
  valueEl.textContent = label;
  valueEl.classList.toggle('kh-select-placeholder', isPlaceholder);
  trigger.setAttribute('aria-disabled', select.disabled ? 'true' : 'false');
}
function closeKhSelectPanel(){
  const panel = byId('khSelectPanel');
  if(panel) panel.classList.add('hidden');
  document.querySelectorAll('.kh-select-shell.open').forEach(x=>x.classList.remove('open'));
  khSelectState.activeSelect = null;
}
function buildKhSelectPanel(select, filterText=''){
  let panel = byId('khSelectPanel');
  if(!panel){
    panel = document.createElement('div');
    panel.id = 'khSelectPanel';
    panel.className = 'kh-select-panel hidden';
    document.body.appendChild(panel);
    bindDropdownScrollContainment(panel);
  }
  bindDropdownScrollContainment(panel);
  const options = [...select.options].map((opt, idx)=>({
    value: opt.value,
    label: opt.textContent.trim(),
    disabled: opt.disabled,
    selected: opt.selected,
    idx
  }));
  const searchable = options.length > 8;
  const q = String(filterText||'').toLowerCase().trim();
  const visible = options.filter(opt=>!q || `${opt.label} ${opt.value}`.toLowerCase().includes(q));
  const title = select.dataset.dropdownTitle || select.closest('.field')?.querySelector('label')?.textContent?.trim() || select.getAttribute('aria-label') || 'Select';
  panel.innerHTML = `
    <div class="kh-select-header">${escapeHtml(title)}</div>
    ${searchable ? `<div class="kh-select-search-wrap"><input class="kh-select-search" id="khSelectSearch" placeholder="Search ${escapeHtml(title.toLowerCase())}" value="${escapeHtml(filterText)}"></div>` : ''}
    <div class="kh-select-options">
      ${visible.length ? visible.map(opt=>`
        <button type="button" class="kh-select-option ${opt.selected?'selected':''}" data-index="${opt.idx}" ${opt.disabled?'disabled':''}>
          <span class="kh-select-option-text">${escapeHtml(opt.label || 'Select')}</span>
          <span class="kh-select-check">✓</span>
        </button>
      `).join('') : `<div class="kh-select-empty">No option found</div>`}
    </div>`;
  panel.querySelectorAll('.kh-select-option').forEach((btn, idx)=>{
    btn.onmousedown = e=>{
      e.preventDefault();
      const optionIndex = Number(btn.dataset.index);
      const opt = select.options[optionIndex];
      if(!opt || opt.disabled) return;
      select.value = opt.value;
      select.dispatchEvent(new Event('input',{bubbles:true}));
      select.dispatchEvent(new Event('change',{bubbles:true}));
      updateKhSelectTrigger(select);
      closeKhSelectPanel();
    };
    btn.onkeydown = e=>{
      const buttons=[...panel.querySelectorAll('.kh-select-option:not([disabled])')];
      const currentIndex=buttons.indexOf(btn);
      if(e.key==='ArrowDown'){ e.preventDefault(); (buttons[currentIndex+1]||buttons[0])?.focus(); }
      if(e.key==='ArrowUp'){ e.preventDefault(); (buttons[currentIndex-1]||buttons[buttons.length-1])?.focus(); }
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); btn.dispatchEvent(new MouseEvent('mousedown',{bubbles:true})); }
      if(e.key==='Escape'){ e.preventDefault(); closeKhSelectPanel(); select.closest('.kh-select-shell')?.querySelector('.kh-select-trigger')?.focus(); }
    };
  });
  const search = byId('khSelectSearch');
  if(search){
    search.oninput = () => buildKhSelectPanel(select, search.value);
    search.onkeydown = e=>{
      if(e.key==='ArrowDown'){ e.preventDefault(); panel.querySelector('.kh-select-option:not([disabled])')?.focus(); }
      if(e.key==='Escape'){ e.preventDefault(); closeKhSelectPanel(); select.closest('.kh-select-shell')?.querySelector('.kh-select-trigger')?.focus(); }
    };
    setTimeout(()=>search.focus(), 20);
  }
  return panel;
}
function openKhSelectPanel(select){
  if(!select || select.disabled) return;
  hideSmartSuggestions?.();
  closeKhSelectPanel();
  khSelectState.activeSelect = select;
  const shell = select.closest('.kh-select-shell');
  shell?.classList.add('open');
  const trigger = shell?.querySelector('.kh-select-trigger');
  const panel = buildKhSelectPanel(select, '');
  const rect = trigger.getBoundingClientRect();
  panel.style.left = `${rect.left + window.scrollX}px`;
  panel.style.top = `${rect.bottom + window.scrollY + 6}px`;
  panel.style.width = `${Math.max(rect.width, 280)}px`;
  panel.classList.remove('hidden');
}
function enhanceKhumbukaSelect(select){
  if(!select || select.dataset.khSelectEnhanced==='true' || select.multiple || select.dataset.nativeSelect==='true') return;
  if(select.closest('.kh-select-shell')){ select.dataset.khSelectEnhanced='true'; updateKhSelectTrigger(select); return; }
  const shell = document.createElement('div');
  shell.className = 'kh-select-shell';
  select.parentNode.insertBefore(shell, select);
  shell.appendChild(select);
  select.dataset.khSelectEnhanced='true';
  select.classList.add('kh-native-select');
  select.setAttribute('tabindex','-1');
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'kh-select-trigger';
  trigger.innerHTML = `<span class="kh-select-value"></span><span class="kh-select-arrow"></span>`;
  shell.appendChild(trigger);
  updateKhSelectTrigger(select);
  trigger.addEventListener('click', e=>{ e.preventDefault(); if(khSelectState.activeSelect === select){ closeKhSelectPanel(); } else { openKhSelectPanel(select); } });
  trigger.addEventListener('keydown', e=>{
    if(['Enter',' ','ArrowDown'].includes(e.key)){ e.preventDefault(); openKhSelectPanel(select); }
    if(e.key==='Escape') closeKhSelectPanel();
  });
  select.addEventListener('change', ()=>updateKhSelectTrigger(select));
  const optionObserver = new MutationObserver(()=>updateKhSelectTrigger(select));
  optionObserver.observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['selected','disabled']});
}
function refreshKhumbukaDropdowns(root=document){
  root.querySelectorAll?.('select').forEach(enhanceKhumbukaSelect);
  root.querySelectorAll?.('select[data-kh-select-enhanced="true"]').forEach(updateKhSelectTrigger);
}
function initKhumbukaDropdowns(){
  refreshKhumbukaDropdowns(document);
  if(khSelectState.initialised) return;
  khSelectState.initialised = true;
  khSelectState.observer = new MutationObserver((mutations)=>{
    for(const m of mutations){
      if(m.type === 'childList'){
        m.addedNodes.forEach(node=>{
          if(node.nodeType !== 1) return;
          if(node.matches?.('select')) enhanceKhumbukaSelect(node);
          refreshKhumbukaDropdowns(node);
        });
      }
    }
  });
  khSelectState.observer.observe(document.body,{childList:true,subtree:true});
}
document.addEventListener('click', e=>{
  const panel = byId('khSelectPanel');
  if(panel?.contains(e.target)) return;
  if(e.target.closest?.('.kh-select-shell')) return;
  closeKhSelectPanel();
});
// Dropdown scroll is handled by handleDropdownWindowScroll above so mobile users can scroll inside open dropdown cards.
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', ()=>setTimeout(initKhumbukaDropdowns, 250));
}else{
  setTimeout(initKhumbukaDropdowns, 250);
}

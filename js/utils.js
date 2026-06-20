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
function optionList(list, selected='', label='name'){return `<option value="">Select</option>` + list.map(x=>`<option value="${x.id}" ${x.id==selected?'selected':''}>${escapeHtml(x[label]||x.name||'')}</option>`).join('');}
function downloadCSV(filename, rows){ if(!rows.length){alert('No data to export');return;} const headers=Object.keys(rows[0]); const csv=[headers.join(','),...rows.map(r=>headers.map(h=>`"${String(r[h]??'').replace(/"/g,'""')}"`).join(','))].join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=filename; a.click(); }
function effectiveCost(price,waste){ const w=Math.min(num(waste),99.99)/100; return w>=1?num(price):num(price)/(1-w); }
function margin(profit,revenue){ return revenue ? profit/revenue*100 : 0; }
function toBaseUnit(qty, unit){ unit=(unit||'').toLowerCase(); qty=num(qty); if(unit==='kg') return qty*1000; if(unit==='l'||unit==='litre'||unit==='liter') return qty*1000; return qty; }
function unitFamily(unit){ unit=(unit||'').toLowerCase(); if(['kg','g','gram','grams'].includes(unit)) return 'g'; if(['l','litre','liter','ml'].includes(unit)) return 'ml'; return unit || 'piece'; }
async function readSheetFile(file){ const buf=await file.arrayBuffer(); if(file.name.toLowerCase().endsWith('.csv')){ const text=new TextDecoder().decode(buf); return parseCSV(text); } const wb=XLSX.read(buf,{type:'array'}); return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''}); }
function parseCSV(text){ const rows=[]; const lines=text.split(/\r?\n/).filter(x=>x.trim()); if(!lines.length) return rows; const headers=splitCsvLine(lines[0]); for(let i=1;i<lines.length;i++){ const cols=splitCsvLine(lines[i]); const row={}; headers.forEach((h,idx)=>row[h.trim()]=cols[idx]??''); rows.push(row); } return rows; }
function splitCsvLine(line){ const out=[]; let cur='', q=false; for(let i=0;i<line.length;i++){ const c=line[i]; if(c==='"'){ if(q && line[i+1]==='"'){cur+='"'; i++;} else q=!q; } else if(c===','&&!q){out.push(cur); cur='';} else cur+=c;} out.push(cur); return out; }
function pick(row, names){ const keys=Object.keys(row); for(const n of names){ const hit=keys.find(k=>k.toLowerCase().replace(/\s|_/g,'').includes(n.toLowerCase().replace(/\s|_/g,''))); if(hit) return row[hit]; } return ''; }

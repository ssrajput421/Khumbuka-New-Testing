async function saveExpense(){
 if(!val('expenseDate')) setVal('expenseDate',today());
 const amount=num(val('expenseAmount'));
 if(!amount) return showWarning('Amount required');
 const row={expense_date:val('expenseDate'),brand_id:val('expenseBrand')||null,branch_id:val('expenseBranch')||null,category:val('expenseCategory'),description:val('expenseDescription') || val('expenseItemName'),amount,notes:val('expenseNotes'),paid_by:val('expensePaidBy'),paid_to:val('expensePaidTo'),item_name:val('expenseItemName'),quantity:num(val('expenseQuantity'))||null,unit_rate:num(val('expenseUnitRate'))||null,cash_received:num(val('expenseCashReceived'))||null,balance_after:val('expenseBalance')===''?null:num(val('expenseBalance')),updated_at:new Date().toISOString()};
 let saved=null;
 if(state.editing.expense) saved=await dbUpdate('expenses',state.editing.expense,row); else saved=await dbInsert('expenses',row);
 if(!saved) return;
 showToast(state.editing.expense?'Expense updated successfully.':'Expense saved successfully.');
 clearExpenseForm(); await refreshAll(false); renderExpenses(); renderDashboard(); renderAnalytics();
}
function clearExpenseForm(){ state.editing.expense=null; setVal('expenseDate',today()); ['expenseDescription','expenseAmount','expenseNotes','expensePaidBy','expensePaidTo','expenseItemName','expenseQuantity','expenseUnitRate','expenseCashReceived','expenseBalance'].forEach(id=>setVal(id,'')); }
async function deleteExpense(id){ const ok=await confirmTypedDelete('Delete this expense entry?', 'Delete expense'); if(!ok) return; const done=await dbDelete('expenses',id); if(done){ showToast('Expense deleted.'); await refreshAll(false); renderExpenses(); renderDashboard(); renderAnalytics(); }}
let dayBookReloadInProgress = false;

async function reloadDayBookEntriesIfNeeded(){
  if(dayBookReloadInProgress || !supabaseClient) return;
  const hasSummaryValues = byId('expensesAnalytics')?.innerText?.trim();
  if((state.expenses || []).length && hasSummaryValues) return;
  dayBookReloadInProgress = true;
  try{
    const rows = await dbSelect('expenses','expense_date');
    state.expenses = rows || [];
    renderExpenses(false);
  }catch(e){
    console.warn('Could not reload Day Book entries', e);
  }finally{
    dayBookReloadInProgress = false;
  }
}

function dayBookRows(){
  return (state.expenses || []).filter(e => e && (e.id || e.expense_date || e.amount || e.item_name || e.description));
}

function renderExpenses(allowFallbackReload=true){
 renderProductSelectors();
 if(!val('expenseDate')) setVal('expenseDate',today());
 const rows = dayBookRows();
 const total=rows.reduce((a,b)=>a+num(b.amount),0);
 const month=new Date().toISOString().slice(0,7);
 const monthTotal=rows.filter(e=>(e.expense_date||'').startsWith(month)).reduce((a,b)=>a+num(b.amount),0);
 const cashReceived=rows.reduce((a,b)=>a+num(b.cash_received),0);
 const cat={}; rows.forEach(e=>cat[e.category]=(cat[e.category]||0)+num(e.amount));
 const topCat=Object.entries(cat).sort((a,b)=>b[1]-a[1])[0];
 byId('expensesAnalytics').innerHTML=kpi('Total Expenses',money(total),'bad')+kpi('This Month',money(monthTotal))+kpi('Cash Received / Cr',money(cashReceived),'good')+kpi('Top Category',topCat?topCat[0]:'-');

 const tableRows = rows.slice().sort((a,b)=>String(b.expense_date||'').localeCompare(String(a.expense_date||'')) || String(b.created_at||'').localeCompare(String(a.created_at||''))).map(e=>{
   const note = expandableNote(e.notes || '', 70);
   const item = e.item_name || e.description || '';
   return `<tr>
    <td class="date-cell">${escapeHtml(e.expense_date||'')}</td>
    <td>${escapeHtml(branchName(e.branch_id)||'')}</td>
    <td><span class="pill muted-pill">${escapeHtml(e.category||'Miscellaneous')}</span></td>
    <td>${escapeHtml(e.paid_by||'')}</td>
    <td>${escapeHtml(e.paid_to||'')}</td>
    <td class="wide-name-cell">${escapeHtml(item)}</td>
    <td class="num-cell">${num(e.quantity)||''}</td>
    <td class="num-cell">${e.unit_rate?money(e.unit_rate):''}</td>
    <td class="num-cell value-negative">${money(e.amount)}</td>
    <td class="num-cell value-positive">${e.cash_received?money(e.cash_received):''}</td>
    <td class="num-cell ${num(e.balance_after) < 0 ? 'value-negative' : 'value-positive'}">${e.balance_after!==null&&e.balance_after!==undefined?money(e.balance_after):''}</td>
    <td class="notes-cell">${note}</td>
    <td class="actions-cell"><button class="btn-danger" onclick="deleteExpense('${e.id}')">Delete</button></td>
  </tr>`;
 });
 const tableHtml = table(['Date','Branch','Category','Paid By','Paid To','Item Name','Qty','Rate / Dr','Total','Cr','Balance','Notes','Actions'], tableRows);
 byId('expensesTable').innerHTML = `<div class="table-meta-row"><span>${rows.length} day book entr${rows.length===1?'y':'ies'} loaded</span>${rows.length?'':'<span class="muted">If you imported data, click Refresh once.</span>'}</div>${tableHtml}`;
 if(!rows.length && allowFallbackReload) reloadDayBookEntriesIfNeeded();
}
function exportExpensesCSV(){
 const currentRows=dayBookRows();
 const rows=currentRows.length ? currentRows.map(e=>({'Date':e.expense_date,'Branch':branchName(e.branch_id),'Category':e.category,'Paid By':e.paid_by,'Paid To':e.paid_to,'Item Name':e.item_name||e.description,'Quantity':e.quantity,'Dr / Rate':e.unit_rate,'Total / Amount':e.amount,'Cr / Cash Received':e.cash_received,'Balance':e.balance_after,'Notes':e.notes,'Source Sheet':e.source_sheet,'Row Number':e.row_number})) : [{'Date':today(),'Branch':'Matiyala','Category':'Raw Material','Paid By':'Shivam','Paid To':'Chicken Shop','Item Name':'Chicken','Quantity':2,'Dr / Rate':260,'Total / Amount':520,'Cr / Cash Received':0,'Balance':1107.8,'Notes':'Sample Day Book row','Source Sheet':'June','Row Number':7}];
 downloadCSV(currentRows.length?'khumbuka_day_book_expenses.csv':'khumbuka_day_book_sample_schema.csv', rows);
}

async function refreshAll(render=true, notify=false){
 if(notify) showToast('Refreshing data from Supabase...', 'warning', 'Refreshing');
 await loadAll();
 renderProductSelectors();
 renderRecipeSelectors();
 renderUnitSelectors();
 if(typeof renderPricingProductSelector==='function') renderPricingProductSelector();
 if(typeof refreshGlobalSmartSuggestions==='function') refreshGlobalSmartSuggestions();
 if(render){
  renderDashboard(); renderProducts(); renderRecipes(); renderIngredients(); renderSales(); renderExpenses(); renderAnalytics(); renderCartSimulator(); renderSettings(); renderUsers(); if(typeof refreshGlobalSmartSuggestions==='function') refreshGlobalSmartSuggestions(); if(typeof renderDataWarnings==='function') renderDataWarnings();
 }
 if(notify) showToast('Latest data loaded successfully.');
}
async function manualRefresh(){
 const tab=currentTabId();
 await refreshAll(true,true);
 showTab(tab,false);
}


// Clean, non-disruptive data warning system
const DATA_WARNING_HIDDEN_KEY = 'khumbuka_data_warning_center_hidden';
const DATA_WARNING_DISMISSED_KEY = 'khumbuka_data_warnings_dismissed';

function getDismissedDataWarnings(){
  try { return JSON.parse(localStorage.getItem(DATA_WARNING_DISMISSED_KEY) || '{}') || {}; } catch(e){ return {}; }
}
function saveDismissedDataWarnings(map){ localStorage.setItem(DATA_WARNING_DISMISSED_KEY, JSON.stringify(map || {})); }
function dismissDataWarning(id){ const map=getDismissedDataWarnings(); map[id]=new Date().toISOString(); saveDismissedDataWarnings(map); renderDataWarnings(); }
function clearDismissedDataWarnings(){ localStorage.removeItem(DATA_WARNING_DISMISSED_KEY); renderDataWarnings(); }
function hideDataWarningCenter(){ localStorage.setItem(DATA_WARNING_HIDDEN_KEY, 'true'); renderDataWarnings(); }
function showDataWarningCenter(){ localStorage.removeItem(DATA_WARNING_HIDDEN_KEY); renderDataWarnings(); }
function warningCountLabel(count){ return `${count} data ${count===1?'warning':'warnings'}`; }
function warningRow(id, severity, area, title, detail, tab){ return {id, severity, area, title, detail, tab}; }
function calculateDataWarnings(){
  const warnings=[];
  const products=state.products||[];
  const ingredients=state.ingredients||[];
  const recipes=state.recipes||[];
  const recipeItems=state.recipeItems||[];
  const productRecipes=state.productRecipes||[];
  const sales=state.sales||[];
  const expenses=state.expenses||[];
  const users=state.appUsers||[];
  const units=state.units||[];

  if(!ingredients.length) warnings.push(warningRow('no_ingredients','high','Ingredients','No ingredients found','Add or import ingredients before relying on recipe and product costing.','ingredients'));
  if(!products.length) warnings.push(warningRow('no_products','high','Products','No products found','Add or import products so sales reports can be matched and analyzed.','products'));
  if(!units.length) warnings.push(warningRow('no_units','medium','Settings','No Unit Master values found','Add units like kg, g, ml, piece and portion to keep costing consistent.','imports'));

  const missingIngredientPrice=ingredients.filter(i=>num(i.purchase_price)<=0);
  if(missingIngredientPrice.length) warnings.push(warningRow('ingredient_missing_price','high','Ingredients',`${missingIngredientPrice.length} ingredient(s) missing purchase price`,'These ingredients can make recipe and product costs inaccurate.','ingredients'));

  const missingIngredientUnits=ingredients.filter(i=>!i.purchase_unit || !i.consumption_unit);
  if(missingIngredientUnits.length) warnings.push(warningRow('ingredient_missing_units','medium','Ingredients',`${missingIngredientUnits.length} ingredient(s) missing purchase/consumption unit`,'Purchase unit and consumption unit are needed for clean recipe conversions.','ingredients'));

  const missingConversion=ingredients.filter(i=>String(i.purchase_unit||'').trim() && String(i.consumption_unit||'').trim() && String(i.purchase_unit||'').toLowerCase()!==String(i.consumption_unit||'').toLowerCase() && num(i.conversion_quantity)<=0);
  if(missingConversion.length) warnings.push(warningRow('ingredient_missing_conversion','medium','Ingredients',`${missingConversion.length} ingredient(s) missing conversion quantity`,'Example: 1 kg = 1000 g. Add conversion quantity where purchase and usage units differ.','ingredients'));

  const recipeMissingYield=recipes.filter(r=>num(r.yield_quantity)<=0 || !r.yield_unit);
  if(recipeMissingYield.length) warnings.push(warningRow('recipe_missing_yield','high','Recipes',`${recipeMissingYield.length} recipe(s) missing yield`,'Yield quantity and unit are required to calculate cost per gram/ml/piece.','recipes'));

  const recipeWithoutItems=recipes.filter(r=>!recipeItems.some(x=>x.recipe_id===r.id));
  if(recipeWithoutItems.length) warnings.push(warningRow('recipe_without_items','medium','Recipes',`${recipeWithoutItems.length} recipe(s) have no ingredients`,'Attach ingredients to recipes before using them for product costing.','recipes'));

  const productsMissingCost=products.filter(p=>{
    const cost = typeof computedProductCost === 'function' ? computedProductCost(p) : num(p.product_cost || p.manual_product_cost);
    return cost <= 0;
  });
  if(productsMissingCost.length) warnings.push(warningRow('product_missing_cost','high','Products',`${productsMissingCost.length} product(s) missing cost`,'Add recipe links or manual product cost so margins are reliable.','products'));

  const productsMissingPrices=products.filter(p=>num(p.offline_price)<=0 || num(p.online_price)<=0);
  if(productsMissingPrices.length) warnings.push(warningRow('product_missing_prices','medium','Products',`${productsMissingPrices.length} product(s) missing online/offline price`,'Add both prices to compare online and offline profitability.','products'));

  const productsWithoutRecipes=products.filter(p=>!productRecipes.some(x=>x.product_id===p.id) && num(p.manual_product_cost || p.product_cost)<=0);
  if(productsWithoutRecipes.length) warnings.push(warningRow('product_without_recipes','medium','Products',`${productsWithoutRecipes.length} product(s) have no recipe mapping`,'Product recipe mapping gives more accurate costing than manual cost only.','products'));

  const unmatchedSales=sales.filter(s=>!s.product_id);
  if(unmatchedSales.length) warnings.push(warningRow('unmatched_sales','high','Sales Import',`${unmatchedSales.length} unmatched sales row(s)`,'Map Petpooja item names to Product Master so food cost, profit and margin can be calculated.','sales'));

  const salesMissingFinancials=sales.filter(s=>num(s.net_revenue)<=0 || (num(s.food_cost)<=0 && num(s.packaging_cost)<=0 && s.product_id));
  if(salesMissingFinancials.length) warnings.push(warningRow('sales_missing_costs','medium','Sales Import',`${salesMissingFinancials.length} sales row(s) may have missing revenue/cost`,'Check imported sales rows where revenue or costs look incomplete.','sales'));

  const importIssues=state.importRejections||[];
  if(importIssues.length) warnings.push(warningRow('import_rejections','medium','Imports',`${importIssues.length} skipped import row(s)`,'Open the latest import result or skipped-row CSV to see what did not import.','sales'));

  const expenseMissingFields=expenses.filter(e=>!e.expense_date || !e.category || num(e.amount)<=0);
  if(expenseMissingFields.length) warnings.push(warningRow('expense_missing_fields','medium','Day Book',`${expenseMissingFields.length} day book row(s) missing date/category/amount`,'Expense analytics work best when each row has date, category and amount.','expenses'));

  const expensesWithoutBranch=expenses.filter(e=>!e.branch_id);
  if(expenses.length && expensesWithoutBranch.length) warnings.push(warningRow('expense_missing_branch','low','Day Book',`${expensesWithoutBranch.length} expense row(s) not assigned to a branch`,'Assign branch when you want branch-level profitability to be accurate.','expenses'));

  const usersWithoutRole=users.filter(u=>!u.role_id);
  if(usersWithoutRole.length) warnings.push(warningRow('user_missing_role','low','Users',`${usersWithoutRole.length} user(s) missing role`,'Assign roles now so permission setup is ready when authentication is enabled.','users'));

  return warnings;
}
function dataWarningSeverityRank(severity){ return severity==='high'?3:severity==='medium'?2:1; }
function renderDataWarnings(){
  const dashboard=byId('dashboard');
  if(!dashboard) return;
  let wrap=byId('dataWarningCenter');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='dataWarningCenter';
    const title=dashboard.querySelector('.page-title');
    title?.insertAdjacentElement('afterend', wrap);
  }
  const all=calculateDataWarnings().sort((a,b)=>dataWarningSeverityRank(b.severity)-dataWarningSeverityRank(a.severity));
  const dismissed=getDismissedDataWarnings();
  const active=all.filter(w=>!dismissed[w.id]);
  const hidden=localStorage.getItem(DATA_WARNING_HIDDEN_KEY)==='true';
  if(!all.length){ wrap.innerHTML=''; wrap.className='data-warning-center hidden'; return; }
  wrap.className='data-warning-center';
  if(hidden){
    wrap.innerHTML=`<div class="data-warning-mini"><span>Data warnings hidden</span><strong>${warningCountLabel(active.length)}</strong><button type="button" onclick="showDataWarningCenter()">Show</button></div>`;
    return;
  }
  const visible=active.slice(0,6);
  const dismissedCount=all.length-active.length;
  const severityText=active.some(w=>w.severity==='high')?'Needs attention':active.length?'Check soon':'All visible warnings dismissed';
  wrap.innerHTML=`
    <div class="data-warning-card">
      <div class="data-warning-head">
        <div><span class="data-warning-eyebrow">Data Health</span><h3>${escapeHtml(severityText)}</h3><p>${active.length ? `You have ${warningCountLabel(active.length)}. These are reminders only and will not block your work.` : 'All current warnings are dismissed.'}</p></div>
        <div class="data-warning-actions"><button type="button" class="btn-secondary" onclick="hideDataWarningCenter()">Hide</button>${dismissedCount?`<button type="button" class="btn-secondary" onclick="clearDismissedDataWarnings()">Restore dismissed</button>`:''}</div>
      </div>
      ${visible.length?`<div class="data-warning-list">${visible.map(w=>`
        <div class="data-warning-item ${w.severity}">
          <div><strong>${escapeHtml(w.title)}</strong><p><span>${escapeHtml(w.area)}</span> · ${escapeHtml(w.detail)}</p></div>
          <div class="data-warning-item-actions"><button type="button" onclick="showTab('${w.tab}')">Open</button><button type="button" class="icon-button" aria-label="Dismiss warning" onclick="dismissDataWarning('${w.id}')">×</button></div>
        </div>`).join('')}</div>`:`<div class="data-warning-empty">No active warnings. Good work.</div>`}
      ${active.length>visible.length?`<p class="data-warning-more">+ ${active.length-visible.length} more warning(s). Fix the top ones first.</p>`:''}
    </div>`;
}

(function wrapDashboardDataWarnings(){
  const original = window.renderDashboard;
  if(typeof original === 'function' && !original.__khumbukaDataWarningWrapped){
    window.renderDashboard = function(...args){
      const result = original.apply(this,args);
      try{ renderDataWarnings(); }catch(e){ console.warn('Data warning render failed', e); }
      return result;
    };
    window.renderDashboard.__khumbukaDataWarningWrapped = true;
  }
})();

document.addEventListener('DOMContentLoaded', async()=>{
 const sidebar=byId('sidebar');
 if(localStorage.getItem('sidebarCollapsed')==='true' && window.innerWidth>900){ sidebar.classList.add('collapsed'); document.body.classList.add('sidebar-collapsed'); }
 if(!supabaseClient) showError('Supabase client could not load. Check internet and Supabase config.');
 const initialTab=currentTabId();
 showTab(initialTab,true);
 try{
  await refreshAll(false);
 }catch(err){
  console.error(err);
  showError('Some data could not be refreshed. Staying on the current page.');
 }
 showTab(currentTabId(),true);
 if(typeof renderDataWarnings==='function') renderDataWarnings();
});

async function refreshAll(render=true, notify=false){
 if(notify) showToast('Refreshing data from Supabase...', 'warning', 'Refreshing');
 await loadAll();
 renderProductSelectors();
 renderRecipeSelectors();
 renderUnitSelectors();
 if(typeof renderPricingProductSelector==='function') renderPricingProductSelector();
 if(typeof refreshGlobalSmartSuggestions==='function') refreshGlobalSmartSuggestions();
 if(render){
  renderDashboard(); renderProducts(); renderRecipes(); renderIngredients(); renderSales(); renderExpenses(); renderAnalytics(); renderCartSimulator(); renderSettings(); renderUsers(); if(typeof refreshGlobalSmartSuggestions==='function') refreshGlobalSmartSuggestions();
 }
 if(notify) showToast('Latest data loaded successfully.');
}
async function manualRefresh(){
 const tab=currentTabId();
 await refreshAll(true,true);
 showTab(tab,false);
}
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
});

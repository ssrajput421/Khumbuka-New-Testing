function currentTabId(){ return restoreActiveTab(); }
function restoreActiveTab(){
 const allowed=['dashboard','products','costAudit','recipes','ingredients','sales','expenses','analytics','pricing','cart','users','assumptions','imports'];
 const hash=(location.hash||'').replace('#','').trim();
 const saved=localStorage.getItem('khumbuka_active_tab') || sessionStorage.getItem('khumbuka_active_tab') || '';
 if(allowed.includes(hash)) return hash;
 if(allowed.includes(saved)) return saved;
 return 'dashboard';
}
function persistActiveTab(id){
 localStorage.setItem('khumbuka_active_tab', id);
 sessionStorage.setItem('khumbuka_active_tab', id);
 if(location.hash !== `#${id}`) history.replaceState(null,'',`#${id}`);
}
function markActiveTab(id){ document.body.dataset.activeTab=id; }
function showTab(id, persist=true){
 const allowed=['dashboard','products','costAudit','recipes','ingredients','sales','expenses','analytics','pricing','cart','users','assumptions','imports'];
 if(!allowed.includes(id)) id=restoreActiveTab();
 document.querySelectorAll('.tab').forEach(t=>t.classList.add('hidden'));
 byId(id)?.classList.remove('hidden');
 document.querySelectorAll('.sidebar button[data-tab]').forEach(btn=>btn.classList.toggle('active', btn.dataset.tab===id));
 markActiveTab(id);
 if(persist) persistActiveTab(id);
 const renderMap={dashboard:renderDashboard,products:renderProducts,costAudit:(typeof renderCostAudit==='function'?renderCostAudit:()=>{}),recipes:renderRecipes,ingredients:renderIngredients,sales:renderSales,expenses:renderExpenses,analytics:renderAnalytics,cart:renderCartSimulator,imports:renderSettings,users:renderUsers,assumptions:(typeof renderAssumptions==='function'?renderAssumptions:()=>{}),pricing:()=>{}};
 if(renderMap[id]) renderMap[id]();
 closeMobileMenu();
}
function toggleSidebar(){
 const s=byId('sidebar');
 if(window.innerWidth<=900){ toggleMobileMenu(); return; }
 s.classList.toggle('collapsed');
 document.body.classList.toggle('sidebar-collapsed',s.classList.contains('collapsed'));
 localStorage.setItem('sidebarCollapsed',s.classList.contains('collapsed'));
}
function toggleMobileMenu(){ const s=byId('sidebar'); s.classList.toggle('open'); document.body.classList.toggle('mobile-menu-open',s.classList.contains('open')); }
function closeMobileMenu(){ const s=byId('sidebar'); if(!s) return; s.classList.remove('open'); document.body.classList.remove('mobile-menu-open'); }
window.addEventListener('hashchange',()=>showTab(currentTabId(),true));
window.addEventListener('resize',()=>{ if(window.innerWidth>900) closeMobileMenu(); });

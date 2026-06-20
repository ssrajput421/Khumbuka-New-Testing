const DEFAULT_APP_ROLES = [
  {name:'Admin', description:'Full access to all modules and settings'},
  {name:'Operations Manager', description:'Access to sales, expenses and reports'},
  {name:'Purchase Staff', description:'Access to ingredients and expenses'},
  {name:'Branch Manager', description:'Access to assigned branch data'}
];
async function ensureDefaultAppRoles(){
  if(state.appRoles && state.appRoles.length) return true;
  if(!supabaseClient){ return false; }
  try{
    // Keep this insert intentionally simple so it works with older app_roles tables too.
    const {error}=await supabaseClient.from('app_roles').upsert(DEFAULT_APP_ROLES,{onConflict:'name'});
    if(error) throw error;
    state.appRoles=await dbSelect('app_roles','name');
    return !!(state.appRoles && state.appRoles.length);
  }catch(e){
    console.warn('Could not seed app roles', e.message);
    return false;
  }
}
function saveSettings(){
  settings.defaultCommission=num(val('defaultCommission'))||35;
  settings.defaultGST=num(val('defaultGST'))||5;
  localStorage.setItem('khumbuka_settings',JSON.stringify(settings));
  showToast('Global settings saved.');
}
function getKhumbukaBrandId(){
  return state.brands.find(b=>(b.name||'').toLowerCase()==='khumbuka')?.id || state.brands[0]?.id || null;
}
function clearBrandForm(){ state.editing.brand=null; ['brandName','brandCode','brandDescription'].forEach(id=>setVal(id,'')); setVal('brandActive','true'); byId('brandFormTitle') && (byId('brandFormTitle').textContent='Create / Update Brand'); }
async function saveBrand(){
  const name=val('brandName').trim(); if(!name) return showWarning('Brand name required');
  const row={name,code:val('brandCode'),description:val('brandDescription'),active:val('brandActive')==='true',updated_at:new Date().toISOString()};
  let saved=null;
  if(state.editing.brand) saved=await dbUpdate('brands',state.editing.brand,row); else saved=await dbInsert('brands',row);
  if(!saved) return;
  showToast(state.editing.brand?'Company profile updated successfully.':'Company profile created successfully.');
  clearBrandForm(); await refreshAll(false); renderSettings(); renderProducts();
}
function editBrand(id){ const b=state.brands.find(x=>x.id===id); if(!b) return; state.editing.brand=id; setVal('brandName',b.name); setVal('brandCode',b.code||''); setVal('brandDescription',b.description||''); setVal('brandActive',String(b.active!==false)); showTab('imports'); }
async function deleteBrand(id){ const b=state.brands.find(x=>x.id===id); const ok=await confirmTypedDelete(`Delete company profile ${b?.name||''}? Existing products/branches may lose this link.`, 'Delete company profile'); if(!ok) return; const done=await dbDelete('brands',id); if(done){ showToast('Company profile deleted.'); await refreshAll(false); renderSettings(); renderProducts(); renderDashboard(); }}

function clearBranchForm(){ state.editing.branch=null; ['branchName','branchLocation','branchAddress'].forEach(id=>setVal(id,'')); setVal('branchBrand',getKhumbukaBrandId()||''); setVal('branchActive','true'); byId('branchFormTitle') && (byId('branchFormTitle').textContent='Create / Update Branch'); }
async function saveBranch(){
  const name=val('branchName').trim(); if(!name) return showWarning('Branch name required');
  const row={brand_id:val('branchBrand')||getKhumbukaBrandId(),name,location:val('branchLocation'),address:val('branchAddress'),active:val('branchActive')==='true',updated_at:new Date().toISOString()};
  let saved=null;
  if(state.editing.branch) saved=await dbUpdate('branches',state.editing.branch,row); else saved=await dbInsert('branches',row);
  if(!saved) return;
  showToast(state.editing.branch?'Branch updated successfully.':'Branch created successfully.');
  clearBranchForm(); await refreshAll(false); renderSettings(); renderProducts();
}
function editBranch(id){ const b=state.branches.find(x=>x.id===id); if(!b) return; state.editing.branch=id; byId('branchFormTitle').textContent='Edit Branch'; setVal('branchBrand',b.brand_id||getKhumbukaBrandId()||''); setVal('branchName',b.name); setVal('branchLocation',b.location||''); setVal('branchAddress',b.address||''); setVal('branchActive',String(b.active!==false)); showTab('imports'); byId('branchFormTitle')?.scrollIntoView({behavior:'smooth',block:'start'}); }
async function deleteBranch(id){ const b=state.branches.find(x=>x.id===id); const ok=await confirmTypedDelete(`Delete branch ${b?.name||''}? Existing products/sales may lose the branch link.`, 'Delete branch'); if(!ok) return; const done=await dbDelete('branches',id); if(done){ showToast('Branch deleted.'); await refreshAll(false); renderSettings(); renderProducts(); renderDashboard(); }}

function clearUserForm(){ state.editing.user=null; ['userName','userEmail','userNotes'].forEach(id=>setVal(id,'')); setVal('userRole',''); setVal('userBrand',getKhumbukaBrandId()||''); setVal('userBranch',''); setVal('userActive','true'); }
async function saveAppUser(){
  const email=val('userEmail').trim(); if(!email) return showWarning('User email required');
  const row={name:val('userName').trim(),email,role_id:val('userRole')||null,brand_id:val('userBrand')||getKhumbukaBrandId(),branch_id:val('userBranch')||null,active:val('userActive')==='true',notes:val('userNotes'),updated_at:new Date().toISOString()};
  let saved=null;
  if(state.editing.user) saved=await dbUpdate('app_users',state.editing.user,row); else saved=await dbInsert('app_users',row);
  if(!saved) return;
  showToast(state.editing.user?'User updated successfully.':'User added successfully.');
  clearUserForm(); await refreshAll(false); renderUsers();
}
function editAppUser(id){ const u=state.appUsers.find(x=>x.id===id); if(!u) return; state.editing.user=id; setVal('userName',u.name||''); setVal('userEmail',u.email||''); setVal('userRole',u.role_id||''); setVal('userBrand',u.brand_id||getKhumbukaBrandId()||''); setVal('userBranch',u.branch_id||''); setVal('userActive',String(u.active!==false)); setVal('userNotes',u.notes||''); showTab('users'); byId('userCreatePanel')?.setAttribute('open',''); byId('userCreatePanel')?.scrollIntoView({behavior:'smooth',block:'start'}); }
async function deleteAppUser(id){ const u=state.appUsers.find(x=>x.id===id); const ok=await confirmTypedDelete(`Delete user ${u?.email||''}? This only removes the app permission record.`, 'Delete user'); if(!ok) return; const done=await dbDelete('app_users',id); if(done){ showToast('User deleted.'); await refreshAll(false); renderUsers(); }}

function clearUnitForm(){ state.editing.unit=null; ['unitName','unitSymbol','unitSort'].forEach(id=>setVal(id,'')); setVal('unitType','weight'); setVal('unitActive','true'); byId('unitFormTitle') && (byId('unitFormTitle').textContent='Unit Master'); }
async function saveUnit(){
  const symbol=val('unitSymbol').trim(); const name=val('unitName').trim() || symbol;
  if(!symbol) return showWarning('Unit symbol is required. Example: kg, g, ml, piece.');
  const existing=state.units.find(u=>(u.symbol||'').toLowerCase()===symbol.toLowerCase() && u.id!==state.editing.unit);
  if(existing) return showWarning('This unit symbol already exists. Edit the existing unit instead.');
  const row={name,symbol,type:val('unitType')||'other',sort_order:num(val('unitSort'))||100,active:val('unitActive')==='true',updated_at:new Date().toISOString()};
  const saved=state.editing.unit ? await dbUpdate('units',state.editing.unit,row) : await dbInsert('units',row);
  if(!saved) return;
  showToast(state.editing.unit?'Unit updated successfully.':'Unit added successfully.');
  clearUnitForm(); await refreshAll(false); renderSettings(); renderUnitSelectors();
}
function editUnit(id){ const u=state.units.find(x=>x.id===id); if(!u) return; state.editing.unit=id; byId('unitFormTitle').textContent='Edit Unit'; setVal('unitName',u.name||''); setVal('unitSymbol',u.symbol||''); setVal('unitType',u.type||'other'); setVal('unitSort',u.sort_order||100); setVal('unitActive',String(u.active!==false)); showTab('imports'); byId('unitFormTitle')?.scrollIntoView({behavior:'smooth',block:'start'}); }
async function deleteUnit(id){ const u=state.units.find(x=>x.id===id); const used=state.ingredients.some(i=>[i.purchase_unit,i.consumption_unit].includes(u?.symbol)) || state.recipes.some(r=>r.yield_unit===u?.symbol) || state.recipeItems.some(r=>r.unit===u?.symbol) || state.productRecipes.some(r=>r.unit===u?.symbol); if(used) showWarning('This unit is already used in data. Deleting it will not change old records, but dropdowns will stop showing it.'); const ok=await confirmTypedDelete(`Delete unit ${u?.symbol||''}? Existing records will keep their text value.`, 'Delete unit'); if(!ok) return; const done=await dbDelete('units',id); if(done){ showToast('Unit deleted.'); await refreshAll(false); renderSettings(); renderUnitSelectors(); }}
function renderUnitSelectors(){
  ['purchaseUnit','consumptionUnit','recipeYieldUnit','recipeItemUnit','builderUnit','bulkPurchaseUnit','bulkConsumptionUnit'].forEach(id=>setUnitSelect(id, val(id), id.startsWith('bulk')?'No unit change':'Select Unit'));
}

function renderSettings(){
  setVal('defaultCommission',settings.defaultCommission);
  setVal('defaultGST',settings.defaultGST);
  setSelectOptions('branchBrand', state.brands, val('branchBrand')||getKhumbukaBrandId(), 'Khumbuka');
  const brandsTarget=byId('brandsTable');
  if(brandsTarget) brandsTarget.innerHTML=table(['Company','Code','Status','Actions'],state.brands.map(b=>`<tr><td>${escapeHtml(b.name)}</td><td>${escapeHtml(b.code||'')}</td><td>${b.active===false?'Inactive':'Active'}</td><td><button onclick="editBrand('${b.id}')">Edit</button><button class="btn-danger" onclick="deleteBrand('${b.id}')">Delete</button></td></tr>`));
  const branchTarget=byId('branchesTable');
  if(branchTarget) branchTarget.innerHTML=table(['Branch','Location','Status','Actions'],state.branches.map(b=>`<tr><td>${escapeHtml(b.name)}</td><td>${escapeHtml(b.location||'')}</td><td>${b.active===false?'Inactive':'Active'}</td><td><button onclick="editBranch('${b.id}')">Edit</button><button class="btn-danger" onclick="deleteBranch('${b.id}')">Delete</button></td></tr>`));
  const unitTarget=byId('unitsTable');
  if(unitTarget) unitTarget.innerHTML=table(['Unit','Symbol','Type','Sort','Status','Actions'],state.units.map(u=>`<tr><td>${escapeHtml(u.name||'')}</td><td><strong>${escapeHtml(u.symbol||'')}</strong></td><td>${escapeHtml(u.type||'')}</td><td>${num(u.sort_order)||''}</td><td>${u.active===false?'Inactive':'Active'}</td><td><button onclick="editUnit('${u.id}')">Edit</button><button class="btn-danger" onclick="deleteUnit('${u.id}')">Delete</button></td></tr>`));
  renderUnitSelectors();
}
function renderUsers(){
  const currentRole=val('userRole');
  if((!state.appRoles || !state.appRoles.length) && !state._roleSeedAttempted){
    state._roleSeedAttempted=true;
    setSelectOptions('userRole', [], '', 'Loading roles...');
    ensureDefaultAppRoles().then(()=>{ renderUsers(); });
  }
  setSelectOptions('userRole', state.appRoles || [], currentRole, state.appRoles?.length ? 'Select Role' : 'No roles found - run role fix SQL');
  setSelectOptions('userBrand', state.brands, val('userBrand')||getKhumbukaBrandId(), 'Khumbuka');
  setSelectOptions('userBranch', state.branches, val('userBranch'), 'All Branches / None');
  const q=(val('userSearch')||'').toLowerCase();
  const list=state.appUsers.filter(u=>[u.name,u.email,roleName(u.role_id),branchName(u.branch_id)].join(' ').toLowerCase().includes(q));
  const target=byId('usersTable'); if(!target) return;
  const roleNotice = (!state.appRoles || !state.appRoles.length) ? '<div class="schema-note warning-note">No roles are loaded yet. Run <code>supabase/sql/app_roles_fix_patch.sql</code> once in Supabase, then refresh.</div>' : '';
  target.innerHTML=roleNotice + table(['Name','Email','Role','Branch Scope','Status','Notes','Actions'],list.map(u=>`<tr><td>${escapeHtml(u.name||'')}</td><td>${escapeHtml(u.email||'')}</td><td>${escapeHtml(roleName(u.role_id))}</td><td>${escapeHtml(branchName(u.branch_id)||'All / None')}</td><td>${u.active===false?'Inactive':'Active'}</td><td>${expandableNote(u.notes||'',44)}</td><td><button onclick="editAppUser('${u.id}')">Edit</button><button class="btn-danger" onclick="deleteAppUser('${u.id}')">Delete</button></td></tr>`));
}

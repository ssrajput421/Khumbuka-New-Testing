function saveSettings(){
  settings.defaultCommission=num(val('defaultCommission'))||35;
  settings.defaultGST=num(val('defaultGST'))||5;
  localStorage.setItem('khumbuka_settings',JSON.stringify(settings));
  showToast('Global settings saved.');
}
function clearBrandForm(){ state.editing.brand=null; ['brandName','brandCode','brandDescription'].forEach(id=>setVal(id,'')); setVal('brandActive','true'); byId('brandFormTitle') && (byId('brandFormTitle').textContent='Create / Update Brand'); }
async function saveBrand(){
  const name=val('brandName').trim(); if(!name) return showWarning('Brand name required');
  const row={name,code:val('brandCode'),description:val('brandDescription'),active:val('brandActive')==='true',updated_at:new Date().toISOString()};
  let saved=null;
  if(state.editing.brand) saved=await dbUpdate('brands',state.editing.brand,row); else saved=await dbInsert('brands',row);
  if(!saved) return;
  showToast(state.editing.brand?'Brand updated successfully.':'Brand created successfully.');
  clearBrandForm(); await refreshAll(false); renderSettings(); renderProducts();
}
function editBrand(id){ const b=state.brands.find(x=>x.id===id); if(!b) return; state.editing.brand=id; byId('brandFormTitle').textContent='Edit Brand'; setVal('brandName',b.name); setVal('brandCode',b.code||''); setVal('brandDescription',b.description||''); setVal('brandActive',String(b.active!==false)); showTab('imports'); }
async function deleteBrand(id){ const b=state.brands.find(x=>x.id===id); const ok=await confirmTypedDelete(`Delete brand ${b?.name||''}? Existing products/branches may lose the brand link.`, 'Delete brand'); if(!ok) return; const done=await dbDelete('brands',id); if(done){ showToast('Brand deleted.'); await refreshAll(false); renderSettings(); renderProducts(); renderDashboard(); }}

function clearBranchForm(){ state.editing.branch=null; ['branchName','branchLocation','branchAddress'].forEach(id=>setVal(id,'')); setVal('branchBrand',''); setVal('branchActive','true'); byId('branchFormTitle') && (byId('branchFormTitle').textContent='Create / Update Branch'); }
async function saveBranch(){
  const name=val('branchName').trim(); if(!name) return showWarning('Branch name required');
  const row={brand_id:val('branchBrand')||null,name,location:val('branchLocation'),address:val('branchAddress'),active:val('branchActive')==='true',updated_at:new Date().toISOString()};
  let saved=null;
  if(state.editing.branch) saved=await dbUpdate('branches',state.editing.branch,row); else saved=await dbInsert('branches',row);
  if(!saved) return;
  showToast(state.editing.branch?'Branch updated successfully.':'Branch created successfully.');
  clearBranchForm(); await refreshAll(false); renderSettings(); renderProducts();
}
function editBranch(id){ const b=state.branches.find(x=>x.id===id); if(!b) return; state.editing.branch=id; byId('branchFormTitle').textContent='Edit Branch'; setVal('branchBrand',b.brand_id||''); setVal('branchName',b.name); setVal('branchLocation',b.location||''); setVal('branchAddress',b.address||''); setVal('branchActive',String(b.active!==false)); showTab('imports'); }
async function deleteBranch(id){ const b=state.branches.find(x=>x.id===id); const ok=await confirmTypedDelete(`Delete branch ${b?.name||''}? Existing products/sales may lose the branch link.`, 'Delete branch'); if(!ok) return; const done=await dbDelete('branches',id); if(done){ showToast('Branch deleted.'); await refreshAll(false); renderSettings(); renderProducts(); renderDashboard(); }}

function clearUserForm(){ state.editing.user=null; ['userName','userEmail','userNotes'].forEach(id=>setVal(id,'')); setVal('userRole',''); setVal('userBrand',''); setVal('userBranch',''); setVal('userActive','true'); byId('userFormTitle') && (byId('userFormTitle').textContent='Create / Update User'); }
async function saveAppUser(){
  const email=val('userEmail').trim(); if(!email) return showWarning('User email required');
  const row={name:val('userName').trim(),email,role_id:val('userRole')||null,brand_id:val('userBrand')||null,branch_id:val('userBranch')||null,active:val('userActive')==='true',notes:val('userNotes'),updated_at:new Date().toISOString()};
  let saved=null;
  if(state.editing.user) saved=await dbUpdate('app_users',state.editing.user,row); else saved=await dbInsert('app_users',row);
  if(!saved) return;
  showToast(state.editing.user?'User updated successfully.':'User added successfully.');
  clearUserForm(); await refreshAll(false); renderUsers();
}
function editAppUser(id){ const u=state.appUsers.find(x=>x.id===id); if(!u) return; state.editing.user=id; byId('userFormTitle').textContent='Edit User'; setVal('userName',u.name||''); setVal('userEmail',u.email||''); setVal('userRole',u.role_id||''); setVal('userBrand',u.brand_id||''); setVal('userBranch',u.branch_id||''); setVal('userActive',String(u.active!==false)); setVal('userNotes',u.notes||''); showTab('users'); }
async function deleteAppUser(id){ const u=state.appUsers.find(x=>x.id===id); const ok=await confirmTypedDelete(`Delete user ${u?.email||''}? This only removes the app permission record.`, 'Delete user'); if(!ok) return; const done=await dbDelete('app_users',id); if(done){ showToast('User deleted.'); await refreshAll(false); renderUsers(); }}

function renderSettings(){
  setVal('defaultCommission',settings.defaultCommission);
  setVal('defaultGST',settings.defaultGST);
  setSelectOptions('branchBrand', state.brands, val('branchBrand'), 'Select Brand');
  byId('brandsTable').innerHTML=table(['Brand','Code','Status','Actions'],state.brands.map(b=>`<tr><td>${escapeHtml(b.name)}</td><td>${escapeHtml(b.code||'')}</td><td>${b.active===false?'Inactive':'Active'}</td><td><button onclick="editBrand('${b.id}')">Edit</button><button class="btn-danger" onclick="deleteBrand('${b.id}')">Delete</button></td></tr>`));
  byId('branchesTable').innerHTML=table(['Branch','Brand','Location','Status','Actions'],state.branches.map(b=>`<tr><td>${escapeHtml(b.name)}</td><td>${escapeHtml(brandName(b.brand_id))}</td><td>${escapeHtml(b.location||'')}</td><td>${b.active===false?'Inactive':'Active'}</td><td><button onclick="editBranch('${b.id}')">Edit</button><button class="btn-danger" onclick="deleteBranch('${b.id}')">Delete</button></td></tr>`));
}
function renderUsers(){
  setSelectOptions('userRole', state.appRoles, val('userRole'), 'Select Role');
  setSelectOptions('userBrand', state.brands, val('userBrand'), 'All Brands / None');
  setSelectOptions('userBranch', state.branches, val('userBranch'), 'All Branches / None');
  const q=(val('userSearch')||'').toLowerCase();
  const list=state.appUsers.filter(u=>[u.name,u.email,roleName(u.role_id),brandName(u.brand_id),branchName(u.branch_id)].join(' ').toLowerCase().includes(q));
  byId('usersTable').innerHTML=table(['Name','Email','Role','Brand Scope','Branch Scope','Status','Notes','Actions'],list.map(u=>`<tr><td>${escapeHtml(u.name||'')}</td><td>${escapeHtml(u.email||'')}</td><td>${escapeHtml(roleName(u.role_id))}</td><td>${escapeHtml(brandName(u.brand_id)||'All / None')}</td><td>${escapeHtml(branchName(u.branch_id)||'All / None')}</td><td>${u.active===false?'Inactive':'Active'}</td><td>${escapeHtml(u.notes||'')}</td><td><button onclick="editAppUser('${u.id}')">Edit</button><button class="btn-danger" onclick="deleteAppUser('${u.id}')">Delete</button></td></tr>`));
}

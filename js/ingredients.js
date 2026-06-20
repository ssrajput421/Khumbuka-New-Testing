function uniqueCleanValues(values){ return [...new Set(values.map(v=>String(v||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b)); }
function setDatalistOptions(id, values){ const el=byId(id); if(!el) return; el.innerHTML=uniqueCleanValues(values).map(v=>`<option value="${escapeHtml(v)}"></option>`).join(''); }
function renderIngredientDatalists(){
 setSmartSuggestions('ingredientName', state.ingredients.map(i=>i.name));
 setSmartSuggestions('ingredientCategory', state.ingredients.map(i=>i.category));
 setSmartSuggestions('ingredientSearch', state.ingredients.flatMap(i=>[i.name,i.category,i.purchase_unit,i.consumption_unit]));
 setSmartSuggestions('bulkIngredientCategory', state.ingredients.map(i=>i.category));
 renderUnitSelectors();
}
async function saveIngredient(){
 const name=val('ingredientName').trim(); if(!name) return showWarning('Ingredient name required');
 const purchase_price=num(val('purchasePrice')), wastage_percent=num(val('wastagePercent'));
 const row={ name, category:val('ingredientCategory'), purchase_price, purchase_unit:val('purchaseUnit'), consumption_unit:val('consumptionUnit') || val('purchaseUnit'), conversion_quantity:num(val('conversionQuantity')) || 1, wastage_percent, effective_cost:effectiveCost(purchase_price,wastage_percent), active:val('ingredientActive')==='true', updated_at:new Date().toISOString() };
 let saved=null;
 if(state.editing.ingredient) saved=await dbUpdate('ingredients',state.editing.ingredient,row); else saved=await dbInsert('ingredients',row);
 if(!saved) return;
 showToast(state.editing.ingredient?'Ingredient updated successfully.':'Ingredient created successfully.');
 clearIngredientForm(); await refreshAll(false); renderIngredients(); renderRecipeSelectors();
}
function clearIngredientForm(){ state.editing.ingredient=null; ['ingredientName','ingredientCategory','purchasePrice','conversionQuantity','wastagePercent'].forEach(id=>setVal(id,'')); setVal('purchaseUnit',''); setVal('consumptionUnit',''); setVal('ingredientActive','true'); renderUnitSelectors(); }
function editIngredient(id){ const i=state.ingredients.find(x=>x.id===id); if(!i) return; state.editing.ingredient=id; setVal('ingredientName',i.name); setVal('ingredientCategory',i.category); setVal('purchasePrice',i.purchase_price); setVal('purchaseUnit',i.purchase_unit); setVal('consumptionUnit',i.consumption_unit || i.purchase_unit); setVal('conversionQuantity',i.conversion_quantity || 1); setVal('wastagePercent',i.wastage_percent); setVal('ingredientActive',String(i.active!==false)); byId('ingredientCreatePanel')?.setAttribute('open',''); byId('ingredientCreatePanel')?.scrollIntoView({behavior:'smooth',block:'start'}); }
async function deleteIngredient(id){ const i=state.ingredients.find(x=>x.id===id); const ok=await confirmTypedDelete(`Delete ingredient ${i?.name||''}? Existing recipe links may fail.`, 'Delete ingredient'); if(!ok) return; const done=await dbDelete('ingredients',id); if(done){ showToast('Ingredient deleted.'); await refreshAll(false); renderIngredients(); renderRecipeSelectors(); }}
function renderIngredients(){
 renderIngredientDatalists();
 const cats=[...new Set(state.ingredients.map(i=>i.category||'Uncategorized'))].sort(); const current=val('ingredientFilter')||'All'; byId('ingredientFilter').innerHTML='<option value="All">All Categories</option>'+cats.map(c=>`<option ${c===current?'selected':''}>${escapeHtml(c)}</option>`).join('');
 const q=val('ingredientSearch').toLowerCase(); const filter=val('ingredientFilter')||'All';
 const list=state.ingredients.filter(i=>{ const searchText=[i.name,i.category,i.purchase_unit,i.consumption_unit].join(' ').toLowerCase(); return searchText.includes(q)&&(filter==='All'||(i.category||'Uncategorized')===filter); });
 const avg=list.length?list.reduce((a,b)=>a+num(b.effective_cost),0)/list.length:0; byId('ingredientStats').innerHTML=kpi('Ingredients',state.ingredients.length)+kpi('Active',state.ingredients.filter(i=>i.active!==false).length,'good')+kpi('Inactive',state.ingredients.filter(i=>i.active===false).length)+kpi('Avg Effective Cost',money(avg));
 const rows=list.map(i=>`<tr><td><input type="checkbox" class="ingredient-row-check" value="${i.id}" onchange="updateIngredientBulkCount()"></td><td>${escapeHtml(i.name)}</td><td>${escapeHtml(i.category||'')}</td><td>${money(i.purchase_price)}</td><td>${escapeHtml(i.purchase_unit||'')}</td><td>${escapeHtml(i.consumption_unit||i.purchase_unit||'')}</td><td>${num(i.conversion_quantity)||1}</td><td>${pct(i.wastage_percent)}</td><td><strong>${money(i.effective_cost ?? effectiveCost(i.purchase_price,i.wastage_percent))}</strong></td><td>${i.active===false?'Inactive':'Active'}</td><td><button onclick="editIngredient('${i.id}')">Edit</button><button class="btn-danger" onclick="deleteIngredient('${i.id}')">Delete</button></td></tr>`);
 byId('ingredientTable').innerHTML=table(['<input type="checkbox" onchange="toggleAllIngredients(this.checked)">','Name','Category','Price','Purchase Unit','Consumption Unit','Conversion Qty','Waste %','Effective Cost','Status','Actions'],rows);
 updateIngredientBulkCount();
}
function selectedIngredientIds(){ return getCheckedValues('.ingredient-row-check'); }
function toggleAllIngredients(checked){ setChecked('.ingredient-row-check', checked); updateIngredientBulkCount(); }
function updateIngredientBulkCount(){ const count=selectedIngredientIds().length; const el=byId('selectedIngredientCount'); if(el) el.textContent=`${count} selected`; const panel=byId('bulkIngredientActions'); if(panel) panel.classList.toggle('hidden', count < 2); }
async function bulkUpdateIngredients(){
 const ids=selectedIngredientIds(); if(ids.length < 2) return showWarning('Select at least two ingredients for bulk action.');
 const category=val('bulkIngredientCategory').trim(); const purchase_unit=val('bulkPurchaseUnit').trim(); const consumption_unit=val('bulkConsumptionUnit').trim(); const conversion_quantity=num(val('bulkConversionQuantity'));
 const row={updated_at:new Date().toISOString()};
 if(category) row.category=category; if(purchase_unit) row.purchase_unit=purchase_unit; if(consumption_unit) row.consumption_unit=consumption_unit; if(conversion_quantity) row.conversion_quantity=conversion_quantity;
 if(Object.keys(row).length===1) return showWarning('Choose a field to update.');
 for(const id of ids){ await dbUpdate('ingredients', id, row); }
 showToast(`${ids.length} ingredient(s) updated.`); ['bulkIngredientCategory','bulkPurchaseUnit','bulkConsumptionUnit','bulkConversionQuantity'].forEach(id=>setVal(id,'')); await refreshAll(false); renderIngredients(); renderRecipeSelectors();
}
async function bulkDeleteIngredients(){
 const ids=selectedIngredientIds(); if(ids.length < 2) return showWarning('Select at least two ingredients for bulk delete.');
 const ok=await confirmTypedDelete(`Delete ${ids.length} selected ingredient(s)? Existing recipe links may fail.`, 'Bulk delete ingredients'); if(!ok) return;
 const done=await dbDeleteMany('ingredients', ids); if(done){ showToast(`${ids.length} ingredient(s) deleted.`); await refreshAll(false); renderIngredients(); renderRecipeSelectors(); }
}
function exportIngredientsCSV(){
 const rows=state.ingredients.length ? state.ingredients.map(i=>({ 'Ingredient Name':i.name, 'Category':i.category, 'Purchase Price':i.purchase_price, 'Purchase Unit':i.purchase_unit, 'Consumption Unit':i.consumption_unit || i.purchase_unit, 'Conversion Quantity':i.conversion_quantity || 1, 'Wastage %':i.wastage_percent, 'Effective Cost':i.effective_cost, 'Active':i.active!==false })) : [{ 'Ingredient Name':'Chicken', 'Category':'Protein', 'Purchase Price':220, 'Purchase Unit':'kg', 'Consumption Unit':'g', 'Conversion Quantity':1000, 'Wastage %':5, 'Effective Cost':231.58, 'Active':true }];
 downloadCSV(state.ingredients.length?'khumbuka_ingredients.csv':'khumbuka_ingredients_sample_schema.csv', rows);
}

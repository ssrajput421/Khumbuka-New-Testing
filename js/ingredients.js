async function saveIngredient(){
 const name=val('ingredientName').trim(); if(!name) return alert('Ingredient name required');
 const purchase_price=num(val('purchasePrice')), wastage_percent=num(val('wastagePercent'));
 const row={name,category:val('ingredientCategory'),purchase_price,purchase_unit:val('purchaseUnit'),wastage_percent,effective_cost:effectiveCost(purchase_price,wastage_percent),active:val('ingredientActive')==='true',updated_at:new Date().toISOString()};
 if(state.editing.ingredient) await dbUpdate('ingredients',state.editing.ingredient,row); else await dbInsert('ingredients',row);
 clearIngredientForm(); await refreshAll(false); renderIngredients(); renderRecipeSelectors();
}
function clearIngredientForm(){ state.editing.ingredient=null; ['ingredientName','ingredientCategory','purchasePrice','purchaseUnit','wastagePercent'].forEach(id=>setVal(id,'')); setVal('ingredientActive','true'); }
function editIngredient(id){ const i=state.ingredients.find(x=>x.id===id); if(!i) return; state.editing.ingredient=id; setVal('ingredientName',i.name); setVal('ingredientCategory',i.category); setVal('purchasePrice',i.purchase_price); setVal('purchaseUnit',i.purchase_unit); setVal('wastagePercent',i.wastage_percent); setVal('ingredientActive',String(i.active!==false)); scrollTo(0,0); }
async function deleteIngredient(id){ if(confirm('Delete ingredient? Existing recipe links may fail.')){ await dbDelete('ingredients',id); await refreshAll(false); renderIngredients(); }}
function renderIngredients(){
 const cats=[...new Set(state.ingredients.map(i=>i.category||'Uncategorized'))].sort(); const current=val('ingredientFilter')||'All'; byId('ingredientFilter').innerHTML='<option value="All">All Categories</option>'+cats.map(c=>`<option ${c===current?'selected':''}>${escapeHtml(c)}</option>`).join('');
 const q=val('ingredientSearch').toLowerCase(); const filter=val('ingredientFilter')||'All'; const list=state.ingredients.filter(i=>(i.name||'').toLowerCase().includes(q)&&(filter==='All'||(i.category||'Uncategorized')===filter));
 const avg=list.length?list.reduce((a,b)=>a+num(b.effective_cost),0)/list.length:0; byId('ingredientStats').innerHTML=kpi('Ingredients',state.ingredients.length)+kpi('Active',state.ingredients.filter(i=>i.active!==false).length,'good')+kpi('Inactive',state.ingredients.filter(i=>i.active===false).length)+kpi('Avg Effective Cost',money(avg));
 byId('ingredientTable').innerHTML=table(['Name','Category','Price','Unit','Waste %','Effective Cost','Status','Actions'],list.map(i=>`<tr><td>${escapeHtml(i.name)}</td><td>${escapeHtml(i.category||'')}</td><td>${money(i.purchase_price)}</td><td>${escapeHtml(i.purchase_unit||'')}</td><td>${pct(i.wastage_percent)}</td><td><strong>${money(i.effective_cost ?? effectiveCost(i.purchase_price,i.wastage_percent))}</strong></td><td>${i.active===false?'Inactive':'Active'}</td><td><button onclick="editIngredient('${i.id}')">Edit</button><button class="btn-danger" onclick="deleteIngredient('${i.id}')">Delete</button></td></tr>`));
}
function exportIngredientsCSV(){ downloadCSV('khumbuka_ingredients.csv', state.ingredients); }

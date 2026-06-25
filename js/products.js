function renderProductDatalists(){
 setSmartSuggestions('productName', state.products.map(p=>p.name));
 setSmartSuggestions('productCategory', state.products.map(p=>p.category));
 setSmartSuggestions('productSearch', state.products.flatMap(p=>[p.name,p.category,branchName(p.branch_id)]));
 setSmartSuggestions('bulkProductCategory', state.products.map(p=>p.category));
}
function defaultBrandId(){
 return state.brands.find(b=>(b.name||'').toLowerCase()==='khumbuka')?.id || state.brands[0]?.id || null;
}
function productRecipeBuilderRecipeList(){
 const recipes=(state.recipes||[]).filter(r=>r && r.id);
 // Show all recipes, not only active ones. Inactive recipes are marked in the label instead of being hidden.
 return recipes.slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
}
function productRecipeBuilderRecipeOptions(selected=''){
 const recipes=productRecipeBuilderRecipeList();
 const first=`<option value="">${recipes.length?'Select Recipe':'No recipes found'}</option>`;
 return first + recipes.map(r=>{
   const parts=[r.name||'Unnamed Recipe'];
   const meta=[r.category, r.yield_unit?`Yield: ${r.yield_unit}`:'', r.active===false?'Inactive':''].filter(Boolean).join(' · ');
   const label=meta ? `${parts[0]} (${meta})` : parts[0];
   return `<option value="${escapeHtml(r.id)}" ${String(r.id)===String(selected)?'selected':''}>${escapeHtml(label)}</option>`;
 }).join('');
}
function populateBuilderRecipeSelect(){
 const el=byId('builderRecipe');
 if(!el) return;
 const current=el.value;
 const recipes=productRecipeBuilderRecipeList();
 el.innerHTML=productRecipeBuilderRecipeOptions(current);
 if(current && recipes.some(r=>String(r.id)===String(current))) el.value=current;
 else if(current) el.value='';
 if(el.dataset.builderRecipeBound!=='true'){
   el.dataset.builderRecipeBound='true';
   el.addEventListener('change',()=>syncBuilderRecipeUnit(true));
 }
 syncBuilderRecipeUnit(false);
}
function syncBuilderRecipeUnit(force=false){
 const recipe=state.recipes.find(r=>String(r.id)===String(val('builderRecipe')));
 if(!recipe) return;
 if(force || !val('builderUnit')) setVal('builderUnit', recipe.yield_unit || val('builderUnit') || 'g');
 if(typeof refreshKhumbukaDropdowns==='function') refreshKhumbukaDropdowns(document);
}
function productRecipeBuilderStatusHtml(){
 if((state.recipes||[]).length) return '';
 return `<div class="empty-state-card">No recipes are loaded in Product Recipe Builder yet. Go to Recipes, create/import a recipe, then refresh and come back here.</div>`;
}

function productAuditCostSourceLabel(source){
  const map={manual_override:'Manual Override',product_components:'Product Components',legacy_recipe_links_plus_packaging:'Old Recipe Links + Packaging',packaging_only:'Packaging Only',none:'No Cost'};
  return map[source] || source || 'Unknown';
}
function productAuditWarningHtml(warnings){
  const list=(warnings||[]);
  if(!list.length) return '<span class="status-pill ok">Clean</span>';
  return `<div class="recipe-warning-list"><strong>${list.length} warning${list.length>1?'s':''}</strong>${list.slice(0,6).map(w=>`<span>${escapeHtml(w)}</span>`).join('')}${list.length>6?`<span>+${list.length-6} more warning${list.length-6>1?'s':''}</span>`:''}</div>`;
}
function productMiniAuditHtml(productId){
  const product=(state.products||[]).find(p=>String(p.id)===String(productId));
  if(!product) return '<div class="empty-state-card">Select a product to see its cost audit.</div>';
  const audit=typeof calculateProductAudit==='function' ? calculateProductAudit(product) : null;
  if(!audit) return '<div class="schema-note warning-note">Cost audit engine is not loaded. Apply Phase 1 first: js/costAudit.js + index script include.</div>';
  const rows=(audit.breakdown||[]).map(row=>`<tr><td><strong>${escapeHtml(row.component_name||'Component')}</strong><br><span class="small">${escapeHtml(row.quantity_mode||row.component_type||'')}</span></td><td>${escapeHtml(row.source_name||'')}</td><td>${num(row.quantity)}</td><td>${escapeHtml(row.unit||'')}</td><td>${money(row.rate||0)}</td><td>${money(row.cost||0)}</td></tr>`);
  const componentTable=rows.length ? `<div class="table-scroll">${table(['Component','Source','Qty','Unit','Rate','Cost'],rows)}</div>` : '<div class="empty-state-card">No component breakdown yet. Add product components to calculate product cost.</div>';
  return `<div class="card mini-audit-card" style="margin:14px 0">
    <div class="list-card-header"><div><h3>Selected Product Cost Audit</h3><p class="muted">Shared audit engine summary for ${escapeHtml(product.name||'selected product')}.</p></div><span class="status-pill ${audit.is_clean?'ok':'warn'}">${audit.is_clean?'Clean':`${audit.warning_count} warning${audit.warning_count>1?'s':''}`}</span></div>
    <div class="kpi-grid compact-kpi-grid">
      <div class="kpi"><span>Total Cost</span><strong>${money(audit.total_cost)}</strong><small>${escapeHtml(productAuditCostSourceLabel(audit.cost_source))}</small></div>
      <div class="kpi"><span>Offline Profit</span><strong class="${audit.offline_profit>=0?'profit':'loss'}">${money(audit.offline_profit)}</strong><small>${pct(audit.offline_margin)} margin</small></div>
      <div class="kpi"><span>Online Profit</span><strong class="${audit.online_profit>=0?'profit':'loss'}">${money(audit.online_profit)}</strong><small>${pct(audit.online_margin)} after ${pct(audit.commission_percent)} commission</small></div>
      <div class="kpi"><span>Components</span><strong>${(audit.breakdown||[]).length}</strong><small>Component cost: ${money(audit.component_cost)}</small></div>
    </div>
    ${productAuditWarningHtml(audit.warnings)}
    <details style="margin-top:12px" open><summary><strong>Component cost breakdown</strong></summary>${componentTable}</details>
  </div>`;
}

function productComponentRows(productId){ return (state.productComponents||[]).filter(x=>String(x.product_id)===String(productId)).sort((a,b)=>(num(a.sort_order)-num(b.sort_order)) || String(a.created_at||'').localeCompare(String(b.created_at||''))); }
function recipeListByCategory(words=[]){
  const needles=(words||[]).map(w=>String(w).toLowerCase());
  return (state.recipes||[]).filter(r=>!needles.length || needles.some(w=>[r.name,r.category].join(' ').toLowerCase().includes(w))).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
}
function setRecipeSelect(id, selected='', emptyLabel='Select Recipe', words=[]){
  const list=recipeListByCategory(words);
  const el=byId(id); if(!el) return;
  const cur=selected || el.value;
  el.innerHTML=`<option value="">${escapeHtml(emptyLabel)}</option>`+list.map(r=>`<option value="${escapeHtml(r.id)}" ${String(r.id)===String(cur)?'selected':''}>${escapeHtml(r.name||'Unnamed')} ${r.category?`(${escapeHtml(r.category)})`:''}</option>`).join('');
  if(cur) el.value=cur;
}
function productComponentCost(c){
  if(!c) return 0;
  if(c.component_type==='fixed_cost') return num(c.fixed_cost);
  if(c.recipe_id){ const r=(state.recipes||[]).find(x=>String(x.id)===String(c.recipe_id)); return r ? (typeof recipeCostForQuantity==='function' ? recipeCostForQuantity(r,c.quantity,c.unit) : recipeUnitCost(r)*toBaseUnit(c.quantity,c.unit)) : 0; }
  if(c.ingredient_id){ const ing=(state.ingredients||[]).find(x=>String(x.id)===String(c.ingredient_id)); if(!ing) return 0; const qty=num(c.quantity); const unit=c.unit||ing.consumption_unit; const qtyInConsumption=typeof convertRecipeQuantity==='function' ? convertRecipeQuantity(qty, unit, ing.consumption_unit||unit) : qty; return (typeof ingredientCostPerConsumptionUnit==='function' ? ingredientCostPerConsumptionUnit(ing) : effectiveCost(ing.purchase_price,ing.wastage_percent)) * qtyInConsumption; }
  return 0;
}
function productComponentsCost(productId){ return productComponentRows(productId).reduce((sum,c)=>sum+productComponentCost(c),0); }
function momoAssumptionKey(pieces, suffix){
  const p=Number(pieces)||0;
  if(p<=6) return `momo_6_${suffix}`;
  if(p<=10) return `momo_10_${suffix}`;
  return `momo_12_${suffix}`;
}
function recipeFillingPerPiece(recipeId){ const r=(state.recipes||[]).find(x=>String(x.id)===String(recipeId)); return num(r?.filling_grams_per_momo) || 30; }
function builderRecipeCost(recipeId, qty, unit){ const r=(state.recipes||[]).find(x=>String(x.id)===String(recipeId)); return r ? (typeof recipeCostForQuantity==='function'?recipeCostForQuantity(r,qty,unit):recipeUnitCost(r)*toBaseUnit(qty,unit)) : 0; }

function builderIngredientCost(ingredientId, qty, unit){
  const ing=(state.ingredients||[]).find(x=>String(x.id)===String(ingredientId));
  if(!ing) return 0;
  const q=num(qty);
  const u=unit || ing.consumption_unit || 'g';
  const qInConsumption=typeof convertRecipeQuantity==='function' ? convertRecipeQuantity(q,u,ing.consumption_unit||u) : q;
  return (typeof ingredientCostPerConsumptionUnit==='function' ? ingredientCostPerConsumptionUnit(ing) : effectiveCost(ing.purchase_price, ing.wastage_percent)) * qInConsumption;
}
function productComponentRoleLabel(role){
  const map={filling:'Filling',wrapper:'Wrapper / Dough',red_chutney:'Red Chilli Chutney',mayo:'Mayo',nepali_chutney:'Nepali Chutney',packaging_set:'Packaging Set',cooking:'Cooking / Steam / Fry',coating:'Coating',other:'Other'};
  return map[role] || 'Component';
}
function productBuilderAutoQuantity(role, componentType, recipeId){
  const pieces=num(val('builderPieceCount')) || 0;
  const cupG=typeof assumptionValue==='function' ? assumptionValue('chutney_cup_grams',35) : 35;
  const wrapperG=typeof assumptionValue==='function' ? assumptionValue('wrapper_grams_per_momo',13) : 13;
  if(role==='filling' && recipeId && pieces>0){
    return {quantity:pieces*recipeFillingPerPiece(recipeId), unit:'g', mode:'pieces_x_recipe_filling'};
  }
  if(role==='wrapper' && pieces>0){
    return {quantity:pieces*wrapperG, unit:'g', mode:'pieces_x_wrapper_assumption'};
  }
  if(['red_chutney','mayo','nepali_chutney'].includes(role) && pieces>0){
    const suffix=role==='red_chutney'?'red_chutney_cups':role==='mayo'?'mayo_cups':'nepali_cups';
    const cups=typeof assumptionValue==='function' ? assumptionValue(momoAssumptionKey(pieces,suffix), pieces<=6?1:2) : (pieces<=6?1:2);
    return {quantity:cups*cupG, unit:'g', mode:'chutney_cups_x_cup_grams'};
  }
  if(role==='packaging_set') return {quantity:1, unit:'set', mode:'fixed_set'};
  if(role==='cooking' && componentType==='fixed_cost'){
    const cost=typeof assumptionValue==='function' ? assumptionValue('momo_steam_cost_per_order',2) : 2;
    return {quantity:1, unit:'fixed', fixed_cost:cost, mode:'fixed_cost'};
  }
  return null;
}
function syncProductComponentBuilder(force=false){
  const type=val('builderComponentType') || 'recipe';
  const role=val('builderComponentRole') || 'other';
  const recipe=(state.recipes||[]).find(r=>String(r.id)===String(val('builderRecipe')));
  const ing=(state.ingredients||[]).find(i=>String(i.id)===String(val('builderIngredient')));
  const auto=productBuilderAutoQuantity(role, type, val('builderRecipe'));
  if(force || !val('builderComponentName')){
    let name=productComponentRoleLabel(role);
    if(role==='other' && type==='recipe' && recipe?.name) name=recipe.name;
    if(role==='other' && type==='ingredient' && ing?.name) name=ing.name;
    setVal('builderComponentName', name);
  }
  if(type==='recipe' && recipe && (force || !val('builderUnit'))) setVal('builderUnit', auto?.unit || recipe.yield_unit || 'g');
  if(type==='ingredient' && ing && (force || !val('builderUnit'))) setVal('builderUnit', auto?.unit || ing.consumption_unit || ing.purchase_unit || 'g');
  if(auto){
    if((force || !val('builderQty')) && auto.quantity!=null) setVal('builderQty', Number((auto.quantity||0).toFixed(3)));
    if((force || !val('builderUnit')) && auto.unit) setVal('builderUnit', auto.unit);
    if((force || !val('builderFixedCost')) && auto.fixed_cost!=null) setVal('builderFixedCost', auto.fixed_cost);
    setVal('builderQuantityMode', auto.mode);
  }else if(!val('builderQuantityMode')) setVal('builderQuantityMode','manual_quantity');
  previewProductComponentRow();
  if(typeof refreshKhumbukaDropdowns==='function') refreshKhumbukaDropdowns(document);
}
function previewProductComponentRow(){
  const target=byId('momoBuilderPreview'); if(!target) return;
  if(!val('builderProduct')){ target.innerHTML='<div class="empty-state-card">Select a product first.</div>'; return; }
  const type=val('builderComponentType')||'recipe';
  const role=val('builderComponentRole')||'other';
  const qty=num(val('builderQty'));
  const unit=val('builderUnit')||'g';
  let cost=0; let item='';
  if(type==='recipe'){
    const r=(state.recipes||[]).find(x=>String(x.id)===String(val('builderRecipe')));
    item=r?.name||'Select recipe'; cost=r?builderRecipeCost(r.id,qty,unit):0;
  }else if(type==='ingredient'){
    const ing=(state.ingredients||[]).find(x=>String(x.id)===String(val('builderIngredient')));
    item=ing?.name||'Select ingredient'; cost=ing?builderIngredientCost(ing.id,qty,unit):0;
  }else{
    item=val('builderComponentName')||productComponentRoleLabel(role); cost=num(val('builderFixedCost'));
  }
  target.innerHTML=`<div class="table-scroll">${table(['Role','Component','Qty','Unit','Estimated Cost'],[`<tr><td>${escapeHtml(productComponentRoleLabel(role))}</td><td>${escapeHtml(item)}</td><td>${num(qty)}</td><td>${escapeHtml(unit)}</td><td>${money(cost)}</td></tr>`])}</div>`;
}
function clearProductComponentBuilder(){
  ['builderComponentName','builderQty','builderFixedCost','builderQuantityMode'].forEach(id=>setVal(id,''));
  setVal('builderRecipe',''); setVal('builderIngredient',''); setVal('builderComponentType','recipe'); setVal('builderComponentRole','filling');
  previewProductComponentRow();
}
function momoBuilderRowsFromForm(){
  const product_id=val('builderProduct');
  const pieces=num(val('builderPieceCount')) || 0;
  const cupG=typeof assumptionValue==='function' ? assumptionValue('chutney_cup_grams',35) : 35;
  const wrapperG=num(val('builderWrapperPerPiece')) || (typeof assumptionValue==='function' ? assumptionValue('wrapper_grams_per_momo',13) : 13);
  const fillingId=val('builderFillingRecipe');
  const fillingG=num(val('builderFillingPerPiece')) || recipeFillingPerPiece(fillingId);
  const rows=[]; let order=10;
  if(fillingId && pieces>0) rows.push({product_id,component_type:'recipe',recipe_id:fillingId,component_name:'Filling',quantity:pieces*fillingG,unit:'g',quantity_mode:'pieces_x_recipe_filling',apply_per:'per_order',sort_order:order++,updated_at:new Date().toISOString()});
  const wrapperId=val('builderWrapperRecipe');
  if(wrapperId && pieces>0) rows.push({product_id,component_type:'recipe',recipe_id:wrapperId,component_name:'Wrapper / Dough',quantity:pieces*wrapperG,unit:'g',quantity_mode:'pieces_x_wrapper_assumption',apply_per:'per_order',sort_order:order++,updated_at:new Date().toISOString()});
  const chutneys=[['Red Chilli Chutney','builderRedChutneyRecipe','red_chutney_cups'],['Mayo','builderMayoRecipe','mayo_cups'],['Nepali Chutney','builderNepaliRecipe','nepali_cups']];
  chutneys.forEach(([name,id,suffix])=>{ const rid=val(id); const cups=typeof assumptionValue==='function'?assumptionValue(momoAssumptionKey(pieces,suffix), pieces<=6?1:2):(pieces<=6?1:2); if(rid && cups>0) rows.push({product_id,component_type:'recipe',recipe_id:rid,component_name:name,quantity:cups*cupG,unit:'g',quantity_mode:'chutney_cups_x_cup_grams',apply_per:'per_order',sort_order:order++,updated_at:new Date().toISOString()}); });
  const packagingId=val('builderPackagingRecipe');
  if(packagingId) rows.push({product_id,component_type:'recipe',recipe_id:packagingId,component_name:'Packaging Set',quantity:1,unit:'set',quantity_mode:'fixed_set',apply_per:'per_order',sort_order:order++,updated_at:new Date().toISOString()});
  const cookingCost=num(val('builderCookingCost'));
  if(cookingCost>0) rows.push({product_id,component_type:'fixed_cost',component_name:'Cooking / Steam / Fry Cost',quantity:1,unit:'fixed',fixed_cost:cookingCost,quantity_mode:'fixed_cost',apply_per:'per_order',sort_order:order++,updated_at:new Date().toISOString()});
  return rows;
}
function previewMomoProductCost(){
  const target=byId('momoBuilderPreview'); if(!target) return;
  const rows=momoBuilderRowsFromForm();
  if(!val('builderProduct')){ target.innerHTML='<div class="empty-state-card">Select a product to preview component cost.</div>'; return; }
  if(!rows.length){ target.innerHTML='<div class="empty-state-card">Select recipes and piece count to preview product cost.</div>'; return; }
  const tr=rows.map(r=>{ const recipe=(state.recipes||[]).find(x=>String(x.id)===String(r.recipe_id)); const cost=productComponentCost(r); return `<tr><td>${escapeHtml(r.component_name||r.component_type)}</td><td>${escapeHtml(recipe?.name||r.component_type)}</td><td>${num(r.quantity)}</td><td>${escapeHtml(r.unit||'')}</td><td>${money(cost)}</td></tr>`; });
  const total=rows.reduce((s,r)=>s+productComponentCost(r),0);
  target.innerHTML=`<div class="table-scroll">${table(['Component','Recipe / Type','Qty','Unit','Cost'],tr)}</div><div class="kpi-grid compact-kpi-grid"><div class="kpi"><span>Preview Product Cost</span><strong>${money(total)}</strong></div></div>`;
}
async function buildMomoProductComponents(){
  const product_id=val('builderProduct'); if(!product_id) return showWarning('Select product first.');
  const rows=momoBuilderRowsFromForm(); if(!rows.length) return showWarning('Select at least one recipe/component to build product cost.');
  if(val('builderReplaceMode')==='replace'){
    const existing=productComponentRows(product_id).map(x=>x.id);
    if(existing.length) await dbDeleteMany('product_components', existing);
  }
  const saved=await dbInsertMany('product_components', rows);
  if(!saved) return;
  showToast(`${rows.length} product component(s) saved.`);
  await refreshAll(false); renderProductRecipes(); renderProducts(); if(typeof renderDashboard==='function') renderDashboard();
}
async function addProductCostComponent(){
  const product_id=val('builderProduct'); if(!product_id) return showWarning('Select product first.');
  const component_type=val('builderComponentType')||'recipe';
  const role=val('builderComponentRole')||'other';
  const quantityMode=val('builderQuantityMode') || productBuilderAutoQuantity(role,component_type,val('builderRecipe'))?.mode || 'manual_quantity';
  let row={product_id,component_type,component_name:val('builderComponentName').trim()||productComponentRoleLabel(role),quantity:num(val('builderQty'))||1,unit:val('builderUnit')||'g',quantity_mode:quantityMode,apply_per:'per_order',sort_order:(productComponentRows(product_id).length+1)*10,updated_at:new Date().toISOString()};
  if(component_type==='recipe'){
    if(!val('builderRecipe')) return showWarning('Select recipe component.');
    if(num(val('builderQty'))<=0) return showWarning('Enter quantity used.');
    row.recipe_id=val('builderRecipe');
  }else if(component_type==='ingredient'){
    if(!val('builderIngredient')) return showWarning('Select ingredient component.');
    if(num(val('builderQty'))<=0) return showWarning('Enter quantity used.');
    row.ingredient_id=val('builderIngredient');
  }else{
    if(num(val('builderFixedCost'))<=0) return showWarning('Enter fixed cost.');
    row.fixed_cost=num(val('builderFixedCost')); row.quantity=1; row.unit='fixed'; row.quantity_mode='fixed_cost'; row.component_type='fixed_cost';
  }
  const saved=await dbInsert('product_components',row); if(!saved) return;
  showToast('Product component added.');
  clearProductComponentBuilder();
  await refreshAll(false); renderProductRecipes(); renderProducts(); if(typeof renderDashboard==='function') renderDashboard();
}
async function addManualProductComponent(){ return addProductCostComponent(); }
async function deleteProductComponent(id){ const ok=await confirmTypedDelete('Delete this product cost component?', 'Delete product component'); if(!ok) return; const done=await dbDelete('product_components',id); if(done){ showToast('Product component deleted.'); await refreshAll(false); renderProductRecipes(); renderProducts(); }}

function productComponentNormalizeKey(key){
  return String(key||'').toLowerCase().trim().replace(/[%₹]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
}
function productComponentNormalizeRow(row,rowNumber='',sheetName=''){
  const out={_row:row.__rowNumber||row._row||rowNumber,_sheetName:row.__sheetName||row._sheetName||sheetName};
  Object.entries(row||{}).forEach(([key,value])=>{
    if(String(key).startsWith('__') || String(key).startsWith('_')) return;
    out[productComponentNormalizeKey(key)]=value;
  });
  return out;
}
function productComponentPick(row, aliases=[]){
  for(const alias of aliases){
    const key=productComponentNormalizeKey(alias);
    const value=row[key];
    if(value!==undefined && value!==null && String(value).trim()!=='') return value;
  }
  return '';
}
function productComponentImportNumber(value){
  if(value===undefined || value===null || value==='') return 0;
  if(typeof value==='number') return Number.isFinite(value) ? value : 0;
  const cleaned=String(value).replace(/,/g,'').replace(/₹/g,'').trim();
  const match=cleaned.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) || 0 : 0;
}
function parseProductComponentCsv(text){
  const rows=[]; let row=[], cell='', quote=false;
  for(let i=0;i<String(text||'').length;i++){
    const ch=text[i], next=text[i+1];
    if(ch==='"' && quote && next==='"'){ cell+='"'; i++; continue; }
    if(ch==='"'){ quote=!quote; continue; }
    if(ch===',' && !quote){ row.push(cell); cell=''; continue; }
    if((ch==='\n' || ch==='\r') && !quote){
      if(ch==='\r' && next==='\n') i++;
      row.push(cell); cell='';
      if(row.some(x=>String(x).trim()!=='')) rows.push(row);
      row=[]; continue;
    }
    cell+=ch;
  }
  row.push(cell); if(row.some(x=>String(x).trim()!=='')) rows.push(row);
  if(!rows.length) return [];
  const headers=rows[0].map(h=>String(h||'').trim());
  return rows.slice(1).map((r,idx)=>{
    const obj={__rowNumber:idx+2,__sheetName:'CSV'};
    headers.forEach((h,i)=>obj[h]=r[i]||'');
    return obj;
  });
}
async function readProductComponentImportRows(file){
  const name=String(file?.name||'').toLowerCase();
  if(name.endsWith('.csv')) return parseProductComponentCsv(await file.text()).map(productComponentNormalizeRow);
  if(typeof XLSX !== 'undefined'){
    const buffer=await file.arrayBuffer();
    const workbook=XLSX.read(buffer,{type:'array'});
    const rows=[];
    workbook.SheetNames.forEach(sheetName=>{
      const sheet=workbook.Sheets[sheetName];
      const data=XLSX.utils.sheet_to_json(sheet,{defval:''});
      data.forEach((row,idx)=>rows.push(productComponentNormalizeRow(row,idx+2,sheetName)));
    });
    return rows;
  }
  throw new Error('Excel import needs XLSX library. Please upload CSV or make sure xlsx library is loaded.');
}
function normalizeProductComponentType(value,row){
  const raw=String(value||'').trim().toLowerCase().replace(/\s+/g,'_');
  if(['recipe','recipe_component','component_recipe'].includes(raw)) return 'recipe';
  if(['ingredient','raw_ingredient','ingredient_component'].includes(raw)) return 'ingredient';
  if(['fixed','fixed_cost','manual','manual_cost','cost'].includes(raw)) return 'fixed_cost';
  if(productComponentPick(row,['recipe_name','recipe','component_recipe'])) return 'recipe';
  if(productComponentPick(row,['ingredient_name','ingredient','component_ingredient'])) return 'ingredient';
  if(productComponentImportNumber(productComponentPick(row,['fixed_cost','fixed cost','manual_cost','cost']))>0) return 'fixed_cost';
  return 'recipe';
}
function normalizeProductComponentRole(value){
  const raw=String(value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
  const map={
    filling:'filling',momo_filling:'filling',wrapper:'wrapper',dough:'wrapper',wrapper_dough:'wrapper',
    red:'red_chutney',red_chilli:'red_chutney',red_chutney:'red_chutney',red_chilli_chutney:'red_chutney',
    mayo:'mayo',mayonnaise:'mayo',nepali:'nepali_chutney',nepali_chutney:'nepali_chutney',
    packaging:'packaging_set',packaging_set:'packaging_set',box:'packaging_set',chutney_box:'packaging_set',
    cooking:'cooking',steam:'cooking',gas:'cooking',frying:'cooking',fry:'cooking',
    coating:'coating',kurkure:'coating',other:'other'
  };
  return map[raw] || raw || 'other';
}
function productImportFindByName(list,name){
  const target=String(name||'').trim().toLowerCase();
  if(!target) return null;
  return (list||[]).find(x=>String(x.name||'').trim().toLowerCase()===target) || null;
}
function productComponentImportIssue(row,name,reason,extra={}){
  return {row:row._row||'', sheet:row._sheetName||'', product:extra.product||'', name:name||'', reason, ...extra};
}
function productComponentImportMatch(productId,row){
  return (state.productComponents||[]).find(c=>{
    if(String(c.product_id)!==String(productId)) return false;
    if(String(c.component_type)!==String(row.component_type)) return false;
    if(row.recipe_id) return String(c.recipe_id||'')===String(row.recipe_id);
    if(row.ingredient_id) return String(c.ingredient_id||'')===String(row.ingredient_id);
    return String(c.component_name||'').trim().toLowerCase()===String(row.component_name||'').trim().toLowerCase();
  }) || null;
}
let productLastComponentImportSummary=null;
function productComponentImportResultHtml(result){
  if(!result) return '';
  const issues=result.issues||[];
  const missingProducts=issues.filter(x=>x.type==='missing_product');
  const missingRecipes=issues.filter(x=>x.type==='missing_recipe');
  const missingIngredients=issues.filter(x=>x.type==='missing_ingredient');
  const issueRows=issues.slice(0,150).map(x=>`<tr><td>${escapeHtml(x.row||'')}</td><td>${escapeHtml(x.sheet||'')}</td><td>${escapeHtml(x.product||'')}</td><td>${escapeHtml(x.name||'')}</td><td>${escapeHtml(x.reason||'')}</td></tr>`);
  return `<div class="recipe-import-result-card" style="margin:10px 0">
    <div><strong>Product component import complete:</strong> ${result.inserted||0} inserted, ${result.updated||0} updated, ${result.skipped||0} skipped.</div>
    ${result.replaced?`<div class="small">Cleared old components for ${result.replaced} product(s) before import.</div>`:''}
    ${(missingProducts.length||missingRecipes.length||missingIngredients.length)?`<div class="recipe-warning-list" style="margin-top:10px"><strong>Missing master data:</strong><span>${missingProducts.length} product(s), ${missingRecipes.length} recipe(s), ${missingIngredients.length} ingredient(s) were missing. Add them first, then re-import this sheet.</span></div>`:''}
    ${issues.length?`<div class="recipe-table-wrap" style="margin-top:10px">${table(['Row','Sheet','Product','Name','Reason'],issueRows)}</div><button class="recipe-btn small" onclick="downloadProductComponentImportIssues()">Download skipped reasons</button>`:'<span class="positive-text"> No skipped rows.</span>'}
  </div>`;
}
function renderProductComponentImportResults(result){
  productLastComponentImportSummary=result||productLastComponentImportSummary;
  const target=byId('productComponentImportResults');
  if(target) target.innerHTML=productComponentImportResultHtml(productLastComponentImportSummary);
}
function downloadProductComponentImportIssues(){
  const issues=(productLastComponentImportSummary?.issues)||[];
  if(!issues.length) return;
  downloadCSV('product_component_import_skipped_reasons.csv', issues.map(x=>({'Row':x.row||'', 'Sheet':x.sheet||'', 'Product':x.product||'', 'Name':x.name||'', 'Reason':x.reason||''})));
}
function downloadProductComponentsTemplate(){
  const rows=[
    {'Product Name':'Veg Steam Momos (Solo Treat [6 P.C])','Component Type':'recipe','Component Role':'filling','Recipe Name':'Veg Momo Filling','Ingredient Name':'','Component Name':'Filling','Quantity':180,'Unit':'g','Fixed Cost':'','Quantity Mode':'manual_quantity','Sort Order':10},
    {'Product Name':'Veg Steam Momos (Solo Treat [6 P.C])','Component Type':'recipe','Component Role':'wrapper','Recipe Name':'Ragi Wrapper','Ingredient Name':'','Component Name':'Wrapper / Dough','Quantity':78,'Unit':'g','Fixed Cost':'','Quantity Mode':'manual_quantity','Sort Order':20},
    {'Product Name':'Veg Steam Momos (Solo Treat [6 P.C])','Component Type':'recipe','Component Role':'red_chutney','Recipe Name':'Red Chilli Chutney','Ingredient Name':'','Component Name':'Red Chilli Chutney','Quantity':35,'Unit':'g','Fixed Cost':'','Quantity Mode':'manual_quantity','Sort Order':30},
    {'Product Name':'Veg Steam Momos (Solo Treat [6 P.C])','Component Type':'ingredient','Component Role':'packaging_set','Recipe Name':'','Ingredient Name':'Momo Box','Component Name':'Main Box','Quantity':1,'Unit':'piece','Fixed Cost':'','Quantity Mode':'manual_quantity','Sort Order':60},
    {'Product Name':'Veg Steam Momos (Solo Treat [6 P.C])','Component Type':'fixed_cost','Component Role':'cooking','Recipe Name':'','Ingredient Name':'','Component Name':'Steam/Gas Cost','Quantity':1,'Unit':'fixed','Fixed Cost':2,'Quantity Mode':'fixed_cost','Sort Order':90}
  ];
  downloadCSV('product_components_import_template.csv', rows);
}
async function importProductComponentsFile(){
  const file=byId('productComponentsFile')?.files?.[0];
  if(!file) return showWarning('Select Product Components CSV/Excel file first.');
  let rows=[];
  try{ rows=await readProductComponentImportRows(file); }catch(e){ return showWarning(e.message || 'Could not read product component file.'); }
  if(!rows.length) return showWarning('No usable product component rows found.');
  const mode=val('productComponentsImportMode') || 'upsert';
  const issues=[]; let inserted=0, updated=0, skipped=0, replaced=0;
  const touchedProducts=new Set();
  const target=byId('productComponentImportResults');
  const progress=(i)=>{ if(target) target.innerHTML=`<div class="import-progress-card"><h3>Product component import in progress</h3><p>Processed: ${i} / ${rows.length}</p><div class="progress-bar"><div class="progress-fill" style="width:${rows.length?Math.round(i/rows.length*100):0}%"></div></div><p>Inserted: ${inserted} · Updated: ${updated} · Skipped: ${skipped}</p></div>`; };
  progress(0);
  for(let i=0;i<rows.length;i++){
    const row=rows[i];
    const productName=String(productComponentPick(row,['product_name','product','product name','item_name','item name'])||'').trim();
    const product=productImportFindByName(state.products,productName);
    if(!product){ skipped++; issues.push(productComponentImportIssue(row,productName,productName?`Product not found in Product Master: ${productName}`:'Missing product name',{type:'missing_product',product:productName})); progress(i+1); continue; }
    if(mode==='replace_product' && !touchedProducts.has(product.id)){
      const existing=productComponentRows(product.id).map(x=>x.id);
      if(existing.length){ await dbDeleteMany('product_components',existing); replaced++; }
      state.productComponents=(state.productComponents||[]).filter(x=>String(x.product_id)!==String(product.id));
      touchedProducts.add(product.id);
    }
    const component_type=normalizeProductComponentType(productComponentPick(row,['component_type','type','component type']),row);
    const role=normalizeProductComponentRole(productComponentPick(row,['component_role','role','component role','category']));
    const recipeName=String(productComponentPick(row,['recipe_name','recipe','recipe component','component recipe'])||'').trim();
    const ingredientName=String(productComponentPick(row,['ingredient_name','ingredient','ingredient component','component ingredient'])||'').trim();
    let componentName=String(productComponentPick(row,['component_name','component','name','component label'])||'').trim();
    let quantity=productComponentImportNumber(productComponentPick(row,['quantity','qty','quantity used','quantity_used']));
    let unit=String(productComponentPick(row,['unit','uom'])||'').trim();
    let fixed_cost=productComponentImportNumber(productComponentPick(row,['fixed_cost','fixed cost','manual_cost','manual cost','cost']));
    const quantity_mode=String(productComponentPick(row,['quantity_mode','quantity mode','mode'])||'manual_quantity').trim() || 'manual_quantity';
    const sort_order=productComponentImportNumber(productComponentPick(row,['sort_order','sort order','order','priority'])) || (productComponentRows(product.id).length+1)*10;
    const payload={product_id:product.id,component_type,component_name:componentName||productComponentRoleLabel(role),quantity:quantity||1,unit:unit||'g',fixed_cost:null,quantity_mode,apply_per:'per_order',sort_order,updated_at:new Date().toISOString()};
    if(component_type==='recipe'){
      const recipe=productImportFindByName(state.recipes,recipeName || componentName);
      if(!recipe){ skipped++; issues.push(productComponentImportIssue(row,recipeName||componentName,`Recipe not found in Recipe Master: ${recipeName||componentName}`,{type:'missing_recipe',product:product.name})); progress(i+1); continue; }
      if(quantity<=0){ skipped++; issues.push(productComponentImportIssue(row,recipe.name,'Missing quantity for recipe component',{product:product.name})); progress(i+1); continue; }
      payload.recipe_id=recipe.id; payload.ingredient_id=null; payload.component_name=componentName||productComponentRoleLabel(role)||recipe.name; payload.quantity=quantity; payload.unit=unit||recipe.yield_unit||'g';
    }else if(component_type==='ingredient'){
      const ingredient=productImportFindByName(state.ingredients,ingredientName || componentName);
      if(!ingredient){ skipped++; issues.push(productComponentImportIssue(row,ingredientName||componentName,`Ingredient not found in Ingredient Master: ${ingredientName||componentName}`,{type:'missing_ingredient',product:product.name})); progress(i+1); continue; }
      if(quantity<=0){ skipped++; issues.push(productComponentImportIssue(row,ingredient.name,'Missing quantity for ingredient component',{product:product.name})); progress(i+1); continue; }
      payload.recipe_id=null; payload.ingredient_id=ingredient.id; payload.component_name=componentName||productComponentRoleLabel(role)||ingredient.name; payload.quantity=quantity; payload.unit=unit||ingredient.consumption_unit||ingredient.purchase_unit||'piece';
    }else if(component_type==='fixed_cost'){
      if(fixed_cost<=0){ skipped++; issues.push(productComponentImportIssue(row,componentName||product.name,'Missing fixed cost for fixed cost component',{product:product.name})); progress(i+1); continue; }
      payload.recipe_id=null; payload.ingredient_id=null; payload.component_name=componentName||productComponentRoleLabel(role)||'Fixed Cost'; payload.quantity=1; payload.unit='fixed'; payload.fixed_cost=fixed_cost; payload.quantity_mode='fixed_cost';
    }else{
      skipped++; issues.push(productComponentImportIssue(row,componentName,`Unsupported component type: ${component_type}`,{product:product.name})); progress(i+1); continue;
    }
    const existing=productComponentImportMatch(product.id,payload);
    const saved=existing ? await dbUpdate('product_components', existing.id, payload) : await dbInsert('product_components', payload);
    if(saved){ existing?updated++:inserted++; }
    else{ skipped++; issues.push(productComponentImportIssue(row,payload.component_name,'Database save failed',{product:product.name})); }
    progress(i+1); await new Promise(requestAnimationFrame);
  }
  const result={inserted,updated,skipped,replaced,issues};
  productLastComponentImportSummary=result;
  await refreshAll(false);
  renderProducts();
  renderProductRecipes();
  renderProductComponentImportResults(result);
  if(typeof renderDashboard==='function') renderDashboard();
  const input=byId('productComponentsFile'); if(input) input.value='';
  showToast(`Product component import complete. Inserted ${inserted}, updated ${updated}, skipped ${skipped}.`);
}

function toggleManualComponentFields(){ if(typeof refreshKhumbukaDropdowns==='function') refreshKhumbukaDropdowns(document); }
function productRecipeCost(productId){ const newCost=productComponentsCost(productId); if(newCost>0) return newCost; return state.productRecipes.filter(x=>x.product_id===productId).reduce((sum,x)=>{ const r=state.recipes.find(y=>y.id===x.recipe_id); if(!r) return sum; return sum + (typeof recipeCostForQuantity==='function' ? recipeCostForQuantity(r,x.quantity_used,x.unit) : recipeUnitCost(r)*toBaseUnit(x.quantity_used,x.unit)); },0); }
function computedProductCost(p){ if(typeof productAuditCost==='function') return productAuditCost(p); const manual=num(p.product_cost || p.manual_product_cost); if(manual>0) return manual; const componentCost=productComponentsCost(p.id); if(componentCost>0) return componentCost; return productRecipeCost(p.id)+num(p.packaging_cost); }
function enrichedProduct(p){ if(typeof calculateProductAudit==='function'){ const a=calculateProductAudit(p); return {...p,product_cost:a.total_cost,offline_profit:a.offline_profit,online_profit:a.online_profit,offline_margin:a.offline_margin,online_margin:a.online_margin,audit_warning_count:a.warning_count,audit_clean:a.is_clean,cost_source:a.cost_source}; } const cost=computedProductCost(p); const offlineProfit=num(p.offline_price)-cost; const onlineRevenue=num(p.online_price); const comm=onlineRevenue*num(p.commission_percent||settings.defaultCommission)/100; const onlineProfit=onlineRevenue-cost-comm; return {...p,product_cost:cost,offline_profit:offlineProfit,online_profit:onlineProfit,offline_margin:margin(offlineProfit,num(p.offline_price)),online_margin:margin(onlineProfit,onlineRevenue)}; }
async function saveProductV15(){
 const name=val('productName').trim(); if(!name) return showWarning('Product name required');
 const row={name,category:val('productCategory'),brand_id:val('productBrand')||defaultBrandId(),branch_id:val('productBranch')||null,offline_price:num(val('offlinePrice')),online_price:num(val('onlinePrice')),packaging_cost:num(val('packagingCost')),commission_percent:num(val('commissionPercent'))||settings.defaultCommission,manual_product_cost:num(val('manualProductCost'))||null,active:true,updated_at:new Date().toISOString()};
 let saved=null;
 if(state.editing.product) saved=await dbUpdate('products',state.editing.product,row); else saved=await dbInsert('products',row);
 if(!saved) return;
 showToast(state.editing.product?'Product updated successfully.':'Product created successfully.');
 clearProductForm(); await refreshAll(false); renderProducts(); renderAnalytics(); renderDashboard();
}
function clearProductForm(){ state.editing.product=null; ['productName','productCategory','offlinePrice','onlinePrice','packagingCost','manualProductCost'].forEach(id=>setVal(id,'')); setVal('commissionPercent',settings.defaultCommission); byId('productCreatePanel')?.removeAttribute('open'); }
function editProduct(id){ const p=state.products.find(x=>x.id===id); if(!p)return; state.editing.product=id; setVal('productName',p.name); setVal('productCategory',p.category); setVal('productBrand',p.brand_id||defaultBrandId()); setVal('productBranch',p.branch_id); setVal('offlinePrice',p.offline_price); setVal('onlinePrice',p.online_price); setVal('packagingCost',p.packaging_cost); setVal('commissionPercent',p.commission_percent||settings.defaultCommission); setVal('manualProductCost',p.manual_product_cost||p.product_cost||''); showTab('products'); byId('productCreatePanel')?.setAttribute('open',''); byId('productCreatePanel')?.scrollIntoView({behavior:'smooth',block:'start'}); }
async function deleteProduct(id){ const p=state.products.find(x=>x.id===id); const ok=await confirmTypedDelete(`Delete product ${p?.name||''}? This cannot be undone.`, 'Delete product'); if(!ok) return; const done=await dbDelete('products',id); if(done){ showToast('Product deleted.'); await refreshAll(false); renderProducts(); renderAnalytics(); renderDashboard(); }}
async function addProductRecipe(){
 const product_id=val('builderProduct');
 const recipe_id=val('builderRecipe');
 if(!product_id) return showWarning('Select product first.');
 if(!(state.recipes||[]).length) return showWarning('No recipes found. Create or import a recipe in Recipe Master first, then refresh Products.');
 if(!recipe_id) return showWarning('Select recipe.');
 const qty=num(val('builderQty'));
 if(qty<=0) return showWarning('Enter quantity used for one product/plate.');
 const recipe=state.recipes.find(r=>String(r.id)===String(recipe_id));
 const unit=val('builderUnit') || recipe?.yield_unit || 'g';
 const existing=(state.productRecipes||[]).find(x=>String(x.product_id)===String(product_id) && String(x.recipe_id)===String(recipe_id));
 const row={product_id,recipe_id,quantity_used:qty,unit,updated_at:new Date().toISOString()};
 const saved=existing ? await dbUpdate('product_recipes', existing.id, row) : await dbInsert('product_recipes',row);
 if(!saved) return;
 showToast(existing ? 'Recipe link updated for this product.' : 'Recipe attached to product.');
 setVal('builderQty',''); await refreshAll(false); renderProductRecipes(); renderProducts();
}
async function deleteProductRecipe(id){ const ok=await confirmTypedDelete('Delete this recipe link from the product?', 'Delete product recipe link'); if(!ok) return; const done=await dbDelete('product_recipes',id); if(done){ showToast('Product recipe link deleted.'); await refreshAll(false); renderProductRecipes(); renderProducts(); }}
function openProductRecipeBuilder(){ byId('productRecipeBuilderPanel')?.setAttribute('open',''); byId('builderProduct')?.focus(); }
function renderProductSelectors(){
 const currentBrand=val('productBrand') || defaultBrandId();
 setSelectOptions('productBrand', state.brands, currentBrand, 'Select Brand');
 setSelectOptions('productBrandFilter', state.brands, val('productBrandFilter'), 'All Brands');
 setSelectOptions('productBranch', state.branches, val('productBranch'), 'Select Branch');
 setSelectOptions('productBranchFilter', state.branches, val('productBranchFilter'), 'All Branches');
 setSelectOptions('expenseBrand', state.brands, val('expenseBrand') || defaultBrandId(), 'Select Brand');
 setSelectOptions('expenseBranch', state.branches, val('expenseBranch'), 'Select Branch');
 setSelectOptions('builderProduct', state.products, val('builderProduct'), 'Select Product');
 populateBuilderRecipeSelect();
 setSelectOptions('builderIngredient', (state.ingredients||[]).filter(i=>i.active!==false), val('builderIngredient'), 'Select Ingredient');
 setRecipeSelect('builderFillingRecipe', val('builderFillingRecipe'), 'Select Filling Recipe', ['filling']);
 setRecipeSelect('builderWrapperRecipe', val('builderWrapperRecipe'), 'Select Wrapper Recipe', ['wrapper','dough']);
 setRecipeSelect('builderRedChutneyRecipe', val('builderRedChutneyRecipe'), 'Select Red Chutney Recipe', ['red','chutney']);
 setRecipeSelect('builderMayoRecipe', val('builderMayoRecipe'), 'Select Mayo Recipe', ['mayo']);
 setRecipeSelect('builderNepaliRecipe', val('builderNepaliRecipe'), 'Select Nepali Chutney Recipe', ['nepali','chutney']);
 setRecipeSelect('builderPackagingRecipe', val('builderPackagingRecipe'), 'Select Packaging Set Recipe', ['packaging']);
 syncProductComponentBuilder(false);
 setSelectOptions('cartProduct', state.products, val('cartProduct'), 'Select Product');
 setSelectOptions('bulkProductBrand', state.brands, val('bulkProductBrand'), 'No brand change');
 setSelectOptions('bulkProductBranch', state.branches, val('bulkProductBranch'), 'No branch change');
 renderUnitSelectors();
 syncBuilderRecipeUnit(false);
 if(typeof refreshKhumbukaDropdowns==='function') refreshKhumbukaDropdowns(document);
}
function renderProductRecipes(){
 const pid=val('builderProduct')||state.products[0]?.id;
 const target=byId('productRecipeList'); if(!target) return;
 const status=productRecipeBuilderStatusHtml();
 const auditHtml=productMiniAuditHtml(pid);
 const components=productComponentRows(pid);
 if(components.length){
   const rows=components.map(c=>{
     const r=state.recipes.find(y=>String(y.id)===String(c.recipe_id))||{};
     const ing=state.ingredients.find(y=>String(y.id)===String(c.ingredient_id))||{};
     const cost=productComponentCost(c);
     const source=c.recipe_id?(r.name||'Missing Recipe'):c.ingredient_id?(ing.name||'Missing Ingredient'):(c.component_type==='fixed_cost'?'Fixed Cost':c.component_type);
     return `<tr><td><strong>${escapeHtml(c.component_name||c.component_type||'Component')}</strong><br><span class="small">${escapeHtml(c.quantity_mode||'')}</span></td><td>${escapeHtml(source)}</td><td>${num(c.quantity)}</td><td>${escapeHtml(c.unit||'')}</td><td>${money(cost)}</td><td><button class="btn-danger" onclick="deleteProductComponent('${c.id}')">Delete</button></td></tr>`;
   });
   const total=components.reduce((s,c)=>s+productComponentCost(c),0);
   target.innerHTML=status + auditHtml + `<h4>Saved Product Components</h4>` + table(['Component','Source','Qty','Unit','Cost','Actions'],rows) + `<div class="kpi-grid compact-kpi-grid"><div class="kpi"><span>Total Component Cost</span><strong>${money(total)}</strong></div></div>`;
   previewProductComponentRow();
   return;
 }
 const list=(state.productRecipes||[]).filter(x=>String(x.product_id)===String(pid));
 const rows=list.map(x=>{ const r=state.recipes.find(y=>String(y.id)===String(x.recipe_id))||{}; const cost=typeof recipeCostForQuantity==='function' ? recipeCostForQuantity(r,x.quantity_used,x.unit) : recipeUnitCost(r)*toBaseUnit(x.quantity_used,x.unit); return `<tr><td><strong>${escapeHtml(r.name||'Missing Recipe')}</strong><br><span class="small">Old recipe link</span></td><td>${x.quantity_used}</td><td>${escapeHtml(x.unit||'')}</td><td>${money(cost)}</td><td><button class="btn-danger" onclick="deleteProductRecipe('${x.id}')">Delete</button></td></tr>`; });
 target.innerHTML=status + auditHtml + `<h4>Saved Components / Recipe Links</h4>` + (rows.length?table(['Recipe','Qty','Unit','Cost','Actions'],rows):'<div class="empty-state-card">No saved components yet. Add product components above or import Product Components.</div>');
 previewProductComponentRow();
}
function renderProducts(){
 const q=val('productSearch').toLowerCase(), bf=val('productBrandFilter'), brf=val('productBranchFilter'), sort=val('productSort')||'profit_desc';
 renderProductSelectors(); if(typeof renderRecipeSelectors==='function') renderRecipeSelectors(); renderProductDatalists(); renderProductRecipes(); renderProductComponentImportResults(productLastComponentImportSummary);
 let list=state.products.map(enrichedProduct).filter(p=>{ const searchText=[p.name,p.category,branchName(p.branch_id)].join(' ').toLowerCase(); return searchText.includes(q)&&(!bf||p.brand_id===bf)&&(!brf||p.branch_id===brf); });
 list.sort((a,b)=>sort==='margin_desc'?b.online_margin-a.online_margin:sort==='name_asc'?(a.name||'').localeCompare(b.name||''):sort==='cost_desc'?b.product_cost-a.product_cost:b.online_profit-a.online_profit);
 const rows=list.map(p=>`<tr><td><input type="checkbox" class="product-row-check" value="${p.id}" onchange="updateProductBulkCount()"></td><td><strong>${escapeHtml(p.name)}</strong><br><span class="small">${escapeHtml(p.category||'')}</span></td><td>${escapeHtml(branchName(p.branch_id)||'-')}</td><td>${money(p.product_cost)}</td><td>${money(p.offline_price)}</td><td>${money(p.online_price)}</td><td class="${p.offline_profit>=0?'profit':'loss'}">${money(p.offline_profit)}</td><td class="${p.online_profit>=0?'profit':'loss'}">${money(p.online_profit)}</td><td>${pct(p.offline_margin)}</td><td>${pct(p.online_margin)}</td><td>${p.audit_warning_count?`<span class="status-pill warn">${p.audit_warning_count} warning${p.audit_warning_count>1?'s':''}</span>`:'<span class="status-pill ok">Clean</span>'}</td><td>${escapeHtml(productAuditCostSourceLabel(p.cost_source))}</td><td>${(p.updated_at||p.created_at||'').slice(0,10)}</td><td><button onclick="editProduct('${p.id}')">Edit</button><button class="btn-danger" onclick="deleteProduct('${p.id}')">Delete</button></td></tr>`);
 const container=byId('productsTable'); if(container) container.innerHTML=table(['<input type="checkbox" onchange="toggleAllProducts(this.checked)">','Product','Branch','Cost','Offline Price','Online Price','Offline Profit','Online Profit','Offline Margin','Online Margin','Health','Cost Source','Updated','Actions'],rows);
 updateProductBulkCount();
}
function selectedProductIds(){ return getCheckedValues('.product-row-check'); }
function toggleAllProducts(checked){ setChecked('.product-row-check', checked); updateProductBulkCount(); }
function updateProductBulkCount(){ const count=selectedProductIds().length; const el=byId('selectedProductCount'); if(el) el.textContent=`${count} selected`; const panel=byId('bulkProductActions'); if(panel) panel.classList.toggle('hidden', count < 2); }
async function bulkUpdateProducts(){
 const ids=selectedProductIds(); if(ids.length < 2) return showWarning('Select at least two products for bulk action.');
 const category=val('bulkProductCategory').trim(); const brand_id=val('bulkProductBrand'); const branch_id=val('bulkProductBranch');
 const row={updated_at:new Date().toISOString()};
 if(category) row.category=category; if(brand_id) row.brand_id=brand_id; if(branch_id) row.branch_id=branch_id;
 if(Object.keys(row).length===1) return showWarning('Choose category or branch to update.');
 for(const id of ids){ await dbUpdate('products', id, row); }
 showToast(`${ids.length} product(s) updated.`); setVal('bulkProductCategory',''); setVal('bulkProductBrand',''); setVal('bulkProductBranch',''); await refreshAll(false); renderProducts(); renderAnalytics(); renderDashboard();
}
async function bulkDeleteProducts(){
 const ids=selectedProductIds(); if(ids.length < 2) return showWarning('Select at least two products for bulk delete.');
 const ok=await confirmTypedDelete(`Delete ${ids.length} selected product(s)? This cannot be undone.`, 'Bulk delete products'); if(!ok) return;
 const done=await dbDeleteMany('products', ids); if(done){ showToast(`${ids.length} product(s) deleted.`); await refreshAll(false); renderProducts(); renderAnalytics(); renderDashboard(); }
}
function exportProductsCSV(){ const rows=state.products.length ? state.products.map(p=>{ const e=enrichedProduct(p); return {'Product Name':e.name,'Category':e.category,'Branch':branchName(e.branch_id),'Product Cost':e.product_cost,'Offline Price':e.offline_price,'Online Price':e.online_price,'Packaging Cost':e.packaging_cost,'Commission %':e.commission_percent || settings.defaultCommission,'Manual Product Cost':e.manual_product_cost || '', 'Offline Profit':e.offline_profit,'Online Profit':e.online_profit,'Offline Margin %':e.offline_margin,'Online Margin %':e.online_margin,'Active':e.active!==false}; }) : [{'Product Name':'Chicken Steam Momo','Category':'Momo','Branch':'Main Branch','Product Cost':56,'Offline Price':130,'Online Price':199,'Packaging Cost':8,'Commission %':35,'Manual Product Cost':56,'Offline Profit':74,'Online Profit':73.35,'Offline Margin %':56.92,'Online Margin %':36.86,'Active':true}]; downloadCSV(state.products.length?'khumbuka_products_profitability.csv':'khumbuka_products_sample_schema.csv', rows); }

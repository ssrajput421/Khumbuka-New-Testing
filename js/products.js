function renderProductDatalists(){
 setDatalistOptions('productNameSuggestions', state.products.map(p=>p.name));
 setDatalistOptions('productCategorySuggestions', state.products.map(p=>p.category));
 setDatalistOptions('productSearchSuggestions', state.products.flatMap(p=>[p.name,p.category,brandName(p.brand_id),branchName(p.branch_id)]));
 setDatalistOptions('bulkProductCategorySuggestions', state.products.map(p=>p.category));
}
function productRecipeCost(productId){ return state.productRecipes.filter(x=>x.product_id===productId).reduce((sum,x)=>{ const r=state.recipes.find(y=>y.id===x.recipe_id); if(!r) return sum; return sum + recipeUnitCost(r)*toBaseUnit(x.quantity_used,x.unit); },0); }
function computedProductCost(p){ return num(p.product_cost || p.manual_product_cost) || (productRecipeCost(p.id)+num(p.packaging_cost)); }
function enrichedProduct(p){ const cost=computedProductCost(p); const offlineProfit=num(p.offline_price)-cost; const onlineRevenue=num(p.online_price); const comm=onlineRevenue*num(p.commission_percent||settings.defaultCommission)/100; const onlineProfit=onlineRevenue-cost-comm; return {...p,product_cost:cost,offline_profit:offlineProfit,online_profit:onlineProfit,offline_margin:margin(offlineProfit,num(p.offline_price)),online_margin:margin(onlineProfit,onlineRevenue)}; }
async function saveProductV15(){
 const name=val('productName').trim(); if(!name) return showWarning('Product name required');
 const row={name,category:val('productCategory'),brand_id:val('productBrand')||null,branch_id:val('productBranch')||null,offline_price:num(val('offlinePrice')),online_price:num(val('onlinePrice')),packaging_cost:num(val('packagingCost')),commission_percent:num(val('commissionPercent'))||settings.defaultCommission,manual_product_cost:num(val('manualProductCost'))||null,active:true,updated_at:new Date().toISOString()};
 let saved=null;
 if(state.editing.product) saved=await dbUpdate('products',state.editing.product,row); else saved=await dbInsert('products',row);
 if(!saved) return;
 showToast(state.editing.product?'Product updated successfully.':'Product created successfully.');
 clearProductForm(); await refreshAll(false); renderProducts(); renderAnalytics(); renderDashboard();
}
function clearProductForm(){ state.editing.product=null; ['productName','productCategory','offlinePrice','onlinePrice','packagingCost','manualProductCost'].forEach(id=>setVal(id,'')); setVal('commissionPercent',settings.defaultCommission); byId('productFormTitle') && (byId('productFormTitle').textContent='Create / Update Product'); }
function editProduct(id){ const p=state.products.find(x=>x.id===id); if(!p)return; state.editing.product=id; byId('productFormTitle').textContent='Edit Product'; setVal('productName',p.name); setVal('productCategory',p.category); setVal('productBrand',p.brand_id); setVal('productBranch',p.branch_id); setVal('offlinePrice',p.offline_price); setVal('onlinePrice',p.online_price); setVal('packagingCost',p.packaging_cost); setVal('commissionPercent',p.commission_percent||settings.defaultCommission); setVal('manualProductCost',p.manual_product_cost||p.product_cost||''); showTab('products'); scrollTo(0,0); }
async function deleteProduct(id){ const p=state.products.find(x=>x.id===id); const ok=await confirmTypedDelete(`Delete product ${p?.name||''}? This cannot be undone.`, 'Delete product'); if(!ok) return; const done=await dbDelete('products',id); if(done){ showToast('Product deleted.'); await refreshAll(false); renderProducts(); renderAnalytics(); renderDashboard(); }}
async function addProductRecipe(){ if(!val('builderProduct')||!val('builderRecipe')) return showWarning('Select product and recipe'); const saved=await dbInsert('product_recipes',{product_id:val('builderProduct'),recipe_id:val('builderRecipe'),quantity_used:num(val('builderQty')),unit:val('builderUnit')}); if(!saved) return; showToast('Recipe attached to product.'); setVal('builderQty',''); await refreshAll(false); renderProductRecipes(); renderProducts(); }
async function deleteProductRecipe(id){ const ok=await confirmTypedDelete('Delete this recipe link from the product?', 'Delete product recipe link'); if(!ok) return; const done=await dbDelete('product_recipes',id); if(done){ showToast('Product recipe link deleted.'); await refreshAll(false); renderProductRecipes(); renderProducts(); }}
function openProductRecipeBuilder(){ byId('builderProduct').focus(); }
function renderProductSelectors(){
 setSelectOptions('productBrand', state.brands, val('productBrand'), 'Select Brand');
 setSelectOptions('productBrandFilter', state.brands, val('productBrandFilter'), 'All Brands');
 setSelectOptions('productBranch', state.branches, val('productBranch'), 'Select Branch');
 setSelectOptions('productBranchFilter', state.branches, val('productBranchFilter'), 'All Branches');
 setSelectOptions('expenseBrand', state.brands, val('expenseBrand'), 'Select Brand');
 setSelectOptions('expenseBranch', state.branches, val('expenseBranch'), 'Select Branch');
 setSelectOptions('builderProduct', state.products, val('builderProduct'), 'Select Product');
 setSelectOptions('cartProduct', state.products, val('cartProduct'), 'Select Product');
 setSelectOptions('bulkProductBrand', state.brands, val('bulkProductBrand'), 'No brand change');
 setSelectOptions('bulkProductBranch', state.branches, val('bulkProductBranch'), 'No branch change');
}
function renderProductRecipes(){ const pid=val('builderProduct')||state.products[0]?.id; const list=state.productRecipes.filter(x=>x.product_id===pid); byId('productRecipeList').innerHTML=table(['Recipe','Qty','Unit','Cost','Actions'],list.map(x=>{ const r=state.recipes.find(y=>y.id===x.recipe_id)||{}; const cost=recipeUnitCost(r)*toBaseUnit(x.quantity_used,x.unit); return `<tr><td>${escapeHtml(r.name||'')}</td><td>${x.quantity_used}</td><td>${x.unit||''}</td><td>${money(cost)}</td><td><button class="btn-danger" onclick="deleteProductRecipe('${x.id}')">Delete</button></td></tr>`; })); }
function renderProducts(){
 const q=val('productSearch').toLowerCase(), bf=val('productBrandFilter'), brf=val('productBranchFilter'), sort=val('productSort')||'profit_desc';
 renderProductSelectors(); renderRecipeSelectors(); renderProductDatalists(); renderProductRecipes();
 let list=state.products.map(enrichedProduct).filter(p=>{ const searchText=[p.name,p.category,brandName(p.brand_id),branchName(p.branch_id)].join(' ').toLowerCase(); return searchText.includes(q)&&(!bf||p.brand_id===bf)&&(!brf||p.branch_id===brf); });
 list.sort((a,b)=>sort==='margin_desc'?b.online_margin-a.online_margin:sort==='name_asc'?(a.name||'').localeCompare(b.name||''):sort==='cost_desc'?b.product_cost-a.product_cost:b.online_profit-a.online_profit);
 const rows=list.map(p=>`<tr><td><input type="checkbox" class="product-row-check" value="${p.id}" onchange="updateProductBulkCount()"></td><td><strong>${escapeHtml(p.name)}</strong><br><span class="small">${escapeHtml(p.category||'')}</span></td><td>${escapeHtml(brandName(p.brand_id))}</td><td>${escapeHtml(branchName(p.branch_id))}</td><td>${money(p.product_cost)}</td><td>${money(p.offline_price)}</td><td>${money(p.online_price)}</td><td class="${p.offline_profit>=0?'profit':'loss'}">${money(p.offline_profit)}</td><td class="${p.online_profit>=0?'profit':'loss'}">${money(p.online_profit)}</td><td>${pct(p.offline_margin)}</td><td>${pct(p.online_margin)}</td><td>${(p.updated_at||p.created_at||'').slice(0,10)}</td><td><button onclick="editProduct('${p.id}')">Edit</button><button class="btn-danger" onclick="deleteProduct('${p.id}')">Delete</button></td></tr>`);
 byId('productsTable').innerHTML=table(['<input type="checkbox" onchange="toggleAllProducts(this.checked)">','Product','Brand','Branch','Cost','Offline Price','Online Price','Offline Profit','Online Profit','Offline Margin','Online Margin','Updated','Actions'],rows);
 updateProductBulkCount();
}
function selectedProductIds(){ return getCheckedValues('.product-row-check'); }
function toggleAllProducts(checked){ setChecked('.product-row-check', checked); updateProductBulkCount(); }
function updateProductBulkCount(){ const el=byId('selectedProductCount'); if(el) el.textContent=`${selectedProductIds().length} selected`; }
async function bulkUpdateProducts(){
 const ids=selectedProductIds(); if(!ids.length) return showWarning('Select at least one product.');
 const category=val('bulkProductCategory').trim(); const brand_id=val('bulkProductBrand'); const branch_id=val('bulkProductBranch');
 const row={updated_at:new Date().toISOString()};
 if(category) row.category=category; if(brand_id) row.brand_id=brand_id; if(branch_id) row.branch_id=branch_id;
 if(Object.keys(row).length===1) return showWarning('Choose category, brand or branch to update.');
 for(const id of ids){ await dbUpdate('products', id, row); }
 showToast(`${ids.length} product(s) updated.`); setVal('bulkProductCategory',''); setVal('bulkProductBrand',''); setVal('bulkProductBranch',''); await refreshAll(false); renderProducts(); renderAnalytics(); renderDashboard();
}
async function bulkDeleteProducts(){
 const ids=selectedProductIds(); if(!ids.length) return showWarning('Select at least one product.');
 const ok=await confirmTypedDelete(`Delete ${ids.length} selected product(s)? This cannot be undone.`, 'Bulk delete products'); if(!ok) return;
 const done=await dbDeleteMany('products', ids); if(done){ showToast(`${ids.length} product(s) deleted.`); await refreshAll(false); renderProducts(); renderAnalytics(); renderDashboard(); }
}
function exportProductsCSV(){ const rows=state.products.length ? state.products.map(p=>{ const e=enrichedProduct(p); return {'Product Name':e.name,'Category':e.category,'Brand':brandName(e.brand_id),'Branch':branchName(e.branch_id),'Product Cost':e.product_cost,'Offline Price':e.offline_price,'Online Price':e.online_price,'Packaging Cost':e.packaging_cost,'Commission %':e.commission_percent || settings.defaultCommission,'Manual Product Cost':e.manual_product_cost || '', 'Offline Profit':e.offline_profit,'Online Profit':e.online_profit,'Offline Margin %':e.offline_margin,'Online Margin %':e.online_margin,'Active':e.active!==false}; }) : [{'Product Name':'Chicken Steam Momo','Category':'Momo','Brand':'Khumbuka','Branch':'Main Branch','Product Cost':56,'Offline Price':130,'Online Price':199,'Packaging Cost':8,'Commission %':35,'Manual Product Cost':56,'Offline Profit':74,'Online Profit':73.35,'Offline Margin %':56.92,'Online Margin %':36.86,'Active':true}]; downloadCSV(state.products.length?'khumbuka_products_profitability.csv':'khumbuka_products_sample_schema.csv', rows); }

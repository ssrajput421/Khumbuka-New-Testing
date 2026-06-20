async function importEntity(entity,fileInputId){
 const file=byId(fileInputId).files[0];
 if(!file) return showWarning('Select CSV or Excel file');
 const rows=await readSheetFile(file);
 if(!rows.length) return showWarning('No rows found in file');
 let imported=0, skipped=0;
 const targetMap={ingredients:'ingredientImportResults',products:'productImportResults',expenses:'expenseImportResults'};
 const target=targetMap[entity];
 const updateProgress=(processed)=>{
  const pctDone = rows.length ? Math.round(processed/rows.length*100) : 0;
  if(byId(target)) byId(target).innerHTML=`<div class="import-progress-card"><h3>Upload in progress</h3><p>Processed: ${processed} / ${rows.length} (${pctDone}%)</p><div class="progress-bar"><div class="progress-fill" style="width:${pctDone}%"></div></div><p>Imported/Updated: ${imported}</p><p>Skipped: ${skipped}</p></div>`;
 };
 updateProgress(0);

 for(let idx=0; idx<rows.length; idx++){
  const r=rows[idx];
  if(entity==='ingredients'){
   const name=String(pick(r,['Ingredient Name','Ingredient','Name'])).trim();
   if(!name){skipped++; updateProgress(idx+1); continue;}
   const price=num(pick(r,['Purchase Price','Price','Rate']));
   const waste=num(pick(r,['Wastage %','Wastage','Waste %','Waste']));
   const activeRaw=String(pick(r,['Active','Status'])||'true').toLowerCase();
   const existing=state.ingredients.find(x=>(x.name||'').toLowerCase()===name.toLowerCase());
   const row={ name, category:pick(r,['Category'])||'Uncategorized', purchase_price:price, purchase_unit:pick(r,['Purchase Unit','Unit'])||'kg', consumption_unit:pick(r,['Consumption Unit','Usage Unit'])||pick(r,['Purchase Unit','Unit'])||'kg', conversion_quantity:num(pick(r,['Conversion Quantity','Conversion Qty','Conversion']))||1, wastage_percent:waste, effective_cost:effectiveCost(price,waste), active:!['false','inactive','no','0'].includes(activeRaw), updated_at:new Date().toISOString() };
   const saved = existing ? await dbUpdate('ingredients', existing.id, row) : await dbInsert('ingredients', row);
   saved ? imported++ : skipped++;
  }

  if(entity==='products'){
   const name=String(pick(r,['Product Name','Product','Item Name','Item','Name'])).trim();
   if(!name){skipped++; updateProgress(idx+1); continue;}
   const brandText=String(pick(r,['Brand'])||'').trim();
   const branchText=String(pick(r,['Branch'])||'').trim();
   const brand=state.brands.find(b=>(b.name||'').toLowerCase()===brandText.toLowerCase());
   const branch=state.branches.find(b=>(b.name||'').toLowerCase()===branchText.toLowerCase());
   const offlinePrice=num(pick(r,['Offline Price','Offline','Store Price']));
   const onlinePrice=num(pick(r,['Online Price','Online','Aggregator Price','Delivery Price']));
   const packagingCost=num(pick(r,['Packaging Cost','Packaging']));
   const manualCost=num(pick(r,['Manual Product Cost','Product Cost','Recipe Cost','Cost']));
   const commission=num(pick(r,['Commission %','Commission','Commission Percent'])) || settings.defaultCommission;
   const activeRaw=String(pick(r,['Active','Status'])||'true').toLowerCase();
   const existing=state.products.find(x=>(x.name||'').toLowerCase()===name.toLowerCase() && (x.branch_id||'')===(branch?.id||''));
   const row={ name, category:pick(r,['Category'])||'Uncategorized', brand_id:brand?.id||null, branch_id:branch?.id||null, offline_price:offlinePrice, online_price:onlinePrice, packaging_cost:packagingCost, commission_percent:commission, manual_product_cost:manualCost||null, active:!['false','inactive','no','0'].includes(activeRaw), updated_at:new Date().toISOString() };
   const saved = existing ? await dbUpdate('products', existing.id, row) : await dbInsert('products', row);
   saved ? imported++ : skipped++;
  }

  if(entity==='expenses'){
   const amount=num(pick(r,['Amount','Expense']));
   if(!amount){skipped++; updateProgress(idx+1); continue;}
   const brandText=pick(r,['Brand']);
   const branchText=pick(r,['Branch']);
   const brand=state.brands.find(b=>b.name?.toLowerCase()===String(brandText).toLowerCase());
   const branch=state.branches.find(b=>b.name?.toLowerCase()===String(branchText).toLowerCase());
   const saved=await dbInsert('expenses',{expense_date:pick(r,['Date'])||today(),brand_id:brand?.id||null,branch_id:branch?.id||null,category:pick(r,['Category'])||'Miscellaneous',description:pick(r,['Description','Details']),amount,notes:pick(r,['Notes'])});
   saved ? imported++ : skipped++;
  }
  updateProgress(idx+1);
  await new Promise(requestAnimationFrame);
 }
 if(byId(target)) byId(target).innerHTML=`<div class="card"><h3>Import Complete</h3><p>Imported/Updated: ${imported}</p><p>Skipped: ${skipped}</p></div>`;
 showToast(`${entity} import complete. Imported/updated ${imported}, skipped ${skipped}.`);
 await refreshAll(false);
 if(entity==='ingredients') renderIngredients();
 if(entity==='products') renderProducts();
 if(entity==='expenses') renderExpenses();
}

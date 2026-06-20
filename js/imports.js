async function importEntity(entity,fileInputId){
 const file=byId(fileInputId).files[0];
 if(!file) return alert('Select CSV or Excel file');
 const rows=await readSheetFile(file);
 if(!rows.length) return alert('No rows found');
 let imported=0, skipped=0;

 for(const r of rows){
  if(entity==='ingredients'){
   const name=String(pick(r,['Ingredient Name','Ingredient','Name'])).trim();
   if(!name){skipped++;continue;}
   const price=num(pick(r,['Purchase Price','Price','Rate']));
   const waste=num(pick(r,['Wastage %','Wastage','Waste %','Waste']));
   const activeRaw=String(pick(r,['Active','Status'])||'true').toLowerCase();
   const existing=state.ingredients.find(x=>(x.name||'').toLowerCase()===name.toLowerCase());
   const row={
    name,
    category:pick(r,['Category'])||'Uncategorized',
    purchase_price:price,
    purchase_unit:pick(r,['Unit','Purchase Unit'])||'kg',
    wastage_percent:waste,
    effective_cost:effectiveCost(price,waste),
    active:!['false','inactive','no','0'].includes(activeRaw),
    updated_at:new Date().toISOString()
   };
   if(existing) await dbUpdate('ingredients', existing.id, row);
   else await dbInsert('ingredients', row);
   imported++;
  }

  if(entity==='products'){
   const name=String(pick(r,['Product Name','Product','Item Name','Item','Name'])).trim();
   if(!name){skipped++;continue;}
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
   const row={
    name,
    category:pick(r,['Category'])||'Uncategorized',
    brand_id:brand?.id||null,
    branch_id:branch?.id||null,
    offline_price:offlinePrice,
    online_price:onlinePrice,
    packaging_cost:packagingCost,
    commission_percent:commission,
    manual_product_cost:manualCost||null,
    active:!['false','inactive','no','0'].includes(activeRaw),
    updated_at:new Date().toISOString()
   };
   if(existing) await dbUpdate('products', existing.id, row);
   else await dbInsert('products', row);
   imported++;
  }

  if(entity==='expenses'){
   const amount=num(pick(r,['Amount','Expense']));
   if(!amount){skipped++;continue;}
   const brandText=pick(r,['Brand']);
   const branchText=pick(r,['Branch']);
   const brand=state.brands.find(b=>b.name?.toLowerCase()===String(brandText).toLowerCase());
   const branch=state.branches.find(b=>b.name?.toLowerCase()===String(branchText).toLowerCase());
   await dbInsert('expenses',{expense_date:pick(r,['Date'])||today(),brand_id:brand?.id||null,branch_id:branch?.id||null,category:pick(r,['Category'])||'Miscellaneous',description:pick(r,['Description','Details']),amount,notes:pick(r,['Notes'])});
   imported++;
  }
 }
 const targetMap={ingredients:'ingredientImportResults',products:'productImportResults',expenses:'expenseImportResults'};
 const target=targetMap[entity];
 if(byId(target)) byId(target).innerHTML=`<div class="card"><h3>Import Complete</h3><p>Imported/Updated: ${imported}</p><p>Skipped: ${skipped}</p></div>`;
 await refreshAll(false);
 if(entity==='ingredients') renderIngredients();
 if(entity==='products') renderProducts();
 if(entity==='expenses') renderExpenses();
}

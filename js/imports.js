async function importEntity(entity,fileInputId){
 const file=byId(fileInputId).files[0]; if(!file) return alert('Select CSV or Excel file'); const rows=await readSheetFile(file); if(!rows.length) return alert('No rows found'); let imported=0, skipped=0;
 for(const r of rows){
  if(entity==='ingredients'){
   const name=pick(r,['Ingredient Name','Ingredient','Name']); if(!name){skipped++;continue;} const price=num(pick(r,['Purchase Price','Price','Rate'])); const waste=num(pick(r,['Wastage','Waste'])); await dbInsert('ingredients',{name,category:pick(r,['Category']),purchase_price:price,purchase_unit:pick(r,['Unit','Purchase Unit']),wastage_percent:waste,effective_cost:effectiveCost(price,waste),active:true}); imported++;
  }
  if(entity==='expenses'){
   const amount=num(pick(r,['Amount','Expense'])); if(!amount){skipped++;continue;} const brandText=pick(r,['Brand']); const branchText=pick(r,['Branch']); const brand=state.brands.find(b=>b.name?.toLowerCase()===String(brandText).toLowerCase()); const branch=state.branches.find(b=>b.name?.toLowerCase()===String(branchText).toLowerCase()); await dbInsert('expenses',{expense_date:pick(r,['Date'])||today(),brand_id:brand?.id||null,branch_id:branch?.id||null,category:pick(r,['Category'])||'Miscellaneous',description:pick(r,['Description','Details']),amount,notes:pick(r,['Notes'])}); imported++;
  }
 }
 const target=entity==='ingredients'?'ingredientImportResults':'expenseImportResults'; byId(target).innerHTML=`<div class="card"><h3>Import Complete</h3><p>Imported: ${imported}</p><p>Skipped: ${skipped}</p></div>`; await refreshAll(false); if(entity==='ingredients') renderIngredients(); if(entity==='expenses') renderExpenses();
}

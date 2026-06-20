async function importEntity(entity,fileInputId){
 const file=byId(fileInputId).files[0];
 if(!file) return showWarning('Select CSV or Excel file');
 const rows=await readSheetFile(file,{allSheets: entity==='expenses'});
 if(!rows.length) return showWarning('No usable rows found in file. Check that the sheet has headers and data.');
 let imported=0, skipped=0;
 const issues=[];
 const targetMap={ingredients:'ingredientImportResults',products:'productImportResults',expenses:'expenseImportResults'};
 const target=targetMap[entity];
 const addIssue=async(row,reason,name='')=>{
  skipped++;
  const issue={rowNumber:row.__rowNumber, sheetName:row.__sheetName, reason, name, sourceFile:row.__sourceFile||file.name};
  issues.push(issue);
  await saveImportRejection(entity, issue.sourceFile, issue.sheetName, issue.rowNumber, reason, row);
 };
 const updateProgress=(processed)=>{
  const pctDone = rows.length ? Math.round(processed/rows.length*100) : 0;
  if(byId(target)) byId(target).innerHTML=`<div class="import-progress-card"><h3>Upload in progress</h3><p>Processed: ${processed} / ${rows.length} (${pctDone}%)</p><div class="progress-bar"><div class="progress-fill" style="width:${pctDone}%"></div></div><p>Imported/Updated: ${imported}</p><p>Skipped: ${skipped}</p><p class="small">Skipped reasons will show after import.</p></div>`;
 };
 updateProgress(0);

 for(let idx=0; idx<rows.length; idx++){
  const r=rows[idx];
  if(entity==='ingredients'){
   const name=String(pickExact(r,['Ingredient Name','Ingredient','Name']) || pick(r,['Ingredient Name','Ingredient','Name'])).trim();
   if(!name){ await addIssue(r,'Missing ingredient name'); updateProgress(idx+1); continue; }
   const price=num(pickExact(r,['Purchase Price']) || pick(r,['Purchase Price','Price','Rate','Reconciliation price']));
   const waste=num(pickExact(r,['Wastage %','Waste %','Normal loss(%)']) || pick(r,['Wastage','Waste','Normal loss']));
   const activeRaw=String(pickExact(r,['Active','Status'])||pick(r,['Active','Status'])||'true').toLowerCase();
   const existing=state.ingredients.find(x=>(x.name||'').toLowerCase()===name.toLowerCase());
   const purchaseUnit=String(pickExact(r,['Purchase Unit']) || pick(r,['Purchase Unit','Unit']) || 'kg').trim();
   const consumptionUnit=String(pickExact(r,['Consumption Unit']) || pick(r,['Consumption Unit','Usage Unit']) || purchaseUnit).trim();
   const row={ name, category:pickExact(r,['Category'])||pick(r,['Category'])||'Uncategorized', purchase_price:price, purchase_unit:purchaseUnit, consumption_unit:consumptionUnit, conversion_quantity:num(pickExact(r,['Conversion Quantity','Conversion Qty'])||pick(r,['Conversion Quantity','Conversion Qty','Conversion']))||1, wastage_percent:waste, effective_cost:effectiveCost(price,waste), active:!['false','inactive','no','0'].includes(activeRaw), source_file:r.__sourceFile||file.name, updated_at:new Date().toISOString() };
   const saved = existing ? await dbUpdate('ingredients', existing.id, row) : await dbInsert('ingredients', row);
   saved ? imported++ : await addIssue(r,'Supabase save failed',name);
  }

  if(entity==='products'){
   const name=String(pickExact(r,['Product Name','Product','Item Name','Item','Name']) || pick(r,['Product Name','Product','Item Name','Item','Name'])).trim();
   if(!name){ await addIssue(r,'Missing product name'); updateProgress(idx+1); continue; }
   const branchText=String(pickExact(r,['Branch'])||pick(r,['Branch'])||'').trim();
   const brand=state.brands.find(b=>(b.name||'').toLowerCase()==='khumbuka') || state.brands[0];
   const branch=state.branches.find(b=>(b.name||'').toLowerCase()===branchText.toLowerCase()) || state.branches[0];
   const offlinePrice=num(pickExact(r,['Offline Price'])||pick(r,['Offline Price','Offline','Store Price']));
   const onlinePrice=num(pickExact(r,['Online Price'])||pick(r,['Online Price','Online','Aggregator Price','Delivery Price']));
   const packagingCost=num(pickExact(r,['Packaging Cost'])||pick(r,['Packaging Cost','Packaging']));
   const manualCost=num(pickExact(r,['Manual Product Cost','Product Cost'])||pick(r,['Manual Product Cost','Product Cost','Recipe Cost','Cost']));
   const commission=num(pickExact(r,['Commission %'])||pick(r,['Commission %','Commission','Commission Percent'])) || settings.defaultCommission;
   const activeRaw=String(pickExact(r,['Active','Status'])||pick(r,['Active','Status'])||'true').toLowerCase();
   const existing=state.products.find(x=>(x.name||'').toLowerCase()===name.toLowerCase() && (x.branch_id||'')===(branch?.id||''));
   const row={ name, category:pickExact(r,['Category'])||pick(r,['Category'])||'Uncategorized', brand_id:brand?.id||null, branch_id:branch?.id||null, offline_price:offlinePrice, online_price:onlinePrice, packaging_cost:packagingCost, commission_percent:commission, manual_product_cost:manualCost||null, source:'import', active:!['false','inactive','no','0'].includes(activeRaw), updated_at:new Date().toISOString() };
   const saved = existing ? await dbUpdate('products', existing.id, row) : await dbInsert('products', row);
   saved ? imported++ : await addIssue(r,'Supabase save failed',name);
  }

  if(entity==='expenses'){
   const paidBy=String(pickExact(r,['Paid By']) || pick(r,['Paid By','Paid From']) || '').trim();
   const paidTo=String(pickExact(r,['Paid to']) || pick(r,['Paid to','Paid To','Vendor']) || '').trim();
   const itemName=String(pickExact(r,['Item Name']) || pick(r,['Item Name','Item','Description','Details']) || '').trim();
   const description=itemName || paidTo || String(pickExact(r,['Description']) || pick(r,['Description','Details']) || '').trim();
   const qty=num(pickExact(r,['Quantity']) || pick(r,['Quantity','Qty'])) || 1;
   const unitRate=num(pickExact(r,['Dr']) || pick(r,['Dr','Debit','Rate','Price'])) || 0;
   const cashReceived=num(pickExact(r,['Cr']) || pick(r,['Cr','Credit','Cash Received'])) || 0;
   const totalCell=num(pickExact(r,['Total']) || pickExact(r,['Amount']) || pick(r,['Total','Amount','Expense']));
   const amount=totalCell || (unitRate * qty);
   if(!amount || !description){ await addIssue(r,`Missing ${!amount?'amount/total':'description/item name'}`,description); updateProgress(idx+1); continue; }
   const branchText=pickExact(r,['Branch']) || pick(r,['Branch']) || r.__sheetName || '';
   const brand=state.brands.find(b=>(b.name||'').toLowerCase()==='khumbuka') || state.brands[0];
   let branch=state.branches.find(b=>b.name?.toLowerCase()===String(branchText).toLowerCase());
   if(!branch && String(file.name).toLowerCase().includes('matiyala')) branch=state.branches.find(b=>(b.name||'').toLowerCase().includes('matiyala')) || state.branches[0] || null;
   if(!branch) branch=state.branches[0] || null;
   const category=pickExact(r,['Category']) || pick(r,['Category']) || inferExpenseCategory(`${description} ${paidTo}`);
   const dateRaw=pickExact(r,['Date']) || pick(r,['Date']) || r.__dateRangeEnd || today();
   const balanceAfter=num(pickExact(r,['Balance']) || pick(r,['Balance'])) || null;
   const notes=[paidTo&&`Paid to: ${paidTo}`, paidBy&&`Paid by: ${paidBy}`, itemName&&`Item: ${itemName}`, qty&&`Qty: ${qty}`, unitRate&&`Rate: ${unitRate}`, cashReceived&&`Cr: ${cashReceived}`, balanceAfter!==null&&`Balance: ${balanceAfter}`, r.__sheetName&&`Sheet: ${r.__sheetName}`].filter(Boolean).join(' | ');
   const saved=await dbInsert('expenses',{expense_date:excelSerialToDate(dateRaw),brand_id:brand?.id||null,branch_id:branch?.id||null,category,description,amount,notes,paid_by:paidBy,paid_to:paidTo,item_name:itemName,quantity:qty,unit_rate:unitRate,cash_received:cashReceived,balance_after:balanceAfter,source_sheet:r.__sheetName||'',source_file:r.__sourceFile||file.name,row_number:r.__rowNumber||null});
   saved ? imported++ : await addIssue(r,'Supabase save failed',description);
  }
  updateProgress(idx+1);
  await new Promise(requestAnimationFrame);
 }
 const issueRows=issues.slice(0,20).map(x=>`<tr><td>${x.rowNumber||''}</td><td>${escapeHtml(x.sheetName||'')}</td><td>${escapeHtml(x.name||'')}</td><td>${escapeHtml(x.reason)}</td></tr>`);
 const issueTable=issues.length?`<h4>Skipped / failed rows</h4>${table(['Row','Sheet','Name / Item','Reason'],issueRows)}<button class="btn-secondary" onclick='downloadCSV("${entity}_skipped_reasons.csv", ${JSON.stringify(issues.map(x=>({'Row':x.rowNumber||'', 'Sheet':x.sheetName||'', 'Name / Item':x.name||'', 'Reason':x.reason||'', 'Source File':x.sourceFile||''}))).replace(/'/g,"&#39;")})'>Download skipped reasons</button>`:'<p class="small">No skipped rows.</p>';
 if(byId(target)) byId(target).innerHTML=`<div class="card"><h3>Import Complete</h3><p>Imported/Updated: ${imported}</p><p>Skipped: ${skipped}</p>${issueTable}</div>`;
 showToast(`${entity} import complete. Imported/updated ${imported}, skipped ${skipped}.`);
 await refreshAll(false);
 if(entity==='ingredients') renderIngredients();
 if(entity==='products') renderProducts();
 if(entity==='expenses') renderExpenses();
}

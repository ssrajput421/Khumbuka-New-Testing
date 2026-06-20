let pendingSalesRows=[];
let pendingSalesType='unknown';
let pendingSalesFileName='';
function renderSales(){
 const rows=state.sales.slice().reverse().map(s=>`<tr><td>${s.sale_date||''}</td><td>${escapeHtml(saleProductName(s))}</td><td>${escapeHtml(s.product_category||'')}</td><td>${s.quantity||0}</td><td>${money(s.net_revenue)}</td><td>${money(s.discount)}</td><td>${money(s.food_cost)}</td><td>${money(s.packaging_cost)}</td><td>${money(s.commission)}</td><td class="${num(s.profit)>=0?'profit':'loss'}">${money(s.profit)}</td><td>${pct(s.margin)}</td><td>${s.product_id?'Matched':'Unmatched'}</td></tr>`);
 byId('salesTable').innerHTML=table(['Date','Product','Category','Qty','Revenue','Discount','Food Cost','Packaging','Commission','Profit','Margin','Match'],rows);
}
function guessSalesType(rows){
 const keys=Object.keys(rows[0]||{}).map(k=>k.toLowerCase());
 const report=String(rows[0]?.__reportName||'').toLowerCase();
 if(report.includes('growth') || (keys.some(k=>k==='date') && keys.some(k=>k.includes('orders')) && keys.some(k=>k.includes('net sales')))) return 'day_summary';
 if(report.includes('all restaurant') || (keys.some(k=>k.includes('restaurants')) && keys.some(k=>k.includes('net sales')))) return 'restaurant_summary';
 if(keys.some(k=>k.includes('item')) && keys.some(k=>k.includes('qty'))) return 'item_sales';
 return 'unknown';
}
function salesReportHint(type){
 if(type==='item_sales') return 'Detected Item Wise / Highest Selling product report. Rows will import into product sales. If a product name does not match Khumbuka Product Master, it is still imported as unmatched revenue so you can see it and fix mapping later.';
 if(type==='day_summary') return 'Detected Growth Report: Day Wise. This will import into daily sales summary because it does not contain product names.';
 if(type==='restaurant_summary') return 'Detected All Restaurant Sales Report. This will import into restaurant sales summary because it is branch/company level, not product level.';
 return 'Unknown Petpooja report type. Map columns carefully or upload Item Wise / Highest Selling / Growth Day Wise / All Restaurant reports.';
}
async function loadSalesImportFile(){
 const file=byId('salesFile').files[0];
 if(!file) return showWarning('Select Petpooja sales file');
 pendingSalesFileName=file.name;
 pendingSalesRows=await readSheetFile(file,{allSheets:false});
 if(!pendingSalesRows.length) return showWarning('No usable rows found. Petpooja files usually have headers around row 5 or 6; this importer now tries to detect them automatically.');
 const headers=Object.keys(pendingSalesRows[0]).filter(h=>!h.startsWith('__'));
 pendingSalesType=guessSalesType(pendingSalesRows);
 const fieldMap={
  sale_date:['Date','Order Date','Bill Date'],product:['Product','Item','Item Name','ItemName','Name'],category:['Category'],code:['Code'],sap_code:['Sap Code','SAP Code'],quantity:['Quantity','Qty','Qty.'],gross_revenue:['Gross','Total (₹)','Total','Revenue','Amount','My Amount','My Amount (₹)'],discount:['Discount','Total Discount','Total Discount (₹)','Discount (₹)'],net_revenue:['Net Sales','Net Sales (₹)(M.A - D)','Net Sales (₹)(M.A - T.D)'],orders:['Orders','Total no. of bills'],restaurant:['Restaurants','Restaurant','Restaurant Name'],branch:['Branch','Outlet','Restaurant'],brand:['Brand','Restaurant Name'],total_tax:['Total Tax (₹)'],total_sales:['Total Sales (₹)','Total (₹)']
 };
 const selects=Object.entries(fieldMap).map(([field,candidates])=>{ const guessed=headers.find(h=>candidates.some(c=>compactKey(h).includes(compactKey(c)) || compactKey(c).includes(compactKey(h)))); return `<div><label>${field}</label><select id="map_${field}"><option value="">Not Available</option>${headers.map(h=>`<option ${h===guessed?'selected':''}>${escapeHtml(h)}</option>`).join('')}</select></div>`; }).join('');
 const sample=pendingSalesRows.slice(0,5).map(r=>`<tr>${headers.slice(0,6).map(h=>`<td>${escapeHtml(r[h]??'')}</td>`).join('')}</tr>`).join('');
 byId('salesMapping').innerHTML=`<div class="card"><h3>Detected Report</h3><p>${escapeHtml(salesReportHint(pendingSalesType))}</p><p class="small">Rows detected: ${pendingSalesRows.length}. Header row detected around Excel row ${pendingSalesRows[0].__headerRowIndex || '-'}.</p>${table(headers.slice(0,6),[sample])}</div><h3>Map Columns</h3><div class="grid three">${selects}</div><button class="btn-success" onclick="importSalesRows()">Import ${pendingSalesRows.length} Rows</button>`;
 showToast(`Loaded ${pendingSalesRows.length} sales rows. Map columns before importing.`);
}
function matchProductByName(name){
 const clean=String(name||'').toLowerCase().trim();
 if(!clean) return null;
 return state.products.find(x=>(x.name||'').toLowerCase().trim()===clean)
   || state.products.find(x=>clean.includes((x.name||'').toLowerCase().trim()) || (x.name||'').toLowerCase().trim().includes(clean));
}
async function importSalesRows(){
 let imported=0, skipped=0, unmatched=0;
 const issues=[];
 const addIssue=async(row,reason,name='')=>{ skipped++; const issue={rowNumber:row.__rowNumber,sheetName:row.__sheetName,reason,name,sourceFile:row.__sourceFile||pendingSalesFileName}; issues.push(issue); await saveImportRejection('sales', issue.sourceFile, issue.sheetName, issue.rowNumber, reason, row); };
 if(!pendingSalesRows.length) return showWarning('Load a sales file first.');
 for(let idx=0; idx<pendingSalesRows.length; idx++){
   const row=pendingSalesRows[idx];
   if(pendingSalesType==='day_summary'){
     const saleDate=excelSerialToDate(row[val('map_sale_date')] || pickExact(row,['Date']) || pick(row,['Date']));
     const net=num(row[val('map_net_revenue')] || pick(row,['Net Sales','Net Sales (₹)(M.A - D)']));
     const gross=num(row[val('map_gross_revenue')] || pick(row,['My Amount','My Amount (₹)']));
     const discount=num(row[val('map_discount')] || pick(row,['Discount','Discount (₹)']));
     if(!saleDate || !(net||gross)){ await addIssue(row,'Missing date or revenue in day-wise summary'); updateSalesProgress(idx+1, imported, skipped, unmatched); continue; }
     const brand=state.brands.find(b=>(b.name||'').toLowerCase()==='khumbuka') || state.brands[0];
     const branch=state.branches[0] || null;
     const saved=await dbInsert('daily_sales_summaries',{sale_date:saleDate,brand_id:brand?.id||null,branch_id:branch?.id||null,orders:num(row[val('map_orders')]||pick(row,['Orders'])),gross_revenue:gross,discount,net_revenue:net,total_tax:num(row[val('map_total_tax')]||pick(row,['Total Tax'])),total_sales:num(row[val('map_total_sales')]||pick(row,['Total'])),source_report_type:row.__reportName||'Growth Report Day Wise',restaurant_name:row.__restaurantName||'',date_range_start:row.__dateRangeStart||null,date_range_end:row.__dateRangeEnd||null,source_file:row.__sourceFile||pendingSalesFileName,source_sheet:row.__sheetName||'',row_number:row.__rowNumber||null});
     saved ? imported++ : await addIssue(row,'Supabase save failed for day-wise summary');
     updateSalesProgress(idx+1, imported, skipped, unmatched); await new Promise(requestAnimationFrame); continue;
   }
   if(pendingSalesType==='restaurant_summary'){
     const restaurant=String(row[val('map_restaurant')] || pickExact(row,['Restaurants']) || pick(row,['Restaurants','Restaurant']) || row.__restaurantName || '').trim();
     const net=num(row[val('map_net_revenue')] || pick(row,['Net Sales','Net Sales (₹)(M.A - T.D)']));
     const gross=num(row[val('map_gross_revenue')] || pick(row,['My Amount','My Amount (₹)']));
     if(!restaurant || !(net||gross)){ await addIssue(row,'Missing restaurant or revenue in restaurant summary',restaurant); updateSalesProgress(idx+1, imported, skipped, unmatched); continue; }
     const brand=state.brands.find(b=>(b.name||'').toLowerCase()==='khumbuka') || state.brands[0];
     const branch=state.branches.find(b=>(b.name||'').toLowerCase()===restaurant.toLowerCase()) || state.branches[0] || null;
     const saved=await dbInsert('restaurant_sales_summaries',{brand_id:brand?.id||null,branch_id:branch?.id||null,restaurant_name:restaurant,orders:num(row[val('map_orders')]||pick(row,['Orders','Total no. of bills'])),gross_revenue:gross,discount:num(row[val('map_discount')]||pick(row,['Total Discount','Discount'])),net_revenue:net,total_tax:num(row[val('map_total_tax')]||pick(row,['Total Tax'])),total_sales:num(row[val('map_total_sales')]||pick(row,['Total Sales','Total'])),source_report_type:row.__reportName||'All Restaurant Sales Report',date_range_start:row.__dateRangeStart||null,date_range_end:row.__dateRangeEnd||null,source_file:row.__sourceFile||pendingSalesFileName,source_sheet:row.__sheetName||'',row_number:row.__rowNumber||null});
     saved ? imported++ : await addIssue(row,'Supabase save failed for restaurant summary',restaurant);
     updateSalesProgress(idx+1, imported, skipped, unmatched); await new Promise(requestAnimationFrame); continue;
   }
   const productText=String(val('map_product') ? (row[val('map_product')]||'') : (pickExact(row,['Item']) || pick(row,['Item','Item Name','Product']))).trim();
   if(!productText){ await addIssue(row,'Missing product/item name'); updateSalesProgress(idx+1, imported, skipped, unmatched); continue; }
   const p=matchProductByName(productText);
   if(!p) unmatched++;
   const ep=p ? enrichedProduct(p) : null;
   const qty=num(row[val('map_quantity')] || pick(row,['Qty','Qty.','Quantity']))||1;
   const gross=num(row[val('map_gross_revenue')] || pick(row,['Total (₹)','Total','My Amount','Revenue']));
   const discount=num(row[val('map_discount')] || pick(row,['Discount','Total Discount'])) || 0;
   const net=(val('map_net_revenue') ? num(row[val('map_net_revenue')]) : 0) || Math.max(0,gross-discount);
   if(!net && !gross){ await addIssue(row,'Missing revenue/total',productText); updateSalesProgress(idx+1, imported, skipped, unmatched); continue; }
   const foodCost=ep ? Math.max(0,(num(ep.product_cost)-num(ep.packaging_cost))*qty) : 0;
   const packaging=ep ? num(ep.packaging_cost)*qty : 0;
   const commission=net*num(ep?.commission_percent||settings.defaultCommission)/100;
   const profit=net-foodCost-packaging-commission;
   const brand=state.brands.find(b=>(b.name||'').toLowerCase()==='khumbuka') || state.brands[0];
   const branch=state.branches[0] || null;
   const dateRaw=(val('map_sale_date') ? row[val('map_sale_date')] : '') || row.__dateRangeEnd || today();
   const saved=await dbInsert('sales',{sale_date:excelSerialToDate(dateRaw),brand_id:brand?.id||p?.brand_id||null,branch_id:branch?.id||p?.branch_id||null,product_id:p?.id||null,quantity:qty,gross_revenue:gross,discount,net_revenue:net,food_cost:foodCost,packaging_cost:packaging,commission,profit,margin:margin(profit,net),product_name_snapshot:productText,product_category:String(row[val('map_category')]||pickExact(row,['Category'])||pick(row,['Category'])||''),petpooja_code:String(row[val('map_code')]||pickExact(row,['Code'])||''),sap_code:String(row[val('map_sap_code')]||pickExact(row,['Sap Code'])||''),restaurant_name:row.__restaurantName||'',source_report_type:row.__reportName||pendingSalesType,import_status:p?'matched':'unmatched',date_range_start:row.__dateRangeStart||null,date_range_end:row.__dateRangeEnd||null,source_file:row.__sourceFile||pendingSalesFileName,source_sheet:row.__sheetName||'',row_number:row.__rowNumber||null});
   saved ? imported++ : await addIssue(row,'Supabase save failed',productText);
   updateSalesProgress(idx+1, imported, skipped, unmatched);
   await new Promise(requestAnimationFrame);
 }
 const issueRows=issues.slice(0,25).map(x=>`<tr><td>${x.rowNumber||''}</td><td>${escapeHtml(x.sheetName||'')}</td><td>${escapeHtml(x.name||'')}</td><td>${escapeHtml(x.reason)}</td></tr>`);
 const issueTable=issues.length?`<h4>Skipped / failed rows</h4>${table(['Row','Sheet','Name / Item','Reason'],issueRows)}<button class="btn-secondary" onclick='downloadCSV("sales_skipped_reasons.csv", ${JSON.stringify(issues.map(x=>({'Row':x.rowNumber||'', 'Sheet':x.sheetName||'', 'Name / Item':x.name||'', 'Reason':x.reason||'', 'Source File':x.sourceFile||''}))).replace(/'/g,"&#39;")})'>Download skipped reasons</button>`:'<p class="small">No skipped rows. Unmatched products were imported and marked as unmatched.</p>';
 byId('salesImportResults').innerHTML=`<div class="card"><h3>Import Complete</h3><p>Imported: ${imported}</p><p>Unmatched products imported: ${unmatched}</p><p>Skipped: ${skipped}</p>${issueTable}<p class="small">Unmatched product sales show revenue but no recipe cost. Add matching product names or aliases later to improve profit accuracy.</p></div>`;
 showToast(`Sales import complete. Imported ${imported}, unmatched ${unmatched}, skipped ${skipped}.`);
 await refreshAll(false); renderSales(); renderAnalytics(); renderDashboard();
}
function updateSalesProgress(processed, imported, skipped, unmatched=0){
 const total=pendingSalesRows.length||1;
 const pctDone=Math.round(processed/total*100);
 byId('salesImportResults').innerHTML=`<div class="import-progress-card"><h3>Sales import in progress</h3><p>Processed: ${processed} / ${total} (${pctDone}%)</p><div class="progress-bar"><div class="progress-fill" style="width:${pctDone}%"></div></div><p>Imported: ${imported}</p><p>Unmatched: ${unmatched}</p><p>Skipped: ${skipped}</p></div>`;
}

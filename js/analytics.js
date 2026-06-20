function groupSum(rows,keyFn,valFn){ const m={}; rows.forEach(r=>{ const k=keyFn(r)||'Unknown'; m[k]=(m[k]||0)+valFn(r); }); return Object.entries(m).sort((a,b)=>b[1]-a[1]); }
function miniBar(rows, formatter=money){
 if(!rows.length) return '<p class="muted">No data for selected filters.</p>';
 const max=Math.max(...rows.map(x=>Math.abs(x[1])),1);
 return rows.slice(0,12).map(([label,value])=>`<div class="metric-bar"><div class="stat-row"><span>${escapeHtml(label)}</span><strong>${formatter(value)}</strong></div><div class="progress-bar"><div class="progress-fill" style="width:${Math.abs(value)/max*100}%"></div></div></div>`).join('');
}
function analyticsFilters(){ return {start:val('analyticsStartDate'),end:val('analyticsEndDate'),branch_id:val('analyticsBranchFilter'),product_id:val('analyticsProductFilter')}; }
function filteredSales(filter=analyticsFilters()){
 return state.sales.filter(s=>inDateRange(s.sale_date,filter.start,filter.end)&&(!filter.branch_id||s.branch_id===filter.branch_id)&&(!filter.product_id||s.product_id===filter.product_id));
}
function filteredExpenses(filter=analyticsFilters()){
 return state.expenses.filter(e=>inDateRange(e.expense_date,filter.start,filter.end)&&(!filter.branch_id||e.branch_id===filter.branch_id));
}
function dashboardMetrics(filter={}){
 let sales=state.sales, expenses=state.expenses;
 if(filter.start||filter.end){ sales=sales.filter(x=>inDateRange(x.sale_date,filter.start,filter.end)); expenses=expenses.filter(x=>inDateRange(x.expense_date,filter.start,filter.end)); }
 if(filter.brand_id){ sales=sales.filter(x=>x.brand_id===filter.brand_id); expenses=expenses.filter(x=>x.brand_id===filter.brand_id); }
 if(filter.branch_id){ sales=sales.filter(x=>x.branch_id===filter.branch_id); expenses=expenses.filter(x=>x.branch_id===filter.branch_id); }
 const revenue=sales.reduce((a,b)=>a+num(b.net_revenue),0);
 const grossProfit=sales.reduce((a,b)=>a+num(b.profit),0);
 const expense=expenses.reduce((a,b)=>a+num(b.amount),0);
 const netProfit=grossProfit-expense;
 const foodCost=sales.reduce((a,b)=>a+num(b.food_cost),0);
 const packaging=sales.reduce((a,b)=>a+num(b.packaging_cost),0);
 const commission=sales.reduce((a,b)=>a+num(b.commission),0);
 const discount=sales.reduce((a,b)=>a+num(b.discount),0);
 const quantity=sales.reduce((a,b)=>a+num(b.quantity),0);
 return {revenue,expense,grossProfit,netProfit,netMargin:margin(netProfit,revenue),foodCost,packaging,commission,discount,quantity};
}
function setDefaultAnalyticsDates(){
 if(!byId('analyticsStartDate')) return;
 if(!val('analyticsStartDate')) setVal('analyticsStartDate', startOfCurrentMonth());
 if(!val('analyticsEndDate')) setVal('analyticsEndDate', today());
}
function resetAnalyticsFilters(){ setVal('analyticsStartDate',''); setVal('analyticsEndDate',''); setVal('analyticsBranchFilter',''); setVal('analyticsProductFilter',''); renderAnalytics(); }
function renderAnalytics(){
 if(!byId('analyticsKPIs')) return;
 setDefaultAnalyticsDates();
 setSelectOptions('analyticsBranchFilter', state.branches, val('analyticsBranchFilter'), 'All Branches');
 setSelectOptions('analyticsProductFilter', state.products, val('analyticsProductFilter'), 'All Products');
 const filter=analyticsFilters();
 const sales=filteredSales(filter);
 const expenses=filteredExpenses(filter);
 const revenue=sales.reduce((a,b)=>a+num(b.net_revenue),0);
 const grossProfit=sales.reduce((a,b)=>a+num(b.profit),0);
 const expenseTotal=expenses.reduce((a,b)=>a+num(b.amount),0);
 const netProfit=grossProfit-expenseTotal;
 const foodCost=sales.reduce((a,b)=>a+num(b.food_cost),0);
 const packaging=sales.reduce((a,b)=>a+num(b.packaging_cost),0);
 const commission=sales.reduce((a,b)=>a+num(b.commission),0);
 const discount=sales.reduce((a,b)=>a+num(b.discount),0);
 const qty=sales.reduce((a,b)=>a+num(b.quantity),0);
 const unmatched=sales.filter(s=>!s.product_id).length;
 const topRevenue=groupSum(sales,s=>saleProductName(s),s=>num(s.net_revenue))[0];
 const topProfit=groupSum(sales,s=>saleProductName(s),s=>num(s.profit))[0];
 const productMarginRows=groupSum(sales,s=>saleProductName(s),s=>num(s.net_revenue)).map(([name,rev])=>{ const profit=sales.filter(s=>saleProductName(s)===name).reduce((a,b)=>a+num(b.profit),0); return [name, margin(profit,rev), profit, rev]; }).sort((a,b)=>b[1]-a[1]);
 byId('analyticsKPIs').innerHTML=kpi('Revenue',money(revenue))+kpi('Gross Profit',money(grossProfit),grossProfit>=0?'good':'bad')+kpi('Expenses',money(expenseTotal),'bad')+kpi('Net Profit',money(netProfit),netProfit>=0?'good':'bad')+kpi('Net Margin',pct(margin(netProfit,revenue)))+kpi('Food Cost',money(foodCost))+kpi('Commission',money(commission))+kpi('Discounts',money(discount));
 byId('analyticsSecondaryKPIs') && (byId('analyticsSecondaryKPIs').innerHTML=kpi('Qty Sold',qty.toFixed(0))+kpi('Packaging Cost',money(packaging))+kpi('Top Revenue Product',topRevenue?.[0]||'-')+kpi('Unmatched Sales Rows',unmatched,unmatched?'bad':''));
 byId('revenueByProduct').innerHTML=miniBar(groupSum(sales,s=>saleProductName(s),s=>num(s.net_revenue)));
 byId('profitByProduct').innerHTML=miniBar(groupSum(sales,s=>saleProductName(s),s=>num(s.profit)));
 byId('revenueByBranch') && (byId('revenueByBranch').innerHTML=miniBar(groupSum(sales,s=>branchName(s.branch_id)||'Main / Unknown',s=>num(s.net_revenue))));
 byId('expenseByCategory') && (byId('expenseByCategory').innerHTML=miniBar(groupSum(expenses,e=>e.category||'Miscellaneous',e=>num(e.amount))));
 byId('dailyTrend') && (byId('dailyTrend').innerHTML=table(['Date','Revenue','Gross Profit','Expenses','Net Profit'],buildDailyTrendRows(sales,expenses)));
 byId('highestMarginProducts').innerHTML=table(['Product','Margin','Profit','Revenue'],productMarginRows.slice(0,10).map(p=>`<tr><td>${escapeHtml(p[0])}</td><td>${pct(p[1])}</td><td>${money(p[2])}</td><td>${money(p[3])}</td></tr>`));
 byId('lowestMarginProducts').innerHTML=table(['Product','Margin','Profit','Revenue'],productMarginRows.slice().reverse().slice(0,10).map(p=>`<tr><td>${escapeHtml(p[0])}</td><td>${pct(p[1])}</td><td>${money(p[2])}</td><td>${money(p[3])}</td></tr>`));
 byId('unmatchedSales') && (byId('unmatchedSales').innerHTML=table(['Product Name','Rows','Revenue'],groupSum(sales.filter(s=>!s.product_id),s=>s.product_name_snapshot||'Unknown',s=>1).map(([name,count])=>{ const rev=sales.filter(s=>!s.product_id && (s.product_name_snapshot||'Unknown')===name).reduce((a,b)=>a+num(b.net_revenue),0); return `<tr><td>${escapeHtml(name)}</td><td>${count}</td><td>${money(rev)}</td></tr>`; })));
}
function buildDailyTrendRows(sales,expenses){
 const dates=uniqueCleanValues([...sales.map(s=>s.sale_date),...expenses.map(e=>e.expense_date)]).sort();
 return dates.map(d=>{ const s=sales.filter(x=>x.sale_date===d); const e=expenses.filter(x=>x.expense_date===d); const revenue=s.reduce((a,b)=>a+num(b.net_revenue),0); const gp=s.reduce((a,b)=>a+num(b.profit),0); const exp=e.reduce((a,b)=>a+num(b.amount),0); return `<tr><td>${d}</td><td>${money(revenue)}</td><td>${money(gp)}</td><td>${money(exp)}</td><td class="${gp-exp>=0?'profit':'loss'}">${money(gp-exp)}</td></tr>`; });
}
function renderDashboard(){
 const m=dashboardMetrics();
 byId('dashboardKPIs').innerHTML=kpi('Total Revenue',money(m.revenue))+kpi('Total Expenses',money(m.expense),'bad')+kpi('Net Profit',money(m.netProfit),m.netProfit>=0?'good':'bad')+kpi('Net Margin',pct(m.netMargin));
 byId('brandDashboard').innerHTML=table(['Company','Revenue','Expenses','Profit','Margin'],state.brands.map(b=>{ const x=dashboardMetrics({brand_id:b.id}); return `<tr><td>${escapeHtml(b.name)}</td><td>${money(x.revenue)}</td><td>${money(x.expense)}</td><td class="${x.netProfit>=0?'profit':'loss'}">${money(x.netProfit)}</td><td>${pct(x.netMargin)}</td></tr>`;}));
 byId('branchDashboard').innerHTML=table(['Branch','Revenue','Expenses','Profit','Margin'],state.branches.map(b=>{ const x=dashboardMetrics({branch_id:b.id}); return `<tr><td>${escapeHtml(b.name)}</td><td>${money(x.revenue)}</td><td>${money(x.expense)}</td><td class="${x.netProfit>=0?'profit':'loss'}">${money(x.netProfit)}</td><td>${pct(x.netMargin)}</td></tr>`;}));
 const prods=state.products.map(enrichedProduct).sort((a,b)=>b.online_profit-a.online_profit).slice(0,10);
 byId('dashboardProductTable').innerHTML=renderDashboardProductSnapshot(prods);
}
function renderDashboardProductSnapshot(prods){
 if(!prods.length) return '<p class="muted">No products yet. Add or import products to see profitability.</p>';
 const rows=prods.map(p=>`
  <tr>
   <td class="snapshot-product-cell"><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.category||'Uncategorized')}${p.branch_id?` · ${escapeHtml(branchName(p.branch_id)||'')}`:''}</span></td>
   <td>${money(p.product_cost)}</td>
   <td>${money(p.online_price)}</td>
   <td class="${p.online_profit>=0?'profit':'loss'}">${money(p.online_profit)}</td>
   <td>${pct(p.online_margin)}</td>
  </tr>`).join('');
 return `<div class="table-scroll dashboard-snapshot-scroll"><table class="data-table dashboard-profitability-table">
  <colgroup><col class="snapshot-col-product"><col class="snapshot-col-number"><col class="snapshot-col-number"><col class="snapshot-col-number"><col class="snapshot-col-margin"></colgroup>
  <thead><tr><th>Product</th><th>Cost</th><th>Online</th><th>Profit</th><th>Margin</th></tr></thead>
  <tbody>${rows}</tbody>
 </table></div>`;
}

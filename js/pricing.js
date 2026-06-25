function renderPricingProductSelector(){
 const el=byId('pricingProductSelect');
 if(!el) return;
 const current=el.value;
 el.innerHTML='<option value="">Manual pricing</option>'+(state.products||[]).map(p=>`<option value="${p.id}" ${p.id===current?'selected':''}>${escapeHtml(p.name)}${p.category?` · ${escapeHtml(p.category)}`:''}</option>`).join('');
 if(current) el.value=current;
 togglePricingTargetInputs();
}
function togglePricingTargetInputs(){
 const mode=val('pricingTargetMode')||'offline_profit';
 const profitWrap=byId('pricingDesiredProfitWrap');
 const marginWrap=byId('pricingDesiredMarginWrap');
 if(profitWrap) profitWrap.style.display = mode==='profit_amount' ? '' : 'none';
 if(marginWrap) marginWrap.style.display = mode==='margin_percent' ? '' : 'none';
}
function loadPricingProduct(){
 const id=val('pricingProductSelect');
 if(!id) return;
 const p=enrichedProduct(state.products.find(x=>x.id===id)||{});
 setVal('pricingProductCost', p.recipe_cost || p.product_cost || 0);
 setVal('pricingPackagingCost', p.packaging_cost || 0);
 setVal('pricingOfflinePrice', p.offline_price || 0);
 setVal('pricingManualOnlinePrice', p.online_price || 0);
 setVal('pricingCommission', p.commission_percent || settings.defaultCommission || 35);
 setVal('pricingGST', settings.defaultGST || 5);
 showToast('Product values loaded into pricing engine.');
}
function roundUpTo(n, step=1){
 n=Number(n)||0; step=Number(step)||1;
 return Math.ceil(n/step)*step;
}
function calculateDiscountForPrice(price, type, value, cap){
 price=num(price); value=num(value); cap=num(cap);
 if(type==='flat') return Math.min(price,value);
 if(type==='percent') return Math.min(price, price*value/100);
 if(type==='percent_cap') return Math.min(price, Math.min(price*value/100, cap || Infinity));
 return 0;
}
function solveMenuPriceFromFinal(finalCustomerPays, type, value, cap){
 finalCustomerPays=Math.max(0,num(finalCustomerPays));
 value=num(value); cap=num(cap);
 if(type==='flat') return finalCustomerPays + value;
 if(type==='percent'){
  const rate=Math.min(value/100,0.95);
  return finalCustomerPays / Math.max(0.01, 1-rate);
 }
 if(type==='percent_cap'){
  const rate=Math.min(value/100,0.95);
  if(rate<=0) return finalCustomerPays;
  const uncappedPrice=finalCustomerPays / Math.max(0.01, 1-rate);
  if(uncappedPrice*rate <= (cap || Infinity)) return uncappedPrice;
  return finalCustomerPays + (cap || 0);
 }
 return finalCustomerPays;
}
function onlineProfitForMenuPrice(menuPrice, totalCost, commissionRate, gstRate, type, value, cap){
 const discount=calculateDiscountForPrice(menuPrice,type,value,cap);
 const customerPays=Math.max(0,menuPrice-discount);
 const taxableRevenue=customerPays/Math.max(0.01,1+gstRate);
 const commission=taxableRevenue*commissionRate;
 const gst=customerPays-taxableRevenue;
 const profit=taxableRevenue-commission-totalCost;
 return {menuPrice,discount,customerPays,taxableRevenue,commission,gst,profit,margin:margin(profit,taxableRevenue)};
}
function pricingTargetDetails(totalCost, offlinePrice, commissionRate, gstRate){
 const mode=val('pricingTargetMode')||'offline_profit';
 let targetProfit=0;
 let targetMargin=null;
 let targetLabel='Match Offline Profit';
 let offlineTaxable=offlinePrice>0 ? offlinePrice/Math.max(0.01,1+gstRate) : 0;
 let offlineGst=offlinePrice>0 ? offlinePrice-offlineTaxable : 0;
 let offlineProfit=offlinePrice>0 ? offlineTaxable-totalCost : null;
 let offlineMargin=offlineTaxable>0 ? margin(offlineProfit,offlineTaxable) : null;
 if(mode==='offline_profit'){
  if(offlinePrice<=0) return {error:'Enter offline selling price, or switch Pricing Target to Desired Profit / Desired Margin.'};
  targetProfit=offlineProfit;
  targetLabel='Match Offline Profit';
 }
 if(mode==='profit_amount'){
  targetProfit=num(val('pricingDesiredProfit'));
  if(targetProfit<0) return {error:'Desired profit cannot be negative.'};
  targetLabel=`Desired Profit ${money(targetProfit)}`;
 }
 if(mode==='margin_percent'){
  targetMargin=num(val('pricingDesiredMargin'))/100;
  if(targetMargin<=0) return {error:'Enter desired margin percentage above 0.'};
  const maxMargin=Math.max(0,1-commissionRate);
  if(targetMargin>=maxMargin) return {error:`Desired margin is too high for ${pct(commissionRate*100)} commission. Maximum possible before product cost is below ${pct(maxMargin*100)}.`};
  const requiredTaxable=totalCost/Math.max(0.01,(1-commissionRate)-targetMargin);
  targetProfit=requiredTaxable*targetMargin;
  targetLabel=`Desired Margin ${pct(targetMargin*100)}`;
 }
 return {mode,targetProfit,targetMargin,targetLabel,offlineTaxable,offlineGst,offlineProfit,offlineMargin};
}
function calculatePricing(){
 const productCost=num(val('pricingProductCost'));
 const packaging=num(val('pricingPackagingCost'));
 const totalCost=productCost+packaging;
 const offlinePrice=num(val('pricingOfflinePrice'));
 const commissionRate=num(val('pricingCommission'))/100;
 const gstRate=num(val('pricingGST'))/100;
 const discountType=val('pricingDiscountType')||'none';
 const discountValue=num(val('pricingDiscountValue'));
 const discountCap=num(val('pricingDiscountCap'));
 if(totalCost<=0) return showWarning('Enter product cost and/or packaging cost.');
 if(commissionRate>=0.95) return showWarning('Commission is too high. Use a value below 95%.');
 const target=pricingTargetDetails(totalCost,offlinePrice,commissionRate,gstRate);
 if(target.error) return showWarning(target.error);
 const requiredFinalCustomerPays=((target.targetProfit+totalCost)/Math.max(0.01,1-commissionRate))*(1+gstRate);
 const exactMenuPrice=solveMenuPriceFromFinal(requiredFinalCustomerPays,discountType,discountValue,discountCap);
 const roundedMenuPrice=roundUpTo(exactMenuPrice,1);
 const roundedMenuPrice5=roundUpTo(exactMenuPrice,5);
 const exact=onlineProfitForMenuPrice(exactMenuPrice,totalCost,commissionRate,gstRate,discountType,discountValue,discountCap);
 const rounded=onlineProfitForMenuPrice(roundedMenuPrice,totalCost,commissionRate,gstRate,discountType,discountValue,discountCap);
 const rounded5=onlineProfitForMenuPrice(roundedMenuPrice5,totalCost,commissionRate,gstRate,discountType,discountValue,discountCap);
 const profitDiff=rounded.profit-target.targetProfit;
 const marginDiff=target.targetMargin===null ? null : rounded.margin-(target.targetMargin*100);
 const offlineBlock = target.offlineProfit===null ? `<p class="small muted">Offline price is optional for Desired Profit / Desired Margin mode.</p>` : `<div><h4>Offline Reference</h4><div class="stat-row"><span>Offline Selling Price</span><strong>${money(offlinePrice)}</strong></div><div class="stat-row"><span>Taxable Revenue</span><strong>${money(target.offlineTaxable)}</strong></div><div class="stat-row"><span>GST Portion</span><strong>${money(target.offlineGst)}</strong></div><div class="stat-row"><span>Total Cost</span><strong>${money(totalCost)}</strong></div><div class="stat-row"><span>Offline Profit</span><strong class="${target.offlineProfit>=0?'profit':'loss'}">${money(target.offlineProfit)}</strong></div><div class="stat-row"><span>Offline Margin</span><strong>${pct(target.offlineMargin)}</strong></div></div>`;
 byId('pricingOutput').innerHTML=`<div class="result-card pricing-result-card">
  <h3>Target Online Price Recommendation</h3>
  <p class="small">Logic: The engine solves the online menu price needed to hit your selected target after discount, GST and commission.</p>
  <div class="pricing-summary-grid">
   <div class="price-tile"><span>Total Product Cost</span><strong>${money(totalCost)}</strong><small>Product cost + packaging</small></div>
   <div class="price-tile"><span>Pricing Target</span><strong class="${target.targetProfit>=0?'profit':'loss'}">${target.targetLabel}</strong><small>Target profit: ${money(target.targetProfit)}</small></div>
   <div class="price-tile recommended"><span>Suggested Online Menu Price</span><strong>${money(roundedMenuPrice)}</strong><small>Rounded to nearest ₹1</small></div>
   <div class="price-tile"><span>Suggested Round Price</span><strong>${money(roundedMenuPrice5)}</strong><small>Rounded to nearest ₹5</small></div>
  </div>
  <div class="two-col">
   ${offlineBlock}
   <div><h4>Online Sale at ${money(roundedMenuPrice)}</h4><div class="stat-row"><span>Customer Pays After Discount</span><strong>${money(rounded.customerPays)}</strong></div><div class="stat-row"><span>Discount</span><strong>${money(rounded.discount)}</strong></div><div class="stat-row"><span>Taxable Revenue</span><strong>${money(rounded.taxableRevenue)}</strong></div><div class="stat-row"><span>Commission</span><strong>${money(rounded.commission)}</strong></div><div class="stat-row"><span>GST Portion</span><strong>${money(rounded.gst)}</strong></div><div class="stat-row"><span>Online Profit</span><strong class="${rounded.profit>=target.targetProfit?'profit':'loss'}">${money(rounded.profit)}</strong></div><div class="stat-row"><span>Profit Difference vs Target</span><strong class="${profitDiff>=0?'profit':'loss'}">${money(profitDiff)}</strong></div>${marginDiff===null?'':`<div class="stat-row"><span>Margin Difference vs Target</span><strong class="${marginDiff>=0?'profit':'loss'}">${pct(marginDiff)}</strong></div>`}</div>
  </div>
  <div class="table-scroll"><table class="data-table structured-table compact-table"><thead><tr><th>Scenario</th><th>Menu Price</th><th>Discount</th><th>Customer Pays</th><th>Commission</th><th>Profit</th><th>Margin</th><th>Diff vs Target</th></tr></thead><tbody>
   <tr><td>Exact mathematical price</td><td>${money(exact.menuPrice)}</td><td>${money(exact.discount)}</td><td>${money(exact.customerPays)}</td><td>${money(exact.commission)}</td><td>${money(exact.profit)}</td><td>${pct(exact.margin)}</td><td>${money(exact.profit-target.targetProfit)}</td></tr>
   <tr><td>Rounded ₹1</td><td>${money(rounded.menuPrice)}</td><td>${money(rounded.discount)}</td><td>${money(rounded.customerPays)}</td><td>${money(rounded.commission)}</td><td>${money(rounded.profit)}</td><td>${pct(rounded.margin)}</td><td>${money(rounded.profit-target.targetProfit)}</td></tr>
   <tr><td>Rounded ₹5</td><td>${money(rounded5.menuPrice)}</td><td>${money(rounded5.discount)}</td><td>${money(rounded5.customerPays)}</td><td>${money(rounded5.commission)}</td><td>${money(rounded5.profit)}</td><td>${pct(rounded5.margin)}</td><td>${money(rounded5.profit-target.targetProfit)}</td></tr>
  </tbody></table></div>
 </div>`;
}

function calculateEnteredOnlinePrice(){
 const productCost=num(val('pricingProductCost'));
 const packaging=num(val('pricingPackagingCost'));
 const totalCost=productCost+packaging;
 const menuPrice=num(val('pricingManualOnlinePrice'));
 const offlinePrice=num(val('pricingOfflinePrice'));
 const commissionRate=num(val('pricingCommission'))/100;
 const gstRate=num(val('pricingGST'))/100;
 const discountType=val('pricingDiscountType')||'none';
 const discountValue=num(val('pricingDiscountValue'));
 const discountCap=num(val('pricingDiscountCap'));
 if(totalCost<=0) return showWarning('Enter product cost and/or packaging cost first.');
 if(menuPrice<=0) return showWarning('Enter the online menu price you want to check.');
 if(commissionRate>=0.95) return showWarning('Commission is too high. Use a value below 95%.');
 const result=onlineProfitForMenuPrice(menuPrice,totalCost,commissionRate,gstRate,discountType,discountValue,discountCap);
 const offlineTaxable=offlinePrice>0 ? offlinePrice/Math.max(0.01,1+gstRate) : 0;
 const offlineProfit=offlinePrice>0 ? offlineTaxable-totalCost : null;
 const diff = offlineProfit===null ? null : result.profit-offlineProfit;
 byId('pricingManualOutput').innerHTML=`<div class="result-card pricing-result-card compact-result">
  <h3>Estimated Online Profit at ${money(menuPrice)}</h3>
  <div class="pricing-summary-grid">
   <div class="price-tile"><span>Customer Pays</span><strong>${money(result.customerPays)}</strong><small>After discount</small></div>
   <div class="price-tile"><span>Commission</span><strong>${money(result.commission)}</strong><small>${pct(commissionRate*100)} of pre-GST revenue</small></div>
   <div class="price-tile"><span>GST Portion</span><strong>${money(result.gst)}</strong><small>Removed from customer price</small></div>
   <div class="price-tile recommended"><span>Estimated Profit</span><strong class="${result.profit>=0?'profit':'loss'}">${money(result.profit)}</strong><small>${pct(result.margin)} margin</small></div>
  </div>
  <div class="table-scroll"><table class="data-table structured-table compact-table"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
   <tr><td>Online menu price</td><td>${money(result.menuPrice)}</td></tr>
   <tr><td>Discount</td><td>${money(result.discount)}</td></tr>
   <tr><td>Customer pays after discount</td><td>${money(result.customerPays)}</td></tr>
   <tr><td>Taxable revenue before GST</td><td>${money(result.taxableRevenue)}</td></tr>
   <tr><td>GST portion</td><td>${money(result.gst)}</td></tr>
   <tr><td>Commission</td><td>${money(result.commission)}</td></tr>
   <tr><td>Total product cost</td><td>${money(totalCost)}</td></tr>
   <tr><td>Estimated profit</td><td><strong class="${result.profit>=0?'profit':'loss'}">${money(result.profit)}</strong></td></tr>
   <tr><td>Estimated margin</td><td>${pct(result.margin)}</td></tr>
   ${offlineProfit===null?'':`<tr><td>Offline profit target</td><td>${money(offlineProfit)}</td></tr><tr><td>Difference vs offline profit</td><td><strong class="${diff>=0?'profit':'loss'}">${money(diff)}</strong></td></tr>`}
  </tbody></table></div>
 </div>`;
}

function calculateDiscountEngine(){
 const price=num(val('discountPrice')), cost=num(val('discountCost')), commissionRate=num(val('discountCommission'))/100;
 const type=val('discountType'), value=num(val('discountValue')), cap=num(val('discountCap'));
 const discount=calculateDiscountForPrice(price,type,value,cap);
 const finalPrice=Math.max(0,price-discount);
 const commission=finalPrice*commissionRate;
 const profit=finalPrice-cost-commission;
 byId('discountOutput').innerHTML=`<div class="result-card"><h3>Discount Impact</h3><div class="stat-row"><span>Final Selling Price</span><strong>${money(finalPrice)}</strong></div><div class="stat-row"><span>Discount</span><strong>${money(discount)}</strong></div><div class="stat-row"><span>Commission</span><strong>${money(commission)}</strong></div><div class="stat-row"><span>Profit</span><strong class="${profit>=0?'profit':'loss'}">${money(profit)}</strong></div><div class="stat-row"><span>Margin</span><strong>${pct(margin(profit,finalPrice))}</strong></div></div>`;
}

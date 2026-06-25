/* Khumbuka Cost Audit Engine
   Phase 1: shared costing + warnings logic for Product page mini-audit and future Cost Audit tab.
   This file intentionally has no UI. It exposes reusable functions on window.KhumbukaCostAudit.
*/
(function(){
  function n(value){
    if(typeof num==='function') return num(value);
    const parsed=Number(String(value ?? '').replace(/[^0-9.-]/g,''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function pctValue(value,total){ return total ? (n(value)/n(total))*100 : 0; }
  function m(profit,revenue){ return typeof margin==='function' ? margin(profit,revenue) : pctValue(profit,revenue); }
  function inr(value){ return typeof money==='function' ? money(value) : `₹${n(value).toFixed(2)}`; }
  function esc(value){ return typeof escapeHtml==='function' ? escapeHtml(value) : String(value ?? ''); }
  function same(a,b){ return String(a||'')===String(b||''); }
  function appState(){
    try{ if(typeof state !== 'undefined') return state; }catch(e){}
    return window.state || {};
  }
  function appSettings(){
    try{ if(typeof settings !== 'undefined') return settings; }catch(e){}
    return window.settings || {};
  }
  function productById(productOrId){
    if(productOrId && typeof productOrId==='object') return productOrId;
    return (appState().products||[]).find(p=>same(p.id,productOrId)) || null;
  }
  function recipeById(id){ return (appState().recipes||[]).find(r=>same(r.id,id)) || null; }
  function ingredientById(id){ return (appState().ingredients||[]).find(i=>same(i.id,id)) || null; }
  function branchById(id){ return (appState().branches||[]).find(b=>same(b.id,id)) || null; }

  function auditProductComponents(productId){
    return (appState().productComponents||[])
      .filter(c=>same(c.product_id,productId))
      .slice()
      .sort((a,b)=>(n(a.sort_order)-n(b.sort_order)) || String(a.created_at||'').localeCompare(String(b.created_at||'')) || String(a.id||'').localeCompare(String(b.id||'')));
  }
  function auditLegacyProductRecipes(productId){
    return (appState().productRecipes||[])
      .filter(x=>same(x.product_id,productId))
      .slice()
      .sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||'')) || String(a.id||'').localeCompare(String(b.id||'')));
  }

  function auditRecipeItems(recipeId){ return (window.state?.recipeItems||[]).filter(x=>same(x.recipe_id,recipeId)); }

  function auditRecipeCost(recipe){
    if(!recipe) return 0;
    if(typeof recipeTotalCost==='function') return recipeTotalCost(recipe.id);
    return auditRecipeItems(recipe.id).reduce((sum,item)=>sum+auditIngredientComponentCost({ingredient_id:item.ingredient_id,quantity:item.quantity,unit:item.unit,waste_percent:item.waste_percent}),0);
  }
  function auditRecipeYieldBase(recipe){
    if(!recipe) return 0;
    if(typeof recipeBaseYield==='function') return recipeBaseYield(recipe);
    if(typeof recipeBaseQty==='function') return recipeBaseQty(recipe.yield_quantity, recipe.yield_unit);
    return n(recipe.yield_quantity);
  }
  function auditRecipeUnitCost(recipe){
    if(!recipe) return 0;
    if(typeof recipeUnitCost==='function') return recipeUnitCost(recipe);
    const y=auditRecipeYieldBase(recipe);
    return y ? auditRecipeCost(recipe)/y : 0;
  }
  function auditRecipeCostForQuantity(recipe,qty,unit){
    if(!recipe) return 0;
    if(typeof recipeCostForQuantity==='function') return recipeCostForQuantity(recipe,qty,unit||recipe.yield_unit);
    const baseQty=typeof recipeBaseQty==='function' ? recipeBaseQty(qty,unit||recipe.yield_unit) : n(qty);
    return auditRecipeUnitCost(recipe)*baseQty;
  }
  function auditIngredientUnitCost(ingredient){
    if(!ingredient) return 0;
    if(typeof ingredientCostPerConsumptionUnit==='function') return ingredientCostPerConsumptionUnit(ingredient);
    if(typeof effectiveCost==='function') return effectiveCost(ingredient.purchase_price, ingredient.wastage_percent);
    const conversion=n(ingredient.conversion_quantity)||1;
    return conversion ? n(ingredient.purchase_price)/conversion : n(ingredient.purchase_price);
  }
  function auditIngredientComponentCost(component){
    const ingredient=ingredientById(component.ingredient_id);
    if(!ingredient) return 0;
    const unit=component.unit || ingredient.consumption_unit || ingredient.purchase_unit || 'g';
    const qtyInConsumption = typeof convertRecipeQuantity==='function'
      ? convertRecipeQuantity(component.quantity,unit,ingredient.consumption_unit||unit)
      : n(component.quantity);
    const recipeWasteFactor=1+(n(component.waste_percent)/100);
    return auditIngredientUnitCost(ingredient)*qtyInConsumption*recipeWasteFactor;
  }
  function componentSourceName(component){
    if(component.recipe_id) return recipeById(component.recipe_id)?.name || 'Missing Recipe';
    if(component.ingredient_id) return ingredientById(component.ingredient_id)?.name || 'Missing Ingredient';
    if(component.component_type==='fixed_cost') return 'Fixed Cost';
    return component.component_name || component.component_type || 'Component';
  }
  function componentRate(component,cost){
    if(component.component_type==='fixed_cost') return n(component.fixed_cost);
    const qty=n(component.quantity);
    return qty ? cost/qty : 0;
  }
  function componentWarnings(component){
    const warnings=[];
    if(!component.component_type) warnings.push('Missing component type.');
    if(component.component_type==='recipe' || component.recipe_id){
      const recipe=recipeById(component.recipe_id);
      if(!component.recipe_id) warnings.push('Recipe not selected.');
      if(component.recipe_id && !recipe) warnings.push('Recipe missing from Recipe Master.');
      if(recipe && !auditRecipeItems(recipe.id).length) warnings.push('Recipe has no ingredients.');
      if(recipe && auditRecipeCost(recipe)<=0) warnings.push('Recipe cost is zero.');
      if(n(component.quantity)<=0) warnings.push('Quantity is missing or zero.');
      if(!component.unit) warnings.push('Unit is missing.');
    }else if(component.component_type==='ingredient' || component.ingredient_id){
      const ingredient=ingredientById(component.ingredient_id);
      if(!component.ingredient_id) warnings.push('Ingredient not selected.');
      if(component.ingredient_id && !ingredient) warnings.push('Ingredient missing from Ingredient Master.');
      if(ingredient && n(ingredient.purchase_price)<=0) warnings.push('Ingredient purchase price is missing.');
      if(ingredient && !ingredient.consumption_unit) warnings.push('Ingredient consumption unit is missing.');
      if(n(component.quantity)<=0) warnings.push('Quantity is missing or zero.');
      if(!component.unit) warnings.push('Unit is missing.');
    }else if(component.component_type==='fixed_cost'){
      if(n(component.fixed_cost)<=0) warnings.push('Fixed cost is missing or zero.');
    }
    return warnings;
  }
  function legacyComponentBreakdown(productId){
    return auditLegacyProductRecipes(productId).map(link=>{
      const recipe=recipeById(link.recipe_id);
      const cost=recipe ? auditRecipeCostForQuantity(recipe,link.quantity_used,link.unit) : 0;
      const warnings=[];
      if(!recipe) warnings.push('Legacy recipe link points to missing recipe.');
      if(recipe && auditRecipeCost(recipe)<=0) warnings.push('Linked recipe cost is zero.');
      if(n(link.quantity_used)<=0) warnings.push('Quantity used is missing or zero.');
      return {
        id:link.id,
        source:'legacy_product_recipes',
        component_type:'legacy_recipe',
        component_name:recipe?.name || 'Missing Recipe',
        source_name:recipe?.name || 'Missing Recipe',
        quantity:n(link.quantity_used),
        unit:link.unit || recipe?.yield_unit || '',
        rate:n(link.quantity_used) ? cost/n(link.quantity_used) : 0,
        cost,
        warnings,
        raw:link
      };
    });
  }
  function componentBreakdown(productOrId,options={}){
    const product=productById(productOrId);
    if(!product) return [];
    const components=auditProductComponents(product.id);
    if(components.length){
      return components.map(c=>{
        const cost=c.component_type==='fixed_cost' ? n(c.fixed_cost) : c.recipe_id ? auditRecipeCostForQuantity(recipeById(c.recipe_id),c.quantity,c.unit) : c.ingredient_id ? auditIngredientComponentCost(c) : 0;
        return {
          id:c.id,
          source:'product_components',
          component_type:c.component_type || '',
          component_name:c.component_name || componentSourceName(c),
          component_role:c.component_role || c.role || '',
          source_name:componentSourceName(c),
          quantity:n(c.quantity),
          unit:c.unit || '',
          quantity_mode:c.quantity_mode || '',
          rate:componentRate(c,cost),
          cost,
          warnings:componentWarnings(c),
          raw:c
        };
      });
    }
    const legacy=legacyComponentBreakdown(product.id);
    if(legacy.length || options.includeLegacy===true) return legacy;
    return [];
  }
  function productWarnings(product,breakdown,meta){
    const warnings=[];
    if(!product) return ['Product not found.'];
    const componentRows=auditProductComponents(product.id);
    const legacyRows=auditLegacyProductRecipes(product.id);
    const manual=n(product.manual_product_cost || product.product_cost);
    if(manual>0 && componentRows.length) warnings.push('Manual product cost override is active; component cost is not used.');
    if(manual>0 && !componentRows.length && !legacyRows.length) warnings.push('Product uses manual cost only.');
    if(!manual && !componentRows.length && !legacyRows.length) warnings.push('No product components or recipe links added.');
    if(componentRows.length && legacyRows.length) warnings.push('Product has both new components and old recipe links; new components are used.');
    if(componentRows.length && n(product.packaging_cost)>0) warnings.push('Packaging cost field exists but new product components are used; confirm packaging is not missed or double-counted elsewhere.');
    if(n(product.offline_price)<=0) warnings.push('Offline price is missing.');
    if(n(product.online_price)<=0) warnings.push('Online price is missing.');
    if(n(product.commission_percent||appSettings().defaultCommission)<=0) warnings.push('Commission percent is missing.');
    breakdown.forEach(row=>row.warnings.forEach(w=>warnings.push(`${row.component_name}: ${w}`)));
    if(meta.componentCost<=0 && manual<=0) warnings.push('Calculated product cost is zero.');
    return [...new Set(warnings)];
  }
  function calculateProductAudit(productOrId,options={}){
    const product=productById(productOrId);
    if(!product){ return {product:null, found:false, warnings:['Product not found.'], breakdown:[], total_cost:0}; }
    const breakdown=componentBreakdown(product,options);
    const componentCost=breakdown.reduce((sum,row)=>sum+n(row.cost),0);
    const manualCost=n(product.manual_product_cost || product.product_cost);
    const packagingFallback=n(product.packaging_cost);
    const hasNewComponents=auditProductComponents(product.id).length>0;
    const hasLegacy=auditLegacyProductRecipes(product.id).length>0;
    let costSource='none';
    let totalCost=0;
    if(manualCost>0){ totalCost=manualCost; costSource='manual_override'; }
    else if(hasNewComponents){ totalCost=componentCost; costSource='product_components'; }
    else if(hasLegacy){ totalCost=componentCost+packagingFallback; costSource='legacy_recipe_links_plus_packaging'; }
    else { totalCost=packagingFallback; costSource=packagingFallback>0?'packaging_only':'none'; }
    const offlineRevenue=n(product.offline_price);
    const onlineRevenue=n(product.online_price);
    const commissionPercent=n(product.commission_percent || appSettings().defaultCommission);
    const commissionAmount=onlineRevenue*commissionPercent/100;
    const offlineProfit=offlineRevenue-totalCost;
    const onlineProfit=onlineRevenue-totalCost-commissionAmount;
    const meta={componentCost,manualCost,packagingFallback,hasNewComponents,hasLegacy,costSource};
    const warnings=productWarnings(product,breakdown,meta);
    return {
      product,
      found:true,
      product_id:product.id,
      product_name:product.name||'',
      category:product.category||'',
      branch_id:product.branch_id||'',
      branch_name:branchById(product.branch_id)?.name || (typeof branchName==='function'?branchName(product.branch_id):''),
      total_cost:totalCost,
      cost_source:costSource,
      component_cost:componentCost,
      manual_cost:manualCost,
      packaging_fallback:packagingFallback,
      offline_price:offlineRevenue,
      online_price:onlineRevenue,
      commission_percent:commissionPercent,
      commission_amount:commissionAmount,
      offline_profit:offlineProfit,
      online_profit:onlineProfit,
      offline_margin:m(offlineProfit,offlineRevenue),
      online_margin:m(onlineProfit,onlineRevenue),
      breakdown,
      warnings,
      warning_count:warnings.length,
      is_clean:warnings.length===0
    };
  }
  function calculateAllProductAudits(options={}){
    return (appState().products||[]).map(p=>calculateProductAudit(p,options));
  }
  function getProductComponentBreakdown(productOrId){ return calculateProductAudit(productOrId).breakdown; }
  function getProductCostWarnings(productOrId){ return calculateProductAudit(productOrId).warnings; }
  function productAuditCost(productOrId){ return calculateProductAudit(productOrId).total_cost; }

  window.KhumbukaCostAudit={
    calculateProductAudit,
    calculateAllProductAudits,
    getProductComponentBreakdown,
    getProductCostWarnings,
    productAuditCost,
    formatMoney:inr,
    escape:esc
  };
  window.calculateProductAudit=calculateProductAudit;
  window.calculateAllProductAudits=calculateAllProductAudits;
  window.getProductComponentBreakdown=getProductComponentBreakdown;
  window.getProductCostWarnings=getProductCostWarnings;
  window.productAuditCost=productAuditCost;
})();

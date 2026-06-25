async function dbSelect(tableName, order='created_at'){
  if(!supabaseClient) return [];
  try{
    const pageSize = 1000;
    let from = 0;
    let all = [];
    while(true){
      let q = supabaseClient.from(tableName).select('*').range(from, from + pageSize - 1);
      if(order) q = q.order(order,{ascending: order==='name' || order==='email' || order==='sort_order'});
      const {data,error} = await q;
      if(error) throw error;
      const batch = data || [];
      all = all.concat(batch);
      if(batch.length < pageSize) break;
      from += pageSize;
    }
    return all;
  }catch(e){ console.warn(`Could not load ${tableName}`, e.message); return []; }
}
async function dbInsert(tableName,row){
  const {data,error}=await supabaseClient.from(tableName).insert([row]).select();
  if(error){console.error(error); showError(error.message); return null;}
  return data?.[0]||null;
}
async function dbInsertMany(tableName,rows=[]){
  if(!rows.length) return [];
  const {data,error}=await supabaseClient.from(tableName).insert(rows).select();
  if(error){console.error(error); showError(error.message); return null;}
  return data||[];
}
async function dbUpdate(tableName,id,row){
  const {data,error}=await supabaseClient.from(tableName).update(row).eq('id',id).select();
  if(error){console.error(error); showError(error.message); return null;}
  return data?.[0]||null;
}
async function dbDelete(tableName,id){
  const {error}=await supabaseClient.from(tableName).delete().eq('id',id);
  if(error){console.error(error); showError(error.message); return false;}
  return true;
}
async function dbDeleteMany(tableName, ids=[]){
  if(!ids.length) return false;
  const {error}=await supabaseClient.from(tableName).delete().in('id',ids);
  if(error){console.error(error); showError(error.message); return false;}
  return true;
}
async function loadAll(){
  state.brands = await dbSelect('brands','name');
  state.branches = await dbSelect('branches','name');
  state.ingredients = await dbSelect('ingredients','name');
  state.recipes = await dbSelect('recipes','name');
  state.recipeItems = await dbSelect('recipe_items',null);
  state.products = await dbSelect('products','name');
  state.productRecipes = await dbSelect('product_recipes',null);
  state.productComponents = await dbSelect('product_components',null);
  state.assumptions = await dbSelect('assumptions','sort_order');
  state.sales = await dbSelect('sales','sale_date');
  state.expenses = await dbSelect('expenses','expense_date');
  state.dailySalesSummaries = await dbSelect('daily_sales_summaries','sale_date');
  state.restaurantSalesSummaries = await dbSelect('restaurant_sales_summaries','created_at');
  state.importRejections = await dbSelect('import_rejections','created_at');
  state.appRoles = await dbSelect('app_roles','name');
  state.appUsers = await dbSelect('app_users','email');
  state.units = await dbSelect('units','sort_order');
}
function brandName(id){return state.brands.find(x=>x.id===id)?.name||''}
function branchName(id){return state.branches.find(x=>x.id===id)?.name||''}
function productNameById(id){return state.products.find(x=>x.id===id)?.name||''}
function saleProductName(s){ return productNameById(s.product_id) || s.product_name_snapshot || 'Unmatched Product'; }
function ingredientName(id){return state.ingredients.find(x=>x.id===id)?.name||''}
function recipeName(id){return state.recipes.find(x=>x.id===id)?.name||''}
function roleName(id){return state.appRoles.find(x=>x.id===id)?.name||''}
function unitLabel(unit){
  const text=String(unit||'');
  const hit=state.units.find(x=>[x.name,x.symbol].map(v=>String(v||'').toLowerCase()).includes(text.toLowerCase()));
  return hit ? (hit.symbol || hit.name) : text;
}
async function saveImportRejection(entity, sourceFile, sheetName, rowNumber, reason, rawPayload={}){
  try{
    await dbInsert('import_rejections',{entity,source_file:sourceFile||'',sheet_name:sheetName||'',row_number:rowNumber||null,reason,raw_payload:rawPayload});
  }catch(e){ console.warn('Could not save import rejection', e); }
}

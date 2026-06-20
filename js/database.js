async function dbSelect(tableName, order='created_at'){
  if(!supabaseClient) return [];
  try{ let q=supabaseClient.from(tableName).select('*'); if(order) q=q.order(order,{ascending: order==='name'}); const {data,error}=await q; if(error) throw error; return data||[]; }catch(e){ console.warn(`Could not load ${tableName}`, e.message); return []; }
}
async function dbInsert(tableName,row){ const {data,error}=await supabaseClient.from(tableName).insert([row]).select(); if(error){console.error(error); alert(error.message); return null;} return data?.[0]||null; }
async function dbUpdate(tableName,id,row){ const {data,error}=await supabaseClient.from(tableName).update(row).eq('id',id).select(); if(error){console.error(error); alert(error.message); return null;} return data?.[0]||null; }
async function dbDelete(tableName,id){ const {error}=await supabaseClient.from(tableName).delete().eq('id',id); if(error){console.error(error); alert(error.message); return false;} return true; }
async function loadAll(){
  state.brands = await dbSelect('brands','name');
  state.branches = await dbSelect('branches','name');
  state.ingredients = await dbSelect('ingredients','name');
  state.recipes = await dbSelect('recipes','name');
  state.recipeItems = await dbSelect('recipe_items',null);
  state.products = await dbSelect('products','name');
  state.productRecipes = await dbSelect('product_recipes',null);
  state.sales = await dbSelect('sales','sale_date');
  state.expenses = await dbSelect('expenses','expense_date');
}
function brandName(id){return state.brands.find(x=>x.id===id)?.name||''}
function branchName(id){return state.branches.find(x=>x.id===id)?.name||''}
function productNameById(id){return state.products.find(x=>x.id===id)?.name||''}
function ingredientName(id){return state.ingredients.find(x=>x.id===id)?.name||''}
function recipeName(id){return state.recipes.find(x=>x.id===id)?.name||''}

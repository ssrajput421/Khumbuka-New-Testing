const state = {
  brands:[],branches:[],ingredients:[],recipes:[],recipeItems:[],products:[],productRecipes:[],sales:[],expenses:[],
  dailySalesSummaries:[],restaurantSalesSummaries:[],importRejections:[],
  appRoles:[],appUsers:[],units:[],cart:[],
  editing:{ingredient:null,recipe:null,product:null,expense:null,brand:null,branch:null,user:null,unit:null}
};
let settings = JSON.parse(localStorage.getItem('khumbuka_settings') || '{"defaultCommission":35,"defaultGST":5}');

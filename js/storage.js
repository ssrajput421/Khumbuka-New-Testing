const state = {brands:[],branches:[],ingredients:[],recipes:[],recipeItems:[],products:[],productRecipes:[],sales:[],expenses:[],cart:[],editing:{ingredient:null,recipe:null,product:null,expense:null}};
let settings = JSON.parse(localStorage.getItem('khumbuka_settings') || '{"defaultCommission":35,"defaultGST":5}');

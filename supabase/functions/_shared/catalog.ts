import type { Ingredient, Recipe, MealType } from './domain.ts';
// Nutrition per 100g/ml; generic, uncooked ingredients unless the name says otherwise.
// Estimates for MVP. Source basis and review requirements are documented in docs/catalog.md.
const row = (id:string,name:string,category:Ingredient['category'],calories:number,protein:number,carbs:number,fat:number,packageSize:number,price:number,allergens:string[]=[],animal?:Ingredient['animal']): Ingredient => ({id,name,category,unit:'g',macros:{calories,protein,carbs,fat},packageSize,price,allergens,animal});
export const INGREDIENTS: Ingredient[] = [
  row('chicken','Chicken breast','Meat & Seafood',120,22.5,0,2.6,454,4.49,[],'meat'),
  row('turkey','Ground turkey','Meat & Seafood',150,20,0,8,454,4.99,[],'meat'),
  row('beef','Lean ground beef','Meat & Seafood',172,21,0,10,454,5.99,[],'meat'),
  row('salmon','Salmon fillet','Meat & Seafood',208,20,0,13,340,8.99,[],'fish'),
  row('tuna','Canned tuna, drained','Meat & Seafood',116,26,0,1,142,1.59,[],'fish'),
  row('shrimp','Peeled shrimp','Frozen',85,20,0,0.5,340,6.99,['shellfish'],'fish'),
  row('tofu','Firm tofu','Produce',144,17,3,9,397,2.49,['soy']),
  row('beans','Black beans, cooked','Pantry',132,9,24,0.5,425,0.99),
  row('chickpeas','Chickpeas, cooked','Pantry',164,9,27,2.6,425,1.19),
  row('lentils','Lentils, cooked','Pantry',116,9,20,0.4,425,1.29),
  row('rice','Brown rice, dry','Pantry',367,7.5,76,3,907,2.79),
  row('quinoa','Quinoa, dry','Pantry',368,14,64,6,454,3.99),
  row('pasta','Whole wheat pasta, dry','Pantry',350,13,70,2,454,1.69,['wheat','gluten']),
  row('oats','Rolled oats, certified gluten-free','Pantry',379,13,68,6.5,510,3.49),
  row('potato','Potatoes','Produce',77,2,17,0.1,1360,3.49),
  row('sweetpotato','Sweet potato','Produce',86,1.6,20,0.1,907,2.99),
  row('tortilla','Corn tortillas','Bakery',218,6,45,3,300,2.29),
  row('bread','Whole grain bread','Bakery',247,13,41,4,567,2.99,['wheat','gluten']),
  row('yogurt','Nonfat Greek yogurt','Dairy',59,10,3.6,0.4,907,4.49,['milk'],'dairy'),
  row('cottage','Low-fat cottage cheese','Dairy',82,11,3,2.3,454,2.99,['milk'],'dairy'),
  row('eggs','Eggs (edible weight)','Dairy',143,13,0.7,9.5,600,3.29,['egg'],'egg'),
  row('eggwhite','Liquid egg whites','Dairy',52,11,0.7,0.2,454,3.49,['egg'],'egg'),
  row('milk','Low-fat milk','Dairy',42,3.4,5,1,1890,2.49,['milk'],'dairy'),
  row('soymilk','Unsweetened soy milk','Dairy',33,3,1,1.8,946,2.29,['soy']),
  row('protein','Unflavored whey protein','Pantry',400,80,8,6,450,14.99,['milk'],'dairy'),
  row('peaprotein','Pea protein','Pantry',380,78,6,5,450,14.99),
  row('broccoli','Broccoli','Produce',34,2.8,7,0.4,454,1.79),
  row('spinach','Baby spinach','Produce',23,2.9,3.6,0.4,142,1.99),
  row('pepper','Bell peppers','Produce',31,1,6,0.3,450,2.49),
  row('tomato','Tomatoes','Produce',18,0.9,3.9,0.2,454,1.79),
  row('cucumber','Cucumber','Produce',15,0.7,3.6,0.1,300,0.79),
  row('carrot','Carrots','Produce',41,0.9,10,0.2,907,1.49),
  row('avocado','Avocado','Produce',160,2,9,15,150,0.99),
  row('banana','Banana','Produce',89,1.1,23,0.3,600,1.49),
  row('berries','Mixed berries','Frozen',50,1,12,0.4,454,3.49),
  row('apple','Apple','Produce',52,0.3,14,0.2,600,2.49),
  row('onion','Onion','Produce',40,1.1,9,0.1,454,0.99),
  row('lemon','Lemon','Produce',29,1.1,9,0.3,120,0.59),
  row('garlic','Garlic','Produce',149,6,33,0.5,60,0.49),
  row('oil','Olive oil','Pantry',884,0,0,100,500,5.49),
  row('honey','Honey','Pantry',304,0,82,0,340,3.49),
  row('peanut','Peanut butter','Pantry',588,25,20,50,454,2.29,['peanut']),
  row('almonds','Almonds','Pantry',579,21,22,50,170,3.49,['tree nuts']),
  row('chia','Chia seeds','Pantry',486,17,42,31,340,3.99),
  row('tamari','Gluten-free tamari','Pantry',60,10,6,0,296,2.99,['soy']),
  row('salsa','Tomato salsa','Pantry',36,1,7,0,454,1.99),
  row('cumin','Ground cumin','Pantry',375,18,44,22,45,1.29),
  row('paprika','Smoked paprika','Pantry',282,14,54,13,45,1.29),
];
export const ingredientById = Object.fromEntries(INGREDIENTS.map(i=>[i.id,i]));
export const PHOTOS = {
  bowl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&auto=format&fit=crop&q=85',
  chicken: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1000&auto=format&fit=crop&q=85',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000&auto=format&fit=crop&q=85',
  breakfast: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=1000&auto=format&fit=crop&q=85',
  toast: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1000&auto=format&fit=crop&q=85',
  pasta: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1000&auto=format&fit=crop&q=85',
};
type Base = { id: string; name: string; type: MealType; ingredients: [string,number][]; equipment: string[]; minutes: number; image: string; steps: string[]; batch?: boolean };
const bases: Base[] = [
  {id:'chicken-bowl',name:'Chicken crunch rice bowl',type:'Lunch',ingredients:[['chicken',180],['rice',65],['broccoli',120],['oil',8]],equipment:['Stove'],minutes:25,image:PHOTOS.chicken,steps:['Cook the rice in water following the package directions.','Dice the chicken. Heat the oil in a skillet and cook the chicken until its center reaches 165°F / 74°C.','Steam the broccoli until tender-crisp. Divide the rice, chicken, and vegetables into bowls.'],batch:true},
  {id:'turkey-tacos',name:'Turkey & avocado tacos',type:'Dinner',ingredients:[['turkey',170],['tortilla',90],['avocado',50],['tomato',80]],equipment:['Stove'],minutes:20,image:PHOTOS.bowl,steps:['Brown the turkey in a nonstick skillet, breaking it into small pieces. Cook to 165°F / 74°C.','Warm the corn tortillas in a dry pan. Dice the tomato and slice the avocado.','Fill the tortillas with turkey and top with tomato and avocado.'],batch:true},
  {id:'salmon',name:'Salmon & sweet potato plate',type:'Dinner',ingredients:[['salmon',160],['sweetpotato',230],['broccoli',120],['oil',5]],equipment:['Oven'],minutes:30,image:PHOTOS.bowl,steps:['Heat the oven to 425°F / 220°C. Cut sweet potato into 1cm cubes and toss with oil. Roast for 15 minutes.','Add the salmon and broccoli to the tray. Roast another 12–15 minutes, until the fish reaches 145°F / 63°C.','Serve the salmon over the roasted vegetables.']},
  {id:'tofu-rice',name:'Crispy tofu rice bowl',type:'Lunch',ingredients:[['tofu',220],['rice',60],['carrot',80],['broccoli',100],['oil',5]],equipment:['Stove'],minutes:25,image:PHOTOS.salad,steps:['Cook the rice according to its package directions. Pat the tofu dry and cut into cubes.','Heat oil in a nonstick skillet. Cook tofu for 8–10 minutes, turning until golden.','Add thinly sliced carrots and broccoli with a splash of water. Cover for 4 minutes, then serve over rice.'],batch:true},
  {id:'lentil-bowl',name:'Lentil harvest bowl',type:'Dinner',ingredients:[['lentils',220],['quinoa',65],['spinach',70],['carrot',100],['oil',8]],equipment:['Stove'],minutes:25,image:PHOTOS.salad,steps:['Rinse quinoa and simmer with twice its volume of water for about 15 minutes.','Slice the carrots finely and sauté in oil until tender. Add drained cooked lentils and heat through.','Fold in spinach until wilted. Spoon over quinoa.'],batch:true},
  {id:'beef-pasta',name:'Beef & tomato pasta',type:'Dinner',ingredients:[['beef',150],['pasta',75],['tomato',150],['onion',50],['oil',5]],equipment:['Stove'],minutes:30,image:PHOTOS.pasta,steps:['Boil pasta according to package directions, reserving a little cooking water.','Dice onion and soften in oil. Add beef and brown until it reaches 160°F / 71°C.','Add chopped tomatoes and simmer for 8 minutes. Toss with pasta and a splash of cooking water.'],batch:true},
  {id:'tuna',name:'Tuna & white-crunch salad',type:'Lunch',ingredients:[['tuna',140],['chickpeas',140],['cucumber',100],['tomato',100],['oil',10]],equipment:[],minutes:10,image:PHOTOS.salad,steps:['Drain the tuna and chickpeas well.','Dice cucumber and tomato into bite-size pieces.','Toss everything with olive oil and serve immediately or chill.'],batch:true},
  {id:'shrimp',name:'Shrimp & quinoa skillet',type:'Dinner',ingredients:[['shrimp',190],['quinoa',75],['pepper',130],['oil',10]],equipment:['Stove'],minutes:25,image:PHOTOS.bowl,steps:['Rinse quinoa and simmer in twice its volume of water for 15 minutes.','Slice peppers and sauté in oil until tender. Add thawed shrimp and cook until opaque and 145°F / 63°C.','Fold the quinoa into the pan and divide into bowls.']},
  {id:'chickpea',name:'Golden chickpea potato bowl',type:'Lunch',ingredients:[['chickpeas',220],['potato',200],['spinach',80],['oil',8]],equipment:['Stove'],minutes:25,image:PHOTOS.salad,steps:['Dice potatoes small and simmer in water for 10 minutes, then drain.','Heat oil in a skillet and brown the potatoes for 5 minutes.','Add cooked chickpeas and spinach. Stir until the chickpeas are hot and spinach has wilted.'],batch:true},
  {id:'chicken-wrap',name:'Chicken & avocado fold',type:'Lunch',ingredients:[['chicken',160],['tortilla',90],['avocado',60],['spinach',40],['oil',5]],equipment:['Stove'],minutes:20,image:PHOTOS.chicken,steps:['Slice chicken thinly and cook in oil until the center reaches 165°F / 74°C.','Warm the tortillas. Mash the avocado and spread over each tortilla.','Layer with spinach and chicken, then fold and serve.']},
  {id:'yogurt-oats',name:'Berry overnight oats',type:'Breakfast',ingredients:[['oats',55],['yogurt',200],['berries',100],['chia',10]],equipment:[],minutes:5,image:PHOTOS.breakfast,steps:['Stir oats and chia into yogurt with 80ml water per serving.','Cover and refrigerate overnight, or for at least 4 hours.','Top with berries just before serving.'],batch:true},
  {id:'eggs-toast',name:'Soft eggs & avocado toast',type:'Breakfast',ingredients:[['eggs',100],['eggwhite',100],['bread',65],['avocado',40]],equipment:['Stove'],minutes:10,image:PHOTOS.toast,steps:['Toast the bread in a dry skillet. Mash avocado and spread over the toast.','Whisk eggs and egg whites together. Gently scramble in a nonstick skillet until fully set.','Spoon eggs over toast and serve.']},
  {id:'tofu-breakfast',name:'Tofu breakfast scramble',type:'Breakfast',ingredients:[['tofu',200],['potato',160],['spinach',50],['oil',5]],equipment:['Stove'],minutes:20,image:PHOTOS.toast,steps:['Dice potatoes finely and simmer until tender, about 8 minutes. Drain.','Heat oil in a skillet. Crumble in tofu and add potatoes. Cook for 6 minutes.','Fold in spinach and cook until wilted.'],batch:true},
  {id:'smoothie',name:'Berry protein smoothie',type:'Breakfast',ingredients:[['soymilk',250],['peaprotein',30],['banana',100],['berries',100],['oats',30]],equipment:['Blender'],minutes:5,image:PHOTOS.breakfast,steps:['Add soy milk to the blender, followed by fruit, oats, and protein powder.','Blend until smooth, adding water if needed.','Pour into a glass and serve immediately.']},
  {id:'protein-oats',name:'Banana protein porridge',type:'Breakfast',ingredients:[['oats',60],['milk',150],['protein',25],['banana',100]],equipment:['Microwave'],minutes:5,image:PHOTOS.breakfast,steps:['Mix oats and milk in a large microwave-safe bowl with 100ml water.','Microwave for 2 minutes, stir, then heat in 30-second intervals until soft.','Cool briefly before stirring in protein powder. Top with sliced banana.']},
  {id:'yogurt-snack',name:'Greek yogurt & berries',type:'Snack',ingredients:[['yogurt',200],['berries',80],['almonds',10]],equipment:[],minutes:3,image:PHOTOS.breakfast,steps:['Spoon yogurt into a bowl.','Top with berries and roughly chopped almonds.']},
  {id:'cottage-snack',name:'Cottage cheese crunch',type:'Snack',ingredients:[['cottage',180],['cucumber',100],['carrot',80]],equipment:[],minutes:5,image:PHOTOS.salad,steps:['Cut cucumber and carrots into sticks.','Spoon cottage cheese into a bowl and serve with the vegetables for dipping.']},
  {id:'shake',name:'Simple protein shake',type:'Snack',ingredients:[['protein',30],['milk',180]],equipment:[],minutes:2,image:PHOTOS.breakfast,steps:['Add milk and protein powder to a shaker bottle.','Close tightly and shake until smooth.']},
  {id:'plant-shake',name:'Plant protein shake',type:'Snack',ingredients:[['peaprotein',30],['soymilk',180]],equipment:[],minutes:2,image:PHOTOS.breakfast,steps:['Add soy milk and pea protein to a shaker bottle.','Close tightly and shake until smooth.']},
  {id:'apple-snack',name:'Apple & peanut butter',type:'Snack',ingredients:[['apple',150],['peanut',25]],equipment:[],minutes:3,image:PHOTOS.breakfast,steps:['Core and slice the apple.','Serve with peanut butter for dipping.']},
];
// Three explicit flavor variants per base = 60 complete recipes. Variant ingredients
// are included in nutrition, grocery quantities, allergen checks, and instructions.
export const RECIPES: Recipe[] = bases.flatMap(base => {
  const sweet = ['yogurt-oats','smoothie','protein-oats','yogurt-snack','shake','plant-shake','apple-snack'].includes(base.id);
  const variants = sweet ? [
    {suffix:'',name:base.name,add:[] as [string,number][],step:''},
    {suffix:'-banana',name:`Banana ${base.name.toLowerCase()}`,add:[['banana',50]] as [string,number][],step:'Add the extra sliced banana at serving, or blend it into the shake.'},
    {suffix:'-chia',name:`Chia ${base.name.toLowerCase()}`,add:[['chia',10]] as [string,number][],step:'Stir in chia seeds and let stand for 5 minutes before serving.'},
  ] : [
    {suffix:'',name:base.name,add:[['lemon',15]] as [string,number][],step:'Finish with fresh lemon juice.'},
    {suffix:'-smoky',name:`Smoky ${base.name.toLowerCase()}`,add:[['paprika',2],['salsa',30]] as [string,number][],step:'Stir in smoked paprika near the end of cooking, or mix into the dressing. Serve with salsa.'},
    {suffix:'-garlic',name:`Garlic ${base.name.toLowerCase()}`,add:[['garlic',4],['lemon',15]] as [string,number][],step:'Finely grate garlic and mix with lemon juice. Stir into the finished dish.'},
  ];
  return variants.map(v => ({id:base.id+v.suffix,name:v.name,type:base.type,ingredients:[...base.ingredients,...v.add].map(([id,amount])=>({id,amount})),equipment:base.equipment,minutes:base.minutes,prepMinutes:Math.min(10,base.minutes),image:base.image,steps:[...base.steps,...(v.step?[v.step]:[])],batch:base.batch??false,tags:[...(base.minutes<=15?['Quick Meals']:[]),...(base.batch?['Meal Prep Friendly']:[]),...(base.ingredients.length<=5?['Minimal Ingredients']:[])]}));
});
export const recipeById = Object.fromEntries(RECIPES.map(r=>[r.id,r]));

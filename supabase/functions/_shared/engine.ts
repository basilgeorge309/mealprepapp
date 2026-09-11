import { ingredientById, recipeById, RECIPES } from './catalog.ts';
import { ZERO, MEALS, DAYS, uid, weekStart, dayDate, validateProfile } from './domain.ts';
import type { Macros, Recipe, Profile, PlannedMeal, Plan, PantryItem, Grocery, FoodLog, MealType } from './domain.ts';
export function add(a: Macros, b: Macros): Macros { return { calories:a.calories+b.calories, protein:a.protein+b.protein, carbs:a.carbs+b.carbs, fat:a.fat+b.fat }; }
export function scale(a: Macros, n: number): Macros { return { calories:a.calories*n,protein:a.protein*n,carbs:a.carbs*n,fat:a.fat*n }; }
export function nutrition(recipe: Recipe, portion=1): Macros { return recipe.ingredients.reduce((sum,i)=>add(sum,scale(ingredientById[i.id].macros,i.amount*portion/100)), {...ZERO}); }
export function mealNutrition(meal: PlannedMeal) { return nutrition(recipeById[meal.recipeId],meal.portion); }
export function mealCost(meal: PlannedMeal, household=false) { return recipeById[meal.recipeId].ingredients.reduce((s,i)=>s+i.amount*(meal.portion+(household?meal.extraServings:0))/ingredientById[i.id].packageSize*ingredientById[i.id].price,0); }
export function sumMeals(meals: PlannedMeal[]) { return meals.reduce((s,m)=>add(s,mealNutrition(m)),{...ZERO}); }
export function allocatedTarget(profile: Profile, day: number): Macros { return scale(profile.targets,(profile.dayMeals[day]??profile.meals).reduce((s,m)=>s+profile.allocations[m],0)); }
export function compatible(recipe: Recipe, p: Profile): boolean {
  if (recipe.minutes>p.maxMinutes || recipe.equipment.some(e=>!p.equipment.includes(e))) return false;
  const blocked = [...p.avoid,...p.allergies].map(s=>s.trim().toLowerCase()).filter(Boolean);
  return recipe.ingredients.every(({id})=>{
    const i=ingredientById[id];
    if (blocked.some(b=>i.id===b || i.name.toLowerCase().includes(b) || i.allergens.some(a=>a.includes(b)||b.includes(a)))) return false;
    if (p.diets.includes('Vegan') && (i.animal || id==='honey')) return false;
    if (p.diets.includes('Vegetarian') && (i.animal==='meat'||i.animal==='fish')) return false;
    if (p.diets.includes('Pescatarian') && i.animal==='meat') return false;
    if (p.diets.includes('Gluten Free') && i.allergens.includes('gluten')) return false;
    if (p.diets.includes('Dairy Free') && i.allergens.includes('milk')) return false;
    return true;
  });
}
export function groceryList(plan: Plan, pantry: PantryItem[]): Grocery[] {
  const amounts: Record<string,number>={};
  for(const meal of plan.meals) for(const i of recipeById[meal.recipeId].ingredients) amounts[i.id]=(amounts[i.id]??0)+i.amount*(meal.portion+meal.extraServings);
  return Object.entries(amounts).map(([id,needed])=>{
    const i=ingredientById[id], stock=pantry.find(p=>p.ingredientId===id)?.amount??0;
    const toBuy=stock==='enough'?0:Math.max(0,needed-stock);
    const packages=Math.ceil(Math.max(0,toBuy-1e-8)/i.packageSize);
    return {id,name:i.name,category:i.category,unit:i.unit,needed,toBuy,packages,packageSize:i.packageSize,price:packages*i.price,pantry:toBuy===0};
  }).sort((a,b)=>a.name.localeCompare(b.name));
}
export function groceryTotal(plan: Plan, pantry: PantryItem[]) { return groceryList(plan,pantry).reduce((s,g)=>s+g.price,0); }
const distance = (actual: Macros,target: Macros) => 5*Math.abs(actual.calories-target.calories)/Math.max(100,target.calories)+4*Math.abs(actual.protein-target.protein)/Math.max(10,target.protein)+Math.abs(actual.carbs-target.carbs)/Math.max(15,target.carbs)+.7*Math.abs(actual.fat-target.fat)/Math.max(10,target.fat);
const portions=[.5,.75,1,1.25,1.5,1.75,2];
export function targetStatus(actual: Macros,target: Macros) { return Math.abs(actual.calories-target.calories)<=target.calories*.05 && Math.abs(actual.protein-target.protein)<=target.protein*.1; }
export function planWarnings(plan: Plan,p: Profile,pantry: PantryItem[]) {
  const warnings:string[]=[];
  const total=groceryTotal(plan,pantry);
  if(total>p.budget+.01) warnings.push(`Estimated groceries are $${(total-p.budget).toFixed(2)} over budget. Try more pantry ingredients, fewer planned meals, or a larger budget.`);
  for(const day of p.days) {
    const meals=plan.meals.filter(m=>m.day===day);
    if(!targetStatus(sumMeals(meals),allocatedTarget(p,day))) warnings.push(`${DAYS[day]} is outside your calorie or protein range. Review portions or adjust your targets.`);
  }
  return warnings;
}
export function generatePlan(p: Profile,pantry: PantryItem[]=[],start=weekStart(),seed=0): Plan {
  validateProfile(p);
  const plan:Plan={id:uid(),weekStart:start,revision:0,meals:[],warnings:[]};
  const candidates=RECIPES.filter(r=>compatible(r,p));
  const used:Record<string,number>={};
  for(const day of [...new Set(p.days)].sort()) {
    const types=p.dayMeals[day]??p.meals;
    for(const type of MEALS.filter(t=>types.includes(t))) {
      const available=candidates.filter(r=>r.type===type);
      if(!available.length) throw new Error(`No ${type.toLowerCase()} recipes fit your restrictions and equipment. Add equipment, allow more time, or choose another meal slot. Your dietary exclusions have been preserved.`);
      const target=scale(p.targets,p.allocations[type]);
      const current=sumMeals(plan.meals.filter(m=>m.day===day));
      const previousTypes=plan.meals.filter(m=>m.day===day).map(m=>m.type);
      const expected=scale(p.targets,previousTypes.reduce((s,t)=>s+p.allocations[t],0));
      const adjusted={calories:Math.max(50,target.calories+(expected.calories-current.calories)*.65),protein:Math.max(0,target.protein+(expected.protein-current.protein)*.65),carbs:Math.max(0,target.carbs+(expected.carbs-current.carbs)*.4),fat:Math.max(0,target.fat+(expected.fat-current.fat)*.4)};
      const currentCost=groceryTotal(plan,pantry);
      const scores=available.flatMap((recipe,index)=>portions.map(portion=>{
        const meal:PlannedMeal={id:uid(),day,type,recipeId:recipe.id,portion,extraServings:p.people-1};
        const cost=groceryTotal({...plan,meals:[...plan.meals,meal]},pantry)-currentCost;
        const count=used[recipe.id]??0;
        const reuse=recipe.ingredients.filter(i=>plan.meals.some(m=>recipeById[m.recipeId].ingredients.some(j=>j.id===i.id))).length;
        const prefs=p.preferences.reduce((s,pref)=>s+(recipe.tags.includes(pref)?.12:0),0);
        const love=recipe.ingredients.filter(i=>p.love.includes(i.id)).length*.12;
        const variety=count*(p.prepSessions>0&&recipe.batch?.45:1.1)+(count>=2?5:0);
        const tie=((index+seed*7+day*3)%available.length)*.002;
        const budgetWeight=p.preferences.includes('Cheap Meals')?.12:.07;
        return {meal,score:distance(nutrition(recipe,portion),adjusted)+cost*budgetWeight+variety-reuse*.02-prefs-love+tie};
      })).sort((a,b)=>a.score-b.score);
      const best=scores[0].meal; plan.meals.push(best);used[best.recipeId]=(used[best.recipeId]??0)+1;
    }
  }
  // Coordinate descent improves the complete day rather than only individual slots.
  for(let pass=0;pass<2;pass++) for(const day of p.days) {
    const target=allocatedTarget(p,day);
    for(const meal of plan.meals.filter(m=>m.day===day)) {
      const original=meal.portion; let best=original;
      let score=distance(sumMeals(plan.meals.filter(m=>m.day===day)),target)+Math.max(0,groceryTotal(plan,pantry)-p.budget)*.04;
      for(const portion of portions) { meal.portion=portion; const next=distance(sumMeals(plan.meals.filter(m=>m.day===day)),target)+Math.max(0,groceryTotal(plan,pantry)-p.budget)*.04; if(next<score) {score=next;best=portion;} }
      meal.portion=best;
    }
  }
  plan.warnings=planWarnings(plan,p,pantry);return plan;
}
export function swapOptions(plan: Plan, meal: PlannedMeal, p: Profile,pantry: PantryItem[]) {
  const original=mealNutrition(meal), baseline=groceryTotal(plan,pantry);
  return RECIPES.filter(r=>r.id!==meal.recipeId&&r.type===meal.type&&compatible(r,p)).flatMap(recipe=>portions.map(portion=>{
    const replacement={...meal,recipeId:recipe.id,portion};
    const candidate={...plan,meals:plan.meals.map(m=>m.id===meal.id?replacement:m)};
    const cost=groceryTotal(candidate,pantry), delta=cost-baseline;
    return {meal:replacement,macros:mealNutrition(replacement),delta,score:distance(mealNutrition(replacement),original)+Math.max(0,cost-p.budget)*.2+Math.max(0,delta)*.05};
  })).filter(o=>Math.abs(o.macros.calories-original.calories)<=original.calories*.2 && Math.abs(o.macros.protein-original.protein)<=Math.max(10,original.protein*.3))
    .sort((a,b)=>a.score-b.score).filter((o,i,all)=>all.findIndex(x=>x.meal.recipeId===o.meal.recipeId)===i).slice(0,4);
}
export function projectedDay(plan: Plan,logs: FoodLog[],day: number) { const date=dayDate(plan.weekStart,day); return logs.filter(l=>l.date===date).reduce((s,l)=>add(s,l.macros),sumMeals(plan.meals.filter(m=>m.day===day&&!logs.some(l=>l.mealId===m.id)))); }
export interface Adjustment { id: string; title: string; description: string; plan: Plan; macros: Macros; costDelta: number; }
export function proteinOptions(plan:Plan,logs:FoodLog[],day:number,grams:number,p:Profile,pantry:PantryItem[]):Adjustment[] {
  if(!Number.isFinite(grams)||grams<=0||grams>200) throw new Error('Enter an additional protein amount between 1 and 200g.');
  const baseline=projectedDay(plan,logs,day), cost=groceryTotal(plan,pantry);
  const options:Adjustment[]=[];
  for(const meal of plan.meals.filter(m=>m.day===day&&!logs.some(l=>l.mealId===m.id))) {
    const per=nutrition(recipeById[meal.recipeId]);
    if(per.protein<10) continue;
    const portion=Math.round((meal.portion+grams/per.protein)*20)/20;
    if(portion>2.5) continue;
    const next={...plan,revision:plan.revision+1,meals:plan.meals.map(m=>m.id===meal.id?{...m,portion}:m)};
    const recipe=recipeById[meal.recipeId];
    const primary=recipe.ingredients[0];
    options.push({id:uid(),title:`A little more ${recipe.name.toLowerCase()}`,description:`Your portion: ${meal.portion} → ${portion}× · ${ingredientById[primary.id].name}: ${Math.round(primary.amount*meal.portion)} → ${Math.round(primary.amount*portion)}g`,plan:next,macros:projectedDay(next,logs,day),costDelta:groceryTotal(next,pantry)-cost});
  }
  for(const recipe of RECIPES.filter(r=>r.type==='Snack'&&compatible(r,p))) {
    const n=nutrition(recipe); if(n.protein<15)continue;
    const portion=Math.round(grams/n.protein*20)/20;if(portion<.25||portion>2)continue;
    const next={...plan,revision:plan.revision+1,meals:[...plan.meals,{id:uid(),day,type:'Snack' as MealType,recipeId:recipe.id,portion,extraServings:0}]};
    options.push({id:uid(),title:`Add ${recipe.name.toLowerCase()}`,description:`${portion} serving${portion===1?'':'s'} just for you`,plan:next,macros:projectedDay(next,logs,day),costDelta:groceryTotal(next,pantry)-cost});
  }
  return options.sort((a,b)=>Math.abs(a.macros.protein-baseline.protein-grams)-Math.abs(b.macros.protein-baseline.protein-grams)+Math.max(0,a.costDelta)*.2-Math.max(0,b.costDelta)*.2).slice(0,3);
}
export function rebalanceDay(plan:Plan,logs:FoodLog[],day:number,p:Profile,pantry:PantryItem[]):Plan {
  const next:Plan={...plan,revision:plan.revision+1,meals:plan.meals.map(m=>({...m})),warnings:[]};
  const target=allocatedTarget(p,day);
  const editable=next.meals.filter(m=>m.day===day&&!logs.some(l=>l.mealId===m.id));
  for(let pass=0;pass<2;pass++) for(const meal of editable) {
    let best={...meal}, bestScore=distance(projectedDay(next,logs,day),target)+Math.max(0,groceryTotal(next,pantry)-p.budget)*.1;
    const choices=RECIPES.filter(r=>r.type===meal.type&&compatible(r,p));
    for(const recipe of choices) for(const portion of portions) {
      meal.recipeId=recipe.id;meal.portion=portion;
      const score=distance(projectedDay(next,logs,day),target)+Math.max(0,groceryTotal(next,pantry)-p.budget)*.1;
      if(score<bestScore) {bestScore=score;best={...meal};}
    }
    Object.assign(meal,best);
  }
  if(!targetStatus(projectedDay(next,logs,day),target))next.warnings.push('This is the closest available fit. Your logged food is unchanged; some targets are still outside range.');
  if(!editable.length)next.warnings.push('There are no uneaten planned meals left to adjust today.');
  return next;
}
export function recommendedTargets(age:number,sex:'male'|'female',heightCm:number,weightKg:number,activity:number,goal:string):Macros {
  if(age<18||age>100||heightCm<100||heightCm>250||weightKg<30||weightKg>350) throw new Error('Enter adult measurements within the supported ranges.');
  const resting=10*weightKg+6.25*heightCm-5*age+(sex==='male'?5:-161);
  const factor=goal==='Lose fat'?.9:goal==='Build muscle'?1.1:1;
  const calories=Math.round(resting*activity*factor/10)*10;
  return {calories,protein:Math.round(calories*.3/4),carbs:Math.round(calories*.4/4),fat:Math.round(calories*.3/9)};
}

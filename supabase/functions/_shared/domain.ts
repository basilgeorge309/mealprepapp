export type Macros = { calories: number; protein: number; carbs: number; fat: number };
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MEALS: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
export const EQUIPMENT = ['Oven', 'Stove', 'Microwave', 'Air fryer', 'Grill', 'Slow cooker', 'Blender'];
export const PREFERENCES = ['High Protein', 'Quick Meals', 'Low Calorie', 'Meal Prep Friendly', 'Cheap Meals', 'High Volume', 'Healthy Comfort Food', 'Minimal Ingredients'];
export const DIETS = ['Vegetarian', 'Vegan', 'Pescatarian', 'Gluten Free', 'Dairy Free'];
export type Category = 'Produce' | 'Meat & Seafood' | 'Dairy' | 'Pantry' | 'Frozen' | 'Bakery' | 'Other';
export const CATEGORIES: Category[] = ['Produce', 'Meat & Seafood', 'Dairy', 'Pantry', 'Frozen', 'Bakery', 'Other'];
export interface Ingredient { id: string; name: string; category: Category; unit: 'g' | 'ml'; macros: Macros; packageSize: number; price: number; allergens: string[]; animal?: 'meat' | 'fish' | 'dairy' | 'egg'; }
export interface Recipe { id: string; name: string; type: MealType; ingredients: { id: string; amount: number }[]; equipment: string[]; minutes: number; prepMinutes: number; tags: string[]; image: string; steps: string[]; batch: boolean; }
export interface Profile {
  name: string; goal: string; targets: Macros; people: number; days: number[];
  meals: MealType[]; dayMeals: Record<string, MealType[]>; budget: number;
  preferences: string[]; diets: string[]; allergies: string[]; avoid: string[]; love: string[];
  equipment: string[]; maxMinutes: number; prepSessions: number;
  allocations: Record<MealType, number>; units: 'US' | 'Metric';
}
export interface PlannedMeal { id: string; day: number; type: MealType; recipeId: string; portion: number; extraServings: number; }
export interface Plan { id: string; weekStart: string; revision: number; meals: PlannedMeal[]; warnings: string[]; }
export interface FoodLog { id: string; date: string; mealId?: string; name: string; macros: Macros; estimated: boolean; }
export interface PantryItem { ingredientId: string; amount: number | 'enough'; }
export interface Grocery { id: string; name: string; category: Category; unit: string; needed: number; toBuy: number; packages: number; packageSize: number; price: number; pantry: boolean; }
export interface ManualGrocery { id: string; name: string; amount: string; price: number; }
export interface Purchase { amount: number; price: number; }
export interface AppData { profile: Profile; plan: Plan; logs: FoodLog[]; pantry: PantryItem[]; purchased: Record<string, Purchase>; manual: ManualGrocery[]; favorites: string[]; completedDays: string[]; weights: { date: string; kg: number }[]; actualSpend: number | null; personalized: boolean; }
export const ZERO: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
export const DEFAULT_PROFILE: Profile = { name: 'Alex', goal: 'Build muscle', targets: { calories: 2100, protein: 158, carbs: 210, fat: 70 }, people: 1, days: [0,1,2,3,4,5,6], meals: [...MEALS], dayMeals: {}, budget: 110, preferences: ['High Protein', 'Quick Meals', 'Meal Prep Friendly'], diets: [], allergies: [], avoid: [], love: ['chicken','rice','avocado'], equipment: ['Stove', 'Oven', 'Microwave'], maxMinutes: 30, prepSessions: 2, allocations: { Breakfast: .25, Lunch: .3, Dinner: .35, Snack: .1 }, units: 'US' };
export function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function weekStart(date = new Date()) { const d = new Date(date); d.setDate(d.getDate() - (d.getDay()+6)%7); return localDate(d); }
export function dayDate(start: string, day: number) { const d = new Date(`${start}T12:00:00`); d.setDate(d.getDate()+day); return localDate(d); }
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function validateProfile(p: Profile) {
  if (!p || !p.targets || Object.values(p.targets).some(v => !Number.isFinite(v) || v < 0) || p.targets.calories <= 0) throw new Error('Enter valid calorie and macro targets.');
  if (p.targets.calories > 10000 || p.targets.protein > 1000 || p.targets.carbs > 2000 || p.targets.fat > 1000) throw new Error('Check your nutrition targets.');
  if (!Number.isInteger(p.people) || p.people < 1 || p.people > 20) throw new Error('Choose a household size from 1 to 20.');
  if (!Number.isFinite(p.budget) || p.budget <= 0 || p.budget > 10000) throw new Error('Enter a weekly budget between $1 and $10,000.');
  if (!Array.isArray(p.days) || !p.days.length || p.days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) throw new Error('Choose at least one day.');
  if (!Array.isArray(p.meals) || !p.meals.length || p.meals.some(m => !MEALS.includes(m))) throw new Error('Choose at least one meal.');
  if (p.preferences.length > 3) throw new Error('Choose up to three primary preferences.');
  if (!Number.isFinite(p.maxMinutes) || p.maxMinutes < 1 || !Number.isInteger(p.prepSessions) || p.prepSessions < 0 || p.prepSessions > 7) throw new Error('Check cooking time and prep sessions.');
  for (const day of p.days) { const meals = p.dayMeals[day] ?? p.meals; if (!meals.length || meals.some(m => !MEALS.includes(m))) throw new Error('Choose at least one meal for each selected day.'); }
  if (MEALS.some(m => !Number.isFinite(p.allocations[m]) || p.allocations[m] <= 0) || Math.abs(MEALS.reduce((s,m)=>s+p.allocations[m],0)-1) > .001) throw new Error('Meal allocations must add up to 100%.');
  const macroCalories = p.targets.protein*4+p.targets.carbs*4+p.targets.fat*9;
  if (Math.abs(macroCalories-p.targets.calories)>Math.max(30,p.targets.calories*.03)) throw new Error('Match your calorie target to your macro calories before continuing.');
}

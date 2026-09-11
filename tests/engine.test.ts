import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE } from '../supabase/functions/_shared/domain';
import type { Profile } from '../supabase/functions/_shared/domain';
import { generatePlan, groceryList, groceryTotal, nutrition, recommendedTargets, targetStatus } from '../supabase/functions/_shared/engine';
import { recipeById } from '../supabase/functions/_shared/catalog';

describe('portion planning engine', () => {
  it('calculates recipe nutrition from canonical ingredients', () => {
    const n = nutrition(recipeById['chicken-bowl']);
    expect(n.calories).toBeGreaterThan(300);
    expect(n.protein).toBeGreaterThan(30);
  });
  it('scales household servings and subtracts pantry stock before packages', () => {
    const profile = { ...structuredClone(DEFAULT_PROFILE), days: [0], people: 2, meals: ['Lunch'], dayMeals: {} };
    const plan = generatePlan(profile as Profile, [{ ingredientId: 'rice', amount: 'enough' }], '2026-09-07', 1);
    const rice = groceryList(plan, [{ ingredientId: 'rice', amount: 'enough' }]).find(i => i.id === 'rice');
    expect(rice?.pantry).toBe(true);
    expect(groceryTotal(plan, [{ ingredientId: 'rice', amount: 'enough' }])).toBeGreaterThan(0);
    expect(plan.meals[0].extraServings).toBe(1);
  });
  it('keeps generated plan within calorie and protein tolerance', () => {
    const profile = { ...structuredClone(DEFAULT_PROFILE), days: [0], meals: ['Breakfast', 'Lunch', 'Dinner', 'Snack'], dayMeals: {} };
    const plan = generatePlan(profile as Profile, [], '2026-09-07', 3);
    const total = plan.meals.filter(m => m.day === 0).reduce((s, m) => { const n = nutrition(recipeById[m.recipeId], m.portion); return { calories: s.calories + n.calories, protein: s.protein + n.protein, carbs: 0, fat: 0 }; }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    expect(targetStatus(total, profile.targets)).toBe(true);
  });
  it('returns an editable adult calorie estimate with reconciling macro calories', () => {
    const result = recommendedTargets(28, 'female', 168, 68, 1.375, 'Build muscle');
    expect(result.calories).toBeGreaterThan(1500);
    expect(result.calories).toBeCloseTo(result.protein * 4 + result.carbs * 4 + result.fat * 9, -1);
  });
});

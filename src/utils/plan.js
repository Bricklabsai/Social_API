/** Plan helpers — free vs paid feature access (mirrors backend plan_service). */

export const PREMIUM_PLANS = new Set(['pro', 'business', 'enterprise']);

export function normalizePlan(plan) {
  return String(plan || 'free').trim().toLowerCase();
}

export function isPremiumPlan(plan) {
  return PREMIUM_PLANS.has(normalizePlan(plan));
}

export function isFreePlan(plan) {
  return !isPremiumPlan(plan);
}

export const PREMIUM_FEATURE_LABELS = {
  studio: 'Studio AI',
  assistant: 'AI writing assistant',
  create_ai: 'AI idea generation',
};

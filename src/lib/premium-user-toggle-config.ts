const enabledValue = "true";

export function isPremiumUserToggleAllowed() {
  if (import.meta.env.DEV) return true;

  return import.meta.env.VITE_ENABLE_PREMIUM_USER_TOGGLE === enabledValue;
}

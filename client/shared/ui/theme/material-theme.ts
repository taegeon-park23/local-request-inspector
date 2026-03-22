export type MaterialThemeMode = 'dark' | 'light';

export const MATERIAL_THEME_ATTRIBUTE = 'data-theme';
export const MATERIAL_THEME_DEFAULT_MODE: MaterialThemeMode = 'dark';
export const MATERIAL_THEME_SEED_COLOR = '#6fd3ff';

export function applyMaterialTheme(mode: MaterialThemeMode = MATERIAL_THEME_DEFAULT_MODE) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.setAttribute(MATERIAL_THEME_ATTRIBUTE, mode);
}

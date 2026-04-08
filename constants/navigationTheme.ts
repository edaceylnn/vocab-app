import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import Colors from '@/constants/Colors';

/**
 * React Navigation theme aligned with app color tokens (stack headers, etc.).
 */
export function getAppNavigationTheme(scheme: 'light' | 'dark'): Theme {
  const c = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: scheme === 'dark',
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.background,
      card: typeof c.cardBg === 'string' ? c.cardBg : base.colors.card,
      text: c.text,
      border: c.border,
      notification: c.primary,
    },
  };
}

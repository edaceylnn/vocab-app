export const primary = '#004ac6';
export const primaryContainer = '#2563eb';
export const backgroundLight = '#f9f9ff';
export const backgroundDark = '#0b0d11';
export const backgroundDarkAlt = '#101622';

const tintColorLight = primary;
const tintColorDark = '#fff';

export default {
  light: {
    text: '#111c2d',
    background: backgroundLight,
    tint: tintColorLight,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    primary,
    primaryContainer,
    cardBg: '#ffffff',
    surface1: '#f0f3ff',
    surface2: '#ffffff',
    surface3: '#d8e3fb',
    border: 'rgba(195, 198, 215, 0.15)',
    outlineVariant: '#c3c6d7',
    shadow: 'rgba(17, 28, 45, 0.06)',
    muted: '#576676',
  },
  dark: {
    text: '#fff',
    background: backgroundDark,
    tint: tintColorDark,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorDark,
    primary,
    primaryContainer,
    cardBg: 'rgba(30, 41, 59, 0.4)',
    surface1: '#111827',
    surface2: '#0f172a',
    surface3: '#172554',
    border: 'rgba(148, 163, 184, 0.18)',
    outlineVariant: '#334155',
    shadow: 'rgba(0, 0, 0, 0.5)',
    muted: '#94a3b8',
  },
};

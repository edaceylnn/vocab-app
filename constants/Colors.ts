export const primary = '#135bec';
export const backgroundLight = '#f6f6f8';
export const backgroundDark = '#0b0d11';
export const backgroundDarkAlt = '#101622';

const tintColorLight = primary;
const tintColorDark = '#fff';

export default {
  light: {
    text: '#0f172a',
    background: backgroundLight,
    tint: tintColorLight,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    primary,
    cardBg: '#fff',
    border: '#e2e8f0',
    muted: '#64748b',
  },
  dark: {
    text: '#fff',
    background: backgroundDark,
    tint: tintColorDark,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorDark,
    primary,
    cardBg: 'rgba(30, 41, 59, 0.4)',
    border: '#334155',
    muted: '#94a3b8',
  },
};

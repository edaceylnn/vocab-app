import { StyleSheet, type ViewProps, View } from 'react-native';

import type Colors from '@/constants/Colors';

type AppColors = (typeof Colors)['light'];

export type SurfaceVariant = 'card' | 'cardMuted' | 'input';

export function Surface({
  variant = 'card',
  colors,
  ghostBorder,
  style,
  ...rest
}: ViewProps & { colors: AppColors; variant?: SurfaceVariant; ghostBorder?: boolean }) {
  const base =
    variant === 'input'
      ? styles.input
      : variant === 'cardMuted'
        ? styles.cardMuted
        : styles.card;

  const bg =
    variant === 'input' ? colors.surface2 : variant === 'cardMuted' ? colors.surface1 : colors.surface1;

  return (
    <View
      {...rest}
      style={[
        base,
        {
          backgroundColor: bg,
          borderColor: ghostBorder ? colors.outlineVariant : 'transparent',
          shadowColor: colors.shadow,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 0,
    borderRadius: 24,
    padding: 16,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 8,
  },
  cardMuted: {
    borderWidth: 0,
    borderRadius: 24,
    padding: 16,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 8,
  },
  input: {
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});


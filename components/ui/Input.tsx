import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import type Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Surface } from './Surface';

type AppColors = (typeof Colors)['light'];

export function Input({
  colors,
  label,
  containerStyle,
  inputStyle,
  ...props
}: TextInputProps & {
  colors: AppColors;
  label?: string;
  containerStyle?: object;
  inputStyle?: object;
}) {
  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={[styles.label, Typography.sectionLabel, { color: colors.muted }]}>{label}</Text>
      ) : null}
      <Surface variant="input" colors={colors} style={styles.surface}>
        <TextInput
          {...props}
          placeholderTextColor={colors.muted}
          style={[styles.input, Typography.input, { color: colors.text }, inputStyle]}
        />
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 8 },
  input: { minHeight: 24 },
  surface: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
});


import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle, View } from 'react-native';
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

import type Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

type AppColors = (typeof Colors)['light'];

export function PrimaryButton(props: {
  title: string;
  colors: AppColors;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const { colors, disabled, loading, title, onPress, style } = props;
  const canPress = !disabled && !loading;

  return (
    <Pressable
      onPress={canPress ? onPress : undefined}
      style={({ pressed }) => [
        styles.base,
        { shadowColor: colors.shadow, opacity: canPress ? (pressed ? 0.92 : 1) : 0.5 },
        pressed && canPress ? styles.pressed : null,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.text, Typography.heading]} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 8,
  },
  gradient: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  pressed: { transform: [{ scale: 0.99 }] },
  text: { color: '#fff', fontWeight: '700' },
});


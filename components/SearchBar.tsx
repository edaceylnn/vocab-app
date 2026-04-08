import { StyleSheet, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Typography } from '@/constants/Typography';

type ColorsLike = { text: string; muted: string };

export function SearchBar(props: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  colors: ColorsLike;
}) {
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name="magnify" size={20} color={props.colors.muted} />
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={props.colors.muted}
        style={[styles.input, Typography.searchInput, { color: props.colors.text }]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityRole="search"
        accessibilityLabel={props.placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  input: { flex: 1 },
});


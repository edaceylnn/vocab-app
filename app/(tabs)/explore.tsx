import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { PAGE_PADDING_HORIZONTAL, PAGE_PADDING_TOP, CONTENT_BOTTOM_PADDING } from '@/constants/Layout';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const colors = Colors[useColorScheme() ?? 'light'];
  const paddingTop = Math.max(insets.top, 16) + PAGE_PADDING_TOP;
  const paddingBottom = CONTENT_BOTTOM_PADDING + insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop, paddingBottom, paddingHorizontal: PAGE_PADDING_HORIZONTAL }]}>
        <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Search and filter</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 8 },
});

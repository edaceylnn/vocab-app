import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { SearchBar } from './SearchBar';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { primary } from '@/constants/Colors';

export function SetPickerModal(props: {
  visible: boolean;
  /**
   * When true, render as a full-screen overlay inside the parent (e.g. another Modal).
   * Nested RN Modals are unreliable on iOS; use this instead of stacking two Modals.
   */
  embedded?: boolean;
  onClose: () => void;
  sets: { id: string; name: string }[];
  selectedSetId: string | null;
  onSelect: (setId: string) => void;
  colors: { text: string; muted: string; background: string; border: string };
}) {
  const [q, setQ] = useState('');
  const dq = useDebouncedValue(q, 150);
  const filtered = useMemo(() => {
    const query = dq.trim().toLowerCase();
    if (!query) return props.sets;
    return props.sets.filter((s) => s.name.toLowerCase().includes(query));
  }, [dq, props.sets]);

  const embedded = props.embedded ?? false;

  const body = (
    <>
      <Pressable style={styles.backdrop} onPress={props.onClose} />
      <View style={[styles.card, { backgroundColor: props.colors.background, borderColor: props.colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: props.colors.text }]}>Choose a set</Text>
          <Pressable onPress={props.onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
            <MaterialCommunityIcons name="close" size={22} color={props.colors.muted} />
          </Pressable>
        </View>

        <SearchBar value={q} onChangeText={setQ} placeholder="Search sets" colors={props.colors} />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          renderItem={({ item }) => {
            const selected = item.id === props.selectedSetId;
            return (
              <Pressable
                onPress={() => props.onSelect(item.id)}
                style={({ pressed }) => [
                  styles.row,
                  { borderColor: props.colors.border, opacity: pressed ? 0.9 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select set ${item.name}`}
              >
                <MaterialCommunityIcons name="folder-outline" size={20} color={selected ? primary : props.colors.muted} />
                <Text style={[styles.rowText, { color: props.colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {selected && <MaterialCommunityIcons name="check" size={20} color={primary} />}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: props.colors.muted }]}>No sets found</Text>
            </View>
          }
        />
      </View>
    </>
  );

  if (embedded) {
    if (!props.visible) return null;
    return <View style={styles.embeddedRoot}>{body}</View>;
  }

  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      {body}
    </Modal>
  );
}

const styles = StyleSheet.create({
  embeddedRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '18%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    maxHeight: '64%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '800' },
  list: { marginTop: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: '700' },
  empty: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontSize: 13, fontWeight: '600' },
});


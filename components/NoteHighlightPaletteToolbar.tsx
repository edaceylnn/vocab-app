import {
  FlatList,
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Images, useBridgeState, type EditorBridge } from '@10play/tentap-editor';

type Row = { kind: 'close' } | { kind: 'swatch'; index: number } | { kind: 'clear' };

export function NoteHighlightPaletteToolbar(props: {
  editor: EditorBridge;
  hexColors: readonly string[];
  swatchSources: (ImageSourcePropType | undefined)[];
  onClosePalette: () => void;
  iconTint: string;
  activeWrapperBg: string;
}) {
  const { editor, hexColors, swatchSources, onClosePalette, iconTint, activeWrapperBg } = props;
  const editorState = useBridgeState(editor);

  const data: Row[] = [
    { kind: 'close' },
    ...hexColors.map((_, index) => ({ kind: 'swatch' as const, index })),
    { kind: 'clear' },
  ];

  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={(item, i) => (item.kind === 'swatch' ? `swatch-${item.index}` : `${item.kind}-${i}`)}
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      style={styles.list}
      renderItem={({ item }) => {
        if (item.kind === 'close') {
          return (
            <Pressable
              onPress={onClosePalette}
              style={styles.btn}
              accessibilityRole="button"
              accessibilityLabel="Close highlight colors"
            >
              <Image source={Images.close} style={[styles.tintedIcon, { tintColor: iconTint }]} resizeMode="contain" />
            </Pressable>
          );
        }
        if (item.kind === 'clear') {
          return (
            <Pressable
              onPress={() => {
                editor.unsetHighlight();
                onClosePalette();
              }}
              style={styles.btn}
              accessibilityRole="button"
              accessibilityLabel="Remove highlight"
            >
              <Image source={Images.close} style={[styles.tintedIcon, { tintColor: iconTint }]} resizeMode="contain" />
            </Pressable>
          );
        }
        const hex = hexColors[item.index];
        const src = swatchSources[item.index];
        const active = editorState.activeHighlight === hex;
        return (
          <Pressable
            onPress={() => {
              editor.toggleHighlight(hex);
              onClosePalette();
            }}
            style={[styles.btn, active && { backgroundColor: activeWrapperBg }]}
            accessibilityRole="button"
            accessibilityLabel={`Highlight ${hex}`}
          >
            {src ? (
              <Image source={src} style={styles.swatch} resizeMode="contain" />
            ) : (
              <View style={[styles.swatchFallback, { backgroundColor: hex }]} />
            )}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 0,
    minHeight: 44,
    maxHeight: 44,
  },
  btn: {
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 4,
  },
  tintedIcon: {
    height: 28,
    width: 28,
  },
  swatch: {
    height: 28,
    width: 28,
  },
  swatchFallback: {
    height: 24,
    width: 24,
    borderRadius: 12,
  },
});

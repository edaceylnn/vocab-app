import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  RichText,
  Toolbar,
  useEditorBridge,
  DEFAULT_TOOLBAR_ITEMS,
  darkEditorTheme,
  Images,
  type EditorBridge,
  type ToolbarItem,
} from '@10play/tentap-editor';
import type { WebViewMessageEvent } from 'react-native-webview';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Colors, { primary } from '@/constants/Colors';
import { PAGE_PADDING_HORIZONTAL, PAGE_PADDING_TOP } from '@/constants/Layout';
import { useColorScheme } from '@/components/useColorScheme';
import { createCard, getAllSets, getNoteById, getOrCreateDefaultSet, updateNote, deleteNote } from '@/lib/db';
import { parseNoteBody } from '@/lib/noteDocument';
import { applyNoteEditorChrome, useNoteEditorChrome } from '@/lib/noteEditorChrome';
import { getLastSetIdForNotesCard, setLastSetIdForNotesCard } from '@/lib/lastSetPreference';
import { NOTE_HIGHLIGHT_COLORS } from '@/lib/noteHighlightColors';
import { useAddCardToolbarIcon } from '@/lib/useAddCardToolbarIcon';
import { useHighlightSwatchToolbarIcons } from '@/lib/useHighlightSwatchToolbarIcons';
import { NoteHighlightPaletteToolbar } from '@/components/NoteHighlightPaletteToolbar';
import { SetPickerModal } from '@/components/SetPickerModal';
import type { NoteRow } from '@/lib/types';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [note, setNote] = useState<NoteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    getNoteById(id).then((row) => {
      if (cancelled) return;
      setLoading(false);
      if (row) setNote(row);
      else setNotFound(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading || !id) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (notFound || !note) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.text }]}>Note not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: primary }]}>
          <Text style={[styles.backBtnText, { color: primary }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <NoteEditorLoaded
      note={note}
      colors={colors}
      colorScheme={colorScheme ?? 'light'}
      insets={insets}
      onDeleted={() => router.back()}
    />
  );
}

function NoteEditorLoaded({
  note,
  colors,
  colorScheme,
  insets,
  onDeleted,
}: {
  note: NoteRow;
  colors: (typeof Colors)['light'];
  colorScheme: 'light' | 'dark';
  insets: { top: number; bottom: number; left: number; right: number };
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<EditorBridge | null>(null);
  const titleRef = useRef(title);
  titleRef.current = title;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [sets, setSets] = useState<{ id: string; name: string }[]>([]);
  const [setId, setSetId] = useState<string | null>(null);
  const [savingCard, setSavingCard] = useState(false);
  const [saveLabel, setSaveLabel] = useState<'saved' | 'saving' | 'idle'>('idle');
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [setPickerOpen, setSetPickerOpen] = useState(false);
  const addCardToolbarIcon = useAddCardToolbarIcon(colors.text);
  const highlightSwatchIcons = useHighlightSwatchToolbarIcons(NOTE_HIGHLIGHT_COLORS);

  const runSave = useCallback(async () => {
    const ed = editorRef.current;
    if (!ed) return;
    setSaveLabel('saving');
    const json = await ed.getJSON();
    await updateNote(note.id, titleRef.current.trim() || 'Untitled', JSON.stringify(json));
    setSaveLabel('saved');
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveLabel('idle'), 1500);
  }, [note.id]);

  const queueSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveLabel('saving');
    saveTimer.current = setTimeout(() => {
      void runSave();
    }, 450);
  }, [runSave]);

  const editor = useEditorBridge({
    initialContent: parseNoteBody(note.body),
    // iOS devices sometimes fail to focus the editor reliably on first render.
    // Autofocus + a follow-up focus helps ensure the keyboard appears and typing works.
    autofocus: Platform.OS === 'ios',
    avoidIosKeyboard: true,
    disableColorHighlight: false,
    theme: colorScheme === 'dark' ? darkEditorTheme : undefined,
    onChange: queueSave,
  });
  editorRef.current = editor;

  const onEditorMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const raw = event?.nativeEvent?.data;
      if (typeof raw !== 'string') return;
      try {
        const msg = JSON.parse(raw) as { type?: string; payload?: unknown };
        if (msg.type !== 'note-selection') return;
        const text = typeof msg.payload === 'string' ? msg.payload : '';
        setSelectedText(text);
        setFront((prev) => (prev.trim() ? prev : text.trim()));
        setAddCardOpen(true);
      } catch {
        // ignore non-JSON messages
      }
    },
    []
  );

  const requestSelection = useCallback(() => {
    setSelectedText('');
    editor.injectJS(`
      (function () {
        var t = '';
        try { t = (window.getSelection && window.getSelection().toString()) || ''; } catch (e) {}
        try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'note-selection', payload: t })); } catch (e) {}
      })();
    `);
  }, [editor]);

  const openAddCard = useCallback(async () => {
    setFront('');
    setBack('');
    setAddCardOpen(false);
    try {
      const all = await getAllSets();
      setSets(all.map((s) => ({ id: s.id, name: s.name })));
      const last = await getLastSetIdForNotesCard();
      if (last && all.some((s) => s.id === last)) {
        setSetId(last);
      } else {
        const def = await getOrCreateDefaultSet();
        setSetId(def.id);
      }
    } catch {
      setSets([]);
      setSetId(null);
    }
    requestSelection();
  }, [requestSelection]);

  const mainToolbarItems: ToolbarItem[] = useMemo(() => {
    const addToLibraryItem: ToolbarItem = {
      onPress: () => () => void openAddCard(),
      active: () => false,
      disabled: () => false,
      image: () => addCardToolbarIcon ?? Images.a,
    };
    const openPaletteItem: ToolbarItem = {
      onPress: () => () => setPaletteOpen(true),
      active: ({ editorState }) => !!editorState.activeHighlight,
      disabled: () => false,
      image: () => Images.palette,
    };
    return [addToLibraryItem, openPaletteItem, ...DEFAULT_TOOLBAR_ITEMS];
  }, [openAddCard, addCardToolbarIcon]);

  const chromeOpts = useMemo(
    () =>
      ({
        horizontalPx: PAGE_PADDING_HORIZONTAL,
        bottomPaddingPx: insets.bottom + 120,
        colorScheme,
      }) as const,
    [insets.bottom, colorScheme]
  );

  useNoteEditorChrome(editor, chromeOpts);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const t = setTimeout(() => {
      try {
        editor.focus('end');
      } catch {
        // ignore
      }
    }, 350);
    return () => clearTimeout(t);
  }, [editor]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        void runSave();
      };
    }, [runSave])
  );

  const onTitleChange = (t: string) => {
    setTitle(t);
    queueSave();
  };

  useEffect(() => {
    if (!addCardOpen) setSetPickerOpen(false);
  }, [addCardOpen]);

  const confirmDelete = () => {
    Alert.alert('Delete note', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteNote(note.id);
            onDeleted();
          })();
        },
      },
    ]);
  };

  const headerTop = Math.max(insets.top, 12) + PAGE_PADDING_TOP;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Modal
        visible={addCardOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddCardOpen(false)}
      >
        <View style={styles.addCardModalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setAddCardOpen(false)} />
          <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add as card</Text>
          <Text style={[styles.modalHint, { color: colors.muted }]} numberOfLines={2}>
            {selectedText.trim()
              ? `Selected: “${selectedText.trim().slice(0, 120)}${selectedText.trim().length > 120 ? '…' : ''}”`
              : 'Select text in the note, then tap this action again if needed.'}
          </Text>

          <TextInput
            value={front}
            onChangeText={setFront}
            placeholder="Front"
            placeholderTextColor={colors.muted}
            style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
          />
          <TextInput
            value={back}
            onChangeText={setBack}
            placeholder="Back (optional)"
            placeholderTextColor={colors.muted}
            style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
          />

          <View style={styles.setRow}>
            <Text style={[styles.setLabel, { color: colors.muted }]}>Set</Text>
            <Pressable
              onPress={() => setSetPickerOpen(true)}
              style={({ pressed }) => [
                styles.setPicker,
                { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Choose set"
            >
              <Text style={[styles.setValue, { color: colors.text }]} numberOfLines={1}>
                {sets.find((s) => s.id === setId)?.name ?? 'Default'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={colors.muted} />
            </Pressable>
          </View>

          <View style={styles.modalActions}>
            <Pressable
              onPress={() => setAddCardOpen(false)}
              style={({ pressed }) => [styles.modalBtn, pressed && styles.modalBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.modalBtnText, { color: colors.muted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (savingCard) return;
                const f = front.trim();
                if (!f) return;
                void (async () => {
                  setSavingCard(true);
                  try {
                    const targetSetId = setId ?? (await getOrCreateDefaultSet()).id;
                    await createCard(targetSetId, f, back.trim() || f, null);
                    await setLastSetIdForNotesCard(targetSetId);
                    setAddCardOpen(false);
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Failed to create card.';
                    Alert.alert('Error', msg);
                  } finally {
                    setSavingCard(false);
                  }
                })();
              }}
              style={({ pressed }) => [
                styles.modalBtnPrimary,
                { backgroundColor: primary, opacity: pressed ? 0.9 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save card"
            >
              <Text style={styles.modalBtnPrimaryText}>{savingCard ? 'Saving…' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>

          <SetPickerModal
            embedded
            visible={setPickerOpen}
            onClose={() => setSetPickerOpen(false)}
            sets={sets}
            selectedSetId={setId}
            onSelect={(id) => {
              setSetId(id);
              setSetPickerOpen(false);
            }}
            colors={colors}
          />
        </View>
      </Modal>

      <View style={[styles.header, { paddingTop: headerTop, paddingHorizontal: PAGE_PADDING_HORIZONTAL }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerIcon}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.muted }]} numberOfLines={1}>
            Notes
          </Text>
          {saveLabel !== 'idle' && (
            <Text style={[styles.saveLabel, { color: colors.muted }]}>
              {saveLabel === 'saving' ? 'Saving…' : 'Saved'}
            </Text>
          )}
        </View>
        <Pressable
          onPress={confirmDelete}
          style={styles.headerIcon}
          accessibilityRole="button"
          accessibilityLabel="Delete note"
        >
          <MaterialCommunityIcons name="delete-outline" size={24} color={colors.muted} />
        </Pressable>
      </View>

      <TextInput
        value={title}
        onChangeText={onTitleChange}
        placeholder="Title"
        placeholderTextColor={colors.muted}
        style={[
          styles.titleInput,
          {
            color: colors.text,
            borderBottomColor: colors.border,
            paddingHorizontal: PAGE_PADDING_HORIZONTAL,
          },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 52}
      >
        <View style={styles.editorWrap}>
          <RichText
            editor={editor}
            style={styles.rich}
            originWhitelist={['*']}
            exclusivelyUseCustomOnMessage={false}
            onMessage={onEditorMessage}
            onLoad={() => applyNoteEditorChrome(editor, chromeOpts)}
            onError={(e) => {
              const msg = e?.nativeEvent?.description ?? 'WebView error';
              Alert.alert('Editor error', msg);
            }}
            onContentProcessDidTerminate={() => {
              Alert.alert('Editor error', 'The editor process restarted. Please reopen the note.');
            }}
          />
          <View
            style={[
              styles.toolbarDock,
              {
                paddingBottom: Math.max(insets.bottom, 8),
                backgroundColor: colors.background,
                borderTopColor: colors.border,
              },
            ]}
          >
            {paletteOpen ? (
              <NoteHighlightPaletteToolbar
                editor={editor}
                hexColors={NOTE_HIGHLIGHT_COLORS}
                swatchSources={highlightSwatchIcons}
                onClosePalette={() => setPaletteOpen(false)}
                iconTint={colors.muted}
                activeWrapperBg={colorScheme === 'dark' ? '#8E8E93' : '#E5E5E5'}
              />
            ) : (
              <Toolbar editor={editor} items={mainToolbarItems} hidden={false} />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  editorWrap: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addCardModalRoot: { flex: 1 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '22%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  modalHint: { marginTop: 6, fontSize: 12, lineHeight: 16 },
  modalInput: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  setRow: { marginTop: 12 },
  setLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  setPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  setValue: { flex: 1, fontSize: 14, fontWeight: '600' },
  modalActions: { marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  modalBtnPressed: { opacity: 0.9 },
  modalBtnText: { fontSize: 14, fontWeight: '700' },
  modalBtnPrimary: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  modalBtnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  notFoundText: { fontSize: 16, marginBottom: 16 },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  backBtnText: { fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  headerIcon: { padding: 8 },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 13, fontWeight: '600' },
  saveLabel: { marginTop: 2, fontSize: 11, fontWeight: '600' },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rich: { flex: 1, minHeight: 280 },
  toolbarDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

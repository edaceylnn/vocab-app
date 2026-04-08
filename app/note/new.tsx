import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Colors, { primary } from '@/constants/Colors';
import { PAGE_PADDING_HORIZONTAL, PAGE_PADDING_TOP } from '@/constants/Layout';
import { useColorScheme } from '@/components/useColorScheme';
import { createCard, createNote, getAllSets, getOrCreateDefaultSet } from '@/lib/db';
import { EMPTY_TIPTAP_DOC } from '@/lib/noteDocument';
import { applyNoteEditorChrome, useNoteEditorChrome } from '@/lib/noteEditorChrome';
import { getLastSetIdForNotesCard, setLastSetIdForNotesCard } from '@/lib/lastSetPreference';
import { NOTE_HIGHLIGHT_COLORS } from '@/lib/noteHighlightColors';
import { useAddCardToolbarIcon } from '@/lib/useAddCardToolbarIcon';
import { useHighlightSwatchToolbarIcons } from '@/lib/useHighlightSwatchToolbarIcons';
import { NoteHighlightPaletteToolbar } from '@/components/NoteHighlightPaletteToolbar';
import { SetPickerModal } from '@/components/SetPickerModal';

export default function NewNoteScreen() {
  const { template } = useLocalSearchParams<{ template?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [sets, setSets] = useState<{ id: string; name: string }[]>([]);
  const [setId, setSetId] = useState<string | null>(null);
  const [savingCard, setSavingCard] = useState(false);
  const [setPickerOpen, setSetPickerOpen] = useState(false);
  const addCardToolbarIcon = useAddCardToolbarIcon(colors.text);
  const highlightSwatchIcons = useHighlightSwatchToolbarIcons(NOTE_HIGHLIGHT_COLORS);

  const editorRef = useRef<EditorBridge | null>(null);

  const editor = useEditorBridge({
    initialContent: EMPTY_TIPTAP_DOC,
    autofocus: Platform.OS === 'ios',
    avoidIosKeyboard: true,
    disableColorHighlight: false,
    theme: colorScheme === 'dark' ? darkEditorTheme : undefined,
  });
  editorRef.current = editor;

  const onEditorMessage = useCallback((event: WebViewMessageEvent) => {
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
      // ignore
    }
  }, []);

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
        colorScheme: (colorScheme ?? 'light') === 'dark' ? 'dark' : 'light',
      }) as const,
    [insets.bottom, colorScheme]
  );

  useNoteEditorChrome(editor, chromeOpts);

  useEffect(() => {
    if (!addCardOpen) setSetPickerOpen(false);
  }, [addCardOpen]);

  useEffect(() => {
    if (!template) return;
    const templates: Record<string, { title: string; doc: Record<string, unknown> }> = {
      study: {
        title: 'Study notes',
        doc: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Topic' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'What am I learning today?' }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key points' }] },
            { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Questions' }] },
            { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] },
          ],
        },
      },
      meeting: {
        title: 'Meeting notes',
        doc: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Attendees' }] },
            { type: 'paragraph' },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Agenda' }] },
            { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Actions' }] },
            { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph' }] }] },
          ],
        },
      },
      vocabulary: {
        title: 'Vocabulary',
        doc: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Words' }] },
            { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'word — meaning' }] }] }] },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Sentences' }] },
            { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] },
          ],
        },
      },
    };
    const t = templates[template];
    if (!t) return;
    setTitle(t.title);
    // Let the web editor mount before setting content.
    const timer = setTimeout(() => {
      try {
        editor.setContent(t.doc as any);
      } catch {
        // ignore
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [template, editor]);

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

  const onSave = useCallback(async () => {
    if (saving) return;
    const ed = editorRef.current;
    if (!ed) return;
    setSaving(true);
    try {
      const json = await ed.getJSON();
      const doc = JSON.stringify(json);
      const finalTitle = title.trim() || 'Untitled';
      const row = await createNote(finalTitle, doc);
      router.replace(`/note/${row.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save note.';
      Alert.alert('Error', message);
      setSaving(false);
    }
  }, [router, saving, title]);

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
        <Text style={[styles.headerTitle, { color: colors.muted }]} numberOfLines={1}>
          New note
        </Text>
        <Pressable
          onPress={() => void onSave()}
          style={({ pressed }) => [
            styles.savePill,
            { backgroundColor: primary, opacity: pressed ? 0.9 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save note"
        >
          <Text style={styles.savePillText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>

      <TextInput
        value={title}
        onChangeText={setTitle}
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
                activeWrapperBg={(colorScheme ?? 'light') === 'dark' ? '#8E8E93' : '#E5E5E5'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  headerIcon: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600' },
  savePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginLeft: 8,
  },
  savePillText: { color: '#fff', fontSize: 13, fontWeight: '800' },
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


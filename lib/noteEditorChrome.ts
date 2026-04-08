import { useCallback, useEffect } from 'react';
import type { EditorBridge } from '@10play/tentap-editor';
import { darkEditorCss } from '@10play/tentap-editor';

export type NoteEditorChromeOptions = {
  horizontalPx: number;
  bottomPaddingPx: number;
  colorScheme: 'light' | 'dark';
};

/**
 * Injects CSS + JS so Tiptap/ProseMirror gets horizontal padding reliably on iOS WebView
 * (early injectJS often runs before `.ProseMirror` exists — call again after load / retries).
 */
export function applyNoteEditorChrome(editor: EditorBridge, opts: NoteEditorChromeOptions): void {
  const { horizontalPx, bottomPaddingPx, colorScheme } = opts;

  const baseCss = `
    .ProseMirror, .tiptap {
      padding: 12px ${horizontalPx}px ${bottomPaddingPx}px !important;
      line-height: 1.55 !important;
      font-size: 16px !important;
      letter-spacing: 0.2px !important;
      box-sizing: border-box !important;
    }
    .ProseMirror p {
      margin: 0 0 10px 0;
    }
    .ProseMirror h1 {
      font-size: 26px;
      line-height: 1.15;
      margin: 18px 0 10px 0;
    }
    .ProseMirror h2 {
      font-size: 20px;
      line-height: 1.2;
      margin: 16px 0 8px 0;
    }
    .ProseMirror h3 {
      font-size: 18px;
      line-height: 1.25;
      margin: 14px 0 8px 0;
    }
    .ProseMirror ul, .ProseMirror ol {
      margin: 6px 0 10px 0;
      padding-left: 22px;
    }
    .ProseMirror li {
      margin: 4px 0;
    }
  `;

  editor.injectCSS(baseCss, 'note-base-css');
  if (colorScheme === 'dark') {
    editor.injectCSS(darkEditorCss, 'note-dark-css');
  }

  const h = horizontalPx;
  const b = bottomPaddingPx;
  editor.injectJS(`
    (function () {
      var nodes = document.querySelectorAll('.ProseMirror, .tiptap');
      nodes.forEach(function (el) {
        el.style.setProperty('padding-top', '12px', 'important');
        el.style.setProperty('padding-right', '${h}px', 'important');
        el.style.setProperty('padding-bottom', '${b}px', 'important');
        el.style.setProperty('padding-left', '${h}px', 'important');
        el.style.setProperty('box-sizing', 'border-box', 'important');
      });
    })();
  `);
}

export function useNoteEditorChrome(editor: EditorBridge, opts: NoteEditorChromeOptions): void {
  const apply = useCallback(() => {
    applyNoteEditorChrome(editor, opts);
  }, [editor, opts.horizontalPx, opts.bottomPaddingPx, opts.colorScheme]);

  useEffect(() => {
    apply();
    const timers = [50, 150, 400, 800, 1500].map((ms) => setTimeout(apply, ms));
    let ranContent = false;
    const unsub = editor._subscribeToContentUpdate(() => {
      if (!ranContent) {
        ranContent = true;
        apply();
      }
    });
    return () => {
      timers.forEach(clearTimeout);
      unsub();
    };
  }, [apply, editor]);
}

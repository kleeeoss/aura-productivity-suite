import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  placeholder as cmPlaceholder,
} from '@codemirror/view';
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownKeymap } from '@codemirror/lang-markdown';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write note in Markdown...',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const baseTheme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '0.95rem',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'var(--font-mono, monospace)',
      },
      '.cm-content': {
        caretColor: 'var(--accent-primary, #6366f1)',
        padding: '16px',
        lineHeight: '1.6',
        color: 'var(--text-primary, #f8fafc)',
      },
      '.cm-gutters': {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        color: 'var(--text-secondary, #94a3b8)',
        borderRight: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: 'var(--text-primary, #f8fafc)',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: 'var(--accent-primary, #6366f1)',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'rgba(99, 102, 241, 0.3) !important',
      },
    });

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !isUpdatingRef.current) {
        const docString = update.state.doc.toString();
        onChange(docString);
      }
    });

    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        markdown(),
        baseTheme,
        cmPlaceholder(placeholder),
        keymap.of([indentWithTab, ...markdownKeymap, ...defaultKeymap, ...historyKeymap]),
        updateListener,
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Initialize once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update doc if value prop changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      isUpdatingRef.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: value,
        },
      });
      isUpdatingRef.current = false;
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`editor-pane ${className}`}
      style={{
        height: '100%',
        minWidth: 0,
        overflow: 'hidden',
        background: 'var(--glass-bg)',
        borderRadius: '8px',
        border: '1px solid var(--glass-border)',
      }}
    />
  );
};

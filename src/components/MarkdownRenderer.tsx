import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Info, Lightbulb, AlertTriangle, AlertOctagon } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { toggleTaskInMarkdown } from '../utils/markdownUtils';

export interface MarkdownRendererProps {
  content: string;
  vaultRoot?: string;
  onNavigateWikiLink?: (noteTitleOrPath: string) => void;
  onContentChange?: (newContent: string) => void;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  vaultRoot,
  onNavigateWikiLink,
  onContentChange,
  className = '',
}) => {
  let checkboxCount = 0;

  // Pre-process Wiki-links: [[Target Note]] or [[Target Note|Custom Alias]]
  const processedContent = useMemo(() => {
    if (!content) return '';
    return content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
      const cleanTarget = target.trim();
      const label = (alias || cleanTarget).trim();
      return `[${label}](#wikilink:${encodeURIComponent(cleanTarget)})`;
    });
  }, [content]);

  // Convert local image src using Tauri convertFileSrc if available
  const resolveImageSrc = (src?: string) => {
    if (!src) return '';
    if (
      src.startsWith('http://') ||
      src.startsWith('https://') ||
      src.startsWith('data:') ||
      src.startsWith('blob:') ||
      src.startsWith('asset://')
    ) {
      return src;
    }

    if (vaultRoot && typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)) {
      try {
        const normalized = src.replace(/^\.\//, '');
        const full = `${vaultRoot.replace(/\\/g, '/')}/${normalized}`;
        return convertFileSrc(full);
      } catch {
        return src;
      }
    }
    return src;
  };

  return (
    <div className={`markdown-preview ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          input: ({ checked, ...props }) => {
            const thisIndex = checkboxCount++;
            return (
              <input
                {...props}
                type="checkbox"
                checked={checked}
                disabled={!onContentChange}
                onChange={(e) => {
                  e.stopPropagation();
                  if (onContentChange) {
                    const updated = toggleTaskInMarkdown(content, thisIndex);
                    onContentChange(updated);
                  }
                }}
              />
            );
          },
          table: ({ children, ...props }) => (
            <div className="table-container">
              <table {...props}>{children}</table>
            </div>
          ),
          a: ({ href, children, ...props }) => {
            if (href?.startsWith('#wikilink:')) {
              const target = decodeURIComponent(href.slice(10));
              return (
                <span
                  className="wiki-link"
                  role="button"
                  tabIndex={0}
                  title={`Navigate to note: ${target}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNavigateWikiLink?.(target);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onNavigateWikiLink?.(target);
                    }
                  }}
                >
                  🔗 {children}
                </span>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          img: ({ src, alt, ...props }) => (
            <img
              src={resolveImageSrc(src)}
              alt={alt || ''}
              loading="lazy"
              {...props}
              style={{
                maxWidth: '100%',
                borderRadius: '8px',
                display: 'inline-block',
                verticalAlign: 'middle',
                margin: '0.25em 0.25em',
                ...(props.style as React.CSSProperties),
              }}
            />
          ),
          blockquote: ({ children }) => {
            // Check if this blockquote is an Obsidian callout (> [!NOTE], > [!TIP], etc.)
            const textContent = extractFirstText(children);
            const calloutMatch = textContent.match(/^\[!(NOTE|TIP|WARNING|WARN|DANGER|INFO)\](?:\s+(.*))?/i);

            if (calloutMatch) {
              const rawType = calloutMatch[1].toUpperCase();
              const type = rawType === 'WARN' ? 'WARNING' : rawType;
              const customTitle = calloutMatch[2]?.trim();
              const displayTitle = customTitle || type;

              const getIcon = () => {
                switch (type) {
                  case 'TIP':
                    return <Lightbulb size={16} />;
                  case 'WARNING':
                    return <AlertTriangle size={16} />;
                  case 'DANGER':
                    return <AlertOctagon size={16} />;
                  case 'NOTE':
                  case 'INFO':
                  default:
                    return <Info size={16} />;
                }
              };

              return (
                <div className={`callout callout-${type.toLowerCase()}`}>
                  <div className="callout-title">
                    {getIcon()}
                    <span>{displayTitle}</span>
                  </div>
                  <div className="callout-content">
                    {stripCalloutHeader(children)}
                  </div>
                </div>
              );
            }

            return <blockquote>{children}</blockquote>;
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

function extractFirstText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) {
    for (const child of node) {
      const text = extractFirstText(child);
      if (text) return text;
    }
    return '';
  }
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractFirstText(props.children);
  }
  return '';
}

function stripCalloutHeader(node: React.ReactNode): React.ReactNode {
  if (typeof node === 'string') {
    return node.replace(/^\[!(NOTE|TIP|WARNING|WARN|DANGER|INFO)\][^\n]*\n?/i, '');
  }
  if (Array.isArray(node)) {
    return node.map((child, idx) => {
      if (idx === 0) {
        return stripCalloutHeader(child);
      }
      return child;
    });
  }
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    if (props.children) {
      return React.cloneElement(
        node as React.ReactElement<Record<string, unknown>>,
        undefined,
        stripCalloutHeader(props.children)
      );
    }
  }
  return node;
}

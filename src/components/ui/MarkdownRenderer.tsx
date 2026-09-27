'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  // Tokenize string by matching inline patterns
  // 1. Links: [text](url)
  // 2. Bold: **text** or __text__
  // 3. Strikethrough: ~~text~~
  // 4. Underline: <u>text</u>
  // 5. Code: `text`
  // 6. Highlight: ==text==
  // 7. Italic: *text* or _text_

  const renderInline = (text: string): React.ReactNode[] => {
    // Regex for all inline patterns
    const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|__.*?__|~~.*?~~|<u>.*?<\/u>|`.*?`|==.*?==|\*.*?\*|_.*?_)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Link: [text](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const [, label, url] = linkMatch;
        return (
          <a
            key={index}
            href={url.startsWith('http') || url.startsWith('mailto') ? url : `https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors inline-flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {label}
          </a>
        );
      }

      // Bold: **text** or __text__
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        return (
          <strong key={index} className="font-bold text-text-main">
            {renderInline(part.slice(2, -2))}
          </strong>
        );
      }

      // Strikethrough: ~~text~~
      if (part.startsWith('~~') && part.endsWith('~~')) {
        return (
          <s key={index} className="line-through text-text-muted">
            {renderInline(part.slice(2, -2))}
          </s>
        );
      }

      // Underline: <u>text</u>
      if (part.startsWith('<u>') && part.endsWith('</u>')) {
        return (
          <u key={index} className="underline underline-offset-2">
            {renderInline(part.slice(3, -4))}
          </u>
        );
      }

      // Inline code: `text`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={index}
            className="bg-black/40 border border-white/10 text-emerald-300 px-1.5 py-0.5 rounded text-[0.88em] font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Highlight: ==text==
      if (part.startsWith('==') && part.endsWith('==')) {
        return (
          <mark
            key={index}
            className="bg-amber-400/25 text-amber-200 px-1 py-0.5 rounded text-[0.95em]"
          >
            {renderInline(part.slice(2, -2))}
          </mark>
        );
      }

      // Italic: *text* or _text_
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
        return (
          <em key={index} className="italic text-text-main/90">
            {renderInline(part.slice(1, -1))}
          </em>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return <span className={className}>{renderInline(content)}</span>;
}

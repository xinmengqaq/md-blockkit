import DOMPurify from 'dompurify'

import { sanitizeAuthorHtml } from '@/html/authorHtml'
import { inlineHtmlNodeToMarkdown } from '@/html/inlineMarkdown'
import { parseMarkdownToBlocks } from '@/markdown/parseMarkdown'
import { createParagraphBlock } from '@/model/blockModel'
import type { EditorBlock } from '@/model/types'

type ClipboardSource = Pick<DataTransfer, 'getData' | 'types'>

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const htmlToMarkdown = (html: string) => {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a',
      'b',
      'blockquote',
      'br',
      'code',
      'col',
      'colgroup',
      'del',
      'div',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'i',
      'li',
      'ol',
      'p',
      'pre',
      's',
      'span',
      'strong',
      'table',
      'tbody',
      'td',
      'th',
      'thead',
      'tr',
      'u',
      'ul',
    ],
    ALLOWED_ATTR: ['href', 'style', 'rowspan', 'colspan'],
  })
  const document = new DOMParser().parseFromString(clean, 'text/html')
  const blockToMarkdown = (element: Element): string => {
    const tag = element.tagName.toLowerCase()
    if (tag === 'table') return sanitizeAuthorHtml(element.outerHTML)
    if (/^h[1-4]$/.test(tag)) {
      return `${'#'.repeat(Number(tag[1]))} ${inlineHtmlNodeToMarkdown(element)}`
    }
    if (tag === 'blockquote') {
      return inlineHtmlNodeToMarkdown(element)
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    }
    if (tag === 'pre') return `\`\`\`\n${element.textContent ?? ''}\n\`\`\``
    if (tag === 'ul' || tag === 'ol') {
      return Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .map(
          (child, index) =>
            `${tag === 'ol' ? `${index + 1}.` : '-'} ${inlineHtmlNodeToMarkdown(child)}`,
        )
        .join('\n')
    }
    return inlineHtmlNodeToMarkdown(element)
  }
  return Array.from(document.body.children).map(blockToMarkdown).join('\n\n')
}

const plainTextToBlocks = (text: string): EditorBlock[] =>
  text
    .trim()
    .split(/\r?\n\s*\r?\n/)
    .filter(Boolean)
    .map((paragraph) => ({
      ...createParagraphBlock(),
      html: paragraph.split(/\r?\n/).map(escapeHtml).join('<br>'),
    }))

const looksLikeMarkdown = (text: string) =>
  /(^|\n)\s*(?:#{1,4}\s|[-*+]\s|\d+[.)]\s|>\s|```|!\[[^\]]*\]\(|\|[^\n]+\|)/.test(
    text,
  )

export const getClipboardBlocks = (clipboard: ClipboardSource) => {
  const types = Array.from(clipboard.types)
  if (types.includes('text/markdown')) {
    const markdown = clipboard.getData('text/markdown').trim()
    if (markdown) return parseMarkdownToBlocks(markdown)
  }
  if (types.includes('text/html')) {
    const markdown = htmlToMarkdown(clipboard.getData('text/html')).trim()
    if (markdown) return parseMarkdownToBlocks(markdown)
  }
  const text = clipboard.getData('text/plain')
  if (text.trim() && looksLikeMarkdown(text)) return parseMarkdownToBlocks(text)
  return text.trim() ? plainTextToBlocks(text) : []
}

import { sanitizeAuthorHtml } from '@/html/authorHtml'
import type { MarkdownNode } from './ast'

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const renderInlineNode = (node: MarkdownNode): string => {
  switch (node.type) {
    case 'text':
      return escapeHtml(node.value ?? '')
    case 'strong':
      return `<strong>${inlineNodesToHtml(node.children)}</strong>`
    case 'emphasis':
      return `<em>${inlineNodesToHtml(node.children)}</em>`
    case 'delete':
      return `<s>${inlineNodesToHtml(node.children)}</s>`
    case 'inlineCode':
      return `<code>${escapeHtml(node.value ?? '')}</code>`
    case 'link':
      return `<a href="${escapeHtml(node.url ?? '')}">${inlineNodesToHtml(node.children)}</a>`
    case 'break':
      return '<br>'
    case 'html':
      return sanitizeAuthorHtml(node.value ?? '')
    case 'image':
      return escapeHtml(node.alt ?? node.url ?? '')
    default:
      return node.children
        ? inlineNodesToHtml(node.children)
        : escapeHtml(node.value ?? '')
  }
}

const renderSafeInlineWrapper = (
  openingTag: string,
  tagName: string,
  content: string,
) => {
  const clean = sanitizeAuthorHtml(`${openingTag}</${tagName}>`)
  const document = new DOMParser().parseFromString(clean, 'text/html')
  const wrapper = document.body.firstElementChild
  if (!wrapper || wrapper.tagName.toLowerCase() !== tagName) return content
  wrapper.innerHTML = content
  return wrapper.outerHTML
}

export const inlineNodesToHtml = (nodes: MarkdownNode[] = []): string => {
  let html = ''
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    const opening =
      node.type === 'html' ? node.value?.match(/^<(span|u)\b[^>]*>$/i) : null
    if (!opening) {
      html += renderInlineNode(node)
      continue
    }

    const tagName = opening[1].toLowerCase()
    let depth = 1
    let closingIndex = index + 1
    for (; closingIndex < nodes.length; closingIndex += 1) {
      const value =
        nodes[closingIndex].type === 'html' ? nodes[closingIndex].value : ''
      if (value?.match(new RegExp(`^<${tagName}\\b[^>]*>$`, 'i'))) depth += 1
      if (value?.match(new RegExp(`^</${tagName}>$`, 'i'))) depth -= 1
      if (depth === 0) break
    }
    if (depth !== 0) {
      html += renderInlineNode(node)
      continue
    }

    html += renderSafeInlineWrapper(
      node.value ?? '',
      tagName,
      inlineNodesToHtml(nodes.slice(index + 1, closingIndex)),
    )
    index = closingIndex
  }
  return html
}

export const nodeText = (node: MarkdownNode): string =>
  node.value ?? node.alt ?? node.children?.map(nodeText).join('') ?? ''

export const escapeMarkdownHtml = escapeHtml

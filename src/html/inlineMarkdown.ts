import { sanitizeAuthorHtml } from '@/html/authorHtml'

export const inlineHtmlNodeToMarkdown = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }
  if (!(node instanceof HTMLElement)) {
    return ''
  }

  const content = Array.from(node.childNodes)
    .map(inlineHtmlNodeToMarkdown)
    .join('')
  switch (node.tagName.toLowerCase()) {
    case 'strong':
    case 'b':
      return `**${content}**`
    case 'em':
    case 'i':
      return `*${content}*`
    case 'u':
      return `<u>${content}</u>`
    case 's':
    case 'del':
      return `~~${content}~~`
    case 'code':
      return `\`${content}\``
    case 'a':
      return `[${content}](${node.getAttribute('href') ?? ''})`
    case 'br':
      return '  \n'
    case 'span':
      return sanitizeAuthorHtml(node.outerHTML)
    default:
      return content
  }
}

export const inlineHtmlToMarkdown = (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html')
  return Array.from(document.body.childNodes)
    .map(inlineHtmlNodeToMarkdown)
    .join('')
}

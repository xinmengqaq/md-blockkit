import { sanitizeAuthorHtml } from '@/html/authorHtml'
import {
  closestWithin,
  elementFromNode,
  type EditorSelection,
} from './selectionRange'

const inlineFormatSelector = 'strong,b,em,i,u,s,del,code,a,span'

const wrapRange = (range: Range, wrapper: HTMLElement) => {
  const fragment = range.extractContents()
  wrapper.append(fragment)
  range.insertNode(wrapper)
  range.selectNodeContents(wrapper)
}

const unwrap = (element: HTMLElement) => {
  const parent = element.parentNode
  if (!parent) return
  while (element.firstChild) parent.insertBefore(element.firstChild, element)
  element.remove()
}

export const toggleInlineTag = (
  selection: EditorSelection,
  tagName: 'strong' | 'em' | 'u' | 'del' | 'code',
) => {
  const aliases: Record<typeof tagName, string> = {
    strong: 'strong,b',
    em: 'em,i',
    u: 'u',
    del: 'del,s',
    code: 'code',
  }
  const existing = closestWithin(
    selection.range.startContainer,
    aliases[tagName],
    selection.editable,
  )
  if (existing && existing.contains(selection.range.endContainer)) {
    unwrap(existing)
  } else {
    wrapRange(selection.range, document.createElement(tagName))
  }
}

export const normalizeEditorLink = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
  try {
    const protocol = new URL(candidate, window.location.origin).protocol
    return ['http:', 'https:', 'mailto:'].includes(protocol) ? candidate : null
  } catch {
    return null
  }
}

export const setSelectionLink = (selection: EditorSelection, href: string) => {
  const link = document.createElement('a')
  link.setAttribute('href', href)
  wrapRange(selection.range, link)
}

export const removeSelectionLink = (selection: EditorSelection) => {
  const link = closestWithin(
    selection.range.startContainer,
    'a',
    selection.editable,
  )
  if (link && link.contains(selection.range.endContainer)) unwrap(link)
}

const createSanitizedSpan = (
  property: 'color' | 'background-color',
  value: string,
) => {
  const clean = sanitizeAuthorHtml(`<span style="${property}:${value}"></span>`)
  const document = new DOMParser().parseFromString(clean, 'text/html')
  return document.body.firstElementChild as HTMLSpanElement | null
}

export const setSelectionStyle = (
  selection: EditorSelection,
  property: 'color' | 'background-color',
  value: string,
) => {
  const span = createSanitizedSpan(property, value)
  if (span) wrapRange(selection.range, span)
}

export const clearSelectionFormatting = (selection: EditorSelection) => {
  const ancestors: HTMLElement[] = []
  let current = elementFromNode(selection.range.startContainer)
  while (current && current !== selection.editable) {
    if (
      current.matches(inlineFormatSelector) &&
      current.contains(selection.range.endContainer)
    ) {
      ancestors.push(current)
    }
    current = current.parentElement
  }
  ancestors.forEach(unwrap)

  const fragment = selection.range.extractContents()
  Array.from(fragment.querySelectorAll<HTMLElement>(inlineFormatSelector))
    .reverse()
    .forEach(unwrap)
  const nodes = Array.from(fragment.childNodes)
  selection.range.insertNode(fragment)
  if (nodes.length > 0) {
    selection.range.setStartBefore(nodes[0])
    selection.range.setEndAfter(nodes[nodes.length - 1])
  }
  selection.editable
    .querySelectorAll<HTMLElement>(inlineFormatSelector)
    .forEach((element) => {
      if (!element.textContent) element.remove()
    })
}

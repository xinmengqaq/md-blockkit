import type { VirtualElement } from '@floating-ui/react-dom'

export type EditorSelection = {
  range: Range
  editable: HTMLElement
  start: number
  end: number
}

const elementFromNode = (node: Node): HTMLElement | null =>
  node instanceof HTMLElement ? node : node.parentElement

export const closestWithin = (
  node: Node,
  selector: string,
  boundary: HTMLElement,
) => {
  const element = elementFromNode(node)?.closest<HTMLElement>(selector)
  return element && boundary.contains(element) ? element : null
}

export const getEditorSelection = (
  editor: HTMLElement | null,
): EditorSelection | null => {
  const selection = window.getSelection()
  if (
    !editor ||
    !selection ||
    selection.rangeCount === 0 ||
    selection.isCollapsed
  ) {
    return null
  }
  const range = selection.getRangeAt(0)
  if (
    !editor.contains(range.startContainer) ||
    !editor.contains(range.endContainer)
  ) {
    return null
  }
  const startEditable = closestWithin(
    range.startContainer,
    '[data-editor-input]',
    editor,
  )
  const endEditable = closestWithin(
    range.endContainer,
    '[data-editor-input]',
    editor,
  )
  if (!startEditable || startEditable !== endEditable) {
    return null
  }
  const before = range.cloneRange()
  before.selectNodeContents(startEditable)
  before.setEnd(range.startContainer, range.startOffset)
  const start = before.toString().length
  return {
    range: range.cloneRange(),
    editable: startEditable,
    start,
    end: start + range.toString().length,
  }
}

export const splitEditorAtCaret = (editable: HTMLElement) => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
    return null
  }
  const range = selection.getRangeAt(0)
  if (!editable.contains(range.startContainer)) return null
  const before = range.cloneRange()
  before.selectNodeContents(editable)
  before.setEnd(range.startContainer, range.startOffset)
  const after = range.cloneRange()
  after.selectNodeContents(editable)
  after.setStart(range.startContainer, range.startOffset)
  const toHtml = (fragment: DocumentFragment) => {
    const container = document.createElement('div')
    container.append(fragment)
    return container.innerHTML
  }
  return {
    beforeHtml: toHtml(before.cloneContents()),
    afterHtml: toHtml(after.cloneContents()),
  }
}

export const pointAtOffset = (editable: HTMLElement, offset: number) => {
  const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT)
  let remaining = offset
  let node = walker.nextNode()
  while (node) {
    const length = node.textContent?.length ?? 0
    if (remaining <= length) return { node, offset: remaining }
    remaining -= length
    node = walker.nextNode()
  }
  return { node: editable, offset: editable.childNodes.length }
}

export const resolveEditorSelection = (
  selection: EditorSelection,
): EditorSelection => {
  const start = pointAtOffset(selection.editable, selection.start)
  const end = pointAtOffset(selection.editable, selection.end)
  const range = document.createRange()
  range.setStart(start.node, start.offset)
  range.setEnd(end.node, end.offset)
  return { ...selection, range }
}

export const createRangeReference = (
  selection: EditorSelection,
): VirtualElement => ({
  contextElement: selection.editable,
  getBoundingClientRect: () => {
    const current = resolveEditorSelection(selection).range
    return typeof current.getBoundingClientRect === 'function'
      ? current.getBoundingClientRect()
      : selection.editable.getBoundingClientRect()
  },
})

export const commitEditorSelection = (selection: EditorSelection) => {
  selection.editable.dispatchEvent(new Event('input', { bubbles: true }))
  selection.editable.focus()
  const browserSelection = window.getSelection()
  browserSelection?.removeAllRanges()
  selection.range.collapse(false)
  browserSelection?.addRange(selection.range)
}

export { elementFromNode }

import {
  closestWithin,
  getEditorSelection,
  pointAtOffset,
} from './selectionRange'

const wordCharacter = /[\p{L}\p{N}_-]/u
const isWordCharacter = (character: string | undefined) =>
  character !== undefined && wordCharacter.test(character)

type CaretDocument = Document & {
  caretPositionFromPoint?: (
    x: number,
    y: number,
  ) => { offsetNode: Node; offset: number } | null
  caretRangeFromPoint?: (x: number, y: number) => Range | null
}

const getCaretRangeAtPoint = (x: number, y: number) => {
  const caretDocument = document as CaretDocument
  const range = caretDocument.caretRangeFromPoint?.(x, y)
  if (range) return range

  const position = caretDocument.caretPositionFromPoint?.(x, y)
  if (!position) return null
  const fallback = document.createRange()
  fallback.setStart(position.offsetNode, position.offset)
  fallback.collapse(true)
  return fallback
}

export const selectEditorWordAtPoint = (
  editor: HTMLElement | null,
  x: number,
  y: number,
) => {
  const caret = getCaretRangeAtPoint(x, y)
  if (!editor || !caret || caret.startContainer.nodeType !== Node.TEXT_NODE) {
    return null
  }

  const textNode = caret.startContainer as Text
  const editable = closestWithin(textNode, '[data-editor-input]', editor)
  if (!editable || !editable.contains(textNode)) return null

  const text = textNode.data
  if (!text) return null
  let offset = Math.min(caret.startOffset, text.length)
  if (!isWordCharacter(text[offset]) && offset > 0) offset -= 1
  if (!isWordCharacter(text[offset])) return null

  let start = offset
  let end = offset + 1
  while (start > 0 && isWordCharacter(text[start - 1])) start -= 1
  while (end < text.length && isWordCharacter(text[end])) end += 1

  const browserSelection = window.getSelection()
  if (!browserSelection) return null

  const focus = offset - start <= end - offset ? end : start
  const range = document.createRange()
  range.setStart(textNode, Math.min(offset, focus))
  range.setEnd(textNode, Math.max(offset, focus))
  browserSelection.removeAllRanges()
  if (typeof browserSelection.setBaseAndExtent === 'function') {
    browserSelection.setBaseAndExtent(textNode, offset, textNode, focus)
  } else {
    browserSelection.addRange(range)
  }
  return getEditorSelection(editor)
}

const pendingCaretFrames = new WeakMap<HTMLElement, number>()

export const preserveEditorCaretAfterUpdate = (
  editable: HTMLElement,
  update: () => void,
) => {
  const selection = window.getSelection()
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null
  const canRestore =
    selection?.isCollapsed && range && editable.contains(range.startContainer)
  let offset = 0
  if (canRestore) {
    const before = range.cloneRange()
    before.selectNodeContents(editable)
    before.setEnd(range.startContainer, range.startOffset)
    offset = before.toString().length
  }

  update()
  if (!canRestore) return

  const pendingFrame = pendingCaretFrames.get(editable)
  if (pendingFrame !== undefined) cancelAnimationFrame(pendingFrame)
  const frame = requestAnimationFrame(() => {
    pendingCaretFrames.delete(editable)
    if (!editable.isConnected || document.activeElement !== editable) return
    const point = pointAtOffset(editable, offset)
    const nextRange = document.createRange()
    nextRange.setStart(point.node, point.offset)
    nextRange.collapse(true)
    const nextSelection = window.getSelection()
    nextSelection?.removeAllRanges()
    nextSelection?.addRange(nextRange)
  })
  pendingCaretFrames.set(editable, frame)
}

import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import type { BlockEditorModel } from '../session/useBlockEditorModel'
import {
  commitEditorSelection,
  getEditorSelection,
  resolveEditorSelection,
  type EditorSelection,
} from './selectionRange'
import { selectEditorWordAtPoint } from './caret'
import { normalizeEditorLink, setSelectionLink } from './inlineFormat'

const isSameTextSelection = (
  current: EditorSelection | null,
  next: EditorSelection | null,
) =>
  current?.editable === next?.editable &&
  current?.start === next?.start &&
  current?.end === next?.end

export const useTextToolbar = (model: BlockEditorModel, readOnly: boolean) => {
  const [textSelection, setTextSelection] = useState<EditorSelection | null>(
    null,
  )
  const textSelectionRef = useRef<EditorSelection | null>(null)
  const pendingContextSelectionRef = useRef<EditorSelection | null>(null)
  textSelectionRef.current = textSelection

  const dismissTextToolbar = useCallback(() => {
    pendingContextSelectionRef.current = null
    textSelectionRef.current = null
    setTextSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  useEffect(() => {
    if (readOnly) {
      dismissTextToolbar()
      return
    }
    const updateTextSelection = () => {
      const next = getEditorSelection(model.editorRef.current)
      if (!next && pendingContextSelectionRef.current) return
      textSelectionRef.current = next
      setTextSelection((current) =>
        isSameTextSelection(current, next) ? current : next,
      )
      if (next) {
        model.setInsertAfterId(null)
        model.setToolbarBlockId(null)
        model.setShortcutDrawerOpen(false)
      }
    }
    document.addEventListener('selectionchange', updateTextSelection)
    return () =>
      document.removeEventListener('selectionchange', updateTextSelection)
  }, [dismissTextToolbar, model, readOnly])

  const runTextCommand = (command: (selection: EditorSelection) => void) => {
    const selection = textSelectionRef.current
    if (!selection) return
    pendingContextSelectionRef.current = null
    const currentSelection = resolveEditorSelection(selection)
    command(currentSelection)
    commitEditorSelection(currentSelection)
    textSelectionRef.current = null
    setTextSelection(null)
  }

  const setTextLink = (value: string) => {
    const href = normalizeEditorLink(value)
    if (!href) return false
    runTextCommand((selection) => setSelectionLink(selection, href))
    return true
  }

  const getTextToolbarSelection = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (readOnly) return null
    const target = event.target as HTMLElement
    const editable = target.closest<HTMLElement>('[data-editor-input]')
    if (
      !editable ||
      editable.matches('textarea') ||
      editable.hasAttribute('data-table-cell-input')
    ) {
      return null
    }
    const currentSelection = getEditorSelection(model.editorRef.current)
    return (
      (currentSelection?.editable === editable ? currentSelection : null) ??
      selectEditorWordAtPoint(
        model.editorRef.current,
        event.clientX,
        event.clientY,
      )
    )
  }

  const showTextToolbar = (selection: EditorSelection) => {
    model.setInsertAfterId(null)
    model.setToolbarBlockId(null)
    model.setShortcutDrawerOpen(false)
    textSelectionRef.current = selection
    setTextSelection(selection)
  }

  const openTextToolbarOnRightMouseDown = (
    event: ReactMouseEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 2) return
    const selection = getTextToolbarSelection(event)
    if (!selection) return
    event.preventDefault()
    pendingContextSelectionRef.current = selection
    showTextToolbar(selection)
  }

  const openTextToolbarOnContextMenu = (
    event: ReactMouseEvent<HTMLDivElement>,
  ) => {
    const target = event.target as HTMLElement
    const editable = target.closest<HTMLElement>('[data-editor-input]')
    if (
      !editable ||
      editable.matches('textarea') ||
      editable.hasAttribute('data-table-cell-input')
    )
      return
    event.preventDefault()
    const selection = getTextToolbarSelection(event)
    const fallbackSelection = selection ?? pendingContextSelectionRef.current
    if (fallbackSelection) showTextToolbar(fallbackSelection)
    const { clientX, clientY } = event
    requestAnimationFrame(() => {
      const next =
        fallbackSelection ??
        selectEditorWordAtPoint(model.editorRef.current, clientX, clientY)
      pendingContextSelectionRef.current = null
      if (next) showTextToolbar(next)
    })
  }

  return {
    textSelection,
    textSelectionRef,
    dismissTextToolbar,
    runTextCommand,
    setTextLink,
    openTextToolbarOnRightMouseDown,
    openTextToolbarOnContextMenu,
  }
}

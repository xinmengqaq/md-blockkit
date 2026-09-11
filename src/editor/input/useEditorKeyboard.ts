import type { KeyboardEvent, MutableRefObject } from 'react'

import { isBlockEmpty } from '@/model/blockModel'
import { moveBlock, removeBlock } from '@/model/commands'
import type { EditorBlock } from '@/model/types'
import type { BlockEditorModel } from '../session/useBlockEditorModel'
import { splitEditorAtCaret } from './selectionRange'
import { toggleInlineTag } from './inlineFormat'
import type { EditorSelection } from './selectionRange'

export const createEditorKeyboardHandlers = (
  model: BlockEditorModel,
  readOnly: boolean,
  textSelectionRef: MutableRefObject<EditorSelection | null>,
  runTextCommand: (command: (selection: EditorSelection) => void) => void,
  setTextLink: (value: string) => boolean,
  onSaveShortcut?: () => void,
) => {
  const blockKeyDown =
    (block: EditorBlock) => (event: KeyboardEvent<HTMLElement>) => {
      const modifier = event.ctrlKey || event.metaKey
      if (modifier && !event.altKey && textSelectionRef.current) {
        const key = event.key.toLowerCase()
        const format =
          key === 'b'
            ? 'strong'
            : key === 'i'
              ? 'em'
              : key === 'u'
                ? 'u'
                : key === 'x' && event.shiftKey
                  ? 'del'
                  : null
        if (format) {
          event.preventDefault()
          runTextCommand((selection) => toggleInlineTag(selection, format))
          return
        }
        if (key === 'k') {
          event.preventDefault()
          const value = window.prompt('输入链接地址')
          if (value !== null && !setTextLink(value)) {
            window.alert('链接仅支持 http、https、mailto、站内路径或锚点')
          }
          return
        }
      }
      if (
        !readOnly &&
        event.key === 'Enter' &&
        !event.nativeEvent.isComposing &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        (block.type === 'paragraph' ||
          block.type === 'heading' ||
          block.type === 'quote')
      ) {
        const split = splitEditorAtCaret(event.currentTarget)
        if (!split) return
        event.preventDefault()
        model.splitTextBlock(block.id, split.beforeHtml, split.afterHtml)
      }
    }

  const editorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return
    if (event.key === 'Escape' && model.shortcutDrawerOpen) {
      event.preventDefault()
      model.setShortcutDrawerOpen(false)
      return
    }
    const target = event.target as HTMLElement
    if (
      model.selectedBlockIds.length &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !event.shiftKey &&
      (event.key === 'Backspace' || event.key === 'Delete')
    ) {
      event.preventDefault()
      model.deleteSelectedBlocks()
      return
    }
    const editorInput = target.closest<HTMLElement>('[data-editor-input]')
    const modifier = event.ctrlKey || event.metaKey
    const key = event.key.toLowerCase()
    if (
      editorInput &&
      modifier &&
      key === 's' &&
      !event.altKey &&
      !event.shiftKey &&
      onSaveShortcut
    ) {
      event.preventDefault()
      onSaveShortcut?.()
      return
    }
    if (editorInput && modifier && !event.altKey && key === 'z') {
      event.preventDefault()
      model.applyHistory(event.shiftKey ? 'redo' : 'undo')
      return
    }
    if (
      editorInput &&
      modifier &&
      !event.altKey &&
      key === 'y' &&
      !event.shiftKey
    ) {
      event.preventDefault()
      model.applyHistory('redo')
      return
    }
    const blockId =
      target.closest<HTMLElement>('[data-block-id]')?.dataset.blockId
    if (!blockId) return
    if (!editorInput) return
    if (
      event.key === 'Backspace' &&
      !modifier &&
      !event.altKey &&
      !event.shiftKey
    ) {
      const current = model.blocksRef.current
      const index = current.findIndex((block) => block.id === blockId)
      const block = current[index]
      const selection = window.getSelection()
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null
      const caretInsideInput =
        selection?.isCollapsed &&
        range &&
        editorInput.contains(range.startContainer)
      const isEmptyTextBlock =
        block &&
        (block.type === 'paragraph' ||
          block.type === 'heading' ||
          block.type === 'quote') &&
        isBlockEmpty(block)
      if (index > 0 && caretInsideInput && isEmptyTextBlock) {
        event.preventDefault()
        model.commit(removeBlock(current, blockId))
        model.focusBlock(current[index - 1].id)
        return
      }
    }
    if (
      event.altKey &&
      !modifier &&
      (event.key === 'ArrowUp' || event.key === 'ArrowDown')
    ) {
      event.preventDefault()
      model.commit(
        moveBlock(
          model.blocksRef.current,
          blockId,
          event.key === 'ArrowUp' ? 'up' : 'down',
        ),
      )
      model.focusBlock(blockId)
    }
  }

  return { blockKeyDown, editorKeyDown }
}

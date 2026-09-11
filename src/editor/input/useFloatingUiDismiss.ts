import { type MutableRefObject, useCallback, useEffect } from 'react'

import type { BlockEditorModel } from '../session/useBlockEditorModel'
import type { EditorSelection } from './selectionRange'

const floatingUiInteractiveSelector = [
  '.block-editor__text-toolbar',
  '.block-editor__block-toolbar',
  '.block-editor__insert-menu',
  '.block-editor__shortcut-drawer',
  '.block-editor__table-menu',
  '.block-editor__image-toolbar',
  '.block-editor__block-handle',
  '.block-editor__insert-button',
  '.block-editor__utility-bar',
].join(', ')

export const useFloatingUiDismiss = (
  model: BlockEditorModel,
  textSelection: EditorSelection | null,
  textSelectionRef: MutableRefObject<EditorSelection | null>,
  dismissTextToolbar: () => void,
) => {
  const dismissFloatingUi = useCallback(() => {
    if (textSelectionRef.current) dismissTextToolbar()
    model.setToolbarBlockId(null)
    model.setInsertAfterId(null)
    model.setShortcutDrawerOpen(false)
  }, [dismissTextToolbar, model, textSelectionRef])

  useEffect(() => {
    const hasOpenFloatingUi = Boolean(
      textSelection ||
      model.toolbarBlockId ||
      model.insertAfterId ||
      model.shortcutDrawerOpen,
    )
    if (!hasOpenFloatingUi) return
    const closeOnPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest(floatingUiInteractiveSelector)) return
      dismissFloatingUi()
    }
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      dismissFloatingUi()
    }
    document.addEventListener('pointerdown', closeOnPointerDown, true)
    document.addEventListener('keydown', closeOnEscape, true)
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown, true)
      document.removeEventListener('keydown', closeOnEscape, true)
    }
  }, [dismissFloatingUi, model, textSelection])

  return dismissFloatingUi
}

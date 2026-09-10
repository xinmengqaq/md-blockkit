import type { ClipboardEvent } from 'react'

import type { BlockEditorModel } from '../session/useBlockEditorModel'
import { getClipboardBlocks } from './clipboard'

export const createPasteBlocksHandler = (
  model: BlockEditorModel,
  readOnly: boolean,
  onImagePasteRejected?: () => void,
) => {
  return (event: ClipboardEvent<HTMLDivElement>) => {
    if (readOnly) return
    const containsImage =
      Array.from(event.clipboardData.items ?? []).some(
        (item) => item.kind === 'file' && item.type.startsWith('image/'),
      ) ||
      Array.from(event.clipboardData.files ?? []).some((file) =>
        file.type.startsWith('image/'),
      )
    if (containsImage) {
      event.preventDefault()
      onImagePasteRejected?.()
      return
    }
    const target = event.target as HTMLElement
    const selection = window.getSelection()
    const editorInput = target.closest<HTMLElement>('[data-editor-input]')
    if (
      editorInput &&
      selection &&
      !selection.isCollapsed &&
      editorInput.contains(selection.anchorNode)
    ) {
      return
    }
    const blockId =
      target.closest<HTMLElement>('[data-block-id]')?.dataset.blockId
    if (!blockId) return
    const pasted = getClipboardBlocks(event.clipboardData)
    if (!pasted.length) return
    event.preventDefault()
    const current = model.blocksRef.current
    const index = current.findIndex((block) => block.id === blockId)
    if (index < 0) return
    model.commit([
      ...current.slice(0, index + 1),
      ...pasted,
      ...current.slice(index + 1),
    ])
    model.focusBlock(pasted[0].id)
  }
}

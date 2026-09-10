import type { BlockEditorModel } from '../session/useBlockEditorModel'
import { createEditorKeyboardHandlers } from './useEditorKeyboard'
import { useFloatingUiDismiss } from './useFloatingUiDismiss'
import { createPasteBlocksHandler } from './usePasteBlocks'
import { useTextToolbar } from './useTextToolbar'

export const useBlockEditorInteractions = (
  model: BlockEditorModel,
  readOnly: boolean,
  onSaveShortcut?: () => void,
  onImagePasteRejected?: () => void,
) => {
  const textToolbar = useTextToolbar(model, readOnly)
  const dismissFloatingUi = useFloatingUiDismiss(
    model,
    textToolbar.textSelection,
    textToolbar.textSelectionRef,
    textToolbar.dismissTextToolbar,
  )
  const { blockKeyDown, editorKeyDown } = createEditorKeyboardHandlers(
    model,
    readOnly,
    textToolbar.textSelectionRef,
    textToolbar.runTextCommand,
    textToolbar.setTextLink,
    onSaveShortcut,
  )

  return {
    textSelection: textToolbar.textSelection,
    dismissTextToolbar: textToolbar.dismissTextToolbar,
    dismissFloatingUi,
    pasteBlocks: createPasteBlocksHandler(
      model,
      readOnly,
      onImagePasteRejected,
    ),
    runTextCommand: textToolbar.runTextCommand,
    setTextLink: textToolbar.setTextLink,
    blockKeyDown,
    editorKeyDown,
    openTextToolbarOnRightMouseDown:
      textToolbar.openTextToolbarOnRightMouseDown,
    openTextToolbarOnContextMenu: textToolbar.openTextToolbarOnContextMenu,
  }
}

export type BlockEditorInteractions = ReturnType<
  typeof useBlockEditorInteractions
>

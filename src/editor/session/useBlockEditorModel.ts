import { useCallback } from 'react'

import { isBlockEmpty } from '@/model/blockModel'
import { useBlockMutations } from './useBlockMutations'
import {
  useDocumentSession,
  useExternalDocumentValue,
} from './useDocumentSession'
import { useEditorChrome } from './useEditorChrome'
import { useMultiBlockSelection } from './useMultiBlockSelection'

export const useBlockEditorModel = (
  value: string,
  onChange: (value: string) => void,
) => {
  const session = useDocumentSession(value, onChange)
  const chrome = useEditorChrome()
  const selection = useMultiBlockSelection(session)
  const mutations = useBlockMutations(session, chrome)

  session.afterEmitRef.current = (next) => {
    selection.pruneSelection(next.map((block) => block.id))
  }

  const applyExternalValue = useCallback(
    (nextValue: string) => {
      const parsed = session.applyExternalValue(nextValue)
      chrome.resetChrome()
      selection.clearBlockSelection()
      return parsed
    },
    // session/chrome/selection are hook facades; methods above are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listed methods are the used values
    [
      chrome.resetChrome,
      selection.clearBlockSelection,
      session.applyExternalValue,
    ],
  )

  const handleEditorBlur = useExternalDocumentValue({
    ...session,
    applyExternalValue,
  })

  return {
    blocks: session.blocks,
    blocksRef: session.blocksRef,
    editorRef: session.editorRef,
    lastFocusedBlockIdRef: chrome.lastFocusedBlockIdRef,
    focusedRef: session.focusedRef,
    handleEditorBlur,
    insertAfterId: chrome.insertAfterId,
    setInsertAfterId: chrome.setInsertAfterId,
    toolbarBlockId: chrome.toolbarBlockId,
    setToolbarBlockId: chrome.setToolbarBlockId,
    shortcutDrawerOpen: chrome.shortcutDrawerOpen,
    setShortcutDrawerOpen: chrome.setShortcutDrawerOpen,
    selectedBlockIds: selection.selectedBlockIds,
    selectBlock: selection.selectBlock,
    clearBlockSelection: selection.clearBlockSelection,
    deleteSelectedBlocks: selection.deleteSelectedBlocks,
    convertSelectedToParagraph: selection.convertSelectedToParagraph,
    formatSelected: selection.formatSelected,
    commit: session.commit,
    applyHistory: session.applyHistory,
    focusBlock: session.focusBlock,
    ...mutations,
  }
}

export type BlockEditorModel = ReturnType<typeof useBlockEditorModel>

export const isEmptyEditorBlock = isBlockEmpty

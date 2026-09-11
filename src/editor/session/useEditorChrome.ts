import { useCallback, useRef, useState } from 'react'

export const useEditorChrome = () => {
  const [insertAfterId, setInsertAfterId] = useState<string | null>(null)
  const [toolbarBlockId, setToolbarBlockId] = useState<string | null>(null)
  const [shortcutDrawerOpen, setShortcutDrawerOpen] = useState(false)
  const lastFocusedBlockIdRef = useRef<string | null>(null)

  const resetChrome = useCallback(() => {
    setInsertAfterId(null)
    setToolbarBlockId(null)
  }, [])

  return {
    insertAfterId,
    setInsertAfterId,
    toolbarBlockId,
    setToolbarBlockId,
    shortcutDrawerOpen,
    setShortcutDrawerOpen,
    lastFocusedBlockIdRef,
    resetChrome,
  }
}

export type EditorChrome = ReturnType<typeof useEditorChrome>

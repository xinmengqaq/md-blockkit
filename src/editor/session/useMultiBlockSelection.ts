import { useCallback, useRef, useState } from 'react'

import {
  convertSelectedBlocksToParagraph,
  formatSelectedBlocks,
  removeSelectedBlocks,
  type BulkInlineFormat,
} from '@/model/commands'
import type { DocumentSession } from './useDocumentSession'

export const useMultiBlockSelection = (session: DocumentSession) => {
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([])
  const selectionAnchorRef = useRef<string | null>(null)
  const { blocksRef, commit, emit, focusBlock } = session

  const selectBlock = useCallback(
    (blockId: string, mode: 'toggle' | 'range') => {
      const ids = blocksRef.current.map((block) => block.id)
      if (mode === 'range') {
        const anchor = selectionAnchorRef.current ?? blockId
        const start = ids.indexOf(anchor)
        const end = ids.indexOf(blockId)
        if (start < 0 || end < 0) return
        const [from, to] = start < end ? [start, end] : [end, start]
        setSelectedBlockIds(ids.slice(from, to + 1))
        return
      }
      setSelectedBlockIds((current) =>
        current.includes(blockId)
          ? current.filter((id) => id !== blockId)
          : [...current, blockId],
      )
      selectionAnchorRef.current = blockId
    },
    [blocksRef],
  )

  const clearBlockSelection = useCallback(() => {
    selectionAnchorRef.current = null
    setSelectedBlockIds([])
  }, [])

  const pruneSelection = useCallback((nextIds: Set<string> | string[]) => {
    const allowed = nextIds instanceof Set ? nextIds : new Set(nextIds)
    setSelectedBlockIds((current) =>
      current.filter((blockId) => allowed.has(blockId)),
    )
  }, [])

  const deleteSelectedBlocks = useCallback(() => {
    const selected = selectedBlockIds
    if (!selected.length) return
    const current = blocksRef.current
    const firstIndex = current.findIndex((block) => selected.includes(block.id))
    const next = removeSelectedBlocks(current, selected)
    const focusId = next[Math.min(firstIndex, next.length - 1)]?.id
    commit(next)
    clearBlockSelection()
    if (focusId) focusBlock(focusId)
  }, [blocksRef, clearBlockSelection, commit, focusBlock, selectedBlockIds])

  const convertSelectedToParagraph = useCallback(() => {
    if (!selectedBlockIds.length) return
    commit(
      convertSelectedBlocksToParagraph(blocksRef.current, selectedBlockIds),
    )
  }, [blocksRef, commit, selectedBlockIds])

  const formatSelected = useCallback(
    (tag: BulkInlineFormat) => {
      if (!selectedBlockIds.length) return
      commit(formatSelectedBlocks(blocksRef.current, selectedBlockIds, tag))
    },
    [blocksRef, commit, selectedBlockIds],
  )

  return {
    selectedBlockIds,
    setSelectedBlockIds,
    selectionAnchorRef,
    selectBlock,
    clearBlockSelection,
    pruneSelection,
    deleteSelectedBlocks,
    convertSelectedToParagraph,
    formatSelected,
    emit,
  }
}

export type MultiBlockSelection = ReturnType<typeof useMultiBlockSelection>

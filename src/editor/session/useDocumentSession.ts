import { useCallback, useEffect, useRef, useState } from 'react'

import { parseMarkdownToBlocks } from '@/markdown/parseMarkdown'
import { serializeBlocksToMarkdown } from '@/markdown/serializeMarkdown'
import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from '@/model/history'
import type { EditorBlock } from '@/model/types'

export const useDocumentSession = (
  value: string,
  onChange: (value: string) => void,
) => {
  const [blocks, setBlocks] = useState(() => parseMarkdownToBlocks(value))
  const editorRef = useRef<HTMLDivElement>(null)
  const blocksRef = useRef(blocks)
  const historyRef = useRef(createHistory(blocks))
  const focusedRef = useRef(false)
  const pendingExternalValueRef = useRef<string | null>(null)
  const onChangeRef = useRef(onChange)
  const afterEmitRef = useRef<(next: EditorBlock[]) => void>(() => {})

  onChangeRef.current = onChange

  const applyExternalValue = useCallback((nextValue: string) => {
    const parsed = parseMarkdownToBlocks(nextValue)
    blocksRef.current = parsed
    historyRef.current = createHistory(parsed)
    setBlocks(parsed)
    pendingExternalValueRef.current = null
    return parsed
  }, [])

  const emit = useCallback((next: EditorBlock[]) => {
    blocksRef.current = next
    setBlocks(next)
    onChangeRef.current(serializeBlocksToMarkdown(next))
    afterEmitRef.current(next)
  }, [])

  const commit = useCallback(
    (next: EditorBlock[]) => {
      historyRef.current = pushHistory(historyRef.current, next)
      emit(next)
    },
    [emit],
  )

  const applyHistory = useCallback(
    (direction: 'undo' | 'redo') => {
      const current = historyRef.current
      const next =
        direction === 'undo' ? undoHistory(current) : redoHistory(current)
      if (next === current) return
      historyRef.current = next
      emit(next.present)
    },
    [emit],
  )

  const focusBlock = useCallback((blockId: string) => {
    requestAnimationFrame(() => {
      Array.from(
        editorRef.current?.querySelectorAll<HTMLElement>('[data-block-id]') ??
          [],
      )
        .find((element) => element.dataset.blockId === blockId)
        ?.querySelector<HTMLElement>('[data-editor-input]')
        ?.focus()
    })
  }, [])

  return {
    blocks,
    setBlocks,
    blocksRef,
    editorRef,
    focusedRef,
    pendingExternalValueRef,
    applyExternalValue,
    emit,
    commit,
    applyHistory,
    focusBlock,
    value,
    afterEmitRef,
  }
}

export type DocumentSession = ReturnType<typeof useDocumentSession>

export const useExternalDocumentValue = (session: DocumentSession) => {
  const {
    applyExternalValue,
    blocksRef,
    editorRef,
    focusedRef,
    pendingExternalValueRef,
    value,
  } = session

  useEffect(() => {
    if (value === serializeBlocksToMarkdown(blocksRef.current)) {
      pendingExternalValueRef.current = null
      return
    }
    if (focusedRef.current) {
      pendingExternalValueRef.current = value
      return
    }
    applyExternalValue(value)
  }, [
    applyExternalValue,
    blocksRef,
    focusedRef,
    pendingExternalValueRef,
    value,
  ])

  const handleEditorBlur = useCallback(() => {
    const stillFocused = Boolean(
      editorRef.current?.contains(document.activeElement),
    )
    focusedRef.current = stillFocused
    if (stillFocused || pendingExternalValueRef.current === null) return
    applyExternalValue(pendingExternalValueRef.current)
  }, [applyExternalValue, editorRef, focusedRef, pendingExternalValueRef])

  return handleEditorBlur
}

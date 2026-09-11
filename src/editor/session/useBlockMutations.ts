import { useCallback } from 'react'

import { createParagraphBlock } from '@/model/blockModel'
import {
  convertBlockType,
  createBlockByType,
  duplicateBlock,
  exitListItem,
  insertBlockAfter,
  moveBlock,
  removeBlock,
  updateBlock,
} from '@/model/commands'
import type { EditorBlock, ImageBlock } from '@/model/types'
import type { BlockInsertChoice } from '../chrome/BlockInsertMenu'
import { getMarkdownBlockShortcut } from '../input/keyboard'
import type { EditorChrome } from './useEditorChrome'
import type { DocumentSession } from './useDocumentSession'

export const useBlockMutations = (
  session: DocumentSession,
  chrome: EditorChrome,
) => {
  const { blocksRef, commit, focusBlock } = session
  const { setInsertAfterId } = chrome

  const replaceBlock = useCallback(
    (block: EditorBlock) =>
      commit(updateBlock(blocksRef.current, block.id, block)),
    [blocksRef, commit],
  )

  const insertBlock = useCallback(
    (choice: BlockInsertChoice) => {
      if (!chrome.insertAfterId) return
      let block = createBlockByType(choice.type)
      if (block.type === 'heading' && choice.level) {
        block = { ...block, level: choice.level }
      }
      commit(insertBlockAfter(blocksRef.current, chrome.insertAfterId, block))
      setInsertAfterId(null)
      focusBlock(block.id)
    },
    [blocksRef, chrome.insertAfterId, commit, focusBlock, setInsertAfterId],
  )

  const insertToolbarBlock = useCallback(
    (blockId: string, type: EditorBlock['type']) => {
      const block = createBlockByType(type)
      commit(insertBlockAfter(blocksRef.current, blockId, block))
      focusBlock(block.id)
    },
    [blocksRef, commit, focusBlock],
  )

  const insertImageBlock = useCallback(
    (url: string, alt = '', afterId?: string) => {
      const image = {
        ...createBlockByType('image'),
        url,
        alt,
      } as ImageBlock
      const current = blocksRef.current
      const anchorId = afterId ?? current.at(-1)?.id
      const next = anchorId
        ? insertBlockAfter(current, anchorId, image)
        : [image]
      commit(next)
      setInsertAfterId(null)
    },
    [blocksRef, commit, setInsertAfterId],
  )

  const convertToolbarBlock = useCallback(
    (blockId: string, choice: BlockInsertChoice) => {
      const current = blocksRef.current.find((block) => block.id === blockId)
      const nextType = current?.type === choice.type ? 'paragraph' : choice.type
      let next = convertBlockType(blocksRef.current, blockId, nextType)
      if (choice.type === 'heading' && choice.level) {
        next = updateBlock(next, blockId, { level: choice.level })
      }
      commit(next)
      focusBlock(blockId)
    },
    [blocksRef, commit, focusBlock],
  )

  const moveToolbarBlock = useCallback(
    (blockId: string, direction: 'up' | 'down') => {
      commit(moveBlock(blocksRef.current, blockId, direction))
      focusBlock(blockId)
    },
    [blocksRef, commit, focusBlock],
  )

  const duplicateToolbarBlock = useCallback(
    (blockId: string) => {
      commit(duplicateBlock(blocksRef.current, blockId))
      focusBlock(blockId)
    },
    [blocksRef, commit, focusBlock],
  )

  const deleteToolbarBlock = useCallback(
    (blockId: string) => {
      const current = blocksRef.current
      const index = current.findIndex((block) => block.id === blockId)
      const focusId = current[index + 1]?.id ?? current[index - 1]?.id
      commit(removeBlock(current, blockId))
      if (focusId) focusBlock(focusId)
    },
    [blocksRef, commit, focusBlock],
  )

  const exitListBlockItem = useCallback(
    (blockId: string, itemId: string) => {
      const paragraph = createParagraphBlock()
      commit(exitListItem(blocksRef.current, blockId, itemId, paragraph))
      focusBlock(paragraph.id)
    },
    [blocksRef, commit, focusBlock],
  )

  const splitTextBlock = useCallback(
    (blockId: string, beforeHtml: string, afterHtml: string) => {
      const current = blocksRef.current
      const index = current.findIndex((block) => block.id === blockId)
      const block = current[index]
      if (
        index < 0 ||
        !block ||
        !(
          block.type === 'paragraph' ||
          block.type === 'heading' ||
          block.type === 'quote'
        )
      ) {
        return
      }
      const paragraph = { ...createParagraphBlock(), html: afterHtml }
      const updatedBlock = { ...block, html: beforeHtml }
      commit([
        ...current.slice(0, index),
        updatedBlock,
        paragraph,
        ...current.slice(index + 1),
      ])
      focusBlock(paragraph.id)
    },
    [blocksRef, commit, focusBlock],
  )

  const convertShortcut = useCallback(
    (blockId: string, text: string) => {
      const shortcut = getMarkdownBlockShortcut(text)
      if (!shortcut) return
      let next = convertBlockType(blocksRef.current, blockId, shortcut.type)
      if (shortcut.type === 'heading' && shortcut.level) {
        next = updateBlock(next, blockId, { level: shortcut.level, html: '' })
      } else if (shortcut.type !== 'divider') {
        next = updateBlock(next, blockId, { html: '', code: '' })
      }
      commit(next)
      focusBlock(blockId)
    },
    [blocksRef, commit, focusBlock],
  )

  return {
    replaceBlock,
    insertBlock,
    insertToolbarBlock,
    insertImageBlock,
    convertToolbarBlock,
    moveToolbarBlock,
    duplicateToolbarBlock,
    deleteToolbarBlock,
    exitListBlockItem,
    splitTextBlock,
    convertShortcut,
  }
}

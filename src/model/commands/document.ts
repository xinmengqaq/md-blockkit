import { getPlainTextFromHtml } from '@/html/plainText'
import { createBlockId } from '@/model/ids'
import {
  createDefaultTableBlock,
  createHeadingBlock,
  createListItem,
  createParagraphBlock,
} from '@/model/factories'
import {
  cloneBlockWithNewIds,
  ensureNonEmptyDocument,
} from '@/model/predicates'
import type { BlockType, EditorBlock } from '@/model/types'

export const insertBlockAfter = (
  blocks: EditorBlock[],
  targetId: string,
  block: EditorBlock,
) => {
  const index = blocks.findIndex((item) => item.id === targetId)
  if (index < 0) {
    return blocks
  }

  return [...blocks.slice(0, index + 1), block, ...blocks.slice(index + 1)]
}

export const updateBlock = (
  blocks: EditorBlock[],
  blockId: string,
  patch: Partial<EditorBlock>,
) =>
  blocks.map((block) =>
    block.id === blockId ? ({ ...block, ...patch } as EditorBlock) : block,
  )

export const removeBlock = (blocks: EditorBlock[], blockId: string) =>
  ensureNonEmptyDocument(blocks.filter((block) => block.id !== blockId))

export const moveBlock = (
  blocks: EditorBlock[],
  blockId: string,
  direction: 'up' | 'down',
) => {
  const index = blocks.findIndex((block) => block.id === blockId)
  const nextIndex = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) {
    return blocks
  }

  const next = [...blocks]
  ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
  return next
}

export const duplicateBlock = (blocks: EditorBlock[], blockId: string) => {
  const block = blocks.find((item) => item.id === blockId)
  return block
    ? insertBlockAfter(blocks, blockId, cloneBlockWithNewIds(block))
    : blocks
}

const blockText = (block: EditorBlock) => {
  if (
    block.type === 'paragraph' ||
    block.type === 'quote' ||
    block.type === 'heading'
  ) {
    return block.html
  }
  if (block.type === 'code') {
    return block.code
  }
  if (
    block.type === 'unordered-list' ||
    block.type === 'ordered-list' ||
    block.type === 'task-list'
  ) {
    return block.items.map((item) => item.html).join('<br>')
  }
  if (block.type === 'image') {
    return block.alt ?? block.url
  }
  return ''
}

export const createBlockByType = (type: BlockType): EditorBlock => {
  switch (type) {
    case 'paragraph':
      return createParagraphBlock()
    case 'heading':
      return createHeadingBlock(1)
    case 'quote':
      return { ...createParagraphBlock(), type: 'quote' }
    case 'unordered-list':
    case 'ordered-list':
    case 'task-list':
      return {
        id: createBlockId(),
        type,
        items: [
          createListItem('', {
            indent: 0,
            checked: type === 'task-list' ? false : undefined,
          }),
        ],
      }
    case 'code':
      return { id: createBlockId(), type: 'code', code: '' }
    case 'image':
      return {
        id: createBlockId(),
        type: 'image',
        url: '',
        alt: '',
        align: 'left',
        width: 100,
      }
    case 'table':
      return createDefaultTableBlock()
    case 'divider':
      return { id: createBlockId(), type: 'divider' }
  }
}

export const convertBlockType = (
  blocks: EditorBlock[],
  blockId: string,
  nextType: BlockType,
) =>
  blocks.map((block) => {
    if (block.id !== blockId || block.type === nextType) {
      return block
    }

    const html = blockText(block)
    const converted = createBlockByType(nextType)
    if (converted.type === 'paragraph' || converted.type === 'quote') {
      return { ...converted, id: block.id, html }
    }
    if (converted.type === 'heading') {
      return { ...converted, id: block.id, html }
    }
    if (
      converted.type === 'unordered-list' ||
      converted.type === 'ordered-list' ||
      converted.type === 'task-list'
    ) {
      return {
        ...converted,
        id: block.id,
        items: [
          createListItem(html, {
            indent: 0,
            checked: converted.type === 'task-list' ? false : undefined,
          }),
        ],
      }
    }
    if (converted.type === 'code') {
      return { ...converted, id: block.id, code: getPlainTextFromHtml(html) }
    }
    return { ...converted, id: block.id }
  })

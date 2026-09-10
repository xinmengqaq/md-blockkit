import type { EditorBlock } from './types'
import { createBlockId } from './ids'
import { createParagraphBlock } from './factories'
import { getPlainTextFromHtml } from '@/html/plainText'

export const ensureNonEmptyDocument = (blocks: EditorBlock[]) =>
  blocks.length > 0 ? blocks : [createParagraphBlock()]

export const isBlockEmpty = (block: EditorBlock) => {
  switch (block.type) {
    case 'paragraph':
    case 'quote':
    case 'heading':
      return getPlainTextFromHtml(block.html).trim().length === 0
    case 'unordered-list':
    case 'ordered-list':
    case 'task-list':
      return block.items.every(
        (item) => getPlainTextFromHtml(item.html).trim().length === 0,
      )
    case 'code':
      return block.code.trim().length === 0
    case 'image':
      return block.url.trim().length === 0
    case 'table':
      return block.rows.every((row) =>
        row.every(
          (cell) => getPlainTextFromHtml(cell.html).trim().length === 0,
        ),
      )
    case 'divider':
      return false
  }
}

export const cloneBlockWithNewIds = (block: EditorBlock): EditorBlock => {
  switch (block.type) {
    case 'unordered-list':
    case 'ordered-list':
    case 'task-list':
      return {
        ...block,
        id: createBlockId(),
        items: block.items.map((item) => ({ ...item, id: createBlockId() })),
      }
    case 'table':
      return {
        ...block,
        id: createBlockId(),
        rows: block.rows.map((row) =>
          row.map((cell) => ({ ...cell, id: createBlockId() })),
        ),
      }
    default:
      return { ...block, id: createBlockId() }
  }
}

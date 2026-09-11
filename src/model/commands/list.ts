import type { EditorBlock, ListBlock } from '@/model/types'
import { createBlockId } from '@/model/ids'
import { createListItem, createParagraphBlock } from '@/model/factories'
import { getPlainTextFromHtml } from '@/html/plainText'

export const changeListItemIndent = (
  block: ListBlock,
  itemId: string,
  direction: 'increase' | 'decrease',
): ListBlock => ({
  ...block,
  items: block.items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          indent: Math.max(
            0,
            Math.min(2, item.indent + (direction === 'increase' ? 1 : -1)),
          ) as 0 | 1 | 2,
        }
      : item,
  ),
})

export const insertListItemAfter = (
  block: ListBlock,
  itemId: string,
): ListBlock => {
  const index = block.items.findIndex((item) => item.id === itemId)
  if (index < 0) return block
  const current = block.items[index]
  const item = createListItem('', {
    indent: current.indent,
    checked: block.type === 'task-list' ? false : undefined,
  })
  return {
    ...block,
    items: [
      ...block.items.slice(0, index + 1),
      item,
      ...block.items.slice(index + 1),
    ],
  }
}

export const splitListItem = (
  block: ListBlock,
  itemId: string,
  beforeHtml: string,
  afterHtml: string,
) => {
  const index = block.items.findIndex((item) => item.id === itemId)
  if (index < 0) return block
  const current = block.items[index]
  const next = createListItem(afterHtml, {
    indent: current.indent,
    checked: block.type === 'task-list' ? false : undefined,
  })
  return {
    ...block,
    items: [
      ...block.items.slice(0, index),
      { ...current, html: beforeHtml },
      next,
      ...block.items.slice(index + 1),
    ],
  }
}

export const exitListItem = (
  blocks: EditorBlock[],
  blockId: string,
  itemId: string,
  paragraph = createParagraphBlock(),
) =>
  blocks.flatMap((block) => {
    if (
      block.id !== blockId ||
      !(
        block.type === 'unordered-list' ||
        block.type === 'ordered-list' ||
        block.type === 'task-list'
      )
    ) {
      return [block]
    }
    const index = block.items.findIndex((item) => item.id === itemId)
    if (
      index < 0 ||
      getPlainTextFromHtml(block.items[index].html).trim().length > 0
    ) {
      return [block]
    }
    const before = block.items.slice(0, index)
    const after = block.items.slice(index + 1)
    return [
      ...(before.length ? [{ ...block, items: before }] : []),
      paragraph,
      ...(after.length
        ? [
            {
              ...block,
              id: before.length ? createBlockId() : block.id,
              items: after,
            },
          ]
        : []),
    ]
  })

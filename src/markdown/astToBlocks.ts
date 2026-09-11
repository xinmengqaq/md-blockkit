import { sanitizeAuthorHtml } from '@/html/authorHtml'
import {
  createBlockId,
  createListItem,
  createParagraphBlock,
} from '@/model/blockModel'
import type {
  EditorBlock,
  ListBlock,
  ListItem,
  TableBlock,
  TextAlign,
} from '@/model/types'
import type { MarkdownNode } from './ast'
import { parseAlignedImageHtml } from './imageHtml'
import { escapeMarkdownHtml, inlineNodesToHtml, nodeText } from './inlineToHtml'

const listItemsFromNode = (node: MarkdownNode, indent = 0): ListItem[] => {
  const items: ListItem[] = []
  for (const item of node.children ?? []) {
    const paragraph = item.children?.find((child) => child.type === 'paragraph')
    items.push(
      createListItem(inlineNodesToHtml(paragraph?.children), {
        indent: Math.min(indent, 2) as 0 | 1 | 2,
        checked: item.checked ?? undefined,
      }),
    )
    for (const nested of item.children?.filter(
      (child) => child.type === 'list',
    ) ?? []) {
      items.push(...listItemsFromNode(nested, indent + 1))
    }
  }
  return items
}

const tableFromHtml = (html: string): TableBlock | null => {
  const clean = sanitizeAuthorHtml(html)
  const document = new DOMParser().parseFromString(clean, 'text/html')
  const table = document.querySelector('table')
  if (!table) {
    return null
  }

  const columnWidths = Array.from(table.querySelectorAll('col')).map(
    (column) => column.style.width,
  )
  const rows = Array.from(table.querySelectorAll('tr')).map((row) =>
    Array.from(row.children)
      .filter((cell) => cell.matches('th, td'))
      .map((cell) => ({
        id: createBlockId(),
        html: cell.innerHTML,
        rowspan: Number(cell.getAttribute('rowspan')) || 1,
        colspan: Number(cell.getAttribute('colspan')) || 1,
        align: (cell
          .getAttribute('style')
          ?.match(/text-align:(left|center|right)/)?.[1] ??
          'left') as TextAlign,
      })),
  )

  return rows.length
    ? {
        id: createBlockId(),
        type: 'table',
        hasHeader: Boolean(table.querySelector('thead')),
        columnWidths,
        rows,
      }
    : null
}

export const nodeToBlocks = (node: MarkdownNode): EditorBlock[] => {
  switch (node.type) {
    case 'heading':
      return [
        {
          id: createBlockId(),
          type: 'heading',
          level: Math.min(node.depth ?? 1, 4) as 1 | 2 | 3 | 4,
          html: inlineNodesToHtml(node.children),
        },
      ]
    case 'paragraph':
      if (node.children?.length === 1 && node.children[0].type === 'image') {
        return [
          {
            id: createBlockId(),
            type: 'image',
            url: node.children[0].url ?? '',
            alt: node.children[0].alt ?? '',
            align: 'left',
            width: 100,
          },
        ]
      }
      return [createParagraphBlock(inlineNodesToHtml(node.children))]
    case 'blockquote':
      return [
        {
          id: createBlockId(),
          type: 'quote',
          html: (node.children ?? [])
            .map((child) =>
              child.type === 'paragraph'
                ? inlineNodesToHtml(child.children)
                : escapeMarkdownHtml(nodeText(child)),
            )
            .join('<br>'),
        },
      ]
    case 'list': {
      const items = listItemsFromNode(node)
      const groups = items.reduce<ListItem[][]>((result, item) => {
        const current = result.at(-1)
        const isTask = item.checked !== undefined
        const currentIsTask = current?.[0]?.checked !== undefined
        if (!current || currentIsTask !== isTask) {
          result.push([item])
        } else {
          current.push(item)
        }
        return result
      }, [])
      return groups.map<ListBlock>((group) => ({
        id: createBlockId(),
        type:
          group[0].checked !== undefined
            ? 'task-list'
            : node.ordered
              ? 'ordered-list'
              : 'unordered-list',
        items: group,
      }))
    }
    case 'code':
      return [
        {
          id: createBlockId(),
          type: 'code',
          language: node.lang ?? undefined,
          code: node.value ?? '',
        },
      ]
    case 'thematicBreak':
      return [{ id: createBlockId(), type: 'divider' }]
    case 'table':
      return [
        {
          id: createBlockId(),
          type: 'table',
          hasHeader: true,
          columnWidths: (node.children?.[0]?.children ?? []).map(() => ''),
          rows: (node.children ?? []).map((row) =>
            (row.children ?? []).map((cell, index) => ({
              id: createBlockId(),
              html: inlineNodesToHtml(cell.children),
              rowspan: 1,
              colspan: 1,
              align: node.align?.[index] ?? 'left',
            })),
          ),
        },
      ]
    case 'html': {
      const table = tableFromHtml(node.value ?? '')
      if (table) return [table]
      const image = parseAlignedImageHtml(node.value ?? '')
      return image
        ? [{ id: createBlockId(), type: 'image', ...image }]
        : [createParagraphBlock(sanitizeAuthorHtml(node.value ?? ''))]
    }
    default:
      return [createParagraphBlock(escapeMarkdownHtml(nodeText(node)))]
  }
}

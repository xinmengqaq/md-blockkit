import type {
  HeadingBlock,
  ListItem,
  TableBlock,
  TableCell,
  TextBlock,
} from './types'
import { createBlockId } from './ids'

export const createParagraphBlock = (html = ''): TextBlock => ({
  id: createBlockId(),
  type: 'paragraph',
  html,
})

export const createHeadingBlock = (
  level: 1 | 2 | 3 | 4,
  html = '',
): HeadingBlock => ({
  id: createBlockId(),
  type: 'heading',
  level,
  html,
})

export const createListItem = (
  html = '',
  options: Pick<ListItem, 'indent' | 'checked'> = {
    indent: 0,
    checked: undefined,
  },
): ListItem => ({ id: createBlockId(), html, ...options })

export const createTableCell = (html = ''): TableCell => ({
  id: createBlockId(),
  html,
  rowspan: 1,
  colspan: 1,
  align: 'left',
})

export const createDefaultTableBlock = (): TableBlock => ({
  id: createBlockId(),
  type: 'table',
  hasHeader: true,
  columnWidths: ['', '', ''],
  rows: Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => createTableCell()),
  ),
})

export const DEFAULT_IMAGE_WIDTH = 100

import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'

import type { ImageDraft } from '@/images/types'
import { DocumentEditor } from '@/editor/DocumentEditor'

export const editableCases = [
  {
    name: '段落',
    value: '段落',
    initial: '段落',
    changed: '新段落',
    expected: '新段落',
    empty: '',
  },
  {
    name: '标题',
    value: '# 标题',
    initial: '标题',
    changed: '新标题',
    expected: '# 新标题',
    empty: '#',
  },
  {
    name: '引用',
    value: '> 引用',
    initial: '引用',
    changed: '新引用',
    expected: '> 新引用',
    empty: '>',
  },
  {
    name: '列表项',
    value: '- 列表',
    initial: '列表',
    changed: '新列表',
    expected: '- 新列表',
    empty: '-',
  },
  {
    name: '表格单元格',
    value: '| 单元格 |\n| --- |',
    initial: '单元格',
    changed: '新单元格',
    expected: '| 新单元格 |\n| --- |',
    empty: '|  |\n| --- |',
  },
]

export const selectText = (element: HTMLElement) => {
  const text = element.firstChild
  if (!text) throw new Error('缺少可选择文字')
  const range = document.createRange()
  range.selectNodeContents(text)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  act(() => document.dispatchEvent(new Event('selectionchange')))
}

export const selectContents = (element: HTMLElement) => {
  const range = document.createRange()
  range.selectNodeContents(element)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  act(() => document.dispatchEvent(new Event('selectionchange')))
}

export { act, createEvent, fireEvent, render, screen, within, DocumentEditor }
export type { ImageDraft }

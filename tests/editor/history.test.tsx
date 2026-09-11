import { afterEach, describe, expect, it, vi } from 'vitest'

import { DocumentEditor, fireEvent, render, screen } from '../helpers'

describe('DocumentEditor', () => {
  afterEach(() => vi.restoreAllMocks())

  it('Ctrl 撤销和两种重做快捷键应恢复正文并保留编辑焦点', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value="初始正文" onChange={onChange} />)
    const editable = screen.getByText('初始正文')
    editable.focus()
    editable.innerHTML = '修改正文'
    fireEvent.input(editable)

    expect(fireEvent.keyDown(editable, { key: 'z', ctrlKey: true })).toBe(false)
    expect(editable).toHaveTextContent('初始正文')
    expect(editable).toHaveFocus()

    expect(
      fireEvent.keyDown(editable, {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
      }),
    ).toBe(false)
    expect(editable).toHaveTextContent('修改正文')
    expect(editable).toHaveFocus()

    fireEvent.keyDown(editable, { key: 'z', ctrlKey: true })
    expect(fireEvent.keyDown(editable, { key: 'y', ctrlKey: true })).toBe(false)
    expect(editable).toHaveTextContent('修改正文')
    expect(editable).toHaveFocus()
  })

  it('Meta + Z 应使用编辑器历史并阻止浏览器默认撤销', () => {
    render(<DocumentEditor value="初始正文" onChange={vi.fn()} />)
    const editable = screen.getByText('初始正文')
    editable.focus()
    editable.innerHTML = '修改正文'
    fireEvent.input(editable)

    expect(fireEvent.keyDown(editable, { key: 'z', metaKey: true })).toBe(false)
    expect(editable).toHaveTextContent('初始正文')
    expect(editable).toHaveFocus()
  })
})

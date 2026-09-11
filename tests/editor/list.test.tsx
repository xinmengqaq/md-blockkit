import { afterEach, describe, expect, it, vi } from 'vitest'

import { DocumentEditor, fireEvent, render, screen } from '../helpers'

describe('DocumentEditor', () => {
  afterEach(() => vi.restoreAllMocks())

  it('列表项应支持两级缩进和反向缩进', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value={'- 父项\n- 子项'} onChange={onChange} />)
    const child = screen.getByText('子项')

    fireEvent.keyDown(child, { key: 'Tab' })
    expect(onChange).toHaveBeenLastCalledWith('- 父项\n  - 子项')

    fireEvent.keyDown(child, { key: 'Tab' })
    fireEvent.keyDown(child, { key: 'Tab' })
    expect(onChange).toHaveBeenLastCalledWith('- 父项\n    - 子项')

    fireEvent.keyDown(child, { key: 'Tab', shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith('- 父项\n  - 子项')
  })

  it('Enter 应在当前列表项后创建同级项', () => {
    const onChange = vi.fn()
    const { container } = render(
      <DocumentEditor value={'- 第一项\n- 第二项'} onChange={onChange} />,
    )

    fireEvent.keyDown(screen.getByText('第一项'), { key: 'Enter' })

    expect(
      container.querySelectorAll('.block-editor__list [data-editor-input]'),
    ).toHaveLength(3)
    expect(onChange).toHaveBeenLastCalledWith('- 第一项\n- \n- 第二项')
  })

  it('列表项 Enter 应按光标位置拆分前后文字', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value="- 前半段后半段" onChange={onChange} />)
    const item = screen.getByText('前半段后半段')
    const textNode = item.firstChild!
    const selection = window.getSelection()!
    const range = document.createRange()
    range.setStart(textNode, 3)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)

    fireEvent.keyDown(item, { key: 'Enter' })

    expect(onChange).toHaveBeenLastCalledWith('- 前半段\n- 后半段')
  })

  it('空列表项按 Backspace 应退出为段落', () => {
    const onChange = vi.fn()
    const { container } = render(
      <DocumentEditor value={'- 第一项\n- 临时项'} onChange={onChange} />,
    )
    const item = screen.getByText('临时项')
    item.innerHTML = ''
    fireEvent.input(item)

    fireEvent.keyDown(item, { key: 'Backspace' })

    expect(container.querySelectorAll('.block-editor__list li')).toHaveLength(1)
    expect(
      container.querySelector('.block-editor__paragraph'),
    ).toBeInTheDocument()
  })

  it('空列表项按 Enter 应退出为段落', () => {
    const onChange = vi.fn()
    const { container } = render(
      <DocumentEditor value={'- 第一项\n- 临时项'} onChange={onChange} />,
    )
    const item = screen.getByText('临时项')
    item.innerHTML = ''
    fireEvent.input(item)

    fireEvent.keyDown(item, { key: 'Enter' })

    expect(container.querySelectorAll('.block-editor__list li')).toHaveLength(1)
    expect(
      container.querySelector('.block-editor__paragraph'),
    ).toBeInTheDocument()
  })

  it('任务列表勾选后应保存完成状态', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value="- [ ] 待办" onChange={onChange} />)

    fireEvent.click(screen.getByRole('checkbox', { name: '任务 1' }))

    expect(onChange).toHaveBeenLastCalledWith('- [x] 待办')
  })
})

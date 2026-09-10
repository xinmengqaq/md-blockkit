import { afterEach, describe, expect, it, vi } from 'vitest'

import { DocumentEditor, fireEvent, render, screen } from './helpers'

describe('DocumentEditor', () => {
  afterEach(() => vi.restoreAllMocks())

  it('Ctrl 点击块柄应多选块并显示批量工具', () => {
    render(<DocumentEditor value={'第一段\n\n第二段'} onChange={vi.fn()} />)
    const handles = screen.getAllByRole('button', { name: '打开块工具' })

    fireEvent.click(handles[0], { ctrlKey: true })
    fireEvent.click(handles[1], { ctrlKey: true })

    expect(
      screen.getByRole('toolbar', { name: '批量块工具' }),
    ).toBeInTheDocument()
    expect(screen.getByText('已选择 2 个块')).toBeInTheDocument()
    expect(handles[0]).toHaveAttribute('aria-pressed', 'true')
    expect(handles[1]).toHaveAttribute('aria-pressed', 'true')
  })

  it('Shift 点击块柄应从选择锚点连续选择', () => {
    const { container } = render(
      <DocumentEditor
        value={'第一段\n\n第二段\n\n第三段'}
        onChange={vi.fn()}
      />,
    )
    const handles = screen.getAllByRole('button', { name: '打开块工具' })

    fireEvent.click(handles[0], { ctrlKey: true })
    fireEvent.click(handles[2], { shiftKey: true })

    expect(container.querySelectorAll('.is-multi-selected')).toHaveLength(3)
  })

  it('从块间空白拖框应按 pointer 事件链多选相交块', () => {
    const { container } = render(
      <DocumentEditor value={'第一段\n\n第二段'} onChange={vi.fn()} />,
    )
    const editor = screen.getByLabelText('块状 Markdown 编辑器')
    const documentSurface = container.querySelector<HTMLElement>(
      '.block-editor__document',
    )!
    const blocks = container.querySelectorAll<HTMLElement>(
      '.block-editor__block',
    )
    vi.spyOn(blocks[0], 'getBoundingClientRect').mockReturnValue({
      left: 20,
      top: 20,
      right: 220,
      bottom: 60,
      width: 200,
      height: 40,
      x: 20,
      y: 20,
      toJSON: () => undefined,
    })
    vi.spyOn(blocks[1], 'getBoundingClientRect').mockReturnValue({
      left: 20,
      top: 80,
      right: 220,
      bottom: 120,
      width: 200,
      height: 40,
      x: 20,
      y: 80,
      toJSON: () => undefined,
    })

    fireEvent.pointerDown(documentSurface, {
      button: 0,
      clientX: 10,
      clientY: 10,
      pointerId: 1,
    })
    fireEvent.pointerMove(editor, {
      clientX: 230,
      clientY: 130,
      pointerId: 1,
    })

    expect(
      container.querySelector('.block-editor__selection-rect'),
    ).toBeInTheDocument()

    fireEvent.pointerUp(editor, {
      clientX: 230,
      clientY: 130,
      pointerId: 1,
    })

    expect(container.querySelectorAll('.is-multi-selected')).toHaveLength(2)
    expect(
      container.querySelector('.block-editor__selection-rect'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('已选择 2 个块')).toBeInTheDocument()
  })

  it('批量删除应一次删除全部已选块', () => {
    const onChange = vi.fn()
    render(
      <DocumentEditor
        value={'第一段\n\n第二段\n\n保留段'}
        onChange={onChange}
      />,
    )
    const handles = screen.getAllByRole('button', { name: '打开块工具' })
    fireEvent.click(handles[0], { ctrlKey: true })
    fireEvent.click(handles[1], { ctrlKey: true })

    fireEvent.click(screen.getByRole('button', { name: '批量删除' }))

    expect(onChange).toHaveBeenLastCalledWith('保留段')
  })

  it('批量转换为段落应统一所选块类型', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value={'# 标题\n\n> 引用'} onChange={onChange} />)
    const handles = screen.getAllByRole('button', { name: '打开块工具' })
    fireEvent.click(handles[0], { ctrlKey: true })
    fireEvent.click(handles[1], { ctrlKey: true })

    fireEvent.click(screen.getByRole('button', { name: '批量转换为段落' }))

    expect(onChange).toHaveBeenLastCalledWith('标题\n\n引用')
  })

  it('批量文字样式应包裹所选块内全文', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value={'第一段\n\n第二段'} onChange={onChange} />)
    const handles = screen.getAllByRole('button', { name: '打开块工具' })
    fireEvent.click(handles[0], { ctrlKey: true })
    fireEvent.click(handles[1], { ctrlKey: true })

    fireEvent.click(screen.getByRole('button', { name: '批量加粗' }))

    expect(onChange).toHaveBeenLastCalledWith('**第一段**\n\n**第二段**')
  })
})

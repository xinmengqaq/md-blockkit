import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createEvent,
  DocumentEditor,
  fireEvent,
  render,
  screen,
  selectContents,
  selectText,
} from './helpers'

describe('DocumentEditor', () => {
  afterEach(() => vi.restoreAllMocks())

  it('选中文字应显示文字工具浮层', () => {
    render(<DocumentEditor value="正文" onChange={vi.fn()} />)

    selectText(screen.getByText('正文'))

    expect(
      screen.getByRole('toolbar', { name: '文字工具' }),
    ).toBeInTheDocument()
  })

  it('右键文字时应选中当前词并打开文字工具浮层', () => {
    render(<DocumentEditor value="右键测试" onChange={vi.fn()} />)
    const paragraph = screen.getByText('右键测试')
    const textNode = paragraph.firstChild!
    const caret = document.createRange()
    caret.setStart(textNode, 1)
    caret.collapse(true)
    window.getSelection()?.removeAllRanges()

    Object.defineProperty(document, 'caretRangeFromPoint', {
      configurable: true,
      value: () => caret,
    })
    const mouseDown = createEvent.mouseDown(paragraph, {
      button: 2,
      clientX: 10,
      clientY: 10,
    })
    fireEvent(paragraph, mouseDown)
    const contextMenu = createEvent.contextMenu(paragraph, {
      clientX: 10,
      clientY: 10,
    })
    fireEvent(paragraph, contextMenu)
    Reflect.deleteProperty(document, 'caretRangeFromPoint')

    expect(mouseDown.defaultPrevented).toBe(true)
    expect(contextMenu.defaultPrevented).toBe(true)
    expect(window.getSelection()?.anchorOffset).toBe(1)
    expect(
      screen.getByRole('toolbar', { name: '文字工具' }),
    ).toBeInTheDocument()
  })

  it('点击文字工具外部时应关闭文字工具浮层', () => {
    render(
      <>
        <button type="button">外部操作</button>
        <DocumentEditor value="正文" onChange={vi.fn()} />
      </>,
    )
    selectText(screen.getByText('正文'))

    fireEvent.pointerDown(screen.getByRole('button', { name: '外部操作' }))

    expect(
      screen.queryByRole('toolbar', { name: '文字工具' }),
    ).not.toBeInTheDocument()
    expect(window.getSelection()?.rangeCount).toBe(0)
  })

  it('点击文字工具选项时不应在执行命令前关闭浮层', () => {
    render(<DocumentEditor value="正文" onChange={vi.fn()} />)
    selectText(screen.getByText('正文'))

    fireEvent.pointerDown(screen.getByRole('button', { name: '加粗' }))

    expect(
      screen.getByRole('toolbar', { name: '文字工具' }),
    ).toBeInTheDocument()
  })

  it('文字工具应支持设置和取消安全链接', () => {
    const onChange = vi.fn()
    vi.spyOn(window, 'prompt').mockReturnValue('https://example.com/article')
    const { unmount } = render(
      <DocumentEditor value="正文" onChange={onChange} />,
    )
    selectText(screen.getByText('正文'))

    fireEvent.mouseDown(screen.getByRole('button', { name: '设置链接' }))
    fireEvent.click(screen.getByRole('button', { name: '设置链接' }))
    expect(onChange).toHaveBeenLastCalledWith(
      '[正文](https://example.com/article)',
    )

    unmount()
    render(
      <DocumentEditor
        value="[正文](https://example.com/article)"
        onChange={onChange}
      />,
    )
    selectText(screen.getByText('正文'))
    fireEvent.mouseDown(screen.getByRole('button', { name: '取消链接' }))
    fireEvent.click(screen.getByRole('button', { name: '取消链接' }))
    expect(onChange).toHaveBeenLastCalledWith('正文')
  })

  it('文字工具应拒绝危险链接协议', () => {
    const onChange = vi.fn()
    vi.spyOn(window, 'prompt').mockReturnValue('javascript:alert(1)')
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    render(<DocumentEditor value="正文" onChange={onChange} />)
    selectText(screen.getByText('正文'))

    fireEvent.mouseDown(screen.getByRole('button', { name: '设置链接' }))
    fireEvent.click(screen.getByRole('button', { name: '设置链接' }))

    expect(onChange).not.toHaveBeenCalled()
    expect(alert).toHaveBeenCalledOnce()
  })

  it('文字工具应只应用预设文字颜色和背景高亮', () => {
    const onChange = vi.fn()
    const { unmount } = render(
      <DocumentEditor value="正文" onChange={onChange} />,
    )
    selectText(screen.getByText('正文'))

    fireEvent.mouseDown(screen.getByRole('button', { name: '文字颜色' }))
    fireEvent.click(screen.getByRole('button', { name: '文字颜色' }))
    fireEvent.mouseDown(
      screen.getByRole('button', { name: '文字颜色 #dc2626' }),
    )
    fireEvent.click(screen.getByRole('button', { name: '文字颜色 #dc2626' }))
    expect(onChange).toHaveBeenLastCalledWith(
      '<span style="color:#dc2626">正文</span>',
    )

    unmount()
    render(<DocumentEditor value="正文" onChange={onChange} />)
    selectText(screen.getByText('正文'))
    fireEvent.mouseDown(screen.getByRole('button', { name: '背景高亮' }))
    fireEvent.click(screen.getByRole('button', { name: '背景高亮' }))
    fireEvent.mouseDown(
      screen.getByRole('button', { name: '背景高亮 #fef3c7' }),
    )
    fireEvent.click(screen.getByRole('button', { name: '背景高亮 #fef3c7' }))
    expect(onChange).toHaveBeenLastCalledWith(
      '<span style="background-color:#fef3c7">正文</span>',
    )
  })

  it('文字工具应清除当前文字的行内格式', () => {
    const onChange = vi.fn()
    render(
      <DocumentEditor
        value={'**<u><span style="color:#dc2626">正文</span></u>**'}
        onChange={onChange}
      />,
    )
    selectText(screen.getByText('正文'))

    fireEvent.mouseDown(screen.getByRole('button', { name: '清除格式' }))
    fireEvent.click(screen.getByRole('button', { name: '清除格式' }))

    expect(onChange).toHaveBeenLastCalledWith('正文')
  })

  it('文字工具应清除跨多个行内节点的格式', () => {
    const onChange = vi.fn()
    const { container } = render(
      <DocumentEditor value="**粗体** *斜体*" onChange={onChange} />,
    )
    selectContents(container.querySelector<HTMLElement>('[data-editor-input]')!)

    fireEvent.mouseDown(screen.getByRole('button', { name: '清除格式' }))
    fireEvent.click(screen.getByRole('button', { name: '清除格式' }))

    expect(onChange).toHaveBeenLastCalledWith('粗体 斜体')
  })

  it('Esc 应关闭文字工具浮层并保留正文', () => {
    render(<DocumentEditor value="正文" onChange={vi.fn()} />)
    selectText(screen.getByText('正文'))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(
      screen.queryByRole('toolbar', { name: '文字工具' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('正文')).toBeInTheDocument()
  })

  it('编辑器外选区和只读状态不应显示文字工具', () => {
    const { rerender } = render(
      <>
        <span>外部文字</span>
        <DocumentEditor value="正文" onChange={vi.fn()} />
      </>,
    )
    selectText(screen.getByText('外部文字'))
    expect(
      screen.queryByRole('toolbar', { name: '文字工具' }),
    ).not.toBeInTheDocument()

    rerender(<DocumentEditor value="正文" onChange={vi.fn()} readOnly />)
    selectText(screen.getByText('正文'))
    expect(
      screen.queryByRole('toolbar', { name: '文字工具' }),
    ).not.toBeInTheDocument()
  })
})

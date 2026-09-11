import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  DocumentEditor,
  fireEvent,
  render,
  screen,
  selectText,
} from '../helpers'

describe('DocumentEditor', () => {
  afterEach(() => vi.restoreAllMocks())

  it('不再占用浏览器常用的 Ctrl+E 和 Ctrl+Shift+D', () => {
    render(<DocumentEditor value="正文" onChange={vi.fn()} />)
    const paragraph = screen.getByText('正文')
    selectText(paragraph)

    expect(fireEvent.keyDown(paragraph, { key: 'e', ctrlKey: true })).toBe(true)
    expect(
      fireEvent.keyDown(paragraph, {
        key: 'd',
        ctrlKey: true,
        shiftKey: true,
      }),
    ).toBe(true)
  })

  it('点击浮层外部时应关闭块工具、插入菜单和快捷键抽屉', () => {
    render(
      <>
        <button type="button">外部操作</button>
        <DocumentEditor value="正文" onChange={vi.fn()} />
      </>,
    )
    const outside = screen.getByRole('button', { name: '外部操作' })

    fireEvent.click(screen.getByRole('button', { name: '打开块工具' }))
    expect(screen.getByRole('toolbar', { name: '块工具' })).toBeInTheDocument()
    fireEvent.pointerDown(outside)
    expect(
      screen.queryByRole('toolbar', { name: '块工具' }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '在此块后插入' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.pointerDown(outside)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '打开快捷键概览' }))
    expect(
      screen.getByRole('dialog', { name: '快捷键概览' }),
    ).toBeInTheDocument()
    fireEvent.pointerDown(outside)
    expect(
      screen.queryByRole('dialog', { name: '快捷键概览' }),
    ).not.toBeInTheDocument()
  })

  it.each([
    ['加粗', '**正文**'],
    ['斜体', '*正文*'],
    ['下划线', '<u>正文</u>'],
    ['删除线', '~~正文~~'],
    ['行内代码', '`正文`'],
  ])('文字工具执行%s后应输出安全格式', (name, markdown) => {
    const onChange = vi.fn()
    render(<DocumentEditor value="正文" onChange={onChange} />)
    selectText(screen.getByText('正文'))

    fireEvent.mouseDown(screen.getByRole('button', { name }))
    fireEvent.click(screen.getByRole('button', { name }))

    expect(onChange).toHaveBeenLastCalledWith(markdown)
  })

  it('快捷键抽屉默认隐藏且点击后显示', () => {
    render(<DocumentEditor value="正文" onChange={vi.fn()} />)

    expect(
      screen.queryByRole('dialog', { name: '快捷键概览' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '打开快捷键概览' }))

    expect(
      screen.getByRole('dialog', { name: '快捷键概览' }),
    ).toBeInTheDocument()
    expect(screen.getByText('基础编辑')).toBeInTheDocument()
    expect(screen.getByText('Ctrl + S')).toBeInTheDocument()
  })

  it('编辑器聚焦时 Ctrl + S 应调用保存快捷键并阻止默认行为', () => {
    const onSaveShortcut = vi.fn()
    render(
      <DocumentEditor
        value="正文"
        onChange={vi.fn()}
        onSaveShortcut={onSaveShortcut}
      />,
    )
    const paragraph = screen.getByText('正文')
    paragraph.focus()

    const allowed = fireEvent.keyDown(paragraph, { key: 's', ctrlKey: true })

    expect(allowed).toBe(false)
    expect(onSaveShortcut).toHaveBeenCalledOnce()
  })

  it('退格键聚焦在块工具按钮时应保留原生行为，不删除文档块', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value="" onChange={onChange} />)

    const toolbarButton = screen.getByRole('button', { name: '打开块工具' })
    toolbarButton.focus()

    const allowed = fireEvent.keyDown(toolbarButton, {
      key: 'Backspace',
      ctrlKey: true,
    })

    expect(allowed).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
    expect(
      document.querySelector(
        '[data-editor-input][data-placeholder="输入正文"]',
      ),
    ).toBeInTheDocument()
  })

  it('空编辑块中的 Ctrl + Backspace 应保留原生文字编辑行为', () => {
    const onChange = vi.fn()
    const { container } = render(
      <DocumentEditor value="" onChange={onChange} />,
    )
    const paragraph = container.querySelector<HTMLElement>(
      '[data-editor-input]',
    )!

    const allowed = fireEvent.keyDown(paragraph, {
      key: 'Backspace',
      ctrlKey: true,
    })

    expect(allowed).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('未配置保存回调时 Ctrl + S 应保留浏览器默认行为', () => {
    render(<DocumentEditor value="正文" onChange={vi.fn()} />)

    const allowed = fireEvent.keyDown(screen.getByText('正文'), {
      key: 's',
      ctrlKey: true,
    })

    expect(allowed).toBe(true)
  })
})

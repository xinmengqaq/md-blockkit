import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  act,
  DocumentEditor,
  editableCases,
  fireEvent,
  render,
  screen,
} from './helpers'

describe('DocumentEditor', () => {
  afterEach(() => vi.restoreAllMocks())

  it('编辑段落时应输出序列化后的 Markdown', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value="原文" onChange={onChange} />)
    const paragraph = screen.getByText('原文')

    paragraph.innerHTML = '修改后的 <strong>正文</strong>'
    fireEvent.input(paragraph)

    expect(onChange).toHaveBeenLastCalledWith('修改后的 **正文**')
  })

  it('退格删除文字并同步状态后应保留原生光标位置', () => {
    const callbacks: FrameRequestCallback[] = []
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callbacks.push(callback)
        return callbacks.length
      })
    render(<DocumentEditor value="前中后" onChange={vi.fn()} />)
    const paragraph = screen.getByText('前中后')
    paragraph.focus()
    paragraph.innerHTML = '前后'
    const textNode = paragraph.firstChild!
    const range = document.createRange()
    range.setStart(textNode, 1)
    range.collapse(true)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)

    fireEvent.input(paragraph)
    act(() => callbacks.splice(0).forEach((callback) => callback(0)))

    const selection = window.getSelection()!
    expect(requestFrame).toHaveBeenCalled()
    expect(selection.anchorNode?.textContent).toBe('前后')
    expect(selection.anchorOffset).toBe(1)
    requestFrame.mockRestore()
  })

  it('空文本块开头按退格应删除当前块并聚焦上一块', () => {
    const callbacks: FrameRequestCallback[] = []
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callbacks.push(callback)
        return callbacks.length
      })
    const onChange = vi.fn()
    const { container } = render(
      <DocumentEditor value="上一段" onChange={onChange} />,
    )
    const previous = screen.getByText('上一段')
    previous.focus()
    const end = document.createRange()
    end.selectNodeContents(previous)
    end.collapse(false)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(end)
    fireEvent.keyDown(previous, { key: 'Enter' })
    act(() => callbacks.splice(0).forEach((callback) => callback(0)))
    const empty = container.querySelectorAll<HTMLElement>(
      '[data-editor-input]',
    )[1]
    const start = document.createRange()
    start.selectNodeContents(empty)
    start.collapse(true)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(start)

    const allowed = fireEvent.keyDown(empty, { key: 'Backspace' })
    act(() => callbacks.splice(0).forEach((callback) => callback(0)))

    expect(allowed).toBe(false)
    expect(onChange).toHaveBeenLastCalledWith('上一段')
    expect(container.querySelectorAll('[data-editor-input]')).toHaveLength(1)
    expect(document.activeElement).toBe(previous)
    requestFrame.mockRestore()
  })

  it('Enter 应按光标位置拆分普通段落', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value="前半段后半段" onChange={onChange} />)
    const paragraph = screen.getByText('前半段后半段')
    const textNode = paragraph.firstChild!
    const selection = window.getSelection()!
    const range = document.createRange()
    range.setStart(textNode, 3)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)

    fireEvent.keyDown(paragraph, { key: 'Enter' })

    expect(onChange).toHaveBeenLastCalledWith('前半段\n\n后半段')
  })

  it('输入法组合态按 Enter 应交给输入法确认候选词', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value="输入中" onChange={onChange} />)
    const paragraph = screen.getByText('输入中')

    const allowed = fireEvent.keyDown(paragraph, {
      key: 'Enter',
      isComposing: true,
    })

    expect(allowed).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
  })

  it.each(editableCases)(
    '$name 应同步真实输入和删除后的最终 Markdown',
    ({ value, initial, changed, expected, empty }) => {
      const onChange = vi.fn()
      render(<DocumentEditor value={value} onChange={onChange} />)
      const editable = screen.getByText(initial)

      editable.innerHTML = changed
      fireEvent.input(editable, { inputType: 'insertText', data: changed })
      expect(onChange).toHaveBeenLastCalledWith(expected)

      editable.innerHTML = ''
      fireEvent.input(editable, {
        inputType: 'deleteContentBackward',
        data: null,
      })
      expect(onChange).toHaveBeenLastCalledWith(empty)
    },
  )

  it.each(editableCases)(
    '$name 的完整输入法组合期间不应提交中间文字',
    ({ value, initial, changed, expected }) => {
      const onChange = vi.fn()
      render(<DocumentEditor value={value} onChange={onChange} />)
      const editable = screen.getByText(initial)
      const finalText = changed

      fireEvent.compositionStart(editable, { data: '' })
      editable.innerHTML = 'n'
      fireEvent.input(editable, {
        data: 'n',
        inputType: 'insertCompositionText',
        isComposing: true,
      })
      fireEvent.compositionUpdate(editable, { data: 'n' })
      editable.innerHTML = finalText
      fireEvent.input(editable, {
        data: finalText,
        inputType: 'insertCompositionText',
        isComposing: true,
      })
      fireEvent.compositionUpdate(editable, { data: finalText })

      expect(onChange).not.toHaveBeenCalled()

      fireEvent.compositionEnd(editable, { data: finalText })

      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenLastCalledWith(expected)
      expect(editable).toHaveTextContent(finalText)
    },
  )

  it('聚焦期间收到外部值后应在编辑器失焦时应用最新值', () => {
    const frames: FrameRequestCallback[] = []
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frames.push(callback)
        return frames.length
      })
    const onChange = vi.fn()
    const { rerender } = render(
      <DocumentEditor value="本地正文" onChange={onChange} />,
    )
    const editable = screen.getByText('本地正文')
    editable.focus()

    editable.innerHTML = '本地修改'
    fireEvent.input(editable)
    rerender(<DocumentEditor value="本地修改" onChange={onChange} />)

    rerender(<DocumentEditor value="服务端正文" onChange={onChange} />)
    expect(screen.getByText('本地修改')).toBeInTheDocument()

    editable.blur()
    act(() => frames.splice(0).forEach((callback) => callback(0)))

    expect(screen.getByText('服务端正文')).toBeInTheDocument()

    rerender(<DocumentEditor value="本地修改" onChange={onChange} />)
    expect(screen.getByText('本地修改')).toBeInTheDocument()
    requestFrame.mockRestore()
  })

  it('输入 Markdown 快捷语法应转换当前段落块', () => {
    const { container } = render(<DocumentEditor value="" onChange={vi.fn()} />)
    const paragraph = container.querySelector<HTMLElement>(
      '[data-editor-input]',
    )!

    paragraph.innerHTML = '## '
    fireEvent.input(paragraph)

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
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
})

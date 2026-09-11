import { afterEach, describe, expect, it, vi } from 'vitest'

import { DocumentEditor, fireEvent, render, screen } from '../helpers'

describe('DocumentEditor', () => {
  afterEach(() => vi.restoreAllMocks())

  it('粘贴 Markdown 应解析为块并插入当前块后', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value="当前段落" onChange={onChange} />)

    fireEvent.paste(screen.getByText('当前段落'), {
      clipboardData: {
        types: ['text/markdown', 'text/plain'],
        getData: (type: string) =>
          type === 'text/markdown' ? '## 粘贴标题\n\n粘贴正文' : '',
      },
    })

    expect(
      screen.getByRole('heading', { name: '粘贴标题' }),
    ).toBeInTheDocument()
    expect(onChange).toHaveBeenLastCalledWith(
      '当前段落\n\n## 粘贴标题\n\n粘贴正文',
    )
  })

  it('复制得到的纯文本 Markdown 源码应按 Markdown 解析', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value="当前段落" onChange={onChange} />)

    fireEvent.paste(screen.getByText('当前段落'), {
      clipboardData: {
        types: ['text/plain'],
        getData: () => '## 粘贴标题\n\n- 列表项',
      },
    })

    expect(
      screen.getByRole('heading', { name: '粘贴标题' }),
    ).toBeInTheDocument()
    expect(screen.getByText('列表项')).toBeInTheDocument()
    expect(onChange).toHaveBeenLastCalledWith(
      '当前段落\n\n## 粘贴标题\n\n- 列表项',
    )
  })

  it('粘贴纯文本应按空行拆段且保留单换行', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value="当前段落" onChange={onChange} />)

    fireEvent.paste(screen.getByText('当前段落'), {
      clipboardData: {
        types: ['text/plain'],
        getData: () => '第一行\n第二行\n\n下一段',
      },
    })

    expect(onChange).toHaveBeenLastCalledWith(
      '当前段落\n\n第一行  \n第二行\n\n下一段',
    )
  })

  it('粘贴 HTML 应保留安全格式并移除危险内容', () => {
    const onChange = vi.fn()
    render(<DocumentEditor value="当前段落" onChange={onChange} />)

    fireEvent.paste(screen.getByText('当前段落'), {
      clipboardData: {
        types: ['text/html', 'text/plain'],
        getData: (type: string) =>
          type === 'text/html'
            ? '<p><strong>安全内容</strong><script>alert(1)</script></p>'
            : '',
      },
    })

    expect(onChange).toHaveBeenLastCalledWith('当前段落\n\n**安全内容**')
    expect(onChange.mock.lastCall?.[0]).not.toContain('alert')
  })

  it('粘贴图片应拒绝生成地址且不影响普通文本粘贴', () => {
    // Given 剪贴板同时可能包含图片和普通文本内容
    // When 管理员在正文编辑器中执行粘贴
    // Then 图片不上传也不生成本地地址，编辑器提示使用上传按钮且普通文本仍可正常插入
    const onChange = vi.fn()
    render(<DocumentEditor value="当前段落" onChange={onChange} />)
    const editor = screen.getByText('当前段落')
    const image = new File(['image'], 'pasted.png', { type: 'image/png' })

    fireEvent.paste(editor, {
      clipboardData: {
        files: [image],
        getData: () => '不应随图片插入',
        items: [{ kind: 'file', type: 'image/png' }],
        types: ['Files', 'text/plain'],
      },
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(
      screen.getByText('不支持粘贴图片，请使用“上传图片”按钮'),
    ).toBeInTheDocument()

    fireEvent.paste(editor, {
      clipboardData: {
        files: [],
        getData: () => '普通文本',
        items: [],
        types: ['text/plain'],
      },
    })
    expect(onChange).toHaveBeenLastCalledWith('当前段落\n\n普通文本')
  })
})

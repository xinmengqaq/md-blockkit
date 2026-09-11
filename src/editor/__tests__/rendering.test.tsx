import { afterEach, describe, expect, it, vi } from 'vitest'

import { DocumentEditor, fireEvent, render, screen } from './helpers'

describe('DocumentEditor', () => {
  afterEach(() => vi.restoreAllMocks())

  it('应在连续画布中渲染基础 Markdown 块', () => {
    render(
      <DocumentEditor
        value={
          '# 标题\n\n普通段落\n\n> 引用\n\n- 列表\n\n```ts\nconst a = 1\n```'
        }
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: '标题' })).toBeInTheDocument()
    expect(screen.getByText('普通段落')).toBeInTheDocument()
    expect(screen.getByText('引用')).toBeInTheDocument()
    expect(screen.getByText('列表')).toBeInTheDocument()
    expect(screen.getByLabelText('代码内容')).toHaveValue('const a = 1')
  })

  it('应将 Markdown 分隔线渲染为编辑器分隔线', () => {
    const { container } = render(
      <DocumentEditor value={'上文\n\n---\n\n下文'} onChange={vi.fn()} />,
    )

    expect(
      container.querySelector('hr.block-editor__divider'),
    ).toBeInTheDocument()
    expect(screen.getByText('上文')).toBeInTheDocument()
    expect(screen.getByText('下文')).toBeInTheDocument()
  })

  it('readOnly 时应禁止编辑并隐藏块创建入口', () => {
    render(<DocumentEditor value="只读正文" onChange={vi.fn()} readOnly />)

    expect(screen.getByText('只读正文')).toHaveAttribute(
      'contenteditable',
      'false',
    )
    expect(
      screen.queryByRole('button', { name: '在此块后插入' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '打开块工具' }),
    ).not.toBeInTheDocument()
  })

  it('空段落输入斜杠应保留普通文字输入', () => {
    const { container } = render(<DocumentEditor value="" onChange={vi.fn()} />)
    const paragraph = container.querySelector<HTMLElement>(
      '[data-editor-input]',
    )!

    const allowed = fireEvent.keyDown(paragraph, { key: '/' })

    expect(allowed).toBe(true)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

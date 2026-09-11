import { afterEach, describe, expect, it, vi } from 'vitest'

import { DocumentEditor, fireEvent, render, screen, within } from '../helpers'

describe('DocumentEditor', () => {
  afterEach(() => vi.restoreAllMocks())

  it('块旁加号应打开菜单并插入所选块', () => {
    render(<DocumentEditor value="正文" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '在此块后插入' }))
    fireEvent.click(screen.getByRole('menuitem', { name: '二级标题' }))

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('选中块应显示块工具浮层', () => {
    const { container } = render(
      <DocumentEditor value="正文" onChange={vi.fn()} />,
    )
    const block = container.querySelector<HTMLElement>('.block-editor__block')!

    fireEvent.click(within(block).getByRole('button', { name: '打开块工具' }))

    const toolbar = screen.getByRole('toolbar', { name: '块工具' })
    expect(toolbar).toBeInTheDocument()
    expect(toolbar).toHaveStyle({ position: 'fixed' })
    expect(container.querySelectorAll('.block-editor__block')).toHaveLength(1)
    expect(screen.getByRole('button', { name: '上移块' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '下移块' })).toBeDisabled()
  })

  it('块工具应支持切换块类型', () => {
    render(<DocumentEditor value="正文" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '打开块工具' }))
    fireEvent.click(screen.getByRole('button', { name: '切换为二级标题' }))

    expect(
      screen.getByRole('heading', { level: 2, name: '正文' }),
    ).toBeInTheDocument()
  })

  it('块工具应支持移动、复制和删除块', () => {
    const onChange = vi.fn()
    const { container } = render(
      <DocumentEditor value={'第一段\n\n第二段'} onChange={onChange} />,
    )

    const openFirstBlockToolbar = () => {
      const firstBlock = container.querySelectorAll<HTMLElement>(
        '.block-editor__block',
      )[0]
      fireEvent.click(
        within(firstBlock).getByRole('button', { name: '打开块工具' }),
      )
    }

    openFirstBlockToolbar()
    fireEvent.click(screen.getByRole('button', { name: '下移块' }))
    expect(onChange).toHaveBeenLastCalledWith('第二段\n\n第一段')

    openFirstBlockToolbar()
    fireEvent.click(screen.getByRole('button', { name: '复制块' }))
    expect(onChange).toHaveBeenLastCalledWith('第二段\n\n第二段\n\n第一段')

    openFirstBlockToolbar()
    fireEvent.click(screen.getByRole('button', { name: '删除块' }))
    expect(onChange).toHaveBeenLastCalledWith('第二段\n\n第一段')
  })

  it('文档只有一个空段落时块工具应禁止删除', () => {
    render(<DocumentEditor value="" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '打开块工具' }))

    expect(screen.getByRole('button', { name: '删除块' })).toBeDisabled()
  })

  it('块工具应支持在当前块后插入语义块', () => {
    render(<DocumentEditor value="正文" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '打开块工具' }))
    fireEvent.click(screen.getByRole('button', { name: '插入代码块' }))

    expect(screen.getByLabelText('代码内容')).toBeInTheDocument()
  })

  it('Esc 应只关闭当前块工具浮层', () => {
    render(<DocumentEditor value="正文" onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '打开块工具' }))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(
      screen.queryByRole('toolbar', { name: '块工具' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('正文')).toBeInTheDocument()
  })
})

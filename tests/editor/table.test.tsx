import { afterEach, describe, expect, it, vi } from 'vitest'

import { DocumentEditor, fireEvent, render, screen } from '../helpers'

describe('DocumentEditor', () => {
  afterEach(() => vi.restoreAllMocks())

  it('右键表格应显示表格工具浮窗', () => {
    render(
      <DocumentEditor
        value={'| A | B |\n| --- | --- |\n| C | D |'}
        onChange={vi.fn()}
      />,
    )

    fireEvent.contextMenu(screen.getByText('A'))

    expect(screen.getByRole('menu', { name: '表格工具' })).toBeInTheDocument()
    expect(screen.getByText('A').closest('th')).toHaveClass('is-selected')
  })

  it('点击表格工具外部或按 Escape 时应关闭表格工具浮窗', () => {
    render(
      <>
        <button type="button">外部操作</button>
        <DocumentEditor
          value={'| A | B |\n| --- | --- |\n| C | D |'}
          onChange={vi.fn()}
        />
      </>,
    )
    const outside = screen.getByRole('button', { name: '外部操作' })

    fireEvent.contextMenu(screen.getByText('A'))
    fireEvent.pointerDown(outside)
    expect(
      screen.queryByRole('menu', { name: '表格工具' }),
    ).not.toBeInTheDocument()

    fireEvent.contextMenu(screen.getByText('A'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(
      screen.queryByRole('menu', { name: '表格工具' }),
    ).not.toBeInTheDocument()
  })

  it('Tab 和 Shift + Tab 应在表格单元格间移动焦点', () => {
    render(
      <DocumentEditor
        value={'| A | B |\n| --- | --- |\n| C | D |'}
        onChange={vi.fn()}
      />,
    )
    const first = screen.getByText('A')
    const second = screen.getByText('B')
    first.focus()

    fireEvent.keyDown(first, { key: 'Tab' })
    expect(second).toHaveFocus()

    fireEvent.keyDown(second, { key: 'Tab', shiftKey: true })
    expect(first).toHaveFocus()
  })

  it.each([
    ['插入上方行', 3, 2],
    ['插入下方行', 3, 2],
    ['插入左侧列', 2, 3],
    ['插入右侧列', 2, 3],
    ['删除当前行', 1, 2],
    ['删除当前列', 2, 1],
  ])('表格工具执行%s后应更新表格结构', (action, rows, columns) => {
    const { container } = render(
      <DocumentEditor
        value={'| A | B |\n| --- | --- |\n| C | D |'}
        onChange={vi.fn()}
      />,
    )
    fireEvent.contextMenu(screen.getByText('C'))

    fireEvent.click(screen.getByRole('menuitem', { name: action }))

    expect(container.querySelectorAll('.block-editor__table tr')).toHaveLength(
      rows,
    )
    expect(
      container.querySelectorAll('.block-editor__table tr')[0].children,
    ).toHaveLength(columns)
  })

  it('连续单元格应支持合并和拆分', () => {
    const onChange = vi.fn()
    const { unmount } = render(
      <DocumentEditor
        value={'| A | B |\n| --- | --- |\n| C | D |'}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByText('A'))
    fireEvent.click(screen.getByText('B'), { shiftKey: true })
    fireEvent.contextMenu(screen.getByText('B'))

    fireEvent.click(screen.getByRole('menuitem', { name: '合并单元格' }))

    expect(screen.getByText('A').closest('th')).toHaveAttribute('colspan', '2')
    expect(onChange).toHaveBeenLastCalledWith(
      expect.stringContaining('colspan="2"'),
    )

    unmount()
    const { container: splitContainer } = render(
      <DocumentEditor
        value={
          '<table><thead><tr><th colspan="2">A</th></tr></thead><tbody><tr><td>C</td><td>D</td></tr></tbody></table>'
        }
        onChange={onChange}
      />,
    )
    fireEvent.contextMenu(screen.getByText('A'))
    fireEvent.click(screen.getByRole('menuitem', { name: '拆分单元格' }))

    expect(
      splitContainer.querySelectorAll('.block-editor__table tr')[0].children,
    ).not.toHaveLength(1)
  })

  it('表格工具应支持表头、对齐和清空内容', () => {
    const onChange = vi.fn()
    const { container, unmount } = render(
      <DocumentEditor
        value={'| A | B |\n| --- | --- |\n| C | D |'}
        onChange={onChange}
      />,
    )
    fireEvent.contextMenu(screen.getByText('A'))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: '表头' }))
    expect(
      container.querySelector('.block-editor__table th'),
    ).not.toBeInTheDocument()

    unmount()
    render(
      <DocumentEditor
        value={'| A | B |\n| --- | --- |\n| C | D |'}
        onChange={onChange}
      />,
    )
    fireEvent.contextMenu(screen.getByText('C'))
    fireEvent.click(screen.getByRole('menuitemradio', { name: '居中对齐' }))
    expect(screen.getByText('C').closest('td')).toHaveStyle({
      textAlign: 'center',
    })

    fireEvent.contextMenu(screen.getByText('C'))
    fireEvent.click(screen.getByRole('menuitem', { name: '清空单元格' }))
    expect(screen.queryByText('C')).not.toBeInTheDocument()
  })

  it('删除表格后应保留可编辑空段落', () => {
    const { container } = render(
      <DocumentEditor
        value={'| A | B |\n| --- | --- |\n| C | D |'}
        onChange={vi.fn()}
      />,
    )
    fireEvent.contextMenu(screen.getByText('A'))

    fireEvent.click(screen.getByRole('menuitem', { name: '删除表格' }))

    expect(
      container.querySelector('.block-editor__table'),
    ).not.toBeInTheDocument()
    expect(
      container.querySelector('.block-editor__paragraph'),
    ).toBeInTheDocument()
  })

  it('表格边缘加号和列宽拖拽应更新结构化数据', () => {
    const onChange = vi.fn()
    const { container } = render(
      <DocumentEditor
        value={'| A | B |\n| --- | --- |\n| C | D |'}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '在第 1 行上方插入' }))
    expect(container.querySelectorAll('.block-editor__table tr')).toHaveLength(
      3,
    )

    const resizeHandle = screen.getByRole('separator', {
      name: '调整第 1 列宽度',
    })
    fireEvent.mouseDown(resizeHandle, { clientX: 100 })
    fireEvent.mouseMove(window, { clientX: 180 })
    fireEvent.mouseUp(window)
    expect(onChange).toHaveBeenLastCalledWith(
      expect.stringContaining('style="width:240px"'),
    )
  })
})

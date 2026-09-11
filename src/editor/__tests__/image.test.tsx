import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  DocumentEditor,
  fireEvent,
  render,
  screen,
  within,
  type ImageDraft,
} from './helpers'

describe('DocumentEditor', () => {
  afterEach(() => vi.restoreAllMocks())

  it('图片加载失败应显示错误占位和原始 URL', () => {
    render(
      <DocumentEditor
        value="![封面](https://example.com/broken.png)"
        onChange={vi.fn()}
      />,
    )

    fireEvent.error(screen.getByRole('img', { name: '封面' }))

    expect(screen.getByText('图片加载失败')).toBeInTheDocument()
    expect(
      screen.queryByText('https://example.com/broken.png'),
    ).not.toBeInTheDocument()
  })

  it('图片工具应支持左中右排版并保存设置', () => {
    const onChange = vi.fn()
    render(
      <DocumentEditor
        value="![封面](https://example.com/a.png)"
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('img', { name: '封面' }))
    fireEvent.click(screen.getByRole('button', { name: '图片居中对齐' }))

    expect(
      screen.getByRole('img', { name: '封面' }).closest('figure'),
    ).toHaveStyle({
      textAlign: 'center',
      justifyItems: 'center',
    })
    expect(onChange).toHaveBeenLastCalledWith(
      '<p style="text-align:center"><img src="https://example.com/a.png" alt="封面"></p>',
    )

    fireEvent.click(screen.getByRole('button', { name: '图片右对齐' }))

    expect(
      screen.getByRole('img', { name: '封面' }).closest('figure'),
    ).toHaveStyle({
      textAlign: 'right',
      justifyItems: 'end',
    })
    expect(onChange).toHaveBeenLastCalledWith(
      '<p style="text-align:right"><img src="https://example.com/a.png" alt="封面"></p>',
    )
  })

  it('图片工具应支持百分比宽度并保存设置', () => {
    // Given 管理员选中一张正文图片
    const onChange = vi.fn()
    render(
      <DocumentEditor
        value="![封面](https://example.com/a.png)"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('img', { name: '封面' }))

    // When 将图片大小调整为 75%
    fireEvent.change(screen.getByRole('combobox', { name: '图片大小' }), {
      target: { value: '75' },
    })

    // Then 预览宽度和保存内容都应同步更新
    expect(screen.getByRole('img', { name: '封面' })).toHaveStyle({
      width: '75%',
    })
    expect(onChange).toHaveBeenLastCalledWith(
      '<p style="text-align:left"><img src="https://example.com/a.png" alt="封面" style="width:75%"></p>',
    )
  })

  it('顶部上传图片应插入最近聚焦块之后', () => {
    // Given 管理员把光标放在正文中间的内容块
    // When 上传按钮夺取焦点后选择并确认一张正文图片
    // Then 新图片仍插入原光标块之后，后面的正文顺序保持不变
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:cursor-image')
    const onChange = vi.fn()
    const { container } = render(
      <DocumentEditor
        value={'第一段\n\n第二段\n\n第三段'}
        onChange={onChange}
      />,
    )
    screen.getByText('第二段').focus()
    const upload = screen.getByRole('button', { name: '上传图片' })
    upload.focus()
    fireEvent.click(upload)

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(['gif'], 'cursor.gif', { type: 'image/gif' })],
      },
    })
    fireEvent.click(screen.getByRole('button', { name: '确认 GIF' }))

    expect(onChange).toHaveBeenLastCalledWith(
      '第一段\n\n第二段\n\n![](blob:cursor-image)\n\n第三段',
    )
    createObjectUrl.mockRestore()
  })

  it('复制本地图片后移除其中一个块不应释放仍被历史和正文引用的草稿', async () => {
    // Given 一个待保存图片块被复制为两个共享本地预览的块
    // When 管理员移除其中一个图片块
    // Then 剩余块继续显示且草稿保留给保存或撤销历史使用
    const previewUrl = 'blob:shared-draft'
    const draft: ImageDraft = {
      id: 'shared-draft',
      originalFile: new File(['source'], 'shared.webp', {
        type: 'image/webp',
      }),
      previewUrl,
      type: 'static',
      uploadBlob: new Blob(['cropped'], { type: 'image/webp' }),
    }
    const onDraftRelease = vi.fn()
    const { container } = render(
      <DocumentEditor
        imageDrafts={new Map([[previewUrl, draft]])}
        value={`![待保存图片](${previewUrl})`}
        onChange={vi.fn()}
        onImageDraftRelease={onDraftRelease}
      />,
    )
    const firstBlock = container.querySelector<HTMLElement>(
      '.block-editor__block',
    )!
    fireEvent.click(
      within(firstBlock).getByRole('button', { name: '打开块工具' }),
    )
    fireEvent.click(screen.getByRole('button', { name: '复制块' }))
    expect(screen.getAllByRole('img', { name: '待保存图片' })).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('img', { name: '待保存图片' })[0])
    fireEvent.click(screen.getByRole('button', { name: '移除图片' }))
    fireEvent.click(
      within(
        await screen.findByRole('dialog', { name: '移除正文图片' }),
      ).getByRole('button', { name: '移除图片' }),
    )

    expect(screen.getAllByRole('img', { name: '待保存图片' })).toHaveLength(1)
    expect(onDraftRelease).not.toHaveBeenCalled()
  })
})

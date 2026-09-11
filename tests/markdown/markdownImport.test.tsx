import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MarkdownImportControl } from '@/editor/chrome/MarkdownImportControl'
import { normalizeMarkdownImport } from '@/markdown/markdownImport'

const markdownFile = (name: string, content: string) =>
  Object.assign(new File([content], name, { type: 'text/markdown' }), {
    text: vi.fn().mockResolvedValue(content),
  })

describe('Markdown 导入', () => {
  it('应将 Obsidian Markdown 解析为正文并忽略所有图片', () => {
    const markdown = `## 安装

| 组件 | 作用 |
| --- | --- |
| PostgreSQL | 服务端 |

\`\`\`sql
SELECT version();
\`\`\`

> [!warning] 常见误解
> - 第一项
> - 第二项

上一章：[[01-PostgreSQL 是什么]] · 下一章：[[03-基本结构|基本结构]]

![远程图片](https://example.com/postgres.png)

![引用图片][cover]

[cover]: ./cover.png

![[本地截图.png]]`

    const result = normalizeMarkdownImport(markdown)

    expect(result).toContain('## 安装')
    expect(result).toContain('| PostgreSQL | 服务端 |')
    expect(result).toContain('```sql')
    expect(result).toContain('警告：常见误解')
    expect(result).toContain('- 第一项')
    expect(result).toContain('上一章：01-PostgreSQL 是什么')
    expect(result).toContain('下一章：基本结构')
    expect(result).not.toContain('远程图片')
    expect(result).not.toContain('引用图片')
    expect(result).not.toContain('cover.png')
    expect(result).not.toContain('本地截图.png')
  })

  it('应在确认后用导入结果覆盖已有正文', async () => {
    const onImport = vi.fn()
    render(
      <MarkdownImportControl currentContent="已有正文" onImport={onImport} />,
    )

    fireEvent.change(screen.getByLabelText('选择 Markdown 文件'), {
      target: { files: [markdownFile('note.md', '# 导入正文')] },
    })

    expect(await screen.findByText('覆盖当前正文')).toBeInTheDocument()
    expect(onImport).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确认导入' }))

    expect(onImport).toHaveBeenCalledWith('# 导入正文')
    expect(screen.getByRole('status')).toHaveTextContent('已导入 note.md')
  })

  it('应在取消覆盖时保留已有正文', async () => {
    const onImport = vi.fn()
    render(
      <MarkdownImportControl currentContent="已有正文" onImport={onImport} />,
    )

    fireEvent.change(screen.getByLabelText('选择 Markdown 文件'), {
      target: { files: [markdownFile('note.md', '# 导入正文')] },
    })
    fireEvent.click(await screen.findByRole('button', { name: '保留当前正文' }))

    expect(onImport).not.toHaveBeenCalled()
    expect(screen.queryByText('覆盖当前正文')).not.toBeInTheDocument()
  })

  it('应在文件无效或读取失败时提示错误并保留正文', async () => {
    const onImport = vi.fn()
    render(
      <MarkdownImportControl currentContent="已有正文" onImport={onImport} />,
    )

    fireEvent.change(screen.getByLabelText('选择 Markdown 文件'), {
      target: { files: [markdownFile('note.txt', '不是 Markdown')] },
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '请选择 .md 文件',
    )
    expect(onImport).not.toHaveBeenCalled()

    const unreadableFile = Object.assign(
      new File(['正文'], 'broken.md', { type: 'text/markdown' }),
      { text: vi.fn().mockRejectedValue(new Error('read failed')) },
    )
    fireEvent.change(screen.getByLabelText('选择 Markdown 文件'), {
      target: { files: [unreadableFile] },
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '无法读取 Markdown 文件，请重新选择',
    )
    expect(onImport).not.toHaveBeenCalled()
  })
})

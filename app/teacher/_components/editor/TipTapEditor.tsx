'use client';

import { useState, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Button } from '@/app/_components/ui/button';
import { Toggle } from '@/app/_components/ui/toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter,
    AlignRight, AlignJustify, List, ListOrdered, Quote, Image as ImageIcon, Link as LinkIcon,
    Undo, Redo, Code, Heading1, Heading2, Heading3, Table as TableIcon, Highlighter, Eye
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/app/_components/ui/dialog';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';

// 导入语法高亮相关依赖
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import 'highlight.js/styles/github.css';

// 创建 lowlight 实例并注册常用语言
const lowlight = createLowlight(common);

interface TipTapEditorProps {
    onChange: (content: string) => void;
    initialContent?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [codeLanguage, setCodeLanguage] = useState('javascript');
    const [codeDialogOpen, setCodeDialogOpen] = useState(false);

    if (!editor) {
        return null;
    }

    // 上传图片
    const uploadImage = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async () => {
            if (!input.files?.length) return;

            const file = input.files[0];
            const formData = new FormData();
            formData.append('file', file);

            try {
                toast.loading('正在上传图片...');
                const response = await apiClient.post<{ url: string; filename: string }>('/minio/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (response.code === 0) {
                    editor.chain().focus().setImage({ src: response.data!.url }).run();
                    toast.success('图片上传成功');
                } else {
                    toast.error('图片上传失败', {
                        description: response.msg || '服务器错误',
                    });
                }
            } catch (error) {
                console.error('上传图片错误:', error);
                toast.error('图片上传失败', {
                    description: '服务器错误，请稍后再试',
                });
            }
        };

        input.click();
    };

    // 添加链接
    const openLinkDialog = () => {
        const previousUrl = editor.getAttributes('link').href;
        setLinkUrl(previousUrl || '');
        setLinkDialogOpen(true);
    };

    const setLink = () => {
        if (linkUrl === '') {
            editor.chain().focus().unsetLink().run();
        } else {
            editor.chain().focus().setLink({ href: linkUrl }).run();
        }
        setLinkDialogOpen(false);
    };

    // 插入表格
    const insertTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

        // 确保表格单元格有初始内容，解决光标问题
        setTimeout(() => {
            const cells = document.querySelectorAll('td, th');
            cells.forEach(cell => {
                if (!cell.textContent) {
                    cell.innerHTML = '<p></p>';
                }
            });

            // 聚焦到第一个单元格
            if (cells.length > 0) {
                const firstCell = cells[0];
                const range = document.createRange();
                const sel = window.getSelection();
                range.setStart(firstCell, 0);
                range.collapse(true);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }, 100);
    };

    // 打开代码块对话框
    const openCodeDialog = () => {
        setCodeDialogOpen(true);
    };

    // 插入代码块
    const insertCodeBlock = () => {
        editor.chain().focus().setCodeBlock({ language: codeLanguage }).run();
        setCodeDialogOpen(false);
    };

    return (
        <>
            <div className="border-b p-2 flex flex-wrap gap-1 bg-gray-50">
                <div className="flex flex-wrap gap-1 mb-1 w-full">
                    <Toggle
                        pressed={editor.isActive('bold')}
                        onPressedChange={() => editor.chain().focus().toggleBold().run()}
                        aria-label="加粗"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <Bold className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        pressed={editor.isActive('italic')}
                        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                        aria-label="斜体"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <Italic className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        pressed={editor.isActive('underline')}
                        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                        aria-label="下划线"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <UnderlineIcon className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        pressed={editor.isActive('strike')}
                        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                        aria-label="删除线"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <Strikethrough className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        pressed={editor.isActive('highlight')}
                        onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
                        aria-label="高亮"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <Highlighter className="h-4 w-4" />
                    </Toggle>

                    <div className="h-6 w-px bg-gray-300 mx-1"></div>

                    <Toggle
                        pressed={editor.isActive({ textAlign: 'left' })}
                        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
                        aria-label="左对齐"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        pressed={editor.isActive({ textAlign: 'center' })}
                        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
                        aria-label="居中对齐"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        pressed={editor.isActive({ textAlign: 'right' })}
                        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
                        aria-label="右对齐"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <AlignRight className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        pressed={editor.isActive({ textAlign: 'justify' })}
                        onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
                        aria-label="两端对齐"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <AlignJustify className="h-4 w-4" />
                    </Toggle>

                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
                </div>

                <div className="flex flex-wrap gap-1 mb-1 w-full">
                    <Toggle
                        pressed={editor.isActive('heading', { level: 1 })}
                        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        aria-label="标题1"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <Heading1 className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        pressed={editor.isActive('heading', { level: 2 })}
                        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        aria-label="标题2"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <Heading2 className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        pressed={editor.isActive('heading', { level: 3 })}
                        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        aria-label="标题3"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <Heading3 className="h-4 w-4" />
                    </Toggle>

                    <div className="h-6 w-px bg-gray-300 mx-1"></div>

                    <Toggle
                        pressed={editor.isActive('bulletList')}
                        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                        aria-label="无序列表"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <List className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        pressed={editor.isActive('orderedList')}
                        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                        aria-label="有序列表"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Toggle>

                    <Toggle
                        pressed={editor.isActive('blockquote')}
                        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                        aria-label="引用"
                        className="data-[state=on]:bg-gray-200"
                    >
                        <Quote className="h-4 w-4" />
                    </Toggle>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={openCodeDialog}
                        className={`h-8 ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
                    >
                        <Code className="h-4 w-4 mr-1" />
                        代码块
                    </Button>

                    <div className="h-6 w-px bg-gray-300 mx-1"></div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={uploadImage}
                        className="h-8"
                    >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        图片
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={openLinkDialog}
                        className={`h-8 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
                    >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        链接
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={insertTable}
                        className="h-8"
                    >
                        <TableIcon className="h-4 w-4 mr-1" />
                        表格
                    </Button>

                    <div className="h-6 w-px bg-gray-300 mx-1"></div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="h-8"
                    >
                        <Undo className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className="h-8"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* 链接对话框 */}
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>添加链接</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="link-url" className="text-right">
                                URL
                            </Label>
                            <Input
                                id="link-url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="col-span-3"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        setLink();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setLinkDialogOpen(false)}>
                            取消
                        </Button>
                        <Button type="button" onClick={setLink}>
                            确认
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 代码块对话框 */}
            <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>插入代码块</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code-language" className="text-right">
                                语言
                            </Label>
                            <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="选择编程语言" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="javascript">JavaScript</SelectItem>
                                    <SelectItem value="typescript">TypeScript</SelectItem>
                                    <SelectItem value="html">HTML</SelectItem>
                                    <SelectItem value="css">CSS</SelectItem>
                                    <SelectItem value="plaintext">Plain Text</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setCodeDialogOpen(false)}>
                            取消
                        </Button>
                        <Button type="button" onClick={insertCodeBlock}>
                            确认
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export function TipTapEditor({ onChange, initialContent = '' }: TipTapEditorProps) {
    const [activeTab, setActiveTab] = useState<string>('edit');
    const [content, setContent] = useState<string>(initialContent);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // 禁用默认的代码块，使用自定义的
            }),
            Image,
            // 修复 Link 扩展配置
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 underline',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                },
            }),
            Placeholder.configure({
                placeholder: '开始编写文章内容...',
                // 确保占位符在空内容时显示
                showOnlyCurrent: false,
                showOnlyWhenEditable: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Underline,
            // 使用支持语法高亮的代码块
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    class: 'bg-gray-100 p-2 rounded font-mono text-sm overflow-auto',
                },
            }),
            Highlight.configure({
                HTMLAttributes: {
                    class: 'bg-yellow-200',
                },
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse table-auto w-full',
                },
            }),
            TableRow,
            TableHeader.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 px-4 py-2 bg-gray-100 font-bold',
                },
            }),
            TableCell.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 px-4 py-2',
                },
            }),
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setContent(html);
            onChange(html);
        },
        editorProps: {
            attributes: {
                class: 'focus:outline-none w-full h-full min-h-[300px] cursor-text',
            },
        },
    });

    // 处理预览内容中的链接，确保它们是绝对URL并在新窗口打开
    const processContent = (htmlContent: string) => {
        // 创建一个临时的DOM元素来处理HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // 处理所有链接
        const links = tempDiv.querySelectorAll('a');
        links.forEach(link => {
            let href = link.getAttribute('href') || '';

            // 确保链接是绝对URL
            if (href && !href.startsWith('http://') && !href.startsWith('https://')) {
                href = `https://${href}`;
                link.setAttribute('href', href);
            }

            // 确保链接在新窗口打开
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });

        // 处理代码块，确保它们在预览中也有高亮
        const codeBlocks = tempDiv.querySelectorAll('pre > code');
        codeBlocks.forEach(codeBlock => {
            const language = codeBlock.getAttribute('class')?.replace('language-', '') || '';
            if (language && lowlight.registered(language)) {
                try {
                    // 修复 lowlight.highlight 的使用方式
                    const result = lowlight.highlight(language, codeBlock.textContent || '');
                    // 根据 lowlight 文档，结果是一个 hast 树，需要提取 value
                    if (result.children && result.children.length > 0) {
                        // 将 hast 树转换为 HTML 字符串
                        let html = '';
                        const processNode = (node: any) => {
                            if (node.type === 'element') {
                                html += `<${node.tagName}${node.properties && node.properties.className
                                    ? ` class="${Array.isArray(node.properties.className)
                                        ? node.properties.className.join(' ')
                                        : node.properties.className}"`
                                    : ''
                                    }>`;
                                if (node.children) node.children.forEach(processNode);
                                html += `</${node.tagName}>`;
                            } else if (node.type === 'text') {
                                html += node.value;
                            }
                        };

                        result.children.forEach(processNode);
                        codeBlock.innerHTML = html;
                        codeBlock.classList.add('hljs');
                    }
                } catch (error) {
                    console.error('代码高亮错误:', error);
                }
            }
        });

        return tempDiv.innerHTML;
    };

    return (
        <div className="border rounded-md overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center border-b">
                    <TabsList className="bg-transparent">
                        <TabsTrigger value="edit" className="data-[state=active]:bg-gray-100">
                            编辑
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="data-[state=active]:bg-gray-100">
                            <Eye className="h-4 w-4 mr-1" />
                            预览
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="edit" className="mt-0">
                    {editor && <MenuBar editor={editor} />}
                    <div className="p-4 min-h-[300px] prose max-w-none editor-content cursor-text" onClick={() => editor?.chain().focus().run()}>
                        <EditorContent editor={editor} />
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-0">
                    <div
                        className="p-4 min-h-[300px] prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: processContent(content) }}
                    />
                </TabsContent>
            </Tabs>

            <style jsx global>{`
                /* 自定义标题样式 */
                .editor-content h1 {
                    font-size: 2em;
                    font-weight: bold;
                    margin-top: 0.67em;
                    margin-bottom: 0.67em;
                }
                .editor-content h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-top: 0.83em;
                    margin-bottom: 0.83em;
                }
                .editor-content h3 {
                    font-size: 1.17em;
                    font-weight: bold;
                    margin-top: 1em;
                    margin-bottom: 1em;
                }
                /* 表格样式 */
                .editor-content table {
                    border-collapse: collapse;
                    width: 100%;
                }
                .editor-content th, .editor-content td {
                    border: 1px solid #e5e7eb;
                    padding: 8px;
                    min-width: 100px;
                }
                .editor-content th {
                    background-color: #f9fafb;
                    font-weight: bold;
                }
                /* 确保表格单元格始终可见 */
                .editor-content td p, .editor-content th p {
                    min-height: 1em;
                }
                /* 代码块样式 */
                .editor-content pre {
                    background-color: #f3f4f6;
                    padding: 1em;
                    border-radius: 0.375rem;
                    overflow-x: auto;
                }
                .editor-content code {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                    font-size: 0.875em;
                }
                /* 确保编辑器始终可点击 */
                .ProseMirror {
                    min-height: 300px;
                    width: 100%;
                }
                /* 确保占位符正确显示 */
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #adb5bd;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}

export default TipTapEditor;
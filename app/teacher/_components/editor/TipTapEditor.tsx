'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/app/_components/ui/button';
import { Toggle } from '@/app/_components/ui/toggle';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';

interface TipTapEditorProps {
    onChange: (content: string) => void;
    initialContent?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
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
                const response = await apiClient.post<{ url: string; filename: string }>('/minio/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (response.code === 0) {
                    editor.chain().focus().setImage({ src: response.data!.url }).run();
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
    const setLink = () => {
        const url = window.prompt('URL');

        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        } else {
            editor.chain().focus().unsetLink().run();
        }
    };

    return (
        <div className="border-b p-2 flex flex-wrap gap-1">
            <Toggle
                pressed={editor.isActive('bold')}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                aria-label="加粗"
            >
                <span className="font-bold">B</span>
            </Toggle>

            <Toggle
                pressed={editor.isActive('italic')}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                aria-label="斜体"
            >
                <span className="italic">I</span>
            </Toggle>

            <Toggle
                pressed={editor.isActive('strike')}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                aria-label="删除线"
            >
                <span className="line-through">S</span>
            </Toggle>

            <Toggle
                pressed={editor.isActive('heading', { level: 1 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                aria-label="标题1"
            >
                H1
            </Toggle>

            <Toggle
                pressed={editor.isActive('heading', { level: 2 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                aria-label="标题2"
            >
                H2
            </Toggle>

            <Toggle
                pressed={editor.isActive('heading', { level: 3 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                aria-label="标题3"
            >
                H3
            </Toggle>

            <Toggle
                pressed={editor.isActive('bulletList')}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                aria-label="无序列表"
            >
                • 列表
            </Toggle>

            <Toggle
                pressed={editor.isActive('orderedList')}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                aria-label="有序列表"
            >
                1. 列表
            </Toggle>

            <Toggle
                pressed={editor.isActive('blockquote')}
                onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                aria-label="引用"
            >
                引用
            </Toggle>

            <Button
                variant="outline"
                size="sm"
                onClick={uploadImage}
            >
                图片
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={setLink}
            >
                链接
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
            >
                撤销
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
            >
                重做
            </Button>
        </div>
    );
};

export function TipTapEditor({ onChange, initialContent = '' }: TipTapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder: '开始编写文章内容...',
            }),
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    return (
        <div className="border rounded-md overflow-hidden">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} className="p-4 min-h-[300px]" />
        </div>
    );
}

export default TipTapEditor;
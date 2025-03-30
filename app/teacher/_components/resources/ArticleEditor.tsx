'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Textarea } from '@/app/_components/ui/textarea';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import ResourceForm from './ResourceForm';

interface ArticleEditorProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export default function ArticleEditor({ onCancel, onSuccess }: ArticleEditorProps) {
    const [articleForm, setArticleForm] = useState({
        title: '',
        description: '',
        content: '',
        coverImage: ''
    });
    const [loading, setLoading] = useState(false);
    const [editorLoaded, setEditorLoaded] = useState(false);
    const [editor, setEditor] = useState<any>(null);

    // 编辑器引用
    const editorRef = useRef<HTMLDivElement>(null);

    // 初始化编辑器
    useEffect(() => {
        // 动态加载编辑器
        if (!editorLoaded) {
            import('@/app/teacher/_components/editor/TipTapEditor').then(({ TipTapEditor }) => {
                if (editorRef.current) {
                    const newEditor = TipTapEditor({
                        onChange: (content: string) => {
                            setArticleForm(prev => ({ ...prev, content }));
                        }
                    });
                    setEditor(newEditor);
                    setEditorLoaded(true);
                }
            }).catch(err => {
                console.error('加载编辑器失败:', err);
                toast.error('加载编辑器失败');
            });
        }

        // 清理函数
        return () => {
            if (editor && editor.destroy) {
                editor.destroy();
            }
        };
    }, []);

    // 处理表单变化
    const handleFormChange = (name: string, value: string) => {
        setArticleForm(prev => ({ ...prev, [name]: value }));
    };

    // 上传封面图片
    const handleUploadCover = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post<{ url: string; filename: string }>('/minio/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.code === 0) {
                setArticleForm(prev => ({ ...prev, coverImage: response.data!.url }));
                return response.data!.url;
            } else {
                toast.error('封面上传失败', {
                    description: response.msg || '服务器错误',
                });
                return null;
            }
        } catch (error) {
            console.error('上传封面错误:', error);
            toast.error('封面上传失败', {
                description: '服务器错误，请稍后再试',
            });
            return null;
        }
    };

    // 提交文章
    const handleSubmit = async () => {
        if (!articleForm.title.trim() || !articleForm.description.trim() || !articleForm.content.trim()) {
            toast.error('请完善文章信息', {
                description: '标题、简介和内容不能为空',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/resource/create', {
                title: articleForm.title,
                description: articleForm.description,
                content: articleForm.content,
                type: 'article',
                coverImage: articleForm.coverImage || null
            });

            if (response.code === 0) {
                onSuccess();
            } else {
                toast.error('文章创建失败', {
                    description: response.msg || '服务器错误',
                });
            }
        } catch (error) {
            console.error('创建文章错误:', error);
            toast.error('文章创建失败', {
                description: '服务器错误，请稍后再试',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>新增文章</CardTitle>
                <CardDescription>创建新的文章资源</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ResourceForm
                    formData={{
                        title: articleForm.title,
                        description: articleForm.description,
                        coverImage: articleForm.coverImage
                    }}
                    onChange={handleFormChange}
                    onUploadCover={handleUploadCover}
                />

                <div className="space-y-2">
                    <Label htmlFor="content">文章内容</Label>
                    <div
                        ref={editorRef}
                        className="min-h-[400px] border rounded-md p-4"
                    >
                        {!editorLoaded && <p>加载编辑器中...</p>}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={onCancel}>
                    取消
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? '提交中...' : '发布文章'}
                </Button>
            </CardFooter>
        </Card>
    );
}
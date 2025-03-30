'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import ResourceForm from './ResourceForm';
import dynamic from 'next/dynamic';

// 动态导入编辑器组件，禁用 SSR
const TipTapEditor = dynamic(
    () => import('@/app/teacher/_components/editor/TipTapEditor').then(mod => mod.TipTapEditor),
    {
        ssr: false,
        loading: () => <div className="min-h-[400px] border rounded-md p-4 flex items-center justify-center">
            <p>加载编辑器中...</p>
        </div>
    }
);

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

    // 处理表单变化
    const handleFormChange = (name: string, value: string) => {
        setArticleForm(prev => ({ ...prev, [name]: value }));
    };

    // 处理编辑器内容变化
    const handleEditorChange = (content: string) => {
        setArticleForm(prev => ({ ...prev, content }));
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
            const response = await apiClient.post('/resource', {
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
                    <div className="min-h-[400px]">
                        <TipTapEditor
                            onChange={handleEditorChange}
                            initialContent={articleForm.content}
                        />
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
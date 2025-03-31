'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import ResourceForm from './ResourceForm';
import dynamic from 'next/dynamic';

// 动态导入编辑器组件，禁用 SSR
const TipTapEditor = dynamic(
    () => import('@/app/teacher/_components/editor/TipTapEditor'),
    {
        ssr: false,
        loading: () => <div className="min-h-[400px] border rounded-md p-4 flex items-center justify-center">
            <p>加载编辑器中...</p>
        </div>
    }
);

// 资源类型接口
interface Resource {
    id: number;
    title: string;
    description: string;
    content?: string;
    url: string;
    type: 'article' | 'video' | 'tool';
    createdAt: string;
    updatedAt: string;
    duration?: number;
    author: string;
    coverImage?: string;
}

interface ArticleEditorProps {
    onCancel: () => void;
    onSuccess: () => void;
    initialData?: Resource; // 添加初始数据，用于编辑模式
    isEditing?: boolean; // 是否为编辑模式
}

export default function ArticleEditor({ onCancel, onSuccess, initialData, isEditing = false }: ArticleEditorProps) {
    const [articleForm, setArticleForm] = useState({
        title: '',
        description: '',
        content: '',
        coverImage: ''
    });
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // 添加提交状态标记

    // 如果是编辑模式，初始化表单数据
    useEffect(() => {
        if (isEditing && initialData) {
            setArticleForm({
                title: initialData.title || '',
                description: initialData.description || '',
                content: initialData.content || '',
                coverImage: initialData.coverImage || ''
            });
        }
    }, [isEditing, initialData]);

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
            // 创建一个 loading toast 并保存它的 ID
            const loadingToastId = toast.loading('正在上传封面...');
            
            const response = await apiClient.post<{ url: string; filename: string }>('/minio/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
    
            // 关闭 loading toast
            toast.dismiss(loadingToastId);
    
            if (response.code === 0) {
                setArticleForm(prev => ({ ...prev, coverImage: response.data!.url }));
                toast.success('封面上传成功');
                return response.data!.url;
            } else {
                toast.error('封面上传失败', {
                    description: response.msg || '服务器错误',
                });
                return null;
            }
        } catch (error) {
            // 确保在出错时也关闭所有 loading toast
            toast.dismiss();
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

        // 防止重复提交
        if (isSubmitting) return;
        setIsSubmitting(true);
        setLoading(true);
        
        try {
            // 移除这里的 toast.loading，避免多次提示
            // toast.loading(isEditing ? '正在更新文章...' : '正在提交文章...');
            
            let response;
            if (isEditing && initialData) {
                // 更新文章
                response = await apiClient.put(`/resource/${initialData.id}`, {
                    title: articleForm.title,
                    description: articleForm.description,
                    content: articleForm.content,
                    type: 'article',
                    coverImage: articleForm.coverImage || null
                });
            } else {
                // 创建新文章
                response = await apiClient.post('/resource', {
                    title: articleForm.title,
                    description: articleForm.description,
                    content: articleForm.content,
                    type: 'article',
                    coverImage: articleForm.coverImage || null
                });
            }

            if (response.code === 0) {
                // 移除这里的 toast.success，只在 onSuccess 中显示一次
                // toast.success(isEditing ? '文章更新成功' : '文章创建成功');
                onSuccess();
            } else {
                toast.error(isEditing ? '文章更新失败' : '文章创建失败', {
                    description: response.msg || '服务器错误',
                });
            }
        } catch (error) {
            console.error(isEditing ? '更新文章错误:' : '创建文章错误:', error);
            toast.error(isEditing ? '文章更新失败' : '文章创建失败', {
                description: '服务器错误，请稍后再试',
            });
        } finally {
            setLoading(false);
            setIsSubmitting(false); // 重置提交状态
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{isEditing ? '编辑文章' : '新增文章'}</CardTitle>
                <CardDescription>{isEditing ? '修改现有文章' : '创建新的文章资源'}</CardDescription>
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
                    {loading ? (isEditing ? '更新中...' : '提交中...') : (isEditing ? '更新文章' : '发布文章')}
                </Button>
            </CardFooter>
        </Card>
    );
}
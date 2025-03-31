'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';

// 导入拆分的组件
import ResourceList from '@/app/teacher/_components/resources/ResourceList';
import ArticleEditor from '@/app/teacher/_components/resources/ArticleEditor';
import VideoUploader from '@/app/teacher/_components/resources/VideoUploader';
import ResourcePreview from '@/app/teacher/_components/resources/ResourcePreview'; // 导入预览组件

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

export default function TeacherResources() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'list' | 'article' | 'video' | 'edit-article' | 'edit-video' | 'preview'>('list');
    const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null);
    const [resourceToPreview, setResourceToPreview] = useState<number | null>(null); // 添加预览状态

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'teacher') {
            router.push('/auth/login');
            return;
        }
    }, [router]);

    // 处理资源编辑
    const handleEditResource = (resource: Resource) => {
        setResourceToEdit(resource);
        if (resource.type === 'article') {
            setActiveTab('edit-article');
        } else if (resource.type === 'video') {
            setActiveTab('edit-video');
        }
    };

    // 返回列表
    const handleReturnToList = () => {
        setActiveTab('list');
        setResourceToEdit(null);
    };

    // 处理文章编辑成功
    const handleArticleEditSuccess = () => {
        toast.success('文章更新成功');
        // 使用 setTimeout 确保状态更新的顺序正确
        setTimeout(() => {
            setActiveTab('list');
            setResourceToEdit(null);
        }, 100);
    };

    // 处理文章创建成功
    const handleArticleCreateSuccess = () => {
        toast.success('文章创建成功');
        setActiveTab('list');
    };

    // 处理视频编辑成功
    const handleVideoEditSuccess = () => {
        toast.success('视频更新成功');
        // 使用 setTimeout 确保状态更新的顺序正确
        setTimeout(() => {
            setActiveTab('list');
            setResourceToEdit(null);
        }, 100);
    };

    // 处理视频创建成功
    const handleVideoCreateSuccess = () => {
        toast.success('视频上传成功');
        setActiveTab('list');
    };

    // 处理资源预览
    const handlePreview = (resourceId: number) => {
        setResourceToPreview(resourceId);
        setActiveTab('preview');
    };

    // 处理返回列表
    const handleBackToList = () => {
        setActiveTab('list');
        setResourceToPreview(null);
    };

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className='max-w-[940px] mx-auto '>
                <Card>
                    <CardHeader>
                        <CardTitle>教学资源管理</CardTitle>
                        <CardDescription>管理您的教学文章、视频和工具资源</CardDescription>
                        <div className="flex justify-between items-center">
                            <h1 className="text-3xl font-bold">资源管理</h1>
                            <div className="space-x-4">
                                <Button variant="outline" onClick={() => router.push('/teacher/dashboard')}>
                                    返回仪表盘
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="list" value={activeTab} onValueChange={(value) => {
                            // 只允许切换到 list, article, video 标签页
                            if (['list', 'article', 'video'].includes(value)) {
                                setActiveTab(value as 'list' | 'article' | 'video');
                            }
                        }}>
                            <TabsList>
                                <TabsTrigger value="list">资源列表</TabsTrigger>
                                <TabsTrigger value="article">新增文章</TabsTrigger>
                                <TabsTrigger value="video">上传视频</TabsTrigger>
                            </TabsList>

                            {/* 资源列表 */}
                            <TabsContent value="list">
                                <ResourceList
                                    onAddArticle={() => setActiveTab('article')}
                                    onAddVideo={() => setActiveTab('video')}
                                    onEditResource={handleEditResource}
                                    onPreview={handlePreview} // 添加预览回调
                                />
                            </TabsContent>

                            {/* 新增文章 */}
                            <TabsContent value="article">
                                <ArticleEditor
                                    onCancel={() => setActiveTab('list')}
                                    onSuccess={handleArticleCreateSuccess}
                                />
                            </TabsContent>

                            {/* 编辑文章 */}
                            <TabsContent value="edit-article">
                                {resourceToEdit && (
                                    <ArticleEditor
                                        onCancel={() => {
                                            setActiveTab('list');
                                            setResourceToEdit(null);
                                        }}
                                        onSuccess={handleArticleEditSuccess}
                                        initialData={resourceToEdit}
                                        isEditing={true}
                                    />
                                )}
                            </TabsContent>

                            {/* 上传视频 */}
                            <TabsContent value="video">
                                <VideoUploader
                                    onCancel={() => setActiveTab('list')}
                                    onSuccess={handleVideoCreateSuccess}
                                />
                            </TabsContent>

                            {/* 编辑视频 */}
                            <TabsContent value="edit-video">
                                {resourceToEdit && (
                                    <VideoUploader
                                        onCancel={() => {
                                            setActiveTab('list');
                                            setResourceToEdit(null);
                                        }}
                                        onSuccess={handleVideoEditSuccess}
                                        initialData={resourceToEdit}
                                        isEditing={true}
                                    />
                                )}
                            </TabsContent>

                            {/* 资源预览 */}
                            <TabsContent value="preview">
                                {resourceToPreview && (
                                    <ResourcePreview
                                        resourceId={resourceToPreview}
                                        onBack={handleBackToList}
                                    />
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
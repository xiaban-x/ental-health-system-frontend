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

export default function TeacherResources() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'list' | 'article' | 'video'>('list');
    
    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'teacher') {
            router.push('/auth/login');
            return;
        }
    }, [router]);
    
    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">资源管理</h1>
                    <div className="space-x-4">
                        <Button variant="outline" onClick={() => router.push('/teacher/dashboard')}>
                            返回仪表盘
                        </Button>
                    </div>
                </div>
                
                <Tabs defaultValue="list" value={activeTab} onValueChange={(value) => setActiveTab(value as 'list' | 'article' | 'video')}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="list">资源列表</TabsTrigger>
                        <TabsTrigger value="article">新增文章</TabsTrigger>
                        <TabsTrigger value="video">上传视频</TabsTrigger>
                    </TabsList>
                    
                    {/* 资源列表 */}
                    <TabsContent value="list">
                        <ResourceList onAddArticle={() => setActiveTab('article')} onAddVideo={() => setActiveTab('video')} />
                    </TabsContent>
                    
                    {/* 新增文章 */}
                    <TabsContent value="article">
                        <ArticleEditor onCancel={() => setActiveTab('list')} onSuccess={() => {
                            toast.success('文章创建成功');
                            setActiveTab('list');
                        }} />
                    </TabsContent>
                    
                    {/* 上传视频 */}
                    <TabsContent value="video">
                        <VideoUploader onCancel={() => setActiveTab('list')} onSuccess={() => {
                            toast.success('视频上传成功');
                            setActiveTab('list');
                        }} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
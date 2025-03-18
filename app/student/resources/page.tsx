'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { useApi } from '@/app/_lib/api-client';
import { formatDate } from '@/app/_lib/utils';

interface Resource {
    id: number;
    title: string;
    description: string;
    content: string;
    type: 'article' | 'video' | 'tool';
    url: string;
    createTime: string;
    updateTime: string;
}

export default function StudentResources() {
    const router = useRouter();
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [resourceType, setResourceType] = useState<'all' | 'article' | 'video' | 'tool'>('all');

    // 使用SWR获取资源列表
    const { data: resources, error, isLoading } = useApi<Resource[]>('/resource/list');

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== '0') {
            router.push('/auth/login');
        }
    }, [router]);

    // 根据类型筛选资源
    const filteredResources = resources?.filter(resource =>
        resourceType === 'all' || resource.type === resourceType
    );

    // 显示资源详情
    if (selectedResource) {
        return (
            <div className="min-h-screen bg-muted p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">{selectedResource.title}</h1>
                        <Button variant="outline" onClick={() => setSelectedResource(null)}>
                            返回资源列表
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>{selectedResource.title}</CardTitle>
                                    <CardDescription>
                                        {selectedResource.type === 'article' ? '文章' :
                                            selectedResource.type === 'video' ? '视频' : '工具'} ·
                                        更新于 {formatDate(selectedResource.updateTime)}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-primary/5 rounded-lg">
                                <p className="italic">{selectedResource.description}</p>
                            </div>

                            {selectedResource.type === 'article' ? (
                                <div className="prose max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: selectedResource.content }} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p>{selectedResource.content}</p>

                                    {selectedResource.url && (
                                        <div className="mt-6">
                                            <Button
                                                onClick={() => window.open(selectedResource.url, '_blank')}
                                                className="w-full"
                                            >
                                                {selectedResource.type === 'video' ? '观看视频' : '访问工具'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // 显示资源列表
    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">心理健康资源</h1>
                    <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
                        返回仪表盘
                    </Button>
                </div>

                <div className="flex space-x-2 pb-4">
                    <Button
                        variant={resourceType === 'all' ? 'default' : 'outline'}
                        onClick={() => setResourceType('all')}
                    >
                        全部
                    </Button>
                    <Button
                        variant={resourceType === 'article' ? 'default' : 'outline'}
                        onClick={() => setResourceType('article')}
                    >
                        文章
                    </Button>
                    <Button
                        variant={resourceType === 'video' ? 'default' : 'outline'}
                        onClick={() => setResourceType('video')}
                    >
                        视频
                    </Button>
                    <Button
                        variant={resourceType === 'tool' ? 'default' : 'outline'}
                        onClick={() => setResourceType('tool')}
                    >
                        工具
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <p className="text-lg">加载中...</p>
                    </div>
                ) : error ? (
                    <div className="text-center p-12">
                        <p className="text-lg text-destructive">加载资源失败</p>
                    </div>
                ) : filteredResources && filteredResources.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-6">
                        {filteredResources.map(resource => (
                            <Card
                                key={resource.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => setSelectedResource(resource)}
                            >
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                                            <CardDescription>
                                                {resource.type === 'article' ? '文章' :
                                                    resource.type === 'video' ? '视频' : '工具'}
                                            </CardDescription>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${resource.type === 'article' ? 'bg-blue-100 text-blue-600' : resource.type === 'video' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {resource.type === 'article' ? '文' :
                                                resource.type === 'video' ? '视' : '工'}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="line-clamp-3 text-sm text-muted-foreground">
                                        {resource.description}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <p className="text-xs text-muted-foreground">
                                        更新于 {formatDate(resource.updateTime)}
                                    </p>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-12 bg-white rounded-lg shadow">
                        <p className="text-lg mb-4">暂无{resourceType === 'all' ? '' : resourceType === 'article' ? '文章' : resourceType === 'video' ? '视频' : '工具'}资源</p>
                    </div>
                )}
            </div>
        </div>
    );
}
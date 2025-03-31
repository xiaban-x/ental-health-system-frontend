'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, Clock, Calendar, User, Eye, ThumbsUp } from 'lucide-react';
import dynamic from 'next/dynamic';

// 动态导入视频播放器，避免SSR问题
const ReactPlayer = dynamic(() => import('react-player/lazy'), {
    ssr: false,
    loading: () => <div className="w-full aspect-video bg-gray-200 animate-pulse flex items-center justify-center">
        <p>加载播放器中...</p>
    </div>
});

// 资源类型接口
interface Resource {
    id: number;
    title: string;
    description: string;
    content?: string | null;
    url: string | null;
    coverImage?: string | null;
    type: 'article' | 'video' | 'tool';
    duration?: number | null;
    size?: number | null;
    format?: string | null;
    authorId: number;
    authorName: string;
    viewCount: number;
    likeCount: number;
    status: number;
    createdAt: string;
    updatedAt: string;
}

interface ResourcePreviewProps {
    resourceId: number;
    onBack: () => void;
}

export default function ResourcePreview({ resourceId, onBack }: ResourcePreviewProps) {
    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    console.log("resource= ==", resource)
    useEffect(() => {
        const fetchResource = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get<{ resource: Resource, tags: [] }>(`/resource/${resourceId}`);
                if (response.code === 0 && response.data?.resource) {
                    setResource(response.data.resource);
                } else {
                    toast.error('获取资源失败', {
                        description: response.msg || '服务器错误',
                    });
                }
            } catch (error) {
                console.error('获取资源错误:', error);
                toast.error('获取资源失败', {
                    description: '服务器错误，请稍后再试',
                });
            } finally {
                setLoading(false);
            }
        };

        if (resourceId) {
            fetchResource();
        }
    }, [resourceId]);

    // 格式化日期
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
        } catch (error) {
            return dateString;
        }
    };

    // 格式化时长
    const formatDuration = (seconds?: number | null) => {
        if (!seconds) return '未知';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // 渲染文章内容
    const renderArticleContent = (content?: string | null) => {
        if (!content) return <p className="text-gray-500">无内容</p>;
        return (
            <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    };

    // 渲染视频播放器
    const renderVideoPlayer = (url?: string | null) => {
        if (!url) return <p className="text-gray-500">视频链接无效</p>;
        return (
            <div className="w-full aspect-video">
                <ReactPlayer
                    url={url}
                    width="100%"
                    height="100%"
                    controls
                    config={{
                        file: {
                            attributes: {
                                controlsList: 'nodownload',
                                disablePictureInPicture: true,
                            },
                        },
                    }}
                />
            </div>
        );
    };

    if (loading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>资源加载中...</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-64 bg-gray-200 animate-pulse"></div>
                </CardContent>
            </Card>
        );
    }

    if (!resource) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>资源不存在</CardTitle>
                    <CardDescription>无法找到请求的资源</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button onClick={onBack}>返回</Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{resource.title}</CardTitle>
                    <Button variant="outline" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        返回
                    </Button>
                </div>
                <CardDescription>
                    <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex items-center text-sm">
                            <User className="h-4 w-4 mr-1" />
                            {resource.authorName || '未知作者'}
                        </div>
                        <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(resource.createdAt)}
                        </div>
                        {resource.type === 'video' && resource.duration && (
                            <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDuration(resource.duration)}
                            </div>
                        )}
                        <div className="flex items-center text-sm">
                            <Eye className="h-4 w-4 mr-1" />
                            {resource.viewCount} 次查看
                        </div>
                        <div className="flex items-center text-sm">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {resource.likeCount} 次点赞
                        </div>
                    </div>
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* 封面图片 */}
                {resource.coverImage && (
                    <div className="w-full">
                        <img
                            src={resource.coverImage}
                            alt={resource.title}
                            className="w-full max-h-[300px] object-cover rounded-md"
                        />
                    </div>
                )}

                {/* 描述 */}
                <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-lg font-medium mb-2">简介</h3>
                    <p className="text-gray-700">{resource.description}</p>
                </div>

                {/* 内容 - 根据资源类型显示不同内容 */}
                <div>
                    <h3 className="text-lg font-medium mb-4">
                        {resource.type === 'article' ? '文章内容' :
                            resource.type === 'video' ? '视频内容' : '资源内容'}
                    </h3>

                    {resource.type === 'article' ? (
                        renderArticleContent(resource.content)
                    ) : resource.type === 'video' ? (
                        renderVideoPlayer(resource.url)
                    ) : (
                        <p className="text-gray-500">暂不支持预览此类型资源</p>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
                <div className="text-sm text-gray-500">
                    最后更新: {formatDate(resource.updatedAt)}
                </div>
                <Button onClick={onBack}>返回列表</Button>
            </CardFooter>
        </Card>
    );
}
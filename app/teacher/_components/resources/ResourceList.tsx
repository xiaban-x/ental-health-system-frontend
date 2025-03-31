'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/_components/ui/pagination';
import { apiClient, useApi } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/_components/ui/dialog';

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
    duration?: number; // 视频时长（秒）
    author: string;
    coverImage?: string;
}

// 分页响应接口
interface PaginatedResponse<T> {
    list: T[];
    total: number;
    totalPage: number;
    currentPage: number;
}

interface ResourceListProps {
    onAddArticle: () => void;
    onAddVideo: () => void;
    onEditResource: (resource: Resource) => void; // 添加编辑资源的回调函数
}

export default function ResourceList({ onAddArticle, onAddVideo, onEditResource }: ResourceListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [resourceType, setResourceType] = useState<'all' | 'article' | 'video' | 'tool'>('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<number | null>(null);

    // 使用封装好的 useApi 钩子获取资源列表
    const { data, error, isLoading, mutate } = useApi<PaginatedResponse<Resource>>(
        `/resource/list?page=${currentPage}&size=${pageSize}&type=${resourceType}`
    );
    const handleEditResource = (resource: Resource) => {
        onEditResource(resource);
    };
    // 处理页码变化
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // 处理每页显示数量变化
    const handlePageSizeChange = (value: string) => {
        const newSize = parseInt(value);
        setPageSize(newSize);
        setCurrentPage(1); // 重置到第一页
    };

    // 处理资源类型筛选变化
    const handleResourceTypeChange = (value: string) => {
        setResourceType(value as 'all' | 'article' | 'video' | 'tool');
        setCurrentPage(1);
    };

    // 打开删除确认对话框
    const openDeleteDialog = (id: number) => {
        setResourceToDelete(id);
        setDeleteDialogOpen(true);
    };

    // 删除资源
    const handleDeleteResource = async () => {
        if (!resourceToDelete) return;

        try {
            const response = await apiClient.delete(`/resource/${resourceToDelete}`);

            if (response.code === 0) {
                toast.success('资源删除成功');
                mutate(); // 使用 SWR 的 mutate 函数重新获取数据
                setDeleteDialogOpen(false);
                setResourceToDelete(null);
            } else {
                toast.error('资源删除失败', {
                    description: response.msg || '服务器错误',
                });
            }
        } catch (error) {
            console.error('删除资源错误:', error);
            toast.error('资源删除失败', {
                description: '服务器错误，请稍后再试',
            });
        }
    };

    // 格式化视频时长
    const formatDuration = (seconds?: number) => {
        if (!seconds) return '未知';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}分${remainingSeconds}秒`;
    };

    // 获取资源列表和总页数
    const resources = data?.list || [];
    const totalPages = data?.totalPage || 1;
    const totalCount = data?.total || 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>资源列表</CardTitle>
                    <div className="flex items-center space-x-4">
                        <Select
                            value={resourceType}
                            onValueChange={handleResourceTypeChange}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="所有类型" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">所有类型</SelectItem>
                                <SelectItem value="article">文章</SelectItem>
                                <SelectItem value="video">视频</SelectItem>
                                <SelectItem value="tool">工具</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={pageSize.toString()}
                            onValueChange={handlePageSizeChange}
                        >
                            <SelectTrigger className="w-[80px]">
                                <SelectValue placeholder="10" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <CardDescription>管理您上传的所有资源</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <p className="text-lg">加载中...</p>
                    </div>
                ) : error ? (
                    <div className="text-center p-12">
                        <p className="text-lg text-red-500 mb-4">加载失败，请重试</p>
                        <Button onClick={() => mutate()}>重新加载</Button>
                    </div>
                ) : resources.length === 0 ? (
                    <div className="text-center p-12">
                        <p className="text-lg mb-4">暂无资源</p>
                        <div className="flex justify-center space-x-4">
                            <Button onClick={onAddArticle}>新增文章</Button>
                            <Button onClick={onAddVideo}>上传视频</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {resources.map(resource => (
                            <Card key={resource.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{resource.title}</CardTitle>
                                            <CardDescription>
                                                类型: {resource.type === 'article' ? '文章' : resource.type === 'video' ? '视频' : '工具'} |
                                                创建时间: {new Date(resource.createdAt).toLocaleString('zh-CN')}
                                            </CardDescription>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditResource(resource)}
                                            >
                                                编辑
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => openDeleteDialog(resource.id)}
                                            >
                                                删除
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{resource.description}</p>
                                    {resource.type === 'video' && resource.duration && (
                                        <p className="text-sm mt-2">时长: {formatDuration(resource.duration)}</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* 分页控件 */}
                {resources.length > 0 && (
                    <div className="mt-6 flex justify-between items-center w-full">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">共 {totalCount} 条记录</div>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            isActive={currentPage === page}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}

                {/* 删除确认对话框 */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>确认删除</DialogTitle>
                            <DialogDescription>
                                您确定要删除这个资源吗？此操作无法撤销。
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                取消
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteResource}>
                                确认删除
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
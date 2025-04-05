'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient, useApi } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/_components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/_components/ui/dialog';

interface TimeSlot {
    id: number;
    startTime: string;
    endTime: string;
    status: 'available' | 'booked' | 'completed';
    createdAt: string;
}

// 添加分页响应接口
interface PaginatedResponse<T> {
    list: T[];
    total: number;
    totalPage: number;
    currentPage: number;
}

export default function TeacherCounselingTime() {
    const router = useRouter();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        startTime: '',
        endTime: '',
    });
    // 添加分页相关状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    // 添加删除确认对话框状态
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [timeSlotToDelete, setTimeSlotToDelete] = useState<number | null>(null);

    // 使用 useApi 钩子获取分页数据
    const { data, error, isLoading, mutate } = useApi<PaginatedResponse<TimeSlot>>(
        `/counselor/my-time-slots?page=${currentPage}&size=${pageSize}`
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

    const handleCreateTimeSlot = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.startTime || !formData.endTime) {
            toast.error('请完善信息', {
                description: '开始时间和结束时间不能为空',
                position: 'top-center',
            });
            return;
        }

        // 验证开始时间必须早于结束时间
        const startTime = new Date(formData.startTime);
        const endTime = new Date(formData.endTime);

        if (startTime >= endTime) {
            toast.error('时间设置错误', {
                description: '开始时间必须早于结束时间',
                position: 'top-center',
            });
            return;
        }

        try {
            const response = await apiClient.post('/counselor/time-slot', formData);

            if (response.code === 0) {
                toast.success('创建成功', {
                    description: '咨询时间段已创建',
                    position: 'top-center',
                });
                // 重新获取时间段列表
                mutate();
                // 重置表单
                setFormData({
                    startTime: '',
                    endTime: '',
                });
                setShowCreateForm(false);
            } else {
                toast.error('创建失败', {
                    description: response.msg || '无法创建咨询时间段',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('创建时间段错误:', error);
            toast.error('创建失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        }
    };

    // 打开删除确认对话框
    const openDeleteDialog = (id: number) => {
        setTimeSlotToDelete(id);
        setDeleteDialogOpen(true);
    };

    // 删除时间段
    const handleDeleteTimeSlot = async () => {
        if (!timeSlotToDelete) return;

        try {
            const response = await apiClient.delete(`/counselor/time-slot/${timeSlotToDelete}`);

            if (response.code === 0) {
                toast.success('删除成功', {
                    description: '咨询时间段已删除',
                    position: 'top-center',
                });
                // 关闭对话框
                setDeleteDialogOpen(false);
                setTimeSlotToDelete(null);
                // 重新获取时间段列表
                mutate();
            } else {
                toast.error('删除失败', {
                    description: response.msg || '无法删除咨询时间段',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('删除时间段错误:', error);
            toast.error('删除失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        }
    };

    // 获取时间段列表和总页数
    const timeSlots = data?.list || [];
    const totalPages = data?.totalPage || 1;
    const totalCount = data?.total || 0;

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">咨询时间管理</h1>
                    <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                        {showCreateForm ? '取消' : '添加咨询时间'}
                    </Button>
                </div>

                {showCreateForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle>添加咨询时间段</CardTitle>
                            <CardDescription>设置您可以进行咨询的时间段</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateTimeSlot} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="startTime" className="block text-sm font-medium mb-1">开始时间</label>
                                        <input
                                            type="datetime-local"
                                            id="startTime"
                                            name="startTime"
                                            value={formData.startTime}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="endTime" className="block text-sm font-medium mb-1">结束时间</label>
                                        <input
                                            type="datetime-local"
                                            id="endTime"
                                            name="endTime"
                                            value={formData.endTime}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded-md"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? '提交中...' : '创建时间段'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>咨询时间段列表</CardTitle>
                            <div className="flex items-center space-x-4">
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
                        <CardDescription>管理您的咨询时间段</CardDescription>
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
                        ) : timeSlots.length === 0 ? (
                            <div className="text-center p-12">
                                <p className="text-lg mb-4">暂无咨询时间段</p>
                                <Button onClick={() => setShowCreateForm(true)}>添加咨询时间</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {timeSlots.map(slot => (
                                    <Card key={slot.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle>
                                                        {new Date(slot.startTime).toLocaleString('zh-CN')} - {new Date(slot.endTime).toLocaleString('zh-CN')}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        状态: {
                                                            slot.status === 'available' ? '可预约' :
                                                                slot.status === 'booked' ? '已预约' :
                                                                    slot.status === 'completed' ? '已完成' : '未知'
                                                        } |
                                                        创建时间: {new Date(slot.createdAt).toLocaleString('zh-CN')}
                                                    </CardDescription>
                                                </div>
                                                <div>
                                                    {slot.status === 'available' && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => openDeleteDialog(slot.id)}
                                                        >
                                                            删除
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* 分页控件 */}
                        {timeSlots.length > 0 && (
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
                    </CardContent>
                </Card>

                {/* 删除确认对话框 */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>确认删除</DialogTitle>
                            <DialogDescription>
                                您确定要删除这个咨询时间段吗？如果已有学生预约，将会取消预约。
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                取消
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteTimeSlot}>
                                确认删除
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
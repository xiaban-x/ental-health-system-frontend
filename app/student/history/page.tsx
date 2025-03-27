'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { useApi } from '@/app/_lib/api-client';
import { formatDate } from '@/app/_lib/utils';
import { toast } from 'sonner';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/_components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';

// 更新评估记录接口以匹配后端
interface AssessmentRecord {
    id: number;
    userId: number;
    paperId: number;
    totalScore: number;
    feedback: string;
    createdAt: string;
    updatedAt: string;
}

interface AssessmentRecordResult {
    username: string;
    record: AssessmentRecord;
    paperName: string;
    description: string;
}
// 分页响应接口
interface PaginatedResponse<T> {
    total: number;
    pageSize: number;
    totalPage: number;
    currPage: number;
    list: T[];
}

interface AppointmentRecord {
    id: number;
    counselorId: number;
    counselorName: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'approved' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
    reason: string;
    notes: string;
    createdAt: string;
}

export default function StudentHistory() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'assessments' | 'appointments'>('assessments');

    // 添加分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // 使用SWR获取咨询历史
    const { data: appointments, error: appointmentsError, isLoading: appointmentsLoading } =
        useApi<AppointmentRecord[]>('/appointment/my-appointments');

    // 使用SWR获取评估历史
    const { data: assessmentData, error: assessmentError, isLoading: assessmentLoading } =
        useApi<PaginatedResponse<AssessmentRecordResult>>(`/exam-records?page=${currentPage}&size=${pageSize}`);

    // 从SWR响应中提取评估记录
    const assessmentRecords = assessmentData?.list || [];

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('role');

        if (!token || userType !== 'student') {
            router.push('/auth/login');
            return;
        }

        // 更新总页数
        if (assessmentData) {
            setTotalPages(assessmentData.totalPage || 1);
        }
    }, [router, assessmentData]);

    // 处理评估历史加载错误
    useEffect(() => {
        if (assessmentError) {
            toast.error('获取评估历史失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        }
    }, [assessmentError]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // 处理页面大小变化
    const handlePageSizeChange = (value: string) => {
        const newSize = parseInt(value);
        setPageSize(newSize);
        setCurrentPage(1); // 重置到第一页
    };

    const renderAppointmentStatus = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="text-yellow-500">待确认</span>;
            case 'confirmed':
                return <span className="text-green-500">已确认</span>;
            case 'approved':
                return <span className="text-green-500">已同意</span>;
            case 'completed':
                return <span className="text-blue-500">已完成</span>;
            case 'cancelled':
                return <span className="text-red-500">已取消</span>;
            case 'rejected':
                return <span className="text-red-500">已拒绝</span>;
            default:
                return <span>{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">历史记录</h1>
                    <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
                        返回仪表盘
                    </Button>
                </div>

                <div className="flex space-x-2 pb-4">
                    <Button
                        variant={activeTab === 'assessments' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('assessments')}
                    >
                        评估历史
                    </Button>
                    <Button
                        variant={activeTab === 'appointments' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('appointments')}
                    >
                        咨询历史
                    </Button>
                </div>

                {activeTab === 'assessments' ? (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">评估历史</h2>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">每页显示:</span>
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

                        {assessmentLoading ? (
                            <div className="flex justify-center p-12">
                                <p className="text-lg">加载中...</p>
                            </div>
                        ) : assessmentError ? (
                            <div className="text-center p-12">
                                <p className="text-lg text-destructive">加载评估历史失败</p>
                            </div>
                        ) : assessmentRecords.length === 0 ? (
                            <div className="text-center p-12 bg-white rounded-lg shadow">
                                <p className="text-lg mb-4">暂无评估历史记录</p>
                                <Button onClick={() => router.push('/student/assessment')}>开始评估</Button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {assessmentRecords.map(record => (
                                        <Card key={record.record.id}>
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle>{record.paperName}</CardTitle>
                                                        <CardDescription>
                                                            评估时间: {formatDate(record.record.createdAt)}
                                                        </CardDescription>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium">得分: {record.record.totalScore}</p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <div>
                                                        <p className="font-medium">问卷简介:</p>
                                                        <p className="text-sm">{record.description}</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">建议:</p>
                                                        <p className="text-sm">{record.record.feedback}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* 分页控件 */}
                                <div className="mt-6 flex justify-between items-center">
                                    <div className="text-sm text-muted-foreground">
                                        共 {assessmentData?.total || 0} 条记录
                                    </div>
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
                            </>
                        )}
                    </div>
                ) : (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">咨询历史</h2>

                        {appointmentsLoading ? (
                            <div className="flex justify-center p-12">
                                <p className="text-lg">加载中...</p>
                            </div>
                        ) : appointmentsError ? (
                            <div className="text-center p-12">
                                <p className="text-lg text-destructive">加载咨询历史失败</p>
                            </div>
                        ) : appointments && appointments.length > 0 ? (
                            <div className="space-y-4">
                                {appointments.map(record => (
                                    <Card key={record.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle>咨询师: {record.counselorName}</CardTitle>
                                                    <CardDescription>
                                                        咨询时间: {formatDate(record.startTime)}
                                                    </CardDescription>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">状态: {renderAppointmentStatus(record.status)}</p>
                                                    <p className="text-sm">预约于: {formatDate(record.createdAt)}</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="font-medium">咨询原因:</p>
                                                    <p className="text-sm">{record.reason}</p>
                                                </div>
                                                {record.notes && (
                                                    <div>
                                                        <p className="font-medium">咨询记录:</p>
                                                        <p className="text-sm whitespace-pre-line">{record.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-12 bg-white rounded-lg shadow">
                                <p className="text-lg mb-4">暂无咨询历史记录</p>
                                <Button onClick={() => router.push('/student/counseling')}>预约咨询</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
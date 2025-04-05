'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/_components/ui/pagination';

interface User {
    id: number;
    username: string;
    name: string;
    avatar: string;
    role: string;
}

interface Feedback {
    id: number;
    userId: number;
    title: string;
    content: string;
    type: 'suggestion' | 'complaint' | 'bug' | 'other';
    status: 'pending' | 'processing' | 'resolved' | 'rejected';
    reply: string | null;
    createdAt: string;
    updatedAt: string;
}

interface FeedbackWithUser {
    feedback: Feedback;
    user: User;
}

interface PageData {
    totalCount: number;
    pageSize: number;
    totalPage: number;
    currPage: number;
    list: FeedbackWithUser[];
}

export default function TeacherFeedback() {
    const router = useRouter();
    const [pageData, setPageData] = useState<PageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithUser | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyStatus, setReplyStatus] = useState<'processing' | 'resolved' | 'rejected'>('resolved');
    const [replyLoading, setReplyLoading] = useState(false);

    // 分页和筛选参数
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        fetchFeedbacks();
    }, [currentPage, pageSize, filterType, filterStatus]);

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = {
                page: currentPage,
                limit: pageSize
            };

            if (filterType && filterType !== 'all') params.type = filterType;
            if (filterStatus && filterStatus !== 'all') params.status = filterStatus;

            const response = await apiClient.get('/feedback/page', { params });

            if (response.code === 0 && response.data) {
                setPageData(response.data as PageData);
            } else {
                toast.error('获取反馈列表失败', {
                    description: response.msg || '无法加载反馈列表',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('获取反馈列表错误:', error);
            toast.error('获取反馈列表失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewFeedback = (feedbackWithUser: FeedbackWithUser) => {
        setSelectedFeedback(feedbackWithUser);
        setReplyContent(feedbackWithUser.feedback.reply || '');

        // 根据当前状态设置默认回复状态
        if (feedbackWithUser.feedback.status === 'pending') {
            setReplyStatus('processing');
        } else {
            setReplyStatus(feedbackWithUser.feedback.status as 'processing' | 'resolved' | 'rejected');
        }
    };

    const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setReplyContent(e.target.value);
    };

    const handleSubmitReply = async () => {
        if (!selectedFeedback) return;

        if (!replyContent.trim()) {
            toast.error('请填写回复内容', {
                description: '回复内容不能为空',
                position: 'top-center',
            });
            return;
        }

        setReplyLoading(true);

        try {
            const response = await apiClient.post(`/feedback/${selectedFeedback.feedback.id}/reply`, {
                reply: replyContent,
                status: replyStatus
            });

            if (response.code === 0) {
                toast.success('回复成功', {
                    description: '您的回复已提交',
                    position: 'top-center',
                });
                // 重新获取反馈列表
                fetchFeedbacks();
                setSelectedFeedback(null);
            } else {
                toast.error('回复失败', {
                    description: response.msg || '无法提交回复',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('回复反馈错误:', error);
            toast.error('回复失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        } finally {
            setReplyLoading(false);
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'suggestion':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">建议</span>;
            case 'complaint':
                return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">投诉</span>;
            case 'bug':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">系统问题</span>;
            case 'other':
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">其他</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{type}</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">待处理</span>;
            case 'processing':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">处理中</span>;
            case 'resolved':
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">已解决</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">已拒绝</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
        }
    };

    const getTypeLabel = (type: string) => {
        const typeMap: Record<string, string> = {
            'suggestion': '建议',
            'complaint': '投诉',
            'bug': '系统问题',
            'other': '其他'
        };
        return typeMap[type] || type;
    };

    const getStatusLabel = (status: string) => {
        const statusMap: Record<string, string> = {
            'pending': '待处理',
            'processing': '处理中',
            'resolved': '已解决',
            'rejected': '已拒绝'
        };
        return statusMap[status] || status;
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">反馈查看</h1>
                    <Button variant="outline" onClick={() => router.push('/teacher/dashboard')}>
                        返回仪表盘
                    </Button>
                </div>

                {selectedFeedback ? (
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center space-x-2">
                                        <span>{selectedFeedback.feedback.title}</span>
                                        {getTypeBadge(selectedFeedback.feedback.type)}
                                        {getStatusBadge(selectedFeedback.feedback.status)}
                                    </CardTitle>
                                    <CardDescription>
                                        来自: {selectedFeedback.user.name} | 提交时间: {new Date(selectedFeedback.feedback.createdAt).toLocaleString()}
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setSelectedFeedback(null)}>
                                    返回列表
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-md">
                                <h3 className="text-sm font-medium mb-2">反馈内容:</h3>
                                <p className="whitespace-pre-wrap">{selectedFeedback.feedback.content}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="status" className="text-sm font-medium">
                                        处理状态
                                    </label>
                                    <Select
                                        value={replyStatus}
                                        onValueChange={(value) => setReplyStatus(value as 'processing' | 'resolved' | 'rejected')}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="选择处理状态" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="processing">处理中</SelectItem>
                                            <SelectItem value="resolved">已解决</SelectItem>
                                            <SelectItem value="rejected">已拒绝</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="reply" className="text-sm font-medium">
                                        回复内容
                                    </label>
                                    <textarea
                                        id="reply"
                                        value={replyContent}
                                        onChange={handleReplyChange}
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary min-h-[150px]"
                                        placeholder="请输入您的回复..."
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-4">
                            <Button variant="outline" onClick={() => setSelectedFeedback(null)} disabled={replyLoading}>
                                取消
                            </Button>
                            <Button onClick={handleSubmitReply} disabled={replyLoading}>
                                {replyLoading ? '提交中...' : '提交回复'}
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>反馈列表</CardTitle>
                            <CardDescription>查看和回复学生提交的反馈和建议</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="w-full md:w-1/4">
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor="type-filter" className="text-sm font-medium whitespace-nowrap">
                                            反馈类型:
                                        </label>
                                        <Select value={filterType} onValueChange={setFilterType}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="所有类型" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">所有类型</SelectItem>
                                                <SelectItem value="suggestion">建议</SelectItem>
                                                <SelectItem value="complaint">投诉</SelectItem>
                                                <SelectItem value="bug">系统问题</SelectItem>
                                                <SelectItem value="other">其他</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="w-full md:w-1/4">
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor="status-filter" className="text-sm font-medium whitespace-nowrap">
                                            处理状态:
                                        </label>
                                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="所有状态" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">所有状态</SelectItem>
                                                <SelectItem value="pending">待处理</SelectItem>
                                                <SelectItem value="processing">处理中</SelectItem>
                                                <SelectItem value="resolved">已解决</SelectItem>
                                                <SelectItem value="rejected">已拒绝</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="w-full md:w-1/4">
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor="page-size" className="text-sm font-medium whitespace-nowrap">
                                            每页显示:
                                        </label>
                                        <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="10条/页" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5条/页</SelectItem>
                                                <SelectItem value="10">10条/页</SelectItem>
                                                <SelectItem value="20">20条/页</SelectItem>
                                                <SelectItem value="50">50条/页</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="w-full md:w-1/4 flex items-center">
                                    <Button className="w-full" onClick={() => fetchFeedbacks()}>
                                        刷新列表
                                    </Button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-4">加载中...</div>
                            ) : !pageData || pageData.list.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">暂无反馈</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {pageData.list.map((item) => (
                                            <Card
                                                key={item.feedback.id}
                                                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                                onClick={() => handleViewFeedback(item)}
                                            >
                                                <div className="p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <h3 className="text-lg font-semibold">{item.feedback.title}</h3>
                                                            {getTypeBadge(item.feedback.type)}
                                                            {getStatusBadge(item.feedback.status)}
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">{new Date(item.feedback.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{item.feedback.content}</p>
                                                    <div className="mt-2 flex justify-between items-center">
                                                        <span className="text-xs">来自: {item.user.name}</span>
                                                        <Button variant="ghost" size="sm" className="text-xs">
                                                            查看详情
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>

                                    <div className="mt-6 flex justify-center">
                                        {/* 添加分页组件 */}
                                        {pageData && pageData.totalPage > 1 && (
                                            <div className="col-span-2 flex justify-center mt-6">
                                                <Pagination>
                                                    <PaginationContent>
                                                        <PaginationItem>
                                                            <PaginationPrevious
                                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                            />
                                                        </PaginationItem>

                                                        {Array.from({ length: pageData.totalPage }, (_, i) => i + 1).map((page) => (
                                                            <PaginationItem key={page}>
                                                                <PaginationLink
                                                                    onClick={() => setCurrentPage(page)}
                                                                    isActive={currentPage === page}
                                                                >
                                                                    {page}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        ))}

                                                        <PaginationItem>
                                                            <PaginationNext
                                                                onClick={() => setCurrentPage(prev => Math.min(pageData.totalPage, prev + 1))}
                                                            />
                                                        </PaginationItem>
                                                    </PaginationContent>
                                                </Pagination>
                                            </div>
                                        )}

                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
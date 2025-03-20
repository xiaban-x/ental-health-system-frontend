'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';

interface Feedback {
    id: number;
    title: string;
    content: string;
    type: 'suggestion' | 'complaint' | 'bug' | 'other';
    status: 'pending' | 'processing' | 'resolved';
    studentId: number;
    studentName: string;
    createdAt: string;
    updatedAt: string;
    reply?: string;
}

export default function TeacherFeedback() {
    const router = useRouter();
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replyLoading, setReplyLoading] = useState(false);

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'teacher') {
            router.push('/auth/login');
            return;
        }

        fetchFeedbacks();
    }, [router]);

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/feedback/list');
            if (response.code === 0 && response.data) {
                setFeedbacks(response.data as Feedback[]);
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

    const handleViewFeedback = (feedback: Feedback) => {
        setSelectedFeedback(feedback);
        setReplyContent(feedback.reply || '');
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
            const response = await apiClient.post(`/feedback/${selectedFeedback.id}/reply`, {
                reply: replyContent,
                status: 'resolved'
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
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
        }
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
                                        <span>{selectedFeedback.title}</span>
                                        {getTypeBadge(selectedFeedback.type)}
                                        {getStatusBadge(selectedFeedback.status)}
                                    </CardTitle>
                                    <CardDescription>来自: {selectedFeedback.studentName} | 提交时间: {new Date(selectedFeedback.createdAt).toLocaleString()}</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setSelectedFeedback(null)}>
                                    返回列表
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-md">
                                <h3 className="text-sm font-medium mb-2">反馈内容:</h3>
                                <p className="whitespace-pre-wrap">{selectedFeedback.content}</p>
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
                            {loading ? (
                                <div className="text-center py-4">加载中...</div>
                            ) : feedbacks.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">暂无反馈</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {feedbacks.map((feedback) => (
                                        <Card key={feedback.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewFeedback(feedback)}>
                                            <div className="p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="text-lg font-semibold">{feedback.title}</h3>
                                                        {getTypeBadge(feedback.type)}
                                                        {getStatusBadge(feedback.status)}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{new Date(feedback.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{feedback.content}</p>
                                                <div className="mt-2 flex justify-between items-center">
                                                    <span className="text-xs">来自: {feedback.studentName}</span>
                                                    <Button variant="ghost" size="sm" className="text-xs">
                                                        查看详情
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
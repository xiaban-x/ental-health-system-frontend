'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { Badge } from '@/app/_components/ui/badge';

interface Feedback {
    id: number;
    userId: number;
    title: string;
    content: string;
    type: string;
    status: 'pending' | 'processing' | 'resolved' | 'rejected';
    reply: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function StudentFeedback() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'suggestion' // 'suggestion', 'complaint', 'bug', 'other'
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [feedbacksLoading, setFeedbacksLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('submit');

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'student') {
            router.push('/auth/login');
            return;
        }

        // 如果当前标签是"history"，则加载反馈历史
        if (activeTab === 'history') {
            fetchFeedbacks();
        }
    }, [router, activeTab]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.content.trim()) {
            toast.error('请完善信息', {
                description: '标题和内容不能为空',
                position: 'top-center',
            });
            return;
        }

        setLoading(true);

        try {
            const response = await apiClient.post('/feedback', formData);

            if (response.code === 0) {
                toast.success('提交成功', {
                    description: '感谢您的反馈，我们会认真考虑您的建议',
                    position: 'top-center',
                });
                setSubmitted(true);
                // 重新获取反馈列表
                fetchFeedbacks();
            } else {
                toast.error('提交失败', {
                    description: response.msg || '无法提交反馈',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('提交反馈错误:', error);
            toast.error('提交失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            title: '',
            content: '',
            type: 'suggestion'
        });
        setSubmitted(false);
        setActiveTab('submit');
    };

    const fetchFeedbacks = async () => {
        setFeedbacksLoading(true);
        try {
            const response = await apiClient.get('/feedback/my');
            if (response.code === 0 && response.data) {
                setFeedbacks(response.data as Feedback[]);
            } else {
                toast.error('获取反馈历史失败', {
                    description: response.msg || '无法加载反馈历史',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('获取反馈历史错误:', error);
            toast.error('获取反馈历史失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        } finally {
            setFeedbacksLoading(false);
        }
    };

    // 获取反馈类型的中文名称
    const getFeedbackTypeName = (type: string) => {
        const typeMap: Record<string, string> = {
            'suggestion': '建议',
            'complaint': '投诉',
            'bug': '系统问题',
            'other': '其他'
        };
        return typeMap[type] || type;
    };

    // 获取状态的中文名称和样式
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">待处理</Badge>;
            case 'processing':
                return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">处理中</Badge>;
            case 'resolved':
                return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">已解决</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">已拒绝</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (submitted && activeTab === 'submit') {
        return (
            <div className="min-h-screen bg-muted p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">反馈建议</h1>
                        <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
                            返回仪表盘
                        </Button>
                    </div>

                    <Card className="text-center p-6">
                        <CardContent className="pt-6 pb-6">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold mb-2">反馈提交成功</h2>
                                <p className="text-muted-foreground">感谢您的反馈，我们会认真考虑您的建议</p>
                            </div>

                            <div className="flex justify-center space-x-4">
                                <Button variant="outline" onClick={handleReset}>
                                    继续提交
                                </Button>
                                <Button onClick={() => {
                                    setActiveTab('history');
                                    fetchFeedbacks();
                                }}>
                                    查看我的反馈
                                </Button>
                                <Button onClick={() => router.push('/student/dashboard')}>
                                    返回仪表盘
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">反馈建议</h1>
                    <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
                        返回仪表盘
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="submit">提交反馈</TabsTrigger>
                        <TabsTrigger value="history">我的反馈</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="submit">
                        <Card>
                            <CardHeader>
                                <CardTitle>提交反馈</CardTitle>
                                <CardDescription>您的反馈对我们非常重要，帮助我们改进系统和服务</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="type" className="text-sm font-medium">
                                            反馈类型
                                        </label>
                                        <select
                                            id="type"
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="suggestion">建议</option>
                                            <option value="complaint">投诉</option>
                                            <option value="bug">系统问题</option>
                                            <option value="other">其他</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="title" className="text-sm font-medium">
                                            标题 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="title"
                                            name="title"
                                            type="text"
                                            value={formData.title}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                            placeholder="请输入反馈标题"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="content" className="text-sm font-medium">
                                            内容 <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="content"
                                            name="content"
                                            value={formData.content}
                                            onChange={handleChange}
                                            required
                                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary min-h-[200px]"
                                            placeholder="请详细描述您的反馈内容..."
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end space-x-4">
                                    <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
                                        重置
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? '提交中...' : '提交反馈'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>我的反馈历史</CardTitle>
                                <CardDescription>查看您提交的反馈及处理状态</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {feedbacksLoading ? (
                                    <div className="text-center py-8">
                                        <p>加载中...</p>
                                    </div>
                                ) : feedbacks.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">您还没有提交过反馈</p>
                                        <Button 
                                            variant="outline" 
                                            className="mt-4"
                                            onClick={() => setActiveTab('submit')}
                                        >
                                            去提交反馈
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {feedbacks.map((feedback) => (
                                            <Card key={feedback.id} className="overflow-hidden">
                                                <div className="p-4">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="text-lg font-semibold">{feedback.title}</h3>
                                                                {getStatusBadge(feedback.status)}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                                                <span>类型: {getFeedbackTypeName(feedback.type)}</span>
                                                                <span>•</span>
                                                                <span>提交时间: {new Date(feedback.createdAt).toLocaleString()}</span>
                                                                {feedback.updatedAt !== feedback.createdAt && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>更新时间: {new Date(feedback.updatedAt).toLocaleString()}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-gray-50 p-3 rounded-md mb-3">
                                                        <p className="text-sm font-medium mb-1">反馈内容:</p>
                                                        <p className="text-sm whitespace-pre-line">{feedback.content}</p>
                                                    </div>
                                                    
                                                    {feedback.reply && (
                                                        <div className="bg-blue-50 p-3 rounded-md">
                                                            <p className="text-sm font-medium mb-1">官方回复:</p>
                                                            <p className="text-sm whitespace-pre-line">{feedback.reply}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
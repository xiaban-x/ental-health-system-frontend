'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';

export default function StudentFeedback() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'suggestion' // 'suggestion', 'complaint', 'bug', 'other'
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== '0') {
            router.push('/auth/login');
        }
    }, [router]);

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
            const response = await apiClient.post('/feedback/submit', formData);

            if (response.code === 0) {
                toast.error('提交成功', {
                    description: '感谢您的反馈，我们会认真考虑您的建议',
                    position: 'top-center',
                });
                setSubmitted(true);
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
    };

    if (submitted) {
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
            </div>
        </div>
    );
}
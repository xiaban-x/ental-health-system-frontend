'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { useApi } from '@/app/_lib/api-client';
import { toast } from 'sonner';

interface StudentInfo {
    id: number;
    username: string;
    name: string;
    studentId: string;
    role: string;
    email: string;
    phone: string;
    createTime: string;
}

export default function StudentDashboard() {
    const router = useRouter();
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

    // 使用SWR获取学生信息
    const { data, error, isLoading } = useApi<StudentInfo>('/user/info');

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== '0') {
            router.push('/auth/login');
            return;
        }

        if (data) {
            setStudentInfo(data);
        }
    }, [data, router]);

    useEffect(() => {
        if (error) {
            toast.error("获取信息失败", {
                description: '无法获取您的个人信息，请重新登录',
                position: 'top-center'
            });
        }
    }, [error, toast]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        router.push('/auth/login');
        toast.success("已退出登录", {
            description: '您已成功退出系统',
            position: 'top-center'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">加载中...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">学生仪表盘</h1>
                    <Button variant="outline" onClick={handleLogout}>退出登录</Button>
                </div>

                {studentInfo && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>个人信息</CardTitle>
                            <CardDescription>您的基本信息概览</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium">姓名</p>
                                <p>{studentInfo.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">学号</p>
                                <p>{studentInfo.studentId}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">用户名</p>
                                <p>{studentInfo.username}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">邮箱</p>
                                <p>{studentInfo.email}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">手机号</p>
                                <p>{studentInfo.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">注册时间</p>
                                <p>{new Date(studentInfo.createTime).toLocaleDateString('zh-CN')}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/student/profile')}>
                        <CardHeader>
                            <CardTitle>个人资料</CardTitle>
                            <CardDescription>查看和修改您的个人信息</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>更新您的联系方式和个人详情</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/student/assessment')}>
                        <CardHeader>
                            <CardTitle>心理评估</CardTitle>
                            <CardDescription>进行心理健康自我评估</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>完成心理测试，了解您的心理健康状况</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/student/counseling')}>
                        <CardHeader>
                            <CardTitle>心理咨询</CardTitle>
                            <CardDescription>预约心理咨询服务</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>查看可用的咨询时段并进行预约</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/student/resources')}>
                        <CardHeader>
                            <CardTitle>资源中心</CardTitle>
                            <CardDescription>心理健康资源库</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>浏览心理健康相关的文章、视频和工具</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/student/history')}>
                        <CardHeader>
                            <CardTitle>历史记录</CardTitle>
                            <CardDescription>查看您的评估和咨询历史</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>回顾过去的评估结果和咨询记录</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/student/feedback')}>
                        <CardHeader>
                            <CardTitle>反馈建议</CardTitle>
                            <CardDescription>提供您的反馈和建议</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>帮助我们改进系统和服务</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
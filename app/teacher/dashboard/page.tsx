'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { useApi } from '@/app/_lib/api-client';
import { toast } from 'sonner';

// 导入头像组件
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";

interface TeacherInfo {
    id: number;
    username: string;
    name: string;
    teacherId: string;
    role: string;
    email: string;
    phone: string;
    createdAt: string;
    avatar: string;
    sex: 'male' | 'female' | 'other';
    title: string; // 职称
    specialty: string; // 专长
}

export default function TeacherDashboard() {
    const router = useRouter();
    const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);

    // 使用SWR获取教师信息
    const { data, error, isLoading } = useApi<TeacherInfo>('/user/info');
    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        console.log("role ===>", role)
        if (!token || role !== '1') { // 教师角色值为1
            router.push('/auth/login');
            return;
        }

        if (data) {
            setTeacherInfo(data);
        }
    }, [data, router]);

    useEffect(() => {
        if (error) {
            toast.error("获取信息失败", {
                description: '无法获取您的个人信息，请重新登录',
                position: 'top-center'
            });
        }
    }, [error]);

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
                    <h1 className="text-3xl font-bold">教师仪表盘</h1>
                    <Button variant="outline" onClick={handleLogout}>退出登录</Button>
                </div>

                {teacherInfo && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>个人信息</CardTitle>
                            <CardDescription>您的基本信息概览</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 flex items-center space-x-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={teacherInfo.avatar} alt={teacherInfo.name} />
                                    <AvatarFallback>{teacherInfo.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">用户名</p>
                                    <p>{teacherInfo.username}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium">姓名</p>
                                <p>{teacherInfo.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">性别</p>
                                <p>{teacherInfo.sex === 'male' ? '男' : teacherInfo.sex === 'female' ? '女' : '其他'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">工号</p>
                                <p>{teacherInfo.teacherId}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">职称</p>
                                <p>{teacherInfo.title}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">专长</p>
                                <p>{teacherInfo.specialty}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">邮箱</p>
                                <p>{teacherInfo.email}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">手机号</p>
                                <p>{teacherInfo.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">注册时间</p>
                                <p>{teacherInfo.createdAt}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/teacher/profile')}>
                        <CardHeader>
                            <CardTitle>个人资料</CardTitle>
                            <CardDescription>查看和修改您的个人信息</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>更新您的联系方式和个人详情</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/teacher/questionnaire')}>
                        <CardHeader>
                            <CardTitle>问卷管理</CardTitle>
                            <CardDescription>创建和管理心理评估问卷</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>发布新问卷或编辑现有问卷</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/teacher/counseling-time')}>
                        <CardHeader>
                            <CardTitle>咨询时间</CardTitle>
                            <CardDescription>管理您的咨询时间段</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>设置可用的咨询时间段供学生预约</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/teacher/appointments')}>
                        <CardHeader>
                            <CardTitle>咨询预约</CardTitle>
                            <CardDescription>管理学生的咨询预约</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>查看和处理学生的咨询预约请求</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/teacher/resources')}>
                        <CardHeader>
                            <CardTitle>资源管理</CardTitle>
                            <CardDescription>管理心理健康资源</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>上传和管理心理健康相关的文章和资源</p>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/teacher/feedback')}>
                        <CardHeader>
                            <CardTitle>反馈查看</CardTitle>
                            <CardDescription>查看学生的反馈和建议</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>浏览和回复学生提交的反馈意见</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
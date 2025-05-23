'use client';
import { toast } from "sonner"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import apiClient from "@/app/_lib/api-client";

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'student'
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await apiClient.post("/users/login", {
                username: formData.username,
                password: formData.password
            });
            if (response.data.code === 0) {
                // 登录成功
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('role', response.data.role);

                toast.success('登录成功', {
                    description: '欢迎回来！',
                    position: 'top-center'
                });

                // 根据用户类型跳转到不同的页面
                switch (response.data.role) {
                    case 'student':
                        router.push('/student/dashboard');
                        break;
                    case 'teacher':
                        router.push('/teacher/dashboard');
                        break;
                    case 'doctor':
                        router.push('/doctor/dashboard');
                        break;
                }
            } else {
                // 登录失败
                toast.error('登录失败', {
                    description: response.data.msg || '用户名或密码错误',
                    position: 'top-center'
                });
            }
        } catch (error) {
            console.error('登录错误:', error);
            toast.error('登录失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
                    <CardDescription className="text-center">
                        输入您的账号和密码登录系统
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="userType" className="text-sm font-medium">
                                用户类型
                            </label>
                            <select
                                id="userType"
                                name="userType"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                            >
                                <option value="0">学生</option>
                                <option value="1">管理员</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="username" className="text-sm font-medium">
                                用户名
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                placeholder="请输入用户名"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium">
                                    密码
                                </label>
                                <Link href="/auth/reset-password" className="text-sm text-primary hover:underline">
                                    忘记密码？
                                </Link>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                placeholder="请输入密码"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 mt-10">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? '登录中...' : '登录'}
                        </Button>
                        <div className="text-center text-sm">
                            还没有账号？{' '}
                            <Link href="/auth/register" className="text-primary hover:underline">
                                立即注册
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
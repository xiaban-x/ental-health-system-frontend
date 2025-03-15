'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        studentId: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 验证密码是否匹配
        if (formData.password !== formData.confirmPassword) {
            toast.error("密码不匹配", {
                description: '请确保两次输入的密码相同',
                position: 'top-center'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await apiClient.post('/user/auth/register', {
                username: formData.username,
                password: formData.password,
                name: formData.name,
                studentId: formData.studentId,
                email: formData.email,
                phone: formData.phone,
                role: 0
            });

            if (response.code === 0) {
                toast.success("注册成功", {
                    description: '请使用您的账号登录',
                    position: 'top-center'
                });
                router.push('/auth/login');
            } else {
                toast.error("注册失败", {
                    description: response.msg || '请检查您的输入信息',
                    position: 'top-center'
                });
            }
        } catch (error) {
            console.error('注册错误:', error);
            toast.error("注册失败", {
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
                    <CardTitle className="text-2xl font-bold text-center">注册账号</CardTitle>
                    <CardDescription className="text-center">
                        创建您的学生账号以使用系统功能
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
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
                            <label htmlFor="password" className="text-sm font-medium">
                                密码
                            </label>
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
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium">
                                确认密码
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                placeholder="请再次输入密码"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                姓名
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                placeholder="请输入您的真实姓名"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="studentId" className="text-sm font-medium">
                                学号
                            </label>
                            <input
                                id="studentId"
                                name="studentId"
                                type="text"
                                value={formData.studentId}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                placeholder="请输入您的学号"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                邮箱
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                placeholder="请输入您的邮箱"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium">
                                手机号
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                placeholder="请输入您的手机号"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 mt-10">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? '注册中...' : '注册'}
                        </Button>
                        <div className="text-center text-sm">
                            已有账号？{' '}
                            <Link href="/auth/login" className="text-primary hover:underline">
                                返回登录
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
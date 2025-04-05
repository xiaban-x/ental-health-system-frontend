'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { useApi } from '@/app/_lib/api-client';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';

// 导入新的组件
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/app/_components/ui/radio-group";
import { Label } from "@/app/_components/ui/label";

interface StudentRoleInfo {
    id: number;
    userId: number;
    studentId: string;
    major: string;
    className: string;
    grade: string;
    enrollmentDate: string | null;
    graduationDate: string | null;
    dormitory: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

interface UserInfo {
    id: number;
    username: string;
    name: string;
    sex: string | null;
    phone: string;
    email: string;
    avatar: string | null;
    role: string;
    remark: string | null;
    createdAt: string;
    updatedAt: string;
}

interface StudentInfo {
    roleInfo: StudentRoleInfo;
    user: UserInfo;
}


export default function StudentProfile() {
    const router = useRouter();
    // 修改初始状态，确保所有字段都有默认值
    const [formData, setFormData] = useState({
        // 用户基本信息
        name: '',
        sex: 'other' as 'male' | 'female' | 'other',
        email: '',
        phone: '',
        avatar: '',
        // 学生特定信息
        studentId: '',
        major: '',
        className: '',
        grade: '',
    });
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // 使用SWR获取学生信息
    const { data, error, isLoading, mutate } = useApi<StudentInfo>('/users/profile');

    useEffect(() => {
        // 只在 data 存在且有值时更新表单
        if (data && data.user) {
            setFormData({
                name: data.user.name || '',
                sex: (data.user.sex as 'male' | 'female' | 'other') || 'other',
                email: data.user.email || '',
                phone: data.user.phone || '',
                avatar: data.user.avatar || '',
                studentId: data.roleInfo.studentId || '',
                major: data.roleInfo.major || '',
                className: data.roleInfo.className || '',
                grade: data.roleInfo.grade || '',
            });
        }
    }, [data]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 分离用户基本信息和角色特定信息
            const userUpdate = {
                name: formData.name,
                sex: formData.sex,
                email: formData.email,
                phone: formData.phone,
                avatar: formData.avatar,
            };

            const roleInfoUpdate = {
                studentId: formData.studentId,
                major: formData.major,
                className: formData.className,
                grade: formData.grade,
            };

            const response = await apiClient.put('/users/profile', {
                ...userUpdate,
                ...roleInfoUpdate
            });

            if (response.code === 0) {
                toast.success('更新成功', {
                    description: '您的个人资料已更新',
                    position: 'top-center',
                });
                setIsEditing(false);
                mutate(); // 刷新数据
            } else {
                toast.error('更新失败', {
                    description: response.msg || '无法更新个人资料',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('更新个人资料错误:', error);
            toast.error('更新失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (data) {
            setFormData({
                name: data.user.name || '',
                sex: (data.user.sex as 'male' | 'female' | 'other') || 'other',
                email: data.user.email || '',
                phone: data.user.phone || '',
                avatar: data.user.avatar || '',
                studentId: data.roleInfo.studentId || '',
                major: data.roleInfo.major || '',
                className: data.roleInfo.className || '',
                grade: data.roleInfo.grade || '',
            });
        }
        setIsEditing(false);
    };
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">加载中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-destructive mb-4">加载个人信息失败</p>
                    <Button onClick={() => router.push('/student/dashboard')}>返回仪表盘</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">个人资料</h1>
                    <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
                        返回仪表盘
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>个人信息</CardTitle>
                        <CardDescription>查看和更新您的个人信息</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div>
                                    <label className="text-sm font-medium">头像</label>
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={formData.avatar} alt={formData.name} />
                                        <AvatarFallback>{formData.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                    </Avatar>
                                </div>
                                {isEditing && (
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            name="avatar"
                                            value={formData.avatar}
                                            onChange={handleChange}
                                            placeholder="请输入头像URL"
                                            className="w-full p-2 border rounded-md"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            请输入有效的图片URL地址
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">性别</label>
                                <RadioGroup
                                    name="sex"
                                    value={formData.sex}
                                    onValueChange={(value) =>
                                        setFormData(prev => ({ ...prev, sex: value as 'male' | 'female' | 'other' }))
                                    }
                                    disabled={!isEditing}
                                    className="flex space-x-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="male" id="male" />
                                        <Label htmlFor="male">男</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="female" id="female" />
                                        <Label htmlFor="female">女</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="other" id="other" />
                                        <Label htmlFor="other">其他</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="username" className="text-sm font-medium">
                                    用户名
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={data?.user.username ?? ''} // 修改为正确的数据路径
                                    disabled
                                    className="w-full p-2 border rounded-md bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">用户名不可修改</p>
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
                                    disabled={!isEditing}
                                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-muted' : ''}`}
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
                                    disabled={!isEditing}
                                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-muted' : ''}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="major" className="text-sm font-medium">
                                    专业
                                </label>
                                <input
                                    id="major"
                                    name="major"
                                    type="text"
                                    value={formData.major}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-muted' : ''}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="className" className="text-sm font-medium">
                                    班级
                                </label>
                                <input
                                    id="className"
                                    name="className"
                                    type="text"
                                    value={formData.className}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-muted' : ''}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="grade" className="text-sm font-medium">
                                    年级
                                </label>
                                <input
                                    id="grade"
                                    name="grade"
                                    type="text"
                                    value={formData.grade}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-muted' : ''}`}
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
                                    disabled={!isEditing}
                                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-muted' : ''}`}
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
                                    disabled={!isEditing}
                                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-muted' : ''}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    注册时间
                                </label>
                                <p className="p-2">
                                    {data?.user.createdAt ? new Date(data.user.createdAt).toLocaleString('zh-CN') : ''}
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-4">
                            {isEditing ? (
                                <>
                                    <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                                        取消
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? '保存中...' : '保存修改'}
                                    </Button>
                                </>
                            ) : (
                                <Button type="button" onClick={() => setIsEditing(true)}>
                                    编辑信息
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>修改密码</CardTitle>
                        <CardDescription>更新您的账号密码</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/student/change-password')} className="w-full">
                            前往修改密码
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
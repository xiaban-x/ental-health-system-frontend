'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { useApi } from '@/app/_lib/api-client';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';

// 导入组件
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/app/_components/ui/radio-group";
import { Label } from "@/app/_components/ui/label";

// 教师信息接口
interface TeacherInfo {
    id: bigint;
    username: string;
    name: string;
    teacherId: string;
    email: string;
    phone: string;
    createdAt: string;
    avatar: string;
    sex: 'male' | 'female' | 'other';
    title: string; // 职称
    specialty: string; // 专长
}

// 更新接口定义
interface CounselorInfo {
    id: number;
    userId: number;
    title: string;
    specialty: string;
    introduction: string;
    status: number;
    employeeId: string;
    department: string;
    officeLocation: string;
    createdAt: string;
    updatedAt: string;
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

interface TeacherInfo {
    roleInfo: CounselorInfo;
    user: UserInfo;
}

export default function TeacherProfile() {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [formData, setFormData] = useState({
        // 用户基本信息
        username: '',
        name: '',
        sex: 'other' as 'male' | 'female' | 'other',
        email: '',
        phone: '',
        avatar: '',
        // 教师特定信息
        employeeId: '',
        title: '',
        department: '',
        specialty: '',
        introduction: '',
        officeLocation: '',
    });

    // 修改API路径
    const { data, error, mutate } = useApi<TeacherInfo>('/users/profile');
    useEffect(() => {
        // 更新数据访问路径
        if (data) {
            setFormData({
                username: data.user.username || '',
                name: data.user.name || '',
                sex: (data.user.sex as 'male' | 'female' | 'other') || 'other',
                email: data.user.email || '',
                phone: data.user.phone || '',
                avatar: data.user.avatar || '',
                employeeId: data.roleInfo.employeeId || '',
                title: data.roleInfo.title || '',
                department: data.roleInfo.department || '',
                specialty: data.roleInfo.specialty || '',
                introduction: data.roleInfo.introduction || '',
                officeLocation: data.roleInfo.officeLocation || '',
            });
        }
    }, [data]);

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

            const counselorInfoUpdate = {
                employeeId: formData.employeeId,
                title: formData.title,
                department: formData.department,
                specialty: formData.specialty,
                introduction: formData.introduction,
                officeLocation: formData.officeLocation,
            };

            const response = await apiClient.put('/users/profile', {
                ...userUpdate,
                ...counselorInfoUpdate
            });

            if (response.code === 0) {
                toast.success('更新成功', {
                    description: '您的个人资料已更新',
                    position: 'top-center',
                });
                setIsEditing(false);
                mutate();
            } else {
                toast.error('更新失败', {
                    description: response.msg || '无法更新个人资料',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('更新错误:', error);
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
                username: data.user.username || '',
                name: data.user.name || '',
                sex: (data.user.sex as 'male' | 'female' | 'other') || 'other',
                email: data.user.email || '',
                phone: data.user.phone || '',
                avatar: data.user.avatar || '',
                employeeId: data.roleInfo.employeeId || '',
                title: data.roleInfo.title || '',
                introduction: data.roleInfo.introduction || '',
                specialty: data.roleInfo.specialty || '',
                department: data.roleInfo.department || '',
                officeLocation: data.roleInfo.officeLocation || '',
            });
        }
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 在表单中更新字段显示
    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">个人资料</h1>
                    <Button variant="outline" onClick={() => router.push('/teacher/dashboard')}>
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
                                        setFormData(prev => ({ ...prev, sex: value as 'male' | 'female' | 'other' }))}
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
                                    value={formData.username ?? ''} // 使用空字符串作为后备值
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
                                <label htmlFor="employeeId" className="text-sm font-medium">
                                    工号
                                </label>
                                <input
                                    id="employeeId"
                                    name="employeeId"
                                    type="text"
                                    value={formData.employeeId}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-muted' : ''}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="title" className="text-sm font-medium">
                                    职称
                                </label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-muted' : ''}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="department" className="text-sm font-medium">
                                    所属院系
                                </label>
                                <input
                                    id="department"
                                    name="department"
                                    type="text"
                                    value={formData.department}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-muted' : ''}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="specialty" className="text-sm font-medium">
                                    专业领域
                                </label>
                                <input
                                    id="specialty"
                                    name="specialty"
                                    type="text"
                                    value={formData.specialty}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-muted' : ''}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="introduction" className="text-sm font-medium">
                                    个人简介
                                </label>
                                <textarea
                                    id="introduction"
                                    name="introduction"
                                    value={formData.introduction}
                                    onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                                    disabled={!isEditing}
                                    className={`w-full p-2 border rounded-md min-h-[100px] ${!isEditing ? 'bg-muted' : ''}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="officeLocation" className="text-sm font-medium">
                                    办公室位置
                                </label>
                                <input
                                    id="officeLocation"
                                    name="officeLocation"
                                    type="text"
                                    value={formData.officeLocation}
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
                            {
                                isEditing ? (
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
                        <Button onClick={() => router.push('/teacher/change-password')} className="w-full">
                            前往修改密码
                        </Button>
                    </CardContent>
                </Card>
            </div >
        </div >
    );
}
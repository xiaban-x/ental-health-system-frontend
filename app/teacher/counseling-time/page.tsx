'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';

interface TimeSlot {
    id: number;
    startTime: string;
    endTime: string;
    status: 'available' | 'booked' | 'completed';
    createdAt: string;
}

export default function TeacherCounselingTime() {
    const router = useRouter();
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        startTime: '',
        endTime: '',
    });

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'teacher') {
            router.push('/auth/login');
            return;
        }

        fetchTimeSlots();
    }, [router]);

    const fetchTimeSlots = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/counselor/my-time-slots');
            if (response.code === 0 && response.data) {
                setTimeSlots(response.data as TimeSlot[]);
            } else {
                toast.error('获取时间段列表失败', {
                    description: response.msg || '无法加载时间段列表',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('获取时间段列表错误:', error);
            toast.error('获取时间段列表失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateTimeSlot = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.startTime || !formData.endTime) {
            toast.error('请完善信息', {
                description: '开始时间和结束时间不能为空',
                position: 'top-center',
            });
            return;
        }

        // 验证开始时间必须早于结束时间
        const startTime = new Date(formData.startTime);
        const endTime = new Date(formData.endTime);

        if (startTime >= endTime) {
            toast.error('时间设置错误', {
                description: '开始时间必须早于结束时间',
                position: 'top-center',
            });
            return;
        }

        setLoading(true);

        try {
            const response = await apiClient.post('/counselor/time-slot', formData);

            if (response.code === 0) {
                toast.success('创建成功', {
                    description: '咨询时间段已创建',
                    position: 'top-center',
                });
                // 重新获取时间段列表
                fetchTimeSlots();
                // 重置表单
                setFormData({
                    startTime: '',
                    endTime: '',
                });
                setShowCreateForm(false);
            } else {
                toast.error('创建失败', {
                    description: response.msg || '无法创建咨询时间段',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('创建时间段错误:', error);
            toast.error('创建失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTimeSlot = async (id: number) => {
        if (!confirm('确定要删除这个咨询时间段吗？如果已有学生预约，将会取消预约。')) {
            return;
        }

        try {
            const response = await apiClient.delete(`/counselor/time-slot/${id}`);

            if (response.code === 0) {
                toast.success('删除成功', {
                    description: '咨询时间段已删除',
                    position: 'top-center',
                });
                // 重新获取时间段列表
                fetchTimeSlots();
            } else {
                toast.error('删除失败', {
                    description: response.msg || '无法删除咨询时间段',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('删除时间段错误:', error);
            toast.error('删除失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">可预约</span>;
            case 'booked':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">已预约</span>;
            case 'completed':
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">已完成</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">咨询时间管理</h1>
                    <div className="space-x-4">
                        <Button variant="outline" onClick={() => router.push('/teacher/dashboard')}>
                            返回仪表盘
                        </Button>
                    </div>
                </div>

                {!showCreateForm ? (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>咨询时间段列表</CardTitle>
                                <CardDescription>管理您提供的咨询时间段</CardDescription>
                            </div>
                            <Button onClick={() => setShowCreateForm(true)}>添加新时间段</Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-4">加载中...</div>
                            ) : timeSlots.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">暂无咨询时间段，点击"添加新时间段"开始创建</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {timeSlots.map((timeSlot) => (
                                        <Card key={timeSlot.id} className="overflow-hidden">
                                            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between">
                                                <div className="space-y-1 mb-4 md:mb-0">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="text-lg font-semibold">
                                                            {new Date(timeSlot.startTime).toLocaleString()} - {new Date(timeSlot.endTime).toLocaleString()}
                                                        </h3>
                                                        {getStatusBadge(timeSlot.status)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">创建时间: {new Date(timeSlot.createdAt).toLocaleString()}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {timeSlot.status === 'available' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700"
                                                            onClick={() => handleDeleteTimeSlot(timeSlot.id)}
                                                        >
                                                            删除
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>添加新咨询时间段</CardTitle>
                            <CardDescription>设置您可以提供咨询服务的时间段</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleCreateTimeSlot}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="startTime" className="text-sm font-medium">
                                        开始时间 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="startTime"
                                        name="startTime"
                                        type="datetime-local"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="endTime" className="text-sm font-medium">
                                        结束时间 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="endTime"
                                        name="endTime"
                                        type="datetime-local"
                                        value={formData.endTime}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-4">
                                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} disabled={loading}>
                                    取消
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? '提交中...' : '添加时间段'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}
            </div>
        </div>
    );
}
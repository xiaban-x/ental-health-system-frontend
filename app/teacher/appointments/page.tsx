'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { Textarea } from '@/app/_components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/_components/ui/dialog';

interface Appointment {
    id: number;
    studentId: number;
    studentName: string;
    counselorId: number;
    timeSlotId: number;
    startTime: string;
    endTime: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    notes: string;
    createdAt: string;
}

export default function TeacherAppointments() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
    const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
    const [reviewNotes, setReviewNotes] = useState('');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get<Appointment[]>('/appointment/counselor-appointments');
            if (response.code === 0 && response.data) {
                setAppointments(response.data);
            } else {
                toast.error('获取预约列表失败', {
                    description: response.msg || '无法加载预约列表',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('获取预约列表错误:', error);
            toast.error('获取预约列表失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReviewDialog = (appointment: Appointment) => {
        setCurrentAppointment(appointment);
        setReviewStatus('approved');
        setReviewNotes('');
        setReviewDialogOpen(true);
    };

    const handleReviewAppointment = async () => {
        if (!currentAppointment) return;

        setLoading(true);
        try {
            const response = await apiClient.post(`/appointment/${currentAppointment.id}/review`, {
                status: reviewStatus,
                notes: reviewNotes
            });

            if (response.code === 0) {
                toast.success('审核成功', {
                    description: reviewStatus === 'approved' ? '已批准该预约申请' : '已拒绝该预约申请',
                    position: 'top-center',
                });
                // 重新获取预约列表
                fetchAppointments();
                // 关闭对话框
                setReviewDialogOpen(false);
            } else {
                toast.error('审核失败', {
                    description: response.msg || '无法完成审核操作',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('审核预约错误:', error);
            toast.error('审核失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">待审核</span>;
            case 'approved':
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">已批准</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">已拒绝</span>;
            case 'completed':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">已完成</span>;
            case 'cancelled':
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">已取消</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">咨询预约管理</h1>
                    <div className="space-x-4">
                        <Button variant="outline" onClick={() => router.push('/teacher/dashboard')}>
                            返回仪表盘
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>预约申请列表</CardTitle>
                        <CardDescription>管理学生的咨询预约申请</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-4">加载中...</div>
                        ) : appointments.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">暂无预约申请</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {appointments.map((appointment) => (
                                    <Card key={appointment.id} className="overflow-hidden">
                                        <div className="p-4">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                                <div className="space-y-1 mb-4 md:mb-0">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="text-lg font-semibold">
                                                            预约时间: {new Date(appointment.startTime).toLocaleString()} - {new Date(appointment.endTime).toLocaleString()}
                                                        </h3>
                                                        {getStatusBadge(appointment.status)}
                                                    </div>
                                                    <p className="text-sm">学生: {appointment.studentName}</p>
                                                    <p className="text-sm text-muted-foreground">申请时间: {new Date(appointment.createdAt).toLocaleString()}</p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {appointment.status === 'pending' && (
                                                        <Button
                                                            onClick={() => handleOpenReviewDialog(appointment)}
                                                        >
                                                            审核
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-md">
                                                <p className="text-sm font-medium mb-1">预约原因:</p>
                                                <p className="text-sm">{appointment.reason || '学生未提供预约原因'}</p>
                                            </div>
                                            {appointment.notes && (
                                                <div className="mt-3 bg-blue-50 p-3 rounded-md">
                                                    <p className="text-sm font-medium mb-1">审核意见:</p>
                                                    <p className="text-sm">{appointment.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>审核预约申请</DialogTitle>
                        <DialogDescription>
                            请选择是否批准该预约申请，并提供审核意见
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <h4 className="font-medium">学生信息</h4>
                            <p className="text-sm">{currentAppointment?.studentName}</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">预约时间</h4>
                            <p className="text-sm">
                                {currentAppointment && `${new Date(currentAppointment.startTime).toLocaleString()} - ${new Date(currentAppointment.endTime).toLocaleString()}`}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">预约原因</h4>
                            <p className="text-sm">{currentAppointment?.reason || '学生未提供预约原因'}</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">审核结果</h4>
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="reviewStatus"
                                        value="approved"
                                        checked={reviewStatus === 'approved'}
                                        onChange={() => setReviewStatus('approved')}
                                        className="h-4 w-4"
                                    />
                                    <span>批准</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="reviewStatus"
                                        value="rejected"
                                        checked={reviewStatus === 'rejected'}
                                        onChange={() => setReviewStatus('rejected')}
                                        className="h-4 w-4"
                                    />
                                    <span>拒绝</span>
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">审核意见</h4>
                            <Textarea
                                placeholder="请输入审核意见（可选）"
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReviewDialogOpen(false)} disabled={loading}>
                            取消
                        </Button>
                        <Button onClick={handleReviewAppointment} disabled={loading}>
                            {loading ? '提交中...' : '提交审核'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { useApi } from '@/app/_lib/api-client';
import { apiClient } from '@/app/_lib/api-client';
import { formatDate, formatDateTime } from '@/app/_lib/utils';
import { toast } from 'sonner';

interface Counselor {
    id: number;
    name: string;
    title: string;
    specialty: string;
    introduction: string;
    avatar: string;
}

interface TimeSlot {
    id: number;
    counselorId: number;
    startTime: string;
    endTime: string;
    status: 'available' | 'booked' | 'completed';
}

interface Appointment {
    id: number;
    counselorId: number;
    counselorName: string;
    timeSlotId: number;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    reason: string;
    notes: string;
    createdAt: string;
}

export default function StudentCounseling() {
    const router = useRouter();
    const [step, setStep] = useState<'list' | 'select-time' | 'confirm' | 'my-appointments'>('list');
    const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    // 使用SWR获取咨询师列表
    const { data: counselors, error: counselorsError, isLoading: counselorsLoading } =
        useApi<Counselor[]>('/counselor/list');

    // 使用SWR获取我的预约列表
    const { data: appointments, error: appointmentsError, isLoading: appointmentsLoading, mutate: refreshAppointments } =
        useApi<Appointment[]>('/appointment/my-appointments');

    // 获取可用时间段
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== '0') {
            router.push('/auth/login');
        }
    }, [router]);

    const fetchTimeSlots = async (counselorId: number) => {
        setTimeSlotsLoading(true);
        try {
            const response = await apiClient.get(`/counselor/${counselorId}/time-slots`);
            if (response.code === 0 && response.data) {
                setTimeSlots(response.data as TimeSlot[]);
            } else {
                toast.error('获取时间段失败', {
                    description: response.msg || '无法加载可用时间段',
                });
            }
        } catch (error) {
            console.error('获取时间段错误:', error);
            toast.error('获取时间段失败', {
                description: '服务器错误，请稍后再试',
            });
        } finally {
            setTimeSlotsLoading(false);
        }
    };

    const handleSelectCounselor = (counselor: Counselor) => {
        setSelectedCounselor(counselor);
        fetchTimeSlots(counselor.id);
        setStep('select-time');
    };

    const handleSelectTimeSlot = (timeSlot: TimeSlot) => {
        setSelectedTimeSlot(timeSlot);
        setStep('confirm');
    };

    const handleSubmitAppointment = async () => {
        if (!selectedCounselor || !selectedTimeSlot) return;

        if (!reason.trim()) {
            toast.error('请填写咨询原因', {
                description: '咨询原因不能为空',
            });
            return;
        }

        setLoading(true);

        try {
            const response = await apiClient.post('/appointment/create', {
                counselorId: selectedCounselor.id,
                timeSlotId: selectedTimeSlot.id,
                reason: reason
            });

            if (response.code === 0) {
                toast.success('预约成功', {
                    description: '您的咨询预约已提交，请等待确认',
                });
                refreshAppointments();
                setStep('my-appointments');
            } else {
                toast.error('预约失败', {
                    description: response.msg || '无法创建预约',
                });
            }
        } catch (error) {
            console.error('预约错误:', error);
            toast.error('预约失败', {
                description: '服务器错误，请稍后再试',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async (appointmentId: number) => {
        setLoading(true);

        try {
            const response = await apiClient.post(`/appointment/${appointmentId}/cancel`);

            if (response.code === 0) {
                toast.success('取消成功', {
                    description: '您的咨询预约已取消',
                });
                refreshAppointments();
            } else {
                toast.error('取消失败', {
                    description: response.msg || '无法取消预约',
                });
            }
        } catch (error) {
            console.error('取消预约错误:', error);
            toast.error('取消失败', {
                description: '服务器错误，请稍后再试',
            });
        } finally {
            setLoading(false);
        }
    };

    const renderAppointmentStatus = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="text-yellow-500">等待确认</span>;
            case 'confirmed':
                return <span className="text-green-500">已确认</span>;
            case 'completed':
                return <span className="text-blue-500">已完成</span>;
            case 'cancelled':
                return <span className="text-red-500">已取消</span>;
            default:
                return <span>{status}</span>;
        }
    };

    // 显示我的预约列表
    if (step === 'my-appointments') {
        return (
            <div className="min-h-screen bg-muted p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">我的咨询预约</h1>
                        <div className="space-x-4">
                            <Button variant="outline" onClick={() => setStep('list')}>
                                预约新咨询
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
                                返回仪表盘
                            </Button>
                        </div>
                    </div>

                    {appointmentsLoading ? (
                        <div className="flex justify-center p-12">
                            <p className="text-lg">加载中...</p>
                        </div>
                    ) : appointmentsError ? (
                        <div className="text-center p-12">
                            <p className="text-lg text-destructive">加载预约失败</p>
                        </div>
                    ) : appointments && appointments.length > 0 ? (
                        <div className="space-y-4">
                            {appointments.map(appointment => (
                                <Card key={appointment.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle>咨询师: {appointment.counselorName}</CardTitle>
                                                <CardDescription>
                                                    预约时间: {formatDateTime(appointment.startTime)} - {new Date(appointment.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                                </CardDescription>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">状态: {renderAppointmentStatus(appointment.status)}</p>
                                                <p className="text-sm text-muted-foreground">预约于: {appointment.createdAt}</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="font-medium">咨询原因:</p>
                                                <p>{appointment.reason}</p>
                                            </div>
                                            {appointment.notes && (
                                                <div>
                                                    <p className="font-medium">咨询记录:</p>
                                                    <p>{appointment.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                                            <Button
                                                variant="destructive"
                                                onClick={() => handleCancelAppointment(appointment.id)}
                                                disabled={loading}
                                            >
                                                {loading ? '取消中...' : '取消预约'}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-white rounded-lg shadow">
                            <p className="text-lg mb-4">您还没有任何咨询预约</p>
                            <Button onClick={() => setStep('list')}>立即预约</Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 确认预约信息
    if (step === 'confirm' && selectedCounselor && selectedTimeSlot) {
        return (
            <div className="min-h-screen bg-muted p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">确认预约</h1>
                        <Button variant="outline" onClick={() => setStep('select-time')}>
                            返回选择时间
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>预约详情</CardTitle>
                            <CardDescription>请确认您的咨询预约信息</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="font-medium">咨询师:</p>
                                <p>{selectedCounselor.name} - {selectedCounselor.title}</p>
                            </div>
                            <div>
                                <p className="font-medium">预约时间:</p>
                                <p>{formatDateTime(selectedTimeSlot.startTime)} - {new Date(selectedTimeSlot.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="reason" className="font-medium">
                                    咨询原因: <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full p-2 border rounded-md min-h-[100px]"
                                    placeholder="请简要描述您的咨询原因和期望..."
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep('select-time')}>
                                返回
                            </Button>
                            <Button
                                onClick={handleSubmitAppointment}
                                disabled={loading || !reason.trim()}
                            >
                                {loading ? '提交中...' : '确认预约'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    // 选择时间段
    if (step === 'select-time' && selectedCounselor) {
        return (
            <div className="min-h-screen bg-muted p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">选择咨询时间</h1>
                        <Button variant="outline" onClick={() => setStep('list')}>
                            返回咨询师列表
                        </Button>
                    </div>

                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>{selectedCounselor.name} - {selectedCounselor.title}</CardTitle>
                            <CardDescription>{selectedCounselor.specialty}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>{selectedCounselor.introduction}</p>
                        </CardContent>
                    </Card>

                    <h2 className="text-xl font-bold">可用时间段</h2>

                    {timeSlotsLoading ? (
                        <div className="flex justify-center p-12">
                            <p className="text-lg">加载中...</p>
                        </div>
                    ) : timeSlots.length > 0 ? (
                        <div className="grid md:grid-cols-3 gap-4 mt-4">
                            {timeSlots.map(timeSlot => (
                                <Card
                                    key={timeSlot.id}
                                    className={`cursor-pointer hover:shadow-md transition-shadow ${timeSlot.status !== 'available' ? 'opacity-50' : ''}`}
                                    onClick={() => timeSlot.status === 'available' && handleSelectTimeSlot(timeSlot)}
                                >
                                    <CardContent className="p-4">
                                        <p className="font-medium">{formatDate(timeSlot.startTime)}</p>
                                        <p>{new Date(timeSlot.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - {new Date(timeSlot.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="mt-2">
                                            {timeSlot.status === 'available' ? (
                                                <span className="text-green-500">可预约</span>
                                            ) : timeSlot.status === 'booked' ? (
                                                <span className="text-red-500">已预约</span>
                                            ) : (
                                                <span className="text-blue-500">已完成</span>
                                            )}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-white rounded-lg shadow mt-4">
                            <p className="text-lg">暂无可用的咨询时间段</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 显示咨询师列表
    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">心理咨询预约</h1>
                    <div className="space-x-4">
                        <Button variant="outline" onClick={() => setStep('my-appointments')}>
                            我的预约
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
                            返回仪表盘
                        </Button>
                    </div>
                </div>

                {counselorsLoading ? (
                    <div className="flex justify-center p-12">
                        <p className="text-lg">加载中...</p>
                    </div>
                ) : counselorsError ? (
                    <div className="text-center p-12">
                        <p className="text-lg text-destructive">加载咨询师失败</p>
                    </div>
                ) : counselors && counselors.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {counselors.map(counselor => (
                            <Card key={counselor.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSelectCounselor(counselor)}>
                                <CardHeader className="flex flex-row items-start space-x-4 pb-2">
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                        {counselor.avatar ? (
                                            <img src={counselor.avatar} alt={counselor.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl">{counselor.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <CardTitle>{counselor.name}</CardTitle>
                                        <CardDescription>{counselor.title}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-medium mb-2">专业领域:</p>
                                    <p className="mb-4">{counselor.specialty}</p>
                                    <p className="font-medium mb-2">个人简介:</p>
                                    <p className="line-clamp-3">{counselor.introduction}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full">选择此咨询师</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-12 bg-white rounded-lg shadow">
                        <p className="text-lg mb-4">暂无可用的咨询师</p>
                    </div>
                )}
            </div>
        </div>
    );
}
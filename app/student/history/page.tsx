'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { useApi } from '@/app/_lib/api-client';
import { formatDate } from '@/app/_lib/utils';

interface AssessmentRecord {
    id: number;
    assessmentId: number;
    assessmentTitle: string;
    score: number;
    level: string;
    suggestion: string;
    createTime: string;
}

interface AppointmentRecord {
    id: number;
    counselorId: number;
    counselorName: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    reason: string;
    notes: string;
    createTime: string;
}

export default function StudentHistory() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'assessments' | 'appointments'>('assessments');

    // 使用SWR获取评估历史
    const { data: assessments, error: assessmentsError, isLoading: assessmentsLoading } =
        useApi<AssessmentRecord[]>('/assessment/history');

    // 使用SWR获取咨询历史
    const { data: appointments, error: appointmentsError, isLoading: appointmentsLoading } =
        useApi<AppointmentRecord[]>('/appointment/history');

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('role');

        if (!token || userType !== '0') {
            router.push('/auth/login');
        }
    }, [router]);

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

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">历史记录</h1>
                    <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
                        返回仪表盘
                    </Button>
                </div>

                <div className="flex space-x-2 pb-4">
                    <Button
                        variant={activeTab === 'assessments' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('assessments')}
                    >
                        评估历史
                    </Button>
                    <Button
                        variant={activeTab === 'appointments' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('appointments')}
                    >
                        咨询历史
                    </Button>
                </div>

                {activeTab === 'assessments' ? (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">心理咨询历史</h2>

                        {appointmentsLoading ? (
                            <div className="flex justify-center p-12">
                                <p className="text-lg">加载中...</p>
                            </div>
                        ) : appointmentsError ? (
                            <div className="text-center p-12">
                                <p className="text-lg text-destructive">加载咨询历史失败</p>
                            </div>
                        ) : appointments && appointments.length > 0 ? (
                            <div className="space-y-4">
                                {appointments.map(record => (
                                    <Card key={record.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle>咨询师: {record.counselorName}</CardTitle>
                                                    <CardDescription>
                                                        咨询时间: {formatDate(record.startTime)}
                                                    </CardDescription>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">状态: {renderAppointmentStatus(record.status)}</p>
                                                    <p className="text-sm">预约于: {formatDate(record.createTime)}</p>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="font-medium">咨询原因:</p>
                                                    <p className="text-sm">{record.reason}</p>
                                                </div>
                                                {record.notes && (
                                                    <div>
                                                        <p className="font-medium">咨询记录:</p>
                                                        <p className="text-sm whitespace-pre-line">{record.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-12 bg-white rounded-lg shadow">
                                <p className="text-lg mb-4">暂无咨询历史记录</p>
                                <Button onClick={() => router.push('/student/counseling')}>预约咨询</Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center p-12 bg-white rounded-lg shadow">
                        <p className="text-lg mb-4">暂无咨询历史记录</p>
                        <Button onClick={() => router.push('/student/counseling')}>预约咨询</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
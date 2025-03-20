'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/app/_components/ui/pagination";

// 更新接口定义
interface ExamPaper {
    id: number;
    title: string;
    time: number;
    status: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
}

interface PaginatedResponse<T> {
    total: number;
    pageSize: number;
    totalPage: number;
    currPage: number;
    list: T[];
}

export default function TeacherQuestionnaire() {
    const router = useRouter();
    const [questionnaires, setQuestionnaires] = useState<ExamPaper[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
    });

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'teacher') {
            router.push('/auth/login');
            return;
        }

        fetchQuestionnaires();
    }, [router]);

    // 添加分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [totalPages, setTotalPages] = useState(1);
    const fetchQuestionnaires = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/assessment/my-papers?page=${currentPage}&pageSize=${pageSize}`);
            if (response.code === 0 && response.data) {
                const paginatedData = response.data as PaginatedResponse<ExamPaper>;
                setQuestionnaires(paginatedData.list);
                setTotalPages(paginatedData.totalPage);
            } else {
                toast.error('获取问卷列表失败', {
                    description: response.msg || '无法加载问卷列表',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('获取问卷列表错误:', error);
            toast.error('获取问卷列表失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        } finally {
            setLoading(false);
        }
    };

    // 添加页面切换处理函数
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateQuestionnaire = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.description.trim()) {
            toast.error('请完善信息', {
                description: '标题和描述不能为空',
                position: 'top-center',
            });
            return;
        }

        setLoading(true);

        try {
            const response = await apiClient.post<ExamPaper>('/assessment', formData);

            if (response.code === 0 && response.data) {
                toast.success('创建成功', {
                    description: '问卷已创建，您可以继续添加问题',
                    position: 'top-center',
                });
                // 重新获取问卷列表
                fetchQuestionnaires();
                // 重置表单
                setFormData({
                    title: '',
                    description: '',
                });
                setShowCreateForm(false);
                // 跳转到问卷编辑页面
                router.push(`/teacher/questionnaire/${response.data.id}/edit`);
            } else {
                toast.error('创建失败', {
                    description: response.msg || '无法创建问卷',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('创建问卷错误:', error);
            toast.error('创建失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePublishQuestionnaire = async (id: number) => {
        try {
            const response = await apiClient.post(`/assessment/${id}/publish`);

            if (response.code === 0) {
                toast.success('发布成功', {
                    description: '问卷已发布，学生可以开始填写',
                    position: 'top-center',
                });
                // 重新获取问卷列表
                fetchQuestionnaires();
            } else {
                toast.error('发布失败', {
                    description: response.msg || '无法发布问卷',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('发布问卷错误:', error);
            toast.error('发布失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        }
    };

    const handleCloseQuestionnaire = async (id: number) => {
        try {
            const response = await apiClient.post(`/assessment/${id}/close`);

            if (response.code === 0) {
                toast.success('关闭成功', {
                    description: '问卷已关闭，学生将无法继续填写',
                    position: 'top-center',
                });
                // 重新获取问卷列表
                fetchQuestionnaires();
            } else {
                toast.error('关闭失败', {
                    description: response.msg || '无法关闭问卷',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('关闭问卷错误:', error);
            toast.error('关闭失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        }
    };

    const handleDeleteQuestionnaire = async (id: number) => {
        if (!confirm('确定要删除这个问卷吗？此操作不可恢复。')) {
            return;
        }

        try {
            const response = await apiClient.delete(`/assessment/${id}`);

            if (response.code === 0) {
                toast.success('删除成功', {
                    description: '问卷已删除',
                    position: 'top-center',
                });
                // 重新获取问卷列表
                fetchQuestionnaires();
            } else {
                toast.error('删除失败', {
                    description: response.msg || '无法删除问卷',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('删除问卷错误:', error);
            toast.error('删除失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        }
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0:
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">草稿</span>;
            case 1:
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">已发布</span>;
            case 2:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">已关闭</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">问卷管理</h1>
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
                                <CardTitle>问卷列表</CardTitle>
                                <CardDescription>管理您创建的所有心理评估问卷</CardDescription>
                            </div>
                            <Button onClick={() => setShowCreateForm(true)}>创建新问卷</Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-4">加载中...</div>
                            ) : questionnaires.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">暂无问卷，点击"创建新问卷"开始创建</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {questionnaires.map((questionnaire) => (
                                            <Card
                                                key={questionnaire.id}
                                                className="overflow-hidden hover:shadow-md transition-shadow"
                                                onClick={() => router.push(`/teacher/questionnaire/${questionnaire.id}/edit`)}
                                            >
                                                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between">
                                                    <div className="space-y-1 mb-4 md:mb-0">
                                                        <div className="flex items-center space-x-2">
                                                            <h3 className="text-lg font-semibold">{questionnaire.title}</h3>
                                                            {getStatusBadge(questionnaire.status)}
                                                        </div>
                                                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                                            <span>答题时长: {questionnaire.time}分钟</span>
                                                            <span>创建时间: {new Date(questionnaire.createdAt).toLocaleString('zh-CN')}</span>
                                                            <span>更新时间: {new Date(questionnaire.updatedAt).toLocaleString('zh-CN')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.push(`/teacher/questionnaire/${questionnaire.id}/edit`)}
                                                        >
                                                            编辑
                                                        </Button>
                                                        {questionnaire.status === 0 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handlePublishQuestionnaire(questionnaire.id)}
                                                            >
                                                                发布
                                                            </Button>
                                                        )}
                                                        {questionnaire.status === 1 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleCloseQuestionnaire(questionnaire.id)}
                                                            >
                                                                关闭
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDeleteQuestionnaire(questionnaire.id)}
                                                        >
                                                            删除
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                    <div className="mt-4">
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                    />
                                                </PaginationItem>
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <PaginationItem key={i + 1}>
                                                        <PaginationLink
                                                            onClick={() => handlePageChange(i + 1)}
                                                            isActive={currentPage === i + 1}
                                                        >
                                                            {i + 1}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                ))}
                                                <PaginationItem>
                                                    <PaginationNext
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>创建新问卷</CardTitle>
                            <CardDescription>填写基本信息创建一个新的心理评估问卷</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleCreateQuestionnaire}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="title" className="text-sm font-medium">
                                        问卷标题 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="title"
                                        name="title"
                                        type="text"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                        placeholder="请输入问卷标题"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="description" className="text-sm font-medium">
                                        问卷描述 <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary"
                                        placeholder="请输入问卷描述"
                                        rows={4}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-4">
                                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} disabled={loading}>
                                    取消
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? '创建中...' : '创建问卷'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}
            </div>
        </div>
    );
}
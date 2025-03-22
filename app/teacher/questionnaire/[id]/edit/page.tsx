'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import QuestionForm, { QuestionData } from '@/app/teacher/_components/QuestionForm';

interface Questionnaire {
    id: number;
    title: string;
    description: string;
    time: number;
    status: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
}

// 更新接口定义
interface Option {
    label: string;
    value: string;
    text: string;
}

interface Question {
    id: number;
    paperName: string;
    questionName: string;
    options: string; // JSON字符串
    score: number;
    answer: string;
    analysis: string;
    type: number; // 0：单选题 1：多选题 2：判断题 3：填空题
    sequence: number;
}

export default function EditQuestionnaire() {
    const router = useRouter();
    const params = useParams();
    const questionnaireId = Number(params.id);

    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'teacher') {
            router.push('/auth/login');
            return;
        }

        fetchQuestionnaireDetails();
    }, [router, questionnaireId]);

    const fetchQuestionnaireDetails = async () => {
        setLoading(true);
        try {
            // 获取问卷详情
            const questionnaireResponse = await apiClient.get<Questionnaire>(`/assessment/${questionnaireId}`);
            if (questionnaireResponse.code === 0 && questionnaireResponse.data) {
                setQuestionnaire(questionnaireResponse.data);
            } else {
                toast.error('获取问卷详情失败', {
                    description: questionnaireResponse.msg || '无法加载问卷详情',
                    position: 'top-center',
                });
                router.push('/teacher/questionnaire');
                return;
            }

            // 获取问卷问题列表
            const questionsResponse = await apiClient.get<Question[]>(`/assessment/${questionnaireId}/questions`);
            if (questionsResponse.code === 0 && questionsResponse.data) {
                setQuestions(questionsResponse.data);
            } else {
                toast.error('获取问题列表失败', {
                    description: questionsResponse.msg || '无法加载问题列表',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('获取问卷详情错误:', error);
            toast.error('获取问卷详情失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
            router.push('/teacher/questionnaire');
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = async (questionData: QuestionData) => {
        try {
            // 确保选择题有选项
            if ([0, 1].includes(questionData.type) && (!questionData.options || JSON.parse(questionData.options).length < 2)) {
                toast.error('添加失败', {
                    description: '选择题至少需要两个选项',
                    position: 'top-center',
                });
                return;
            }

            const response = await apiClient.post(`/questions`, {
                paperId: questionnaireId,
                paperName: questionnaire?.title,
                questionName: questionData.questionName,
                options: questionData.options,
                score: questionData.score,
                answer: questionData.answer,
                analysis: questionData.analysis,
                type: questionData.type,
                sequence: questionData.sequence
            });

            if (response.code === 0 && response.data) {
                toast.success('添加成功', {
                    description: '问题已添加到问卷中',
                    position: 'top-center',
                });
                fetchQuestionnaireDetails();
                setShowAddForm(false);
            } else {
                toast.error('添加失败', {
                    description: response.msg || '无法添加问题',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('添加问题错误:', error);
            toast.error('添加失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        }
    };

    const handleDeleteQuestion = async (questionId: number) => {
        if (!confirm('确定要删除这个问题吗？此操作不可恢复。')) {
            return;
        }

        try {
            const response = await apiClient.delete(`/questionnaire/${questionnaireId}/question/${questionId}`);

            if (response.code === 0) {
                toast.success('删除成功', {
                    description: '问题已从问卷中删除',
                    position: 'top-center',
                });
                // 重新获取问题列表
                fetchQuestionnaireDetails();
            } else {
                toast.error('删除失败', {
                    description: response.msg || '无法删除问题',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('删除问题错误:', error);
            toast.error('删除失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        }
    };

    const handleUpdateQuestionOrder = async (questionId: number, direction: 'up' | 'down') => {
        try {
            // 找到当前问题和要交换的问题
            const currentQuestion = questions.find(q => q.id === questionId);
            if (!currentQuestion) return;

            // 按sequence排序后的问题列表
            const sortedQuestions = [...questions].sort((a, b) => b.sequence - a.sequence);
            const currentIndex = sortedQuestions.findIndex(q => q.id === questionId);

            // 根据方向找到要交换的问题
            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= sortedQuestions.length) return;

            const targetQuestion = sortedQuestions[targetIndex];

            // 交换两个问题的顺序
            const response = await apiClient.put(`/assessment/question/swap-sequence`, {
                questionId1: currentQuestion.id,
                sequence1: currentQuestion.sequence,
                questionId2: targetQuestion.id,
                sequence2: targetQuestion.sequence
            });

            if (response.code === 0) {
                fetchQuestionnaireDetails();
            } else {
                toast.error('更新顺序失败', {
                    description: response.msg || '无法更新问题顺序',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('更新问题顺序错误:', error);
            toast.error('更新顺序失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-muted p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">加载中...</div>
                </div>
            </div>
        );
    }

    if (!questionnaire) {
        return (
            <div className="min-h-screen bg-muted p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">问卷不存在或已被删除</div>
                </div>
            </div>
        );
    }
    // 添加问题类型映射
    const questionTypes = {
        0: '单选题',
        1: '多选题',
        2: '判断题',
        3: '填空题'
    } as const;

    const sortedQuestions = [...questions].sort((a, b) => b.sequence - a.sequence);

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">编辑问卷</h1>
                        <p className="text-muted-foreground">{questionnaire.title}</p>
                    </div>
                    <div className="space-x-4">
                        <Button variant="outline" onClick={() => router.push('/teacher/questionnaire')}>
                            返回问卷列表
                        </Button>
                        {questionnaire.status === 0 && (
                            <Button onClick={() => router.push(`/teacher/questionnaire/${questionnaireId}/preview`)}>
                                预览问卷
                            </Button>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>问卷信息</CardTitle>
                        <CardDescription>基本信息和状态</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium">问卷标题</h3>
                                <p>{questionnaire.title}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium">问卷描述</h3>
                                <p>{questionnaire.description}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium">状态</h3>
                                <p>
                                    {questionnaire.status === 0 && '草稿'}
                                    {questionnaire.status === 1 && '已发布'}
                                    {questionnaire.status === 2 && '已关闭'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>问题管理</CardTitle>
                            <CardDescription>添加和管理问卷中的问题</CardDescription>
                        </div>
                        {questionnaire.status === 0 && (
                            <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
                                添加问题
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {showAddForm && questionnaire && (
                            <QuestionForm
                                onSubmit={handleAddQuestion}
                                onCancel={() => setShowAddForm(false)}
                                paperId={questionnaireId}
                                paperName={questionnaire.title}
                            />
                        )}

                        {questions.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">暂无问题，点击"添加问题"开始创建</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((question, index) => (
                                    <Card key={question.id} className="relative">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-lg font-semibold">
                                                            第{index + 1}题 - {question.questionName}
                                                        </span>
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                            {questionTypes[question.type as keyof typeof questionTypes]}
                                                        </span>
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                            {question.score}分
                                                        </span>
                                                    </div>
                                                    {/* 移除重复的问题名称显示 */}
                                                    {question.options && (
                                                        <div className="space-y-2 mt-4">
                                                            {JSON.parse(question.options).map((option: Option) => (
                                                                <div key={option.label} className="flex items-center gap-2">
                                                                    <span className="font-medium">{option.label}.</span>
                                                                    <span>{option.text}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {question.analysis && (
                                                        <div className="mt-4 text-sm text-muted-foreground">
                                                            <p className="font-medium">答案解析：</p>
                                                            <p>{question.analysis}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                {questionnaire.status === 0 && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUpdateQuestionOrder(question.id, 'up')}
                                                            disabled={index === 0}
                                                        >
                                                            上移
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUpdateQuestionOrder(question.id, 'down')}
                                                            disabled={index === sortedQuestions.length - 1}
                                                        >
                                                            下移
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDeleteQuestion(question.id)}
                                                        >
                                                            删除
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
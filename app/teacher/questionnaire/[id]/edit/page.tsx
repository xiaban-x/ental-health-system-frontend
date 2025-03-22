'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { QuestionData } from '@/app/teacher/_components/question-form/types';
import QuestionnaireInfoCard from '@/app/teacher/_components/questionnaire/QuestionnaireInfoCard';
import QuestionList from '@/app/teacher/_components/questionnaire/QuestionList';

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
                // 按sequence排序
                const sortedQuestions = questionsResponse.data.sort((a, b) => b.sequence - a.sequence);
                setQuestions(sortedQuestions);
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

            const response = await apiClient.post<Question>(`/questions`, {
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

                // 添加成功后直接更新本地状态，避免重新请求
                const newQuestion = response.data;
                setQuestions((prev) => {
                    const updated = [...prev, newQuestion].sort((a, b) => b.sequence - a.sequence);
                    return updated;
                });
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

    const handleUpdateQuestion = async (questionId: number, questionData: QuestionData) => {
        try {
            // 确保选择题有选项
            if ([0, 1].includes(questionData.type) && (!questionData.options || JSON.parse(questionData.options).length < 2)) {
                toast.error('更新失败', {
                    description: '选择题至少需要两个选项',
                    position: 'top-center',
                });
                return;
            }

            const response = await apiClient.put(`/questions/${questionId}`, {
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

            if (response.code === 0) {
                toast.success('更新成功', {
                    description: '问题已更新',
                    position: 'top-center',
                });

                // 更新本地状态，避免重新请求
                setQuestions(prev => {
                    const updatedQuestions = prev.map(q =>
                        q.id === questionId
                            ? {
                                ...q,
                                questionName: questionData.questionName,
                                options: questionData.options,
                                score: questionData.score,
                                answer: questionData.answer,
                                analysis: questionData.analysis,
                                type: questionData.type,
                                sequence: questionData.sequence
                            }
                            : q
                    );
                    return updatedQuestions.sort((a, b) => b.sequence - a.sequence);
                });
            } else {
                toast.error('更新失败', {
                    description: response.msg || '无法更新问题',
                    position: 'top-center',
                });
            }
        } catch (error) {
            console.error('更新问题错误:', error);
            toast.error('更新失败', {
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

                // 直接更新本地状态，避免重新请求
                setQuestions(prev => prev.filter(q => q.id !== questionId));
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

    const handleMoveQuestion = async (questionId: number, direction: 'up' | 'down') => {
        // 找到当前问题和要交换的问题
        const sortedQuestions = [...questions].sort((a, b) => b.sequence - a.sequence);
        const currentIndex = sortedQuestions.findIndex(q => q.id === questionId);

        if (currentIndex === -1) return;

        // 根据方向找到要交换的问题
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= sortedQuestions.length) return;

        const currentQuestion = sortedQuestions[currentIndex];
        const targetQuestion = sortedQuestions[targetIndex];

        // 先在本地更新状态，实现即时反馈
        const updatedQuestions = [...sortedQuestions];

        // 交换sequence值
        const tempSequence = currentQuestion.sequence;
        updatedQuestions[currentIndex] = { ...currentQuestion, sequence: targetQuestion.sequence };
        updatedQuestions[targetIndex] = { ...targetQuestion, sequence: tempSequence };

        // 更新本地状态
        setQuestions(updatedQuestions);

        // 然后异步发送请求到后端
        try {
            const response = await apiClient.put(`/assessment/question/swap-sequence`, {
                questionId1: currentQuestion.id,
                sequence1: currentQuestion.sequence,
                questionId2: targetQuestion.id,
                sequence2: targetQuestion.sequence
            });

            if (response.code !== 0) {
                // 如果请求失败，回滚本地状态
                toast.error('更新顺序失败', {
                    description: response.msg || '无法更新问题顺序',
                    position: 'top-center',
                });
                fetchQuestionnaireDetails(); // 重新获取数据以恢复正确状态
            }
        } catch (error) {
            console.error('更新问题顺序错误:', error);
            toast.error('更新顺序失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
            fetchQuestionnaireDetails(); // 重新获取数据以恢复正确状态
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

                <QuestionnaireInfoCard questionnaire={questionnaire} />

                <QuestionList
                    questions={questions}
                    questionnaireId={questionnaireId}
                    questionnaireName={questionnaire.title}
                    isEditable={questionnaire.status === 0}
                    onAddQuestion={handleAddQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                    onUpdateQuestion={handleUpdateQuestion}
                    onMoveQuestion={handleMoveQuestion}
                />
            </div>
        </div>
    );
}
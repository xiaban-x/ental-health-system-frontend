'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/_components/ui/button';
import { apiClient, useApi } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { QuestionData } from '@/app/teacher/_components/question-form/types';
import QuestionnaireInfoCard from '@/app/teacher/_components/questionnaire/QuestionnaireInfoCard';
import QuestionList from '@/app/teacher/_components/questionnaire/QuestionList';
// 导入对话框相关组件
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/_components/ui/dialog";

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
    const [loading, setLoading] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    // 添加对话框状态
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);

    // 使用SWR获取问卷详情
    const {
        data: questionnaire,
        error: questionnaireError,
        mutate: mutateQuestionnaire
    } = useApi<Questionnaire>(`/assessment/${questionnaireId}`);

    // 使用SWR获取问题列表
    const {
        data: questionsData,
        error: questionsError,
        mutate: mutateQuestions
    } = useApi<Question[]>(`/assessment/${questionnaireId}/questions`, undefined, {
        onSuccess: (data: Question[]) => {
            // 成功获取数据后按sequence排序 (从小到大)
            return data.sort((a, b) => b.sequence - a.sequence);
        }
    });

    // 处理错误
    useEffect(() => {
        if (questionnaireError) {
            toast.error('获取问卷详情失败', {
                description: '无法加载问卷详情',
                position: 'top-center',
            });
            router.push('/teacher/questionnaire');
        }

        if (questionsError) {
            toast.error('获取问题列表失败', {
                description: '无法加载问题列表',
                position: 'top-center',
            });
        }
    }, [questionnaireError, questionsError, router]);

    const handleAddQuestion = async (questionData: QuestionData) => {
        try {
            setLoading(true);
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

                // 使用SWR的mutate更新本地缓存
                if (questionsData) {
                    const newQuestions = [...questionsData, response.data].sort((a, b) => b.sequence - a.sequence);
                    mutateQuestions(newQuestions, false);
                }
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
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuestion = async (questionId: number, questionData: QuestionData) => {
        try {
            setLoading(true);
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

                // 使用SWR的mutate更新本地缓存
                if (questionsData) {
                    const updatedQuestions = questionsData.map(q =>
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
                    ).sort((a, b) => b.sequence - a.sequence);

                    mutateQuestions(updatedQuestions, false);
                }
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
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuestion = async (questionId: number) => {
        if (!confirm('确定要删除这个问题吗？此操作不可恢复。')) {
            return;
        }

        try {
            setLoading(true);
            const response = await apiClient.delete(`/questionnaire/${questionnaireId}/question/${questionId}`);

            if (response.code === 0) {
                toast.success('删除成功', {
                    description: '问题已从问卷中删除',
                    position: 'top-center',
                });

                // 使用SWR的mutate更新本地缓存
                if (questionsData) {
                    const filteredQuestions = questionsData.filter(q => q.id !== questionId);
                    mutateQuestions(filteredQuestions, false);
                }
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
        } finally {
            setLoading(false);
        }
    };

    const handleMoveQuestion = async (questionId: number, direction: 'up' | 'down') => {
        try {
            // 找到当前问题和要交换的问题
            if (!questionsData) return;

            const currentIndex = questionsData.findIndex(q => q.id === questionId);
            if (currentIndex === -1) return;

            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= questionsData.length) return;

            const currentQuestion = questionsData[currentIndex];
            const targetQuestion = questionsData[targetIndex];

            // 创建新的问题列表并交换sequence值
            const newQuestions = [...questionsData];
            const tempSequence = currentQuestion.sequence;

            // 更新本地状态中的sequence值
            newQuestions[currentIndex] = { ...currentQuestion, sequence: targetQuestion.sequence };
            newQuestions[targetIndex] = { ...targetQuestion, sequence: tempSequence };

            // 先更新本地状态，提供即时反馈
            mutateQuestions(newQuestions.sort((a, b) => b.sequence - a.sequence), false);

            // 发送请求到后端
            const response = await apiClient.put(`/assessment/question/swap-sequence`, {
                questionId1: currentQuestion.id,
                sequence1: targetQuestion.sequence,
                questionId2: targetQuestion.id,
                sequence2: tempSequence
            });

            if (response.code !== 0) {
                toast.error('更新顺序失败', {
                    description: response.msg || '无法更新问题顺序',
                    position: 'top-center',
                });
                // 如果失败，重新获取数据
                mutateQuestions();
            }
        } catch (error) {
            console.error('更新问题顺序错误:', error);
            toast.error('更新顺序失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center',
            });
            // 如果失败，重新获取数据
            mutateQuestions();
        }
    };

    // 判断是否正在加载
    const isLoading = !questionnaire || !questionsData || loading;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">加载中...</div>
                </div>
            </div>
        );
    }

    // 修改发布问卷的函数，移除确认对话框逻辑
    const handlePublishQuestionnaire = async () => {
        // 检查问卷是否有问题
        if (!questionsData || questionsData.length === 0) {
            toast.error('发布失败', {
                description: '问卷必须至少包含一个问题',
                position: 'top-center',
            });
            return;
        }

        setPublishLoading(true);
        try {
            const response = await apiClient.post(`/assessment/${questionnaireId}/publish`);

            if (response.code === 0) {
                toast.success('发布成功', {
                    description: '问卷已发布，学生可以开始填写',
                    position: 'top-center',
                });

                // 更新本地问卷状态
                if (questionnaire) {
                    const updatedQuestionnaire = { ...questionnaire, status: 1 };
                    mutateQuestionnaire(updatedQuestionnaire, false);
                }

                // 关闭对话框
                setPublishDialogOpen(false);

                // 跳转到问卷列表页面
                router.push('/teacher/questionnaire');
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
        } finally {
            setPublishLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">编辑问卷</h1>
                        <p className="text-muted-foreground">{questionnaire?.title}</p>
                    </div>
                    <div className="space-x-4">
                        <Button variant="outline" onClick={() => router.push('/teacher/questionnaire')}>
                            返回问卷列表
                        </Button>
                        {questionnaire?.status === 0 && (
                            <>
                                <Button onClick={() => router.push(`/teacher/questionnaire/${questionnaireId}/preview`)}>
                                    预览问卷
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => setPublishDialogOpen(true)}
                                    disabled={questionsData?.length === 0}
                                >
                                    发布问卷
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* 发布确认对话框 */}
                <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>确认发布问卷</DialogTitle>
                            <DialogDescription>
                                发布后将不能再编辑问题。学生将可以开始填写此问卷。
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
                                取消
                            </Button>
                            <Button
                                onClick={handlePublishQuestionnaire}
                                disabled={publishLoading}
                            >
                                {publishLoading ? '发布中...' : '确认发布'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <QuestionnaireInfoCard questionnaire={questionnaire} />

                <QuestionList
                    questions={questionsData}
                    questionnaireId={questionnaireId}
                    questionnaireName={questionnaire?.title}
                    isEditable={questionnaire?.status === 0}
                    onAddQuestion={handleAddQuestion}
                    onDeleteQuestion={handleDeleteQuestion}
                    onUpdateQuestion={handleUpdateQuestion}
                    onMoveQuestion={handleMoveQuestion}
                    mutateQuestions={mutateQuestions} // 传递mutateQuestions给子组件
                />
            </div>
        </div>
    );
}
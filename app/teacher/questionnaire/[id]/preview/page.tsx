'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { Button } from '@/app/_components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/app/_components/ui/card';
import { Questionnaire, Question } from '@/app/teacher/_types/questionnaire';
import { QuestionList } from '@/app/teacher/_components/shared/QuestionList';
// 导入对话框相关组件
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/_components/ui/dialog";

export default function PreviewQuestionnaire() {
    const router = useRouter();
    const params = useParams();
    const questionnaireId = Number(params.id);

    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [publishLoading, setPublishLoading] = useState(false);
    const [showAnswers, setShowAnswers] = useState(false);
    // 添加对话框状态
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    useEffect(() => {
        fetchQuestionnaireDetails();
    }, []);

    const fetchQuestionnaireDetails = async () => {
        setLoading(true);
        try {
            const [questionnaireResponse, questionsResponse] = await Promise.all([
                apiClient.get<Questionnaire>(`/assessment/${questionnaireId}`),
                apiClient.get<Question[]>(`/assessment/${questionnaireId}/questions`)
            ]);

            if (questionnaireResponse.code === 0 && questionnaireResponse.data) {
                setQuestionnaire(questionnaireResponse.data);
            } else {
                toast.error('获取问卷详情失败');
                router.push('/teacher/questionnaire');
                return;
            }

            if (questionsResponse.code === 0 && questionsResponse.data) {
                setQuestions(questionsResponse.data);
            }
        } catch (error) {
            toast.error('获取问卷详情失败');
            router.push('/teacher/questionnaire');
        } finally {
            setLoading(false);
        }
    };

    // 修改发布问卷的函数，移除确认对话框逻辑
    const handlePublishQuestionnaire = async () => {
        // 检查问卷是否有问题
        if (!questions || questions.length === 0) {
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
                    setQuestionnaire({ ...questionnaire, status: 1 });
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

    if (loading) {
        return (
            <div className="min-h-screen bg-muted p-6">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center py-12">加载中...</div>
                </div>
            </div>
        );
    }

    if (!questionnaire) {
        return (
            <div className="min-h-screen bg-muted p-6">
                <div className="max-w-3xl mx-auto">
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
                        <h1 className="text-3xl font-bold">预览问卷</h1>
                        {questionnaire && <p className="text-muted-foreground">{questionnaire.title}</p>}
                    </div>
                    <div className="space-x-4">
                        <Button variant="outline" onClick={() => router.push('/teacher/questionnaire')}>
                            返回问卷列表
                        </Button>
                        <Button variant="outline" onClick={() => router.push(`/teacher/questionnaire/${questionnaireId}/edit`)}>
                            编辑问卷
                        </Button>
                        <Button
                            onClick={() => setShowAnswers(!showAnswers)}
                            variant="secondary"
                        >
                            {showAnswers ? '隐藏答案' : '显示答案'}
                        </Button>
                        {questionnaire && questionnaire.status === 0 && (
                            <Button
                                variant="default"
                                onClick={() => setPublishDialogOpen(true)}
                                disabled={questions.length === 0}
                            >
                                发布问卷
                            </Button>
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

                {loading ? (
                    <div className="text-center py-12">加载中...</div>
                ) : (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>{questionnaire?.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium">问卷描述</h3>
                                        <p>{questionnaire?.description}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium">完成时间</h3>
                                        <p>{questionnaire?.time} 分钟</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium">状态</h3>
                                        <p>{questionnaire?.status === 0 ? '草稿' : '已发布'}</p>
                                    </div>
                                </div>
                            </CardContent>
                            {questionnaire?.status === 0 && questions.length > 0 && (
                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        onClick={() => setPublishDialogOpen(true)}
                                        disabled={publishLoading}
                                    >
                                        发布问卷
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>

                        <QuestionList
                            questions={questions}
                            showAnswers={showAnswers}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
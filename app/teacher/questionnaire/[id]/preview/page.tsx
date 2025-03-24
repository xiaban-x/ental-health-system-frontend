'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { Button } from '@/app/_components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/_components/ui/card';
import { Questionnaire, Question } from '@/app/teacher/_types/questionnaire';
import { QuestionList } from '@/app/teacher/_components/shared/QuestionList';

export default function PreviewQuestionnaire() {
    const router = useRouter();
    const params = useParams();
    const questionnaireId = Number(params.id);

    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAnswers, setShowAnswers] = useState(false);
    useEffect(() => {
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
            <div className="max-w-3xl mx-auto space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{questionnaire.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-2">{questionnaire.description}</p>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" onClick={() => router.push(`/teacher/questionnaire/${questionnaireId}/edit`)}>
                                返回编辑
                            </Button>
                            {
                                showAnswers ?
                                    <Button variant="outline" onClick={() => setShowAnswers(false)}>
                                        隐藏答案
                                    </Button> :
                                    <Button variant="outline" onClick={() => setShowAnswers(true)}>
                                        显示答案
                                    </Button>
                            }
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            <p>答题时间：{questionnaire.time} 分钟</p>
                        </div>
                    </CardContent>
                </Card>

                <QuestionList questions={questions} showAnswers={showAnswers} />
            </div>
        </div>
    );
}
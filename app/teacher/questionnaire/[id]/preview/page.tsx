'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { QuestionnaireHeader } from '@/app/teacher/_components/preview/QuestionnaireHeader';
import { Questionnaire, Question } from '@/app/teacher/_types/questionnaire';
import { LoadingState } from '@/app/teacher/_components/preview/LoadingState';
import { QuestionList } from '@/app/teacher/_components/preview/QuestionList';

export default function PreviewQuestionnaire() {
    const router = useRouter();
    const params = useParams();
    const questionnaireId = Number(params.id);

    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <LoadingState />;
    if (!questionnaire) return <div>问卷不存在或已被删除</div>;

    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <QuestionnaireHeader
                    questionnaire={questionnaire}
                    onBack={() => router.push(`/teacher/questionnaire/${questionnaireId}/edit`)}
                />
                <QuestionList questions={questions} />
            </div>
        </div>
    );
}
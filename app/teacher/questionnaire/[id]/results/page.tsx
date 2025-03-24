'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';
import { Questionnaire, Question } from '@/app/teacher/_types/questionnaire';
import { QuestionnaireInfoCard } from '@/app/teacher/_components/shared/QuestionnaireInfoCard';
import { QuestionList } from '@/app/teacher/_components/shared/QuestionList';

export default function QuestionnaireResults() {
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

      // 获取问卷问题列表 - 这里已经包含了答案和解析
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
            <h1 className="text-3xl font-bold">问卷结果</h1>
            <p className="text-muted-foreground">{questionnaire.title}</p>
          </div>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => router.push('/teacher/questionnaire')}>
              返回问卷列表
            </Button>
            <Button variant="outline" onClick={() => router.push(`/teacher/questionnaire/${questionnaireId}/preview`)}>
              查看预览
            </Button>
          </div>
        </div>

        <QuestionnaireInfoCard questionnaire={questionnaire} />

        <Card>
          <CardHeader>
            <CardTitle>问卷题目</CardTitle>
            <CardDescription>查看问卷题目、答案和解析</CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length > 0 ? (
              <QuestionList questions={questions} showAnswers={true} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">暂无题目</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
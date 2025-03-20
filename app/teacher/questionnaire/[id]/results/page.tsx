'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';

interface Questionnaire {
    id: number;
    title: string;
    description: string;
    status: 'draft' | 'published' | 'closed';
    createdAt: string;
    updatedAt: string;
    questionCount: number;
}

interface Question {
    id: number;
    questionnaireId: number;
    content: string;
    type: 'single_choice' | 'multiple_choice' | 'text' | 'scale';
    options: string[];
    required: boolean;
    order: number;
}

interface Answer {
    id: number;
    questionId: number;
    studentId: number;
    studentName: string;
    answer: string;
    createdAt: string;
}

interface SubmissionSummary {
    totalSubmissions: number;
    completionRate: number;
    averageScore?: number;
    questionStats: {
        questionId: number;
        questionContent: string;
        questionType: string;
        stats: any;
    }[];
}

export default function QuestionnaireResults() {
    const router = useRouter();
    const params = useParams();
    const questionnaireId = Number(params.id);

    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [summary, setSummary] = useState<SubmissionSummary | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'summary' | 'individual'>('summary');
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== '1') {
            router.push('/auth/login');
            return;
        }

        fetchQuestionnaireDetails();
    }, [router, questionnaireId]);

    const fetchQuestionnaireDetails = async () => {
        setLoading(true);
        try {
            // 获取问卷详情
            const questionnaireResponse = await apiClient.get(`/questionnaire/${questionnaireId}`);
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
            const questionsResponse = await apiClient.get(`/questionnaire/${questionnaireId}/questions`);
            if (questionsResponse.code === 0 && questionsResponse.data) {
                setQuestions(questionsResponse.data);
            } else {
                toast.error('获取问题列表失败', {
                    description: questionsResponse.msg || '无法加载问题列表',
                    position: 'top-center',
                });
            }

            // 获取问卷结果摘要
            const summaryResponse = await apiClient.get(`/questionnaire/${questionnaireId}/results/summary`);
            if (summaryResponse.code === 0 && summaryResponse.data) {
                setSummary(summaryResponse.data);
            } else {
                toast.error('获取结果摘要失败', {
                    description: summaryResponse.msg || '无法加载结果摘要',
                    position: 'top-center',
                });
            }

            // 获取所有答案
            const answersResponse = await apiClient.get(`/questionnaire/${questionnaireId}/results/answers`);
            if (answersResponse.code === 0 && answersResponse.data) {
                setAnswers(answersResponse.data);
            } else {
                toast.error('获取答案列表失败', {
                    description: answersResponse.msg || '无法加载答案列表',
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

    // 获取学生列表（去重）
    const getStudentList = () => {
        const studentMap = new Map();
        answers.forEach(answer => {
            if (!studentMap.has(answer.studentId)) {
                studentMap.set(answer.studentId, answer.studentName);
            }
        });
        return Array.from(studentMap).map(([id, name]) => ({ id, name }));
    };

    // 获取特定学生的答案
    const getStudentAnswers = (studentId: number) => {
        return answers.filter(answer => answer.studentId === studentId);
    };

    // 渲染问题统计信息
    const renderQuestionStats = (questionStat: any) => {
        const { questionType, stats } = questionStat;

        if (questionType === 'single_choice' || questionType === 'multiple_choice') {
            return (
                <div className="mt-2">
                    {Object.entries(stats.options).map(([option, count]: [string, any]) => (
                        <div key={option} className="flex items-center space-x-2 mb-1">
                            <span className="text-sm">{option}:</span>
                            <div className="flex-1 bg-gray-200 h-4 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full rounded-full"
                                    style={{ width: `${(count / stats.total) * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-sm">{count} ({Math.round((count / stats.total) * 100)}%)</span>
                        </div>
                    ))}
                </div>
            );
        } else if (questionType === 'scale') {
            const averageScore = stats.average.toFixed(1);
            return (
                <div className="mt-2">
                    <div className="flex items-center space-x-4 mb-2">
                        <span className="text-sm">平均分: {averageScore}</span>
                    </div>
                    <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map(score => (
                            <div key={score} className="text-center">
                                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-1">
                                    {score}
                                </div>
                                <span className="text-xs">{stats.distribution[score] || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        } else if (questionType === 'text') {
            return (
                <div className="mt-2">
                    <p className="text-sm">共 {stats.count} 条文本回答</p>
                </div>
            );
        }

        return null;
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

    const studentList = getStudentList();

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
                                    {questionnaire.status === 'draft' && '草稿'}
                                    {questionnaire.status === 'published' && '已发布'}
                                    {questionnaire.status === 'closed' && '已关闭'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>结果查看</CardTitle>
                            <CardDescription>查看问卷填写结果和统计数据</CardDescription>
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant={viewMode === 'summary' ? 'default' : 'outline'}
                                onClick={() => setViewMode('summary')}
                            >
                                统计摘要
                            </Button>
                            <Button
                                variant={viewMode === 'individual' ? 'default' : 'outline'}
                                onClick={() => setViewMode('individual')}
                            >
                                个人答案
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {viewMode === 'summary' ? (
                            <div className="space-y-6">
                                {summary ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Card className="p-4">
                                                <h3 className="text-lg font-medium mb-1">总提交数</h3>
                                                <p className="text-3xl font-bold">{summary.totalSubmissions}</p>
                                            </Card>
                                            <Card className="p-4">
                                                <h3 className="text-lg font-medium mb-1">完成率</h3>
                                                <p className="text-3xl font-bold">{(summary.completionRate * 100).toFixed(1)}%</p>
                                            </Card>
                                            {summary.averageScore && (
                                                <Card className="p-4">
                                                    <h3 className="text-lg font-medium mb-1">平均得分</h3>
                                                    <p className="text-3xl font-bold">{summary.averageScore.toFixed(1)}</p>
                                                </Card>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">问题统计</h3>
                                            {summary.questionStats.map((questionStat) => (
                                                <Card key={questionStat.questionId} className="p-4">
                                                    <div className="mb-2">
                                                        <h4 className="font-medium">{questionStat.questionContent}</h4>
                                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                                            {questionStat.questionType === 'single_choice' && '单选题'}
                                                            {questionStat.questionType === 'multiple_choice' && '多选题'}
                                                            {questionStat.questionType === 'text' && '文本题'}
                                                            {questionStat.questionType === 'scale' && '量表题'}
                                                        </span>
                                                    </div>
                                                    {renderQuestionStats(questionStat)}
                                                </Card>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">暂无统计数据</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {studentList.length > 0 ? (
                                    <>
                                        <div className="flex space-x-4 mb-4">
                                            <div className="w-64">
                                                <label htmlFor="student-select" className="text-sm font-medium block mb-2">
                                                    选择学生
                                                </label>
                                                <select
                                                    id="student-select"
                                                    className="w-full p-2 border rounded-md"
                                                    value={selectedStudentId || ''}
                                                    onChange={(e) => setSelectedStudentId(Number(e.target.value) || null)}
                                                >
                                                    <option value="">请选择学生</option>
                                                    {studentList.map(student => (
                                                        <option key={student.id} value={student.id}>
                                                            {student.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {selectedStudentId ? (
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-medium">学生答案</h3>
                                                {questions.sort((a, b) => a.order - b.order).map(question => {
                                                    const answer = getStudentAnswers(selectedStudentId).find(a => a.questionId === question.id);
                                                    return (
                                                        <Card key={question.id} className="p-4">
                                                            <div className="mb-2">
                                                                <h4 className="font-medium">{question.content}</h4>
                                                                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                                                    {question.type === 'single_choice' && '单选题'}
                                                                    {question.type === 'multiple_choice' && '多选题'}
                                                                    {question.type === 'text' && '文本题'}
                                                                    {question.type === 'scale' && '量表题'}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2">
                                                                {answer ? (
                                                                    <div>
                                                                        {question.type === 'text' ? (
                                                                            <p className="p-2 bg-gray-50 rounded">{answer.answer}</p>
                                                                        ) : question.type === 'scale' ? (
                                                                            <div className="flex items-center">
                                                                                <span className="mr-2">评分:</span>
                                                                                <span className="font-medium">{answer.answer}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <p>{answer.answer}</p>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-gray-500 italic">未回答</p>
                                                                )}
                                                            </div>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-muted-foreground">请选择一名学生查看答案</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">暂无学生提交答案</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
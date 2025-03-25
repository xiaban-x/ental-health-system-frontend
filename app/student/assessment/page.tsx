'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { useApi } from '@/app/_lib/api-client';
import { apiClient } from '@/app/_lib/api-client';
import { toast } from 'sonner';

// 对应 ExamPaperEntity
interface Assessment {
    id: number;
    title: string;           // 试卷名称
    time: number;           // 问卷时长(分钟)
    status: number;         // 试卷状态
    createdAt: string;      // 创建时间
    updatedAt: string;      // 更新时间
}

// 对应 ExamQuestionEntity
interface Question {
    id: number;
    paperId: number;        // 所属试卷id
    paperName: string;      // 试卷名称
    questionName: string;   // 试题名称
    options: string;        // 选项，json字符串
    score: number;         // 分值
    answer: string;        // 正确答案
    analysis: string;      // 答案解析
    type: number;          // 试题类型：0单选、1多选、2判断、3填空
    sequence: number;      // 试题排序
}

// 对应 ExamRecordEntity
interface AssessmentResult {
    id: number;
    userId: number;
    paperId: number;
    totalScore: number;     // 试题得分
    feedback: string;    // 反馈
    createdAt: string;
    updatedAt: string;
}

interface Assessment {
    id: number;
    title: string;
    description: string;
    questionCount: number;
    estimatedTime: string;
}

// 导入分页组件
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/app/_components/ui/pagination";

// 添加分页接口
interface PaginatedResponse<T> {
    total: number;
    pageSize: number;
    totalPage: number;
    currPage: number;
    list: T[];
}

export default function StudentAssessment() {
    // 添加分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // 修改 API 调用，添加分页参数
    const { data: paginatedData, error, isLoading } = useApi<PaginatedResponse<Assessment>>(`/assessment/list?page=${currentPage}&pageSize=${pageSize}`);

    // 从分页数据中提取评估列表
    const assessments = paginatedData?.list || [];

    const router = useRouter();
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: number | string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assessmentCompleted, setAssessmentCompleted] = useState(false);
    const [result, setResult] = useState<AssessmentResult | null>(null);

    // 使用SWR获取评估列表
    // const { data: assessments, error, isLoading } = useApi<Assessment[]>('/assessment/list');

    useEffect(() => {
        // 检查用户是否已登录
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'student') {
            router.push('/auth/login');
        }
    }, [router]);

    const startAssessment = async (assessment: Assessment) => {
        setSelectedAssessment(assessment);
        try {
            const response = await apiClient.get(`/assessment/${assessment.id}/questions`);
            if (response.code === 0 && response.data) {
                setQuestions(response.data as Question[]);
                setCurrentQuestionIndex(0);
                setAnswers({});
                setAssessmentCompleted(false);
                setResult(null);
            } else {
                toast.success('评估成功', {
                    description: response.msg || '无法加载评估问题',
                    position: 'top-center'
                });
            }
        } catch (error) {
            console.error('获取问题错误:', error);
            toast.error('提交问题失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center'
            });
        }
    };

    const handleAnswer = (questionId: number, optionValue: string | string[]) => {
        setAnswers((prev: { [key: number]: string | number }) => {
            const newAnswers = { ...prev };
            // 将 optionValue 转换为 string | number 类型
            newAnswers[questionId] = Array.isArray(optionValue) ? optionValue.join(',') : optionValue;
            return newAnswers as { [key: number]: string | number };
        });

        // 只有在单选题和判断题的情况下，才自动前进到下一题
        const currentQuestion = questions[currentQuestionIndex];
        if ((currentQuestion.type === 0 || currentQuestion.type === 2) && currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        // 检查是否所有问题都已回答
        const answeredQuestions = Object.keys(answers).length;
        if (answeredQuestions < questions.length) {
            toast.error('提交问题失败', {
                description: `您还有 ${questions.length - answeredQuestions} 个问题未回答`,
                position: 'top-center'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await apiClient.post(`/assessment/${selectedAssessment?.id}/submit`, {
                answers: Object.entries(answers).map(([questionId, optionValue]) => ({
                    questionId: parseInt(questionId),
                    optionValue
                }))
            });

            if (response.code === 0) {
                setAssessmentCompleted(true);
                setResult(response.data as AssessmentResult);
                toast.success('完成评估', {
                    description: '您的评估结果已生成',
                    position: 'top-center'
                });
            } else {
                toast.error('提交问题失败', {
                    description: response.msg || '无法提交评估结果',
                    position: 'top-center'
                });
            }
        } catch (error) {
            console.error('提交评估错误:', error);
            toast.error('提交问题失败', {
                description: '服务器错误，请稍后再试',
                position: 'top-center'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToList = () => {
        setSelectedAssessment(null);
        setQuestions([]);
        setAnswers({});
        setAssessmentCompleted(false);
        setResult(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">加载中...</p>
            </div>
        );
    }

    // 显示评估结果
    if (assessmentCompleted && result) {
        return (
            <div className="min-h-screen bg-muted p-6">
                <div className="max-w-3xl mx-auto">
                    <Button variant="outline" onClick={handleBackToList} className="mb-6">
                        返回评估列表
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">评估结果</CardTitle>
                            <CardDescription>
                                {selectedAssessment?.title} - {result.createdAt}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-primary/10 rounded-lg">
                                <h3 className="text-xl font-semibold mb-2">总分: {result.totalScore}</h3>
                                {/* <p className="text-lg">评估等级: {result.totalScore}</p> */}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">专业建议</h3>
                                <p className="whitespace-pre-line">{result.feedback}</p>
                            </div>

                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    注意：此评估结果仅供参考，如有需要请咨询专业心理医师。
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => router.push('/student/counseling')} className="w-full">
                                预约心理咨询
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    // 显示问题
    if (selectedAssessment && questions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
        // 解析选项 JSON 字符串
        const parsedOptions = JSON.parse(currentQuestion.options);

        // 渲染不同类型的问题选项
        const renderQuestionOptions = () => {
            switch (currentQuestion.type) {
                case 0: // 单选题
                    return (
                        <div className="space-y-3">
                            {parsedOptions.map((option: { label: string; value: string; text: string }) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${answers[currentQuestion.id] === option.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                        }`}
                                >
                                    {option.label}. {option.text}
                                </div>
                            ))}
                        </div>
                    );
                case 1: // 多选题
                    return (
                        <div className="space-y-3">
                            {parsedOptions.map((option: { label: string; value: string; text: string }) => {
                                // 将当前问题的答案转换为数组
                                const answerStr = answers[currentQuestion.id] as string || '';
                                const selectedValues = answerStr ? answerStr.split(',') : [];

                                return (
                                    <div
                                        key={option.value}
                                        onClick={() => {
                                            // 处理多选逻辑
                                            const newSelectedValues = [...selectedValues];
                                            if (newSelectedValues.includes(option.value)) {
                                                // 如果已选中，则移除
                                                const index = newSelectedValues.indexOf(option.value);
                                                newSelectedValues.splice(index, 1);
                                            } else {
                                                // 如果未选中，则添加
                                                newSelectedValues.push(option.value);
                                            }

                                            handleAnswer(currentQuestion.id, newSelectedValues);
                                        }}
                                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedValues.includes(option.value)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <div className={`w-5 h-5 border rounded mr-2 flex items-center justify-center ${selectedValues.includes(option.value) ? 'bg-primary border-primary' : 'border-gray-300'
                                                }`}>
                                                {selectedValues.includes(option.value) && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                )}
                                            </div>
                                            {option.label}. {option.text}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                case 2: // 判断题
                    return (
                        <div className="space-y-3">
                            <div
                                onClick={() => handleAnswer(currentQuestion.id, 'true')}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${answers[currentQuestion.id] === 'true'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                    }`}
                            >
                                正确
                            </div>
                            <div
                                onClick={() => handleAnswer(currentQuestion.id, 'false')}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${answers[currentQuestion.id] === 'false'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                    }`}
                            >
                                错误
                            </div>
                        </div>
                    );
                case 3: // 填空题
                    return (
                        <div className="space-y-3">
                            <textarea
                                value={answers[currentQuestion.id] as string || ''}
                                onChange={(e) => {
                                    // 对于填空题，只更新答案，不自动跳转
                                    setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }));
                                }}
                                className="w-full p-3 border rounded-lg min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="请输入您的答案..."
                            />
                        </div>
                    );
                default:
                    return <div>未知题型</div>;
            }
        };

        return (
            <div className="min-h-screen bg-muted p-6">
                <div className="max-w-3xl mx-auto">
                    <Button variant="outline" onClick={handleBackToList} className="mb-6">
                        退出评估
                    </Button>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>{selectedAssessment.title}</CardTitle>
                                <span className="text-sm text-muted-foreground">
                                    {currentQuestionIndex + 1} / {questions.length}
                                </span>
                            </div>
                            <div className="w-full bg-secondary h-2 rounded-full mt-2">
                                <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <h3 className="text-xl font-medium">{currentQuestion.questionName}</h3>
                            <div className="text-sm text-muted-foreground mb-4">
                                {currentQuestion.type === 0 && '单选题'}
                                {currentQuestion.type === 1 && '多选题 (可选择多个答案)'}
                                {currentQuestion.type === 2 && '判断题'}
                                {currentQuestion.type === 3 && '填空题'}
                            </div>

                            {renderQuestionOptions()}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button
                                variant="outline"
                                onClick={handlePrevQuestion}
                                disabled={currentQuestionIndex === 0}
                            >
                                上一题
                            </Button>

                            {currentQuestionIndex === questions.length - 1 ? (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || Object.keys(answers).length < questions.length}
                                >
                                    {isSubmitting ? '提交中...' : '提交评估'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => currentQuestionIndex < questions.length - 1 && setCurrentQuestionIndex(prev => prev + 1)}
                                    disabled={!answers[currentQuestion.id]}
                                >
                                    下一题
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    // 在评估列表渲染部分修改
    return (
        <div className="min-h-screen bg-muted p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">心理评估</h1>
                    <Button variant="outline" onClick={() => router.push('/student/dashboard')}>
                        返回仪表盘
                    </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {assessments && assessments.length > 0 ? (
                        <>
                            {assessments.map(assessment => (
                                <Card key={assessment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <CardTitle>{assessment.title}</CardTitle>
                                        <CardDescription>预计用时：{assessment.time} 分钟</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>创建时间: {assessment.createdAt}</span>
                                            <span>状态: {assessment.status === 1 ? '可用' : '不可用'}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            onClick={() => startAssessment(assessment)}
                                            className="w-full"
                                            disabled={assessment.status !== 1}
                                        >
                                            开始评估
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}

                            {/* 添加分页组件 */}
                            {paginatedData && paginatedData.totalPage > 1 && (
                                <div className="col-span-2 flex justify-center mt-6">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                // disabled={currentPage === 1}
                                                />
                                            </PaginationItem>

                                            {Array.from({ length: paginatedData.totalPage }, (_, i) => i + 1).map((page) => (
                                                <PaginationItem key={page}>
                                                    <PaginationLink
                                                        onClick={() => setCurrentPage(page)}
                                                        isActive={currentPage === page}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setCurrentPage(prev => Math.min(paginatedData.totalPage, prev + 1))}
                                                // disabled={currentPage === paginatedData.totalPage}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="col-span-2 text-center p-12">
                            <p className="text-lg text-muted-foreground">暂无可用的评估问卷</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
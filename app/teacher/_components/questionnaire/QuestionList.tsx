import { useState } from 'react';
import QuestionCard from './QuestionCard';
import QuestionForm from '../QuestionForm';
import { QuestionData } from '../question-form/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';

interface Question {
    id: number;
    paperName: string;
    questionName: string;
    options: string;
    score: number;
    answer: string;
    analysis: string;
    type: number;
    sequence: number;
}

interface QuestionListProps {
    questions: Question[];
    questionnaireId: number;
    questionnaireName: string;
    isEditable: boolean;
    onAddQuestion: (questionData: QuestionData) => Promise<void>;
    onDeleteQuestion: (questionId: number) => Promise<void>;
    onUpdateQuestion: (questionId: number, questionData: QuestionData) => Promise<void>;
    onMoveQuestion: (questionId: number, direction: 'up' | 'down') => void;
    // 添加mutateQuestions属性，用于直接更新SWR缓存
    mutateQuestions: (data?: Question[], shouldRevalidate?: boolean) => Promise<Question[] | undefined>;
}

export default function QuestionList({
    questions,
    questionnaireId,
    questionnaireName,
    isEditable,
    onAddQuestion,
    onDeleteQuestion,
    onUpdateQuestion,
    onMoveQuestion,
    mutateQuestions
}: QuestionListProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    // 处理编辑问题
    const handleEditQuestion = (question: Question) => {
        if (!isEditable) return;
        setEditingQuestion(question);
        setShowAddForm(false);
    };

    // 处理更新问题
    const handleUpdateQuestion = async (questionData: QuestionData) => {
        if (!editingQuestion) return;
        await onUpdateQuestion(editingQuestion.id, questionData);
        setEditingQuestion(null);
    };

    // 处理取消编辑
    const handleCancelEdit = () => {
        setEditingQuestion(null);
    };

    // 处理添加问题
    const handleAddQuestion = async (questionData: QuestionData) => {
        await onAddQuestion(questionData);
        setShowAddForm(false);
    };

    // 处理本地移动问题
    const handleMoveQuestion = (questionId: number, direction: 'up' | 'down') => {
        // 找到当前问题
        const currentQuestion = questions.find(q => q.id === questionId);
        if (!currentQuestion) return;

        // 根据方向找到目标问题
        let targetQuestion;
        if (direction === 'up') {
            targetQuestion = questions
                .filter(q => q.sequence > currentQuestion.sequence)
                .sort((a, b) => a.sequence - b.sequence)[0];
        } else {
            // 下移：找到sequence比当前问题小的问题中sequence最大的那个
            targetQuestion = questions
                .filter(q => q.sequence < currentQuestion.sequence)
                .sort((a, b) => b.sequence - a.sequence)[0];
        }
        // 如果没有找到目标问题（已经是最上或最下），则不执行操作
        if (!targetQuestion) return;

        // 创建新数组
        const newQuestions = [...questions];
        const currentIndex = newQuestions.findIndex(q => q.id === currentQuestion.id);
        const targetIndex = newQuestions.findIndex(q => q.id === targetQuestion.id);

        // 交换sequence值
        const tempSequence = currentQuestion.sequence;
        newQuestions[currentIndex] = { ...currentQuestion, sequence: targetQuestion.sequence };
        newQuestions[targetIndex] = { ...targetQuestion, sequence: tempSequence };

        // 按sequence排序后更新SWR缓存
        const sortedQuestions = [...newQuestions].sort((a, b) => b.sequence - a.sequence);

        // 直接使用父组件传入的mutateQuestions更新SWR缓存
        mutateQuestions(sortedQuestions, true);

        // 异步调用服务端更新，但不重新验证
        onMoveQuestion(questionId, direction);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>问题管理</CardTitle>
                    <CardDescription>添加和管理问卷中的问题</CardDescription>
                </div>
                {isEditable && !editingQuestion && (
                    <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
                        添加问题
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {/* 编辑问题表单 */}
                {editingQuestion && (
                    <QuestionForm
                        onSubmit={handleUpdateQuestion}
                        onCancel={handleCancelEdit}
                        initialData={{
                            paperId: questionnaireId,
                            paperName: questionnaireName,
                            questionName: editingQuestion.questionName,
                            options: editingQuestion.options,
                            score: editingQuestion.score,
                            answer: editingQuestion.answer,
                            analysis: editingQuestion.analysis,
                            type: editingQuestion.type,
                            sequence: editingQuestion.sequence
                        }}
                        paperId={questionnaireId}
                        paperName={questionnaireName}
                    />
                )}

                {/* 添加问题表单 */}
                {showAddForm && !editingQuestion && (
                    <QuestionForm
                        onSubmit={handleAddQuestion}
                        onCancel={() => setShowAddForm(false)}
                        paperId={questionnaireId}
                        paperName={questionnaireName}
                    />
                )}

                {/* 问题列表 */}
                {!showAddForm && !editingQuestion && (
                    questions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">暂无问题，点击"添加问题"开始创建</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((question, index) => (
                                <QuestionCard
                                    key={question.id}
                                    question={question}
                                    index={index}
                                    isEditable={isEditable}
                                    onEdit={handleEditQuestion}
                                    onDelete={onDeleteQuestion}
                                    onMoveUp={() => handleMoveQuestion(question.id, 'up')}
                                    onMoveDown={() => handleMoveQuestion(question.id, 'down')}
                                    isFirst={index === 0}
                                    isLast={index === questions.length - 1}
                                />
                            ))}
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    );
}
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
}

export default function QuestionList({
    questions,
    questionnaireId,
    questionnaireName,
    isEditable,
    onAddQuestion,
    onDeleteQuestion,
    onUpdateQuestion,
    onMoveQuestion
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
                                    onMoveUp={() => onMoveQuestion(question.id, 'up')}
                                    onMoveDown={() => onMoveQuestion(question.id, 'down')}
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
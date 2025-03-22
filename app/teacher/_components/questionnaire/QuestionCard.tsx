import { Card, CardContent } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Option } from '../question-form/types';

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

interface QuestionCardProps {
    question: Question;
    index: number;
    isEditable: boolean;
    onEdit: (question: Question) => void;
    onDelete: (questionId: number) => void;
    onMoveUp: (questionId: number) => void;
    onMoveDown: (questionId: number) => void;
    isFirst: boolean;
    isLast: boolean;
}

export default function QuestionCard({
    question,
    index,
    isEditable,
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast
}: QuestionCardProps) {
    // 问题类型映射
    const questionTypes = {
        0: '单选题',
        1: '多选题',
        2: '判断题',
        3: '填空题'
    } as const;

    return (
        <Card className="relative hover:shadow-md transition-shadow cursor-pointer" onClick={() => onEdit(question)}>
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-semibold">
                                第{index + 1}题 - {question.questionName}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {questionTypes[question.type as keyof typeof questionTypes]}
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                {question.score}分
                            </span>
                        </div>
                        {question.options && (
                            <div className="space-y-2 mt-4">
                                {JSON.parse(question.options).map((option: Option) => (
                                    <div key={option.label} className="flex items-center gap-2">
                                        <span className="font-medium">{option.label}.</span>
                                        <span>{option.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {question.analysis && (
                            <div className="mt-4 text-sm text-muted-foreground">
                                <p className="font-medium">答案解析：</p>
                                <p>{question.analysis}</p>
                            </div>
                        )}
                    </div>
                    {isEditable && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveUp(question.id);
                                }}
                                disabled={isFirst}
                            >
                                上移
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveDown(question.id);
                                }}
                                disabled={isLast}
                            >
                                下移
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(question.id);
                                }}
                            >
                                删除
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
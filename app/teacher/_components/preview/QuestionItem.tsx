import { Card, CardContent } from '@/app/_components/ui/card';
import { Question } from '@/app/teacher/_types/questionnaire';

interface QuestionItemProps {
    question: Question;
    index: number;
}

export function QuestionItem({ question, index }: QuestionItemProps) {
    const questionTypes = {
        0: '单选题',
        1: '多选题',
        2: '判断题',
        3: '填空题'
    } as const;

    return (
        <Card>
            <CardContent className="p-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">第{index + 1}题</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {questionTypes[question.type as keyof typeof questionTypes]}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {question.score}分
                        </span>
                    </div>
                    <div>
                        <h3 className="text-base font-medium mb-4">{question.questionName}</h3>
                        {question.options && (
                            <div className="space-y-2">
                                {JSON.parse(question.options).map((option: any) => (
                                    <div key={option.label} className="flex items-center gap-2">
                                        <input
                                            aria-label={`选项 ${option.label}`}
                                            type={question.type === 0 ? "radio" : "checkbox"}
                                            name={`question-${question.id}`}
                                            value={option.value}
                                            disabled
                                            className="h-4 w-4"
                                        />
                                        <label className="text-sm">
                                            {option.label}. {option.text}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                        {question.type === 2 && (
                            <div className="space-x-4">
                                <label className="inline-flex items-center">
                                    <input type="radio" name={`question-${question.id}`} value="1" disabled className="h-4 w-4" />
                                    <span className="ml-2">正确</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input type="radio" name={`question-${question.id}`} value="0" disabled className="h-4 w-4" />
                                    <span className="ml-2">错误</span>
                                </label>
                            </div>
                        )}
                        {question.type === 3 && (
                            <input
                                type="text"
                                placeholder="请输入答案"
                                disabled
                                className="w-full p-2 border rounded-md"
                            />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
import { Card, CardContent } from '@/app/_components/ui/card';
import { Question } from '@/app/teacher/_types/questionnaire';
import { QuestionItem } from './QuestionItem';

interface QuestionListProps {
    questions: Question[];
}

export function QuestionList({ questions }: QuestionListProps) {
    return (
        <div className="space-y-4">
            {questions.map((question, index) => (
                <QuestionItem
                    key={question.id}
                    question={question}
                    index={index}
                />
            ))}
        </div>
    );
}
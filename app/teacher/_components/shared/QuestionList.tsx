import { Question } from '@/app/teacher/_types/questionnaire';
import { QuestionDisplay } from './QuestionDisplay';

interface QuestionListProps {
  questions: Question[];
  showAnswers?: boolean;
}

export function QuestionList({ questions, showAnswers = false }: QuestionListProps) {
  // 按照sequence排序
  const sortedQuestions = [...questions].sort((a, b) => a.sequence - b.sequence);
  
  return (
    <div className="space-y-4">
      {sortedQuestions.map((question, index) => (
        <QuestionDisplay
          key={question.id}
          question={question}
          index={index}
          showAnswer={showAnswers}
        />
      ))}
    </div>
  );
}
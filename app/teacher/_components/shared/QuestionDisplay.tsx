import { Card, CardContent } from '@/app/_components/ui/card';
import { Question } from '@/app/teacher/_types/questionnaire';

interface QuestionDisplayProps {
  question: Question;
  index: number;
  showAnswer?: boolean;
}

export function QuestionDisplay({ question, index, showAnswer = false }: QuestionDisplayProps) {
  const questionTypes = {
    0: '单选题',
    1: '多选题',
    2: '判断题',
    3: '填空题'
  } as const;

  // 解析选项
  const parseOptions = (optionsStr: string) => {
    try {
      return JSON.parse(optionsStr);
    } catch (e) {
      console.error('解析选项错误:', e);
      return [];
    }
  };

  // 渲染答案
  const renderAnswer = () => {
    if (!showAnswer) return null;
    
    const options = parseOptions(question.options);
    
    if (question.type === 0) { // 单选题
      const answerValue = question.answer;
      const selectedOption = options.find((opt: any) => opt.value === answerValue);
      return (
        <div className="mt-4 pt-3 border-t">
          <p className="font-medium">正确答案: {selectedOption ? `${selectedOption.label}. ${selectedOption.text}` : answerValue}</p>
          {question.analysis && (
            <p className="mt-2 text-gray-600">
              <span className="font-medium">解析:</span> {question.analysis}
            </p>
          )}
        </div>
      );
    } else if (question.type === 1) { // 多选题
      const answerValues = question.answer.split(',');
      const selectedOptions = options.filter((opt: any) => answerValues.includes(opt.value));
      return (
        <div className="mt-4 pt-3 border-t">
          <p className="font-medium">正确答案: {selectedOptions.map((opt: any) => `${opt.label}. ${opt.text}`).join(', ') || question.answer}</p>
          {question.analysis && (
            <p className="mt-2 text-gray-600">
              <span className="font-medium">解析:</span> {question.analysis}
            </p>
          )}
        </div>
      );
    } else if (question.type === 2) { // 判断题
      return (
        <div className="mt-4 pt-3 border-t">
          <p className="font-medium">正确答案: {question.answer === '1' ? '正确' : '错误'}</p>
          {question.analysis && (
            <p className="mt-2 text-gray-600">
              <span className="font-medium">解析:</span> {question.analysis}
            </p>
          )}
        </div>
      );
    } else if (question.type === 3) { // 填空题
      return (
        <div className="mt-4 pt-3 border-t">
          <p className="font-medium">参考答案: {question.answer}</p>
          {question.analysis && (
            <p className="mt-2 text-gray-600">
              <span className="font-medium">解析:</span> {question.analysis}
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  const options = parseOptions(question.options);

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
            {question.type !== 3 && options.length > 0 && (
              <div className="space-y-2">
                {options.map((option: any) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <input
                      aria-label={`选项 ${option.label}`}
                      type={question.type === 0 ? "radio" : question.type === 1 ? "checkbox" : "radio"}
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
          {renderAnswer()}
        </div>
      </CardContent>
    </Card>
  );
}
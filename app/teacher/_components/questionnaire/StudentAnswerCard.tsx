'use client';

import { Card } from "@/app/_components/ui/card";
import { Question, Answer } from "../../_types/questionnaire";

interface StudentAnswerCardProps {
  question: Question;
  answer?: Answer;
}

export default function StudentAnswerCard({ question, answer }: StudentAnswerCardProps) {
  // 问题类型映射
  const questionTypes = {
    0: '单选题',
    1: '多选题',
    2: '判断题',
    3: '填空题'
  };

  // 解析选项
  const parseOptions = () => {
    try {
      return JSON.parse(question.options);
    } catch (e) {
      return [];
    }
  };

  // 渲染答案
  const renderAnswer = () => {
    if (!answer) {
      return <p className="text-gray-500 italic">未回答</p>;
    }

    const options = parseOptions();

    if (question.type === 0) { // 单选题
      const selectedOption = options.find((opt: any) => opt.value === answer.answer);
      return (
        <div>
          <p>选择: {selectedOption ? `${selectedOption.label}. ${selectedOption.text}` : answer.answer}</p>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium">正确答案:</span> {question.answer}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-medium">解析:</span> {question.analysis}
          </p>
        </div>
      );
    } else if (question.type === 1) { // 多选题
      const answerValues = answer.answer.split(',');
      const selectedOptions = options.filter((opt: any) => answerValues.includes(opt.value));
      return (
        <div>
          <p>选择: {selectedOptions.map((opt: any) => `${opt.label}. ${opt.text}`).join(', ') || answer.answer}</p>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium">正确答案:</span> {question.answer}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-medium">解析:</span> {question.analysis}
          </p>
        </div>
      );
    } else if (question.type === 2) { // 判断题
      return (
        <div>
          <p>选择: {answer.answer === '1' ? '正确' : '错误'}</p>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium">正确答案:</span> {question.answer === '1' ? '正确' : '错误'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-medium">解析:</span> {question.analysis}
          </p>
        </div>
      );
    } else if (question.type === 3) { // 填空题
      return (
        <div>
          <p className="p-2 bg-gray-50 rounded">{answer.answer}</p>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium">参考答案:</span> {question.answer}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-medium">解析:</span> {question.analysis}
          </p>
        </div>
      );
    }

    return <p>{answer.answer}</p>;
  };

  return (
    <Card className="p-4">
      <div className="mb-2">
        <h4 className="font-medium">{question.questionName}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
            {questionTypes[question.type as keyof typeof questionTypes] || '未知题型'}
          </span>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
            {question.score}分
          </span>
        </div>
      </div>
      <div className="mt-2">
        {renderAnswer()}
      </div>
    </Card>
  );
}
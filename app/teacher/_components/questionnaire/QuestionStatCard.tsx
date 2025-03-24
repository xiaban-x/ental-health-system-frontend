'use client';

import { Card } from "@/app/_components/ui/card";
import { QuestionStat } from "../../_types/questionnaire";

interface QuestionStatCardProps {
  questionStat: QuestionStat;
}

export default function QuestionStatCard({ questionStat }: QuestionStatCardProps) {
  const { questionType, stats, questionContent } = questionStat;
  
  // 问题类型映射
  const questionTypes = {
    0: '单选题',
    1: '多选题',
    2: '判断题',
    3: '填空题'
  };

  const renderStats = () => {
    // 单选题或多选题
    if (questionType === 0 || questionType === 1) {
      return (
        <div className="mt-2">
          {stats.options && Object.entries(stats.options).map(([option, count]: [string, any]) => (
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
    } 
    // 判断题
    else if (questionType === 2) {
      return (
        <div className="mt-2">
          {stats.options && Object.entries(stats.options).map(([option, count]: [string, any]) => (
            <div key={option} className="flex items-center space-x-2 mb-1">
              <span className="text-sm">{option === '1' ? '正确' : '错误'}:</span>
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
    }
    // 填空题
    else if (questionType === 3) {
      return (
        <div className="mt-2">
          <p className="text-sm">共 {stats.count || 0} 条文本回答</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="p-4">
      <div className="mb-2">
        <h4 className="font-medium">{questionContent}</h4>
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
          {questionTypes[questionType as keyof typeof questionTypes] || '未知题型'}
        </span>
      </div>
      {renderStats()}
    </Card>
  );
}
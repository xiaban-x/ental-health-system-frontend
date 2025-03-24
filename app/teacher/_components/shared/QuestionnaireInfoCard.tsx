import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Questionnaire } from '@/app/teacher/_types/questionnaire';

interface QuestionnaireInfoCardProps {
  questionnaire: Questionnaire;
}

export function QuestionnaireInfoCard({ questionnaire }: QuestionnaireInfoCardProps) {
  // 状态映射
  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return '草稿';
      case 1: return '已发布';
      case 2: return '已关闭';
      default: return '未知状态';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>问卷信息</CardTitle>
        <CardDescription>基本信息和状态</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">问卷标题</h3>
            <p>{questionnaire.title}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">问卷描述</h3>
            <p>{questionnaire.description}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">状态</h3>
            <p>{getStatusText(questionnaire.status)}</p>
          </div>
          {questionnaire.time && (
            <div>
              <h3 className="text-sm font-medium">答题时间</h3>
              <p>{questionnaire.time} 分钟</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
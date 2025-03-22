import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';

interface Questionnaire {
    id: number;
    title: string;
    description: string;
    time: number;
    status: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
}

interface QuestionnaireInfoCardProps {
    questionnaire: Questionnaire;
}

export default function QuestionnaireInfoCard({ questionnaire }: QuestionnaireInfoCardProps) {
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
                        <p>
                            {questionnaire.status === 0 && '草稿'}
                            {questionnaire.status === 1 && '已发布'}
                            {questionnaire.status === 2 && '已关闭'}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
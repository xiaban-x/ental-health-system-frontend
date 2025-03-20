import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Questionnaire } from '@/app/teacher/_types/questionnaire';

interface QuestionnaireHeaderProps {
    questionnaire: Questionnaire;
    onBack: () => void;
}

export function QuestionnaireHeader({ questionnaire, onBack }: QuestionnaireHeaderProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{questionnaire.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">{questionnaire.description}</p>
                </div>
                <Button variant="outline" onClick={onBack}>
                    返回编辑
                </Button>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground">
                    <p>答题时间：{questionnaire.time} 分钟</p>
                </div>
            </CardContent>
        </Card>
    );
}
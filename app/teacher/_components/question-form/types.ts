export interface QuestionData {
    paperId: number;
    paperName: string;
    questionName: string;
    options: string;
    score: number;
    answer: string;
    analysis: string;
    type: number;
    sequence: number;
}

export interface Option {
    label: string;
    value: string;
    text: string;
}

export interface QuestionFormProps {
    onSubmit: (data: QuestionData) => void;
    onCancel: () => void;
    initialData?: QuestionData;
    paperId: number;
    paperName: string;
}
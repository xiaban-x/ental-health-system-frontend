export interface Questionnaire {
    id: number;
    title: string;
    description: string;
    time: number;
    status: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
}

export interface Question {
    id: number;
    papername: string;
    questionname: string;
    options: string;
    score: number;
    answer: string;
    analysis: string;
    type: number;
    sequence: number;
}
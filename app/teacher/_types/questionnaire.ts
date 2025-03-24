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

// 添加或更新以下接口定义
export interface Question {
  id: number;
  paperId: number;
  paperName: string;
  questionName: string;
  options: string; // JSON字符串
  score: number;
  answer: string;
  analysis: string;
  type: number; // 0：单选题 1：多选题 2：判断题 3：填空题
  sequence: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface Answer {
  id: number;
  questionId: number;
  studentId: number;
  studentName: string;
  answer: string;
  createdAt: string;
}

export interface SubmissionSummary {
  totalSubmissions: number;
  completionRate: number;
  averageScore?: number;
  questionStats: QuestionStat[];
}

export interface QuestionStat {
  questionId: number;
  questionContent: string;
  questionType: number;
  stats: {
    total: number;
    options?: Record<string, number>;
    average?: number;
    distribution?: Record<string, number>;
    count?: number;
  };
}
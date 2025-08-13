export interface Question {
  id: string;
  text: string;
  answers: Answer[];
}

export interface Answer {
  id: string;
  text: string;
  personalityType: string;
  weight: number;
}

export interface PersonalityType {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  questions: Question[];
  personalityTypes: PersonalityType[];
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  totalTakes: number;
}

export interface QuizResponse {
  questionId: string;
  answerId: string;
}
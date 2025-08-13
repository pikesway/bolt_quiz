export interface Question {
  id: string;
  text: string;
  imageUrl?: string;
  answers: Answer[];
  orderIndex: number;
}

export interface Answer {
  id: string;
  text: string;
  personalityType: string;
  weight: number;
  orderIndex: number;
}

export interface PersonalityType {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  resultImageUrl?: string;
}

export interface Quiz {
  id: string;
  userId?: string;
  title: string;
  description: string;
  coverImageUrl?: string;
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

export interface DatabaseQuiz {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cover_image_url?: string;
  is_published: boolean;
  total_takes: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseQuestion {
  id: string;
  quiz_id: string;
  text: string;
  image_url?: string;
  order_index: number;
  created_at: string;
}

export interface DatabaseAnswer {
  id: string;
  question_id: string;
  text: string;
  personality_type_id: string;
  weight: number;
  order_index: number;
  created_at: string;
}

export interface DatabasePersonalityType {
  id: string;
  quiz_id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  result_image_url?: string;
  created_at: string;
}
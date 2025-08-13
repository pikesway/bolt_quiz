import { useState, useEffect } from 'react';
import { Quiz } from '../types/quiz';

// Mock data for demo purposes
const mockQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'What\'s Your Leadership Style?',
    description: 'Discover your unique approach to leading teams and making decisions.',
    questions: [
      {
        id: 'q1',
        text: 'When facing a difficult decision, you typically:',
        answers: [
          { id: 'a1', text: 'Analyze all data thoroughly before deciding', personalityType: 'analytical', weight: 1 },
          { id: 'a2', text: 'Trust your gut instinct', personalityType: 'intuitive', weight: 1 },
          { id: 'a3', text: 'Consult with your team first', personalityType: 'collaborative', weight: 1 },
          { id: 'a4', text: 'Make quick decisions and adapt as needed', personalityType: 'decisive', weight: 1 }
        ]
      },
      {
        id: 'q2',
        text: 'Your ideal work environment is:',
        answers: [
          { id: 'b1', text: 'Structured with clear processes', personalityType: 'analytical', weight: 1 },
          { id: 'b2', text: 'Creative and flexible', personalityType: 'intuitive', weight: 1 },
          { id: 'b3', text: 'Team-oriented and collaborative', personalityType: 'collaborative', weight: 1 },
          { id: 'b4', text: 'Fast-paced and dynamic', personalityType: 'decisive', weight: 1 }
        ]
      }
    ],
    personalityTypes: [
      {
        id: 'analytical',
        name: 'The Analytical Leader',
        description: 'You excel at making data-driven decisions and creating systematic approaches to challenges.',
        color: '#3B82F6',
        icon: 'BarChart3'
      },
      {
        id: 'intuitive',
        name: 'The Visionary Leader',
        description: 'You inspire others with your creative thinking and ability to see the big picture.',
        color: '#8B5CF6',
        icon: 'Lightbulb'
      },
      {
        id: 'collaborative',
        name: 'The Team Builder',
        description: 'You bring out the best in others through empathy and inclusive decision-making.',
        color: '#14B8A6',
        icon: 'Users'
      },
      {
        id: 'decisive',
        name: 'The Action-Oriented Leader',
        description: 'You thrive in dynamic environments and excel at making quick, effective decisions.',
        color: '#F59E0B',
        icon: 'Zap'
      }
    ],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    isPublished: true,
    totalTakes: 1248
  }
];

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setQuizzes(mockQuizzes);
      setLoading(false);
    }, 500);
  }, []);

  const createQuiz = (quiz: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'totalTakes'>) => {
    const newQuiz: Quiz = {
      ...quiz,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      totalTakes: 0
    };
    setQuizzes(prev => [...prev, newQuiz]);
    return newQuiz;
  };

  const updateQuiz = (id: string, updates: Partial<Quiz>) => {
    setQuizzes(prev => prev.map(quiz => 
      quiz.id === id 
        ? { ...quiz, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
        : quiz
    ));
  };

  const deleteQuiz = (id: string) => {
    setQuizzes(prev => prev.filter(quiz => quiz.id !== id));
  };

  return {
    quizzes,
    loading,
    createQuiz,
    updateQuiz,
    deleteQuiz
  };
}
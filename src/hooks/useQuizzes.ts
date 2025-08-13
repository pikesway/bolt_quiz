import { useState, useEffect } from 'react';
import { Quiz, DatabaseQuiz, DatabaseQuestion, DatabaseAnswer, DatabasePersonalityType } from '../types/quiz';
import { supabase, uploadImage } from '../lib/supabase';

// Transform database objects to frontend types
const transformQuizFromDB = (
  dbQuiz: DatabaseQuiz,
  questions: DatabaseQuestion[],
  answers: DatabaseAnswer[],
  personalityTypes: DatabasePersonalityType[]
): Quiz => {
  const transformedQuestions = questions
    .filter(q => q.quiz_id === dbQuiz.id)
    .sort((a, b) => a.order_index - b.order_index)
    .map(q => ({
      id: q.id,
      text: q.text,
      imageUrl: q.image_url,
      orderIndex: q.order_index,
      answers: answers
        .filter(a => a.question_id === q.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map(a => ({
          id: a.id,
          text: a.text,
          personalityType: a.personality_type_id,
          weight: a.weight,
          orderIndex: a.order_index
        }))
    }));

  const transformedTypes = personalityTypes
    .filter(pt => pt.quiz_id === dbQuiz.id)
    .map(pt => ({
      id: pt.id,
      name: pt.name,
      description: pt.description,
      color: pt.color,
      icon: pt.icon,
      resultImageUrl: pt.result_image_url
    }));

  return {
    id: dbQuiz.id,
    userId: dbQuiz.user_id,
    title: dbQuiz.title,
    description: dbQuiz.description,
    coverImageUrl: dbQuiz.cover_image_url,
    questions: transformedQuestions,
    personalityTypes: transformedTypes,
    createdAt: dbQuiz.created_at.split('T')[0],
    updatedAt: dbQuiz.updated_at.split('T')[0],
    isPublished: dbQuiz.is_published,
    totalTakes: dbQuiz.total_takes
  };
};

// Mock data for demo purposes
const mockQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'What\'s Your Leadership Style?',
    description: 'Discover your unique approach to leading teams and making decisions.',
    coverImageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
    questions: [
      {
        id: 'q1',
        text: 'When facing a difficult decision, you typically:',
        answers: [
          { id: 'a1', text: 'Analyze all data thoroughly before deciding', personalityType: 'analytical', weight: 1 },
          { id: 'a2', text: 'Trust your gut instinct', personalityType: 'intuitive', weight: 1 },
          { id: 'a3', text: 'Consult with your team first', personalityType: 'collaborative', weight: 1 },
          { id: 'a4', text: 'Make quick decisions and adapt as needed', personalityType: 'decisive', weight: 1 }
        ],
        orderIndex: 0,
        imageUrl: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800'
      },
      {
        id: 'q2',
        text: 'Your ideal work environment is:',
        answers: [
          { id: 'b1', text: 'Structured with clear processes', personalityType: 'analytical', weight: 1 },
          { id: 'b2', text: 'Creative and flexible', personalityType: 'intuitive', weight: 1 },
          { id: 'b3', text: 'Team-oriented and collaborative', personalityType: 'collaborative', weight: 1 },
          { id: 'b4', text: 'Fast-paced and dynamic', personalityType: 'decisive', weight: 1 }
        ],
        orderIndex: 1,
        imageUrl: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800'
      }
    ],
    personalityTypes: [
      {
        id: 'analytical',
        name: 'The Analytical Leader',
        description: 'You excel at making data-driven decisions and creating systematic approaches to challenges.',
        color: '#3B82F6',
        icon: 'BarChart3',
        resultImageUrl: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800'
      },
      {
        id: 'intuitive',
        name: 'The Visionary Leader',
        description: 'You inspire others with your creative thinking and ability to see the big picture.',
        color: '#8B5CF6',
        icon: 'Lightbulb',
        resultImageUrl: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800'
      },
      {
        id: 'collaborative',
        name: 'The Team Builder',
        description: 'You bring out the best in others through empathy and inclusive decision-making.',
        color: '#14B8A6',
        icon: 'Users',
        resultImageUrl: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800'
      },
      {
        id: 'decisive',
        name: 'The Action-Oriented Leader',
        description: 'You thrive in dynamic environments and excel at making quick, effective decisions.',
        color: '#F59E0B',
        icon: 'Zap',
        resultImageUrl: 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=800'
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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user and load quizzes
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          await loadQuizzes(user.id);
        } else {
          // Use mock data for demo
          setQuizzes(mockQuizzes);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setQuizzes(mockQuizzes);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadQuizzes = async (userId: string) => {
    try {
      // Load quizzes
      const { data: dbQuizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId);

      if (quizzesError) throw quizzesError;

      if (!dbQuizzes || dbQuizzes.length === 0) {
        setQuizzes([]);
        return;
      }

      const quizIds = dbQuizzes.map(q => q.id);

      // Load questions
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('quiz_id', quizIds);

      if (questionsError) throw questionsError;

      // Load answers
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .in('question_id', questions?.map(q => q.id) || []);

      if (answersError) throw answersError;

      // Load personality types
      const { data: personalityTypes, error: typesError } = await supabase
        .from('personality_types')
        .select('*')
        .in('quiz_id', quizIds);

      if (typesError) throw typesError;

      // Transform and set quizzes
      const transformedQuizzes = dbQuizzes.map(dbQuiz =>
        transformQuizFromDB(dbQuiz, questions || [], answers || [], personalityTypes || [])
      );

      setQuizzes(transformedQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      setQuizzes([]);
    }
  };

  const createQuiz = async (
    quiz: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'totalTakes'>,
    coverImageFile?: File
  ) => {
    if (!user) {
      // Fallback to mock behavior
      const newQuiz: Quiz = {
        ...quiz,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        totalTakes: 0
      };
      setQuizzes(prev => [...prev, newQuiz]);
      return newQuiz;
    }

    try {
      let coverImageUrl = quiz.coverImageUrl;

      // Upload cover image if provided
      if (coverImageFile) {
        const imagePath = `${user.id}/covers/${Date.now()}-${coverImageFile.name}`;
        coverImageUrl = await uploadImage(coverImageFile, 'quiz-images', imagePath);
      }

      // Create quiz
      const { data: dbQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          title: quiz.title,
          description: quiz.description,
          cover_image_url: coverImageUrl,
          is_published: quiz.isPublished
        })
        .select()
        .single();

      if (quizError) throw quizError;

    const newQuiz: Quiz = {
      ...quiz,
        id: dbQuiz.id,
        userId: user.id,
        coverImageUrl,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      totalTakes: 0
    };
    setQuizzes(prev => [...prev, newQuiz]);
    return newQuiz;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  };

  const updateQuiz = async (id: string, updates: Partial<Quiz>, coverImageFile?: File) => {
    if (!user) {
      // Fallback to mock behavior
      setQuizzes(prev => prev.map(quiz => 
        quiz.id === id 
          ? { ...quiz, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : quiz
      ));
      return;
    }

    try {
      let coverImageUrl = updates.coverImageUrl;

      // Upload new cover image if provided
      if (coverImageFile) {
        const imagePath = `${user.id}/covers/${Date.now()}-${coverImageFile.name}`;
        coverImageUrl = await uploadImage(coverImageFile, 'quiz-images', imagePath);
      }

      // Update quiz in database
      const { error } = await supabase
        .from('quizzes')
        .update({
          title: updates.title,
          description: updates.description,
          cover_image_url: coverImageUrl,
          is_published: updates.isPublished,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
    setQuizzes(prev => prev.map(quiz => 
      quiz.id === id 
          ? { ...quiz, ...updates, coverImageUrl, updatedAt: new Date().toISOString().split('T')[0] }
        : quiz
    ));
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  };

  const deleteQuiz = async (id: string) => {
    if (!user) {
      // Fallback to mock behavior
      setQuizzes(prev => prev.filter(quiz => quiz.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);

      if (error) throw error;

    setQuizzes(prev => prev.filter(quiz => quiz.id !== id));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  };

  return {
    quizzes,
    loading,
    createQuiz,
    updateQuiz,
    deleteQuiz
  };
}
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Quiz, DatabaseQuiz, DatabaseQuestion, DatabaseAnswer, DatabasePersonalityType } from '../types/quiz';

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

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
    totalTakes: dbQuiz.total_takes,
    slug: dbQuiz.slug
  };
};

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user and load quizzes
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Subscribe to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            console.log('Loading quizzes for user:', currentUser.id);
            await loadQuizzes(currentUser.id);
          } else {
            console.log('No user found');
            setQuizzes([]);
          }
        });

        // Get initial auth state
        const { data: { session } } = await supabase.auth.getSession();
        const initialUser = session?.user ?? null;
        setUser(initialUser);

        if (initialUser) {
          await loadQuizzes(initialUser.id);
        } else {
          setQuizzes([]);
        }

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error as Error);
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadQuizzes = async (userId: string) => {
    try {
      console.log('Fetching quizzes from database...');
      // Load quizzes
      const { data: dbQuizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId);

      if (quizzesError) {
        console.error('Error loading quizzes:', quizzesError);
        throw quizzesError;
      }

      console.log('Quizzes fetched:', dbQuizzes?.length || 0);

      if (!dbQuizzes || dbQuizzes.length === 0) {
        setQuizzes([]);
        return;
      }

      const quizIds = dbQuizzes.map(q => q.id);

      // Load questions
      console.log('Fetching questions...');
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('quiz_id', quizIds);

      if (questionsError) {
        console.error('Error loading questions:', questionsError);
        throw questionsError;
      }

      console.log('Questions fetched:', questions?.length || 0);

      // Load answers
      console.log('Fetching answers...');
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .in('question_id', questions?.map(q => q.id) || []);

      if (answersError) {
        console.error('Error loading answers:', answersError);
        throw answersError;
      }

      console.log('Answers fetched:', answers?.length || 0);

      // Load personality types
      console.log('Fetching personality types...');
      const { data: personalityTypes, error: typesError } = await supabase
        .from('personality_types')
        .select('*')
        .in('quiz_id', quizIds);

      if (typesError) {
        console.error('Error loading personality types:', typesError);
        throw typesError;
      }

      console.log('Personality types fetched:', personalityTypes?.length || 0);

      // Transform and set quizzes
      const transformedQuizzes = dbQuizzes.map(dbQuiz =>
        transformQuizFromDB(dbQuiz, questions || [], answers || [], personalityTypes || [])
      );

      console.log('Transformed quizzes:', transformedQuizzes.length);
      setQuizzes(transformedQuizzes);
    } catch (error) {
      console.error('Error in loadQuizzes:', error);
      setError(error as Error);
      setQuizzes([]);
    }
  };

  const createQuiz = async (quiz: Quiz, coverImageFile?: File) => {
    try {
      const timestamp = Date.now();
      const slug = `${slugify(quiz.title)}-${timestamp}`;

      let quizData;
      const { data: dbQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: quiz.title,
          description: quiz.description,
          user_id: user?.id,
          slug: slug,
          is_published: false,
          total_takes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (quizError) {
        console.error('Error creating quiz:', quizError);
        throw quizError;
      }

      quizData = dbQuiz;

      // Insert personality types
      const personalityTypesWithQuizId = quiz.personalityTypes.map(pt => ({
        quiz_id: quizData.id,
        name: pt.name,
        description: pt.description,
        color: pt.color,
        icon: pt.icon,
        result_image_url: pt.resultImageUrl,
        created_at: new Date().toISOString()
      }));

      const { data: dbPersonalityTypes, error: personalityTypesError } = await supabase
        .from('personality_types')
        .insert(personalityTypesWithQuizId)
        .select();

      if (personalityTypesError) throw personalityTypesError;
      if (!dbPersonalityTypes) throw new Error('Failed to create personality types');

      // Create a map of personality type names to their IDs
      // Remove unused personalityTypeMap since it's not being used anywhere
      dbPersonalityTypes.reduce((acc, pt) => {
        acc[pt.name] = pt.id;
        return acc;
      }, {} as Record<string, string>);

      // Insert questions
      const questionsWithQuizId = quiz.questions.map((q, index) => ({
        quiz_id: quizData.id,
        text: q.text,
        image_url: q.imageUrl,
        order_index: index,
        created_at: new Date().toISOString()
      }));

      const { data: dbQuestions, error: questionsError } = await supabase
        .from('questions')
        .insert(questionsWithQuizId)
        .select();

      if (questionsError) throw questionsError;
      if (!dbQuestions) throw new Error('Failed to create questions');

      // Find matching personality type for each answer
      const answers = quiz.questions.flatMap((q, qIndex) =>
        q.answers.map((a, aIndex) => {
          const matchingType = dbPersonalityTypes.find(pt => pt.name === a.personalityType);
          if (!matchingType) {
            throw new Error(`Personality type ${a.personalityType} not found`);
          }
          return {
            question_id: dbQuestions[qIndex].id,
            text: a.text,
            personality_type_id: matchingType.id,
            weight: a.weight,
            order_index: aIndex,
            created_at: new Date().toISOString()
          };
        })
      );

      const { error: answersError } = await supabase
        .from('answers')
        .insert(answers);

      if (answersError) throw answersError;

      // Upload cover image if provided
      if (coverImageFile) {
        const imagePath = `${user?.id}/covers/${Date.now()}-${coverImageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('quiz-images')
          .upload(imagePath, coverImageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('quiz-images')
          .getPublicUrl(imagePath);

        const { error: updateError } = await supabase
          .from('quizzes')
          .update({ cover_image_url: publicUrl })
          .eq('id', quizData.id);

        if (updateError) throw updateError;
        quizData.cover_image_url = publicUrl;
      }

      // Reload quizzes to update the list
      if (user) {
        await loadQuizzes(user.id);
      }

      return { quiz: quizData as DatabaseQuiz, error: null };
    } catch (error) {
      console.error('Error creating quiz:', error);
      return { quiz: null, error };
    }
  };

  return {
    quizzes,
    loading,
    error,
    loadQuizzes,
    createQuiz
  };
}
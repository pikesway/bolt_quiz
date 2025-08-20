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

  const deleteQuiz = async (quizId: string) => {
    try {
      setError(null);

      // Delete quiz and related data will be cascade deleted due to foreign key constraints
      const { error: deleteError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (deleteError) throw deleteError;

      // Update local state
      setQuizzes(prevQuizzes => prevQuizzes.filter(quiz => quiz.id !== quizId));

      return { error: null };
    } catch (error) {
      console.error('Error deleting quiz:', error);
      setError(error as Error);
      return { error };
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    // Get current user and load quizzes
    const loadData = async () => {
      try {
        if (!isSubscribed) return;
        setLoading(true);
        setError(null);
        
        // Get initial auth state first
        const { data: { session } } = await supabase.auth.getSession();
        const initialUser = session?.user ?? null;
        if (!isSubscribed) return;
        setUser(initialUser);

        if (initialUser) {
          await loadQuizzes(initialUser.id);
        } else {
          setQuizzes([]);
          setLoading(false);
        }
        
        // Subscribe to auth state changes after initial load
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!isSubscribed) return;
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            console.log('Loading quizzes for user:', currentUser.id);
            await loadQuizzes(currentUser.id);
          } else {
            console.log('No user found');
            setQuizzes([]);
            setLoading(false);
          }
        });

        return () => {
          subscription.unsubscribe();
          isSubscribed = false;
        };
      } catch (error) {
        if (!isSubscribed) return;
        console.error('Error loading data:', error);
        setError(error as Error);
        setQuizzes([]);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const loadQuizzes = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
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
        setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async (quiz: Quiz, coverImageFile?: File) => {
    try {
      console.log('Starting quiz creation...');
      setError(null);
      const timestamp = Date.now();
      const slug = quiz.slug || `${slugify(quiz.title)}-${timestamp}`;

      console.log('Creating quiz with slug:', slug);
      let quizData;
      const { data: dbQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: quiz.title,
          description: quiz.description,
          user_id: user?.id,
          slug: slug,
          is_published: quiz.isPublished || false,
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

      console.log('Quiz created successfully:', dbQuiz.id);
      quizData = dbQuiz;

      // Insert personality types
      console.log('Creating personality types...');
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

      console.log('Personality types created successfully');

      // Create a map of personality type names to their IDs
      const personalityTypeMap = dbPersonalityTypes.reduce((acc, pt) => {
        acc[pt.name] = pt.id;
        return acc;
      }, {} as Record<string, string>);

      // Insert questions
      console.log('Creating questions...');
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

      console.log('Questions created successfully');

      // Find matching personality type for each answer
      console.log('Creating answers...');
      const answers = quiz.questions.flatMap((q, qIndex) =>
        q.answers.map((a, aIndex) => {
          // Try to match by name first
          const typeId = personalityTypeMap[a.personalityType];
          if (!typeId) {
            console.error('Available personality types:', personalityTypeMap);
            console.error('Attempted to match:', a.personalityType);
            throw new Error(`Personality type ${a.personalityType} not found`);
          }
          return {
            question_id: dbQuestions[qIndex].id,
            text: a.text,
            personality_type_id: typeId,
            weight: a.weight || 1,
            order_index: aIndex,
            created_at: new Date().toISOString()
          };
        })
      );

      const { error: answersError } = await supabase
        .from('answers')
        .insert(answers);

      if (answersError) throw answersError;
      console.log('Answers created successfully');

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

      // Transform and return the newly created quiz without reloading all quizzes
      const newQuiz = transformQuizFromDB(
        quizData,
        dbQuestions || [],
        answers || [],
        dbPersonalityTypes || []
      );
      
      // Update the quizzes state directly
      setQuizzes(prevQuizzes => [...prevQuizzes, newQuiz]);

      return { error: null };
    } catch (error) {
      console.error('Error creating quiz:', error);
      setError(error as Error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateQuiz = async (quizId: string, quizData: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'totalTakes'>, coverImageFile?: File) => {
    try {
      console.log('Starting quiz update...');
      setLoading(true);
      setError(null);

      // Update quiz basic info
      console.log('Updating quiz basic info...');
      const { error: quizError } = await supabase
        .from('quizzes')
        .update({
          title: quizData.title,
          description: quizData.description,
          is_published: quizData.isPublished,
          updated_at: new Date().toISOString()
        })
        .eq('id', quizId);

      if (quizError) throw quizError;

      // Update personality types
      console.log('Updating personality types...');
      const { error: deleteTypesError } = await supabase
        .from('personality_types')
        .delete()
        .eq('quiz_id', quizId);

      if (deleteTypesError) throw deleteTypesError;

      const personalityTypesWithQuizId = quizData.personalityTypes.map(pt => ({
        quiz_id: quizId,
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
      if (!dbPersonalityTypes) throw new Error('Failed to update personality types');

      // Delete existing questions and answers
      console.log('Updating questions and answers...');
      const { error: deleteQuestionsError } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizId);

      if (deleteQuestionsError) throw deleteQuestionsError;

      // Insert updated questions
      const questionsWithQuizId = quizData.questions.map((q, index) => ({
        quiz_id: quizId,
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
      if (!dbQuestions) throw new Error('Failed to update questions');

      // Create a map of personality type names and IDs to their full objects
      console.log('Creating personality type maps...');
      const personalityTypeMap = dbPersonalityTypes.reduce((acc, pt) => {
        // Store by ID only to ensure consistent mapping
        acc[pt.id] = pt;
        return acc;
      }, {} as Record<string, typeof dbPersonalityTypes[0]>);
      
      // Create a separate map for looking up types by name during import
      const personalityTypeNameMap = dbPersonalityTypes.reduce((acc, pt) => {
        acc[pt.name] = pt;
        return acc;
      }, {} as Record<string, typeof dbPersonalityTypes[0]>);

      // Insert updated answers
      console.log('Inserting updated answers...');
      const answers = quizData.questions.flatMap((q, qIndex) =>
        q.answers.map((a, aIndex) => {
          // Try to match by ID first, then fall back to name matching for imported quizzes
          let matchingType = personalityTypeMap[a.personalityType];
          if (!matchingType) {
            matchingType = personalityTypeNameMap[a.personalityType];
            if (!matchingType) {
              console.error('No matching type found for:', a.personalityType);
              console.log('Available types by ID:', Object.keys(personalityTypeMap));
              console.log('Available types by name:', Object.keys(personalityTypeNameMap));
              throw new Error(`Personality type ${a.personalityType} not found`);
            }
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

      // Handle cover image update if provided
      if (coverImageFile) {
        console.log('Updating cover image...');
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
          .eq('id', quizId);

        if (updateError) throw updateError;
      }

      // Reload quizzes to update the list
      if (user) {
        console.log('Reloading quizzes...');
        await loadQuizzes(user.id);
      }

      console.log('Quiz update completed successfully');
      return { error: null };
    } catch (error) {
      console.error('Error updating quiz:', error);
      setError(error as Error);
      return { error: error instanceof Error ? error : new Error('Failed to update quiz') };
    } finally {
      setLoading(false);
    }
  };

  return {
    quizzes,
    loading,
    error,
    loadQuizzes,
    createQuiz,
    updateQuiz,
    deleteQuiz
  };
}
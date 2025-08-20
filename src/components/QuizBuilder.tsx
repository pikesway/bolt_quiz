import React, { useState, useRef, useEffect } from 'react';
import { Quiz, Question, Answer, PersonalityType } from '../types/quiz';
import { X, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { uploadImage } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface QuizBuilderProps {
  quiz?: Quiz;
  onSave: (quiz: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'totalTakes'>, coverImageFile?: File) => Promise<{ error?: Error; quizId?: string }>;
  onClose: () => void;
}

const SaveToast = ({ show, message, onClose }: { show: boolean; message: string; onClose: () => void }) => {
  if (!show) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-up z-50"
    >
      <Save className="w-5 h-5" />
      <span>{message}</span>
      <button 
        onClick={onClose}
        className="ml-4 hover:text-green-200"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export function QuizBuilder({ quiz, onSave, onClose }: QuizBuilderProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(quiz?.title || '');
  const [description, setDescription] = useState(quiz?.description || '');
  const [slug, setSlug] = useState(quiz?.slug || '');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>(quiz?.questions || []);
  const [personalityTypes, setPersonalityTypes] = useState<PersonalityType[]>(
    quiz?.personalityTypes || []
  );
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [quizId, setQuizId] = useState<string | null>(quiz?.id || null);
  const [saving, setSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(quiz?.isPublished || false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset toast state when component unmounts
  useEffect(() => {
    return () => setShowToast(false);
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    let toastTimer: NodeJS.Timeout;
    
    try {
      
      // Step 1: Save basic info
      if (currentStep === 1) {
        if (!title || !description || !slug) {
          alert('Please fill in all basic information fields');
          return;
        }
        
        const basicData = {
          title,
          description,
          coverImageUrl: quiz?.coverImageUrl,
          questions: [],
          personalityTypes: [],
          isPublished: false,
          slug,
          ...(quizId && { id: quizId })
        };
        
        const result = await onSave(basicData, coverImageFile || undefined);
        if (result.error) throw result.error;
        
        // Store the quiz ID for subsequent steps
        if (!quizId && result.quizId) {
          setQuizId(result.quizId);
        }
        
        setCurrentStep(2);
      }
      
      // Step 2: Save personality types
      else if (currentStep === 2) {
        if (personalityTypes.length === 0) {
          alert('Please add at least one personality type');
          return;
        }
        
        const typesData = {
          title,
          description,
          coverImageUrl: quiz?.coverImageUrl,
          questions: [],
          personalityTypes,
          isPublished: false,
          slug
        };
        
        const result = await onSave(typesData, undefined);
        if (result.error) throw result.error;
        
        setCurrentStep(3);
      }
      
      // Step 3: Save questions and answers
      else if (currentStep === 3) {
        if (questions.length === 0) {
          alert('Please add at least one question');
          return;
        }
        
        // Validate that all answers have a personality type selected
        const invalidQuestion = questions.find(q => 
          q.answers.some(a => !a.personalityType)
        );
        if (invalidQuestion) {
          alert('Please select a personality type for all answers');
          return;
        }

        const finalData = {
          title,
          description,
          coverImageUrl: quiz?.coverImageUrl,
          questions,
          personalityTypes,
          isPublished,
          slug
        };
        
        console.log('Saving final quiz data...');
        const result = await onSave(finalData, undefined);
        if (result.error) throw result.error;
        
        // Quiz is complete!
        console.log('Quiz creation completed successfully');
      }
      
      // Show success toast
      setToastMessage('Progress saved!');
      setShowToast(true);
      toastTimer = setTimeout(() => setShowToast(false), 3000);
      
    } catch (error) {
      console.error('Save error:', error);
      alert(`Failed to save quiz: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
    } finally {
      setSaving(false);
      if (toastTimer) clearTimeout(toastTimer);
    }
  };

  const addQuestion = () => {
    const generateQuestionId = (base: string) => {
      return base.toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    const questionId = generateQuestionId(`question-${questions.length + 1}`);
    const newQuestion: Question = {
      id: questionId,
      text: '',
      answers: [],
      orderIndex: questions.length
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addAnswer = (questionId: string) => {
    const generateAnswerId = (base: string) => {
      return base.toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    const question = questions.find(q => q.id === questionId);
    const answerIndex = question?.answers.length || 0;
    const answerId = generateAnswerId(`answer-${questionId}-${answerIndex}`);

    // Ensure we have a valid personality type for the new answer
    let defaultPersonalityType = '';
    if (personalityTypes.length > 0) {
      const firstType = personalityTypes[0];
      defaultPersonalityType = firstType.id;
      console.log('Setting default personality type:', {
        typeId: firstType.id,
        typeName: firstType.name
      });
    }

    const newAnswer: Answer = {
      id: answerId,
      text: '',
      personalityType: defaultPersonalityType,
      weight: 1,
      orderIndex: answerIndex
    };

    console.log('Creating new answer:', {
      answerId,
      questionId,
      personalityType: defaultPersonalityType
    });
    
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, answers: [...q.answers, newAnswer] }
        : q
    ));
  };

  const updateAnswer = (questionId: string, answerId: string, updates: Partial<Answer>) => {
    setQuestions(questions.map(q => 
      q.id === questionId
        ? {
            ...q,
            answers: q.answers.map(a => a.id === answerId ? { ...a, ...updates } : a)
          }
        : q
    ));
  };

  const removeAnswer = (questionId: string, answerId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId
        ? { ...q, answers: q.answers.filter(a => a.id !== answerId) }
        : q
    ));
  };

  const addPersonalityType = () => {
    const colors = ['#3B82F6', '#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444', '#10B981'];
    const icons = ['Star', 'Heart', 'Lightbulb', 'Shield', 'Zap', 'Crown'];
    
    const generateTypeId = (base: string) => {
      return base.toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    const typeId = generateTypeId(`type-${personalityTypes.length + 1}`);
    const newType: PersonalityType = {
      id: typeId,
      name: '',
      description: '',
      color: colors[personalityTypes.length % colors.length],
      icon: icons[personalityTypes.length % icons.length]
    };
    
    setPersonalityTypes([...personalityTypes, newType]);
  };

  const updatePersonalityType = (id: string, updates: Partial<PersonalityType>) => {
    setPersonalityTypes(personalityTypes.map(pt => 
      pt.id === id ? { ...pt, ...updates } : pt
    ));
  };

  const removePersonalityType = (id: string) => {
    setPersonalityTypes(personalityTypes.filter(pt => pt.id !== id));
  };

  const updateQuestionImage = async (questionId: string, file: File | null) => {
    if (!file || !user) return;

    try {
      const imagePath = `${user.id}/questions/${Date.now()}-${file.name}`;
      const imageUrl = await uploadImage(file, 'quiz-images', imagePath);
      
      setQuestions(questions.map(q => 
        q.id === questionId ? { ...q, imageUrl } : q
      ));
    } catch (error) {
      console.error('Error uploading question image:', error);
    }
  };

  const removeQuestionImage = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, imageUrl: undefined } : q
    ));
  };

  const updatePersonalityTypeImage = async (typeId: string, file: File | null) => {
    if (!file || !user) return;

    try {
      const imagePath = `${user.id}/results/${Date.now()}-${file.name}`;
      const imageUrl = await uploadImage(file, 'quiz-images', imagePath);
      
      setPersonalityTypes(personalityTypes.map(pt => 
        pt.id === typeId ? { ...pt, resultImageUrl: imageUrl } : pt
      ));
    } catch (error) {
      console.error('Error uploading result image:', error);
    }
  };

  const removePersonalityTypeImage = (typeId: string) => {
    setPersonalityTypes(personalityTypes.map(pt => 
      pt.id === typeId ? { ...pt, resultImageUrl: undefined } : pt
    ));
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedQuiz = JSON.parse(text);

      // Validate imported data structure
      if (!importedQuiz.title || !importedQuiz.description || 
          !Array.isArray(importedQuiz.questions) || !Array.isArray(importedQuiz.personalityTypes)) {
        throw new Error('Invalid quiz format');
      }

      // Generate IDs for imported data
      const personalityTypes = importedQuiz.personalityTypes.map((type: Omit<PersonalityType, 'id'>) => ({
        ...type,
        id: Math.random().toString(36).substr(2, 9)
      }));

      const questions = importedQuiz.questions.map((q: Omit<Question, 'id'>, index: number) => ({
        ...q,
        id: Math.random().toString(36).substr(2, 9),
        orderIndex: index,
        answers: q.answers.map((a: Omit<Answer, 'id'>, aIndex: number) => {
          // For imported quizzes, personality type should be mapped by name
          const matchingType = personalityTypes.find((pt: PersonalityType) => pt.name === a.personalityType);
          if (!matchingType) {
            console.error('Available personality types:', personalityTypes.map(pt => pt.name));
            throw new Error(`Personality type "${a.personalityType}" not found in the quiz data`);
          }
          return {
            ...a,
            id: Math.random().toString(36).substr(2, 9),
            orderIndex: aIndex,
            personalityType: matchingType.id // Use id for mapping
          };
        })
      }));

      // Update state
      setTitle(importedQuiz.title);
      setDescription(importedQuiz.description);
      setSlug(importedQuiz.slug || '');
      setPersonalityTypes(personalityTypes);
      setQuestions(questions);
      setCurrentStep(1);
    } catch (error) {
      alert('Error importing quiz: ' + (error instanceof Error ? error.message : 'Invalid file format'));
      console.error('Import error:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter quiz title"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                rows={3}
                placeholder="Enter quiz description"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter URL slug"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Cover Image</label>
              <ImageUpload
                imageUrl={quiz?.coverImageUrl}
                onImageSelected={setCoverImageFile}
              />
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            {personalityTypes.map((type) => (
              <div key={type.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex-1 space-y-4 mr-4">
                  <input
                    type="text"
                    value={type.name}
                    onChange={(e) => updatePersonalityType(type.id, { name: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    placeholder="Type name"
                  />
                  <textarea
                    value={type.description}
                    onChange={(e) => updatePersonalityType(type.id, { description: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    placeholder="Type description"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addPersonalityType}
              className="w-full py-4 border-2 border-dashed flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Personality Type
            </button>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Question text"
                />
                {question.answers.map((answer) => (
                  <div key={answer.id} className="flex items-center space-x-4 mt-4">
                    <input
                      type="text"
                      value={answer.text}
                      onChange={(e) => updateAnswer(question.id, answer.id, { text: e.target.value })}
                      className="flex-1 px-4 py-2 border rounded"
                      placeholder="Answer text"
                    />
                    <select
                      value={answer.personalityType}
                      onChange={(e) => updateAnswer(question.id, answer.id, { personalityType: e.target.value })}
                      className="px-4 py-2 border rounded"
                    >
                      <option value="">Select Type</option>
                      {personalityTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                      </select>
                      <button
                        onClick={() => removeAnswer(question.id, answer.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addAnswer(question.id)}
                    className="flex items-center text-purple-600 hover:text-purple-700 mt-4"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Answer
                  </button>
              </div>
            ))}
            <button
              onClick={addQuestion}
              className="w-full py-4 border-2 border-dashed flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Question
            </button>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="min-h-screen bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-8">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className={`h-2 flex-1 rounded ${currentStep >= 1 ? 'bg-purple-600' : 'bg-gray-200'}`} />
                <div className={`h-2 flex-1 rounded ${currentStep >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`} />
                <div className={`h-2 flex-1 rounded ${currentStep >= 3 ? 'bg-purple-600' : 'bg-gray-200'}`} />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Step {currentStep} of 3: {currentStep === 1 ? 'Basic Info' : currentStep === 2 ? 'Personality Types' : 'Questions'}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onClose}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <div className="flex items-center space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative w-10 h-6 transition-colors duration-200 ease-in-out rounded-full ${isPublished ? 'bg-purple-600' : 'bg-gray-200'}`}>
                  <div className={`absolute left-1 top-1 w-4 h-4 transition-transform duration-200 ease-in-out transform bg-white rounded-full ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {isPublished ? 'Published' : 'Draft'}
                </span>
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Import JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1 as 1 | 2 | 3)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Previous Step
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium flex items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : currentStep === 3 ? 'Save' : 'Save & Continue'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {renderStepContent()}
          </div>
        </div>
      </div>
      <SaveToast 
        show={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
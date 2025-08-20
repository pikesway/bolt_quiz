import React, { useState, useRef, useEffect } from 'react';
import { Quiz, Question, Answer, PersonalityType } from '../types/quiz';
import { X, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { uploadImage } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface QuizBuilderProps {
  quiz?: Quiz;
  onSave: (quiz: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'totalTakes'>, coverImageFile?: File) => Promise<{ error?: Error }>;
  onClose: () => void;
}

const SaveSuccessDialog = ({ show, onClose, onCloseEditor }: { show: boolean; onClose: () => void; onCloseEditor: () => void }) => {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4 shadow-xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Save className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">Quiz Saved Successfully!</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
          Your quiz has been saved. What would you like to do next?
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              console.log('Closing editor...');
              onClose();
              onCloseEditor();
            }}
            className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium"
          >
            Save & Close Editor
          </button>
          <button
            onClick={() => {
              console.log('Continuing to edit...');
              onClose();
            }}
            className="w-full px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
          >
            Save & Continue Editing
          </button>
        </div>
      </div>
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
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'questions' | 'types'>('basic');
  const [saving, setSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(quiz?.isPublished || false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (showSaveSuccess) {
        setShowSaveSuccess(false);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!title || !description || !slug || questions.length === 0 || personalityTypes.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      alert('Slug must contain only lowercase letters, numbers, and hyphens');
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

    setSaving(true);
    
    try {
      console.log('Saving quiz with data:', {
        title,
        description,
        questions: questions.length,
        personalityTypes: personalityTypes.length,
        isPublished,
        slug
      });

      const result = await onSave({
        title,
        description,
        coverImageUrl: quiz?.coverImageUrl,
        questions,
        personalityTypes,
        isPublished,
        slug
      }, coverImageFile || undefined);
      
      console.log('Save result:', result);
      if (!result.error) {
        console.log('Setting showSaveSuccess to true');
        setShowSaveSuccess(true);
      } else {
        console.error('Save error:', result.error);
        alert(`Failed to save quiz: ${result.error.message}`);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert(`Failed to save quiz: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
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
    const newAnswer: Answer = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      personalityType: '',
      weight: 1,
      orderIndex: questions.find(q => q.id === questionId)?.answers.length || 0
    };
    
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
    
    const newType: PersonalityType = {
      id: Math.random().toString(36).substr(2, 9),
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
      setActiveTab('basic');
    } catch (error) {
      alert('Error importing quiz: ' + (error instanceof Error ? error.message : 'Invalid file format'));
      console.error('Import error:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onClose}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium flex items-center ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'basic' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'questions' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Questions
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'types' ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Personality Types
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter quiz title"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter quiz description"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter URL slug"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cover Image
                </label>
                <ImageUpload
                    currentImage={quiz?.coverImageUrl}
                    onImageChange={setCoverImageFile}
                    onImageRemove={() => setCoverImageFile(null)}
                    label="Upload cover image"
                  />
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-8">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-4">
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder={`Question ${index + 1}`}
                      />
                    </div>
                    <button
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <ImageUpload
                      currentImage={question.imageUrl}
                      onImageChange={(file) => updateQuestionImage(question.id, file)}
                      onImageRemove={() => removeQuestionImage(question.id)}
                      label="Question image"
                    />
                  </div>

                  <div className="space-y-4">
                    {question.answers.map((answer, answerIndex) => (
                      <div key={answer.id} className="flex items-center space-x-4">
                        <input
                          type="text"
                          value={answer.text}
                          onChange={(e) => updateAnswer(question.id, answer.id, { text: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder={`Answer ${answerIndex + 1}`}
                        />
                        <select
                          value={answer.personalityType}
                          onChange={(e) => updateAnswer(question.id, answer.id, { personalityType: e.target.value })}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                      className="flex items-center text-purple-600 hover:text-purple-700"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Answer
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addQuestion}
                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:border-purple-600 dark:hover:text-purple-400 dark:hover:border-purple-400 flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Question
              </button>
            </div>
          )}

          {activeTab === 'types' && (
            <div className="space-y-6">
              {personalityTypes.map((type) => (
                <div key={type.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 space-y-4 mr-4">
                      <input
                        type="text"
                        value={type.name}
                        onChange={(e) => updatePersonalityType(type.id, { name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Type name"
                      />
                      <textarea
                        value={type.description}
                        onChange={(e) => updatePersonalityType(type.id, { description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Type description"
                      />
                    </div>
                    <button
                      onClick={() => removePersonalityType(type.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <ImageUpload
                      currentImage={type.resultImageUrl}
                      onImageChange={(file) => updatePersonalityTypeImage(type.id, file)}
                      onImageRemove={() => removePersonalityTypeImage(type.id)}
                      label="Result image"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <input
                      type="color"
                      value={type.color}
                      onChange={(e) => updatePersonalityType(type.id, { color: e.target.value })}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={addPersonalityType}
                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:border-purple-600 dark:hover:text-purple-400 dark:hover:border-purple-400 flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Personality Type
              </button>
            </div>
          )}
        </div>
      </div>

      <SaveSuccessDialog 
        show={showSaveSuccess}
        onClose={() => setShowSaveSuccess(false)}
        onCloseEditor={onClose}
      />
    </div>
  );
}
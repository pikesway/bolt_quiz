import React, { useState, useRef } from 'react';
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
      const result = await onSave({
        title,
        description,
        coverImageUrl: quiz?.coverImageUrl,
        questions,
        personalityTypes,
        isPublished,
        slug
      }, coverImageFile || undefined);
      
      if (!result.error) {
        setShowSaveSuccess(true);
      } else {
        alert('Failed to save quiz: ' + result.error.message);
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Failed to save quiz. Please try again.');
    } finally {
      setSaving(false);
    }
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
          const matchingType = personalityTypes.find((pt: PersonalityType) => pt.name === a.personalityType);
          if (!matchingType) {
            throw new Error(`Personality type ${a.personalityType} not found in the quiz data`);
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
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">{quiz ? 'Edit Quiz' : 'Create New Quiz'}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                  {isPublished ? 'Published' : 'Draft'}
                </span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Import JSON
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'basic', label: 'Basic Info' },
              { id: 'types', label: 'Personality Types' },
              { id: 'questions', label: 'Questions' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'basic' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <ImageUpload
              currentImage={quiz?.coverImageUrl}
              onImageChange={setCoverImageFile}
              onImageRemove={() => setCoverImageFile(null)}
              label="Cover Image"
              className="mb-6"
            />
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter quiz title..."
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz URL Slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">quizgamez.com/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your-quiz-name"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                This will be the URL of your quiz. Use only lowercase letters, numbers, and hyphens.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe what your quiz is about..."
              />
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium">Question {index + 1}</h3>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your question..."
                  />
                </div>
                
                <ImageUpload
                  currentImage={question.imageUrl}
                  onImageChange={(file) => updateQuestionImage(question.id, file)}
                  onImageRemove={() => removeQuestionImage(question.id)}
                  label="Question Image (Optional)"
                  className="mb-4"
                />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Answer Options</h4>
                    <button
                      onClick={() => addAnswer(question.id)}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      + Add Answer
                    </button>
                  </div>
                  
                  {question.answers.map((answer) => (
                    <div key={answer.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="text"
                        value={answer.text}
                        onChange={(e) => updateAnswer(question.id, answer.id, { text: e.target.value })}
                        className="flex-1 px-2 py-1 border-none focus:ring-0"
                        placeholder="Answer text..."
                      />
                      
                      <select
                        value={answer.personalityType}
                        onChange={(e) => updateAnswer(question.id, answer.id, { personalityType: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Select type...</option>
                        {personalityTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => removeAnswer(question.id, answer.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <button
              onClick={addQuestion}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors"
            >
              <Plus className="w-5 h-5 mx-auto mb-2" />
              Add New Question
            </button>
          </div>
        )}

        {activeTab === 'types' && (
          <div className="space-y-6">
            {personalityTypes.map((type) => (
              <div key={type.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: type.color + '20', color: type.color }}
                    >
                      ★
                    </div>
                    <h3 className="text-lg font-medium">Personality Type</h3>
                  </div>
                  <button
                    onClick={() => removePersonalityType(type.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type Name
                    </label>
                    <input
                      type="text"
                      value={type.name}
                      onChange={(e) => updatePersonalityType(type.id, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., The Creative Leader"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={type.description}
                      onChange={(e) => updatePersonalityType(type.id, { description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Describe this personality type..."
                    />
                  </div>
                  
                  <ImageUpload
                    currentImage={type.resultImageUrl}
                    onImageChange={(file) => updatePersonalityTypeImage(type.id, file)}
                    onImageRemove={() => removePersonalityTypeImage(type.id)}
                    label="Result Image (Optional)"
                    className="mb-4"
                  />
                  
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <input
                        type="color"
                        value={type.color}
                        onChange={(e) => updatePersonalityType(type.id, { color: e.target.value })}
                        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={addPersonalityType}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors"
            >
              <Plus className="w-5 h-5 mx-auto mb-2" />
              Add New Personality Type
            </button>
          </div>
        )}
      </div>

      {showSaveSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4 shadow-xl">
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
                  setShowSaveSuccess(false);
                  onClose();
                }}
                className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium"
              >
                Save & Close Editor
              </button>
              <button
                onClick={() => setShowSaveSuccess(false)}
                className="w-full px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
              >
                Save & Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
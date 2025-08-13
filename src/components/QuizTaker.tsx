import React, { useState } from 'react';
import { Quiz, QuizResponse, PersonalityType } from '../types/quiz';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface QuizTakerProps {
  quiz: Quiz;
  onComplete: (result: PersonalityType) => void;
  onBack: () => void;
}

export function QuizTaker({ quiz, onComplete, onBack }: QuizTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswer(answerId);
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    const newResponse: QuizResponse = {
      questionId: currentQuestion.id,
      answerId: selectedAnswer
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);
    setSelectedAnswer('');

    if (isLastQuestion) {
      // Calculate result
      const typeScores: Record<string, number> = {};
      
      quiz.personalityTypes.forEach(type => {
        typeScores[type.id] = 0;
      });

      updatedResponses.forEach(response => {
        const question = quiz.questions.find(q => q.id === response.questionId);
        const answer = question?.answers.find(a => a.id === response.answerId);
        if (answer) {
          typeScores[answer.personalityType] += answer.weight;
        }
      });

      // Find the personality type with the highest score
      const winningTypeId = Object.entries(typeScores)
        .sort(([, a], [, b]) => b - a)[0][0];
      
      const result = quiz.personalityTypes.find(type => type.id === winningTypeId);
      if (result) {
        onComplete(result);
      }
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setResponses(responses.slice(0, -1));
      
      // Set the previously selected answer
      const previousResponse = responses[currentQuestionIndex - 1];
      if (previousResponse) {
        setSelectedAnswer(previousResponse.answerId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
            
            {/* Progress Bar */}
            <div className="bg-white rounded-full h-2 mb-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </p>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.text}
            </h2>

            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === answer.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedAnswer === answer.id
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswer === answer.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                    <span className="text-gray-900">{answer.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                currentQuestionIndex === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!selectedAnswer}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                !selectedAnswer
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isLastQuestion ? 'Get Results' : 'Next'}
              {!isLastQuestion && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { PersonalityType, Quiz } from '../types/quiz';
import { Share2, Download, ArrowLeft, RotateCcw } from 'lucide-react';

interface QuizResultProps {
  quiz: Quiz;
  result: PersonalityType;
  onBack: () => void;
  onRetake: () => void;
}

export function QuizResult({ quiz, result, onBack, onRetake }: QuizResultProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `I got "${result.name}" in ${quiz.title}!`,
          text: result.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(
        `I got "${result.name}" in ${quiz.title}! ${result.description}`
      );
      alert('Result copied to clipboard!');
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
          </div>

          {/* Result Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Result Header */}
            {result.resultImageUrl ? (
              <div className="relative h-64">
                <img
                  src={result.resultImageUrl}
                  alt={result.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center text-3xl">
                      ★
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Congratulations!</h1>
                    <p className="text-lg opacity-90">You completed "{quiz.title}"</p>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="px-8 py-12 text-center text-white relative"
                style={{ 
                  background: `linear-gradient(135deg, ${result.color}, ${result.color}dd)` 
                }}
              >
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center text-3xl">
                    ★
                  </div>
                  <h1 className="text-3xl font-bold mb-2">Congratulations!</h1>
                  <p className="text-lg opacity-90">You completed "{quiz.title}"</p>
                </div>
              </div>
            )}

            {/* Result Content */}
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  You are: {result.name}
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {result.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Share Result
                </button>
                
                <button
                  onClick={onRetake}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Retake Quiz
                </button>
              </div>
            </div>
          </div>

          {/* Other Personality Types */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Other Personality Types in this Quiz
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quiz.personalityTypes
                .filter(type => type.id !== result.id)
                .map((type) => (
                <div 
                  key={type.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: type.color }}
                    >
                      ★
                    </div>
                    <h4 className="font-semibold text-gray-900">{type.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
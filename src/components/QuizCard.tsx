import React from 'react';
import { Quiz } from '../types/quiz';
import { Play, Edit, Eye, BarChart } from 'lucide-react';

interface QuizCardProps {
  quiz: Quiz;
  onEdit: (quiz: Quiz) => void;
  onTake: (quiz: Quiz) => void;
}

export function QuizCard({ quiz, onEdit, onTake }: QuizCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{quiz.title}</h3>
          <p className="text-gray-600 text-sm mb-4">{quiz.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {quiz.totalTakes.toLocaleString()} takes
            </div>
            <div className="flex items-center gap-1">
              <BarChart className="w-4 h-4" />
              {quiz.questions.length} questions
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            quiz.isPublished 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {quiz.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onTake(quiz)}
          className="flex-1 flex items-center justify-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <Play className="w-4 h-4" />
          Take Quiz
        </button>
        <button
          onClick={() => onEdit(quiz)}
          className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>
    </div>
  );
}
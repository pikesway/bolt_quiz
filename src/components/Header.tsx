import React from 'react';
import { Plus, User } from 'lucide-react';

interface HeaderProps {
  onCreateQuiz: () => void;
}

export function Header({ onCreateQuiz }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QuizCraft</h1>
          <p className="text-sm text-gray-500">Create engaging personality quizzes</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={onCreateQuiz}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Quiz
          </button>
          
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>
    </header>
  );
}
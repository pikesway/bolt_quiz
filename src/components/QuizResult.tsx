// React import can be removed since it's not directly used in this file
import { PersonalityType, Quiz } from '../types/quiz';
import { Share2, ArrowLeft } from 'lucide-react';

interface QuizResultProps {
  quiz: Quiz;
  result: PersonalityType;
  onBack: () => void;
  onRetake: () => void;
}

interface ShareData {
  title: string;
  text: string;
  url: string;
}

declare global {
  interface Navigator {
    share?: (data: ShareData) => Promise<void>;
  }
}

export function QuizResult({ quiz, result, onBack, onRetake }: QuizResultProps) {
  const getShareUrl = () => {
    // In a real app, this would be a proper shareable URL
    // For now, we'll use the current URL
    return window.location.href;
  };

  const getShareText = () => {
    return `I got "${result.name}" in ${quiz.title}! ${result.description}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `I got "${result.name}" in ${quiz.title}!`,
          text: result.description,
          url: getShareUrl(),
        });
      } catch (err) {
        console.log('Error sharing:', err);
        showSocialShareMenu();
      }
    } else {
      showSocialShareMenu();
    }
  };

  const showSocialShareMenu = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getShareUrl());

    // Create a temporary div for the share menu
    const menu = document.createElement('div');
    menu.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    menu.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Share your result</h3>
        <div class="space-y-3">
          <a href="https://twitter.com/intent/tweet?text=${text}&url=${url}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="flex items-center gap-3 p-3 bg-[#1DA1F2] text-white rounded-lg hover:bg-opacity-90 transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
            Share on Twitter
          </a>
          <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="flex items-center gap-3 p-3 bg-[#1877F2] text-white rounded-lg hover:bg-opacity-90 transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Share on Facebook
          </a>
          <a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="flex items-center gap-3 p-3 bg-[#0A66C2] text-white rounded-lg hover:bg-opacity-90 transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            Share on LinkedIn
          </a>
          <button onclick="navigator.clipboard.writeText('${getShareText()}'); this.textContent='Copied!'; setTimeout(() => this.closest('.fixed').remove(), 1000)" 
                  class="w-full flex items-center gap-3 p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
            Copy to Clipboard
          </button>
          <button onclick="this.closest('.fixed').remove()" 
                  class="w-full text-center text-gray-500 hover:text-gray-700 mt-2">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(menu);

    // Remove menu when clicking outside
    menu.addEventListener('click', (e: MouseEvent) => {
      if (e.target === menu) {
        menu.remove();
      }
    });
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
                  background: `linear-gradient(135deg, ${result.color || '#6366f1'}, ${result.color || '#6366f1'}dd)` 
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
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
                      style={{ backgroundColor: type.color || '#6366f1' }}
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
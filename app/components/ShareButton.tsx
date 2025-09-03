'use client';

import { useState } from 'react';

interface Idea {
  title: string;
  description: string;
  target: string;
  estimatedCost?: number;
  developmentTime?: number;
}

interface ShareButtonProps {
  idea: Idea;
}

export default function ShareButton({ idea }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `NALO에서 찾은 프로젝트 아이디어: ${idea.title}\n\n${idea.description}\n\n${idea.estimatedCost ? `예상 비용: ${idea.estimatedCost}만원\n` : ''}${idea.developmentTime ? `개발 기간: ${idea.developmentTime}주\n` : ''}\n#날로먹었어요 #프로젝트아이디어 #NALO`;
  
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleShareKakao = () => {
    if (typeof window !== 'undefined' && (window as any).Kakao) {
      (window as any).Kakao.Share.sendDefault({
        objectType: 'text',
        text: shareText,
        link: {
          webUrl: shareUrl,
          mobileWebUrl: shareUrl
        }
      });
    } else {
      // 카카오톡 없는 경우 링크 복사
      handleCopyLink();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors duration-200 text-sm font-medium"
        title="공유하기"
      >
        공유
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-slate-200 p-2 min-w-[160px] z-50">
          <button
            onClick={handleCopyLink}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
            {copied ? '복사됨!' : '링크 복사'}
          </button>
          
          <button
            onClick={handleShareTwitter}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            트위터
          </button>
          
          <button
            onClick={handleShareKakao}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            카카오톡
          </button>
          
          <div className="border-t border-slate-100 mt-2 pt-2">
            <p className="text-xs text-slate-500 px-3">
              #날로먹었어요 태그로 공유해보세요
            </p>
          </div>
        </div>
      )}

      {/* 외부 클릭시 닫기 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
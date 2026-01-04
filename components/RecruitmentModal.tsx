
import React from 'react';
import { HeroClass, HeroCategory } from '../types';

interface RecruitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecruit: (className: HeroClass) => void;
}

export const RecruitmentModal: React.FC<RecruitmentModalProps> = ({ isOpen, onClose, onRecruit }) => {
  if (!isOpen) return null;

  const categories = [
    {
      name: HeroCategory.WARRIOR,
      classes: [HeroClass.SWORDSMAN, HeroClass.AXEMAN, HeroClass.SPEARMAN],
      color: 'border-orange-500/30 bg-orange-500/5'
    },
    {
      name: HeroCategory.MAGE,
      classes: [HeroClass.FIRE_MAGE, HeroClass.WIND_MAGE, HeroClass.LIGHTNING_MAGE],
      color: 'border-blue-500/30 bg-blue-500/5'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">招募英雄</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {categories.map((cat) => (
            <div key={cat.name} className={`p-4 rounded-xl border ${cat.color}`}>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{cat.name}</h3>
              <div className="grid grid-cols-1 gap-2">
                {cat.classes.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => {
                      onRecruit(cls);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white transition-all hover:translate-x-1"
                  >
                    <span className="font-medium">{cls}</span>
                    <span className="text-xs text-blue-400 font-bold">招募 +</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

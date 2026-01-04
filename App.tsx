
import React, { useState, useCallback, useEffect } from 'react';
import { Hero, HeroClass, HeroCategory } from './types';
import { COMBAT_ATTRIBUTE_TABLE } from './constants';
import { HeroCard } from './components/HeroCard';
import { RecruitmentModal } from './components/RecruitmentModal';
import { BattlePage } from './components/BattlePage';

type Page = 'heroes' | 'battle';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('heroes');
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  
  // 从本地存储初始化关卡进度
  const [unlockedStage, setUnlockedStage] = useState<number>(() => {
    const saved = localStorage.getItem('hero_demo_unlocked_stage');
    return saved ? parseInt(saved, 10) : 1;
  });

  // 进度持久化
  useEffect(() => {
    localStorage.setItem('hero_demo_unlocked_stage', unlockedStage.toString());
  }, [unlockedStage]);

  const handleRecruit = useCallback((className: HeroClass) => {
    setHeroes(prev => {
      const classCount = prev.filter(h => h.className === className).length;
      const newHero: Hero = {
        id: crypto.randomUUID(),
        name: `${className}${classCount + 1}`,
        className,
        category: [HeroClass.SWORDSMAN, HeroClass.AXEMAN, HeroClass.SPEARMAN].includes(className) ? HeroCategory.WARRIOR : HeroCategory.MAGE,
        level: 1,
        baseStats: { ...COMBAT_ATTRIBUTE_TABLE[className][1] },
        skillUpgrades: {},
        availablePoints: 0
      };
      return [...prev, newHero];
    });
  }, []);

  const handleDeleteHero = useCallback((id: string) => {
    setHeroes(prev => prev.filter(hero => hero.id !== id));
  }, []);

  const handleLevelUp = useCallback((id: string) => {
    setHeroes(prev => prev.map(hero => {
      if (hero.id === id && hero.level < 8) {
        return {
          ...hero,
          level: hero.level + 1,
          baseStats: { ...COMBAT_ATTRIBUTE_TABLE[hero.className][hero.level + 1] },
          availablePoints: hero.availablePoints + 1
        };
      }
      return hero;
    }));
  }, []);

  const handleUpgradeSkill = useCallback((id: string, category: string) => {
    setHeroes(prev => prev.map(hero => {
      if (hero.id === id && hero.availablePoints > 0) {
        return {
          ...hero,
          availablePoints: hero.availablePoints - 1,
          skillUpgrades: {
            ...hero.skillUpgrades,
            [category]: (hero.skillUpgrades[category] || 0) + 1
          }
        };
      }
      return hero;
    }));
  }, []);

  const handleStageUnlock = useCallback((nextStage: number) => {
    setUnlockedStage(prev => Math.max(prev, nextStage));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">英雄中心</h1>
          {activePage === 'heroes' && (
            <div className="flex gap-4">
              <button 
                onClick={() => setIsDeleteMode(!isDeleteMode)} 
                className={`px-6 py-3 rounded-xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                  isDeleteMode 
                    ? 'bg-red-600 text-white shadow-red-900/40' 
                    : 'bg-slate-800 text-red-500 border border-red-900/30 hover:bg-slate-700 shadow-slate-900/40'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isDeleteMode ? '取消删除' : '删除英雄'}
              </button>
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-black text-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95"
              >
                新招募
              </button>
            </div>
          )}
        </div>
        <nav className="flex gap-4 border-b border-slate-900">
          <button 
            onClick={() => setActivePage('heroes')} 
            className={`pb-4 px-6 font-black text-xl transition-all ${activePage === 'heroes' ? 'text-blue-400 border-b-4 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            英雄管理
          </button>
          <button 
            onClick={() => setActivePage('battle')} 
            className={`pb-4 px-6 font-black text-xl transition-all ${activePage === 'battle' ? 'text-blue-400 border-b-4 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            模拟战斗
          </button>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto">
        {activePage === 'heroes' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {heroes.length > 0 ? (
              heroes.map(hero => (
                <HeroCard 
                  key={hero.id} 
                  hero={hero} 
                  onLevelUp={handleLevelUp} 
                  onUpgradeSkill={handleUpgradeSkill} 
                  isDeleteMode={isDeleteMode}
                  onDelete={handleDeleteHero}
                />
              ))
            ) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                <p className="text-slate-500 text-2xl font-bold">暂无英雄，请点击右上角招募</p>
              </div>
            )}
          </div>
        ) : (
          <BattlePage 
            heroes={heroes} 
            unlockedStage={unlockedStage} 
            onStageUnlock={handleStageUnlock} 
          />
        )}
      </main>
      <RecruitmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRecruit={handleRecruit} />
    </div>
  );
};

export default App;


import React, { useState, useEffect } from 'react';
import { Hero, Formation, BattleUnit, HeroClass, HeroCategory } from '../types';
import { STAGES_DATA, COMBAT_ATTRIBUTE_TABLE, SKILLS_CONFIG } from '../constants';
import { CombatSimulation } from './CombatSimulation';

interface BattlePageProps {
  heroes: Hero[];
  unlockedStage: number;
  onStageUnlock: (nextStage: number) => void;
}

export const BattlePage: React.FC<BattlePageProps> = ({ heroes, unlockedStage, onStageUnlock }) => {
  const [formation, setFormation] = useState<Formation>({
    front: [null, null],
    back: [null, null, null, null]
  });
  const [inCombat, setInCombat] = useState(false);
  const [battleResult, setBattleResult] = useState<'player' | 'enemy' | null>(null);
  const [selectedStageId, setSelectedStageId] = useState(unlockedStage);

  // 当英雄列表发生变化（如删除英雄）时，清理阵型中不存在的英雄
  useEffect(() => {
    const heroIds = new Set(heroes.map(h => h.id));
    const cleanedFront = formation.front.map(id => id && heroIds.has(id) ? id : null);
    const cleanedBack = formation.back.map(id => id && heroIds.has(id) ? id : null);
    
    // 只有在确实需要清理时才更新状态，避免无限循环
    if (JSON.stringify(cleanedFront) !== JSON.stringify(formation.front) || 
        JSON.stringify(cleanedBack) !== JSON.stringify(formation.back)) {
      setFormation({ front: cleanedFront, back: cleanedBack });
    }
  }, [heroes]);

  // 当外部进度更新或进入界面时，确保选择的关卡合法
  useEffect(() => {
    if (selectedStageId > unlockedStage) {
      setSelectedStageId(unlockedStage);
    }
  }, [unlockedStage]);

  const toggleHeroInFormation = (heroId: string) => {
    const isInFront = formation.front.indexOf(heroId);
    const isInBack = formation.back.indexOf(heroId);

    if (isInFront !== -1) {
      const newFront = [...formation.front];
      newFront[isInFront] = null;
      setFormation({ ...formation, front: newFront });
      return;
    }
    if (isInBack !== -1) {
      const newBack = [...formation.back];
      newBack[isInBack] = null;
      setFormation({ ...formation, back: newBack });
      return;
    }

    const emptyFront = formation.front.indexOf(null);
    if (emptyFront !== -1) {
      const newFront = [...formation.front];
      newFront[emptyFront] = heroId;
      setFormation({ ...formation, front: newFront });
      return;
    }
    const emptyBack = formation.back.indexOf(null);
    if (emptyBack !== -1) {
      const newBack = [...formation.back];
      newBack[emptyBack] = heroId;
      setFormation({ ...formation, back: newBack });
    }
  };

  const startBattle = () => {
    const activeHeroes = [...formation.front, ...formation.back]
      .filter((id): id is string => id !== null)
      .map(id => heroes.find(h => h.id === id)!);
    
    if (activeHeroes.length === 0) {
      alert("请至少上阵一名英雄！");
      return;
    }
    setBattleResult(null);
    setInCombat(true);
  };

  const getBattleUnits = (): { player: BattleUnit[], enemy: BattleUnit[] } => {
    const player: BattleUnit[] = [];
    formation.front.forEach((id, i) => {
      if (id) {
        const h = heroes.find(hero => hero.id === id)!;
        const config = SKILLS_CONFIG[h.className];
        player.push({ 
          ...h, 
          currentHp: h.baseStats.hp, 
          maxHp: h.baseStats.hp, 
          side: 'player', 
          position: i, 
          cooldowns: { [config.ultimate.name]: config.ultimate.initialCooldown }, 
          effects: [], 
          accumulatedDmgBonus: 0,
          damageFactor: 1.0
        });
      }
    });
    formation.back.forEach((id, i) => {
      if (id) {
        const h = heroes.find(hero => hero.id === id)!;
        const config = SKILLS_CONFIG[h.className];
        player.push({ 
          ...h, 
          currentHp: h.baseStats.hp, 
          maxHp: h.baseStats.hp, 
          side: 'player', 
          position: i + 2, 
          cooldowns: { [config.ultimate.name]: config.ultimate.initialCooldown }, 
          effects: [], 
          accumulatedDmgBonus: 0,
          damageFactor: 1.0
        });
      }
    });

    const stage = STAGES_DATA.find(s => s.id === selectedStageId)!;
    const enemy: BattleUnit[] = [];

    for (let i = 0; i < 2; i++) {
      const cls = stage.frontPool[Math.floor(Math.random() * stage.frontPool.length)];
      enemy.push(createEnemyUnit(cls, stage.enemyLevel, stage.weakeningFactor, i, `enemy-f-${i}`));
    }
    for (let i = 0; i < 4; i++) {
      const cls = stage.backPool[Math.floor(Math.random() * stage.backPool.length)];
      enemy.push(createEnemyUnit(cls, stage.enemyLevel, stage.weakeningFactor, i + 2, `enemy-b-${i}`));
    }

    return { player, enemy };
  };

  const createEnemyUnit = (className: HeroClass, level: number, factor: number, position: number, id: string): BattleUnit => {
    const baseStats = COMBAT_ATTRIBUTE_TABLE[className][level];
    const category = [HeroClass.SWORDSMAN, HeroClass.AXEMAN, HeroClass.SPEARMAN].includes(className) ? HeroCategory.WARRIOR : HeroCategory.MAGE;
    const config = SKILLS_CONFIG[className];
    
    const skillUpgrades: Record<string, number> = {};
    const upgradeKey = category === HeroCategory.WARRIOR ? 'power' : 'potency';
    skillUpgrades[upgradeKey] = level - 1; 

    return {
      id,
      name: `Lv.${level} 敌方${className}`,
      className,
      category,
      level,
      baseStats: { ...baseStats },
      skillUpgrades,
      availablePoints: 0,
      currentHp: baseStats.hp,
      maxHp: baseStats.hp,
      side: 'enemy',
      position,
      cooldowns: { [config.ultimate.name]: config.ultimate.initialCooldown },
      effects: [],
      accumulatedDmgBonus: 0,
      damageFactor: factor
    };
  };

  const handleBattleFinish = (winner: 'player' | 'enemy') => {
    setBattleResult(winner);
    if (winner === 'player' && selectedStageId === unlockedStage && unlockedStage < STAGES_DATA.length) {
      onStageUnlock(unlockedStage + 1);
    }
  };

  if (inCombat) {
    const { player, enemy } = getBattleUnits();
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">正在进行: 关卡 {selectedStageId}</h2>
            <p className="text-slate-500 text-base">击败所有敌人即可获胜</p>
          </div>
          {battleResult && (
            <div className="flex items-center gap-4 animate-in fade-in zoom-in duration-300">
              <span className={`text-2xl font-black uppercase tracking-tight ${battleResult === 'player' ? 'text-green-500' : 'text-red-500'}`}>
                {battleResult === 'player' ? '胜利！' : '战败...'}
              </span>
              <button 
                onClick={() => setInCombat(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold transition-colors text-base"
              >
                返回布阵
              </button>
            </div>
          )}
        </div>
        <CombatSimulation 
          playerUnits={player} 
          enemyUnits={enemy} 
          onFinish={handleBattleFinish} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* 关卡选择列表 */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-amber-500">关卡挑战</h2>
          <div className="space-y-4">
            {STAGES_DATA.map(s => {
              const isUnlocked = s.id <= unlockedStage;
              const isSelected = s.id === selectedStageId;
              return (
                <button
                  key={s.id}
                  disabled={!isUnlocked}
                  onClick={() => setSelectedStageId(s.id)}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                    isSelected ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-900/10' : 
                    isUnlocked ? 'border-slate-800 bg-slate-900/50 hover:border-slate-700' : 
                    'border-slate-900 bg-slate-950 opacity-40 grayscale cursor-not-allowed'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xl font-bold">关卡 {s.id}</span>
                    <span className="text-sm font-mono font-bold text-amber-400">Lv.{s.enemyLevel}</span>
                  </div>
                  <p className="text-xs text-slate-500 uppercase font-black tracking-widest">
                    {isUnlocked ? (isSelected ? '当前选择' : '可以挑战') : '尚未解锁'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 布阵区域 */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-blue-400">战略部署 (关卡 {selectedStageId})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-50" />
                <div className="relative z-10 space-y-10">
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-slate-500 uppercase font-black mb-4 tracking-widest">前排阵地</p>
                    <div className="grid grid-cols-2 gap-6 w-3/4">
                      {formation.front.map((id, i) => (
                        <FormationSlot key={i} hero={id ? heroes.find(h => h.id === id) : null} onClick={() => id && toggleHeroInFormation(id)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 uppercase font-black mb-4 tracking-widest text-center">后排防线</p>
                    <div className="grid grid-cols-4 gap-4">
                      {formation.back.map((id, i) => (
                        <FormationSlot key={i} hero={id ? heroes.find(h => h.id === id) : null} onClick={() => id && toggleHeroInFormation(id)} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={startBattle}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-2xl py-5 rounded-2xl shadow-xl shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                开始战斗 (关卡 {selectedStageId})
              </button>
            </div>

            <div className="space-y-5">
              <h3 className="text-xl font-bold text-slate-400">上阵英雄列表</h3>
              <div className="grid grid-cols-2 gap-4 max-h-[450px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {heroes.map(hero => {
                  const isInFormation = [...formation.front, ...formation.back].includes(hero.id);
                  return (
                    <button
                      key={hero.id}
                      onClick={() => toggleHeroInFormation(hero.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left group ${
                        isInFormation 
                          ? 'border-blue-500 bg-blue-500/15' 
                          : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="text-xs font-black text-slate-500 mb-1.5 flex justify-between uppercase">
                        <span>Lv.{hero.level}</span>
                        {isInFormation && <span className="text-blue-400 font-black">IN USE</span>}
                      </div>
                      <div className="text-base font-bold text-white group-hover:text-blue-400 transition-colors truncate">{hero.name}</div>
                      <div className="text-xs text-slate-400 mt-1.5 font-mono font-bold uppercase tracking-tight">{hero.className}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormationSlot: React.FC<{ hero: Hero | null | undefined; onClick: () => void }> = ({ hero, onClick }) => (
  <div 
    onClick={onClick}
    className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-300 ${
      hero 
        ? 'border-blue-500 bg-blue-500/20 shadow-inner scale-100 active:scale-95' 
        : 'border-slate-800 bg-slate-800/20 hover:bg-slate-800/40 hover:border-slate-700'
    }`}
  >
    {hero ? (
      <div className="text-center animate-in zoom-in-50 duration-200">
        <div className="text-xs font-black text-blue-400 uppercase tracking-tighter leading-none mb-1.5">{hero.className}</div>
        <div className="text-sm font-bold text-white truncate px-1.5">{hero.name}</div>
      </div>
    ) : (
      <span className="text-slate-700 text-3xl font-light hover:text-slate-500 transition-colors">+</span>
    )}
  </div>
);

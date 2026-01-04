
import React, { useState } from 'react';
import { Hero, HeroCategory, HeroClass, NormalSkillConfig, UltimateSkillConfig, PassiveSkillConfig } from '../types';
import { SKILLS_CONFIG, UPGRADE_METADATA } from '../constants';

interface HeroCardProps {
  hero: Hero;
  onLevelUp: (id: string) => void;
  onUpgradeSkill?: (id: string, category: string) => void;
  isDeleteMode?: boolean;
  onDelete?: (id: string) => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({ hero, onLevelUp, onUpgradeSkill, isDeleteMode, onDelete }) => {
  const [showUpgrades, setShowUpgrades] = useState(false);
  const isWarrior = hero.category === HeroCategory.WARRIOR;
  const config = SKILLS_CONFIG[hero.className];

  const getEffectiveNormal = () => {
    const upgrades = hero.skillUpgrades;
    const uv = config.normal.upgradeValues;
    let coef = config.normal.coefficient;
    let targets = 1;
    let ignoreDefVal = 0;
    let critBonus = 0;
    let backRowChance = config.normal.backRowChance || 0;
    
    const powerPoints = upgrades.power || upgrades.potency || 0;
    const multiplier = uv.power || uv.potency || 0;
    coef *= (1 + powerPoints * multiplier);

    const rangePoints = upgrades.range || upgrades.scale || 0;
    targets += rangePoints * (uv.range || uv.scale || 0);

    const precision = upgrades.precision || 0;
    const precisionVal = precision * (uv.precision || 0);
    if (hero.className === HeroClass.SWORDSMAN) {
      ignoreDefVal += precisionVal;
    } else if (hero.className === HeroClass.AXEMAN) {
      critBonus += precisionVal;
    } else if (hero.className === HeroClass.SPEARMAN) {
      backRowChance += precisionVal;
    }

    return { coef, targets, ignoreDefVal, critBonus, backRowChance };
  };

  const effNormal = getEffectiveNormal();

  const renderNormalDescription = () => {
    let desc = config.normal.descriptionTemplate;
    desc = desc.replace(/{coefficient}/g, Math.round(effNormal.coef * 100).toString());
    if (config.normal.ignoreDef !== undefined) desc = desc.replace(/{ignoreDef}/g, Math.round(config.normal.ignoreDef * 100).toString());
    if (config.normal.extraChance !== undefined) desc = desc.replace(/{extraChance}/g, Math.round(config.normal.extraChance * 100).toString());
    if (config.normal.backRowChance !== undefined) desc = desc.replace(/{backRowChance}/g, Math.round(effNormal.backRowChance * 100).toString());

    const uv = config.normal.upgradeValues;
    const addons: string[] = [];
    if (effNormal.targets > 1) addons.push(`目标+${(effNormal.targets - 1).toFixed(2)}`);
    if (hero.className === HeroClass.SWORDSMAN && effNormal.ignoreDefVal > 0) addons.push(`破防+${effNormal.ignoreDefVal}`);
    if (hero.className === HeroClass.AXEMAN && effNormal.critBonus > 0) addons.push(`常规暴击+${effNormal.critBonus}%`);
    
    const agility = hero.skillUpgrades.agility || 0;
    if (agility > 0) {
      const aVal = uv.agility || 0;
      if (hero.className === HeroClass.AXEMAN) addons.push(`${Math.round(agility * aVal)}%格挡`);
      else addons.push(`${Math.round(agility * aVal)}%反击`);
    }

    const duration = hero.skillUpgrades.duration || 0;
    if (duration > 0) {
      const dVal = uv.duration || 0;
      if (hero.className === HeroClass.FIRE_MAGE) addons.push(`灼烧+${Math.round(duration * dVal * effNormal.coef * 100)}%`);
      if (hero.className === HeroClass.WIND_MAGE) addons.push(`易伤+${Math.round(duration * dVal)}%`);
      if (hero.className === HeroClass.LIGHTNING_MAGE) addons.push(`电荷+${Math.round(duration * dVal * effNormal.coef * 100)}%`);
    }

    return addons.length > 0 ? `${desc} [${addons.join(', ')}]` : desc;
  };

  const renderUltimateDescription = (skill: UltimateSkillConfig, level: number) => {
    let desc = skill.descriptionTemplate;
    const coef = level >= 8 ? skill.upgradedCoef : skill.baseCoef;
    const special = level >= 8 ? (skill.upgradedSpecialValue ?? skill.specialValue) : skill.specialValue;
    desc = desc.replace(/{coefficient}/g, Math.round(coef * 100).toString());
    if (special !== undefined) {
      const isPercent = special <= 1.0 && special > 0;
      desc = desc.replace(/{special}/g, isPercent ? Math.round(special * 100).toString() : special.toString());
    }
    return `${desc} (冷却: ${skill.cooldown}回合)`;
  };

  const renderPassiveDescription = (skill: PassiveSkillConfig, level: number) => {
    let desc = skill.descriptionTemplate;
    const val1 = level >= 6 ? skill.upgradedVal1 : skill.val1;
    const val2 = level >= 6 ? (skill.upgradedVal2 ?? skill.val2) : skill.val2;
    desc = desc.replace(/{val1}/g, val1.toString());
    if (val2 !== undefined) desc = desc.replace(/{val2}/g, val2.toString());
    return desc;
  };
  
  const upgradeCategories = isWarrior ? ['power', 'precision', 'range', 'agility'] : ['potency', 'scale', 'duration'];

  return (
    <div 
      onClick={() => !isDeleteMode && setShowUpgrades(!showUpgrades)}
      className={`bg-slate-800 rounded-xl border p-6 shadow-lg transition-all duration-300 flex flex-col h-full relative group cursor-pointer ${
        isDeleteMode ? 'border-red-600 ring-4 ring-red-900/30' : showUpgrades ? 'border-blue-500 ring-2' : 'border-slate-700 hover:border-blue-500'
      }`}
    >
      {isDeleteMode && (
        <div onClick={(e) => { e.stopPropagation(); onDelete?.(hero.id); }} className="absolute inset-0 bg-red-600/10 z-30 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
          <div className="bg-red-600 text-white p-4 rounded-full shadow-2xl scale-110 active:scale-95 transition-transform">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
        </div>
      )}

      {hero.availablePoints > 0 && !showUpgrades && !isDeleteMode && (
        <div className="absolute top-3 right-3 bg-red-600 text-white text-sm font-black px-3 py-1 rounded-full animate-bounce z-20 shadow-lg ring-2 ring-red-400">SP+{hero.availablePoints}</div>
      )}

      <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h3 className="text-2xl font-bold text-white group-hover:text-blue-400">{hero.name}</h3>
          <span className={`text-sm font-bold px-3 py-1 rounded-full inline-block mt-1 ${isWarrior ? 'bg-orange-900 text-orange-200' : 'bg-blue-900 text-blue-200'}`}>{hero.className}</span>
        </div>
        <div className="text-right">
          <div className="text-blue-400 font-mono font-black text-2xl leading-none">Lv.{hero.level}</div>
          <button 
            onClick={(e) => { e.stopPropagation(); onLevelUp(hero.id); }} 
            disabled={hero.level >= 8 || isDeleteMode} 
            className="mt-2 text-sm px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white rounded-lg font-bold transition-all shadow-md active:scale-95"
          >{hero.level >= 8 ? 'MAX' : '升级'}</button>
        </div>
      </div>

      {!showUpgrades ? (
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-6 pb-6 border-b border-slate-700/50 shrink-0">
            <StatRow label="生命" value={hero.baseStats.hp} />
            <StatRow label="速度" value={hero.baseStats.speed} />
            <StatRow label="物攻" value={hero.baseStats.pAtk} />
            <StatRow label="物防" value={hero.baseStats.pDef} />
            <StatRow label="魔攻" value={hero.baseStats.mAtk} />
            <StatRow label="魔防" value={hero.baseStats.mDef} />
          </div>

          {/* 技能部分：去掉 mt-auto，让它在上方对齐 */}
          <div className="space-y-8 pt-2">
            <SkillBlock label="常规" name={config.normal.name} desc={renderNormalDescription()} color="text-slate-100" />
            <SkillBlock 
              label="被动" 
              name={config.passive.name} 
              desc={renderPassiveDescription(config.passive, hero.level)} 
              color="text-amber-400" 
              locked={hero.level < 3} 
              unlockInfo={hero.level < 3 ? "Lv.3 解锁" : (hero.level < 6 ? "Lv.6 强化" : "已强化")}
            />
            <SkillBlock 
              label="终极" 
              name={config.ultimate.name} 
              desc={renderUltimateDescription(config.ultimate, hero.level)} 
              color="text-blue-400" 
              locked={hero.level < 4} 
              unlockInfo={hero.level < 4 ? "Lv.4 解锁" : (hero.level < 8 ? "Lv.8 强化" : "已强化")}
            />
          </div>
          {/* 这里可以留下空白到底部 */}
          <div className="flex-1" />
        </div>
      ) : (
        <div onClick={(e) => e.stopPropagation()} className="flex-1 flex flex-col bg-slate-900 rounded-xl p-5 animate-in fade-in duration-200">
           <div className="flex justify-between items-center mb-5 border-b border-slate-700 pb-3 shrink-0">
              <span className="text-sm font-black text-slate-300">SP: <span className="text-blue-400 font-mono text-xl">{hero.availablePoints}</span></span>
              <button onClick={() => setShowUpgrades(false)} className="text-sm text-slate-400 hover:text-white uppercase font-black tracking-widest">完成</button>
           </div>
           <div className="space-y-6 flex-1 overflow-y-auto pr-2">
              {upgradeCategories.map(cat => (
                <div key={cat} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-white">{UPGRADE_METADATA[cat].name}</span>
                    <span className="text-xs text-slate-500 leading-tight mt-1">{UPGRADE_METADATA[cat].desc}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400 font-mono font-bold">{hero.skillUpgrades[cat] || 0}/{UPGRADE_METADATA[cat].max}</span>
                    <button 
                      onClick={() => onUpgradeSkill?.(hero.id, cat)}
                      disabled={hero.availablePoints <= 0 || (hero.skillUpgrades[cat] || 0) >= UPGRADE_METADATA[cat].max}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 w-8 h-8 flex items-center justify-center rounded-lg text-white font-black shadow-lg transition-all active:scale-90"
                    >+</button>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

const StatRow = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between border-b border-slate-700/40 pb-1">
    <span className="text-slate-500 font-medium">{label}</span>
    <span className="text-slate-100 font-mono font-bold">{value}</span>
  </div>
);

const SkillBlock = ({ label, name, desc, color, locked, unlockInfo }: any) => (
  <div className={`space-y-3 transition-opacity ${locked ? 'opacity-40' : ''}`}>
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700/50">{label}</span>
        {unlockInfo && (
          <span className={`text-[12px] font-black px-2 py-0.5 rounded border-b-2 shadow-sm ${
            locked 
              ? 'bg-red-600 text-white border-red-800' 
              : (unlockInfo.includes('强化') ? 'bg-amber-500 text-white border-amber-700' : 'bg-green-600 text-white border-green-800')
          }`}>
            {unlockInfo}
          </span>
        )}
      </div>
      <span className={`text-xl font-black tracking-tight ${color}`}>{name}</span>
    </div>
    <p className="text-[15px] text-slate-300 leading-relaxed font-semibold">{desc}</p>
  </div>
);

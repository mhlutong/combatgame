import React, { useState, useEffect, useRef } from 'react';
import { BattleUnit, BattleLog, HeroCategory, HeroClass, StatusEffect } from '../types';
import { SKILLS_CONFIG } from '../constants';

interface CombatSimulationProps {
  playerUnits: BattleUnit[];
  enemyUnits: BattleUnit[];
  onFinish: (winner: 'player' | 'enemy') => void;
}

// Interface for UnitStatusCard props to resolve the 'key' property error in React lists
interface UnitStatusCardProps {
  unit: BattleUnit;
  isActive: boolean;
  isCastingUlt?: boolean;
}

// Sub-component to display status of a single unit during combat
const UnitStatusCard: React.FC<UnitStatusCardProps> = ({ unit, isActive, isCastingUlt }) => {
  const hpPercent = (unit.currentHp / unit.maxHp) * 100;
  const config = SKILLS_CONFIG[unit.className];
  const ultCd = unit.cooldowns[config.ultimate.name] || 0;
  const ultReady = unit.level >= 4 && ultCd <= 0;

  return (
    <div className={`p-6 rounded-2xl border-2 transition-all duration-300 shadow-xl relative overflow-hidden ${
      isCastingUlt ? 'bg-slate-700 border-blue-400 ring-8 ring-blue-500/20 scale-105 z-20' : 
      isActive ? 'bg-slate-750 border-yellow-500/50 ring-4 ring-yellow-500/10 -translate-y-1' : 
      'bg-slate-800 border-slate-700/80'
    } ${unit.currentHp <= 0 ? 'grayscale opacity-40 scale-[0.98]' : ''}`}>
      
      {isCastingUlt && (
        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/15 to-transparent animate-pulse" />
      )}

      <div className="text-lg font-black text-white truncate mb-4 flex justify-between items-center relative z-10">
        <span className="tracking-tighter">{unit.name}</span>
        {unit.currentHp <= 0 && <span className="text-red-600 text-xs font-black tracking-widest bg-red-950/50 px-2 py-1 rounded-md">KIA</span>}
      </div>

      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden mb-4 border border-slate-700 relative z-10 shadow-inner">
        <div 
          className={`h-full transition-all duration-500 shadow-sm ${hpPercent > 50 ? 'bg-gradient-to-r from-green-600 to-green-400' : hpPercent > 20 ? 'bg-gradient-to-r from-orange-600 to-orange-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`} 
          style={{ width: `${Math.max(0, hpPercent)}%` }} 
        />
      </div>

      <div className="flex justify-between items-center text-sm text-slate-400 font-black relative z-10">
         <span className="bg-slate-900 px-3 py-1 rounded-xl text-blue-400 font-mono ring-1 ring-blue-500/20">Lv.{unit.level}</span>
         <span className="text-white font-mono text-lg">{Math.ceil(unit.currentHp)}<span className="opacity-30 ml-1 text-sm">/ {unit.maxHp}</span></span>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-700/50 flex justify-between items-center relative z-10">
        <span className="text-xs text-slate-500 font-black uppercase tracking-[0.2em]">ULT CD</span>
        <span className={`text-sm font-black px-3 py-1 rounded-lg shadow-sm transition-all ${
          ultReady ? 'bg-blue-600 text-white animate-pulse ring-2 ring-blue-400/50 shadow-blue-900/50' : 'bg-slate-900 text-slate-500'
        }`}>
          {ultReady ? 'READY' : `${Math.max(0, ultCd)} T`}
        </span>
      </div>
    </div>
  );
};

export const CombatSimulation: React.FC<CombatSimulationProps> = ({ playerUnits, enemyUnits, onFinish }) => {
  const [units, setUnits] = useState<BattleUnit[]>([...playerUnits, ...enemyUnits]);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const [turn, setTurn] = useState(1);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [isAuto, setIsAuto] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [actionIndex, setActionIndex] = useState(0);
  const [turnOrder, setTurnOrder] = useState<BattleUnit[]>([]);
  const [battleResult, setBattleResult] = useState<'player' | 'enemy' | null>(null);
  const [ultCasting, setUltCasting] = useState<{ name: string; skill: string } | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  
  const isSimulating = useRef(false);
  const unitsRef = useRef(units);

  useEffect(() => {
    unitsRef.current = units;
  }, [units]);

  const getDelay = (base: number) => base / speed;

  useEffect(() => {
    if (turnOrder.length === 0 || actionIndex >= turnOrder.length) {
      const order = [...units]
        .filter(u => u.currentHp > 0)
        .sort((a, b) => b.baseStats.speed - a.baseStats.speed);
      setTurnOrder(order);
      setActionIndex(0);
      if (order.length > 0) processTurnStartEffects();
    }
  }, [turn]);

  useEffect(() => {
    let timer: number;
    if (isAuto && !isSimulating.current && !battleResult) {
      timer = window.setTimeout(() => {
        executeNextAction();
      }, getDelay(800));
    }
    return () => clearTimeout(timer);
  }, [isAuto, actionIndex, turn, battleResult, speed]);

  const processTurnStartEffects = () => {
    setUnits(prev => {
      let turnState = prev.map(u => ({ ...u, effects: [...u.effects] }));
      const aliveUnits = turnState.filter(u => u.currentHp > 0);
      let newLogs: BattleLog[] = [];

      for (let u of aliveUnits) {
        const dotEffects = u.effects.filter(e => ['dot', 'burn', 'charge'].includes(e.type));
        for (let effect of dotEffects) {
          const applier = turnState.find(a => a.id === effect.applierId);
          if (applier) {
             const { damage } = calculateDamage(applier, u, effect.value, { skillType: 'dot' });
             u.currentHp = Math.max(0, u.currentHp - damage);
             newLogs.push({
               turn, attackerName: 'DOT结算', skillName: effect.type === 'burn' ? '灼烧' : effect.type === 'charge' ? '电荷' : '感电', targetName: u.name, damage, isCrit: false, targetHpLeft: u.currentHp, isDot: true
             });
          }
        }

        if (u.className === HeroClass.LIGHTNING_MAGE && u.level >= 3) {
          const passConfig = SKILLS_CONFIG[HeroClass.LIGHTNING_MAGE].passive;
          const growth = u.level >= 6 ? passConfig.upgradedVal1 : passConfig.val1;
          u.accumulatedDmgBonus += growth;
        }
        u.effects = u.effects.map(e => ({ ...e, duration: e.duration - 1 })).filter(e => e.duration > 0);
      }
      
      if (newLogs.length > 0) setLogs(pl => [...newLogs.reverse(), ...pl].slice(0, 50));
      return turnState;
    });
  };

  const calculateDamage = (attacker: BattleUnit, defender: BattleUnit, coefficient: number, options: { ignoreDefVal?: number, ignoreDefRatio?: number, isNormalSkill?: boolean, skillType?: 'normal' | 'ultimate' | 'dot' } = {}) => {
    const isWarrior = attacker.category === HeroCategory.WARRIOR;
    let atk = isWarrior ? attacker.baseStats.pAtk : attacker.baseStats.mAtk;

    if (attacker.className === HeroClass.SWORDSMAN && attacker.level >= 3) {
      const bonus = attacker.level >= 6 ? SKILLS_CONFIG[HeroClass.SWORDSMAN].passive.upgradedVal1 : SKILLS_CONFIG[HeroClass.SWORDSMAN].passive.val1;
      atk *= (1 + bonus / 100);
    }
    atk *= (1 + (attacker.accumulatedDmgBonus || 0) / 100);

    let def = isWarrior ? defender.baseStats.pDef : defender.baseStats.mDef;
    const defDown = defender.effects.find(e => e.type === 'def_down');
    if (defDown) def *= (1 - defDown.value / 100);
    
    if (options.ignoreDefVal) def -= options.ignoreDefVal;
    if (options.ignoreDefRatio) def *= (1 - options.ignoreDefRatio);
    
    if (def < -30) def = -30;
    let defMod = 100 / (100 + Math.max(-99, def));

    let critRate = attacker.baseStats.critRate;
    const config = SKILLS_CONFIG[attacker.className];
    if (options.isNormalSkill && attacker.className === HeroClass.AXEMAN) {
      critRate += (attacker.skillUpgrades.precision || 0) * (config.normal.upgradeValues.precision || 0);
    }
    if (attacker.className === HeroClass.FIRE_MAGE && attacker.level >= 3) {
      critRate += (attacker.level >= 6 ? SKILLS_CONFIG[HeroClass.FIRE_MAGE].passive.upgradedVal1 : SKILLS_CONFIG[HeroClass.FIRE_MAGE].passive.val1);
    }

    const isCrit = Math.random() * 100 < critRate;
    const critMod = isCrit ? attacker.baseStats.critDamage / 100 : 1;

    let vulnMod = 1;
    const vuln = defender.effects.find(e => e.type === 'vulnerability');
    if (vuln) vulnMod = (1 + vuln.value / 100);

    let damage = Math.round(atk * defMod * coefficient * critMod * vulnMod * (attacker.damageFactor || 1.0));

    let isBlock = false;
    if (defender.className === HeroClass.AXEMAN) {
      const blockChance = (defender.skillUpgrades.agility || 0) * (SKILLS_CONFIG[HeroClass.AXEMAN].normal.upgradeValues.agility || 0);
      if (Math.random() * 100 < blockChance) {
        damage = Math.round(damage * 0.5);
        isBlock = true;
      }
    }

    return { damage: Math.max(1, damage), isCrit, isBlock };
  };

  const resolveActionInternal = (currentUnits: BattleUnit[], attackerId: string, isNormal: boolean, isCounter: boolean) => {
    let unitsState = currentUnits.map(u => ({ ...u, effects: [...u.effects], cooldowns: { ...u.cooldowns } }));
    let newLogs: BattleLog[] = [];
    
    const attacker = unitsState.find(u => u.id === attackerId);
    if (!attacker || attacker.currentHp <= 0) return { unitsState, newLogs };

    const config = SKILLS_CONFIG[attacker.className];
    const uv = config.normal.upgradeValues;
    let baseCoef = isNormal ? config.normal.coefficient : (attacker.level >= 8 ? config.ultimate.upgradedCoef : config.ultimate.baseCoef);
    let targetCount = isNormal ? 1 : 1;
    let ignoreDefVal = 0;
    let ignoreDefRatio = (isNormal && config.normal.ignoreDef) ? config.normal.ignoreDef : 0;
    let backRowChance = isNormal ? (config.normal.backRowChance || 0) : 0;

    if (isNormal) {
      const powerPoints = attacker.skillUpgrades.power || attacker.skillUpgrades.potency || 0;
      const multiplier = uv.power || uv.potency || 0;
      baseCoef *= (1 + powerPoints * multiplier);
      const range = attacker.skillUpgrades.range || attacker.skillUpgrades.scale || 0;
      targetCount += range * (uv.range || uv.scale || 0);
      
      if (attacker.className === HeroClass.WIND_MAGE && attacker.level >= 3) {
        const pConfig = SKILLS_CONFIG[HeroClass.WIND_MAGE].passive;
        targetCount += (attacker.level >= 6 ? pConfig.upgradedVal1 : pConfig.val1);
      }

      const precisionPoints = (attacker.skillUpgrades.precision || 0);
      if (attacker.className === HeroClass.SWORDSMAN) ignoreDefVal = precisionPoints * (uv.precision || 0);
      if (attacker.className === HeroClass.SPEARMAN) backRowChance += precisionPoints * (uv.precision || 0);
    } else if (attacker.className === HeroClass.AXEMAN) {
      targetCount = 2;
    }

    const enemies = getAliveTargets(attacker.side, unitsState);
    if (enemies.length === 0) return { unitsState, newLogs };

    let targets: BattleUnit[] = [];
    if (!isNormal && attacker.className === HeroClass.WIND_MAGE) {
      targets = enemies;
    } else if (!isNormal && attacker.className === HeroClass.SPEARMAN) {
      const fronts = enemies.filter(e => e.position < 2);
      const backs = enemies.filter(e => e.position >= 2);
      if (fronts.length > 0) targets.push(fronts[Math.floor(Math.random() * fronts.length)]);
      if (backs.length > 0) targets.push(backs[Math.floor(Math.random() * backs.length)]);
    } else {
      const actualCount = Math.floor(targetCount) + (Math.random() < (targetCount % 1) ? 1 : 0);
      for(let i=0; i<actualCount; i++) {
        const potential = enemies.filter(e => !targets.includes(e));
        if (potential.length === 0) break;
        if (isNormal && attacker.className === HeroClass.SPEARMAN && Math.random() < backRowChance) {
          const backs = potential.filter(e => e.position >= 2);
          targets.push(backs.length > 0 ? backs[Math.floor(Math.random()*backs.length)] : potential[0]);
        } else {
          const front = potential.filter(e => e.position < 2);
          targets.push(front.length > 0 ? front[Math.floor(Math.random()*front.length)] : potential[0]);
        }
      }
    }

    for (let t of targets) {
      const realTarget = unitsState.find(u => u.id === t.id);
      if (!realTarget || realTarget.currentHp <= 0) continue;

      const { damage, isCrit, isBlock } = calculateDamage(attacker, realTarget, baseCoef, { 
        ignoreDefVal, ignoreDefRatio, isNormalSkill: isNormal 
      });
      realTarget.currentHp = Math.max(0, realTarget.currentHp - damage);

      if (!isNormal && attacker.className === HeroClass.SWORDSMAN) {
        attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + Math.round(damage * (config.ultimate.specialValue || 0)));
      }
      if (!isNormal && attacker.className === HeroClass.AXEMAN) {
        realTarget.effects = realTarget.effects.filter(e => e.type !== 'def_down');
        realTarget.effects.push({ id: crypto.randomUUID(), type: 'def_down', value: config.ultimate.specialValue!, duration: 99, applierId: attacker.id });
      }
      if (!isNormal && attacker.className === HeroClass.LIGHTNING_MAGE) {
         const dotVal = attacker.level >= 8 ? config.ultimate.upgradedSpecialValue! : config.ultimate.specialValue!;
         realTarget.effects.push({ id: crypto.randomUUID(), type: 'charge', value: dotVal * baseCoef, duration: 99, applierId: attacker.id });
      }

      if (isNormal) {
        const duration = attacker.skillUpgrades.duration || 0;
        if (duration > 0) {
          const dVal = uv.duration || 0;
          const effectStrength = duration * dVal;
          if (attacker.className === HeroClass.FIRE_MAGE) {
            realTarget.effects.push({ id: crypto.randomUUID(), type: 'burn', value: effectStrength * baseCoef, duration: 2, applierId: attacker.id });
          } else if (attacker.className === HeroClass.WIND_MAGE) {
            realTarget.effects.push({ id: crypto.randomUUID(), type: 'vulnerability', value: effectStrength, duration: 2, applierId: attacker.id });
          } else if (attacker.className === HeroClass.LIGHTNING_MAGE) {
            realTarget.effects.push({ id: crypto.randomUUID(), type: 'charge', value: effectStrength * baseCoef, duration: 99, applierId: attacker.id });
          }
        }
      }

      newLogs.push({
        turn, attackerName: attacker.name, skillName: isNormal ? (isCounter ? '反击/追加' : config.normal.name) : config.ultimate.name, 
        targetName: realTarget.name, damage, isCrit, targetHpLeft: realTarget.currentHp, isBlock
      });

      if (realTarget.currentHp > 0 && !isCounter && (realTarget.className === HeroClass.SWORDSMAN || realTarget.className === HeroClass.SPEARMAN)) {
        const agility = (realTarget.skillUpgrades.agility || 0);
        const chance = agility * (SKILLS_CONFIG[realTarget.className].normal.upgradeValues.agility || 0);
        if (Math.random() * 100 < chance) {
          const counterRes = resolveActionInternal(unitsState, realTarget.id, true, true);
          unitsState = counterRes.unitsState;
          newLogs.push(...counterRes.newLogs);
        }
      }
    }

    if (isNormal && !isCounter) {
      let extraProc = false;
      if (attacker.className === HeroClass.WIND_MAGE && config.normal.extraChance) {
        if (Math.random() < config.normal.extraChance) extraProc = true;
      } else if (attacker.className === HeroClass.SPEARMAN && attacker.level >= 3) {
        const pConf = SKILLS_CONFIG[HeroClass.SPEARMAN].passive;
        const chance = attacker.level >= 6 ? pConf.upgradedVal1 : pConf.val1;
        if (Math.random() * 100 < chance) extraProc = true;
      }
      if (extraProc) {
        const extraRes = resolveActionInternal(unitsState, attacker.id, true, true);
        unitsState = extraRes.unitsState;
        newLogs.push(...extraRes.newLogs);
      }
    }

    return { unitsState, newLogs };
  };

  const getAliveTargets = (side: 'player' | 'enemy', allUnits: BattleUnit[]) => {
    return allUnits.filter(u => u.side !== side && u.currentHp > 0);
  };

  const executeNextAction = async () => {
    if (isSimulating.current || battleResult) return;
    
    if (actionIndex >= turnOrder.length) { 
      setTurn(t => t + 1); 
      return; 
    }

    isSimulating.current = true;
    const attackerSnapshot = turnOrder[actionIndex];
    // 始终使用 Ref 中的最新快照
    const attacker = unitsRef.current.find(u => u.id === attackerSnapshot.id);
    
    if (!attacker || attacker.currentHp <= 0 || attacker.effects.some(e => e.type === 'stun')) {
      setActionIndex(prev => prev + 1); 
      isSimulating.current = false; 
      return;
    }

    setActiveUnitId(attacker.id);
    const config = SKILLS_CONFIG[attacker.className];
    const ultName = config.ultimate.name;
    const ultCd = attacker.cooldowns[ultName] || 0;
    const ultReady = attacker.level >= 4 && ultCd <= 0;

    if (ultReady) {
      setUltCasting({ name: attacker.name, skill: ultName });
      await new Promise(r => setTimeout(r, getDelay(1000))); 
      setUltCasting(null);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 500);
    } else {
      await new Promise(r => setTimeout(r, getDelay(600)));
    }
    
    // 执行结算时也使用最新的 unitsRef.current 避免状态偏移
    const { unitsState, newLogs } = resolveActionInternal(unitsRef.current, attacker.id, !ultReady, false);
    
    const finalUnits = unitsState.map(u => {
      if (u.id === attacker.id) {
        const nextCds = { ...u.cooldowns };
        if (ultReady) {
          nextCds[ultName] = config.ultimate.cooldown;
        }
        Object.keys(nextCds).forEach(k => {
          if (nextCds[k] > 0 && !(ultReady && k === ultName)) {
            nextCds[k]--;
          }
        });
        return { ...u, cooldowns: nextCds };
      }
      return u;
    });

    setUnits(finalUnits);
    if (newLogs.length > 0) {
      setLogs(pl => [...newLogs.reverse(), ...pl].slice(0, 50));
    }

    const playerAlive = finalUnits.some(u => u.side === 'player' && u.currentHp > 0);
    const enemyAlive = finalUnits.some(u => u.side === 'enemy' && u.currentHp > 0);
    
    if (!playerAlive || !enemyAlive) {
      const winner = playerAlive ? 'player' : 'enemy';
      setBattleResult(winner);
      onFinish(winner);
    }

    await new Promise(r => setTimeout(r, getDelay(400)));
    setActionIndex(prev => prev + 1);
    setActiveUnitId(null);
    isSimulating.current = false;
  };

  return (
    <div className={`space-y-6 will-change-transform ${screenShake ? 'animate-soft-shake' : ''}`}>
      {ultCasting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-gradient-to-r from-transparent via-blue-600/80 to-transparent w-full py-12 flex flex-col items-center justify-center animate-in fade-in slide-in-from-left duration-300">
             <div className="text-white text-6xl font-black italic tracking-tighter uppercase mb-2 shadow-2xl drop-shadow-[0_4px_15px_rgba(0,0,0,0.6)]">Ultimate Skill</div>
             <div className="text-yellow-400 text-5xl font-bold tracking-widest drop-shadow-lg">{ultCasting.name} : {ultCasting.skill}</div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-slate-900/95 p-6 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-8">
          <button onClick={() => setIsAuto(!isAuto)} className={`px-8 py-3 rounded-xl font-black text-xl transition-all shadow-lg ${isAuto ? 'bg-blue-600 text-white shadow-blue-900/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>{isAuto ? '自动' : '手动'}</button>
          {isAuto && (
            <div className="flex gap-4 bg-slate-800 p-2 rounded-xl border border-slate-700/50">
              {[1, 2, 4].map(s => <button key={s} onClick={() => setSpeed(s)} className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${speed === s ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>{s}X</button>)}
            </div>
          )}
          {!isAuto && <button onClick={executeNextAction} disabled={isSimulating.current || battleResult !== null} className="bg-green-600 hover:bg-green-500 disabled:bg-slate-800 text-white px-8 py-3 rounded-xl font-black text-xl active:scale-95 shadow-lg shadow-green-900/30">下一步</button>}
        </div>
        <div className="flex flex-col items-end">
          <div className="text-slate-500 font-black uppercase text-xs tracking-[0.2em] mb-1">Combat Timeline</div>
          <div className="text-blue-400 font-mono font-black text-4xl leading-none tracking-tight">ROUND {turn}</div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto py-4 bg-slate-900/50 rounded-2xl px-6 border border-slate-800/60 shadow-inner">
        {turnOrder.map((u, i) => {
          const unitData = units.find(unit => unit.id === u.id);
          const isDead = (unitData?.currentHp || 0) <= 0;
          return (
            <div key={u.id + i} className={`text-sm px-5 py-2.5 rounded-xl border shrink-0 transition-all ${i === actionIndex ? 'bg-blue-600 border-blue-400 text-white scale-110 font-black shadow-xl shadow-blue-900/40' : i < actionIndex || isDead ? 'bg-slate-800 border-slate-700 text-slate-500 opacity-50' : 'bg-slate-900 border-slate-700 text-slate-400 font-bold'}`}>{u.name}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div className="space-y-6">
          <h3 className="text-center text-blue-400 font-black uppercase text-sm tracking-[0.4em] opacity-80">己方部队 PLAYER</h3>
          <div className="grid grid-cols-2 gap-6">
            {units.filter(u => u.side === 'player').sort((a,b) => a.position - b.position).map(u => <UnitStatusCard key={u.id} unit={u} isActive={activeUnitId === u.id} isCastingUlt={ultCasting?.name === u.name} />)}
          </div>
        </div>
        <div className="space-y-6">
          <h3 className="text-center text-red-400 font-black uppercase text-sm tracking-[0.4em] opacity-80">敌方部队 ENEMY</h3>
          <div className="grid grid-cols-2 gap-6">
            {units.filter(u => u.side === 'enemy').sort((a,b) => a.position - b.position).map(u => <UnitStatusCard key={u.id} unit={u} isActive={activeUnitId === u.id} isCastingUlt={ultCasting?.name === u.name} />)}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 h-80 overflow-y-auto font-mono text-[15px] shadow-2xl space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {logs.map((log, i) => (
          <div key={i} className={`flex gap-5 items-baseline py-2 border-l-4 pl-5 transition-all hover:bg-slate-800/30 rounded-r-lg ${log.isDot ? 'border-amber-500/50' : log.attackerName === 'DOT结算' ? 'border-slate-700' : 'border-blue-500/40'}`}>
            <span className="text-slate-600 shrink-0 font-black text-sm">[{log.turn}]</span>
            <span className="text-blue-400 font-black shrink-0">{log.attackerName}</span>
            <span className="text-slate-400 italic font-bold">使用 {log.skillName}</span>
            <span className="text-slate-200 font-black">→ {log.targetName}</span>
            <span className={`shrink-0 text-lg ${log.isCrit ? 'text-yellow-400 font-black scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'text-white font-black'}`}>{log.skillName === '回复' ? `+${log.damage}` : `-${log.damage}`}</span>
            {log.isBlock && <span className="text-sky-400 font-black text-[11px] uppercase tracking-widest border border-sky-800/50 px-2 py-0.5 rounded-md bg-sky-900/30">Blocked</span>}
            <span className="text-slate-500 ml-auto font-black text-sm">HP: {Math.max(0, Math.ceil(log.targetHpLeft))}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

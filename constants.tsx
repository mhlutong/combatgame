
import { HeroClass, CombatAttributeTable, HeroCategory, StageConfig, NormalSkillConfig, UltimateSkillConfig, PassiveSkillConfig } from './types';

const createStats = (
  hp: number, pAtk: number, pDef: number, mAtk: number, mDef: number, 
  speed: number, critRate: number, critDamage: number
): any => ({ hp, pAtk, pDef, mAtk, mDef, speed, critRate, critDamage });

export const COMBAT_ATTRIBUTE_TABLE: CombatAttributeTable = {
  [HeroClass.SWORDSMAN]: {
    1: createStats(145, 80, 100, 0, 100, 90, 0, 150),
    2: createStats(225, 96, 100, 0, 100, 95, 0, 150),
    3: createStats(315, 112, 100, 0, 100, 100, 0, 150),
    4: createStats(430, 128, 100, 0, 100, 105, 0, 150),
    5: createStats(580, 144, 100, 0, 100, 110, 0, 150),
    6: createStats(720, 160, 100, 0, 100, 115, 0, 150),
    7: createStats(900, 176, 100, 0, 100, 120, 0, 150),
    8: createStats(1080, 192, 100, 0, 100, 125, 0, 150),
  },
  [HeroClass.AXEMAN]: {
    1: createStats(145, 80, 100, 0, 100, 70, 0, 150),
    2: createStats(225, 96, 100, 0, 100, 75, 0, 150),
    3: createStats(315, 112, 100, 0, 100, 80, 0, 150),
    4: createStats(430, 128, 100, 0, 100, 85, 0, 150),
    5: createStats(580, 144, 100, 0, 100, 90, 0, 150),
    6: createStats(720, 160, 100, 0, 100, 95, 0, 150),
    7: createStats(900, 176, 100, 0, 100, 100, 0, 150),
    8: createStats(1080, 192, 100, 0, 100, 105, 0, 150),
  },
  [HeroClass.SPEARMAN]: {
    1: createStats(145, 80, 100, 0, 100, 100, 0, 150),
    2: createStats(225, 96, 100, 0, 100, 105, 0, 150),
    3: createStats(315, 112, 100, 0, 100, 110, 0, 150),
    4: createStats(430, 128, 100, 0, 100, 115, 0, 150),
    5: createStats(580, 144, 100, 0, 100, 120, 0, 150),
    6: createStats(720, 160, 100, 0, 100, 125, 0, 150),
    7: createStats(900, 176, 100, 0, 100, 130, 0, 150),
    8: createStats(1080, 192, 100, 0, 100, 135, 0, 150),
  },
  [HeroClass.FIRE_MAGE]: {
    1: createStats(125, 0, 70, 100, 70, 80, 0, 150),
    2: createStats(200, 0, 70, 120, 70, 85, 0, 150),
    3: createStats(290, 0, 70, 140, 70, 90, 0, 150),
    4: createStats(390, 0, 70, 160, 70, 95, 0, 150),
    5: createStats(500, 0, 70, 180, 70, 100, 0, 150),
    6: createStats(630, 0, 70, 200, 70, 105, 0, 150),
    7: createStats(800, 0, 70, 220, 70, 110, 0, 150),
    8: createStats(900, 0, 70, 240, 70, 115, 0, 150),
  },
  [HeroClass.WIND_MAGE]: {
    1: createStats(125, 0, 70, 100, 70, 110, 0, 150),
    2: createStats(200, 0, 70, 120, 70, 115, 0, 150),
    3: createStats(290, 0, 70, 140, 70, 120, 0, 150),
    4: createStats(390, 0, 70, 160, 70, 125, 0, 150),
    5: createStats(500, 0, 70, 180, 70, 130, 0, 150),
    6: createStats(630, 0, 70, 200, 70, 135, 0, 150),
    7: createStats(800, 0, 70, 220, 70, 140, 0, 150),
    8: createStats(900, 0, 70, 240, 70, 145, 0, 150),
  },
  [HeroClass.LIGHTNING_MAGE]: {
    1: createStats(125, 0, 70, 100, 70, 95, 0, 150),
    2: createStats(200, 0, 70, 120, 70, 100, 0, 150),
    3: createStats(290, 0, 70, 140, 70, 105, 0, 150),
    4: createStats(390, 0, 70, 160, 70, 110, 0, 150),
    5: createStats(500, 0, 70, 180, 70, 115, 0, 150),
    6: createStats(630, 0, 70, 200, 70, 120, 0, 150),
    7: createStats(800, 0, 70, 220, 70, 125, 0, 150),
    8: createStats(900, 0, 70, 240, 70, 130, 0, 150),
  },
};

export const SKILLS_CONFIG: Record<HeroClass, { 
  normal: NormalSkillConfig; 
  ultimate: UltimateSkillConfig;
  passive: PassiveSkillConfig;
}> = {
  [HeroClass.FIRE_MAGE]: {
    normal: { 
      name: '火球术', 
      descriptionTemplate: '对目标造成{coefficient}%法术伤害', 
      coefficient: 1.0,
      upgradeValues: { potency: 0.3, scale: 0.25, duration: 0.2 }
    },
    ultimate: { name: '陨石术', descriptionTemplate: '对目标造成{coefficient}%法术伤害', cooldown: 3, initialCooldown: 1, baseCoef: 3.0, upgradedCoef: 6.0 },
    passive: { name: '热能过载', descriptionTemplate: '获得{val1}%暴击率', val1: 50, upgradedVal1: 100 }
  },
  [HeroClass.WIND_MAGE]: {
    normal: { 
      name: '风刃', 
      descriptionTemplate: '对目标造成{coefficient}%法术伤害，有{extraChance}%概率额外触发', 
      coefficient: 0.8, 
      extraChance: 0.25,
      upgradeValues: { potency: 0.3, scale: 0.25, duration: 10 }
    },
    ultimate: { name: '龙卷风', descriptionTemplate: '对所有目标造成{coefficient}%法术伤害', cooldown: 3, initialCooldown: 1, baseCoef: 0.6, upgradedCoef: 1.2 },
    passive: { name: '气流引导', descriptionTemplate: '常规技能额外作用{val1}个目标', val1: 1, upgradedVal1: 2 }
  },
  [HeroClass.LIGHTNING_MAGE]: {
    normal: { 
      name: '雷击', 
      descriptionTemplate: '对目标造成{coefficient}%法术伤害', 
      coefficient: 1.0,
      upgradeValues: { potency: 0.3, scale: 0.25, duration: 0.1 }
    },
    ultimate: { name: '雷霆万钧', descriptionTemplate: '造成{coefficient}%法术伤害，并附带3回合DOT(每回合{special}%伤害系数)', cooldown: 3, initialCooldown: 1, baseCoef: 2.0, upgradedCoef: 4.0, specialValue: 1.0, upgradedSpecialValue: 2.0 },
    passive: { name: '电场增强', descriptionTemplate: '每回合提升{val1}%伤害，直至战斗结束', val1: 15, upgradedVal1: 30 }
  },
  [HeroClass.SWORDSMAN]: {
    normal: { 
      name: '重斩', 
      descriptionTemplate: '对目标造成{coefficient}%物理伤害', 
      coefficient: 1.0,
      upgradeValues: { power: 0.3, range: 0.25, precision: 45, agility: 25 }
    },
    ultimate: { name: '剑舞', descriptionTemplate: '造成{coefficient}%物理伤害，自身回复伤害{special}%的血量', cooldown: 3, initialCooldown: 1, baseCoef: 2.0, upgradedCoef: 4.0, specialValue: 0.5 },
    passive: { name: '剑术大师', descriptionTemplate: '获得{val1}%伤害提升和{val2}%伤害减免', val1: 25, upgradedVal1: 50, val2: 20, upgradedVal2: 30 }
  },
  [HeroClass.AXEMAN]: {
    normal: { 
      name: '粉碎打击', 
      descriptionTemplate: '造成{coefficient}%物理伤害，并无视目标{ignoreDef}%物理防御', 
      coefficient: 0.8, 
      ignoreDef: 0.4,
      upgradeValues: { power: 0.3, range: 0.25, precision: 30, agility: 25 }
    },
    ultimate: { name: '处决', descriptionTemplate: '对两个目标造成{coefficient}%物理伤害，永久降低目标{special}%物理防御', cooldown: 3, initialCooldown: 1, baseCoef: 1.0, upgradedCoef: 2.0, specialValue: 50 },
    passive: { name: '碎骨者', descriptionTemplate: '斧手的伤害有{val1}%概率晕眩目标1回合', val1: 30, upgradedVal1: 60 }
  },
  [HeroClass.SPEARMAN]: {
    normal: { 
      name: '穿刺', 
      descriptionTemplate: '造成{coefficient}%物理伤害，有{backRowChance}%概率转为攻击后排', 
      coefficient: 0.8, 
      backRowChance: 0.7,
      upgradeValues: { power: 0.3, range: 0.25, precision: 0.1, agility: 25 }
    },
    ultimate: { name: '惊雷一闪', descriptionTemplate: '对一个前排和一个后排目标各造成{coefficient}%物理伤害', cooldown: 3, initialCooldown: 1, baseCoef: 1.0, upgradedCoef: 2.0 },
    passive: { name: '枪术连携', descriptionTemplate: '常规技能有{val1}%概率额外释放一次', val1: 50, upgradedVal1: 100 }
  }
};

export const UPGRADE_METADATA: Record<string, { name: string; max: number; desc: string }> = {
  power: { name: '力量', max: 7, desc: '提升常规技能伤害系数' },
  precision: { name: '精准', max: 3, desc: '职业特定收益提升' },
  range: { name: '范围', max: 7, desc: '增加攻击目标数量' },
  agility: { name: '敏捷', max: 4, desc: '反击或格挡概率提升' },
  potency: { name: '威力', max: 7, desc: '提升常规技能伤害系数' },
  scale: { name: '规模', max: 7, desc: '增加攻击目标数量' },
  duration: { name: '持久', max: 7, desc: '职业特定效果强度提升' },
};

export const STAGES_DATA: StageConfig[] = [
  { 
    id: 1, enemyLevel: 1, weakeningFactor: 0.8, 
    frontPool: [HeroClass.SWORDSMAN, HeroClass.AXEMAN], 
    backPool: [HeroClass.FIRE_MAGE, HeroClass.SPEARMAN] 
  },
  { 
    id: 2, enemyLevel: 2, weakeningFactor: 0.8, 
    frontPool: [HeroClass.SWORDSMAN, HeroClass.SPEARMAN], 
    backPool: [HeroClass.FIRE_MAGE, HeroClass.WIND_MAGE] 
  },
  { 
    id: 3, enemyLevel: 3, weakeningFactor: 0.8, 
    frontPool: [HeroClass.AXEMAN, HeroClass.SPEARMAN], 
    backPool: [HeroClass.LIGHTNING_MAGE, HeroClass.FIRE_MAGE, HeroClass.WIND_MAGE] 
  },
  { 
    id: 4, enemyLevel: 4, weakeningFactor: 0.8, 
    frontPool: [HeroClass.SWORDSMAN, HeroClass.AXEMAN, HeroClass.SPEARMAN], 
    backPool: [HeroClass.FIRE_MAGE, HeroClass.WIND_MAGE, HeroClass.LIGHTNING_MAGE] 
  },
  { 
    id: 5, enemyLevel: 5, weakeningFactor: 0.8, 
    frontPool: [HeroClass.AXEMAN, HeroClass.SPEARMAN], 
    backPool: [HeroClass.LIGHTNING_MAGE, HeroClass.FIRE_MAGE, HeroClass.WIND_MAGE] 
  },
  { 
    id: 6, enemyLevel: 6, weakeningFactor: 0.8, 
    frontPool: [HeroClass.SWORDSMAN, HeroClass.AXEMAN], 
    backPool: [HeroClass.FIRE_MAGE, HeroClass.WIND_MAGE, HeroClass.LIGHTNING_MAGE] 
  },
  { 
    id: 7, enemyLevel: 7, weakeningFactor: 0.8, 
    frontPool: [HeroClass.SWORDSMAN, HeroClass.SPEARMAN], 
    backPool: [HeroClass.LIGHTNING_MAGE, HeroClass.FIRE_MAGE] 
  },
  { 
    id: 8, enemyLevel: 8, weakeningFactor: 0.8, 
    frontPool: [HeroClass.SWORDSMAN, HeroClass.AXEMAN, HeroClass.SPEARMAN], 
    backPool: [HeroClass.FIRE_MAGE, HeroClass.WIND_MAGE, HeroClass.LIGHTNING_MAGE] 
  },
];

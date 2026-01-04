
export enum HeroCategory {
  WARRIOR = '战士',
  MAGE = '法师'
}

export enum HeroClass {
  SWORDSMAN = '剑士',
  AXEMAN = '斧手',
  SPEARMAN = '枪兵',
  FIRE_MAGE = '火法师',
  WIND_MAGE = '风法师',
  LIGHTNING_MAGE = '电法师'
}

export interface CombatStats {
  hp: number;
  pAtk: number;
  pDef: number;
  mAtk: number;
  mDef: number;
  speed: number;
  critRate: number;
  critDamage: number;
}

export interface NormalSkillConfig {
  name: string;
  descriptionTemplate: string;
  coefficient: number;
  extraChance?: number;
  ignoreDef?: number;
  backRowChance?: number;
  upgradeValues: {
    power?: number;
    potency?: number;
    range?: number;
    scale?: number;
    precision?: number;
    agility?: number;
    duration?: number;
  };
}

export interface UltimateSkillConfig {
  name: string;
  descriptionTemplate: string;
  cooldown: number;
  initialCooldown: number;
  baseCoef: number;
  upgradedCoef: number;
  specialValue?: number;
  upgradedSpecialValue?: number;
}

export interface PassiveSkillConfig {
  name: string;
  descriptionTemplate: string;
  val1: number;
  upgradedVal1: number;
  val2?: number;
  upgradedVal2?: number;
}

export interface StatusEffect {
  id: string;
  type: 'dot' | 'def_down' | 'stun' | 'vulnerability' | 'burn' | 'charge';
  value: number;
  duration: number;
  applierId: string;
}

export interface Hero {
  id: string;
  name: string;
  className: HeroClass;
  category: HeroCategory;
  level: number;
  baseStats: CombatStats;
  skillUpgrades: Record<string, number>;
  availablePoints: number;
}

export interface BattleUnit extends Hero {
  currentHp: number;
  maxHp: number;
  side: 'player' | 'enemy';
  position: number;
  cooldowns: Record<string, number>;
  effects: StatusEffect[];
  accumulatedDmgBonus: number;
  damageFactor: number; // 伤害系数：1.0 为原始，0.8 为 80%
}

export interface Formation {
  front: (string | null)[];
  back: (string | null)[];
}

export interface StageConfig {
  id: number;
  enemyLevel: number;
  weakeningFactor: number;
  frontPool: HeroClass[];
  backPool: HeroClass[];
}

export type CombatAttributeTable = Record<HeroClass, Record<number, CombatStats>>;

export interface BattleLog {
  turn: number;
  attackerName: string;
  skillName: string;
  targetName: string;
  damage: number;
  isCrit: boolean;
  targetHpLeft: number;
  isDot?: boolean;
  isPassive?: boolean;
  isCounter?: boolean;
  isBlock?: boolean;
}

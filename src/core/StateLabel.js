export function getStateLabel(state) {
  const name = state.constructor.name;
  switch (name) {
    case 'IdleState':        return '休憩中';
    case 'WanderState':      return 'うろうろしている';
    case 'HuntingState':     return '狩りをしている';
    case 'PartyMoveToState': return 'パーティで移動中';
    case 'HomeState':        return '家にいる';
    case 'CollectItemState': return 'アイテムを拾いに行く';
    case 'ReviveState':      return state.reviving ? '蘇生中' : '仲間を蘇生しに行く';
    case 'CombatState':      return state.isAllyTarget ? '仲間の戦闘に加わる' : '戦闘中';
    case 'SoloMoveToState':  return state.label ?? '移動中';
    case 'EatState':         return '食事中';
    case 'BuyState':         return '買い物中';
    case 'SellState':        return '売り物中';
    case 'DeadState':        return '死亡';
    default:                 return name;
  }
}

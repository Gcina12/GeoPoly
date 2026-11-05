import { calculateConquerBonus } from './combatEngine';

/**
 * Evaluates the board and determines the optimal strategic action for an NPC.
 */
export function evaluateNpcTurn(npcOwner, board) {
  const npcCountries = board.filter(c => c.owner === npcOwner);
  
  // If NPC has no territories left, they are eliminated
  if (npcCountries.length === 0) {
    return {
      action: 'ELIMINATED',
      justification: `${npcOwner} has no controlled territories remaining.`
    };
  }

  // Find NPC countries capable of attacking (soldier count >= 2)
  const attackerCandidates = npcCountries.filter(c => c.soldiers >= 2);

  if (attackerCandidates.length === 0) {
    return {
      action: 'SKIP',
      justification: `Conserving forces: None of ${npcOwner}'s territories have 2 or more soldiers available to launch an attack.`
    };
  }

  // Find enemy targets across the entire board
  const enemyTargets = board.filter(c => c.owner !== npcOwner);

  let bestMove = null;

  // Strategic target scoring: Look for high win probability or high-value conquers
  for (const attacker of attackerCandidates) {
    const attackingForce = attacker.soldiers - 1; // Always leave 1 soldier behind

    for (const defender of enemyTargets) {
      // Calculate troop ratio
      const forceRatio = attackingForce / defender.soldiers;
      const potentialBonus = calculateConquerBonus(defender.originalValue);

      // Score priority: Prefer easy victories (ratio >= 1.5) or taking low-soldier high-value countries
      let score = forceRatio * 10 + potentialBonus;

      if (attackingForce > defender.soldiers) {
        score += 20; // High win likelihood bonus
      }

      if (!bestMove || score > bestMove.score) {
        bestMove = {
          score,
          attacker,
          defender,
          attackingForce,
          forceRatio
        };
      }
    }
  }

  // If best move has favorable odds (attackingForce > defender.soldiers or ratio >= 1.2), attack
  if (bestMove && (bestMove.attackingForce > bestMove.defender.soldiers || bestMove.forceRatio >= 1.2)) {
    return {
      action: 'ATTACK',
      attacker: bestMove.attacker,
      defender: bestMove.defender,
      justification: `Targeting ${bestMove.defender.name} from ${bestMove.attacker.name} because ${bestMove.attacker.name} holds a troop advantage (${bestMove.attacker.soldiers} vs ${bestMove.defender.soldiers}) with high probability of conquering.`
    };
  }

  // Otherwise, skip turn to preserve troops
  return {
    action: 'SKIP',
    justification: `Decided to skip turn: Enemy defenses are currently too strong to attack without incurring heavy casualties.`
  };
}
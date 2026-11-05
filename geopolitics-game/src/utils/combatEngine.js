/**
 * Executes one round of dice rolls between an attacking and defending country.
 */
export function executeDiceRoll(attackerSoldiers, defenderSoldiers) {
  if (!Number.isInteger(attackerSoldiers) || !Number.isInteger(defenderSoldiers)
    || attackerSoldiers < 2 || defenderSoldiers < 1) return null;

  const diceCount = Math.min(attackerSoldiers - 1, defenderSoldiers);
  const attackerRolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
  const defenderRolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);

  let attackerLosses = 0;
  let defenderLosses = 0;
  const matchResults = [];

  for (let i = 0; i < diceCount; i++) {
    const attDie = attackerRolls[i];
    const defDie = defenderRolls[i];

    if (attDie > defDie) {
      defenderLosses++;
      matchResults.push({ attDie, defDie, winner: "attacker" });
    } else if (defDie > attDie) {
      attackerLosses++;
      matchResults.push({ attDie, defDie, winner: "defender" });
    } else {
      matchResults.push({ attDie, defDie, winner: "tie" });
    }
  }

  return {
    attackerRolls,
    defenderRolls,
    matchResults,
    attackerLosses,
    defenderLosses
  };
}

/**
 * Calculates bonus troops awarded upon conquering: Max(2, floor(originalValue / 2))
 */
export function calculateConquerBonus(originalSoldierValue) {
  return Math.max(2, Math.floor(originalSoldierValue / 2));
}

export function estimateConquestChance(attackerSoldiers, defenderSoldiers, simulations = 1200) {
  if (attackerSoldiers <= 1 || defenderSoldiers <= 0) return 0;

  let victories = 0;
  for (let simulation = 0; simulation < simulations; simulation += 1) {
    let attackers = attackerSoldiers;
    let defenders = defenderSoldiers;
    let rounds = 0;

    while (attackers > 1 && defenders > 0 && rounds < 500) {
      const result = executeDiceRoll(attackers, defenders);
      if (!result) break;
      attackers -= result.attackerLosses;
      defenders -= result.defenderLosses;
      rounds += 1;
    }

    if (defenders <= 0) victories += 1;
  }

  return victories / simulations;
}
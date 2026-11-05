/**
 * Generates dynamic broadcast commentary for combat results, conquests, and round shifts.
 */
export function generateCommentary({ type, attacker, defender, bonus, npcOwner, justification }) {
  if (type === 'CONQUEST') {
    const lines = [
      `🚨 GEO-ALERT: ${attacker} forces have breached all defenses in ${defender}! Strategic annexation complete, securing +${bonus} bonus division reserves!`,
      `💥 BREAKING NEWS: Map re-drawn! ${attacker} completely dominates ${defender}, reinforcing frontlines with +${bonus} fresh battalions!`,
      `🌐 STRATEGIC SHIFT: The balance of power collapses in ${defender} as ${attacker} takes full sovereign control!`
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  if (type === 'NPC_TURN') {
    return `🎙️ ANALYST REPORT: ${npcOwner} calculated move — "${justification}"`;
  }

  if (type === 'ROUND_START') {
    return `📡 GLOBAL UPDATE: Entering Round ${bonus}. All sovereign nations deploy +2 troop reinforcements per controlled territory!`;
  }

  return '🎙️ Global military observers monitor troop deployments closely.';
}
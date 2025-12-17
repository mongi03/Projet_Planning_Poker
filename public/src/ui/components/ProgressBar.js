/**
 * @fileoverview Composant ProgressBar - Barre de progression des votes
 * @module ProgressBar
 * @version 1.0.0
 * 
 * @description
 * Composant qui affiche une barre de progression visuelle indiquant
 * le pourcentage de joueurs ayant voté.
 */

/**
 * Met à jour la barre de progression des votes
 * 
 * Calcule le pourcentage de joueurs ayant voté et met à jour
 * l'affichage de la barre et du texte de statut.
 * 
 * @function updateProgressBar
 * @param {Array<Object>} players - Liste des joueurs
 * @param {boolean} players[].hasVoted - Indique si le joueur a voté
 * @returns {void}
 * 
 * @description
 * Processus:
 * - Compte les joueurs avec hasVoted = true
 * - Calcule le pourcentage: (voted / total) * 100
 * - Met à jour le texte: "X / Y joueurs ont voté"
 * - Met à jour la largeur de la barre de progression en pourcentage
 * 
 * @example
 * import { updateProgressBar } from '../components/ProgressBar.js'
 * 
 * const players = [
 *   { name: 'Alice', hasVoted: true },
 *   { name: 'Bob', hasVoted: false },
 *   { name: 'Charlie', hasVoted: true }
 * ]
 * updateProgressBar(players)
 * // Affiche: "2 / 3 joueurs ont voté" et barre à 66%
 */
export function updateProgressBar(players) {
  const voted = players.filter(p => p.hasVoted).length;
  const total = players.length;
  const percentage = total > 0 ? (voted / total) * 100 : 0;
  document.getElementById('votingStatus').textContent = `${voted} / ${total} joueurs ont voté`;
  document.getElementById('progressBar').style.width = percentage + '%';
}
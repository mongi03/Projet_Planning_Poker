/**
 * @fileoverview Composant WaitingPlayers - Affichage des joueurs en attente
 * @module WaitingPlayers
 * @version 1.0.0
 * 
 * @description
 * Composant qui affiche la liste des joueurs connectés et prêts.
 * Affiche un message si aucun joueur n'est présent.
 */

/**
 * Rend la liste des joueurs en attente/prêts
 * 
 * Affiche chaque joueur connecté avec un indicateur de statut.
 * Affiche un message si la liste est vide.
 * 
 * @function renderWaitingPlayers
 * @param {Array<Object>} players - Liste des joueurs connectés
 * @param {string} players[].name - Nom du joueur
 * @returns {void}
 * 
 * @description
 * Processus:
 * - Récupère le conteneur #waitingPlayers
 * - Vide le conteneur des joueurs précédents
 * - Si aucun joueur:
 *   - Affiche "En attente de joueurs..."
 *   - Retour
 * - Sinon pour chaque joueur:
 *   - Crée une div waiting-player
 *   - Affiche "✓ NomJoueur" dans waiting-player-name
 *   - Affiche "Connecté et prêt" dans waiting-info
 * 
 * @example
 * import { renderWaitingPlayers } from '../components/WaitingPlayers.js'
 * 
 * const players = [
 *   { name: 'Alice' },
 *   { name: 'Bob' },
 *   { name: 'Charlie' }
 * ]
 * renderWaitingPlayers(players)
 * // Affiche 3 joueurs avec checkmark
 * 
 * // Ou avec liste vide:
 * renderWaitingPlayers([])
 * // Affiche "En attente de joueurs..."
 */
export function renderWaitingPlayers(players) {
  const container = document.getElementById('waitingPlayers');
  container.innerHTML = '';
  if (players.length === 0) {
    container.innerHTML = '<div style="color: var(--color-text-light); text-align: center; padding: 20px;">En attente de joueurs...</div>';
    return;
  }
  players.forEach(player => {
    const div = document.createElement('div');
    div.className = 'waiting-player';
    div.innerHTML = `
      <div class="waiting-player-name">✓ ${player.name}</div>
      <div class="waiting-info">Connecté et prêt</div>
    `;
    container.appendChild(div);
  });
}
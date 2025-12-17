/**
 * @fileoverview Composant PlayerList - Liste des joueurs avec statut de vote
 * @module PlayerList
 * @version 1.0.0
 * 
 * @description
 * Composant qui affiche la liste des joueurs connectés avec leur statut de vote.
 * Indique visuellement qui a voté et qui est en attente.
 */

/**
 * Rend la liste des joueurs avec leur statut de vote
 * 
 * Affiche chaque joueur avec son nom et son statut (voté ou en attente).
 * Inclut des logs de debug pour faciliter le débogage.
 * 
 * @function renderPlayersList
 * @param {Array<Object>} players - Liste des joueurs
 * @param {string} players[].name - Nom du joueur
 * @param {boolean} players[].hasVoted - Indique si le joueur a voté
 * @returns {void}
 * 
 * @description
 * Processus:
 * - Récupère le conteneur #playersList
 * - Vérifie l'existence du conteneur (erreur si absent)
 * - Vide le conteneur des joueurs précédents
 * - Pour chaque joueur:
 *   - Crée une div player-item
 *   - Ajoute le nom du joueur
 *   - Ajoute le statut (Voté ✓ ou En attente)
 *   - Classe 'voted' si le joueur a voté
 * 
 * Inclut logging DEBUG pour débogage
 * 
 * @example
 * import { renderPlayersList } from '../components/PlayerList.js'
 * 
 * const players = [
 *   { name: 'Alice', hasVoted: true },
 *   { name: 'Bob', hasVoted: false },
 *   { name: 'Charlie', hasVoted: true }
 * ]
 * renderPlayersList(players)
 */
export function renderPlayersList(players) {
  console.log('🎮 renderPlayersList appelé avec:', players);
  
  const container = document.getElementById('playersList');
  
  // ✅ DEBUG: Vérifier si le container existe
  if (!container) {
    console.error('❌ ERREUR: Élément #playersList non trouvé!');
    console.log('IDs disponibles:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    return;
  }
  
  console.log('✅ Container trouvé:', container);
  
  container.innerHTML = '';
  
  players.forEach(player => {
    console.log(`➕ Ajout joueur: ${player.name} (hasVoted: ${player.hasVoted})`);
    
    const item = document.createElement('div');
    item.className = 'player-item';
    
    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = player.name;
    
    const status = document.createElement('div');
    status.className = 'player-status';
    status.textContent = player.hasVoted ? 'Voté ✓' : 'En attente';
    if (player.hasVoted) status.classList.add('voted');
    
    item.appendChild(name);
    item.appendChild(status);
    container.appendChild(item);
  });
  
  console.log('✅ Rendu terminé');
}
/**
 * @fileoverview Composant CardGrid - Grille de cartes pour le Planning Poker
 * @module CardGrid
 * @version 1.0.0
 * 
 * @description
 * Composant qui affiche une grille interactive de cartes pour voter.
 * Inclut les valeurs: 1, 2, 3, 5, 8, 13, 20, 40, 100, ?, café
 */

/**
 * Rend la grille de cartes interactive
 * 
 * Crée une grille de cartes cliquables permettant au joueur de voter.
 * Les cartes incluent les valeurs de Fibonacci modifiées, une carte "?" 
 * pour l'indécision, et une carte "☕" pour la pause café.
 * 
 * @function renderCards
 * @param {PlanningPokerClient} app - Instance principale de l'application
 * @returns {void}
 * 
 * @description
 * Chaque carte:
 * - Possède un onclick qui appelle app.castVote(value)
 * - Affiche la valeur ou un emoji (? ou ☕)
 * - Possède des styles CSS personnalisés par type
 * - "?" : gradient orange
 * - "coffee" : gradient marron + emoji ☕
 * 
 * @example
 * import { renderCards } from '../components/CardGrid.js'
 * renderCards(app)
 */
export function renderCards(app) {
  const container = document.getElementById('cardsContainer');
  container.innerHTML = '';
  const cardValues = ['1', '2', '3', '5', '8', '13', '20', '40', '100', '?', 'coffee'];
  cardValues.forEach(value => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper';
    wrapper.onclick = (e) => app.castVote(value);
    const display = document.createElement('div');
    display.className = 'card-display';
    if (value === '?') {
      display.textContent = '?';
      display.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else if (value === 'coffee') {
      display.textContent = '☕';
      display.style.fontSize = '36px';
      display.style.background = 'linear-gradient(135deg, #92400e 0%, #78350f 100%)';
    } else {
      display.textContent = value;
    }
    wrapper.appendChild(display);
    container.appendChild(wrapper);
  });
}

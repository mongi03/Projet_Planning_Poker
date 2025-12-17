export function showResults(app) {
  app.hideAllScreens();
  document.getElementById('resultsScreen').classList.add('active');
  document.getElementById('continueBtn').style.display =
    app.gameState.showNextRoundButton ? 'none' : 'block';
  document.getElementById('nextRoundBtn').style.display =
    app.gameState.showNextRoundButton ? 'block' : 'none';
  renderResults(app);
}

export function renderResults(app) {
  const currentTask = app.gameState.backlog[app.gameState.currentTaskIndex];
  document.getElementById('resultsTaskName').textContent = currentTask.name;
  document.getElementById('resultsRound').textContent = app.gameState.currentRound;
  const voteCounts = {};
  const votersByCard = {};
  for (const [playerId, vote] of Object.entries(app.gameState.votes)) {
    voteCounts[vote] = (voteCounts[vote] || 0) + 1;
    if (!votersByCard[vote]) votersByCard[vote] = [];
    const player = app.gameState.players.find(p => p.id === playerId);
    if (player) votersByCard[vote].push(player.name);
  }
  const distribution = document.getElementById('votesDistribution');
  distribution.innerHTML = '';
  const sortedVotes = Object.keys(voteCounts).sort((a, b) => {
    if (a === 'coffee') return 1;
    if (b === 'coffee') return -1;
    return parseInt(b) - parseInt(a);
  });
  sortedVotes.forEach(vote => {
    const count = voteCounts[vote];
    const item = document.createElement('div');
    item.className = 'vote-result-card';
    const cardDisplay = document.createElement('div');
    cardDisplay.className = 'vote-result-number';
    if (vote === '?') {
      cardDisplay.textContent = '?';
      cardDisplay.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    } else if (vote === 'coffee') {
      cardDisplay.textContent = '☕';
      cardDisplay.style.fontSize = '32px';
      cardDisplay.style.background = 'linear-gradient(135deg, #92400e 0%, #78350f 100%)';
    } else {
      cardDisplay.textContent = vote;
    }
    const countEl = document.createElement('div');
    countEl.className = 'vote-result-count';
    countEl.textContent = `${count}`;
    item.appendChild(cardDisplay);
    item.appendChild(countEl);
    distribution.appendChild(item);
  });
  const isUnanimous = Object.keys(voteCounts).length === 1;
  document.getElementById('unanimityMessage').style.display = isUnanimous ? 'block' : 'none';
  const extremeContainer = document.getElementById('extremeVotesDisplay');
  if (isUnanimous) {
    extremeContainer.style.display = 'none';
  } else {
    extremeContainer.style.display = 'block';
    extremeContainer.innerHTML = '';
    const numericVotes = sortedVotes
      .filter(v => v !== 'coffee' && v !== '?')
      .map(Number)
      .sort((a, b) => a - b);
    if (numericVotes.length > 1) {
      const minVote = numericVotes[0];
      const maxVote = numericVotes[numericVotes.length - 1];
      extremeContainer.innerHTML = '<div class="extreme-title">⚠️ Votes extrêmes</div>';
      extremeContainer.innerHTML += `
        <div style="margin: 15px 0;">
          <strong>Vote le plus bas (${minVote}):</strong>
          <div style="margin-top: 10px;">
            ${votersByCard[minVote]?.map(v => `<span class="voter-tag">${v}</span>`).join('')}
          </div>
        </div>
        <div style="margin: 15px 0;">
          <strong>Vote le plus haut (${maxVote}):</strong>
          <div style="margin-top: 10px;">
            ${votersByCard[maxVote]?.map(v => `<span class="voter-tag">${v}</span>`).join('')}
          </div>
        </div>
      `;
    }
    if (voteCounts['coffee']) {
      extremeContainer.innerHTML += `
        <div style="margin-top: 15px;">
          <strong>☕ Pause:</strong>
          <div style="margin-top: 10px;">
            ${votersByCard['coffee']?.map(v => `<span class="voter-tag">${v}</span>`).join('')}
          </div>
        </div>
      `;
    }
  }
}

// Fonction pour afficher l'écran de résumé de la partie restaurée
export function showResumeSummaryScreen(app) {
  app.hideAllScreens();
  document.getElementById('resumeSummaryScreen').classList.add('active');
  document.getElementById('summarySessionCode').textContent = app.sessionCode;
  renderResumeSummary(app);
}

// Fonction pour rendre le résumé des tâches complétées et en cours
export function renderResumeSummary(app) {
  // Affichage des tâches complétées
  const completedContainer = document.getElementById('completedTasksList');
  completedContainer.innerHTML = '';

  if (!app.gameState.completedTasks || app.gameState.completedTasks.length === 0) {
    completedContainer.innerHTML = `
      <div style="color: var(--color-text-light); text-align: center; padding: 20px;">
        Aucune tâche complétée
      </div>
    `;
  } else {
    app.gameState.completedTasks.forEach((taskId, idx) => {
      const task = app.gameState.backlog.find(t => t.id === taskId);
      const estimate = app.gameState.taskEstimates[taskId] || task.finalValue;

      if (task) {
        const taskElement = document.createElement('div');
        taskElement.style.cssText = `
          padding: 12px;
          margin-bottom: 10px;
          background: var(--color-surface);
          border-left: 3px solid var(--color-success);
          border-radius: 4px;
          font-size: 14px;
        `;
        taskElement.innerHTML = `
          <div style="font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
            <span>${idx + 1}. ${task.name}</span>
            <span style="
              background: var(--color-primary);
              color: white;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 700;
            ">
              📊 ${estimate || '?'}
            </span>
          </div>
          <div style="color: var(--color-text-light); font-size: 12px; margin-top: 5px;">
            ${task.description || ''}
          </div>
        `;
        completedContainer.appendChild(taskElement);
      }
    });
  }

  // Affichage de la tâche en cours
  const currentTask = app.gameState.backlog[app.gameState.currentTaskIndex];
  if (currentTask) {
    document.getElementById('summaryCurrentTaskName').textContent = currentTask.name;
    document.getElementById('summaryCurrentTaskDesc').textContent =
      currentTask.description || 'Pas de description';

    // Affichage des votes mémorisés pour la tâche en cours
    const savedVotes = app.gameState.currentTaskVotes || {};
    const votesList = Object.values(savedVotes);

    if (votesList.length > 0) {
      const voteCounts = {};
      votesList.forEach(vote => {
        voteCounts[vote] = (voteCounts[vote] || 0) + 1;
      });

      const voteDistribution = Object.entries(voteCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([vote, count]) => `${vote}(${count})`)
        .join(' • ');

      document.getElementById('summaryLastVote').textContent =
        `Round ${app.gameState.currentTaskRound}: ${voteDistribution}`;
    } else {
      document.getElementById('summaryLastVote').textContent =
        'Aucun vote enregistré (Round 1)';
    }
  }
}

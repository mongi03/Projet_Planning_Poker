export function showAddTasksScreen(app) {
  app.hideAllScreens();
  document.getElementById('addTasksScreen').classList.add('active');
  document.getElementById('addTasksSessionCode').textContent = app.sessionCode;
  app.localBacklog = [];
  document.getElementById('taskName').value = '';
  document.getElementById('taskDesc').value = '';
  renderTasksList(app.localBacklog);
}

export function renderTasksList(backlog) {
  const container = document.getElementById('tasksList');
  container.innerHTML = '';
  if (backlog.length === 0) {
    container.innerHTML = '<div style="color: var(--color-text-light); text-align: center;">Aucune tâche pour le moment</div>';
  } else {
    backlog.forEach((task, idx) => {
      const div = document.createElement('div');
      div.className = 'waiting-player';
      div.innerHTML = `
        <div class="waiting-player-name">#${task.id}: ${task.name}</div>
        <div class="waiting-info">${task.description || 'Pas de description'}</div>
        <button onclick="app.removeTask(${idx})" class="remove-btn">❌ Supprimer</button>
      `;
      container.appendChild(div);
    });
  }
  document.getElementById('taskCount').textContent = backlog.length;
  document.getElementById('startVotingBtn').disabled = backlog.length === 0;
}

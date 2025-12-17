export function showMenuScreen() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('menuScreen').classList.add('active');
  document.getElementById('menuScreen').classList.remove('hidden');
}

export function showJoinForm() {
  document.getElementById('menuScreen').classList.add('hidden');
  document.getElementById('joinForm').classList.remove('hidden');
}

export function showResumeForm() {
  document.getElementById('menuScreen').classList.add('hidden');
  document.getElementById('resumeForm').classList.remove('hidden');
  document.getElementById('playerNameResume').value = '';
  document.getElementById('resumeError').classList.add('hidden');
}

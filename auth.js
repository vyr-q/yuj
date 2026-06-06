// ===== AUTH HELPERS =====

function getUsers() {
  return JSON.parse(localStorage.getItem('nv_users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('nv_users', JSON.stringify(users));
}

function setCurrentUser(user) {
  localStorage.setItem('nv_current_user', JSON.stringify(user));
}

function toggleForm(type) {
  const login = document.getElementById('loginForm');
  const register = document.getElementById('registerForm');
  clearErrors();
  if (type === 'register') {
    login.classList.add('hidden');
    register.classList.remove('hidden');
  } else {
    register.classList.add('hidden');
    login.classList.remove('hidden');
  }
}

function clearErrors() {
  ['loginError', 'registerError'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
}

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  clearErrors();

  if (!email || !password) return showError('loginError', 'Please fill in all fields.');

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) return showError('loginError', 'Invalid email or password.');

  setCurrentUser(user);
  window.location.href = 'dashboard.html';
}

function handleRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  clearErrors();

  if (!name || !email || !password) return showError('registerError', 'Please fill in all fields.');
  if (password.length < 6) return showError('registerError', 'Password must be at least 6 characters.');
  if (!/\S+@\S+\.\S+/.test(email)) return showError('registerError', 'Please enter a valid email.');

  const users = getUsers();
  if (users.find(u => u.email === email)) return showError('registerError', 'An account with this email already exists.');

  const newUser = { id: Date.now().toString(), name, email, password };
  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);
  window.location.href = 'dashboard.html';
}

// Allow pressing Enter to submit
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm && !loginForm.classList.contains('hidden')) handleLogin();
    else if (registerForm && !registerForm.classList.contains('hidden')) handleRegister();
  }
});

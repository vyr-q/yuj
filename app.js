// ===== NOTEVAULT APP =====

let currentUser = null;
let allNotes = [];
let currentFilter = 'all';
let searchQuery = '';
let viewMode = 'grid';
let editingNoteId = null;
let currentTags = [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Auth guard
  const stored = localStorage.getItem('nv_current_user');
  if (!stored) { window.location.href = 'index.html'; return; }
  currentUser = JSON.parse(stored);

  // Show user info
  document.getElementById('userInfo').innerHTML =
    `<strong>${escHtml(currentUser.name)}</strong>${escHtml(currentUser.email)}`;

  loadNotes();
  renderAll();
});

// ===== DATA =====
function getUserKey() { return `nv_notes_${currentUser.id}`; }

function loadNotes() {
  allNotes = JSON.parse(localStorage.getItem(getUserKey()) || '[]');
}

function persistNotes() {
  localStorage.setItem(getUserKey(), JSON.stringify(allNotes));
}

// ===== RENDER =====
function renderAll() {
  updateCounts();
  renderNotes();
}

function updateCounts() {
  const cats = ['personal', 'work', 'ideas', 'urgent'];
  document.getElementById('count-all').textContent = allNotes.length;
  cats.forEach(c => {
    const el = document.getElementById(`count-${c}`);
    if (el) el.textContent = allNotes.filter(n => n.category === c).length;
  });
}

function renderNotes() {
  let notes = allNotes;

  // Filter by category
  if (currentFilter !== 'all') notes = notes.filter(n => n.category === currentFilter);

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    notes = notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  // Sort by newest
  notes = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);

  const grid = document.getElementById('notesGrid');
  const empty = document.getElementById('emptyState');
  const countBadge = document.getElementById('noteCount');

  countBadge.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;

  if (notes.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = notes.map(note => renderCard(note)).join('');

  // Set view class
  grid.className = `notes-grid${viewMode === 'list' ? ' list-view' : ''}`;
}

function renderCard(note) {
  const tags = (note.tags || []).map(t => `<span class="tag">#${escHtml(t)}</span>`).join('');
  const date = formatDate(note.updatedAt);
  const preview = note.content.replace(/\n/g, ' ').substring(0, 180);
  return `
    <div class="note-card" data-cat="${note.category}" onclick="openEditNote('${note.id}')">
      <div class="note-card-header">
        <div class="note-card-title">${escHtml(note.title) || 'Untitled'}</div>
        <span class="note-cat-badge badge-${note.category}">${note.category}</span>
      </div>
      <div class="note-card-body">${escHtml(preview)}</div>
      <div class="note-card-footer">
        <span class="note-date">${date}</span>
        <div class="note-tags">${tags}</div>
      </div>
    </div>
  `;
}

// ===== FILTERS =====
function filterByCategory(cat) {
  currentFilter = cat;

  document.querySelectorAll('.cat-item').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });

  const titles = { all: 'All Notes', personal: 'Personal', work: 'Work', ideas: 'Ideas', urgent: 'Urgent' };
  document.getElementById('pageTitle').textContent = titles[cat] || 'Notes';

  renderNotes();
}

function handleSearch() {
  searchQuery = document.getElementById('searchInput').value.trim();
  renderNotes();
}

// ===== VIEW =====
function setView(mode) {
  viewMode = mode;
  document.getElementById('gridBtn').classList.toggle('active', mode === 'grid');
  document.getElementById('listBtn').classList.toggle('active', mode === 'list');
  renderNotes();
}

// ===== MODAL =====
function openNewNote() {
  editingNoteId = null;
  currentTags = [];
  document.getElementById('noteTitle').value = '';
  document.getElementById('noteContent').value = '';
  document.getElementById('noteCategory').value = 'personal';
  document.getElementById('tagsList').innerHTML = '';
  document.getElementById('tagsInput').value = '';
  document.getElementById('modalDate').textContent = 'New note';
  document.getElementById('deleteBtn').style.display = 'none';
  document.getElementById('noteModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('noteTitle').focus(), 50);
}

function openEditNote(id) {
  const note = allNotes.find(n => n.id === id);
  if (!note) return;
  editingNoteId = id;
  currentTags = [...(note.tags || [])];
  document.getElementById('noteTitle').value = note.title;
  document.getElementById('noteContent').value = note.content;
  document.getElementById('noteCategory').value = note.category;
  document.getElementById('modalDate').textContent = 'Last edited ' + formatDate(note.updatedAt);
  document.getElementById('deleteBtn').style.display = 'inline-flex';
  renderTagsList();
  document.getElementById('noteModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('noteModal').classList.add('hidden');
  editingNoteId = null;
  currentTags = [];
}

// Close modal on overlay click
document.getElementById('noteModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ===== TAGS =====
function handleTagInput(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const val = e.target.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (val && !currentTags.includes(val) && currentTags.length < 8) {
      currentTags.push(val);
      renderTagsList();
    }
    e.target.value = '';
  }
}

function renderTagsList() {
  document.getElementById('tagsList').innerHTML = currentTags.map((t, i) =>
    `<span class="tag" style="cursor:pointer" onclick="removeTag(${i})" title="Remove">#${escHtml(t)} ×</span>`
  ).join('');
}

function removeTag(i) {
  currentTags.splice(i, 1);
  renderTagsList();
}

// ===== SAVE / DELETE =====
function saveNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  const category = document.getElementById('noteCategory').value;

  if (!title && !content) { showToast('Please add a title or content.'); return; }

  if (editingNoteId) {
    const idx = allNotes.findIndex(n => n.id === editingNoteId);
    if (idx !== -1) {
      allNotes[idx] = { ...allNotes[idx], title: title || 'Untitled', content, category, tags: currentTags, updatedAt: Date.now() };
    }
  } else {
    allNotes.push({
      id: Date.now().toString(),
      title: title || 'Untitled',
      content,
      category,
      tags: currentTags,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  persistNotes();
  closeModal();
  renderAll();
  showToast(editingNoteId ? 'Note updated!' : 'Note saved!');
}

function deleteNote() {
  if (!editingNoteId) return;
  if (!confirm('Delete this note? This cannot be undone.')) return;
  allNotes = allNotes.filter(n => n.id !== editingNoteId);
  persistNotes();
  closeModal();
  renderAll();
  showToast('Note deleted.');
}

// ===== AUTH =====
function handleLogout() {
  localStorage.removeItem('nv_current_user');
  window.location.href = 'index.html';
}

// ===== SIDEBAR TOGGLE (mobile) =====
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===== UTILS =====
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2800);
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    const modal = document.getElementById('noteModal');
    if (!modal.classList.contains('hidden')) saveNote();
  }
});

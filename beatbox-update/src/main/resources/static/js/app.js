const API = '/api';
let songs = [];
let playlists = [];
let currentIndex = -1;
let shuffled = false;
let repeat = false;
let activePlaylistId = null;

const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const progress = document.getElementById('progress');

async function loadData() {
  const [s, p] = await Promise.all([
    fetch(`${API}/songs`).then(r => r.json()),
    fetch(`${API}/playlists`).then(r => r.json())
  ]);
  songs = s; playlists = p;
  renderSongs(songs);
  renderLibrary(songs);
  renderPlaylists(playlists);
  document.getElementById('songCount').textContent = `${songs.length} songs`;
}

function renderSongs(list) {
  const grid = document.getElementById('songGrid');
  grid.innerHTML = list.map((song, i) => `
    <article class="song-card" onclick="playSong(${songs.findIndex(x => x.id === song.id)})">
      <div class="cover">♫</div>
      <div class="song-title">${escapeHtml(song.title)}</div>
      <div class="artist">${escapeHtml(song.artist)} • ${escapeHtml(song.genre)}</div>
      <div class="card-row">
        <span class="artist">${song.duration}</span>
        <button class="small-btn" onclick="event.stopPropagation(); downloadSong(${song.id})">⬇</button>
      </div>
    </article>
  `).join('');
}

function renderLibrary(list) {
  document.getElementById('libraryList').innerHTML = list.map((song, i) => `
    <div class="track">
      <div class="track-cover">♫</div>
      <div><strong>${escapeHtml(song.title)}</strong><br><small>${escapeHtml(song.artist)}</small></div>
      <small>${song.genre}</small>
      <small>${song.duration}</small>
      <button class="small-btn" onclick="playSong(${songs.findIndex(x => x.id === song.id)})">▶</button>
    </div>
  `).join('');
}

function renderPlaylists(list) {
  document.getElementById('playlistList').innerHTML = list.length
    ? list.map(p => `
      <div class="playlist" onclick="openPlaylist(${p.id})">
        <div class="playlist-cover">♫</div>
        <h4>${escapeHtml(p.name)}</h4>
        <p>${p.songs.length} song(s)</p>
        <div class="playlist-actions">
          <button class="secondary" onclick="event.stopPropagation(); openPlaylist(${p.id})">View / Add</button>
          ${p.songs.length ? `<button class="primary" onclick="event.stopPropagation(); playPlaylist(${p.id})">▶ Play</button>` : ''}
        </div>
      </div>`).join('')
    : '<div class="playlist"><div class="playlist-cover">♫</div><h4>No playlists yet</h4><p>Create your first playlist with the button above.</p></div>';
}

function openPlaylist(id) {
  const playlist = playlists.find(p => p.id === id);
  if (!playlist) return;
  activePlaylistId = id;
  document.getElementById('playlistModalTitle').textContent = playlist.name;
  document.getElementById('playlistModalCount').textContent = `${playlist.songs.length} song(s)`;
  renderPlaylistSongs(playlist);
  document.getElementById('playlistModal').classList.remove('hidden');
}

function renderPlaylistSongs(playlist) {
  const container = document.getElementById('playlistSongs');
  container.innerHTML = playlist.songs.length
    ? playlist.songs.map(song => `
      <div class="playlist-song">
        <div class="track-cover">♫</div>
        <div class="song-meta"><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(song.artist)} • ${escapeHtml(song.duration)}</small></div>
        <button class="small-btn" onclick="playSong(${songs.findIndex(x => x.id === song.id)})">▶</button>
      </div>`).join('')
    : '<div class="playlist-song"><div class="song-meta"><strong>No songs in this playlist</strong><small>Click “Add songs” or upload a song here.</small></div></div>';
}

function playPlaylist(id) {
  const playlist = playlists.find(p => p.id === id);
  if (!playlist || !playlist.songs.length) return;
  const index = songs.findIndex(s => s.id === playlist.songs[0].id);
  if (index >= 0) playSong(index);
}

function addSongToPlaylist(playlistId, songId) {
  return fetch(`${API}/playlists/${playlistId}/songs/${songId}`, {method:'POST'}).then(async r => {
    if (!r.ok) throw new Error((await r.text()) || 'Could not add song.');
    return r.json();
  });
}


function playSong(index) {
  if (!songs[index]) return;
  currentIndex = index;
  const song = songs[index];
  audio.src = song.audioUrl;
  audio.play().catch(() => {});
  updatePlayer(song);
  playBtn.textContent = '❚❚';
}

function updatePlayer(song) {
  document.getElementById('nowTitle').textContent = song.title;
  document.getElementById('nowArtist').textContent = `${song.artist} • ${song.genre}`;
  document.getElementById('miniCover').textContent = '♫';
  document.getElementById('totalTime').textContent = song.duration;
}

playBtn.addEventListener('click', () => {
  if (currentIndex < 0) return playSong(0);
  if (audio.paused) { audio.play(); playBtn.textContent = '❚❚'; }
  else { audio.pause(); playBtn.textContent = '▶'; }
});

document.getElementById('nextBtn').addEventListener('click', nextSong);
document.getElementById('prevBtn').addEventListener('click', () => {
  if (!songs.length) return;
  currentIndex = currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;
  playSong(currentIndex);
});

function nextSong() {
  if (!songs.length) return;
  if (shuffled) currentIndex = Math.floor(Math.random() * songs.length);
  else currentIndex = (currentIndex + 1) % songs.length;
  playSong(currentIndex);
}

document.getElementById('shuffleBtn').addEventListener('click', e => {
  shuffled = !shuffled; e.currentTarget.classList.toggle('active', shuffled);
});
document.getElementById('repeatBtn').addEventListener('click', e => {
  repeat = !repeat; e.currentTarget.classList.toggle('active', repeat);
});
audio.addEventListener('ended', () => repeat ? playSong(currentIndex) : nextSong());
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  progress.value = (audio.currentTime / audio.duration) * 100;
  document.getElementById('currentTime').textContent = formatTime(audio.currentTime);
});
progress.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = (progress.value / 100) * audio.duration;
});
document.getElementById('volume').addEventListener('input', e => audio.volume = e.target.value);

document.getElementById('downloadBtn').addEventListener('click', () => {
  if (songs[currentIndex]) downloadSong(songs[currentIndex].id);
});
function downloadSong(id) {
  const song = songs.find(s => s.id === id);
  if (!song) return;
  const a = document.createElement('a');
  a.href = song.audioUrl;
  const ext = song.audioUrl.includes('.') ? song.audioUrl.substring(song.audioUrl.lastIndexOf('.')) : '.mp3';
  a.download = `${song.title}${ext}`;
  document.body.appendChild(a); a.click(); a.remove();
}

document.getElementById('playAllBtn').addEventListener('click', () => playSong(0));

document.getElementById('searchInput').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  renderSongs(songs.filter(s => `${s.title} ${s.artist} ${s.genre}`.toLowerCase().includes(q)));
});

document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.section').forEach(x => x.classList.add('hidden'));
  document.getElementById(btn.dataset.section).classList.remove('hidden');
  document.getElementById('sectionTitle').textContent =
    btn.dataset.section === 'home' ? 'Good evening 👋' :
    btn.dataset.section === 'library' ? 'Your Library' : 'Your Playlists';
}));

const modal = document.getElementById('modal');
document.getElementById('newPlaylistBtn').addEventListener('click', () => modal.classList.remove('hidden'));
document.getElementById('closeModal').addEventListener('click', () => modal.classList.add('hidden'));
document.getElementById('createPlaylistBtn').addEventListener('click', async () => {
  const name = document.getElementById('playlistName').value.trim();
  if (!name) return alert('Enter a playlist name.');
  const res = await fetch(`${API}/playlists`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({name})
  });
  if (!res.ok) return alert('Could not create playlist.');
  playlists = await fetch(`${API}/playlists`).then(r => r.json());
  renderPlaylists(playlists);
  document.getElementById('playlistName').value = '';
  modal.classList.add('hidden');
});

// Theme selector — saved in the browser so the theme remains after restart.
const themeSelect = document.getElementById('themeSelect');
const savedTheme = localStorage.getItem('beatbox-theme') || 'midnight';
document.body.dataset.theme = savedTheme;
themeSelect.value = savedTheme;
themeSelect.addEventListener('change', e => {
  document.body.dataset.theme = e.target.value;
  localStorage.setItem('beatbox-theme', e.target.value);
});

// Playlist detail / add-song controls.
const playlistModal = document.getElementById('playlistModal');
document.getElementById('closePlaylistModal').addEventListener('click', () => playlistModal.classList.add('hidden'));
document.getElementById('addSongsBtn').addEventListener('click', () => {
  if (!activePlaylistId) return;
  playlistModal.classList.add('hidden');
  showAddSongsModal(activePlaylistId);
});
document.getElementById('uploadToPlaylistBtn').addEventListener('click', () => {
  if (!activePlaylistId) return;
  playlistModal.classList.add('hidden');
  openUploadForPlaylist(activePlaylistId);
});

function showAddSongsModal(playlistId) {
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return;
  const available = songs.filter(s => !playlist.songs.some(ps => ps.id === s.id));
  const html = available.length ? available.map(s => `
    <label class="playlist-song"><input type="checkbox" value="${s.id}"><div class="song-meta"><strong>${escapeHtml(s.title)}</strong><small>${escapeHtml(s.artist)}</small></div></label>`).join('') : '<p class="modal-help">All songs in your library are already in this playlist.</p>';
  const wrap = document.createElement('div');
  wrap.className='modal';
  wrap.innerHTML=`<div class="modal-card playlist-modal-card"><button class="close">×</button><h3>Add songs to ${escapeHtml(playlist.name)}</h3><div class="playlist-song-list">${html}</div><br><button class="primary full">Add selected songs</button></div>`;
  document.body.appendChild(wrap);
  wrap.querySelector('.close').onclick=()=>wrap.remove();
  wrap.querySelector('.primary').onclick=async()=>{
    const ids=[...wrap.querySelectorAll('input[type=checkbox]:checked')].map(x=>Number(x.value));
    if(!ids.length){alert('Select at least one song.');return;}
    try{
      for(const id of ids) await addSongToPlaylist(playlistId,id);
      playlists=await fetch(`${API}/playlists`).then(r=>r.json());
      renderPlaylists(playlists);
      wrap.remove();
      openPlaylist(playlistId);
    }catch(e){alert(e.message);}
  };
}

function openUploadForPlaylist(playlistId) {
  pendingPlaylistId = playlistId;
  uploadStatus.textContent = '';
  uploadStatus.className = 'upload-status';
  document.getElementById('uploadModalTitle').textContent = 'Upload song to playlist 🎵';
  uploadModal.classList.remove('hidden');
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
loadData();

// Song upload
const uploadModal = document.getElementById('uploadModal');
const uploadForm = document.getElementById('uploadForm');
const songFile = document.getElementById('songFile');
const songTitle = document.getElementById('songTitle');
const songDuration = document.getElementById('songDuration');
const uploadStatus = document.getElementById('uploadStatus');
const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');
let pendingPlaylistId = null;

document.getElementById('uploadSongBtn').addEventListener('click', () => {
  pendingPlaylistId = null;
  document.getElementById('uploadModalTitle').textContent = 'Upload a song 🎵';
  uploadStatus.textContent = '';
  uploadStatus.className = 'upload-status';
  uploadModal.classList.remove('hidden');
});

document.getElementById('closeUploadModal').addEventListener('click', () => uploadModal.classList.add('hidden'));

songFile.addEventListener('change', () => {
  const file = songFile.files[0];
  if (!file) return;

  // Use the filename as a convenient default title.
  if (!songTitle.value.trim()) {
    songTitle.value = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
  }

  // Read the duration in the browser so it is stored with the song metadata.
  const tempAudio = document.createElement('audio');
  tempAudio.preload = 'metadata';
  tempAudio.onloadedmetadata = () => {
    if (Number.isFinite(tempAudio.duration)) {
      songDuration.value = formatTime(tempAudio.duration);
    }
    URL.revokeObjectURL(tempAudio.src);
  };
  tempAudio.src = URL.createObjectURL(file);
});

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = songFile.files[0];
  if (!file) return;

  uploadStatus.textContent = 'Uploading...';
  uploadStatus.className = 'upload-status';
  uploadSubmitBtn.disabled = true;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', songTitle.value.trim());
  formData.append('artist', document.getElementById('songArtist').value.trim());
  formData.append('genre', document.getElementById('songGenre').value.trim());
  formData.append('duration', songDuration.value || '0:00');

  try {
    const response = await fetch(`${API}/songs/upload`, { method: 'POST', body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Upload failed.');

    uploadStatus.textContent = 'Song uploaded successfully!';
    uploadStatus.className = 'upload-status success';

    if (pendingPlaylistId) {
      await addSongToPlaylist(pendingPlaylistId, data.id);
    }

    uploadForm.reset();
    songDuration.value = '0:00';
    const returnPlaylistId = pendingPlaylistId;
    pendingPlaylistId = null;

    songs = await fetch(`${API}/songs`).then(r => r.json());
    renderSongs(songs);
    renderLibrary(songs);
    document.getElementById('songCount').textContent = `${songs.length} songs`;
    playlists = await fetch(`${API}/playlists`).then(r => r.json());
    renderPlaylists(playlists);

    setTimeout(() => {
      uploadModal.classList.add('hidden');
      if (returnPlaylistId) openPlaylist(returnPlaylistId);
    }, 700);
  } catch (error) {
    uploadStatus.textContent = error.message;
    uploadStatus.className = 'upload-status error';
  } finally {
    uploadSubmitBtn.disabled = false;
  }
});

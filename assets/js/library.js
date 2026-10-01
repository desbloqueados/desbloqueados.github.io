(function () {
  'use strict';

  const games = window.GAME_CATALOG;
  const byId = new Map(games.map(game => [game.id, game]));
  const list = document.getElementById('games-list');
  const main = document.querySelector('main');
  const player = document.getElementById('player');
  const stage = document.getElementById('game-stage');
  const loading = document.getElementById('loading');
  const status = document.getElementById('player-status');
  const back = document.getElementById('back');
  let activeGame = null;
  let frame = null;
  let loadTimer = null;
  let returnFocus = null;

  function paintCover(canvas, game) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let hash = 0;
    for (const letter of game.id) hash = ((hash << 5) - hash + letter.charCodeAt(0)) | 0;
    const hue = ((hash % 360) + 360) % 360;
    const gradient = ctx.createLinearGradient(0, 0, 480, 300);
    gradient.addColorStop(0, `hsl(${hue}, 60%, 28%)`);
    gradient.addColorStop(1, `hsl(${(hue + 45) % 360}, 70%, 9%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 480, 300);
    ctx.strokeStyle = 'rgba(255,255,255,.07)';
    for (let x = 0; x < 480; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 300); ctx.stroke();
    }
    for (let y = 0; y < 300; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(480, y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = 'bold 76px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = game.name.split(/\s+/).slice(0, 3).map(word => word[0]).join('');
    ctx.fillText(initials.toUpperCase(), 240, 142, 400);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.65)';
    ctx.fillText('PLAY GAME', 240, 230);
    if (!game.cover) return;
    const image = new Image();
    image.onload = function () {
      const contain = game.id === 'fnaf1';
      const scale = contain ? Math.min(480 / image.width, 300 / image.height)
        : Math.max(480 / image.width, 300 / image.height);
      const width = image.width * scale, height = image.height * scale;
      ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, 480, 300);
      ctx.drawImage(image, (480 - width) / 2, (300 - height) / 2, width, height);
    };
    image.src = game.cover;
  }

  const fragment = document.createDocumentFragment();
  for (const game of games) {
    const item = document.createElement('li');
    item.className = 'games';
    item.dataset.name = `${game.name} ${game.id} ${game.keywords || ''}`.toLowerCase();
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.game = game.id;
    button.setAttribute('aria-label', `Play ${game.name}`);
    const canvas = document.createElement('canvas');
    canvas.className = 'game-cover';
    canvas.width = 480;
    canvas.height = 300;
    canvas.setAttribute('aria-hidden', 'true');
    paintCover(canvas, game);
    const label = document.createElement('span');
    label.className = 'game-label';
    label.textContent = game.name;
    button.append(canvas, label);
    item.append(button);
    fragment.append(item);
  }
  list.append(fragment);

  function filterGames() {
    const words = document.getElementById('search').value.toLowerCase().trim().split(/\s+/);
    let shown = 0;
    for (const item of list.children) {
      const match = words.every(word => item.dataset.name.includes(word));
      item.hidden = !match;
      if (match) shown++;
    }
    document.getElementById('empty').style.display = shown ? 'none' : 'block';
    document.getElementById('library-status').textContent = `${shown} of ${games.length} games`;
  }
  document.getElementById('search').addEventListener('input', filterGames);
  filterGames();

  function unloadGame() {
    clearTimeout(loadTimer);
    if (frame) frame.remove(); // Destroy the document to stop audio, animation, and runtime memory.
    frame = null;
    loading.hidden = true;
  }

  function loadGame(game) {
    unloadGame();
    loading.textContent = `Loading ${game.name}…`;
    loading.hidden = false;
    status.textContent = game.hostedLocally ? 'Click the game to use its keyboard controls.'
      : 'Loads from the original site. If it cannot run here, use “open game”.';
    const nextFrame = document.createElement('iframe');
    nextFrame.title = `${game.name} game player`;
    nextFrame.allow = 'autoplay; fullscreen; gamepad';
    nextFrame.allowFullscreen = true;
    nextFrame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    nextFrame.addEventListener('load', function () {
      if (frame !== nextFrame) return;
      clearTimeout(loadTimer);
      loading.hidden = true;
      // A frame load confirms the page arrived, not that its runtime/assets are ready.
    });
    nextFrame.addEventListener('error', function () {
      if (frame !== nextFrame) return;
      clearTimeout(loadTimer);
      loading.hidden = true;
      status.textContent = 'The game page could not load. Try restart or “open game”.';
    });
    nextFrame.src = game.url;
    frame = nextFrame;
    stage.append(frame);
    loadTimer = setTimeout(function () {
      if (frame !== nextFrame) return;
      loading.hidden = true;
      status.textContent = 'Still loading? Try restart or “open game” to play on its own page.';
    }, 15000);
  }

  function showGame(game) {
    if (activeGame && activeGame.id === game.id) return;
    returnFocus = document.activeElement;
    activeGame = game;
    document.getElementById('player-title').textContent = game.name;
    document.getElementById('original').href = game.url;
    player.classList.add('open');
    main.inert = true;
    document.body.style.overflow = 'hidden';
    back.focus();
    loadGame(game);
  }

  function hideGame() {
    if (!activeGame) return;
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
    unloadGame();
    activeGame = null;
    player.classList.remove('open');
    main.inert = false;
    document.body.style.overflow = '';
    if (returnFocus && returnFocus.isConnected && returnFocus !== document.body) returnFocus.focus();
    else document.getElementById('search').focus();
  }

  function syncLocation() {
    const id = new URLSearchParams(location.hash.slice(1)).get('game');
    const game = byId.get(id);
    if (game) showGame(game);
    else hideGame();
  }

  list.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-game]');
    if (!button) return;
    const game = byId.get(button.dataset.game);
    history.pushState({ gameLibrary: true }, '', `#game=${encodeURIComponent(game.id)}`);
    showGame(game);
  });
  function closePlayer() {
    hideGame();
    if (history.state && history.state.gameLibrary) history.back();
    else history.replaceState(null, '', location.pathname + location.search);
  }
  back.addEventListener('click', closePlayer);
  document.getElementById('restart').addEventListener('click', function () {
    if (activeGame) loadGame(activeGame);
  });
  document.getElementById('fullscreen').addEventListener('click', async function () {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (player.requestFullscreen) await player.requestFullscreen();
      else status.textContent = 'Fullscreen is unavailable in this browser. Try “open game”.';
    } catch (error) {
      status.textContent = 'Fullscreen is unavailable. Try “open game” for a larger view.';
    }
  });
  document.addEventListener('fullscreenchange', function () {
    document.getElementById('fullscreen').textContent = document.fullscreenElement ? 'exit fullscreen' : 'fullscreen';
  });
  document.addEventListener('keydown', function (event) {
    if (!activeGame) return;
    if (event.key === 'Escape') closePlayer();
    if (event.key === 'Tab') {
      const first = back, last = frame || document.getElementById('original');
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  });
  window.addEventListener('hashchange', syncLocation);
  window.addEventListener('popstate', syncLocation);
  syncLocation();
})();

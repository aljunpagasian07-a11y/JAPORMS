
/* ==========================================
   JAPORMS — Tinder-style swipe card engine
   (lodexstudio-swipe-cards pattern: stacked
   cards, top card drags + rotates, LIKE/NOPE
   stamps, fly-out past threshold)
   ========================================== */
const SwipeDeck = (() => {
  const SWIPE_THRESHOLD = 110;
  let queue = [];
  let mount, onDecision;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function applyDepth(el, depth) {
    el.style.zIndex = 20 - depth;
    el.style.transform = `scale(${1 - depth * 0.05}) translateY(${depth * 16}px)`;
    el.style.opacity = depth > 2 ? 0 : 1 - depth * 0.12;
    el.style.filter = depth ? `brightness(${1 - depth * 0.12})` : 'none';
  }

  function cardEl(item, depth) {
    const el = document.createElement('div');
    el.className = 'swipe-card';
    el.dataset.id = item.id;
    el.style.setProperty('--art1', item.colors[0]);
    el.style.setProperty('--art2', item.colors[1]);
    el.innerHTML =
      '<div class="swipe-stamp stamp-like">LIKE</div>' +
      '<div class="swipe-stamp stamp-nope">NOPE</div>' +
      '<div class="fit-art">' + artFor(item) + '</div>' +
      '<div class="fit-info">' +
        '<div class="fit-name-row"><h3>' + item.name + '</h3><span class="fit-price">$' + item.price + '</span></div>' +
        '<div class="fit-meta">' +
          '<span class="fit-tag ' + item.fit + '">' + item.fit.toUpperCase() + '</span>' +
          '<span class="fit-sizes">' + item.type.toUpperCase() + ' · sizes ' + item.sizes.join(' / ') + '</span>' +
        '</div>' +
        '<p class="fit-measure">chest ' + item.chest + 'cm · length ' + item.length + 'cm' + (item.stock <= 3 ? ' · only ' + item.stock + ' left' : '') + '</p>' +
      '</div>';
    applyDepth(el, depth);
    if (depth === 0) attachDrag(el);
    return el;
  }

  function attachDrag(el) {
    let dragging = false, startX = 0, startY = 0, dx = 0, dy = 0;

    el.addEventListener('pointerdown', (e) => {
      dragging = true; startX = e.clientX; startY = e.clientY; dx = dy = 0;
      el.setPointerCapture(e.pointerId);
      el.style.transition = 'none';
    });

    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dx = e.clientX - startX; dy = e.clientY - startY;
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.07}deg)`;
      el.querySelector('.stamp-like').style.opacity = Math.max(0, Math.min(1, dx / 90));
      el.querySelector('.stamp-nope').style.opacity = Math.max(0, Math.min(1, -dx / 90));
    });

    const end = () => {
      if (!dragging) return;
      dragging = false;
      el.style.transition = 'transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease';
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        flyOut(el, dx > 0 ? 'right' : 'left');
      } else {
        el.style.transform = '';
        el.querySelector('.stamp-like').style.opacity = 0;
        el.querySelector('.stamp-nope').style.opacity = 0;
      }
    };

    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function flyOut(el, dir) {
    el.style.transform = `translate(${dir === 'right' ? '130%' : '-130%'}, -20px) rotate(${dir === 'right' ? 28 : -28}deg)`;
    el.style.opacity = 0;
    const id = el.dataset.id;
    setTimeout(() => {
      if (dir === 'right') Store.like(id); else Store.reject(id);
      if (onDecision) onDecision(id, dir);
      render();
    }, 320);
  }

  function render() {
    mount.innerHTML = '';
    if (!queue.length) { renderEmpty(); return; }
    queue.slice(0, 3).forEach((item, i) => mount.appendChild(cardEl(item, i)));
  }

  function renderEmpty() {
    const empty = document.createElement('div');
    empty.className = 'deck-empty';
    empty.innerHTML =
      '<h3>You&rsquo;re all caught up</h3>' +
      '<p>Every drop has been judged. Check your Liked fits, or reset the deck for a fresh run.</p>' +
      '<div style="display:flex;gap:.8rem;flex-wrap:wrap;justify-content:center;">' +
        '<a class="btn btn-primary" href="liked.html">View Liked</a>' +
        '<a class="btn btn-secondary" href="rejected.html">View Rejected</a>' +
        '<button class="btn btn-outline" id="deckResetBtn">Reset Deck</button>' +
      '</div>';
    mount.appendChild(empty);
    empty.querySelector('#deckResetBtn').addEventListener('click', () => {
      if (confirm('Reset the deck? This clears your liked and rejected history.')) {
        Store.resetHistory();
        queue = shuffle(Store.remainingItems());
        render();
        showToast('Deck reset — happy swiping');
      }
    });
  }

  function lockScreen() {
    mount.innerHTML =
      '<div class="deck-lock">' +
        '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' +
        '<h3>Set up your fit profile first</h3>' +
        '<p>Sign up, add your measurements, and pick your baggy / fitted size categories — then the deck unlocks.</p>' +
        '<a class="btn btn-primary" href="signup.html">Create My Profile</a>' +
      '</div>';
  }

  return {
    init(el, opts = {}) {
      mount = el;
      onDecision = opts.onDecision || null;
      if (!Store.profile()) { lockScreen(); return false; }
      queue = shuffle(Store.remainingItems());
      render();
      return true;
    },
    likeTop()    { const top = mount.querySelector('.swipe-card'); if (top) flyOut(top, 'right'); },
    nopeTop()    { const top = mount.querySelector('.swipe-card'); if (top) flyOut(top, 'left'); },
    remaining()  { return queue.length; },
    refresh()    { queue = shuffle(Store.remainingItems()); render(); },
  };
})();

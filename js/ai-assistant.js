
/* ==========================================
   JAPORMS — AI fit assistant (rule-based):
   checks whether a piece is available within
   the categories the client listed at signup
   ========================================== */
const Assistant = (() => {
  const SIZE_TOKENS = ['xxl', 'xs', 'xl', 's', 'm', 'l']; // longer tokens first

  function extractSize(text) {
    for (const s of SIZE_TOKENS) {
      if (new RegExp('\\b' + s + '\\b').test(text)) return s.toUpperCase();
    }
    return null;
  }

  function categoriesSummary(profile) {
    const parts = [];
    if (profile.categories.baggy.length)  parts.push('BAGGY: sizes ' + profile.categories.baggy.join(', '));
    if (profile.categories.fitted.length) parts.push('FITTED: sizes ' + profile.categories.fitted.join(', '));
    return parts.length ? parts.join('  ·  ') : 'no categories set yet';
  }

  function matchItem(text) {
    let best = null, score = 0;
    for (const it of JAPORMS_DATA) {
      const words = it.name.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
      const s = words.filter(w => w.length > 2 && text.includes(w)).length;
      if (s > score) { score = s; best = it; }
    }
    return score > 0 ? best : null;
  }

  function reply(text) {
    const t = ' ' + text.toLowerCase().trim() + ' ';
    const profile = Store.profile();

    if (/help|what can you/.test(t)) {
      return 'I can check if any piece fits your categories. Try:\n' +
        '"Is the Tokyo Oversized Tee available in baggy M?"\n' +
        '"show my categories" — your signup fit rules\n' +
        '"my likes" — your liked pieces';
    }

    if (/categor|profile|my size|measurement/.test(t)) {
      if (!profile) return 'You haven\u2019t set up a profile yet. Head to Sign Up and add your height, width, and fit categories.';
      return 'Your fit profile:\n' +
        '\u2022 Height: ' + profile.height + 'cm · Width: ' + profile.width + 'cm\n' +
        '\u2022 ' + categoriesSummary(profile);
    }

    if (/like|liked|match/.test(t) && !/available/.test(t)) {
      const liked = Store.liked().map(id => JAPORMS_DATA.find(i => i.id === id)).filter(Boolean);
      if (!liked.length) return 'You haven\u2019t liked any fits yet. Swipe right on pieces you love!';
      return 'You\u2019ve liked ' + liked.length + ' piece(s):\n' + liked.map(i => '\u2022 ' + i.name + ' (' + i.fit + ', $' + i.price + ')').join('\n');
    }

    const item = matchItem(t);
    if (!item) {
      return 'I couldn\u2019t match that to a piece in our current drop. Try one of these:\n' +
        JAPORMS_DATA.slice(0, 5).map(i => '\u2022 ' + i.name).join('\n');
    }

    // build availability verdict
    const size = extractSize(t);
    const notes = [];
    let available = true;

    if (item.stock <= 0) { available = false; notes.push('\u2022 \u274c It\u2019s out of stock right now.'); }

    if (profile) {
      const catSizes = profile.categories[item.fit] || [];
      if (!catSizes.length) {
        available = false;
        notes.push('\u2022 \u274c Its ' + item.fit.toUpperCase() + ' fit isn\u2019t in your categories (you listed: ' + categoriesSummary(profile) + ').');
      } else {
        const overlap = item.sizes.filter(s => catSizes.includes(s));
        if (!overlap.length) {
          available = false;
          notes.push('\u2022 \u274c None of its sizes (' + item.sizes.join('/') + ') overlap your ' + item.fit + ' sizes (' + catSizes.join('/') + ').');
        } else {
          notes.push('\u2022 \u2705 ' + item.fit.toUpperCase() + ' is in your categories — overlapping sizes: ' + overlap.join(', ') + '.');
          if (size) {
            if (item.sizes.includes(size) && catSizes.includes(size)) notes.push('\u2022 \u2705 Size ' + size + ' is available for you.');
            else if (item.sizes.includes(size)) { available = false; notes.push('\u2022 \u274c Size ' + size + ' exists on this piece but isn\u2019t in your ' + item.fit + ' category.'); }
            else { available = false; notes.push('\u2022 \u274c Size ' + size + ' isn\u2019t offered on this piece (available: ' + item.sizes.join('/') + ').'); }
          }
        }
        if (profile.width) {
          const diff = item.chest - profile.width;
          const ok = item.fit === 'baggy' ? diff >= 12 : (diff >= -6 && diff <= 10);
          notes.push(ok
            ? '\u2022 \u2705 Chest ' + item.chest + 'cm works with your ' + profile.width + 'cm width (' + (item.fit === 'baggy' ? 'relaxed allowance' : 'true-to-body') + ').'
            : '\u2022 \u26a0\ufe0f Chest ' + item.chest + 'cm may drape ' + (diff < 0 ? 'tight' : 'very loose') + ' on your ' + profile.width + 'cm width.');
        }
      }
    } else {
      notes.push('\u2022 \u2139\ufe0f No profile yet — I can\u2019t check your categories. Sign up first!');
    }

    notes.push('\u2022 Stock: ' + item.stock + ' left · $' + item.price);
    return (available ? '\u2705 YES — ' : '\u274c NO — ') + '"' + item.name + '" is ' + (available ? 'available' : 'not available') + ' for you.\n' + notes.join('\n');
  }

  function init() {
    const fab = document.createElement('button');
    fab.className = 'chat-fab';
    fab.setAttribute('aria-label', 'AI Fit Assistant');
    fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.className = 'chat-panel';
    panel.innerHTML =
      '<div class="chat-head"><h4>JAP</h4><span class="live-status"><span class="pulse-dot"></span>Online</span></div>' +
      '<div class="chat-body"></div>' +
      '<div class="chat-input-row">' +
        '<input class="chat-input" type="text" placeholder="e.g. Is the Kyoto hoodie available in XL?" />' +
        '<button class="chat-send" aria-label="Send"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>' +
      '</div>';
    document.body.appendChild(panel);

    const body = panel.querySelector('.chat-body');
    const input = panel.querySelector('.chat-input');

    function addMsg(text, who) {
      const m = document.createElement('div');
      m.className = 'chat-msg ' + who;
      m.textContent = text;
      body.appendChild(m);
      body.scrollTop = body.scrollHeight;
    }

    function send() {
      const val = input.value.trim();
      if (!val) return;
      addMsg(val, 'user');
      input.value = '';
      setTimeout(() => addMsg(reply(val), 'bot'), 450);
    }

    fab.addEventListener('click', () => {
      panel.classList.toggle('open');
      if (panel.classList.contains('open') && !body.children.length) {
        addMsg('HI Kamusta ako si JAP, ang iyong personal Assistant na tutulong sayo para sayong mala JAPORMS na fits', 'bot');
      }
    });
    panel.querySelector('.chat-send').addEventListener('click', send);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  }

  return { init };
})();

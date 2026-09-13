/* ==========================================
   JAPORMS — AI fit assistant
   • Rule-based core (behavior unchanged)
   • OpenRouter LLM fallback with MULTI-KEY rotation
   ========================================== */

const Assistant = (() => {
  const SIZE_TOKENS = ['xxl', 'xs', 'xl', 's', 'm', 'l']; // longer tokens first

  /* ==========================================================
     1. OPENROUTER CONFIG
     Put your keys in `keys` below, OR inject them at runtime
     before this script loads:
         window.JAPORMS_OPENROUTER_KEYS = ['sk-or-v1-...', '...'];
     ========================================================== */
  const OPENROUTER = {
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openai/gpt-4o-mini',       // any OpenRouter model id
    keys: [
      'sk-or-v1-REPLACE_KEY_1',
      'sk-or-v1-REPLACE_KEY_2',
      'sk-or-v1-REPLACE_KEY_3'
    ],
    referer: (typeof location !== 'undefined' ? location.origin : 'https://japorms.app'),
    title: 'JAPORMS Fit Assistant',
    temperature: 0.6,
    maxTokens: 400,
    timeoutMs: 20000,
    rateLimitCooldownMs: 60000,   // 429 → bench key for 1 min
    rejectedKeyCooldownMs: 300000 // 401/402/403 → bench key for 5 min
  };

  /* ==========================================================
     2. KEY POOL — round-robin + cooldown + automatic failover
     ========================================================== */
  const KeyPool = (() => {
    let keys = [];
    let cursor = 0;
    const benchedUntil = new Map(); // key -> timestamp

    function load() {
      const injected = (typeof window !== 'undefined' && Array.isArray(window.JAPORMS_OPENROUTER_KEYS))
        ? window.JAPORMS_OPENROUTER_KEYS
        : [];
      const source = injected.length ? injected : OPENROUTER.keys;
      keys = [...new Set(
        source
          .filter(k => typeof k === 'string' && k.trim())
          .map(k => k.trim())
      )];
      cursor = 0;
      benchedUntil.clear();
    }

    function isBenched(key) {
      const until = benchedUntil.get(key);
      if (!until) return false;
      if (Date.now() >= until) { benchedUntil.delete(key); return false; }
      return true;
    }

    function size() { if (!keys.length) load(); return keys.length; }

    // Returns the next usable key, skipping `skip` set and benched keys.
    function next(skip) {
      if (!keys.length) load();
      if (!keys.length) return null;

      for (let i = 0; i < keys.length; i++) {
        const key = keys[cursor % keys.length];
        cursor = (cursor + 1) % keys.length;
        if (skip && skip.has(key)) continue;
        if (isBenched(key)) continue;
        return key;
      }

      // Everything is benched — last resort: any key we haven't tried yet.
      if (skip) {
        for (const key of keys) if (!skip.has(key)) return key;
      }
      return null;
    }

    function bench(key, ms) { benchedUntil.set(key, Date.now() + (ms || 60000)); }

    return { next, bench, size, reload: load };
  })();

  /* ==========================================================
     3. TRANSPORT — fetch with timeout
     ========================================================== */
  function fetchWithTimeout(url, options, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timer));
  }

  /* ==========================================================
     4. CHAT COMPLETION — rotates keys until one succeeds
     ========================================================== */
  async function chatCompletion(messages) {
    const keyCount = KeyPool.size();
    if (!keyCount) throw new Error('no-api-keys');

    const tried = new Set();
    let lastError = null;

    for (let attempt = 0; attempt < keyCount; attempt++) {
      const key = KeyPool.next(tried);
      if (!key) break;
      tried.add(key);

      let res;
      try {
        res = await fetchWithTimeout(OPENROUTER.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + key,
            'Content-Type': 'application/json',
            'HTTP-Referer': OPENROUTER.referer,
            'X-Title': OPENROUTER.title
          },
          body: JSON.stringify({
            model: OPENROUTER.model,
            messages: messages,
            temperature: OPENROUTER.temperature,
            max_tokens: OPENROUTER.maxTokens
          })
        }, OPENROUTER.timeoutMs);
      } catch (err) {
        // network error / timeout → short bench, try next key
        lastError = err;
        KeyPool.bench(key, 15000);
        continue;
      }

      if (res.status === 429) {
        KeyPool.bench(key, OPENROUTER.rateLimitCooldownMs);
        lastError = new Error('rate-limited');
        continue;
      }
      if (res.status === 401 || res.status === 402 || res.status === 403) {
        KeyPool.bench(key, OPENROUTER.rejectedKeyCooldownMs);
        lastError = new Error('key-rejected-' + res.status);
        continue;
      }
      if (!res.ok) {
        lastError = new Error('http-' + res.status);
        continue;
      }

      let data;
      try { data = await res.json(); }
      catch (err) { lastError = err; continue; }

      if (data && data.error) {
        lastError = new Error(data.error.message || 'openrouter-error');
        continue;
      }

      const content = data
        && data.choices
        && data.choices[0]
        && data.choices[0].message
        && data.choices[0].message.content;

      if (!content || !content.trim()) {
        lastError = new Error('empty-completion');
        continue;
      }

      return content.trim();
    }

    throw lastError || new Error('all-keys-exhausted');
  }

  /* ==========================================================
     5. RULE-BASED CORE  (unchanged logic)
     ========================================================== */
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

  function cannedFallback() {
    return 'I couldn\u2019t match that to a piece in our current drop. Try one of these:\n' +
      JAPORMS_DATA.slice(0, 5).map(i => '\u2022 ' + i.name).join('\n');
  }

  // Returns a string when a rule fires, or null to hand off to the LLM.
  function ruleReply(text, profile) {
    const t = ' ' + text.toLowerCase().trim() + ' ';

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
    if (!item) return null; // → let the LLM handle free-form questions

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

  /* ==========================================================
     6. LLM LAYER — same persona, same facts, same verdicts
     ========================================================== */
  const history = []; // short rolling memory (LLM path only)
  const HISTORY_LIMIT = 8;

  function buildSystemPrompt(profile) {
    const catalog = JAPORMS_DATA.map(i =>
      '- ' + i.name + ' | fit: ' + i.fit + ' | sizes: ' + i.sizes.join('/') +
      ' | chest: ' + i.chest + 'cm | $' + i.price + ' | stock: ' + i.stock
    ).join('\n');

    const liked = Store.liked()
      .map(id => (JAPORMS_DATA.find(i => i.id === id) || {}).name)
      .filter(Boolean);

    return [
      'You are JAP, the personal AI fit assistant of JAPORMS (a streetwear fit shop).',
      'Personality: warm, casual, streetwear-savvy Filipino. Speak natural Taglish (mix English + Tagalog) like a helpful kuya. Keep replies short — 2 to 5 lines — and use "\u2022" bullets when listing pieces.',
      '',
      'RULES:',
      '1. Only discuss JAPORMS pieces, fits, sizes, stock, prices, and the user fit profile.',
      '2. NEVER invent products, sizes, prices or stock — use ONLY the CATALOG below.',
      '3. Availability verdict follows the app logic: a piece is available only if its fit category is in the user categories AND at least one size overlaps between the piece and that category. Baggy is OK when chest minus user width is >= 12cm; fitted is OK when the difference is between -6cm and +10cm.',
      '4. If the user has no profile, tell them to sign up first (height, width, fit categories).',
      '5. If something is not in the catalog, say so plainly and suggest the closest pieces from the catalog.',
      '6. Politely refuse off-topic questions and steer back to fits.',
      '7. Start a clear availability answer with "\u2705 YES — " or "\u274c NO — " followed by the piece name.',
      '',
      'CATALOG:',
      catalog || '(empty)',
      '',
      'USER PROFILE:',
      profile
        ? 'Height: ' + profile.height + 'cm · Width: ' + profile.width + 'cm\n' + categoriesSummary(profile)
        : 'None yet — the user has not signed up.',
      '',
      liked.length ? 'LIKED PIECES: ' + liked.join(', ') : 'LIKED PIECES: none yet'
    ].join('\n');
  }

  async function askLLM(userText, profile) {
    const messages = [
      { role: 'system', content: buildSystemPrompt(profile) },
      ...history.slice(-HISTORY_LIMIT),
      { role: 'user', content: userText }
    ];
    return chatCompletion(messages);
  }

  /* ==========================================================
     7. PUBLIC reply() — rules first, LLM second, canned last
     ========================================================== */
  async function reply(text) {
    const profile = Store.profile();

    let answer = ruleReply(text, profile);

    if (answer === null) {
      if (!KeyPool.size()) {
        answer = cannedFallback();
      } else {
        try {
          answer = await askLLM(text, profile);
        } catch (err) {
          console.warn('[JAP] OpenRouter unavailable, using rule fallback:', err.message);
          answer = cannedFallback();
        }
      }
    }

    history.push({ role: 'user', content: text });
    history.push({ role: 'assistant', content: answer });
    if (history.length > HISTORY_LIMIT * 2) history.splice(0, history.length - HISTORY_LIMIT * 2);

    return answer;
  }

  /* ==========================================================
     8. UI — unchanged look & feel
     ========================================================== */
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
    let sending = false;

    function addMsg(text, who) {
      const m = document.createElement('div');
      m.className = 'chat-msg ' + who;
      m.textContent = text;
      body.appendChild(m);
      body.scrollTop = body.scrollHeight;
      return m;
    }

    async function send() {
      const val = input.value.trim();
      if (!val || sending) return;
      sending = true;

      addMsg(val, 'user');
      input.value = '';

      const bubble = addMsg('\u2026', 'bot');
      bubble.classList.add('typing');

      const started = Date.now();
      let answer;
      try {
        answer = await reply(val);
      } catch (err) {
        console.warn('[JAP] reply failed:', err);
        answer = cannedFallback();
      }

      // keep the original ~450ms "thinking" feel for instant rule answers
      const wait = Math.max(0, 350 - (Date.now() - started));
      if (wait) await new Promise(r => setTimeout(r, wait));

      bubble.classList.remove('typing');
      bubble.textContent = answer;
      body.scrollTop = body.scrollHeight;
      sending = false;
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

  return { init, reply, reloadKeys: KeyPool.reload };
})();

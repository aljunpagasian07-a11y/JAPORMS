
/* ==========================================
   JAPORMS — localStorage persistence layer
   ========================================== */
const Store = {
  get(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v === null || v === undefined ? fallback : v; }
    catch (e) { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  profile()        { return this.get('japorms_profile', null); },
  saveProfile(p)   { this.set('japorms_profile', p); },
  clearProfile()   { localStorage.removeItem('japorms_profile'); },

  liked()          { return this.get('japorms_liked', []); },
  rejected()       { return this.get('japorms_rejected', []); },
  purchased()      { return this.get('japorms_purchased', []); },
  retrievesUsed()  { return this.get('japorms_retrieves_used', 0); },
  subscribed()     { return this.get('japorms_subscribed', false); },

  like(id)     { const l = this.liked();     if (!l.includes(id)) { l.push(id);     this.set('japorms_liked', l); } },
  reject(id)   { const r = this.rejected();  if (!r.includes(id)) { r.push(id);     this.set('japorms_rejected', r); } },
  unreject(id) { this.set('japorms_rejected', this.rejected().filter(x => x !== id)); },
  removeLike(id) { this.set('japorms_liked', this.liked().filter(x => x !== id)); },
  purchase(id) { const p = this.purchased(); if (!p.includes(id)) { p.push(id);     this.set('japorms_purchased', p); } },
  useRetrieve()  { this.set('japorms_retrieves_used', this.retrievesUsed() + 1); },
  setSubscribed(v) { this.set('japorms_subscribed', !!v); },

  remainingItems() {
    const l = this.liked(), r = this.rejected();
    return JAPORMS_DATA.filter(i => !l.includes(i.id) && !r.includes(i.id));
  },
  resetHistory() {
    localStorage.removeItem('japorms_liked');
    localStorage.removeItem('japorms_rejected');
  },
};

/* Small toast helper used across pages */
function showToast(message) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}


/* ==========================================
   JAPORMS — rejected fits page
   Free plan: retrieve up to 3 pieces.
   Pro subscription: unlimited retrieves.
   ========================================== */
const RETRIEVE_LIMIT = 3;

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('itemsGrid');
  const countEl = document.getElementById('retrieveCount');

  function updateCount() {
    const used = Store.retrievesUsed();
    const subscribed = Store.subscribed();
    if (subscribed) {
      countEl.innerHTML = 'Retrieves used: <b>' + used + '</b> · <b style="color:#22d3ee;">Pro plan \u2014 unlimited retrieves</b>';
    } else {
      const left = Math.max(0, RETRIEVE_LIMIT - used);
      countEl.innerHTML = 'Free retrieves left: <b>' + left + ' of ' + RETRIEVE_LIMIT + '</b>' + (left === 0 ? ' \u2014 upgrade to Pro for unlimited' : '');
    }
  }

  function render() {
    const rejected = Store.rejected().map(id => JAPORMS_DATA.find(i => i.id === id)).filter(Boolean);
    const subscribed = Store.subscribed();
    const left = Math.max(0, RETRIEVE_LIMIT - Store.retrievesUsed());
    grid.innerHTML = '';
    updateCount();

    if (!rejected.length) {
      grid.innerHTML = '<div class="deck-empty" style="position:static;grid-column:1/-1;">' +
        '<h3>No rejected fits</h3><p>Pieces you swipe left on will show up here, in case you change your mind.</p>' +
        '<a class="btn btn-primary" href="index.html">Start Swiping</a></div>';
      return;
    }

    rejected.forEach(item => {
      const locked = !subscribed && left <= 0;
      const card = document.createElement('div');
      card.className = 'item-card';
      card.style.setProperty('--art1', item.colors[0]);
      card.style.setProperty('--art2', item.colors[1]);
      card.innerHTML =
        '<div class="item-art">' + artFor(item) + '</div>' +
        '<div class="item-info">' +
          '<div class="fit-name-row"><h3>' + item.name + '</h3><span class="fit-price">$' + item.price + '</span></div>' +
          '<div class="fit-meta"><span class="fit-tag ' + item.fit + '">' + item.fit.toUpperCase() + '</span>' +
          '<span class="fit-sizes">sizes ' + item.sizes.join(' / ') + '</span></div>' +
          '<p class="fit-measure">chest ' + item.chest + 'cm · length ' + item.length + 'cm</p>' +
          '<div class="item-actions">' +
            '<button class="btn btn-primary retrieve-btn"' + (locked ? ' disabled' : '') + '>' +
              (locked ? 'Retrieve Locked' : 'Retrieve') + '</button>' +
          '</div>' +
        '</div>';
      card.querySelector('.retrieve-btn').addEventListener('click', () => {
        if (locked) return;
        Store.unreject(item.id);
        if (!Store.subscribed()) Store.useRetrieve();
        showToast(item.name + ' retrieved \u2014 it\u2019s back in your deck');
        render();
      });
      grid.appendChild(card);
    });

    if (locked && !subscribed) {
      const lock = document.createElement('div');
      lock.className = 'sub-lock';
      lock.style.gridColumn = '1 / -1';
      lock.innerHTML =
        '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' +
        '<h3>Out of free retrieves</h3>' +
        '<p>You\u2019ve used all ' + RETRIEVE_LIMIT + ' free retrieves. Upgrade to Pro to bring back unlimited rejected fits.</p>' +
        '<a class="btn btn-primary" href="index.html#pricing">Upgrade to Pro</a>';
      grid.appendChild(lock);
    }
  }

  render();
});


/* ==========================================
   JAPORMS — liked fits page
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('itemsGrid');

  function render() {
    const liked = Store.liked().map(id => JAPORMS_DATA.find(i => i.id === id)).filter(Boolean);
    const purchased = Store.purchased();
    grid.innerHTML = '';

    if (!liked.length) {
      grid.innerHTML = '<div class="deck-empty" style="position:static;grid-column:1/-1;">' +
        '<h3>No liked fits yet</h3><p>Swipe right on pieces you love and they\u2019ll land here.</p>' +
        '<a class="btn btn-primary" href="index.html">Start Swiping</a></div>';
      return;
    }

    liked.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';
      card.style.setProperty('--art1', item.colors[0]);
      card.style.setProperty('--art2', item.colors[1]);
      const isBought = purchased.includes(item.id);
      card.innerHTML =
        '<div class="item-art">' + artFor(item) + '</div>' +
        '<div class="item-info">' +
          '<div class="fit-name-row"><h3>' + item.name + '</h3><span class="fit-price">$' + item.price + '</span></div>' +
          '<div class="fit-meta"><span class="fit-tag ' + item.fit + '">' + item.fit.toUpperCase() + '</span>' +
          '<span class="fit-sizes">sizes ' + item.sizes.join(' / ') + '</span></div>' +
          '<p class="fit-measure">chest ' + item.chest + 'cm · length ' + item.length + 'cm</p>' +
          '<div class="item-actions">' +
            '<button class="btn ' + (isBought ? 'btn-secondary' : 'btn-primary') + ' buy-btn"' + (isBought ? ' disabled' : '') + '>' +
              (isBought ? 'Purchased \u2713' : 'Purchase') + '</button>' +
            '<button class="btn btn-outline remove-btn">Remove</button>' +
          '</div>' +
        '</div>';
      card.querySelector('.buy-btn').addEventListener('click', () => {
        if (confirm('Purchase "' + item.name + '" for $' + item.price + '?')) {
          Store.purchase(item.id);
          showToast('Order placed \u2014 ' + item.name + ' is on its way');
          render();
        }
      });
      card.querySelector('.remove-btn').addEventListener('click', () => {
        Store.removeLike(item.id);
        showToast(item.name + ' removed from Liked');
        render();
      });
      grid.appendChild(card);
    });
  }

  render();
});

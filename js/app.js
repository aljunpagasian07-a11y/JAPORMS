
/* ==========================================
   JAPORMS — home page logic
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {

  // --- MOBILE HAMBURGER MENU TOGGLE ---
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  menuToggle.addEventListener('click', () => {
    const isActive = mobileMenu.classList.toggle('active');
    const spans = menuToggle.querySelectorAll('span');
    if (isActive) {
      spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
    } else {
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
  });
  mobileLinks.forEach(link => link.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    const spans = menuToggle.querySelectorAll('span');
    spans[0].style.transform = 'none'; spans[1].style.opacity = '1'; spans[2].style.transform = 'none';
  }));

  // --- HEADER PROFILE STATE ---
  const authSlot = document.getElementById('authSlot');
  const profile = Store.profile();
  if (profile && authSlot) {
    authSlot.innerHTML =
      '<span class="profile-chip"><span class="mini-avatar"></span>' + profile.name.split(' ')[0] +
      ' · ' + profile.height + 'cm / ' + profile.width + 'cm</span>' +
      '<button class="btn-signin" id="signOutBtn">Sign Out</button>';
    document.getElementById('signOutBtn').addEventListener('click', () => {
      if (confirm('Sign out of JAPORMS?')) { Store.clearProfile(); location.reload(); }
    });
  }

  // --- SWIPE DECK (replaces the dashboard preview) ---
  const deckMount = document.getElementById('swipeStack');
  const counters = document.getElementById('swipeCounters');
  function refreshCounters() {
    if (!counters) return;
    counters.querySelector('#likedCount').textContent = Store.liked().length;
    counters.querySelector('#rejectedCount').textContent = Store.rejected().length;
  }
  if (deckMount) {
    SwipeDeck.init(deckMount, { onDecision: (id, dir) => {
      const item = JAPORMS_DATA.find(i => i.id === id);
      showToast(dir === 'right' ? '\u2665 ' + item.name + ' added to Liked' : '\u2715 ' + item.name + ' moved to Rejected');
      refreshCounters();
    }});
    refreshCounters();
    document.getElementById('btnLike').addEventListener('click', () => SwipeDeck.likeTop());
    document.getElementById('btnNope').addEventListener('click', () => SwipeDeck.nopeTop());
  }

  // --- PRICING TOGGLE (monthly / annually) ---
  const billingToggle = document.getElementById('billingToggle');
  const priceStarter = document.getElementById('priceStarter');
  const pricePro = document.getElementById('pricePro');
  const billingMonthlyLabel = document.getElementById('billingMonthly');
  const billingAnnuallyLabel = document.getElementById('billingAnnually');

  function animatePrice(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      element.innerHTML = Math.floor(progress * (end - start) + start);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  billingToggle.addEventListener('change', () => {
    const isAnnual = billingToggle.checked;
    billingAnnuallyLabel.classList.toggle('active', isAnnual);
    billingMonthlyLabel.classList.toggle('active', !isAnnual);
    animatePrice(priceStarter, isAnnual ? 19 : 15, isAnnual ? 15 : 19, 300);
    animatePrice(pricePro, isAnnual ? 49 : 39, isAnnual ? 39 : 49, 300);
  });
  billingMonthlyLabel.addEventListener('click', () => {
    if (billingToggle.checked) { billingToggle.checked = false; billingToggle.dispatchEvent(new Event('change')); }
  });
  billingAnnuallyLabel.addEventListener('click', () => {
    if (!billingToggle.checked) { billingToggle.checked = true; billingToggle.dispatchEvent(new Event('change')); }
  });

  // --- PRO PLAN = subscription (unlocks unlimited retrieves) ---
  const proBtn = document.getElementById('proPlanBtn');
  if (proBtn) {
    proBtn.addEventListener('click', () => {
      Store.setSubscribed(true);
      showToast('Pro activated \u2014 unlimited retrieves unlocked');
      proBtn.textContent = 'Pro Active \u2713';
      proBtn.disabled = true;
    });
    if (Store.subscribed()) { proBtn.textContent = 'Pro Active \u2713'; proBtn.disabled = true; }
  }

  // --- FAQ ACCORDION ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const button = item.querySelector('.faq-question-btn');
    const answer = item.querySelector('.faq-answer');
    button.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => { i.classList.remove('active'); i.querySelector('.faq-answer').style.maxHeight = '0'; });
      if (!isActive) { item.classList.add('active'); answer.style.maxHeight = answer.scrollHeight + 'px'; }
    });
  });

  // --- AI ASSISTANT ---
  Assistant.init();
});

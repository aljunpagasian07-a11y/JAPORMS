
/* ==========================================
   JAPORMS — signup / profile setup
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  const errorBox = document.getElementById('formError');

  function showError(msg) { errorBox.textContent = msg; errorBox.classList.add('show'); }
  function clearError() { errorBox.classList.remove('show'); }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const height = parseFloat(form.height.value);
    const width = parseFloat(form.width.value);

    const baggy = [...form.querySelectorAll('input[name="baggy"]:checked')].map(i => i.value);
    const fitted = [...form.querySelectorAll('input[name="fitted"]:checked')].map(i => i.value);

    if (!name || !email || !password) return showError('Please fill in your name, email, and password.');
    if (!email.includes('@')) return showError('Please enter a valid email address.');
    if (password.length < 6) return showError('Password must be at least 6 characters.');
    if (!height || height < 100 || height > 250) return showError('Height must be between 100\u2013250 cm.');
    if (!width || width < 40 || width > 200) return showError('Width (chest) must be between 40\u2013200 cm.');
    if (!baggy.length && !fitted.length) return showError('Pick at least one size in Baggy or Fitted categories \u2014 that\u2019s how the AI matches you.');

    Store.saveProfile({ name, email, height, width, categories: { baggy, fitted }, createdAt: Date.now() });
    showToast('Profile created \u2014 welcome to JAPORMS');
    setTimeout(() => { window.location.href = 'index.html'; }, 700);
  });
});

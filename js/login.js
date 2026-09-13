/* ==========================================
   JAPORMS — login (Firebase Auth)
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('formError');
  const loginBtn = document.getElementById('loginBtn');
  const forgotLink = document.getElementById('forgotPassword');
  const toastEl = document.getElementById('toast');

  function showError(msg) { errorBox.textContent = msg; errorBox.classList.add('show'); }
  function clearError() { errorBox.classList.remove('show'); }

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function friendlyAuthError(err) {
    switch (err.code) {
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'Incorrect email or password.';
      case 'auth/too-many-requests': return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/user-disabled': return 'This account has been disabled.';
      default: return 'Something went wrong logging you in. Please try again.';
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();

    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) return showError('Please enter your email and password.');
    if (!email.includes('@')) return showError('Please enter a valid email address.');

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    auth.signInWithEmailAndPassword(email, password)
      .then((cred) => {
        // Bridge for index.html's existing lock-check logic: pull this user's
        // profile from Firestore and mirror it into localStorage via Store,
        // in case this browser never had it (e.g. logging in on a new device).
        return db.collection('profiles').doc(cred.user.uid).get().then((doc) => {
          if (doc.exists) {
            const data = doc.data();
            Store.saveProfile({
              name: data.name, email: data.email, height: data.height,
              width: data.width, categories: data.categories, createdAt: Date.now()
            });
          }
        });
      })
      .then(() => {
        showToast('Welcome back — logging you in');
        setTimeout(() => { window.location.href = 'index.html'; }, 600);
      })
      .catch((err) => {
        showError(friendlyAuthError(err));
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
      });
  });

  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    clearError();
    const email = form.email.value.trim();
    if (!email || !email.includes('@')) {
      return showError('Enter your email above first, then click "Forgot password?" to get a reset link.');
    }
    auth.sendPasswordResetEmail(email)
      .then(() => showToast('Password reset email sent — check your inbox'))
      .catch((err) => showError(friendlyAuthError(err)));
  });

  auth.onAuthStateChanged((user) => {
    if (user) {
   
    }
  });
});

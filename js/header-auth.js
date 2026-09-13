/* ==========================================
   JAPORMS — shared header auth state
   Shows the profile chip + Sign Out button
   when logged in. Used on every page that
   has the #authSlot header (index, liked,
   rejected). Requires Store (storage.js) and
   auth (firebase-init.js) to already be loaded.
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  const authSlot = document.getElementById('authSlot');
  const profile = Store.profile();
  if (!profile || !authSlot) return;

  authSlot.innerHTML =
    '<span class="profile-chip"><span class="mini-avatar"></span>' + profile.name.split(' ')[0] +
    ' · ' + profile.height + 'cm / ' + profile.width + 'cm</span>' +
    '<button class="btn-signin" id="signOutBtn">Sign Out</button>';

  document.getElementById('signOutBtn').addEventListener('click', () => {
    if (!confirm('Sign out of JAPORMS?')) return;
    // Sign out of Firebase first (source of truth for auth state), then clear
    // the local mirror either way so the UI updates even if offline.
    auth.signOut()
      .catch((err) => console.error('Firebase sign-out failed:', err))
      .finally(() => {
        Store.clearProfile();
        location.reload();
      });
  });
});

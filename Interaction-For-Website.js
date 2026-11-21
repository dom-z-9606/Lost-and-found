/* Login page logic (login.html) */
document.addEventListener('DOMContentLoaded', function () {
  // Already logged in? Go straight to the site.
  if (Auth.getCurrentUser()) {
    location.replace(safeNextPage());
    return;
  }

  document.getElementById('authBrand').insertAdjacentHTML('afterbegin', icon('backpack'));

  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      errorBox.textContent = 'Please enter your email and password.';
      errorBox.hidden = false;
      return;
    }

    const result = Auth.login(email, password);
    if (!result.success) {
      errorBox.textContent = result.message;
      errorBox.hidden = false;
      form.password.value = '';
      form.password.focus();
      return;
    }

    location.href = safeNextPage();
  });
});

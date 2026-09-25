(function () {
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone && window.location.pathname === '/') {
    window.location.replace('/spela');
    return;
  }

  var PREVIEW_SESSION_KEY = 'bandy-manager-preview';
  var PREVIEW_PASSWORD_HASH = 'e6444ff9b3873b7a2424125e3e5a0ff2cebfe4ad72768e35baa4acb2fa0734dd';
  var loginForm = document.getElementById('preview-login');
  var loginMessage = document.getElementById('preview-login-msg');

  function unlockPreview() {
    document.body.classList.remove('preview-locked');
    var gate = document.getElementById('preview-gate');
    if (gate) gate.setAttribute('hidden', '');
  }

  function hashText(value) {
    return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then(function (buffer) {
      return Array.prototype.map.call(new Uint8Array(buffer), function (byte) {
        return byte.toString(16).padStart(2, '0');
      }).join('');
    });
  }

  try {
    if (window.sessionStorage.getItem(PREVIEW_SESSION_KEY) === 'open') unlockPreview();
  } catch (_) {}

  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = loginForm.querySelector('input[name=password]');
      var button = loginForm.querySelector('button');
      if (!input || !button) return;
      var password = input.value || '';
      button.disabled = true;
      if (loginMessage) loginMessage.textContent = '';
      hashText(password)
        .then(function (hash) {
          if (hash !== PREVIEW_PASSWORD_HASH) {
            if (loginMessage) loginMessage.textContent = 'Den koden öppnar inte dörren.';
            input.select();
            return;
          }
          try { window.sessionStorage.setItem(PREVIEW_SESSION_KEY, 'open'); } catch (_) {}
          unlockPreview();
          window.scrollTo(0, 0);
        })
        .catch(function () {
          if (loginMessage) loginMessage.textContent = 'Det gick inte att kontrollera koden. Försök igen.';
        })
        .then(function () { button.disabled = false; });
    });
  }

  var WAITLIST_URL = window.__WAITLIST_URL__ || '/api/beta/waitlist';
  Array.prototype.forEach.call(document.querySelectorAll('form[data-waitlist]'), function (form) {
    var msg = form.parentElement.querySelector('.msg');
    var input = form.querySelector('input[name=email]');
    var button = form.querySelector('button');
    if (!msg || !input || !button) return;

    function say(text, cls) {
      msg.textContent = text;
      msg.className = 'msg ' + (cls || '');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        say('Det där blev ingen adress. Kolla en gång till.', 'err');
        input.focus();
        return;
      }

      button.disabled = true;
      say('');
      fetch(WAITLIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      })
        .then(function (response) {
          if (!response.ok) throw new Error('http ' + response.status);
          say('Du står i kö. Vi mejlar när det finns plats, och det är det enda vi mejlar.', 'ok');
          form.reset();
        })
        .catch(function () {
          say('Kön går inte att nå just nu. Prova igen om en stund.', 'err');
        })
        .then(function () {
          button.disabled = false;
        });
    });
  });
})();

(function () {
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone && window.location.pathname === '/') {
    window.location.replace('/spela');
    return;
  }

  var WAITLIST_URL = window.__WAITLIST_URL__ || '/api/beta/waitlist';
  var form = document.getElementById('waitlist');
  var msg = document.getElementById('msg');
  if (!form || !msg) return;
  var input = form.querySelector('input[name=email]');
  var button = form.querySelector('button');
  if (!input || !button) return;

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
        if (response.status === 409) {
          say('Den adressen står redan i kön. Vi hör av oss.', 'ok');
          return;
        }
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
})();

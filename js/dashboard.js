/**
 * dashboard.js
 * Comportamento do dashboard (dashboard.html).
 *
 * Protege a página exigindo uma sessão ativa (`vero_session` em
 * sessionStorage), preenche a interface com os dados do usuário
 * autenticado e cuida do logout — inclusive quando o usuário tenta
 * voltar para o dashboard pelo histórico do navegador depois de sair.
 */

/** Garante que só se acessa o dashboard com sessão válida. Redireciona quando não há. */
function requireSession() {
  const session = getSession();
  if (!session) {
    window.location.replace('index.html');
    return null;
  }
  return session;
}

/** Gera as iniciais para o avatar a partir do nome completo. */
function getInitials(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Formata uma data ISO no padrão "19 de agosto de 2026". */
function formatDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Preenche a interface com os dados do usuário da sessão atual. */
function renderUser(session) {
  const fullUser = findUserById(session.userId);
  const nome = session.nome || (fullUser && fullUser.nome) || 'Usuário';
  const email = session.email || (fullUser && fullUser.email) || '—';

  const avatarEl = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-name');
  const emailEl = document.getElementById('user-email');
  const welcomeNameEl = document.getElementById('welcome-name');
  const accountEmailEl = document.getElementById('account-email');
  const accountCreatedEl = document.getElementById('account-created');

  if (avatarEl) avatarEl.textContent = getInitials(nome);
  if (nameEl) nameEl.textContent = nome;
  if (emailEl) emailEl.textContent = email;
  if (welcomeNameEl) welcomeNameEl.textContent = nome;
  if (accountEmailEl) accountEmailEl.textContent = email;
  if (accountCreatedEl) {
    accountCreatedEl.textContent = fullUser ? formatDate(fullUser.dataCadastro) : '—';
  }
}

// Verifica a sessão assim que o script roda (o dashboard não deve
// nem começar a ser preenchido sem uma sessão válida).
const currentSession = requireSession();

if (currentSession) {
  renderUser(currentSession);

  document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');
    if (!logoutButton) return;

    logoutButton.addEventListener('click', async () => {
      setButtonLoading(logoutButton, true, 'Saindo...');
      await simulateRequest(500);
      clearSession();
      window.location.href = 'index.html';
    });
  });
}

// Se o usuário voltar para esta página pelo histórico do navegador
// (ex.: botão "voltar" após logout), o navegador pode restaurar a
// versão em cache (bfcache) sem recarregar o script. Neste caso,
// confere a sessão novamente e redireciona se necessário.
window.addEventListener('pageshow', (event) => {
  if (event.persisted && !getSession()) {
    window.location.replace('index.html');
  }
});
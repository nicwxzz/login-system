/**
 * main.js
 * Utilitários compartilhados entre as telas do sistema VERO.
 * Nenhuma lógica de autenticação real é implementada aqui —
 * apenas comportamento de interface (validação visual, estados,
 * feedback). A integração com um backend real fica para depois.
 */

/* -------------------------------------------------------------------- */
/* Alternar visibilidade de senha                                        */
/* -------------------------------------------------------------------- */
function initPasswordToggles(scope = document) {
  scope.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-toggle-password');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isVisible = input.type === 'text';
      input.type = isVisible ? 'password' : 'text';
      button.setAttribute('aria-pressed', String(!isVisible));
      button.setAttribute(
        'aria-label',
        isVisible ? 'Mostrar senha' : 'Ocultar senha'
      );
    });
  });
}

/* -------------------------------------------------------------------- */
/* Validação de campos                                                  */
/* -------------------------------------------------------------------- */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setFieldState(fieldEl, state, message = '') {
  const messageEl = fieldEl.querySelector('.field-message');
  fieldEl.classList.remove('is-error', 'is-success');

  if (state === 'error') {
    fieldEl.classList.add('is-error');
  } else if (state === 'success') {
    fieldEl.classList.add('is-success');
  }

  if (messageEl) {
    messageEl.classList.remove('error', 'success', 'hint');
    messageEl.textContent = message;
    if (state === 'error') messageEl.classList.add('error');
    if (state === 'success') messageEl.classList.add('success');

    const input = fieldEl.querySelector('.input');
    if (input) {
      input.setAttribute('aria-invalid', state === 'error' ? 'true' : 'false');
    }
  }
}

function clearFieldState(fieldEl) {
  setFieldState(fieldEl, 'default', '');
}

/* -------------------------------------------------------------------- */
/* Toast de feedback (substitui alert/confirm/prompt)                   */
/* -------------------------------------------------------------------- */
function ensureToastEl() {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  return toast;
}

let toastTimer = null;

function showToast(message, type = 'default') {
  const toast = ensureToastEl();
  toast.classList.remove('is-success', 'is-error');
  if (type === 'success') toast.classList.add('is-success');
  if (type === 'error') toast.classList.add('is-error');

  toast.textContent = message;
  toast.classList.add('is-visible');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 3600);
}

/* -------------------------------------------------------------------- */
/* Estado de carregamento em botões                                     */
/* -------------------------------------------------------------------- */
function setButtonLoading(button, isLoading, loadingText) {
  if (!button) return;
  const labelEl = button.querySelector('.btn-label');

  if (isLoading) {
    if (labelEl) {
      if (!button.dataset.defaultLabel) {
        button.dataset.defaultLabel = labelEl.textContent;
      }
      if (loadingText) labelEl.textContent = loadingText;
    }
    button.dataset.loading = 'true';
    button.disabled = true;
  } else {
    if (labelEl && button.dataset.defaultLabel) {
      labelEl.textContent = button.dataset.defaultLabel;
    }
    button.dataset.loading = 'false';
    button.disabled = false;
  }
}

/* -------------------------------------------------------------------- */
/* Simulação de requisição assíncrona (placeholder até haver backend)   */
/* -------------------------------------------------------------------- */
function simulateRequest(delay = 900) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/* -------------------------------------------------------------------- */
/* Armazenamento de usuários (localStorage)                             */
/* IMPORTANTE: isto é uma simulação para fins educacionais. Senhas em   */
/* texto puro no localStorage NÃO são uma prática segura de produção —  */
/* quando houver um backend real, esta camada deve ser substituída por  */
/* chamadas de API com hashing de senha no servidor.                    */
/* -------------------------------------------------------------------- */
const USERS_STORAGE_KEY = 'vero_users';
const SESSION_STORAGE_KEY = 'vero_session';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function generateUserId() {
  return `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Confirma que um registro tem exatamente o formato de usuário esperado. */
function isValidUserRecord(user) {
  return Boolean(
    user &&
    typeof user === 'object' &&
    typeof user.id === 'string' &&
    typeof user.nome === 'string' &&
    typeof user.email === 'string' &&
    typeof user.senha === 'string' &&
    typeof user.dataCadastro === 'string'
  );
}

/**
 * Lê os usuários salvos. Registros antigos ou corrompidos (de versões
 * anteriores do projeto, por exemplo) são descartados automaticamente
 * em vez de quebrar a aplicação ou vazar para a interface.
 */
function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    const validUsers = parsed.filter(isValidUserRecord);
    if (validUsers.length !== parsed.length) {
      // Regrava só os registros válidos, limpando dados legados.
      saveUsers(validUsers);
    }
    return validUsers;
  } catch (err) {
    return [];
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch (err) {
    return false;
  }
}

function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  return getUsers().find((user) => user.email === normalized) || null;
}

function findUserById(id) {
  return getUsers().find((user) => user.id === id) || null;
}

function createUser({ nome, email, senha }) {
  const users = getUsers();
  const newUser = {
    id: generateUserId(),
    nome: String(nome || '').trim(),
    email: normalizeEmail(email),
    senha,
    dataCadastro: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

/* -------------------------------------------------------------------- */
/* Sessão do usuário autenticado (sessionStorage)                       */
/* A senha nunca é armazenada aqui — apenas dados de identificação.     */
/* -------------------------------------------------------------------- */
function createSession(user) {
  try {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ userId: user.id, email: user.email, nome: user.nome })
    );
    return true;
  } catch (err) {
    return false;
  }
}

/** Confirma que a sessão salva tem exatamente o formato esperado. */
function isValidSessionRecord(session) {
  return Boolean(
    session &&
    typeof session === 'object' &&
    typeof session.userId === 'string' &&
    typeof session.email === 'string' &&
    typeof session.nome === 'string'
  );
}

/**
 * Lê a sessão atual. Se o conteúdo salvo não tiver exatamente o formato
 * esperado (por exemplo, restos de uma versão anterior do projeto), a
 * sessão é descartada e tratada como "não autenticado" em vez de vazar
 * dados incorretos para a interface.
 */
function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!isValidSessionRecord(parsed)) {
      clearSession();
      return null;
    }

    // A sessão só é válida se o usuário que ela referencia ainda existir.
    if (!findUserById(parsed.userId)) {
      clearSession();
      return null;
    }

    return parsed;
  } catch (err) {
    clearSession();
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    /* nada a fazer se o navegador bloquear o acesso ao storage */
  }
}

/**
 * Utilitário de desenvolvimento: apaga todos os usuários e a sessão
 * atual. Não é chamado automaticamente em nenhum lugar — serve para
 * limpar dados de teste manualmente pelo console do navegador durante
 * o desenvolvimento, ex.: `resetVeroStorage()`.
 */
function resetVeroStorage() {
  try {
    localStorage.removeItem(USERS_STORAGE_KEY);
  } catch (err) {
    /* ignorado */
  }
  clearSession();
}

/* -------------------------------------------------------------------- */
/* Links estáticos (ex.: termos de uso) sem destino ainda                */
/* -------------------------------------------------------------------- */
function initStaticLinks(scope = document) {
  scope.querySelectorAll('[data-static-link]').forEach((link) => {
    link.addEventListener('click', (event) => event.preventDefault());
  });
}

/* Inicializa comportamentos comuns presentes em qualquer página */
document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initStaticLinks();
});
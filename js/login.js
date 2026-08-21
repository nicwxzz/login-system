/**
 * login.js
 * Comportamento da tela de login (index.html).
 *
 * Fluxo: valida os campos, procura o usuário em `vero_users`
 * (localStorage), compara a senha e, se tudo estiver correto, cria uma
 * sessão em `vero_session` (sessionStorage) e redireciona para o
 * dashboard. Nunca envia o formulário pelo navegador (sempre
 * `event.preventDefault()`), então e-mail e senha nunca aparecem na URL.
 */

// Se já existir uma sessão válida, não faz sentido mostrar a tela de
// login de novo — manda direto para o dashboard.
if (getSession()) {
  window.location.replace('dashboard.html');
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (!form) return;

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitButton = document.getElementById('login-submit');
  const emailField = document.getElementById('field-email');
  const passwordField = document.getElementById('field-password');

  emailInput.addEventListener('input', () => clearFieldState(emailField));
  passwordInput.addEventListener('input', () => clearFieldState(passwordField));

  const forgotLink = document.querySelector('[data-forgot-password]');
  if (forgotLink) {
    forgotLink.addEventListener('click', (event) => {
      event.preventDefault();
      showToast('Em breve: recuperação de senha por e-mail.');
    });
  }

  /** Valida formato dos campos. Não checa credenciais aqui. */
  function validateFields() {
    let isValid = true;

    const emailValue = emailInput.value.trim();
    if (!emailValue) {
      setFieldState(emailField, 'error', 'Digite seu e-mail.');
      isValid = false;
    } else if (!EMAIL_PATTERN.test(emailValue)) {
      setFieldState(emailField, 'error', 'Digite um e-mail válido.');
      isValid = false;
    } else {
      clearFieldState(emailField);
    }

    const passwordValue = passwordInput.value;
    if (!passwordValue) {
      setFieldState(passwordField, 'error', 'Digite sua senha.');
      isValid = false;
    } else if (passwordValue.length < 8) {
      setFieldState(passwordField, 'error', 'A senha deve ter pelo menos 8 caracteres.');
      isValid = false;
    } else {
      clearFieldState(passwordField);
    }

    return isValid;
  }

  form.addEventListener('submit', async (event) => {
    // Garante que o formulário nunca seja enviado pelo navegador
    // (o que colocaria e-mail/senha na URL via GET).
    event.preventDefault();

    if (!validateFields()) {
      showToast('Verifique os campos destacados.', 'error');
      return;
    }

    setButtonLoading(submitButton, true, 'Entrando...');

    try {
      await simulateRequest();

      const user = findUserByEmail(emailInput.value);
      const credentialsAreValid = Boolean(user) && user.senha === passwordInput.value;

      if (!credentialsAreValid) {
        setFieldState(emailField, 'error', '');
        setFieldState(passwordField, 'error', 'E-mail ou senha incorretos.');
        showToast('E-mail ou senha incorretos.', 'error');
        passwordInput.focus();
        return;
      }

      const sessionCreated = createSession(user);
      if (!sessionCreated) {
        showToast('Não foi possível iniciar sua sessão neste navegador.', 'error');
        return;
      }

      setFieldState(emailField, 'success');
      setFieldState(passwordField, 'success');
      showToast('Login realizado. Redirecionando…', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } catch (err) {
      showToast('Ocorreu um erro inesperado. Tente novamente.', 'error');
    } finally {
      setButtonLoading(submitButton, false);
    }
  });
});
/**
 * cadastro.js
 * Comportamento da tela de cadastro (cadastro.html).
 *
 * Valida os campos, impede e-mail duplicado e, se tudo estiver certo,
 * grava o usuário em `vero_users` (localStorage) e redireciona para o
 * login. Não faz login automático nesta versão.
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  if (!form) return;

  const nameField = document.getElementById('field-name');
  const emailField = document.getElementById('field-email');
  const passwordField = document.getElementById('field-password');
  const confirmField = document.getElementById('field-confirm');

  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm-password');
  const termsInput = document.getElementById('terms');
  const submitButton = document.getElementById('signup-submit');

  // Indicador de força de senha e checklist de requisitos são opcionais:
  // só são usados se os elementos existirem na página.
  const strengthEl = document.getElementById('password-strength');
  const strengthLabelEl = document.getElementById('strength-label');
  const requirementEls = document.querySelectorAll('[data-requirement]');

  const requirementCheckers = {
    length: (value) => value.length >= 8,
    upper: (value) => /[A-Z]/.test(value),
    number: (value) => /[0-9]/.test(value),
    special: (value) => /[^A-Za-z0-9]/.test(value),
  };

  /** Atualiza o indicador visual de força (se existir) e retorna quantos requisitos foram atendidos. */
  function evaluatePassword(value) {
    let metCount = 0;

    requirementEls.forEach((el) => {
      const key = el.getAttribute('data-requirement');
      const isMet = requirementCheckers[key] ? requirementCheckers[key](value) : false;
      el.classList.toggle('met', isMet);
      if (isMet) metCount += 1;
    });

    if (strengthEl && strengthLabelEl) {
      let level = 0;
      let label = 'Digite uma senha';

      if (value.length === 0) {
        level = 0;
        label = 'Digite uma senha';
      } else if (metCount <= 1) {
        level = 1;
        label = 'Fraca';
      } else if (metCount === 2) {
        level = 2;
        label = 'Razoável';
      } else if (metCount === 3) {
        level = 3;
        label = 'Boa';
      } else {
        level = 4;
        label = 'Forte';
      }

      strengthEl.setAttribute('data-level', String(level));
      strengthLabelEl.textContent = label;
    }

    return metCount;
  }

  passwordInput.addEventListener('input', () => {
    clearFieldState(passwordField);
    evaluatePassword(passwordInput.value);
  });

  nameInput.addEventListener('input', () => clearFieldState(nameField));
  emailInput.addEventListener('input', () => clearFieldState(emailField));
  confirmInput.addEventListener('input', () => clearFieldState(confirmField));

  function validateFields() {
    let isValid = true;

    if (!nameInput.value.trim()) {
      setFieldState(nameField, 'error', 'Informe seu nome completo.');
      isValid = false;
    } else {
      clearFieldState(nameField);
    }

    const emailValue = emailInput.value.trim();
    if (!emailValue) {
      setFieldState(emailField, 'error', 'Informe seu e-mail.');
      isValid = false;
    } else if (!EMAIL_PATTERN.test(emailValue)) {
      setFieldState(emailField, 'error', 'Digite um e-mail válido.');
      isValid = false;
    } else if (findUserByEmail(emailValue)) {
      setFieldState(emailField, 'error', 'Este e-mail já está cadastrado.');
      isValid = false;
    } else {
      clearFieldState(emailField);
    }

    const metCount = evaluatePassword(passwordInput.value);
    if (!passwordInput.value) {
      setFieldState(passwordField, 'error', 'Crie uma senha.');
      isValid = false;
    } else if (metCount < 3) {
      setFieldState(passwordField, 'error', 'Sua senha ainda não atende aos requisitos mínimos.');
      isValid = false;
    } else {
      clearFieldState(passwordField);
    }

    if (!confirmInput.value) {
      setFieldState(confirmField, 'error', 'Confirme sua senha.');
      isValid = false;
    } else if (confirmInput.value !== passwordInput.value) {
      setFieldState(confirmField, 'error', 'As senhas não coincidem.');
      isValid = false;
    } else {
      clearFieldState(confirmField);
    }

    if (!termsInput.checked) {
      showToast('Você precisa aceitar os termos de uso para continuar.', 'error');
      isValid = false;
    }

    return isValid;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateFields()) {
      showToast('Verifique os campos destacados.', 'error');
      return;
    }

    setButtonLoading(submitButton, true, 'Criando conta...');

    try {
      await simulateRequest();

      // Segunda checagem, para o caso de outra aba ter criado a mesma
      // conta enquanto este formulário estava sendo preenchido.
      if (findUserByEmail(emailInput.value)) {
        setFieldState(emailField, 'error', 'Este e-mail já está cadastrado.');
        showToast('Este e-mail já está cadastrado.', 'error');
        return;
      }

      createUser({
        nome: nameInput.value,
        email: emailInput.value,
        senha: passwordInput.value,
      });

      showToast('Conta criada com sucesso! Redirecionando para o login…', 'success');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 900);
    } catch (err) {
      showToast('Não foi possível concluir o cadastro. Tente novamente.', 'error');
    } finally {
      setButtonLoading(submitButton, false);
    }
  });
});
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text) {
    node.textContent = text;
  }
  return node;
}

export function renderAuthView({ mode, notice, error, onSubmit, onToggleMode }) {
  const view = el('section', 'view');

  if (notice) {
    view.append(el('div', 'notice', notice));
  }
  if (error) {
    view.append(el('div', 'error', error));
  }

  const card = el('div', 'card');
  const title = el('h2', 'card-title', mode === 'login' ? 'Welcome back' : 'Create your account');
  const copy = el(
    'p',
    'card-copy',
    mode === 'login'
      ? 'Sign in to your household and keep the list moving.'
      : 'Start with your email, then create or join a household.'
  );

  const form = el('form', 'stack');

  if (mode === 'signup') {
    const label = el('label', 'label');
    label.append(el('span', '', 'Display name'));
    const input = el('input', 'input');
    input.name = 'displayName';
    input.required = true;
    input.placeholder = 'Alex';
    label.append(input);
    form.append(label);
  }

  const emailLabel = el('label', 'label');
  emailLabel.append(el('span', '', 'Email'));
  const emailInput = el('input', 'input');
  emailInput.type = 'email';
  emailInput.name = 'email';
  emailInput.required = true;
  emailInput.placeholder = 'you@example.com';
  emailLabel.append(emailInput);

  const passwordLabel = el('label', 'label');
  passwordLabel.append(el('span', '', 'Password'));
  const passwordInput = el('input', 'input');
  passwordInput.type = 'password';
  passwordInput.name = 'password';
  passwordInput.required = true;
  passwordInput.minLength = 6;
  passwordInput.placeholder = '••••••••';
  passwordLabel.append(passwordInput);

  const submit = el('button', 'btn btn-primary', mode === 'login' ? 'Sign in' : 'Create account');
  submit.type = 'submit';

  const toggle = el(
    'button',
    'btn btn-secondary',
    mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'
  );
  toggle.type = 'button';
  toggle.addEventListener('click', onToggleMode);

  form.append(emailLabel, passwordLabel, submit, toggle);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    onSubmit({
      mode,
      displayName: data.get('displayName') || '',
      email: String(data.get('email') || ''),
      password: String(data.get('password') || '')
    });
  });

  card.append(title, copy, form);
  view.append(card);

  return view;
}
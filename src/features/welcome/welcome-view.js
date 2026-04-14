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

export function renderWelcomeView({ logoUrl, heroUrl, onStart, onLogin }) {
  const view = el('section', 'view welcome-screen');

  const brandCard = el('div', 'card card-soft');
  const lockup = el('div', 'brand-lockup');
  const logo = el('img', 'brand-logo');
  logo.src = logoUrl;
  logo.alt = 'Aisle Kin logo';

  const copy = el('div');
  const name = el('h1', 'brand-name', 'Aisle Kin');
  const tag = el('p', 'brand-tag', 'Shared shopping for real households');

  copy.append(name, tag);
  lockup.append(logo, copy);
  brandCard.append(lockup);

  const heroCard = el('div', 'card');
  const heroImageWrap = el('div', 'hero-surface');
  const heroImage = el('img', 'hero-image');
  heroImage.src = heroUrl;
  heroImage.alt = 'Aisle Kin app preview';
  heroImageWrap.append(heroImage);

  const title = el('h2', 'hero-copy-title', 'Keep one grocery list that everybody can trust.');
  const text = el(
    'p',
    'hero-copy-text',
    'Create a household, share invite codes, save weekly staples, and check items off live while someone else is still in the aisle.'
  );

  const chips = el('div', 'badge-row');
  ['Live check-offs', 'Fast re-adds', 'Household invites'].forEach((label) => {
    chips.append(el('span', 'badge', label));
  });

  const start = el('button', 'btn btn-primary', 'Get started');
  start.type = 'button';
  start.addEventListener('click', onStart);

  const login = el('button', 'btn btn-secondary', 'I already have an account');
  login.type = 'button';
  login.addEventListener('click', onLogin);

  heroCard.append(heroImageWrap, title, text, chips, start, login);
  view.append(brandCard, heroCard);

  return view;
}
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

export function renderListsView({
  household,
  imageUrl,
  lists,
  notice,
  error,
  onCreateList,
  onOpenList,
  onOpenLibrary,
  onOpenSettings
}) {
  const view = el('section', 'view');

  if (notice) {
    view.append(el('div', 'notice', notice));
  }
  if (error) {
    view.append(el('div', 'error', error));
  }

  const hero = el('div', 'card card-soft');
  if (imageUrl) {
    const image = el('img', 'cover-image');
    image.src = imageUrl;
    image.alt = `${household.name} cover`;
    hero.append(image);
  }

  hero.append(
    el('h2', 'card-title', 'Today’s household board'),
    el('p', 'card-copy', 'Open a list, add tonight’s extras, or jump into saved staples.')
  );

  const shortcuts = el('div', 'grid-2');
  const libraryBtn = el('button', 'btn btn-secondary', 'Open library');
  libraryBtn.type = 'button';
  libraryBtn.addEventListener('click', onOpenLibrary);
  const settingsBtn = el('button', 'btn btn-secondary', 'Household settings');
  settingsBtn.type = 'button';
  settingsBtn.addEventListener('click', onOpenSettings);
  shortcuts.append(libraryBtn, settingsBtn);
  hero.append(shortcuts);

  const createCard = el('div', 'card');
  createCard.append(el('h3', 'card-title', 'Create a new list'));
  const form = el('form', 'inline-form');
  const input = el('input', 'input');
  input.name = 'title';
  input.placeholder = 'Saturday market';
  input.required = true;
  const button = el('button', 'ghost-btn', 'Add');
  button.type = 'submit';
  form.append(input, button);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onCreateList(input.value);
    input.value = '';
  });
  createCard.append(form);

  const listsBlock = el('div', 'list-grid');
  if (!lists.length) {
    listsBlock.append(el('div', 'empty', 'No lists yet. Create your first shared run above.'));
  } else {
    lists.forEach((list) => {
      const card = el('button', 'list-card');
      card.type = 'button';

      const head = el('div', 'row-between');
      head.append(el('strong', '', `${list.emoji} ${list.title}`), el('span', 'helper', `${list.progress}%`));

      const meta = el(
        'p',
        'card-copy',
        `${list.done} of ${list.total} items checked off`
      );

      const progress = el('div', 'list-progress');
      const bar = el('div', 'list-progress-bar');
      bar.style.width = `${list.progress}%`;
      progress.append(bar);

      card.append(head, meta, progress);
      card.addEventListener('click', () => onOpenList(list.id));
      listsBlock.append(card);
    });
  }

  view.append(hero, createCard, listsBlock);
  return view;
}
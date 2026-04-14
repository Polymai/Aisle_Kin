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

export function renderSettingsView({
  household,
  members,
  invites,
  imageUrl,
  notice,
  error,
  onSaveName,
  onCreateInvite,
  onUploadImage,
  onLogout
}) {
  const view = el('section', 'view');

  if (notice) {
    view.append(el('div', 'notice', notice));
  }
  if (error) {
    view.append(el('div', 'error', error));
  }

  const imageCard = el('div', 'card');
  imageCard.append(el('h2', 'card-title', 'Household photo'));
  if (imageUrl) {
    const image = el('img', 'cover-image');
    image.src = imageUrl;
    image.alt = `${household.name} photo`;
    imageCard.append(image);
  }
  const fileInput = el('input', 'file-input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.[0]) {
      onUploadImage(fileInput.files[0]);
    }
  });
  imageCard.append(fileInput);

  const nameCard = el('div', 'card');
  nameCard.append(el('h2', 'card-title', 'Household details'));
  const nameForm = el('form', 'stack');
  const label = el('label', 'label');
  label.append(el('span', '', 'Name'));
  const input = el('input', 'input');
  input.value = household.name;
  input.required = true;
  label.append(input);
  const button = el('button', 'btn btn-primary', 'Save household');
  button.type = 'submit';
  nameForm.append(label, button);
  nameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    onSaveName(input.value);
  });
  nameCard.append(nameForm);

  const inviteCard = el('div', 'card');
  inviteCard.append(
    el('h2', 'card-title', 'Invite someone'),
    el('p', 'card-copy', 'Generate a fresh code to share by text or email.')
  );
  const inviteForm = el('form', 'inline-form');
  const inviteInput = el('input', 'input');
  inviteInput.type = 'email';
  inviteInput.placeholder = 'Optional email';
  const inviteButton = el('button', 'ghost-btn', 'Create code');
  inviteButton.type = 'submit';
  inviteForm.append(inviteInput, inviteButton);
  inviteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    onCreateInvite(inviteInput.value);
    inviteInput.value = '';
  });
  inviteCard.append(inviteForm);

  const inviteList = el('div', 'stack');
  if (!invites.length) {
    inviteList.append(el('div', 'empty', 'No active invite codes.'));
  } else {
    invites.forEach((invite) => {
      const row = el('div', 'card card-soft');
      row.append(
        el('strong', '', invite.code),
        el('p', 'card-copy', invite.email || 'Share anywhere'),
        el('p', 'helper', `Expires ${new Date(invite.expires_at).toLocaleDateString()}`)
      );
      inviteList.append(row);
    });
  }

  const memberCard = el('div', 'card');
  memberCard.append(el('h2', 'card-title', 'Members'));
  const memberList = el('div', 'stack');
  members.forEach((member) => {
    const row = el('div', 'card card-soft');
    row.append(
      el('strong', '', member.profile?.display_name || member.profile?.email || 'Household member'),
      el('p', 'card-copy', member.profile?.email || ''),
      el('p', 'helper', member.role === 'admin' ? 'Admin' : 'Member')
    );
    memberList.append(row);
  });
  memberCard.append(memberList);

  const logout = el('button', 'btn btn-danger', 'Log out');
  logout.type = 'button';
  logout.addEventListener('click', onLogout);

  view.append(imageCard, nameCard, inviteCard, inviteList, memberCard, logout);
  return view;
}
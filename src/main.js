import { createShell } from './app/shell.js';
import { createRouter } from './app/router.js';
import { bootstrapSession, onAuthChange, signIn, signOut, signUp } from './lib/auth.js';
import { subscribeToHouseholdLists, subscribeToListItems } from './lib/realtime.js';
import {
  createHousehold,
  createInvite,
  ensureProfile,
  getMyHouseholdContext,
  joinHouseholdByCode,
  loadHouseholdSettings,
  updateHouseholdDetails,
  updateHouseholdImagePath
} from './services/household-api.js';
import {
  addItem,
  createList,
  deleteItem,
  filterAndGroupItems,
  loadList,
  loadLists,
  toggleItem,
  updateItem
} from './services/lists-api.js';
import {
  addLibraryEntryToList,
  createCustomStaple,
  loadLibraryCollections,
  removeLibraryEntry,
  saveFavoriteFromItem,
  saveStapleFromItem
} from './services/library-api.js';
import { createSignedHouseholdImageUrl, uploadHouseholdImage } from './services/storage-api.js';
import { renderWelcomeView } from './features/welcome/welcome-view.js';
import { renderAuthView } from './features/auth/auth-view.js';
import { renderHouseholdView } from './features/household/household-view.js';
import { renderListsView } from './features/lists/lists-view.js';
import { renderListView } from './features/lists/list-view.js';
import { renderItemEditorView } from './features/items/item-editor-view.js';
import { renderLibraryView } from './features/library/library-view.js';
import { renderSettingsView } from './features/settings/settings-view.js';

const shell = createShell(document.getElementById('app'));

const state = {
  authReady: false,
  session: null,
  route: null,
  assets: {
    logoUrl: '',
    heroUrl: ''
  },
  households: [],
  household: null,
  householdImageUrl: '',
  lists: [],
  currentList: null,
  currentItems: [],
  currentItem: null,
  library: null,
  settings: null,
  listUi: {
    listId: null,
    query: '',
    filter: 'all',
    hideCompleted: true
  },
  notice: '',
  error: '',
  loading: false,
  subscriptions: []
};

const router = createRouter({
  onChange: handleRouteChange
});

let routeToken = 0;

init();

async function init() {
  shell.setContent(renderLoading('Loading Aisle Kin...'));
  await loadAssets();
  state.session = await bootstrapSession();
  state.authReady = true;

  if (state.session) {
    await hydrateHouseholdContext();
  }

  onAuthChange(async (session) => {
    const previousId = state.session?.user?.id;
    const nextId = session?.user?.id;
    if (previousId === nextId && !!state.session === !!session) {
      return;
    }

    state.session = session;
    state.notice = '';
    state.error = '';
    clearSubscriptions();

    if (session) {
      await hydrateHouseholdContext();
    } else {
      resetSessionState();
    }

    await applyRoute(router.getCurrent());
  });

  router.start();
}

async function loadAssets() {
  state.assets.logoUrl = await loadRasterAsset('./assets/logo_Aisle_kin.png');
  state.assets.heroUrl = await loadRasterAsset('./assets/hero_Aisle_kin.png');
}

async function loadRasterAsset(path) {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) {
      return '';
    }
    return path;
  } catch {
    return '';
  }
}

async function hydrateHouseholdContext() {
  if (!state.session) {
    return;
  }

  await ensureProfile(state.session.user.user_metadata?.display_name || '');
  const context = await getMyHouseholdContext();
  state.households = context.households;
  state.household = context.activeHousehold;
  state.settings = null;
  state.library = null;

  if (state.household?.image_path) {
    state.householdImageUrl = await createSignedHouseholdImageUrl(state.household.image_path);
  } else {
    state.householdImageUrl = '';
  }
}

function resetSessionState() {
  state.households = [];
  state.household = null;
  state.householdImageUrl = '';
  state.lists = [];
  state.currentList = null;
  state.currentItems = [];
  state.currentItem = null;
  state.library = null;
  state.settings = null;
  state.listUi = {
    listId: null,
    query: '',
    filter: 'all',
    hideCompleted: true
  };
}

async function handleRouteChange(route) {
  await applyRoute(route);
}

async function applyRoute(route) {
  const token = ++routeToken;
  state.route = route;

  if (await guardRoute(route)) {
    return;
  }

  try {
    state.loading = true;
    state.error = '';
    await loadRouteData(route);
    if (token !== routeToken) {
      return;
    }
  } catch (error) {
    state.error = error.message || 'Something went wrong.';
  } finally {
    state.loading = false;
  }

  render();
}

async function guardRoute(route) {
  if (!state.authReady) {
    return false;
  }

  if (!state.session) {
    if (!['welcome', 'auth'].includes(route.name)) {
      router.go('/welcome');
      return true;
    }
    return false;
  }

  if (!state.household) {
    if (route.name !== 'household') {
      router.go('/household');
      return true;
    }
    return false;
  }

  if (['welcome', 'auth', 'household'].includes(route.name)) {
    router.go('/lists');
    return true;
  }

  return false;
}

async function loadRouteData(route) {
  clearSubscriptions();

  if (!state.session || !state.household) {
    return;
  }

  if (route.name === 'lists') {
    state.lists = await loadLists(state.household.id);
    state.currentList = null;
    state.currentItems = [];
    state.currentItem = null;
    state.library = null;
    state.settings = null;
    state.subscriptions.push(
      subscribeToHouseholdLists(state.household.id, async () => {
        if (state.route?.name === 'lists') {
          state.lists = await loadLists(state.household.id);
          render();
        }
      })
    );
    return;
  }

  if (route.name === 'list') {
    await loadListRoute(route.params.id);
    return;
  }

  if (route.name === 'item') {
    await loadItemRoute(route.params.id, route.query.list);
    return;
  }

  if (route.name === 'library') {
    if (!state.lists.length) {
      state.lists = await loadLists(state.household.id);
    }
    state.library = await loadLibraryCollections(state.household.id);
    state.currentItem = null;
    return;
  }

  if (route.name === 'settings') {
    state.settings = await loadHouseholdSettings(state.household.id);
    if (state.settings.household?.image_path) {
      state.householdImageUrl = await createSignedHouseholdImageUrl(state.settings.household.image_path);
    }
  }
}

async function loadListRoute(listId) {
  const payload = await loadList(listId);
  if (!payload.list || payload.list.household_id !== state.household.id) {
    router.go('/lists');
    return;
  }

  state.currentList = payload.list;
  state.currentItems = payload.items;
  state.currentItem = null;

  if (state.listUi.listId !== listId) {
    state.listUi = {
      listId,
      query: '',
      filter: 'all',
      hideCompleted: true
    };
  }

  state.subscriptions.push(
    subscribeToListItems(listId, async () => {
      if (state.route?.name === 'list' || state.route?.name === 'item') {
        const refreshed = await loadList(listId);
        state.currentList = refreshed.list;
        state.currentItems = refreshed.items;
        if (state.route?.name === 'item') {
          state.currentItem = state.currentItems.find((entry) => entry.id === state.route.params.id) || null;
        }
        render();
      }
    })
  );
}

async function loadItemRoute(itemId, listId) {
  if (!listId) {
    router.go('/lists');
    return;
  }

  await loadListRoute(listId);
  state.currentItem = state.currentItems.find((entry) => entry.id === itemId) || null;

  if (!state.currentItem) {
    router.go(`/list/${listId}`);
  }
}

function clearSubscriptions() {
  while (state.subscriptions.length) {
    const unsubscribe = state.subscriptions.pop();
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  }
}

function render() {
  if (!state.authReady) {
    shell.setHeader({ hidden: true });
    shell.setNav({ visible: false });
    shell.setContent(renderLoading('Loading Aisle Kin...'));
    return;
  }

  const route = state.route || { name: 'welcome', params: {}, query: {} };

  if (!state.session) {
    renderPublic(route);
    return;
  }

  if (!state.household) {
    renderHouseholdSetup();
    return;
  }

  renderPrivate(route);
}

function renderPublic(route) {
  shell.setNav({ visible: false });

  if (route.name === 'auth') {
    shell.setHeader({
      title: 'Account',
      subtitle: 'Sign in or create your spot',
      left: { label: '←', onClick: () => router.go('/welcome') }
    });
    shell.setContent(
      renderAuthView({
        mode: route.params.mode,
        notice: state.notice,
        error: state.error,
        onBack: () => router.go('/welcome'),
        onToggleMode: () => router.go(route.params.mode === 'login' ? '/auth/signup' : '/auth/login'),
        onSubmit: handleAuthSubmit
      })
    );
    return;
  }

  shell.setHeader({ hidden: true });
  shell.setContent(
    renderWelcomeView({
      logoUrl: state.assets.logoUrl,
      heroUrl: state.assets.heroUrl,
      onStart: () => router.go('/auth/signup'),
      onLogin: () => router.go('/auth/login')
    })
  );
}

function renderHouseholdSetup() {
  shell.setNav({ visible: false });
  shell.setHeader({
    title: 'Set up your household',
    subtitle: 'Create a shared home or join with a code'
  });
  shell.setContent(
    renderHouseholdView({
      notice: state.notice,
      error: state.error,
      onCreate: handleCreateHousehold,
      onJoin: handleJoinHousehold
    })
  );
}

function renderPrivate(route) {
  const navVisible = ['lists', 'list', 'item', 'library', 'settings'].includes(route.name);
  shell.setNav({
    visible: navVisible,
    current: route.name === 'library' ? 'library' : route.name === 'settings' ? 'settings' : 'lists',
    items: [
      { key: 'lists', label: 'Lists', onClick: () => router.go('/lists') },
      { key: 'library', label: 'Library', onClick: () => router.go('/library') },
      { key: 'settings', label: 'Settings', onClick: () => router.go('/settings') }
    ]
  });

  if (route.name === 'lists') {
    shell.setHeader({
      title: state.household.name,
      subtitle: 'Shared grocery lists'
    });
    shell.setContent(
      renderListsView({
        household: state.household,
        imageUrl: state.householdImageUrl,
        lists: state.lists,
        notice: state.notice,
        error: state.error,
        onCreateList: async (title) => {
          await createList(state.household.id, title);
          state.notice = 'List created.';
          state.lists = await loadLists(state.household.id);
          render();
        },
        onOpenList: (listId) => router.go(`/list/${listId}`),
        onOpenLibrary: () => router.go('/library'),
        onOpenSettings: () => router.go('/settings')
      })
    );
    return;
  }

  if (route.name === 'list') {
    const grouped = filterAndGroupItems(state.currentItems, {
      query: state.listUi.query,
      filter: state.listUi.filter
    });

    shell.setHeader({
      title: state.currentList?.title || 'Shopping list',
      subtitle: `${grouped.remainingCount} left • ${grouped.doneCount} done`,
      left: { label: '←', onClick: () => router.go('/lists') },
      right: { label: 'Library', onClick: () => router.go(`/library?list=${state.currentList.id}`) }
    });

    shell.setContent(
      renderListView({
        list: state.currentList,
        grouped,
        query: state.listUi.query,
        filter: state.listUi.filter,
        hideCompleted: state.listUi.hideCompleted,
        notice: state.notice,
        error: state.error,
        onSearch: (value) => {
          state.listUi.query = value;
          render();
        },
        onFilterChange: (value) => {
          state.listUi.filter = value;
          render();
        },
        onToggleCompleted: () => {
          state.listUi.hideCompleted = !state.listUi.hideCompleted;
          render();
        },
        onAddItem: async (payload) => {
          await addItem(state.household.id, state.currentList.id, payload);
          state.notice = 'Item added.';
          const refreshed = await loadList(state.currentList.id);
          state.currentList = refreshed.list;
          state.currentItems = refreshed.items;
          render();
        },
        onToggleItem: async (item) => {
          await toggleItem(item);
          const refreshed = await loadList(state.currentList.id);
          state.currentList = refreshed.list;
          state.currentItems = refreshed.items;
          render();
        },
        onEditItem: (item) => router.go(`/item/${item.id}?list=${state.currentList.id}`),
        onDeleteItem: async (item) => {
          await deleteItem(item.id);
          state.notice = 'Item removed.';
          const refreshed = await loadList(state.currentList.id);
          state.currentList = refreshed.list;
          state.currentItems = refreshed.items;
          render();
        }
      })
    );
    return;
  }

  if (route.name === 'item') {
    shell.setHeader({
      title: 'Edit item',
      subtitle: state.currentList?.title || 'Shopping list',
      left: { label: '←', onClick: () => router.go(`/list/${route.query.list}`) }
    });
    shell.setContent(
      renderItemEditorView({
        item: state.currentItem,
        notice: state.notice,
        error: state.error,
        onBack: () => router.go(`/list/${route.query.list}`),
        onSave: async (payload) => {
          await updateItem(state.currentItem.id, payload);
          state.notice = 'Item saved.';
          router.go(`/list/${route.query.list}`);
        },
        onDelete: async () => {
          await deleteItem(state.currentItem.id);
          state.notice = 'Item removed.';
          router.go(`/list/${route.query.list}`);
        },
        onSaveFavorite: async () => {
          await saveFavoriteFromItem(state.household.id, state.currentItem);
          state.notice = 'Saved to favorites.';
          render();
        },
        onSaveStaple: async () => {
          await saveStapleFromItem(state.household.id, state.currentItem);
          state.notice = 'Saved to staples.';
          render();
        }
      })
    );
    return;
  }

  if (route.name === 'library') {
    const targetListId = route.query.list || state.lists[0]?.id || null;
    const targetList = state.lists.find((entry) => entry.id === targetListId) || null;

    shell.setHeader({
      title: 'Library',
      subtitle: targetList ? `Add into ${targetList.title}` : 'Favorites, staples, recents',
      left: route.query.list ? { label: '←', onClick: () => router.go(`/list/${route.query.list}`) } : undefined
    });

    shell.setContent(
      renderLibraryView({
        collections: state.library,
        targetListName: targetList?.title || '',
        notice: state.notice,
        error: state.error,
        onAddEntry: async (entry) => {
          if (!targetListId) {
            throw new Error('Create a list first.');
          }
          await addLibraryEntryToList(targetListId, state.household.id, entry);
          state.notice = 'Added to list.';
          if (state.route?.name === 'library') {
            state.library = await loadLibraryCollections(state.household.id);
          }
          render();
        },
        onCreateStaple: async (payload) => {
          await createCustomStaple(state.household.id, payload);
          state.notice = 'Staple saved.';
          state.library = await loadLibraryCollections(state.household.id);
          render();
        },
        onDeleteEntry: async (entryId) => {
          await removeLibraryEntry(entryId);
          state.notice = 'Removed from library.';
          state.library = await loadLibraryCollections(state.household.id);
          render();
        }
      })
    );
    return;
  }

  shell.setHeader({
    title: 'Settings',
    subtitle: 'Household members and sharing'
  });
  shell.setContent(
    renderSettingsView({
      household: state.settings?.household || state.household,
      members: state.settings?.members || [],
      invites: state.settings?.invites || [],
      imageUrl: state.householdImageUrl,
      notice: state.notice,
      error: state.error,
      onSaveName: async (name) => {
        await updateHouseholdDetails(state.household.id, { name });
        await hydrateHouseholdContext();
        state.settings = await loadHouseholdSettings(state.household.id);
        state.notice = 'Household updated.';
        render();
      },
      onCreateInvite: async (email) => {
        const invite = await createInvite(state.household.id, email);
        state.settings = await loadHouseholdSettings(state.household.id);
        state.notice = `Invite code ${invite.code} ready to share.`;
        render();
      },
      onUploadImage: async (file) => {
        const path = await uploadHouseholdImage(file, state.household.id);
        await updateHouseholdImagePath(state.household.id, path);
        await hydrateHouseholdContext();
        state.settings = await loadHouseholdSettings(state.household.id);
        state.notice = 'Household photo updated.';
        render();
      },
      onLogout: async () => {
        await signOut();
        router.go('/welcome');
      }
    })
  );
}

async function handleAuthSubmit(payload) {
  state.notice = '';
  state.error = '';

  try {
    if (payload.mode === 'signup') {
      const result = await signUp(payload);
      if (result.session) {
        state.session = result.session;
        await hydrateHouseholdContext();
        router.go(state.household ? '/lists' : '/household');
      } else {
        state.notice = 'Check your email to confirm your account, then sign in.';
        router.go('/auth/login');
      }
      return;
    }

    const session = await signIn(payload);
    state.session = session;
    await hydrateHouseholdContext();
    router.go(state.household ? '/lists' : '/household');
  } catch (error) {
    state.error = error.message || 'Authentication failed.';
    render();
  }
}

async function handleCreateHousehold(name) {
  try {
    state.notice = '';
    state.error = '';
    await createHousehold(name);
    await hydrateHouseholdContext();
    router.go('/lists');
  } catch (error) {
    state.error = error.message || 'Could not create household.';
    render();
  }
}

async function handleJoinHousehold(code) {
  try {
    state.notice = '';
    state.error = '';
    await joinHouseholdByCode(code);
    await hydrateHouseholdContext();
    router.go('/lists');
  } catch (error) {
    state.error = error.message || 'Could not join household.';
    render();
  }
}

function renderLoading(text) {
  const node = document.createElement('div');
  node.className = 'loading';
  node.textContent = text;
  return node;
}

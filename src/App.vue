<template>
  <Toast position="bottom-left" />
  <ConfirmPopup id="confirm" aria-label="popup">
    <template #message="slotProps">
      <div class="flex flex-column align-items-center w-full gap-3 p-3">
        <i class="text-6xl" :class="slotProps.message.icon"></i>
        <span>{{ slotProps.message.message }}</span>
      </div>
    </template>
  </ConfirmPopup>
  <main class="app-shell">
    <header class="header text-center">
      <h1 class="mb-0 text-4xl sm:text-5xl md:text-6xl">
        <span class="white-space-nowrap">Spin Wheel</span>
      </h1>
      <p class="my-0 py-0 text-base sm:text-lg md:text-2xl">
        <span class="white-space-nowrap">May fortune smile on you!</span>
      </p>
    </header>
    <section class="wheel-stage" aria-label="Spin wheel">
      <SpinWheel></SpinWheel>
    </section>
  </main>

  <SidebarPanel></SidebarPanel>
  <Button
    severity="info"
    text
    rounded
    icon="pi pi-cog"
    aria-label="Settings"
    class="overflow-visible sidebar-button"
    @click="openSettingsWithPassword"
    :pt="{
      icon: { style: { fontSize: 'x-large' } }
    }"
  />
  <DynamicDialog />
  <Dialog
    v-model:visible="showPasswordDialog"
    modal
    dismissableMask
    header="🔒 Admin Settings"
    :style="{ width: '380px', maxWidth: '90vw' }"
  >
    <div class="flex flex-column gap-3 p-2">
      <p class="m-0 text-color-secondary text-sm">
        Please enter the admin password to access settings:
      </p>
      <Password
        v-model="passwordInput"
        :feedback="false"
        toggleMask
        placeholder="Enter password"
        class="w-full"
        :inputStyle="{ width: '100%' }"
        autofocus
        @keyup.enter="checkPassword"
      />
      <div class="flex justify-content-end gap-2 mt-2">
        <Button
          label="Cancel"
          severity="secondary"
          text
          @click="showPasswordDialog = false"
        />
        <Button
          label="Unlock"
          icon="pi pi-lock-open"
          severity="primary"
          @click="checkPassword"
        />
      </div>
    </div>
  </Dialog>
  <Dialog v-model:visible="showInputGroupDialog" modal dismissableMask header="Header">
    <template #container>
      <form class="surface-card border-round shadow-2 p-4 max-w-screen" @submit.prevent>
        <div class="text-900 font-medium mb-2 text-xl">Import Group</div>
        <p class="text-color-secondary w-24rem">
          Hey, your new spinner has the same name as
          <span class="white-space-nowrap">one of your existing groups.</span>
        </p>
        <p class="text-color-secondary w-24rem">
          Please assign another group name, or else
          <span class="text-red-300 white-space-nowrap">it will be replaced.</span>
        </p>
        <div class="flex mb-4 flex-column lg:flex-row">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-file-import" />
            <InputText
              autofocus
              v-model="inputGroupName"
              placeholder="New Group Name"
              :pt="{
                root: { class: 'w-full' }
              }"
            />
          </span>
        </div>
        <Button
          type="submit"
          class="confirm-button"
          icon="pi pi-check"
          :label="GroupLabels.indexOf(inputGroupName) > -1 ? 'Replace' : 'Import'"
          :severity="GroupLabels.indexOf(inputGroupName) > -1 ? 'danger' : 'success'"
          @click="inputGroup"
        ></Button>
      </form>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import type { SidebarService } from '@/services/SidebarService';
import { ItemService, GroupLabels } from '@/services/ItemService';
import { StringHelper } from '@/helpers/StringHelper';
import { Fairmode } from '@/services/SettingService';

declare global {
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

const toast = useToast();
const sidebarService = inject<SidebarService>('SidebarService');
const itemService = inject<ItemService>('ItemService');

// ─── Password Protection for Settings Button ───────────────────────────────
const showPasswordDialog = ref(false);
const passwordInput = ref('');

const openSettingsWithPassword = () => {
  passwordInput.value = '';
  showPasswordDialog.value = true;
};

const checkPassword = () => {
  if (passwordInput.value === 'gssb*9898#') {
    showPasswordDialog.value = false;
    sidebarService?.openSidebar();
  } else {
    toast.add({
      severity: 'error',
      summary: 'Access Denied',
      detail: 'Incorrect password. Access denied.',
      life: 3500
    });
  }
};
// ───────────────────────────────────────────────────────────────────────────

let inputItems: { label: string; weight: number }[] = [];
const showInputGroupDialog = ref(false);
const inputGroupName = ref('');
const inputGroup = async () => {
  if (!itemService) return;

  await itemService.cleanUpGroup(inputGroupName.value);
  await itemService.addItems(
    inputItems.map((item) => ({
      label: item.label,
      weight: +item.weight,
      group: inputGroupName.value,
      order: -1
    }))
  );
  await itemService.changeGroupLabel(inputGroupName.value);
  showInputGroupDialog.value = false;
  inputGroupName.value = '';

  // Remove query string
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.delete('data');
  searchParams.delete('group');
  var url =
    window.location.protocol +
    '//' +
    window.location.host +
    window.location.pathname +
    (searchParams.size ? '?' + searchParams.toString() : '');
  window.history.pushState({ path: url }, '', url);
};

onMounted(async () => {
  if (import.meta.env.DEV) {
    // Add dummy gtag for dev
    window.gtag = (...args: any[]) => {
      console.debug('gtag', ...args);
    };
  } else if (navigator.globalPrivacyControl) {
    // Don't track if user has enabled Global Privacy Control
    window.gtag = () => {};
    console.log(
      '%cWe can see that you have enabled the Global Privacy Control, indicating that you do not wish to have your information sold or shared.',
      'font-weight:bold; color: lightgreen;',
      '\nYour privacy is important to us, and we completely honor your choice.',
      'As a result, we have deactivated Google Analytics, Microsoft Clarity, and Cloudflare RUM. 😉'
    );
  } else if (navigator.userAgent.indexOf('OBS') > 0) {
    // Don't track in OBS mode to reduce performance impact
    window.gtag = () => {};
  } else if (import.meta.env.PROD) {
    // Setup Cloudflare RUM (Real User Measurements)
    if (import.meta.env.VITE_CLOUDFLARE_RUM_TOKEN) {
      (function (token) {
        const rumScript = document.createElement('script');
        rumScript.defer = true;
        rumScript.src = 'https://static.cloudflareinsights.com/beacon.min.js';
        rumScript.setAttribute('data-cf-beacon', JSON.stringify({ token: token }));
        document.head.appendChild(rumScript);
      })(import.meta.env.VITE_CLOUDFLARE_RUM_TOKEN);
    }

    // Setup GA
    (function (id) {
      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;

      document.head.appendChild(gtagScript);

      const dataLayerScript = document.createElement('script');
      dataLayerScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}');`;
      document.head.appendChild(dataLayerScript);
    })(import.meta.env.VITE_GA_TRACKING_ID);

    // Setup Clarity
    (function (c: any, l: Document, a: string, r: string, i: string, t: any, y: any) {
      c[a] =
        c[a] ||
        function (...args: any[]) {
          (c[a].q = c[a].q || []).push(args);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(
      window,
      document,
      'clarity',
      'script',
      import.meta.env.VITE_CLARITY_TRACKING_ID,
      undefined,
      undefined
    );
  }

  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');
  const group = params.get('group') ?? 'New Group Name';
  if (data) {
    try {
      inputGroupName.value = decodeURIComponent(group);
      console.debug('inputGroupName', inputGroupName.value);

      const decompressed = StringHelper.decompress(data);
      inputItems = StringHelper.csvParse(decompressed);
      console.debug('inputItems', inputItems);

      if ((await itemService?.getItemByGroupLabel(inputGroupName.value))?.length) {
        inputGroupName.value += ' (1)';
        showInputGroupDialog.value = true;
      } else {
        await inputGroup();
      }
    } catch (e) {
      console.error('Failed to parsed data from url segment!', e);
    }
  }
});
</script>

<style lang="scss" scoped>
.header {
  font-family: 'Rock Salt';
  -webkit-text-shadow: 9px 7px 20px #000000;
  text-shadow: 9px 7px 20px #000000;
  flex: 0 0 auto;
  padding-inline: 4rem;

  h1 {
    font-size: xxx-large;
  }
  p {
    font-size: large;
  }

  @media (orientation: landscape) and (max-height: 600px) {
    h1 {
      font-size: 1.5rem !important;
      margin-top: 0.25rem !important;
      margin-bottom: 0 !important;
    }
    p {
      font-size: 0.85rem !important;
      margin: 0 !important;
    }
  }

  @media (max-width: 480px) {
    padding-inline: 3.5rem;
  }
}

.app-shell {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  padding: max(0.5rem, env(safe-area-inset-top)) max(0.75rem, env(safe-area-inset-right))
    max(0.75rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left));
  overflow: hidden;
}

.wheel-stage {
  display: grid;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  place-items: start center;
}

@media (orientation: landscape) {
  .app-shell {
    flex-direction: row;
    justify-content: center;
    gap: clamp(1rem, 4vw, 4rem);
  }

  .header {
    flex: 0 1 20rem;
    min-width: 0;
    padding-inline: 0;
  }

  .wheel-stage {
    flex: 0 1 auto;
    width: auto;
    place-items: center;
  }
}

.confirm-button {
  float: right;
}

@mixin afterBg {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  border-radius: 50%;
}

.sidebar-button {
  position: fixed;
  top: max(0.75rem, env(safe-area-inset-top));
  right: max(0.75rem, env(safe-area-inset-right));
  width: 48px;
  height: 48px;
  z-index: 999;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);

  animation: shockwaveJump 3s ease-out infinite;

  &:after {
    @include afterBg;
    animation: shockwave 3s 0.65s ease-out infinite;
  }

  &:before {
    @include afterBg;
    animation: shockwave 3s 0.5s ease-out infinite;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-button,
  .sidebar-button::before,
  .sidebar-button::after {
    animation: none;
  }
}

@keyframes shockwaveJump {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.08);
  }
  50% {
    transform: scale(0.98);
  }
  55% {
    transform: scale(1.02);
  }
  60% {
    transform: scale(0.98);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shockwave {
  0% {
    transform: scale(1);
    box-shadow:
      0 0 2px rgba(255, 255, 255, 0.15),
      inset 0 0 1px rgba(255, 255, 255, 0.15);
  }
  95% {
    box-shadow:
      0 0 50px rgba(255, 255, 255, 0),
      inset 0 0 30px rgba(255, 255, 255, 0);
  }
  100% {
    transform: scale(2.25);
  }
}
</style>

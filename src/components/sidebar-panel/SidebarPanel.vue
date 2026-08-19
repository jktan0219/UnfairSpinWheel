<template>
  <Sidebar
    v-model:visible="VisibleSidebar"
    position="right"
    :pt="{
      root: {
        style: { width: '500px', maxWidth: '100vw' }
      },
      header: {
        class: 'justify-content-between pb-0'
      }
    }"
  >
    <template #header>
      <h2><i class="pi pi-palette"></i> Customize</h2>
    </template>
    <TabView
      :scrollable="true"
      :pt="{
        panelContainer: {
          class: 'p-0'
        }
      }"
    >
      <TabPanel header="📋 Items">
        <div class="col-12">
          <label for="dd-group" class="block mb-2">Select a Group</label>
          <div class="p-inputgroup">
            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              aria-label="Remove group"
              @click="removeGroup"
              tabindex="-1"
            />
            <Dropdown
              :model-value="GroupLabel"
              inputId="dd-group"
              :options="GroupLabels"
              @update:model-value="itemService.changeGroupLabel"
            />
            <Button
              icon="pi pi-pencil"
              severity="info"
              outlined
              aria-label="Rename group"
              @click="showRenameGroupDialog = true"
            />
            <Button
              icon="pi pi-plus"
              severity="success"
              outlined
              aria-label="Add group"
              @click="showAddGroupDialog = true"
            />
          </div>
        </div>
        <Divider />
        <div class="p-inputgroup col-12">
          <ToggleButton
            :modelValue="bulkEditMode"
            @change="toggleBulkEditMode"
            class="w-full border-round"
            onLabel="Save"
            offLabel="Bulk Edit"
            onIcon="pi pi-check"
            offIcon="pi pi-pencil"
            :pt="{
              icon: {
                class: ['flex', 'flex-auto', 'flex-row-reverse']
              },
              label: {
                class: ['flex']
              }
            }"
          />
        </div>
        <template v-if="!bulkEditMode">
          <div
            v-focustrap="{
              disabled: Items?.length === 0
            }"
          >
            <ItemInputGroup
              :class="['col-12']"
              v-for="item in Items"
              :key="item._id"
              :modelValue="item"
            ></ItemInputGroup>
          </div>
          <div class="p-inputgroup col-12">
            <Button
              ref="addButton"
              class="w-full"
              icon="pi pi-plus"
              severity="success"
              outlined
              aria-label="Add item"
              @click="addItem"
            />
          </div>
        </template>
        <div v-else class="m-2">
          <Textarea v-model="textArea" />
          <small class="text-color-secondary"
            >This feature uses
            <a
              href="https://en.wikipedia.org/wiki/Comma-separated_values#Basic_rules"
              target="_blank"
              rel="noopener"
              >the CSV syntax</a
            >
            with two columns.</small
          >
        </div>
      </TabPanel>
      <TabPanel header="⚙️ Settings">
        <div v-focustrap>
          <div class="col-12">
            <label for="dd-sound" class="block mb-2">Select a Ticking Sound</label>
            <div class="grid">
              <div class="col-8">
                <Dropdown
                  v-model="TickSound"
                  inputId="dd-sound"
                  :options="TickSounds"
                  optionLabel="label"
                  optionGroupLabel="label"
                  optionGroupChildren="items"
                  class="w-full"
                />
              </div>
              <div class="col-4">
                <FileUpload
                  mode="basic"
                  accept="audio/*,.webm"
                  customUpload
                  auto
                  @uploader="customBase64Uploader($event, 'TickSound')"
                  :pt="{
                    chooseButton: {
                      class: 'w-full'
                    }
                  }"
                />
              </div>
            </div>
          </div>
          <div class="col-12">
            <label for="dd-sound" class="block mb-2">Select a Congratulatory Sound</label>
            <div class="grid">
              <div class="col-8">
                <Dropdown
                  v-model="CongratulationSound"
                  inputId="dd-sound"
                  :options="CongratulationSounds"
                  optionLabel="label"
                  optionGroupLabel="label"
                  optionGroupChildren="items"
                  class="w-full"
                />
              </div>
              <div class="col-4">
                <FileUpload
                  mode="basic"
                  accept="audio/*,.webm"
                  customUpload
                  auto
                  @uploader="customBase64Uploader($event, 'CongratulationSound')"
                  :pt="{
                    chooseButton: {
                      class: 'w-full'
                    }
                  }"
                />
              </div>
            </div>
          </div>
          <div class="col-12">
            <label for="sl-labelLength" class="block mb-2">Item Label Length</label>
            <Slider
              v-model="LabelLength"
              inputId="sl-labelLength"
              :min="0.3"
              :max="0.75"
              :step="0.01"
            />
          </div>
          <div class="col-12">
            <label for="sl-labelLength" class="block mb-2">Fair mode</label>
            <ToggleButton
              v-model="Fairmode"
              @change="
                () => {
                  itemService.syncItems();
                }
              "
              :pt="{
                root: {
                  class: 'w-full'
                }
              }"
            />
          </div>
          <Divider />
          <div class="col-12">
            <label class="block mb-2 font-bold">📂 Load Items from File</label>
            <div class="flex flex-column gap-3">
              <!-- Method 1: In-App File Picker -->
              <div>
                <input
                  type="file"
                  ref="fileInputRef"
                  accept=".txt,.csv"
                  style="display: none"
                  @change="onFileSelected"
                />
                <Button
                  class="w-full"
                  icon="pi pi-folder-open"
                  label="Select .txt File from Device"
                  severity="success"
                  @click="triggerFileInput"
                />
              </div>

              <!-- Method 2: Load from Downloads folder -->
              <div>
                <Button
                  class="w-full"
                  icon="pi pi-download"
                  label="Load from Downloads/spinwheel_items.txt"
                  severity="info"
                  outlined
                  :loading="fileImportLoading"
                  @click="loadFromFile"
                />
              </div>

              <small class="text-color-secondary">
                <strong>Option A:</strong> Tap <em>"Select .txt File"</em> to browse and pick any file from your phone.
                <br />
                <strong>Option B:</strong> Place <code>spinwheel_items.txt</code> in your device's <strong>Downloads</strong> folder and tap the button above.
                <br />
                <strong>Format:</strong> One item per line — <code>Label,weight</code> (e.g. <code>Ho,2</code>)
              </small>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>

    <Dialog v-model:visible="showRenameGroupDialog" modal dismissableMask header="Header">
      <template #container>
        <form class="surface-card border-round shadow-2 p-4 max-w-screen" @submit.prevent>
          <div class="text-900 font-medium mb-2 text-xl">Rename Group</div>
          <p class="min-w-min text-color-secondary">Change the name, change your luck.</p>
          <div class="flex mb-4 flex-column lg:flex-row">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-pencil" />
              <InputText
                autofocus
                v-model="renameGroupName"
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
            label="Ok"
            severity="success"
            @click="renameGroup"
          ></Button>
        </form>
      </template>
    </Dialog>
    <Dialog v-model:visible="showAddGroupDialog" modal dismissableMask header="Header">
      <template #container>
        <form class="surface-card border-round shadow-2 p-4 max-w-screen" @submit.prevent>
          <div class="text-900 font-medium mb-2 text-xl">Add Group</div>
          <p class="min-w-min text-color-secondary">What should we name this new spinner?</p>
          <div class="flex mb-4 flex-column lg:flex-row">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-plus" />
              <InputText
                autofocus
                v-model="addGroupName"
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
            label="Ok"
            severity="success"
            @click="addGroup"
          ></Button>
        </form>
      </template>
    </Dialog>
  </Sidebar>
</template>

<script setup lang="ts">
import { inject, onMounted, ref, watch } from 'vue';
import type { FileUploadUploaderEvent } from 'primevue/fileupload';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { ItemService, GroupLabel, GroupLabels, Items } from '@/services/ItemService';
import { VisibleSidebar } from '@/services/SidebarService';
import {
  TickSound,
  TickSounds,
  LabelLength,
  CongratulationSound,
  CongratulationSounds,
  Fairmode
} from '@/services/SettingService';
import ItemInputGroup from '@/components/sidebar-panel/ItemInputGroup.vue';
import type { IItem } from '@/interface/IItem';
import { StringHelper } from '@/helpers/StringHelper';
import { FileImportService, ITEMS_FILENAME } from '@/services/FileImportService';

const itemService = inject<ItemService>('ItemService')!;
const toast = useToast();

const addButton = ref();
const confirm = useConfirm();
const bulkEditMode = ref(false);
const textArea = ref('');

async function addItem() {
  await itemService.addItem();
  setTimeout(() => {
    addButton.value.$el.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

const removeGroup = ($event: Event) => {
  if ($event.target instanceof HTMLElement)
    confirm.require({
      target: $event.target || undefined,
      message: 'Are you sure you want to delete this group?',
      icon: 'pi pi-exclamation-triangle text-yellow-400',
      accept: async () => {
        await itemService.removeGroup(GroupLabel.value!);
      }
    });
};

const showRenameGroupDialog = ref(false);
const renameGroupName = ref(GroupLabel.value);
const renameGroup = async () => {
  await itemService.renameGroup(GroupLabel.value!, renameGroupName.value!);
  showRenameGroupDialog.value = false;
};

const showAddGroupDialog = ref(false);
const addGroupName = ref('');
const addGroup = async () => {
  await itemService.changeGroupLabel(addGroupName.value);
  await itemService.addItem();
  GroupLabels.value = await itemService.getGroupLabels();
  showAddGroupDialog.value = false;
  addGroupName.value = '';
};

const customBase64Uploader = async (
  event: FileUploadUploaderEvent,
  mode: 'TickSound' | 'CongratulationSound'
) => {
  const file = Array.isArray(event.files) ? event.files[0] : event.files;
  const reader = new FileReader();
  let blob = await fetch(window.URL.createObjectURL(file)).then((r) => r.blob()); //blob:url

  reader.readAsDataURL(blob);

  reader.onloadend = function () {
    const base64data = reader.result;
    console.debug('Sound uploaded', base64data);
    if (mode === 'TickSound') {
      TickSound.value = {
        label: file.name,
        value: base64data as string
      };
    } else if (mode === 'CongratulationSound') {
      CongratulationSound.value = {
        label: file.name,
        value: base64data as string
      };
    }
  };
};

const toggleBulkEditMode = async ($event: Event) => {
  if (!bulkEditMode.value && Fairmode.value && $event.target instanceof HTMLElement) {
    confirm.require({
      target: $event.target || undefined,
      message: 'The item weights will be LOST if you perform bulk edits in fair mode!',
      icon: 'pi pi-exclamation-triangle text-yellow-400',
      defaultFocus: 'reject',
      accept: async () => {
        bulkEditMode.value = true;
        await changeBulkEditMode();
      },
      reject: () => {
        bulkEditMode.value = false;
      }
    });
  } else {
    bulkEditMode.value = !bulkEditMode.value;
    await changeBulkEditMode();
  }
};

const changeBulkEditMode = async () => {
  if (bulkEditMode.value) {
    textArea.value = badCSV ?? StringHelper.csvStringify();
    badCSV = undefined;
    console.debug('Bulk edit mode on');
  } else {
    console.debug('Bulk edit mode off');

    let items: IItem[] = [];
    try {
      items = StringHelper.csvParse(textArea.value, true).map(({ label, weight }) => ({
        label: label,
        weight: isNaN(+weight) || +weight <= 0 ? 1 : +weight,
        group: GroupLabel.value!,
        order: -1
      }));
      toast.removeAllGroups();
    } catch (error) {
      const e = error as Error;
      console.error('Error parsing items from textarea', e);
      toast.add({
        severity: 'error',
        summary: 'CSV parsed failed!',
        detail: e.message
      });

      badCSV = textArea.value;
      bulkEditMode.value = true;
      return;
    }
    console.debug('Items parsed from textarea', items);

    await itemService.cleanUpGroup(GroupLabel.value!);
    await itemService.addItems(items);
  }
};

let badCSV: string | undefined = undefined;

// ─── File Import (In-app Picker & Downloads Folder) ──────────────────────
const fileImportLoading = ref(false);
const fileInputRef = ref<HTMLInputElement>();

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const stripped = text
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'))
      .join('\n');

    const items = StringHelper.csvParse(stripped, true);
    if (items.length === 0) {
      toast.add({
        severity: 'error',
        summary: 'Empty File',
        detail: 'The selected file contains no valid items.',
        life: 5000
      });
      return;
    }

    const groupName = file.name.replace(/\.[^.]+$/, '') || 'Custom Items';
    const newItems: IItem[] = items.map(({ label, weight }, i) => ({
      label,
      weight: isNaN(Number(weight)) || Number(weight) <= 0 ? 1 : Number(weight),
      group: groupName,
      order: i
    }));

    await itemService.cleanUpGroup(groupName);
    await itemService.addItems(newItems);
    await itemService.changeGroupLabel(groupName);

    toast.add({
      severity: 'success',
      summary: 'Items Loaded',
      detail: `Loaded ${newItems.length} items from "${file.name}"`,
      life: 4000
    });
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Parse Error',
      detail: err.message,
      life: 5000
    });
  } finally {
    target.value = '';
  }
};

const loadFromFile = async () => {
  fileImportLoading.value = true;
  try {
    const result = await FileImportService.readItemsFile();

    if (!result.success) {
      toast.add({
        severity: 'error',
        summary: 'File Load Failed',
        detail: result.error,
        life: 6000
      });
      return;
    }

    // Map parsed items to IItem shape using the filename-derived group name
    const groupName = result.groupName;
    const newItems: IItem[] = result.items.map(({ label, weight }, i) => ({
      label,
      weight: isNaN(Number(weight)) || Number(weight) <= 0 ? 1 : Number(weight),
      group: groupName,
      order: i
    }));

    // Clear any existing items in this group and repopulate
    await itemService.cleanUpGroup(groupName);
    await itemService.addItems(newItems);
    await itemService.changeGroupLabel(groupName);

    toast.add({
      severity: 'success',
      summary: 'Items Loaded',
      detail: `Loaded ${newItems.length} items from "${ITEMS_FILENAME}"`,
      life: 4000
    });
  } finally {
    fileImportLoading.value = false;
  }
};
// ─────────────────────────────────────────────────────────────────────────────

onMounted(() => {
  watch(GroupLabel, () => {
    renameGroupName.value = GroupLabel.value;
  });
});
</script>

<style scoped>
.confirm-button {
  float: right;
}

textarea {
  width: -webkit-fill-available;
  resize: vertical;
  min-height: 50vh;
  font-size: larger;
}

h2 {
  font-weight: 400;
}
</style>

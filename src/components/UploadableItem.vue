<template>
  <q-uploader
    ref="fileUploader"
    v-bind="$attrs"
    :factory="uploadFactory"
    label="Upload File"
    color="primary"
    text-color="white"
    field-name="file"
    class="uploadable"
    :multiple="props.multiple"
    :max-files="props.multiple ? undefined : 1"
    @added="onFileAdded"
    @uploaded="onFileUploaded"
    @failed="onUploadFailed"
    with-credentials
  >
    <template v-slot:list="scope">
      <!-- TABLE STYLE DISPLAY -->
      <div v-if="props.displayInTable"
        class="column gap-1"
      >
        <q-btn
          outline
          size="md"
          icon="upload"
          :label="messagePlaceholder ? messagePlaceholder : 'Upload Attachments'"
          color="primary"
          @click="scope.pickFiles"
        />
        <q-scroll-area
          style="height: calc(100dvh - 300px);"
          class="no-scrollbar"
        >
          <q-table v-if="Number(loadedFiles.filter(lf => (props.fixedLabel ? true : (lf as UploadableModel).id))?.length) > 0"
            flat
            :rows="loadedFiles.filter(lf => (props.fixedLabel ? true : (lf as UploadableModel).id))"
            :columns="tableColumns"
            :pagination="{ rowsPerPage: 0 }"
            hide-header
            hide-pagination
          >
            <template v-slot:body="props">
              <q-item
                :clickable="!props.row.isUploading && !props.row.isRemoving"
                class="border rounded q-pr-sm q-mb-xs q-py-xs"
                @click="openImagePreview(props.rowIndex)"
              >
                <q-item-section>
                  <q-item-label class="font-medium">{{ props.row.label || props.row.filename }}</q-item-label>
                  <q-item-label class="font-medium" caption>Extension: {{ props.row.extension.toUpperCase() }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div v-if="!props.row.isUploading && !props.row.isRemoving && !(props.row as UploadFile).error" class="row items-center">
                    <q-btn
                      flat
                      round
                      icon="download"
                      color="primary"
                      @click.stop="downloadFromS3(props.row)"
                    />

                    <q-btn
                      flat
                      round
                      icon="delete"
                      color="negative"
                      @click.stop="removeFile(props.row, (String(props.row.id) === '-1') ? props.rowIndex : null)"
                    />
                  </div>

                  <div v-else-if="!props.row.isUploading && !props.row.isRemoving && (props.row as UploadFile).error" class="row items-center">
                    <q-btn
                      icon="refresh"
                      label="Retry"
                      color="primary"
                      @click.stop="retryUpload(props.row)"
                      class="q-ma-xs q-px-sm w-full"
                    />
                    <q-btn
                      icon="cancel"
                      label="Cancel"
                      color="negative"
                      @click.stop="cancelUpload(props.row)"
                      class="q-ma-xs q-px-sm w-full"
                    />
                  </div>

                  <div v-else-if="props.row.isUploading || props.row.isRemoving">
                    <q-spinner color="primary" size="2em" />
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </q-table>

          <q-card v-else flat bordered>
            <q-card-section class="flex items-center justify-center q-pa-xs">
              <span class="text-lg text-bold text-italic text-uppercase text-gray-500">No File Attached</span>
            </q-card-section>
          </q-card>
        </q-scroll-area>

        <div v-if="loadedFiles.length > 0" class="row q-mr-sm">
          <q-space />
          <span class="text-italic">{{ loadedFiles.filter(lf => (lf as UploadableModel).id).length }} {{ loadedFiles.filter(lf => (lf as UploadableModel).id).length > 1 ? 'Files Attached' : 'File Attached' }}</span>
        </div>
      </div>
      <!-- TABLE STYLE DISPLAY -->

      <!-- CARD STYLE DISPLAY -->
      <div v-else
        :class="
          props.containerClass ||
          `grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(${props.contentMinWidth},1fr))] gap-2`
        "
      >
        <div
          v-for="(file, index) in loadedFiles"
          :key="index"
          :class="props.contentClass"
          class="relative bg-gray-100 flex flex-col items-center justify-center w-full h-full rounded-lg"
          @mouseenter="onHoverCardIndex = index"
          @mouseleave="onHoverCardIndex = -1"
        >
          <q-img
            v-if="imageURL(index)"
            :src="imageURL(index)"
            alt="Thumbnail"
            style="width: 100%"
            class="rounded-lg border cursor-pointer"
            :ratio="1"
            no-spinner
            @click="openImagePreview(index)"
            @error="(loadedFiles[index] as UploadableModel).id ? handleGetNewUrl((loadedFiles[index] as UploadableModel).id) : undefined"
          >
            <template v-slot:error>
              <div class="absolute inset-0 flex items-center justify-center">
                <q-spinner color="positive" size="3em" />
              </div>
            </template>
          </q-img>
          <div v-else class="text-h6 text-grey-8 text-uppercase">EXTENSION</div>

          <div
            v-if="(file as UploadFile).error"
            class="absolute inset-0 flex flex-col items-center justify-center bg-red-50 bg-opacity-80"
          >
            <div class="text-red text-caption text-bold">Failed to Upload File</div>
            <div class="row justify-center items-center">
              <q-btn
                icon="refresh"
                label="Retry"
                color="primary"
                @click="retryUpload(file)"
                class="q-ma-xs q-px-sm w-full"
              />
              <q-btn
                icon="cancel"
                label="Cancel"
                color="negative"
                @click.stop="cancelUpload(file)"
                class="q-ma-xs q-px-sm w-full"
              />
            </div>
          </div>

          <div
            v-if="file.isUploading && !(file as UploadFile).error"
            class="absolute inset-0 flex flex-col items-center justify-center bg-red-50 bg-opacity-80 rounded-lg"
          >
            <q-spinner color="primary" size="2em" />
            <div class="text-caption">
              Uploading
            </div>
          </div>

          <div
            v-if="file.isRemoving && !(file as UploadFile).error"
            class="absolute inset-0 flex flex-col items-center justify-center bg-red-50 bg-opacity-80 rounded-lg"
          >
            <q-spinner color="primary" size="2em" />
            <div class="text-caption">
              Removing
            </div>
          </div>

          <q-btn v-show="onHoverCardIndex === index"
            v-if="!file.isUploading && !file.isRemoving && !(file as UploadFile).error && !props.previewOnly"
            icon="delete"
            color="negative"
            @click.stop="removeFile(file, (String((file as UploadableModel).id) === '-1' ? index : null))"
            class="q-ma-xs q-px-sm absolute right-0 top-0"
          />
          <q-tooltip v-if="!props.hideTooltip" class="q-pa-sm" anchor="bottom middle" self="center middle">
            <span>{{ (file as UploadableModel).label || (file as UploadableModel).filename }}</span>
          </q-tooltip>
        </div>

        <q-card v-show="!loadedFiles.some(f => f.isUploading) && !props.previewOnly && !props.hidePlaceholder"
          v-if="isAddedFile"
          flat
          bordered
          class="flex flex-col items-center justify-center cursor-pointer rounded-lg"
          :class="props.placeholderClass ? props.placeholderClass : 'w-full h-full'"
          @click="scope.pickFiles"
        >
          <q-img v-if="!props.iconPlaceholder"
            class="mx-auto h-12 w-12"
            :class="props.iconPlaceholderClass ?? ''"
            src="https://www.svgrepo.com/show/357902/image-upload.svg"
            alt=""
          />
          <q-icon v-else
            :size="props.iconPlaceholderSize ? props.iconPlaceholderSize : 'lg'"
            :name="props.iconPlaceholder"
            :color="Dark.isActive ? 'white' : 'black'"
          />
          <h3
            class="mt-2 text-xs font-medium"
            :class="Dark.isActive ? 'text-white' : 'text-gray-900'"
          >
            <label for="file-upload" class="relative cursor-pointer">
              <div v-if="!props.messagePlaceholder"
                :style="`font-size: ${props.messagePlaceholderSize ?? '12px'}`"
                :class="props.messagePlaceholderClass ? props.messagePlaceholderClass : ''"
              >
                <span>Drag and Drop</span>
                <span class="text-indigo-600"> or Browse </span>
                <span>to Upload</span>
              </div>
              <div v-else class="text-center">
                <span
                  :style="`font-size: ${props.messagePlaceholderSize ?? '12px'}`"
                  :class="props.messagePlaceholderClass ? props.messagePlaceholderClass : ''"
                >{{ props.messagePlaceholder }}</span>
              </div>
            </label>
          </h3>
        </q-card>

        <q-card v-show="!loadedFiles.some(f => f.isUploading) && props.previewOnly && !loadedFiles.length"
          flat
          bordered
          class="flex flex-col items-center justify-center rounded-lg opacity-50"
          :class="props.placeholderClass ? props.placeholderClass : 'w-full h-full'"
        >
          <q-icon
            :size="props.iconPlaceholderSize ? props.iconPlaceholderSize : 'lg'"
            name="link_off"
            :color="Dark.isActive ? 'white' : 'black'"
          />
          <h3
            class="mt-2 text-xs font-medium"
            :class="Dark.isActive ? 'text-white' : 'text-gray-900'"
          >
            <label for="file-upload" class="relative">
              <div
                :class="props.messagePlaceholderSize ? `text-${props.messagePlaceholderSize}` : ''"
                class="text-uppercase text-center"
              >
                <span>No File attached</span>
              </div>
            </label>
          </h3>
        </q-card>
      </div>
      <!-- CARD STYLE DISPLAY -->
    </template>
  </q-uploader>

  <q-dialog
    :model-value="(Number(previewImageIndex) > -1)"
    @hide="previewImageIndex = -1"
    :maximized="$q.screen.lt.sm"
  >
    <q-card
      class="flex-1"
      style="
        display: flex;
        flex-direction: column;
        "
    >
    <!-- max-height: calc(90dvh - 10px); -->
      <q-card-section class="bg-white row items-start gap-1 q-pa-sm no-wrap" style="flex-shrink: 0;">
        <div class="flex-grow column gap-1">
          <q-item-label class="font-medium" :class="$q.screen.lt.sm ? 'text-sm' : 'text-lg'" style="line-height: unset;">
            <q-chip
              dense
              square
              color="primary"
              class="text-white font-medium"
              :label="(loadedFiles[previewImageIndex] as UploadableModel).extension.toUpperCase()"
              style="margin: unset"
            />
            {{ (loadedFiles[previewImageIndex] as UploadableModel).label || (loadedFiles[previewImageIndex] as UploadableModel).filename }}
          </q-item-label>

          <q-item-label class="font-medium" :class="$q.screen.lt.sm ? 'text-xs' : 'text-md'" style="line-height: unset;">
            {{ new Intl.DateTimeFormat('en-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format((loadedFiles[previewImageIndex] as UploadableModel).created_at ? new Date(String((loadedFiles[previewImageIndex] as UploadableModel).created_at)) : new Date()) }}
          </q-item-label>
        </div>

        <q-btn
          dense
          unelevated
          size="lg"
          icon="close"
          color="secondary"
          @click="previewImageIndex = -1"
        />
      </q-card-section>

      <q-card-section style="overflow-x: hidden;" class="flex-grow q-pa-none no-scrollbar">
        <q-img
          :src="imageURL(previewImageIndex)"
          fit="contain"
          style="width: 100%; height: 100%; overflow-y: hidden;"
          spinner-color="primary"
          spinner-size="82px"
          no-spinner
          @mousemove="handleZoomOnMouseMove"
          @mouseleave="handleZoomReset"
          @click="previewImageIndex = -1"
          @error="(loadedFiles[previewImageIndex] as UploadableModel).id ? handleGetNewUrl((loadedFiles[previewImageIndex] as UploadableModel).id) : undefined"
        >
          <template v-slot:error>
            <q-spinner color="primary" size="4em" class="absolute top-[47%] left-[47%]" />
          </template>
        </q-img>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog
    :model-value="openEditFileDialog !== false"
    persistent
    @hide="openEditFileDialog = false"
    :maximized="$q.screen.lt.sm"
  >
    <q-card class="min-w-[calc(100vw-400px)]">
      <q-card-section class="q-px-sm q-pb-xs">
        <q-item-label
          class="text-lg text-uppercase text-italic text-gray-700 text-bold text-center"
        >
          Confirm {{ loadedFiles.length > 1 ? 'Files' : 'File' }}
        </q-item-label>
      </q-card-section>

      <q-card-section class="q-px-sm q-py-xs">
        <q-list separator bordered class="rounded">
          <q-item
            v-for="(file, index) in loadedFiles.filter(f => !(f as UploadableModel).id)"
            :key="index"
          >
            <q-item-section avatar>
              <div class="row items-center gap-1">
                <q-icon v-if="(file as UploadFile).error"
                  name="warning"
                  color="negative"
                  size="md"
                  class="q-mr-xs"
                >
                  <q-tooltip>Upload Failed</q-tooltip>
                </q-icon>

                <q-img
                  v-if="imageURL(loadedFiles.findIndex(f => (f as UploadableModel).id ? ((f as UploadableModel).label === (file as UploadableModel).label && String((f as UploadableModel).id) === String((file as UploadableModel).id)) : f.filename === file.filename))"
                  :src="imageURL(loadedFiles.findIndex(f => (f as UploadableModel).id ? ((f as UploadableModel).label === (file as UploadableModel).label && String((f as UploadableModel).id) === String((file as UploadableModel).id)) : f.filename === file.filename))"
                  error-src="/no-image.jpg"
                  alt="Thumbnail"
                  :style="$q.screen.lt.sm ? 'width: 50px' : 'width: 80px'"
                  class="rounded-lg border cursor-pointer"
                  :ratio="1"
                  @click="openImagePreview(loadedFiles.findIndex(f => (f as UploadableModel).id ? ((f as UploadableModel).label === (file as UploadableModel).label && String((f as UploadableModel).id) === String((file as UploadableModel).id)) : f.filename === file.filename))"
                />
              </div>
            </q-item-section>
            <q-item-section class="column gap-1">
              <q-input
                :dense="$q.screen.lt.sm"
                outlined
                stack-label
                :autofocus="index === 0"
                v-model="(file as UploadableModel).label"
                label="File label (optional)"
                :disable="file.isUploading || file.isRemoving"
                :placeholder="file.filename.replace(`.${file.filename.split('.').pop()}`, '')"
              />
            </q-item-section>

            <q-item-section side>
              <q-btn v-if="!file.isUploading && !file.isRemoving"
                dense
                icon="delete"
                color="negative"
                :size="$q.screen.lt.sm ? '17px' : 'lg'"
                :tabindex="-1"
                @click="removeAddedFile(file as UploadableModel)"
              />

              <!-- <div v-if="(file as UploadFile).error"
                class="column gap-1"
              >
                <q-btn
                  dense
                  unelevated
                  icon="refresh"
                  color="primary"
                  @click="retryUpload(file)"
                >
                  <q-tooltip anchor="center left" self="center right">Retry</q-tooltip>
                </q-btn>

                <q-btn
                  dense
                  unelevated
                  icon="close"
                  color="negative"
                  @click.stop="cancelUpload(file)"
                >
                  <q-tooltip anchor="center left" self="center right">Cancel</q-tooltip>
                </q-btn>
              </div> -->

              <q-spinner v-if="(file.isUploading || file.isRemoving) && !(file as UploadFile).error" color="primary" size="2em" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions
        class="q-px-sm q-pt-xs"
        :class="$q.screen.lt.sm ? 'fixed bottom-0 left-0 w-full' : ''"
      >
        <q-space />
        <q-btn
          unelevated
          class="flex-1"
          :label="loadedFiles.some(f => (f as UploadFile).error) ? 'Retry' : 'Upload'"
          :color="loadedFiles.some(f => (f as UploadFile).error) ? 'accent' : 'primary'"
          :icon="loadedFiles.some(f => (f as UploadFile).error) ? 'refresh' : 'upload'"
          :disable="loadedFiles.filter(f => !(f as UploadableModel).id)?.some(f => (f as UploadableModel).isUploading)"
          @click="handleConfirmFiles()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  defineComponent,
  type PropType,
  onMounted,
  watch,
  toRaw,
} from 'vue';
import { type QUploader, Dark, type QTableColumn, useQuasar, type QUploaderFactoryFn, Notify, QImg } from 'quasar';
import { api as $api, api } from 'src/boot/axios';

defineComponent({
  name: 'UploadableItem',
});

const $q = useQuasar();

const emit = defineEmits(['update:modelValue']);

export interface UploadableModel {
  id: number;
  __file?: File;
  filename: string;
  label: string;
  extension: string;
  path: string;
  url: string;
  temp_url: string;
  isUploading?: boolean;
  isRemoving?: boolean;
  category?: string;
  created_at?: string;
}

interface UploadFile {
  filename: string;
  url?: string;
  __img?: File;
  __type?: string;
  __extension?: string;
  __size?: string;
  error?: boolean;
  response?: string[];
  isUploading?: boolean;
  isRemoving?: boolean;
  isCompressed?: boolean;
}

const props = defineProps({
  contentMinWidth: {
    type: String,
    required: false,
    default: '280px',
  },
  containerClass: String,
  contentClass: String,
  multiple: Boolean,
  modelValue: {
    type: null as unknown as PropType<
      UploadableModel | UploadableModel[] | null
    >,
    default: null,
    required: false,
  },
  modelId: {
    type: [Number, null],
    required: false,
    default: null,
  },
  modelType: {
    type: String || Number,
    required: false,
  },
  modelRelation: {
    type: String || Number,
    required: false,
  },
  category: {
    type: String || Number,
    required: false,
  },
  previewOnly: Boolean,
  messagePlaceholder: {
    type: String,
    required: false,
  },
  messagePlaceholderSize: {
    type: String,
    required: false,
  },
  messagePlaceholderClass: {
    type: String,
    required: false,
  },
  iconPlaceholder: {
    type: String,
    required: false,
  },
  iconPlaceholderSize: {
    type: String,
    required: false,
  },
  iconPlaceholderClass: {
    type: String,
    required: false,
  },
  hidePlaceholder: {
    type: Boolean,
    required: false,
    default: false
  },
  placeholderClass: String,
  displayInTable: Boolean,
  uploadEndpoint: {
    type: String,
    default: 'file-attachments'
  },
  hideTooltip: Boolean,
  fixedLabel: {
    type: String,
    required: false,
  },
  customFormField: {
    type: Object,
    requeire: false
  },
  triggerUploadOnId: {
    type: String,
    required: false
  },
  triggerPickfile: {
    type: Boolean,
    required: false,
    default: false
  },
  useLabelEdit: {
    type: Boolean,
    required: false,
    default: false
  }
});

const state = reactive({
  files: null as null | UploadableModel | UploadableModel[],
});

const tableColumns = [
  {
    name: 'label',
    required: true,
    label: 'Name',
    align: 'left',
    field: 'label',
    sortable: true,
  },
  {
    name: 'category',
    required: true,
    label: 'Category',
    align: 'right',
    field: 'category',
    sortable: true,
  },
  {
    name: 'actions',
    required: true,
    label: 'Actions',
    align: 'right',
    sortable: true,
  },
] as QTableColumn[];

const apiUrl = $api.defaults.baseURL;

const openEditFileDialog = ref(false);

const originalFiles = ref<File[]>([]);
const fileUploader = ref<QUploader | null>(null);
const loadedFiles = ref<(UploadFile | UploadableModel)[]>([]);

const previewImageIndex = ref(-1);
const onHoverCardIndex = ref(-1);

// const fileLabel = ref<string | null>(null);

const cloneUploadable = (file: UploadFile) => ({
  ...file,
  __img: file.__img,
});

onMounted(() => {
  if (props.modelValue) {
    state.files = JSON.parse(JSON.stringify(props.modelValue));
    if (Array.isArray(props.modelValue)) {
      state.files = props.modelValue.map(cloneUploadable) as unknown as UploadableModel[];
      loadedFiles.value = props.modelValue.map(cloneUploadable) as unknown as UploadableModel[];
    } else {
      const cloned = cloneUploadable(props.modelValue);
      state.files = cloned as unknown as UploadableModel;
      loadedFiles.value = [cloned as unknown as UploadableModel];
    }

    loadedFiles.value.forEach((file) => {
      if (!file.isRemoving) file.isRemoving = false;
      if (!file.isUploading) file.isUploading = false;
    })
  }
});

watch(() => props.triggerUploadOnId, () => {
  if (props.triggerUploadOnId !== '-1') {
    if (props.modelValue) {
      fileUploader.value?.addFiles((props.modelValue as UploadFile[]).map((f: UploadFile) => f.__img as File));
    }
  }
})

watch(() => props.triggerPickfile, () => {
  if (props.triggerPickfile) {
    fileUploader.value?.pickFiles('' as unknown as Event);
  }
})

const handleZoomOnMouseMove = (e: MouseEvent) => {
  if ($q.screen.gt.md && Number(previewImageIndex.value) === -1 || isUnableToPreviewImage.value) return;
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();

  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  const percentX = (offsetX / rect.width) * 100;
  const percentY = (offsetY / rect.height) * 100;

  target.style.transformOrigin = `${percentX}% ${percentY}%`;
  target.style.transform = 'scale(2)';
};

const handleZoomReset = (e: MouseEvent) => {
  if ($q.screen.gt.md && Number(previewImageIndex.value) === -1 || isUnableToPreviewImage.value) return;
  const target = e.currentTarget as HTMLElement;
  target.style.transform = 'scale(1)';
  target.style.transformOrigin = 'center center';
};

const isAddedFile = computed(() => {
  if (!props.multiple) {
    if (loadedFiles.value.length > 0 || props.modelValue !== null) return false;
    return true;
  }
  return true;
});

const imageURL = (index: number) => {
  if (loadedFiles.value[index]?.url) {
    return loadedFiles.value[index].url;
  } else if ((loadedFiles.value[index] as UploadableModel)?.temp_url) {
    return (loadedFiles.value[index] as UploadableModel)?.temp_url;
  } else {
    return `/${(loadedFiles.value[index] as UploadableModel)?.id}`;
  }
  // return (
  //   loadedFiles.value[index]?.url ||
  //   (props.modelValue as UploadableModel).url ||
  //   (props.modelValue as UploadableModel[])[index]?.url ||
  //   (loadedFiles.value[index] as UploadableModel).temp_url ||
  //   'https://cdn0.iconfinder.com/data/icons/dicticons-files-folders/32/file_image_blocked-1024.png'
  // );
};

// const dataFormFields = () => {
//   const fields = [
//     { name: 'model_type', value: String(props.modelType) },
//     { name: 'model_relation', value: String(props.modelRelation) },
//   ];

//   if (props.modelId) {
//     fields.push({ name: 'model_id', value: String(props.modelId) });
//   }
//   if (props.category) {
//     fields.push({ name: 'category', value: String(props.category) });
//   }

//   return fields;
// };

const onUploadFailed = (info: { files: readonly File[]; xhr: { response: string } }) => {
  const failedFiles = info.files;
  failedFiles.forEach((file) => {
    const index = loadedFiles.value.findIndex((f) => f.filename === file.name);
    if (index !== -1) {
      (loadedFiles.value[index] as UploadFile).isUploading = false;
      (loadedFiles.value[index] as UploadFile).error = true;
    }
  });

  // REMOVE SUCCESSFULLY UPLOADED FILES (UNTESTED, MAY BE BROKEN OR NOT FUNCTIONING CORRECTLY)
  // const notFailedFiles = loadedFiles.value.filter((f) => !(f as UploadFile).error)

  // console.warn(notFailedFiles)
  // if (notFailedFiles) {
  //   notFailedFiles.forEach((f) => {
  //     if (fileUploader.value) fileUploader.value.removeFile((f as UploadFile).__img as File);
  //   })
  // }

  // loadedFiles.value = loadedFiles.value.filter((f) => (f as UploadFile).error);

  // ===============================================================================

  console.error('[ERROR] UPLOADABLE FAILED UPLOAD FILE :', info);

  Notify.create({
    message: 'Upload Failed',
    caption: String(JSON.parse(info.xhr.response).message),
    type: 'negative',
    classes: 'text-uppercase',
    position: 'top-right'
  });
};

const retryUpload = (file: UploadFile) => {
  file.isUploading = true;
  file.error = false;
  if (fileUploader.value) {
    fileUploader.value.upload();
  }
};

const cancelUpload = (file: UploadFile) => {
  file.error = false;

  if (fileUploader.value) {
    fileUploader.value.removeFile(file.__img as File);
  }

  loadedFiles.value = loadedFiles.value.filter((f) => f.filename !== file.filename);

  if (loadedFiles.value.filter(lf => !(lf as UploadableModel).id).length === 0 && openEditFileDialog.value) {
    openEditFileDialog.value = false
  }
}

const onFileUploaded = (info: { files: readonly File[]; xhr: { response: string } }) => {
  const response = JSON.parse(info.xhr.response).data;
  if (props.multiple) {
    info.files.forEach((file) => {
      const index = loadedFiles.value.findIndex((f) => f.filename === file.name && !(f as UploadableModel).id);
      if (index !== -1) {
        (loadedFiles.value[index] as UploadFile).isUploading = false;
        (loadedFiles.value[index] as UploadableModel).id = response.id;
        (loadedFiles.value[index] as UploadableModel).created_at = response.created_at;
      }
      if (!state.files) {
        state.files = [];
      }

      if (Array.isArray(state.files)) state.files.push(response);
    });
  } else {
    state.files = response;
    loadedFiles.value.forEach((file) => {
      (file as UploadFile).isUploading = false;
      (file as UploadableModel).id = response.id;
      (file as UploadableModel).created_at = response.created_at;
    });
  }
  const data = state.files;

  if (fileUploader.value) {
    fileUploader.value.removeUploadedFiles();
  }

  emit('update:modelValue', data);
  openEditFileDialog.value = false;
};

const onFileAdded = async (addedFiles: readonly File[]) => {

  const fileProcessingPromises = addedFiles.map((file) => {
    return new Promise<void>((resolve) => {
          originalFiles.value.push(file);

          const reader = new FileReader();
          reader.onload = (e: ProgressEvent<FileReader>) => {
            if (e.target?.result) {
              const extension = file.name.split('.').pop();
              const url = URL.createObjectURL(file);

              const imgInState = (props.modelValue as UploadFile[])?.find(f => f.__img === file) || undefined;

              loadedFiles.value.push({
                label: (props.fixedLabel ? props.fixedLabel : imgInState ? (imgInState as UploadableModel).label : ''),
                filename: file.name,
                url: url,
                __img: file,
                __size: (file.size / 1000).toFixed(1) + 'KB',
                __type: file.type,
                __extension: String(extension),
                extension: String(extension),
                isUploading: false,
                isCompressed: false,
              });
            }
            resolve();
          };
          reader.readAsDataURL(file);
        // }
      // }
    });
  });

  await Promise.all(fileProcessingPromises);

  if ((props.displayInTable && !props.fixedLabel && (props.triggerUploadOnId === '-1' || !props.triggerUploadOnId) || props.useLabelEdit)) {
    openEditFileDialog.value = true;
  } else {
    // loadedFiles.value.filter(lf => !(lf as UploadableModel).id).forEach((file) => {
    //   file.isUploading = true;
    // })

    // fileUploader.value?.upload();

    emit('update:modelValue', loadedFiles.value);
  }
};

const removeFile = async (file: UploadFile, index: number | null = null) => {
  // const originalFileIndex = originalFiles.value.findIndex(
  //   (f) => f.name === file.filename
  // );

  if (index) {
    originalFiles.value.splice(index, 1);

    if (state.files) {
      if (Array.isArray(state.files)) {
        state.files.splice(index, 1);
      } else {
        state.files = null;
      }
    }
  } else {
    // if (files.value[index]) files.value[index].isRemoving = true;
    file.isRemoving = true;

    if (props.multiple && state.files && Array.isArray(state.files)) {
      const id = state.files.find(f => (f).label === (file as UploadableModel).label )?.id;
      await fetch(`${apiUrl}/api/file-attachments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then(() => {
        if (state.files) {
          if (Array.isArray(state.files)) {
            (state.files as UploadableModel[]).splice(state.files.findIndex(f => f.id === id), 1);
          } else {
            state.files = null;
          }
        }
      }).catch((err) => {
        console.error('[APP] Error on deleting file', err);
      });
    } else if (state.files && typeof state.files === 'object') {
      const id = (state.files as UploadableModel).id;
      await fetch(`${apiUrl}/api/file-attachments/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then(() => {
        if (state.files && typeof state.files === 'object') {
          fileUploader.value?.removeUploadedFiles();
          state.files = null;
        }
      }).catch((err) => {
        console.error('[APP] Error on deleting file', err);
      });
    }

    file.isRemoving = false;
  }

  const fileToRemove = fileUploader.value?.files.find(f => f === file.__img);
  if (fileToRemove) fileUploader.value?.removeFile(fileToRemove);

  loadedFiles.value.splice(loadedFiles.value.findIndex(f => (f as UploadableModel).id || String((f as UploadableModel).id) !== '-1' ? ((f as UploadableModel).label === (file as UploadableModel).label && String((f as UploadableModel).id) === String((file as UploadableModel).id)) : (f as UploadFile).__img === file.__img), 1);

  emit('update:modelValue', state.files);
};

const openImagePreview = (index: number) => {
  previewImageIndex.value = index;
}

const removeAddedFile = (file: UploadableModel) => {
  const addedFileList = loadedFiles.value.filter(f => !(f as UploadableModel).id)

  if (addedFileList) {
    loadedFiles.value.splice(loadedFiles.value.findIndex(f => (f as UploadableModel).id ? ((f as UploadableModel).label === file.label && String((f as UploadableModel).id) === String(file.id)) : f.filename === file.filename), 1);
    originalFiles.value.splice(originalFiles.value.findIndex(f => f === (file as unknown as { __img: File }).__img), 1);
    fileUploader.value?.removeFile((file as unknown as { __img: File }).__img);

    if (addedFileList.length === 1) {
      openEditFileDialog.value = false
    }
  }
}

const handleConfirmFiles = () => {
  loadedFiles.value.filter(f => !(f as UploadableModel).id).forEach((file) => {
    file.isUploading = true;
    (file as UploadFile).error = false;
    if (!(file as UploadableModel).label || (file as UploadableModel).label === '') {
      const extension = file.filename.split('.').pop();
      (file as UploadableModel).label = String(file.filename.replace('.' + extension, ''))
    }
  })

  if (props.modelId) {
    fileUploader.value?.upload();
  } else {
    if (props.multiple) {
      loadedFiles.value.filter(f => !(f as UploadableModel).id).forEach((file) => {
        file.isUploading = false;
        (file as UploadableModel).id = -1;
        (file as UploadableModel).created_at = new Date().toISOString();
        if (!state.files) {
          state.files = [];
        }

        if (Array.isArray(state.files)) state.files.push(file as UploadableModel);
      });
    } else {
      state.files = loadedFiles.value as UploadableModel[];
      loadedFiles.value.filter(f => !(f as UploadableModel).id).forEach((file) => {
        (file as UploadFile).isUploading = false;
        (file as UploadableModel).id = -1;
        (file as UploadableModel).created_at = new Date().toISOString();
      });
    }
    const data = state.files;

    if (fileUploader.value) {
      fileUploader.value.removeUploadedFiles();
    }

    emit('update:modelValue', toRaw(data));
    openEditFileDialog.value = false;
  }
}

const uploadFactory: QUploaderFactoryFn = (files) => {
  const file = files[0]

  const targetFile = loadedFiles.value.find(
    f => f.filename === file?.name && !(f as UploadableModel).id
  ) as UploadableModel | undefined

  return {
    url: `${apiUrl}/api/${(props.uploadEndpoint.startsWith('/') ? props.uploadEndpoint.slice(1) : props.uploadEndpoint)}`,
    method: 'POST',
    withCredentials: true,

    formFields: [
      { name: 'label', value: targetFile?.label ?? file?.name ?? '' },
      // { name: 'attachable_type', value: String(props.modelType) },
      { name: 'attachable[type]', value: String(props.modelType) },
      { name: 'model_type', value: String(props.modelType) }, //content support for legacy uploadables
      ...(props.modelId || props.triggerUploadOnId !== '-1'
        ? [
          // { name: 'attachable_id', value: String(props.modelId) },
          { name: 'attachable[id]', value: (props.triggerUploadOnId ? String(props.triggerUploadOnId) : String(props.modelId)) },
          { name: 'model_id', value: String(props.modelId) } //content support for legacy uploadables
        ]
        : []),
      ...(props.modelRelation
        ? [
          { name: 'model_relation', value: String(props.modelRelation) } //content support for legacy uploadables
        ]
        : []),
      ...(props.category
        ? [{ name: 'category', value: String(props.category) }]
        : []),
    ]
  }
}

const isUnableToPreviewImage = ref(false);

const handleGetNewUrl = async (id: number, forDownload = false) => {
  isUnableToPreviewImage.value = true;
  const attachment = loadedFiles.value.find(f => (f as UploadableModel).id === id)

  await api.get(`/api/file-attachments/${String(id)}`).then(async (res) => {
    if (res.data && attachment) {
      (attachment as UploadableModel).url = res.data.url;
      isUnableToPreviewImage.value = false;

      if (forDownload) {
        await downloadFromS3(attachment as UploadableModel);
      }
    }
  }).catch((err) => {
    console.error('[APP] Error on getting file url', err);

    Notify.create({
      message: 'Failed to get file url',
      caption: err.response?.data?.message,
      type: 'negative',
      position: 'top-right'
    })
  })
}

const downloadFromS3 = async (file: UploadableModel) => {
  if (!file.url && !file.temp_url) {
    await handleGetNewUrl(file.id, true);
  }

  // const link = document.createElement('a')
  // link.href = file.url || file.temp_url
  // link.setAttribute('download', file.filename || `${file.label}.${file.extension}`);
  // link.target = '_blank'
  // link.rel = 'noopener'

  // document.body.appendChild(link)
  // link.click()
  // document.body.removeChild(link)

  try {
    const res = await fetch(file.url || file.temp_url)

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', file.filename || `${file.label}.${file.extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);

  } catch (error) {
    console.error('Download failed:', error);
  }
}

// const forceDownloadFromS3 = async (file: UploadableModel) => {
//   const res = await fetch(file.url)
//   const blob = await res.blob()

//   const blobUrl = URL.createObjectURL(blob)
//   const a = document.createElement('a')
//   a.href = blobUrl
//   a.download = file.filename || `${file.label}.${file.extension}`
//   a.click()

//   URL.revokeObjectURL(blobUrl)
// }

</script>

<style>
.uploadable .q-uploader__header {
  display: none;
}

.uploadable .q-uploader {
  max-height: unset;
}

.q-uploader__list {
  padding: unset !important;
}

.custom-caption {
  text-align: left;
  padding: 12px;
  color: white;
  background-color: rgba(0, 0, 0, 0.3);
}
</style>

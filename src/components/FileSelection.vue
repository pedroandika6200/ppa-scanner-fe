<template>
  <q-card
    flat
    bordered
    class="flex-grow"
  >
    <q-card-section v-if="!takePhoto" class="flex flex-center min-h-[calc(100dvh-80px)] row gap-1">
      <uploadable-item
        flat
        message-placeholder="Upload file"
        message-placeholder-size="14px"
        message-placeholder-class="text-uppercase text-italic font-medium"
        style="width: unset !important;"
        placeholder-class="q-px-sm"
        icon-placeholder-class="w-[100px] h-[100px]"
        accept="image/*,.pdf"
        v-model="selectedFile"
        @update:model-value="(e) => handleSelectFile(e)"
      />

      <q-card v-show="!selectedFile"
        flat
        bordered
        class="flex flex-center cursor-pointer rounded-lg"
        @click="takePhoto = !takePhoto"
      >
        <q-card-section
          class="flex flex-center column justify-between q-px-xs q-pt-xs q-pb-none text-sm text-uppercase font-medium"
        >
          <q-icon name="camera_alt" size="100px" class="cursor-pointer" />
          <span class="text-italic font-medium">Take Photo</span>
        </q-card-section>
      </q-card>

      <div v-if="selectedFile"
        class="column items-center gap-3"
      >
        <q-spinner
          color="primary"
          size="xl"
        />
        <q-item-label class="text-uppercase text-italic text-gray-700 font-medium">
          Loading Document
        </q-item-label>
      </div>
    </q-card-section>

    <q-card-section v-else-if="takePhoto"
      class="min-h-[calc(100dvh-80px)] q-pa-xs"
      :class="$q.screen.lt.md ? 'column gap-1' : 'row no-wrap gap-2'"
    >
      <photo-picker
        close-on-capture
        :capture="triggerCapture"
        @close="takePhoto = !takePhoto"
        @captured="emit('captured', $event)"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PhotoPicker from './PhotoPicker.vue';
import UploadableItem from './UploadableItem.vue';
import type { UploadableModel } from 'src/types/model';
import { convertPDFToImage, fileToBase64 } from 'src/composable/file-helper';

const emit = defineEmits(['captured']);

const takePhoto = ref(false);
const triggerCapture = ref(false);

const selectedFile = ref<UploadableModel | null>(null);

const handleSelectFile = async (file: UploadableModel[]) => {
  const base64 = await fileToBase64((file[0] as UploadableModel).__img as File);

  if (!['/', 'i', 'R', 'U'].includes(String(base64.split(';base64,')[1]?.charAt(0)))) {
    const images = await convertPDFToImage((file[0] as UploadableModel).__img as File);

    // await handleCapturedPhoto(images);
    emit('captured', images);
  } else {
    // await handleCapturedPhoto([base64]);
    emit('captured', [base64]);
  }
}
</script>


<!-- <template>
  <q-card v-if="!selectedImages.length"
    flat
    bordered
    class="flex-grow"
  >
    <q-card-section xv-if="!takePhoto" class="flex flex-center min-h-[calc(100dvh-80px)] row gap-1">
      <uploadable-item
        flat
        message-placeholder="Upload file"
        message-placeholder-size="14px"
        message-placeholder-class="text-uppercase text-italic font-medium"
        style="width: unset !important;"
        placeholder-class="q-px-sm"
        icon-placeholder-class="w-[100px] h-[100px]"
        accept="image/*,.pdf"
        v-model="selectedFile"
        @update:model-value="(e) => handleSelectFile(e)"
      />

      <q-card v-show="!selectedFile"
        flat
        bordered
        class="flex flex-center cursor-pointer rounded-lg"
        @click="takePhoto = !takePhoto"
      >
        <q-card-section
          class="flex flex-center column justify-between q-px-xs q-pt-xs q-pb-none text-sm text-uppercase font-medium"
        >
          <q-icon name="camera_alt" size="100px" class="cursor-pointer" />
          <span class="text-italic font-medium">Take Photo</span>
        </q-card-section>
      </q-card>

      <div v-if="selectedFile"
        class="column items-center gap-3"
      >
        <q-spinner
          color="primary"
          size="xl"
        />
        <q-item-label class="text-uppercase text-italic text-gray-700 font-medium">
          Loading Document
        </q-item-label>
      </div>
    </q-card-section>
  </q-card>

  <q-card v-else
    flat
    bordered
    class="flex-grow"
  >
    <q-card-section
      class="q-pa-xs overflow-hidden"
    >
      <q-scroll-area
        class="no-scrollbar"
        style="height: calc(100dvh - 120px);"
      >
        <q-list class="grid grid-cols-3 justify-center gap-1">
          <q-item
            v-for="(image, imageIndex) in selectedImages"
            :key="imageIndex"
            class="border rounded q-px-xs flex-grow"
            clickable
            @click="handlePreviewImage(image)"
          >
            <q-item-section
              top
              side
              style="padding-left: 1px !important; padding-right: unset !important;"
            >
              <q-chip
                dense
                square
                size="lg"
                color="primary"
                class="q-ml-none"
                text-color="white"
                :label="`${imageIndex + 1}`"
              />
            </q-item-section>

            <q-item-section>
              <q-img
                :src="image"
                fit="contain"
                class="min-w-[calc(30dvw-40px)] max-h-[calc(100dvh-150px)] rounded"
              />
              <q-btn
                dense
                color="negative"
                icon="delete"
                class="absolute top-1 right-1 z-100"
                @click="handleRemoveImage(imageIndex)"
              />
            </q-item-section>
          </q-item>

          <q-item
            class="border rounded flex flex-center min-h-[214px]"
          >
            <q-item-section xv-if="!takePhoto" class="flex flex-row gap-1">
              <uploadable-item
                flat
                :key="uploaderKey"
                message-placeholder="Upload file"
                message-placeholder-size="14px"
                message-placeholder-class="text-uppercase text-italic font-medium"
                style="width: unset !important;"
                placeholder-class="q-px-sm"
                icon-placeholder-class="w-[100px] h-[100px]"
                accept="image/*,.pdf"
                v-model="selectedFile"
                @update:model-value="(e) => handleSelectFile(e)"
              />

              <q-card v-show="!selectedFile"
                flat
                bordered
                class="flex flex-center cursor-pointer rounded-lg"
                @click="takePhoto = !takePhoto"
              >
                <q-card-section
                  class="flex flex-center column justify-between q-px-xs q-pt-xs q-pb-none text-sm text-uppercase font-medium"
                >
                  <q-icon name="camera_alt" size="100px" class="cursor-pointer" />
                  <span class="text-italic font-medium">Take Photo</span>
                </q-card-section>
              </q-card>

              <div v-if="selectedFile"
                class="column items-center gap-3"
              >
                <q-spinner
                  color="primary"
                  size="xl"
                />
                <q-item-label class="text-uppercase text-italic text-gray-700 font-medium">
                  Loading Document
                </q-item-label>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-card-section>

    <q-card-actions class="q-pa-xs">
      <q-btn
        unelevated
        icon="close"
        label="Cancel"
        color="secondary"
        class="flex-grow"
        @click="selectedImages = []; selectedFile = null"
      />
      <q-btn
        unelevated
        icon="task_alt"
        label="Confirm"
        color="primary"
        class="flex-grow"
        @click="handleConfirmFile(selectedImages)"
      />
    </q-card-actions>
  </q-card>

  <q-dialog
    v-model="takePhoto"
    persistent
  >
    <q-card flaat bordered class="min-w-[calc(80dvw-10px)]">
      <q-card-section class="q-pa-xs">
        <photo-picker
          close-on-capture
          :capture="triggerCapture"
          @close="takePhoto = !takePhoto"
          @captured="handleCapturePhoto"
        />
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog
    :model-value="!(!previewImage)"
    @before-hide="previewImage = null"
  >
    <q-card>
      <q-card-actions align="right" clasas="absolute top-0">
        <q-btn
          flat
          icon="close"
          class="q-mx-none"
          v-close-popup
        />
      </q-card-actions>

      <q-card-section>
        <img :src="String(previewImage)" class="w-full">
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PhotoPicker from './PhotoPicker.vue';
import UploadableItem from './UploadableItem.vue';
import type { UploadableModel } from 'src/types/model';
import { convertPDFToImage, fileToBase64 } from 'src/composable/file-helper';

const emit = defineEmits(['captured']);

const takePhoto = ref(false);
const triggerCapture = ref(false);

const selectedFile = ref<UploadableModel | null>(null);
const uploaderKey = ref(0);

const previewImage = ref<string | null>(null);

const selectedImages = ref<string[]>([]);

const handleSelectFile = async (file: UploadableModel[]) => {
  const base64 = await fileToBase64((file[0] as UploadableModel).__img as File);

  if (!['/', 'i', 'R', 'U'].includes(String(base64.split(';base64,')[1]?.charAt(0)))) {
    const images = await convertPDFToImage((file[0] as UploadableModel).__img as File);

    selectedImages.value.push(...images);

    selectedFile.value = null;
    uploaderKey.value += 1;
  } else {
    selectedImages.value.push(base64);
    selectedFile.value = null;
    uploaderKey.value += 1;
  }
}

const handleConfirmFile = (images: string[]) => {
  emit('captured', images);
}

const handleCapturePhoto = (image: string) => {
  selectedImages.value.push(image);
}

const handleRemoveImage = (index: number) => {
  selectedImages.value.splice(index, 1);
}

const handlePreviewImage = (image: string) => {
  previewImage.value = image;
}
</script> -->

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

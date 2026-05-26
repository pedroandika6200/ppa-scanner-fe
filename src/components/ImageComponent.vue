<template>
  <q-card flat>
    <q-card-section
      class="q-pa-none overflow-hidden"
      @mouseover="showImageOption = true"
      @mouseleave="showImageOption = false"
    >
      <q-img
        :src="image"
        fit="contain"
        class="w-full max-h-[calc(100dvh-150px)] rounded"
        :class="isImageZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'"
        @mousemove="(e: MouseEvent) => zoomMode === 'mouseover' ? handleZoomIn(e) : undefined"
        @mouseleave="(e: MouseEvent) => zoomMode === 'mouseover' ? handleZoomReset(e) : undefined"
        @click.stop="(e: MouseEvent) => zoomMode === 'click' ? isImageZoomed ? handleZoomReset(e) : handleZoomIn(e) : undefined"
      />

      <div v-if="showImageOption"
        class="absolute-top-right z-100 rounded-bl rounded-tr row no-wrap bg-gray-800"
        style="padding: 5px;"
      >
        <q-btn
          dense
          unelevated
          text-color="white"
          :icon="zoomMode === 'click' ? 'ads_click' : 'zoom_out_map'"
          @click="handleChangeZoomMode"
        />

        <q-btn
          dense
          unelevated
          text-color="white"
          icon="rotate_left"
          @click="rotateImage(-90)"
        />

        <q-btn
          dense
          unelevated
          text-color="white"
          icon="rotate_right"
          @click="rotateImage(90)"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { isImageZoomed } from 'src/composable/file-helper';
import { handleZoomIn, handleZoomReset } from 'src/composable/file-helper';
import { ref } from 'vue';

const props = defineProps<{
  image: string,
}>();

const image = ref<string>(props.image);
const showImageOption = ref(false);
const zoomMode = ref<'click' | 'mouseover'>('mouseover');

const rotateImage = (degree = 90) => {
  const img = new Image();
  img.src = image.value;

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const rad = degree * Math.PI / 180;

    if (degree % 180 !== 0) {
      canvas.width = img.height;
      canvas.height = img.width;
    } else {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    if (!ctx) return;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);

    ctx.drawImage(
      img,
      -img.width / 2,
      -img.height / 2
    );

    image.value = canvas.toDataURL('image/png');
  };
};

const handleChangeZoomMode = () => {
  zoomMode.value = zoomMode.value === 'mouseover' ? 'click' : 'mouseover';
}
</script>

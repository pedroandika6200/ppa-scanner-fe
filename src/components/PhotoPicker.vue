<template>
  <div class="column gap-1 justify-between w-full" style="height: calc(100dvh - 80px)">
    <div>
      <video ref="videoRef" autoplay playsinline class="w-[calc(100vw-18px)] max-h-[calc(100dvh-180px)]" />
      <img v-if="photo && props.displayCaptured" :src="photo" width="100%" />
      <canvas ref="canvasRef" style="display: none;"></canvas>
    </div>

    <!-- <q-space /> -->

    <div class="column gap-1">
      <div class="grid grid-cols-2 gap-1">
        <q-space />
        <q-select
          dense
          outlined
          label="Camera"
          v-model="camera"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          :options="cameras"
          :class="$q.screen.lt.md ? 'flex-grow' : ''"
          @update:model-value="onCameraChanged"
        />
      </div>

      <div
        class="grid grid-cols-2 gap-1"
      >
        <q-btn
          dense
          unelevated
          :size="$q.screen.lt.md ? 'lg' : 'lg'"
          icon="cancel"
          color="secondary"
          class="flex-grow"
          :xclass="$q.screen.lt.md ? 'flex-grow' : ''"
          :label="$q.screen.lt.md ? 'Close' : 'Close'"
          @click="handleClose"
        />

        <q-btn
          dense
          unelevated
          :size="$q.screen.lt.md ? 'lg' : 'lg'"
          icon="camera"
          no-wrap
          color="primary"
          :label="$q.screen.lt.md ? 'Capture' : 'Capture'"
          class="flex-grow"
          :xclass="$q.screen.lt.md ? 'flex-grow' : ''"
          @click="takePhoto"
        />
      </div>
    </div>
  </div>
  <!-- <q-card flat class="row no-wrap">
    <q-card-section class="flex flex-center row no-wrap">
      <video ref="videoRef" autoplay playsinline class="w-[calc(100vw-40px)] max-h-[calc(100dvh-100px)]" />
      <img v-if="photo && props.displayCaptured" :src="photo" width="100%" />
      <canvas ref="canvasRef" style="display: none;"></canvas>
    </q-card-section>

    <q-card-section class="q-pl-none q-pr-md column items-center gap-1">
      <q-btn
        size="xl"
        icon="close"
        color="negative"
        style="padding: 15px;"
        v-close-popup
      />
      <q-btn
        size="xl"
        icon="camera"
        color="primary"
        style="padding: 15px;"
        @click="takePhoto"
      />
    </q-card-section>
  </q-card> -->
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const emit = defineEmits(['captured', 'close']);

const props = defineProps<{
  displayCaptured?: boolean,
  closeOnCapture?: boolean,
  capture: boolean
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const stream = ref<MediaStream | null>(null);

const photo = ref<string | null>(null);
const camera = ref<string | null>(null);

const cameras = ref<{ label: string; value: string }[]>([]);

const getCameras = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();

  const videoDevices = devices.filter(
    device => device.kind === 'videoinput'
  );

  cameras.value = videoDevices.map((device, index) => ({
    label: device.label || `Camera ${index + 1}`,
    value: device.deviceId
  }));

  const lastCameraUsed = localStorage.getItem('lastCameraUsed');

  if (!camera.value && cameras.value.length > 0 && cameras.value[0]) {
    if (lastCameraUsed) camera.value = lastCameraUsed;
    else camera.value = cameras.value[0].value;
  }
};

const startCamera = async () => {
  try {
    // stream.value = await navigator.mediaDevices.getUserMedia({
    //   video: true
    // });

    stopCamera();

    stream.value = await navigator.mediaDevices.getUserMedia({
      video: camera.value
        ? {
            deviceId: {
              exact: camera.value
            }
          }
        : true
    });

    if (videoRef.value) {
      videoRef.value.srcObject = stream.value;
    }
  } catch (err) {
    console.error('Camera error:', err);
  }
};

const stopCamera = () => {
  stream.value?.getTracks().forEach(track => track.stop());
};

const takePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return;

  const video = videoRef.value;
  const canvas = canvasRef.value;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/png');

  photo.value = dataUrl;
  emit('captured', dataUrl);

  if (props.closeOnCapture) handleClose();
};

const handleClose = () => {
  stopCamera();

  emit('close');
}

const onCameraChanged = (val: string) => {
  localStorage.setItem('lastCameraUsed', val);
}

onMounted(async () => {
  await navigator.mediaDevices.getUserMedia({
    video: true
  });

  await getCameras();

  await startCamera();
});

onBeforeUnmount(stopCamera);

watch(camera, async () => {
  await startCamera();
});

watch(() => props.capture, () => {
  if (props.capture) {
    takePhoto();
  }
})
</script>

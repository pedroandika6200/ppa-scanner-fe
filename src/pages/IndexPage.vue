<template>
  <q-page class="row items-center q-pa-xs gap-2">
    <file-selection v-if="Object.values(capturedPhoto).every(p => !p.base64)"
      @captured="handleCapturedPhoto"
    />

    <div v-else
      style="overflow-x: hidden;"
      class="column flex-grow z-[50]"
    >
      <div class="row no-wrap">
        <div
          class="row q-px-none no-scrollbar"
          style="overflow-x: auto; white-space: nowrap; display: block;"
        >
          <q-tabs
            dense
            v-model="imageTab"
            color="teal"
            active-bg-color="teal"
            active-class="text-white"
            indicator-color="transparent"
            class="text-teal q-my-none q-mx-sm border-t border rounded-t"
            inline-label
          >
            <q-tab
              v-for="(photo, photoIndex) in capturedPhoto"
              :key="photoIndex"
              :name="photoIndex"
              :xicon="photo.on_process ? '' : 'assignment'"
              :xlabel="`Form ${photoIndex + 1}`"
              :class="photoIndex === capturedPhoto.length - 1 ? '' : 'border-r'"
            >
              <template v-slot:default>
                <div class="row items-center gap-2">
                  <q-spinner v-if="photo.on_process"
                    size="sm"
                  />

                  <q-icon v-else
                    size="sm"
                    :name="photo.is_submitted ? 'task_alt' : photo.is_error ? 'warning' : 'assignment'"
                  />

                  <q-item-label class="font-medium">
                    {{ `Form ${photoIndex + 1}` }}
                  </q-item-label>
                </div>
              </template>
            </q-tab>
          </q-tabs>
        </div>
      </div>

      <q-tab-panels
        animated
        v-model="imageTab"
        keep-alive
      >
        <q-tab-panel
          v-for="(photo, photoIndex) in capturedPhoto"
          :key="photoIndex"
          :name="photoIndex"
          class="q-pa-none"
        >
          <q-card
            flat
            bordered
            class="flex-grow"
          >

            <q-card-section
              class="min-h-[calc(100dvh-140px)] q-py-xs q-px-none"
            >
              <div
                class="gap-2 q-px-xs"
                :xclass="$q.screen.gt.sm ? 'grid grid-cols-2' : 'column'"
              >
                <!-- <div class="column gap-2 flex-grow">
                  <image-component
                    :image="photo.base64"
                  />
                </div> -->

                <div class="row items-center gap-1">
                  <q-space />
                  <q-btn
                    dense
                    unelevated
                    size="12px"
                    icon="image"
                    label="View Image"
                    color="primary"
                    class="q-pr-sm text-bold"
                    @click="handleViewImage(photo)"
                  />

                  <q-btn-dropdown v-if="!photo.on_process && (!photo.is_submitted && !photo.form.items.some(i => i.is_submitted))"
                    dense
                    unelevated
                    size="12px"
                    icon="refresh"
                    color="green-4"
                    text-color="black"
                    class="disable-arrow q-pr-sm text-bold"
                    label="Re-generate results"
                    :disable="!(!photo.on_process)"
                    @click.stop
                  >
                    <q-card>
                      <q-card-section class="q-pa-sm column items-center">
                        <q-item-label class="font-medium text-italic text-uppercase">
                          Are you sure?
                        </q-item-label>
                        <q-item-label caption class="font-medium text-italic text-uppercase">
                          This action will clear all inputted data
                        </q-item-label>
                      </q-card-section>

                      <q-card-actions align="right">
                        <q-btn
                          dense
                          unelevated
                          size="12px"
                          icon="close"
                          label="No"
                          color="secondary"
                          class="q-py-none flex-grow"
                          v-close-popup
                        />
                        <q-btn
                          dense
                          unelevated
                          size="12px"
                          icon="refresh"
                          label="Yes"
                          color="primary"
                          class="q-py-none flex-grow"
                          v-close-popup
                          @click="handleRegenerateScanResult(photo.base64, photoIndex)"
                        />
                      </q-card-actions>
                    </q-card>

                    <template v-slot:label>
                      <q-tooltip self="center right" anchor="center left">
                        <q-item-label class="font-medium text-md text-italic text-uppercase">
                          Regenerate all scanned results
                        </q-item-label>
                      </q-tooltip>
                    </template>
                  </q-btn-dropdown>
                </div>

                <q-form v-if="photo.scan_result"
                  :ref="(e) => setFormRef((e as QForm), photoIndex)"
                  class="column gap-1"
                >
                  <form-component
                    :data="photo"
                  />
                </q-form>

                <q-card v-if="!photo.scan_result && photo.on_process"
                  flat
                  bordered
                  class="flex flex-center q-mt-xs"
                >
                  <q-card-section
                    class="min-h-[calc(100dvh-180px)] flex flex-col items-center justify-center gap-1 text-lg font-medium text-italic text-uppercase text-gray-500"
                  >
                    <q-spinner size="xl" color="primary" />
                    <q-item-label class="text-bold text-gray-500 text-center">
                      Processing image, please wait
                    </q-item-label>
                  </q-card-section>
                </q-card>
              </div>
            </q-card-section>

            <q-card-actions class="q-px-xs q-pt-none q-pb-xs">
              <q-btn
                unelevated
                color="secondary"
                icon="close"
                :label="photo.form.items.length && photo.form.items.every(item => !item.loading && !(!item.is_submitted)) ? 'Close' : 'Cancel'"
                class="flex-grow"
                :disable="!(!photo.form) && !(!photo.on_process)"
                @click="handleCancelForm(photoIndex)"
              />

              <q-btn v-if="photo.scan_result && !photo.form.items.every(item => !item.loading && !(!item.is_submitted))"
                unelevated
                color="primary"
                icon="task_alt"
                label="Submit"
                class="flex-grow"
                :disable="!(!photo.on_process)"
                @click="handleSubmitForm(photoIndex)"
              />
            </q-card-actions>
          </q-card>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { Notify, type QForm } from 'quasar';
import { api, n8nApi } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/auth-store';
import type { CapturedImageModel, InspectionFormModel, OperatorModel, PackingItemFaultModel, PackingItemOrderModel, PartModel, UnitModel, UploadableModel, WOItemModel } from 'src/types/model';
import FileSelection from 'src/components/FileSelection.vue';
import FormComponent from 'src/components/FormComponent.vue';

const useAuth = useAuthStore();

const imageTab = ref(0);

const capturedPhoto = ref<CapturedImageModel[]>([]);
const selectedFile = ref<UploadableModel | null>(null);

const formRefs = ref<{ [key: string]: QForm | null }>({});

const availableSPKQuantity = (spk: WOItemModel | undefined | null) => {
  if (spk) return Number(spk.quantity) - (Number(spk.amount_packing) + Number(spk.amount_faulty));
  else return 0;
}

onMounted(() => {
  api.defaults.headers.common['Authorization'] = `Bearer ${useAuth.user?.token}`;
})

const setFormRef = (ref: QForm | null, index: number) => {
  if (ref) {
    formRefs.value[index] = ref;
  }
}

const handleCapturedPhoto = async (photos: string[] | string) => {
  if (typeof photos === 'string') {
    capturedPhoto.value = [
      {
        base64: String(photos),
        scan_result: null,
        form: {
          line: '',
          date: '',
          items: []
        },
        on_process: true,
        is_error: false,
        is_submitted: false,
        image_zoom_mode: 'mouseover',
      }
    ];

    await handleGenereteScanResult(photos, 0);
  } else {
    capturedPhoto.value = photos.map(
      (photo) => ({
        base64: String(photo),
        scan_result: null,
        form: {
          line: '',
          date: '',
          items: []
        },
        on_process: true,
        is_error: false,
        is_submitted: false,
        image_zoom_mode: 'mouseover',
      })
    );

    await Promise.allSettled(
      photos.map(async (photo, index) => {
        await handleGenereteScanResult(photo, index);
      })
    );
  }
};

const handleRegenerateScanResult = async (photo: string, index: number) => {
  const data = capturedPhoto.value[index];

  if (data) {
    data.form = { line: '', date: '', items: [] };
    data.scan_result = null;
    data.on_process = true;
    data.is_error = false;
  }

  await handleGenereteScanResult(photo, index);
}

const handleGenereteScanResult = async (photo: string, index: number) => {
  try {
    const response = await fetch(
      String(photo)
    );

    const blob = await response.blob();

    const formData = new FormData();

    formData.append(
      'file',
      blob,
      'photo.png'
    );

    const res = await n8nApi.post(
      '/webhook/upload',
      formData
    );

    let scanResult = {
      operator_name: '',
      date: '',
      shift: '',
      line: '',
      items: []
    };

    if (res?.data?.[0] && !res?.data?.[0]?.error && !(!res.data[0].data)) {
      if (typeof res.data[0].data === 'string') {
        const parsed = JSON.parse(
          res.data[0].data
        );

        scanResult = parsed[0];
      } else {
        scanResult = res.data[0].data[0];
      }
    } else if (res?.data?.[0]?.error) {
      Notify.create({
        message: `UNABLE TO PROCESS IMAGE ON FORM ${index + 1}`,
        caption: res?.data?.[0]?.error,
        type: 'negative',
        position: 'top-right',
        timeout: 5000
      })
    } else {
      Notify.create({
        message: 'Unable to process image',
        caption: 'please try again or contact administrator',
        type: 'negative',
        position: 'top-right',
        timeout: 5000
      });
    }

    const target = capturedPhoto.value[index];

    if (!target) return;

    target.scan_result = scanResult;

    handleFillStateWithScannedData(index);
  } catch (err) {
    console.error(err);

    Notify.create({
      message: 'Unable to process image',
      caption: 'please try again or contact administrator',
      type: 'negative',
      position: 'top-right',
      timeout: 5000
    });

    const target = capturedPhoto.value[index];

    if (target) {
      target.is_error = true;
      target.scan_result = {
        operator_name: '',
        date: '',
        shift: '',
        line: '',
        items: []
      }
    }
  } finally {
    const target = capturedPhoto.value[index];

    if (target) {
      target.on_process = false;
    }
  }
}

const handleFillStateWithScannedData = (index: number) => {
  const data = capturedPhoto.value[index];
  if (!data) return;

  const form = data.form;

  const scannedData = data.scan_result;

  form.date = String(scannedData?.date);
  form.scanned_date = String(scannedData?.date);

  form.scanned_shift = String(scannedData?.shift);
  form.scanned_operator_name = String(scannedData?.operator_name);

  form.worktime = 'REGULER';

  form.items = [];

  scannedData?.items.forEach((scannedItem) => {
    const newItem = {
      scanned_customer: scannedItem.customer,
      customer: null,
      customer_id: null,

      scanned_part_name: scannedItem.part_name,
      part: null,
      item_id: null,

      unit: null,
      unit_id: null,

      work_order_item: null,
      work_order_item_id: null,

      lot_number: '', // may not be used

      worktime: '', // may not be used
      begin_datetime: '', // may not be used
      until_datetime: '', // may not be used

      type_fault: null,
      type_fault_id: null,

      scanned_ok: scannedItem.ok,
      ok: 0,

      scanned_ng: scannedItem.ng,
      ng: scannedItem.ng_list.reduce((a, b) => Number(a) + Number(b.quantity), 0),

      ng_list: scannedItem.ng_list.map((ng) => {
        return {
          code: ng.code,
          scanned_code: ng.code,

          quantity: ng.quantity,
          scanned_quantity: ng.quantity,
        }
      }),

      is_markup_ng_collapsed: true,
      is_collapsed: false,
      is_submitted: false,
    }

    form.items.push(newItem);
  })
}

const updateNGQty = (itemIndex: number, formIndex: number) => {
  const data = capturedPhoto.value[formIndex];

  if (!data) return;

  const form = data.form;

  if (form.items[itemIndex]) {
    form.items[itemIndex].ng = form.items[itemIndex].ng_list.reduce((a, b) => Number(a) + Number(b.quantity), 0);

    // formRefs.value[formIndex]?.validate().catch(() => {});
  }
}

const handleAssignFaultyWOItem = (itemIndex: number, formIndex: number) => {
  const data = capturedPhoto.value[formIndex];

  if (!data) return;

  const form = data.form;
  const item = form.items[itemIndex];

  if (!item) return;

  const scannedData = data.scan_result;
  const scannedItem = scannedData?.items?.[itemIndex];

  if (scannedItem && form.items[itemIndex]) {
    if (scannedItem.ng_list.length && !form.items[itemIndex].ng_list.length) {
      form.items[itemIndex].ng_list = scannedItem.ng_list.map((ng) => {
        return {
          code: ng.code,
          scanned_code: ng.code,
          quantity: ng.quantity,
          work_order_item_id: null,
          work_order_item: null,
        }
      })
    }
  }

  const availableWO = item.ok_list
    ?.filter(ok => {
      // const woQty = Number(ok.work_order_item?.quantity || 0);
      const woQty = availableSPKQuantity(ok.work_order_item);
      return ok.quantity < woQty;
    })
    .map(ok => ({
      ...ok,
      // remaining: Number(ok.work_order_item?.quantity || 0) - Number(ok.quantity),
      remaining: availableSPKQuantity(ok.work_order_item) - Number(ok.quantity),
    }));

  const newNgList: typeof item.ng_list = [];

  let woIndex = 0;

  if (availableWO?.length) {
    for (const ng of item.ng_list) {
      let remainingNGQty = Number(ng.quantity);

      while (remainingNGQty > 0 && woIndex < availableWO.length) {
        const currentWO = availableWO[woIndex];

        if (!currentWO) break;

        if (Number(currentWO?.remaining) <= 0) {
          woIndex++;
          continue;
        }

        const assignedQty = Math.min(
          remainingNGQty,
          Number(currentWO?.remaining)
        );

        newNgList.push({
          ...ng,
          quantity: assignedQty,
          work_order_item: currentWO?.work_order_item as WOItemModel,
          work_order_item_id: currentWO?.work_order_item_id as string,
        });

        remainingNGQty -= assignedQty;
        currentWO.remaining -= assignedQty;

        if (Number(currentWO?.remaining) <= 0) {
          woIndex++;
        }
      }

      if (remainingNGQty > 0) {
        newNgList.push({
          ...ng,
          quantity: remainingNGQty,
        });
      }
    }
  }

  item.ng_list = newNgList;

  updateNGQty(itemIndex, formIndex);
};

const isWOFulfilled = (formIndex: number, itemIndex: number) => {
  const data = capturedPhoto.value[formIndex];

  if (!data) return false;

  const form = data.form;
  const item = form.items[itemIndex];

  if (item) {
    const totalQty = Number(item.ok) + Number(item.ng);

    // const woQty = item.ok_list?.reduce((a, b) => Number(a) + Number(b.work_order_item?.quantity), 0);
    const woQty = item.ok_list?.reduce((a, b) => Number(a) + availableSPKQuantity(b.work_order_item), 0);

    if (Number(woQty) >= totalQty) {
      return true;
    }
  }

  return false;
}

const handleSubmitForm = async (formIndex: number) => {
  if (!capturedPhoto.value[formIndex]) {
    console.error('form not found');

    return;
  }

  capturedPhoto.value[formIndex].form.items.forEach((item) => {
    item.is_collapsed = false;
  })

  const success = await formRefs.value[formIndex]?.validate();

  if (!success) {
    await nextTick();

    const errorFields = [
      ...document.querySelectorAll('.q-field--error')
    ] as HTMLElement[];

    const validErrorFields = errorFields.filter((field) => {
      if (field.offsetParent === null) return false;

      if (
        field.classList.contains('disabled') ||
        field.classList.contains('q-field--disabled')
      ) {
        return false;
      }

      const input = field.querySelector(
        'input:not([disabled]), textarea:not([disabled])'
      );

      return !!input;
    });

    if (!validErrorFields.length) return;

    const topMostField = validErrorFields.sort((a, b) => {
      return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
    })[0];

    if (!topMostField) return;

    topMostField.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    const input = topMostField.querySelector(
      'input, textarea'
    );

    if (input instanceof HTMLElement) {
      setTimeout(() => {
        input.focus();
      }, 300);
    }

    return;
  }

  const data = capturedPhoto.value[formIndex];
  const form = data.form;

  form.items.filter(i => !i.is_submitted).forEach((item, index) => {
    item.is_collapsed = true;
    item.loading = true;
    item.error = null;

    const woFulfillment = isWOFulfilled(formIndex, index);

    if (!woFulfillment) {
      item.error = `Not Enough Total SPK Quantity (Total SPK: ${item.ok_list?.reduce((a, b) => Number(a) + Number(b.quantity), 0)}, Total QTY: ${Number(item.ok) + Number(item.ng)})`;
    }
  });

  if (form.items.some(item => item.error)) {
    Notify.create({
      message: 'There are errors in the form',
      caption: 'Please resolve all error first',
      type: 'negative',
      position: 'top-right',
      timeout: 5000
    });

    form.items.filter(i => !i.is_submitted).forEach((item) => {
      item.loading = false;
    });

    return;
  }

  data.on_process = true;

  let savedImage: string | null = null;

  await handleSaveImage(data.base64)
    .then((res) => {
      console.warn(res);
      savedImage = 'Berdasarkan gambar ' + res + '. ';
    })
    .catch(() => {
      Notify.create({
        message: 'Unable to save image',
        caption: 'Please contant administrator',
        type: 'negative',
        timeout: 5000
      });

      data.on_process = false;

      form.items.filter(i => !i.is_submitted).forEach((item) => {
        item.loading = false;
      });

      return;
    });

  for (const [itemIndex, item] of form.items.filter(i => !i.is_submitted).entries()) {
    handleAssignFaultyWOItem(itemIndex, formIndex);

    const dataToSubmit: InspectionFormModel = {
      customer_id: String(item.customer_id),
      date: String(form.date),
      shift_id: String(form.shift_id),
      worktime: form.worktime || 'REGULER',
      description: item.description ? String(savedImage) + '\n' + String(item.description) : String(savedImage),
      operator_id: String(form.operator_id),
      operator: form.operator as OperatorModel,
      packing_items: {
        item_id: String(item.item_id),
        unit_id: String(item.unit_id),
        unit_rate: Number(item.unit?.rate),
        item: item.part as PartModel,
        unit: item.unit as UnitModel,
        quantity: Number(item.ok),
        type_fault_id: form.type_fault_id || null,
        // include spk with zero OK qty from ok list
        // packing_item_orders: item.ok_list as PackingItemOrderModel[],

        // exclude spk with zero OK qty from ok list
        packing_item_orders: item.ok_list?.filter(i => i.quantity > 0) as PackingItemOrderModel[],
        packing_item_faults: item.ng_list as PackingItemFaultModel[],
      }
    }

    await api.post('/api/v1/factories/packings', dataToSubmit)
      .then(res => {
        if (res.data) {
          const data = res.data.data || res.data;

          item.id = data.id;
          item.number = data.number;
          item.is_submitted = true;
        }
      })
      .catch(err => {
        item.error = err.response?.data?.message || 'Failed to submit data, try again.';
      })
      .finally(() => {
        item.loading = false;
      });
  };

  if (form.items.some(i => i.error)) {
    data.is_error = true;
  } else {
    data.is_error = false;
    data.is_submitted = true;
  }

  data.on_process = false;
};

const handleSaveImage = async (image: string) => {
  try {
    const response = await fetch(
      String(image)
    );

    const blob = await response.blob();

    const formData = new FormData();

    formData.append(
      'file',
      blob,
      'photo.png'
    );

    const res = await n8nApi.post('/webhook/save-image', formData);

    if (res.data) {
      console.log('[N8N] Successfully save image ', res);

      return res.data[0].file;
    }
  } catch (err) {
    console.error('[N8N] Failed to save image ', err);

    return null;
  }
}

const handleCancelForm = (formIndex: number) => {
  capturedPhoto.value.splice(formIndex, 1);

  if (formIndex === capturedPhoto.value.length && capturedPhoto.value.length > 0) {
    imageTab.value = formIndex - 1;
  }

  if (!capturedPhoto.value.length) {
    selectedFile.value = null;
  }
}

const handleViewImage = (data: CapturedImageModel) => {
  const popup = window.open(
    '',
    '_blank',
    `
      width=900,
      height=700,
      menubar=no,
      toolbar=no,
      location=no,
      status=no,
      resizable=yes,
      scrollbars=yes
    `
  )

  popup?.document.write(`
    <html>
      <head>
        <title>Image Preview</title>
        <style>
          body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #111;
            min-height: 100vh;
          }

          img {
            max-width: 100%;
            max-height: 100vh;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <img src="${data.base64}" />
      </body>
    </html>
  `)
}
</script>

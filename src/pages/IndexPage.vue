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

                <!-- <q-form v-show="photo.scan_result"
                  :ref="(e) => setFormRef((e as QForm), photoIndex)"
                  class="column gap-1"
                >
                  <div class="row items-start no-wrap gap-1">
                    <div class="column flex-grow">
                      <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
                        Shift
                      </q-item-label>
                      <select-resource
                        dense
                        outlined
                        use-refresh
                        :xbottom-slots="!(!photo.form.scanned_shift)"
                        bottom-slots
                        search=""
                        api-url="/api/v1/references/shifts"
                        :api-params="{
                          'mode': 'all',
                          'limit': '*',
                        }"
                        option-label="name"
                        class="wrap-select-input"
                        :load-until="!(!photo.scan_result) && !photo.on_process"
                        :disable="!(!photo.on_process) || photo.form.items.some(i => i.is_submitted)"
                        :model-value="photo.form.shift"
                        @update:model-value="(e: ShiftModel) => handleSelectShift(e, photoIndex)"
                        @update:options="(e: ShiftModel[]) => autoAssignShift(e, photoIndex)"
                      >
                        <template v-slot:hint>
                          <q-item-label v-if="photo.form?.scanned_shift" caption class="font-medium q-pl-xs pt-[1px]">
                            Scanned as {{ photo.form?.scanned_shift }}
                          </q-item-label>
                        </template>
                      </select-resource>
                    </div>

                    <div class="column flex-grow">
                      <div class="row items-end justify-between">
                        <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
                          Operator
                        </q-item-label>
                      </div>
                      <select-resource
                        ref="operatorSelect"
                        dense
                        outlined
                        use-refresh
                        :xbottom-slots="!(!photo.form.scanned_operator_name)"
                        bottom-slots
                        search=""
                        api-url="/api/v1/common/employees"
                        :api-params="{
                          'mode': 'all',
                          'limit': '*',
                          'sort': 'name',
                          'search': '',
                          'search-keys': 'name,code'
                        }"
                        option-label="name"
                        class="wrap-select-input"
                        :load-until="!(!photo.scan_result) && !photo.on_process"
                        :disable="!(!photo.on_process) || photo.form.items.some(i => i.is_submitted)"
                        :model-value="photo.form.operator"
                        @update:model-value="(e: OperatorModel) => handleSelectOperator(e, photoIndex)"
                        @update:options="(e: OperatorModel[]) => autoAssignOperator(e, photoIndex)"
                      >
                        <template v-slot:hint>
                          <q-item-label v-if="photo.form?.scanned_operator_name" caption class="font-medium q-pl-xs pt-[1px]">
                            Scanned as {{ photo.form?.scanned_operator_name }}
                          </q-item-label>
                        </template>
                      </select-resource>
                    </div>
                  </div>

                  <div
                    :class="$q.screen.lt.sm ? '' : 'row items-start no-wrap gap-1'"
                    class="q-mb-xs"
                  >
                    <div class="column flex-1">
                      <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
                        Date
                      </q-item-label>
                      <q-input
                        dense
                        outlined
                        :xbottom-slots="!(!photo.form.scanned_date)"
                        type="date"
                        :disable="!(!photo.on_process) || photo.form.items.some(i => i.is_submitted)"
                        v-model="photo.form.date"
                      />
                    </div>

                    <div class="column flex-1">
                      <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
                        Worktime
                      </q-item-label>

                      <q-select
                        dense
                        outlined
                        :options="[
                          { label: 'REGULER', value: 'REGULER' },
                          { label: 'OVERTIME', value: 'OVERTIME' }
                        ]"
                        :disable="!(!photo.on_process) || photo.form.items.some(i => i.is_submitted)"
                        v-model="photo.form.worktime"
                        emit-value
                      />
                    </div>

                    <div class="column flex-grow">
                      <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
                        Fault Type
                      </q-item-label>

                      <select-resource
                        dense
                        outlined
                        hide-bottom-space
                        :bg-color="photo.form.type_fault ? '' : 'yellow-1'"
                        search=""
                        api-url="api/v1/references/type-faults"
                        :api-params="{
                          'mode': 'all',
                          'limit': '*'
                        }"
                        option-label="name"
                        :load-until="!(!photo.scan_result) && !photo.on_process"
                        :disable="!(!photo.on_process) || photo.form.items.some(i => i.is_submitted)"
                        :model-value="photo.form.type_fault"
                        :rules="[(val: FaultTypeModel) => !!val || 'Fault Type is required']"
                        @update:model-value="(e: FaultTypeModel) => handleSelectFaultType(e, photoIndex)"
                        @update:options="(options: FaultTypeModel[]) => autoAssignFaultType(options, photoIndex)"
                      />
                    </div>
                  </div>

                  <div class="column">
                    <div class="row items-end justify-between">
                      <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
                        Items {{ photo.form.items.length ? `- ${photo.form.items.length} Item${photo.form.items.length > 1 ? 's' : ''} scanned` : '' }}
                      </q-item-label>
                      <q-btn v-if="!photo.form.items.some(i => i.is_submitted) && !photo.on_process"
                        dense
                        unelevated
                        size="12px"
                        icon="add"
                        label="Item"
                        color="primary"
                        class="q-pr-sm q-py-none mb-[2px]"
                        :disable="!(!photo.on_process)"
                        @click="handleAddItem(photoIndex)"
                      />
                    </div>
                    <q-card flat bordered>
                      <q-card-section v-if="!photo.form.items.length" class="flex items-center justify-center q-pa-xs">
                        <span class="text-lg font-medium text-italic text-uppercase text-gray-500">No Item Added</span>
                      </q-card-section>

                      <q-card-section v-else class="q-pa-none">
                        <q-scroll-area
                          :style="`height: calc(100dvh - ${$q.screen.lt.sm ? '465px' : '350px'});`"
                          class="no-scrollbar"
                        >
                          <q-list class="q-pa-xs gap-2" :class="$q.screen.gt.md ? 'grid grid-cols-2 items-start' : 'column'">
                            <div
                              v-for="(side, sideIndex) of 2"
                              :key="sideIndex"
                              class="column gap-2"
                            >
                              <q-item
                                dense
                                v-for="(sItem, sIndex) in getSplittedItems(photo.form.items)[sideIndex]"
                                :key="`${sideIndex === 0 ? 'l' : 'r'}_${sIndex}`"
                                class="q-px-none q-py-xs border rounded bg-gray-100 border-md border-gray-400"
                              >
                                <q-item-section>
                                  <div class="sticky-item-header bg-gray-100">
                                    <div
                                      @click="sItem.item.is_collapsed = !sItem.item.is_collapsed"
                                      class="row items-center justify-between q-px-sm cursor-pointer"
                                    >
                                      <div class="row items-center gap-1">
                                        <q-icon :name="sItem.item.is_collapsed ? 'keyboard_arrow_down' : 'keyboard_arrow_up'" />
                                        <q-badge
                                          dense
                                          square
                                          color="primary"
                                          text-color="white"
                                          class="font-medium q-py-xs"
                                          :label="sItem.originalIndex + 1"
                                        />

                                        <q-item-label v-if="sItem.item.number" class="font-medium text-italic text-uppercase">
                                          {{ sItem.item.number }}
                                        </q-item-label>

                                        <q-item-label v-else class="font-medium text-italic text-uppercase">
                                          Item {{ sItem.originalIndex + 1 }}
                                        </q-item-label>
                                      </div>

                                      <q-btn-dropdown v-if="!sItem.item.loading && !sItem.item.is_submitted && !sItem.item.error"
                                        dense
                                        flat
                                        size="12px"
                                        icon="delete"
                                        color="negative"
                                        class="q-py-none disable-arrow"
                                        @click.stop
                                      >
                                        <q-card>
                                          <q-card-section class="q-pa-sm column items-center">
                                            <q-item-label class="font-medium text-italic text-uppercase">
                                              Are you sure?
                                            </q-item-label>
                                            <q-item-label caption class="font-medium text-italic text-uppercase">
                                              This action cannot be undone
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
                                              icon="delete"
                                              label="Yes"
                                              color="negative"
                                              class="q-py-none flex-grow"
                                              @click="handleRemoveItem(sItem.originalIndex, photoIndex)"
                                            />
                                          </q-card-actions>
                                        </q-card>
                                      </q-btn-dropdown>

                                      <q-spinner v-else-if="sItem.item.loading" color="primary" />

                                      <div v-else-if="sItem.item.is_submitted">
                                        <q-chip
                                          size="sm"
                                          icon="task_alt"
                                          label="Submitted"
                                          color="positive"
                                          text-color="black"
                                          class="q-my-none text-bold text-uppercase"
                                        />

                                        <q-btn v-if="sItem.item.id"
                                          dense
                                          rounded
                                          unelevated
                                          size="sm"
                                          label="Open Report"
                                          icon="open_in_new"
                                          color="primary"
                                          class="q-px-sm"
                                          @click.stop="handleOpenReport(sItem.item.id)"
                                        />
                                      </div>

                                      <q-chip v-else-if="sItem.item.error"
                                        size="sm"
                                        icon="warning"
                                        label="Error"
                                        color="negative"
                                        text-color="white"
                                        class="q-my-none text-bold text-uppercase"
                                      />
                                    </div>

                                    <q-separator v-if="sItem.item.error"
                                      spaced="xs"
                                    />

                                    <q-item-label v-if="sItem.item.error"
                                      class="font-medium text-italic text-center q-px-sm text-gray-600"
                                    >
                                      {{ sItem.item.error }}
                                    </q-item-label>

                                    <q-separator v-show="!sItem.item.is_collapsed" spaced="sm" />
                                  </div>

                                  <div v-show="!sItem.item.is_collapsed" class="column q-mb-xs">
                                    <q-item-label class="font-medium text-italic text-uppercase q-px-sm">
                                      Customer
                                    </q-item-label>

                                    <select-resource
                                      dense
                                      outlined
                                      use-refresh
                                      hide-bottom-space
                                      :bottom-slots="!(!sItem.item.scanned_customer)"
                                      search=""
                                      api-url="/api/v1/incomes/customers"
                                      :api-params="{
                                        'limit': '*',
                                      }"
                                      class="q-px-sm"
                                      :disable="!(!sItem.item.loading) || !(!sItem.item.is_submitted)"
                                      :option-label="(option: CustomerModel) => `(${option.code}) ${option.name}`"
                                      :model-value="sItem.item.customer"
                                      :rules="[(val: CustomerModel) => !!val || 'Customer is required']"
                                      @update:model-value="(e: CustomerModel) => handleSelectCustomer(sItem.originalIndex, e, photoIndex)"
                                      @update:options="(option: CustomerModel[]) => !(!sItem.item.scanned_customer) && !sItem.item.customer_id ? autoAssignCustomer(option, sItem.originalIndex, photoIndex) : undefined"
                                    >
                                      <template v-slot:hint>
                                        <q-item-label v-if="sItem.item.scanned_customer" caption class="font-medium q-pl-xs pt-[1px]">
                                          Scanned as {{ sItem.item.scanned_customer }}
                                        </q-item-label>
                                      </template>
                                    </select-resource>
                                  </div>

                                  <div v-show="!sItem.item.is_collapsed" class="row items-start no-wrap gap-1 q-px-sm q-mb-xs">
                                    <div class="column flex-grow">
                                      <q-item-label class="font-medium text-italic text-uppercase">
                                        Part Name
                                      </q-item-label>

                                      <select-resource
                                        dense
                                        outlined
                                        use-refresh
                                        hide-bottom-space
                                        :bottom-slots="!(!sItem.item.scanned_part_name)"
                                        search=""
                                        api-url="/api/v1/common/items"
                                        :api-params="{
                                          'mode': 'all',
                                          'limit': '*',
                                          'has_stocks': 'WIP',
                                          'customer_id': sItem.item.customer_id,
                                          '--with': 'item_units',
                                          'search': '',
                                          'search-keys': ''
                                        }"
                                        option-label="part_name"
                                        :load-until="!(!sItem.item.customer_id)"
                                        :force-reload="triggerReloadItem[sItem.originalIndex] || null"
                                        :option-caption="(option: PartModel) => `Code: ${option.code}`"
                                        :model-value="sItem.item.part"
                                        :disable="!sItem.item.customer_id || !(!sItem.item.loading) || !(!sItem.item.is_submitted) ? true : null"
                                        :rules="[(val: PartModel) => !!val || 'Part is required']"
                                        @update:model-value="(e: PartModel) => handleSelectItem(sItem.originalIndex, e, photoIndex)"
                                        @update:options="(e: PartModel[]) => autoAssignItem(e, sItem.originalIndex, photoIndex)"
                                      >
                                        <template v-slot:hint>
                                          <q-item-label v-if="sItem.item.scanned_part_name" caption class="font-medium q-pl-xs pt-[1px]">
                                            Scanned as {{ sItem.item.scanned_part_name }}
                                          </q-item-label>
                                        </template>

                                        <q-tooltip v-if="!sItem.item.customer_id">
                                          Please select customer first
                                        </q-tooltip>
                                      </select-resource>
                                    </div>

                                    <div class="column flex-1">
                                      <q-item-label class="font-medium text-italic text-uppercase">
                                        Unit
                                      </q-item-label>

                                      <select-resource
                                        dense
                                        outlined
                                        hide-bottom-space
                                        search=""
                                        api-url=""
                                        :api-params="{}"
                                        :options="(sItem.item.part?.item_units as UnitModel[])"
                                        :option-label="(option: PartModel['item_units'][number]) => `${option.unit.name}`"
                                        :option-caption="(option: PartModel['item_units'][number]) => `Code: ${option.unit.code}`"
                                        :model-value="sItem.item.unit"
                                        :disable="!sItem.item.item_id || !(!sItem.item.loading) || !(!sItem.item.is_submitted)"
                                        :rules="[(val: PartModel['item_units'][number]) => !!val || 'Unit is required']"
                                        @update:model-value="(e: PartModel['item_units'][number]) => handleSelectUnit(sItem.originalIndex, e, photoIndex)"
                                      />
                                    </div>
                                  </div>

                                  <div v-show="!sItem.item.is_collapsed" class="column no-wrap q-px-sm q-mb-xs">
                                    <div class="row items-end justify-between">
                                      <q-item-label class="font-medium text-italic text-uppercase">
                                        Work Orders (SPK)
                                      </q-item-label>
                                      <q-btn v-if="!sItem.item.is_submitted"
                                        dense
                                        unelevated
                                        size="12px"
                                        icon="add"
                                        label="SPK"
                                        color="green-7"
                                        class="q-pr-sm q-py-none mb-[2px]"
                                        :disable="!sItem.item.item_id || !(!sItem.item.loading)"
                                        @click="handleAddOK(sItem.originalIndex, photoIndex)"
                                      >
                                        <q-tooltip v-if="!sItem.item.item_id" class="">
                                          Please select item/part first
                                        </q-tooltip>
                                      </q-btn>
                                    </div>

                                    <q-card flat bordered>
                                      <q-card-section v-if="!sItem.item.ok_list?.length" class="flex items-center justify-center q-pa-xs">
                                        <span class="text-lg font-medium text-italic text-uppercase text-gray-500">No SPK Added</span>
                                      </q-card-section>

                                      <q-card-section v-else class="q-pa-none">
                                        <q-list class="column gap-2 q-pa-xs">
                                          <div
                                            v-for="(ok, okIndex) in sItem.item.ok_list"
                                            :key="okIndex"
                                            class="border rounded"
                                            :class="((availableSPKQuantity(ok.work_order_item) - Number(ok.quantity)) - sItem.item.ng_list.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id)).reduce((acc, ng) => Number(acc) + Number(ng.quantity), 0) < 0)
                                              ? 'border-red-900 border-[2px]'
                                              : 'border-black'
                                            "
                                          >
                                            <q-item
                                              dense
                                              class="q-px-none q-py-xs border rounded q-ma-none bg-blue-50"
                                            >
                                              <q-item-section
                                                top
                                                side
                                                style="padding-left: 5px !important; padding-right: unset !important;"
                                              >
                                                <q-badge
                                                  dense
                                                  square
                                                  color="green-7"
                                                  text-color="white"
                                                  class="font-medium q-py-xs"
                                                  :label="okIndex + 1"
                                                />
                                              </q-item-section>

                                              <q-item-section class="column gap-1 q-px-xs">
                                                <select-resource
                                                  dense
                                                  outlined
                                                  use-refresh
                                                  hide-bottom-space
                                                  stack-label
                                                  :bg-color="ok.work_order_item_id ? '' : 'yellow-1'"
                                                  search=""
                                                  api-url="/api/v1/factories/work-orders/items"
                                                  :api-params="{
                                                    'mode': 'all',
                                                    'limit': '*',
                                                    'has_amount_packing': 'true',
                                                    'item_id': sItem.item.item_id,
                                                    'or_detail_ids': null,
                                                    'search': '',
                                                    'search-keys': ''
                                                  }"
                                                  class="col-span-2"
                                                  label="Work Order (SPK)"
                                                  :load-until="!(!sItem.item.item_id)"
                                                  :force-reload="triggerReloadWO[sItem.originalIndex] || null"
                                                  :option-label="(option: WOItemModel) => `(#${option.id}) ${option.work_order_number}`"
                                                  :option-caption="(option: WOItemModel) => `Date: ${option.work_order_date} [${option.work_order_shift.toUpperCase()}]`"
                                                  :option-disable="(option: WOItemModel) =>
                                                    sItem.item.ok_list?.some((itemOK, itemOKIndex) =>
                                                      itemOKIndex !== okIndex &&
                                                      String(itemOK.work_order_item_id) === String(option.id)
                                                    )
                                                  "
                                                  :model-value="ok.work_order_item"
                                                  :disable="!sItem.item.item_id || !(!sItem.item.loading) || !(!sItem.item.is_submitted)"
                                                  :rules="[(val: WOItemModel) => !!val || 'Work Order (SPK) is required']"
                                                  @update:model-value="(e: WOItemModel) => handleSelectWOItem(sItem.originalIndex, e, photoIndex, okIndex)"
                                                  @update:options="(options: WOItemModel[]) => !sItem.item.ok_list?.[okIndex]?.work_order_item_id ? autoAssignWOItem(options, sItem.originalIndex, photoIndex) : undefined"
                                                >
                                                  <template v-slot:option="scope">
                                                    <q-item
                                                      v-bind="scope.itemProps"
                                                      dense
                                                      clickable
                                                      class="q-pa-sm border-b"
                                                      @click="handleSelectWOItem(sItem.originalIndex, scope.opt, photoIndex, okIndex)"
                                                      v-close-popup
                                                    >
                                                      <q-item-section class="column">
                                                        <q-item-label class="font-medium text-uppercase">
                                                          {{ scope.opt.work_order_number }} (#{{ scope.opt.id }})
                                                        </q-item-label>

                                                        <q-item-label caption class="font-medium text-uppercase">
                                                          {{ scope.opt.work_order_date }} [{{ scope.opt.work_order_shift.toUpperCase() }}]
                                                        </q-item-label>
                                                      </q-item-section>

                                                      <q-item-section side>
                                                        <q-chip
                                                          dense
                                                          square
                                                          color="primary"
                                                          text-color="white"
                                                          size="12px"
                                                          :label="`QTY: ${availableSPKQuantity(scope.opt)}`"
                                                        />
                                                      </q-item-section>
                                                    </q-item>
                                                  </template>

                                                  <template v-slot:no-option>
                                                    <q-item>
                                                      <q-item-section>
                                                        <q-item-label class="text-bold text-gray-500 text-center">
                                                          No available options
                                                        </q-item-label>
                                                      </q-item-section>
                                                    </q-item>
                                                  </template>
                                                </select-resource>

                                                <q-input
                                                  dense
                                                  outlined
                                                  stack-label
                                                  hide-bottom-space
                                                  prefix="OK :"
                                                  :model-value="ok.quantity"
                                                  :suffix="`/ ${availableSPKQuantity(ok.work_order_item)}`"
                                                  :rules="[
                                                    (val: string) => {
                                                      const qty = Number(val);

                                                      if (qty < 0) {
                                                        return 'Must be >= 0';
                                                      }

                                                      if (!sItem.item.ng_list.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id)).length && qty <= 0) {
                                                        return 'Must be > 0, if no NG added';
                                                      }

                                                      return true;
                                                    },
                                                    (val: string) => Number(val) <= Math.max(0, availableSPKQuantity(ok.work_order_item) - Number(sItem.item.ng_list?.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id)).reduce((acc, ng) => Number(acc) + Number(ng.quantity), 0))) || `Must be less than ${Math.max(0, availableSPKQuantity(ok.work_order_item) - Number(sItem.item.ng_list?.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id) && ok.work_order_item_id).reduce((acc, ng) => Number(acc) + Number(ng.quantity), 0)))}`
                                                  ]"
                                                  input-class="font-medium text-lg text-right"
                                                  :disable="!(!sItem.item.loading) || !(!sItem.item.is_submitted)"
                                                  @update:model-value="ok.quantity = Number(String($event).replaceAll(',', '')); updateOKQty(sItem.originalIndex, photoIndex)"
                                                  class="flex-grow bolder-prefix"
                                                  type="text"
                                                  @keypress="onlyNumber"
                                                  mask="###,###,###,###,###,###,###,###,###,###"
                                                  reverse-fill-mask
                                                />

                                                <div class="column gap-1">
                                                  <q-input
                                                    dense
                                                    readonly
                                                    outlined
                                                    stack-label
                                                    hide-bottom-space
                                                    prefix="NG :"
                                                    :model-value="sItem.item.ng_list.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id)).reduce((acc, ng) => Number(acc) + Number(ng.quantity), 0)"
                                                    :suffix="`/ ${availableSPKQuantity(ok.work_order_item)}`"
                                                    :rules="[
                                                      (val: string) => Number(val) >= 0 || 'Must be >= 0',
                                                      (val: string) => Number(val) <= Math.max(0, availableSPKQuantity(ok.work_order_item) - Number(ok.quantity)) || `Must be less than ${Math.max(0, availableSPKQuantity(ok.work_order_item) - Number(ok.quantity))}`
                                                    ]"
                                                    input-class="font-medium text-lg text-right"
                                                    tabindex="-1"
                                                    class="flex-grow normal-readonly no-pointer bolder-prefix"
                                                    type="text"
                                                    mask="###,###,###,###,###,###,###,###,###,###"
                                                    reverse-fill-mask
                                                    @click.prevent
                                                  >
                                                    <template v-slot:after>
                                                      <q-btn
                                                        dense
                                                        unelevated
                                                        :icon="ok.is_ng_collapsed ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
                                                        color="primary"
                                                        class=""
                                                        @click.stop="ok.is_ng_collapsed = !ok.is_ng_collapsed"
                                                      />
                                                    </template>
                                                  </q-input>

                                                  <q-card v-show="!ok.is_ng_collapsed"
                                                    flat
                                                    bordered
                                                  >
                                                    <q-card-section
                                                      class="q-pa-none"
                                                    >
                                                      <q-list>
                                                        <q-item
                                                          dense
                                                          v-for="(ng, ngIndex) in sItem.item.ng_list.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id))"
                                                          :key="ngIndex"
                                                          class="q-px-none q-py-xs border rounded q-ma-xs bg-red-50"
                                                        >
                                                          <q-item-section
                                                            side
                                                            style="padding-left: 5px !important; padding-right: unset !important;"
                                                            top
                                                          >
                                                            <q-badge
                                                              dense
                                                              square
                                                              color="secondary"
                                                              text-color="white"
                                                              class="font-medium q-py-xs"
                                                              :label="ngIndex + 1"
                                                            />
                                                          </q-item-section>
                                                          <q-item-section class="q-px-xs gap-2">
                                                            <div class="grid grid-cols-3 gap-1">
                                                              <div class="column col-span-2">
                                                                <select-resource
                                                                  :ref="(e) => setFaultRef((e as QSelect), photoIndex)"
                                                                  dense
                                                                  outlined
                                                                  hide-bottom-space
                                                                  no-error-icon
                                                                  label="Fault"
                                                                  stack-label
                                                                  :bg-color="ng.fault_id ? '' : 'yellow-1'"
                                                                  :bottom-slots="!(!ng.scanned_code)"
                                                                  search=""
                                                                  api-url="api/v1/references/faults"
                                                                  :api-params="{
                                                                    'mode': 'all',
                                                                    'limit': '*',
                                                                    'type_fault_id': photo.form.type_fault_id
                                                                  }"
                                                                  :option-label="(opt: FaultModel) => `(#${Number((faultSelectRef[`${photoIndex}`] as { selectResource?: QSelect }).selectResource?.options?.flatMap(opt => String(opt.id)).findIndex(id => id === String(opt.id))) + 1}) ${opt.name}`"
                                                                  :option-disable="(opt: FaultModel) =>
                                                                    sItem.item.ng_list
                                                                    .filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id))
                                                                    .some((itemNG, itemNGIndex) =>
                                                                      itemNGIndex !== ngIndex &&
                                                                      String(itemNG.fault_id) === String(opt.id)
                                                                    )
                                                                  "
                                                                  :load-until="!(!photo.form.type_fault_id)"
                                                                  :force-reload="triggerReloadFaults[photoIndex] || null"
                                                                  :disable="!photo.form.type_fault_id || !(!sItem.item.loading) || !(!sItem.item.is_submitted)"
                                                                  :model-value="ng.fault"
                                                                  :rules="[(val: FaultModel) => !!val || 'Fault is required']"
                                                                  @update:model-value="(e: FaultModel) => handleSelectFault(sItem.originalIndex, e, photoIndex, okIndex, ngIndex)"
                                                                  @update:options="(options: FaultModel[]) => !(!photo.form.type_fault_id) ? autoAssignFault(options, sItem.originalIndex, photoIndex, okIndex, ngIndex) : undefined"
                                                                >
                                                                  <template v-slot:option="scope">
                                                                    <q-item v-bind="scope.itemProps">
                                                                      <q-item-section>
                                                                        <div class="row items-center gap-2">
                                                                          <q-badge
                                                                            color="grey-7"
                                                                          >
                                                                            {{ Number((faultSelectRef[`${photoIndex}`] as { selectResource?: QSelect }).selectResource?.options?.flatMap(opt => String(opt.id)).findIndex(id => id === String(scope.opt.id))) + 1 }}
                                                                          </q-badge>

                                                                          <q-item-label>{{ scope.opt.name }}</q-item-label>
                                                                        </div>
                                                                      </q-item-section>
                                                                    </q-item>
                                                                  </template>

                                                                  <template v-slot:no-option>
                                                                    <q-item>
                                                                      <q-item-section>
                                                                        <q-item-label class="text-bold text-gray-500 text-center">
                                                                          No available options
                                                                        </q-item-label>
                                                                      </q-item-section>
                                                                    </q-item>
                                                                  </template>
                                                                </select-resource>
                                                              </div>

                                                              <div class="column">
                                                                <q-input
                                                                  dense
                                                                  outlined
                                                                  stack-label
                                                                  hide-bottom-space
                                                                  label="NG Quantity"
                                                                  :model-value="ng.quantity"
                                                                  :disable="!(!sItem.item.loading) || !(!sItem.item.is_submitted)"
                                                                  :rules="[(val: string) => Number(val) > 0 || 'Must be greater than 0']"
                                                                  @update:model-value="ng.quantity = Number(String($event).replaceAll(',', '')); updateNGQty(sItem.originalIndex, photoIndex)"
                                                                  class="flex-grow"
                                                                  type="text"
                                                                  @keypress="onlyNumber"
                                                                  mask="###,###,###,###,###,###,###,###,###,###"
                                                                  reverse-fill-mask
                                                                />
                                                              </div>
                                                            </div>
                                                          </q-item-section>

                                                          <q-item-section
                                                            side
                                                            style="padding-left: unset !important; padding-right: 5px !important;"
                                                          >
                                                            <q-btn v-if="!sItem.item.is_submitted"
                                                              dense
                                                              flat
                                                              icon="close"
                                                              color="negative"
                                                              class="q-py-none mb-[2px]"
                                                              :disable="!(!sItem.item.loading)"
                                                              @click="handleRemoveNG(sItem.originalIndex, String(ng.fault_id), okIndex, photoIndex)"
                                                            />
                                                          </q-item-section>
                                                        </q-item>

                                                        <div class="q-pa-xs flex flex-grow">
                                                          <q-btn v-if="!sItem.item.is_submitted"
                                                            dense
                                                            unelevated
                                                            icon="add"
                                                            label="NG"
                                                            color="red-4"
                                                            class="flex-grow"
                                                            :disable="!(!sItem.item.loading) || ((availableSPKQuantity(ok.work_order_item) - Number(ok.quantity)) - sItem.item.ng_list.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id)).reduce((acc, ng) => Number(acc) + Number(ng.quantity), 0) <= 0)"
                                                            @click.stop="handleAddNG(sItem.originalIndex, okIndex, photoIndex); ok.is_ng_collapsed = false"
                                                          >
                                                            <template v-slot:default>
                                                              <q-tooltip v-if="((availableSPKQuantity(ok.work_order_item) - Number(ok.quantity)) - sItem.item.ng_list.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id)).reduce((acc, ng) => Number(acc) + Number(ng.quantity), 0) <= 0)"
                                                                anchor="top middle"
                                                                self="center middle"
                                                              >
                                                                <span class="font-medium text-italic text-uppercase">Not Enough Quantity to add NG</span>
                                                              </q-tooltip>
                                                            </template>
                                                          </q-btn>

                                                          <div v-else-if="sItem.item.is_submitted && !sItem.item.ng_list.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id)).length"
                                                            class="flex items-center q-pa-xs"
                                                          >
                                                            <span class="font-medium text-italic text-uppercase text-gray-500">No NG</span>
                                                          </div>
                                                        </div>
                                                      </q-list>
                                                    </q-card-section>
                                                  </q-card>

                                                  <div v-if="((availableSPKQuantity(ok.work_order_item) - Number(ok.quantity)) - sItem.item.ng_list.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id)).reduce((acc, ng) => Number(acc) + Number(ng.quantity), 0) < 0) && sItem.item.ng_list.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id)).length"
                                                  >
                                                    <q-chip
                                                      dense
                                                      square
                                                      color="negative"
                                                      text-color="white"
                                                      icon="warning"
                                                      label="Exceeded available SPK Quantity"
                                                      class="q-ma-none font-medium"
                                                    />
                                                  </div>
                                                </div>
                                              </q-item-section>

                                              <q-item-section
                                                top
                                                side
                                                style="padding-left: unset !important; padding-right: 5px !important;"
                                              >
                                                <q-btn-dropdown v-if="!sItem.item.is_submitted"
                                                  dense
                                                  flat
                                                  size="12px"
                                                  icon="close"
                                                  color="negative"
                                                  class="q-py-none disable-arrow"
                                                  :disable="!(!sItem.item.loading)"
                                                  @click.stop
                                                >
                                                  <q-card>
                                                    <q-card-section class="q-pa-sm column items-center">
                                                      <q-item-label class="font-medium text-italic text-uppercase">
                                                        Are you sure?
                                                      </q-item-label>
                                                      <q-item-label caption class="font-medium text-italic text-uppercase">
                                                        This action cannot be undone
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
                                                        icon="delete"
                                                        label="Yes"
                                                        color="negative"
                                                        class="q-py-none flex-grow"
                                                        :disable="!(!sItem.item.loading)"
                                                        v-close-popup
                                                        @click="handleRemoveOK(sItem.originalIndex, okIndex, photoIndex)"
                                                      />
                                                    </q-card-actions>
                                                  </q-card>
                                                </q-btn-dropdown>
                                              </q-item-section>
                                            </q-item>
                                          </div>
                                        </q-list>
                                      </q-card-section>
                                    </q-card>
                                  </div>

                                  <div v-show="!sItem.item.is_collapsed" class="grid grid-cols-2 gap-1 q-px-sm q-mb-xs">
                                    <div class="column flex-grow">
                                      <q-item-label class="font-medium text-italic text-uppercase">
                                        TOTAL OK
                                      </q-item-label>
                                      <q-input
                                        dense
                                        outlined
                                        disable
                                        hide-bottom-space
                                        :bottom-slots="!(!sItem.item.scanned_ok)"
                                        :rules="[(val: string) => Number(val) >= 0 || 'Must be greater than or equal to 0']"
                                        :model-value="sItem.item.ok"
                                        @update:model-value="sItem.item.ok = Number(String($event).replaceAll(',',''))"
                                        mask="###,###,###,###,###,###,###,###,###,###"
                                        reverse-fill-mask
                                      >
                                        <template v-slot:hint>
                                          <q-item-label v-if="sItem.item.scanned_ok" caption class="font-medium q-pl-xs pt-[1px]">
                                            Scanned as {{ sItem.item.scanned_ok }}
                                          </q-item-label>
                                        </template>
                                      </q-input>
                                    </div>

                                    <div class="column flex-grow">
                                      <q-item-label class="font-medium text-italic text-uppercase">
                                        TOTAL NG
                                      </q-item-label>
                                      <q-input
                                        dense
                                        outlined
                                        hide-bottom-space
                                        :bottom-slots="!(!sItem.item.scanned_ng)"
                                        :rules="[(val: string) => Number(val) >= 0 || 'Must be greater than or equal to 0']"
                                        :model-value="sItem.item.ng"
                                        @update:model-value="sItem.item.ng = Number(String($event).replaceAll(',', ''))"
                                        disable
                                        type="text"
                                        @keypress="onlyNumber"
                                        mask="###,###,###,###,###,###,###,###,###,###"
                                        reverse-fill-mask
                                      >
                                        <template v-slot:hint>
                                          <q-item-label v-if="sItem.item.scanned_ng" caption class="font-medium q-pl-xs pt-[1px]">
                                            Scanned as {{ sItem.item.scanned_ng }}
                                          </q-item-label>
                                        </template>
                                      </q-input>
                                    </div>
                                  </div>

                                  <div v-show="!sItem.item.is_collapsed" class="column q-mb-xs q-px-sm">
                                    <q-item-label class="font-medium text-italic text-uppercase q-px-sm">
                                      Description
                                    </q-item-label>

                                    <q-input
                                      dense
                                      outlined
                                      autogrow
                                      v-model="sItem.item.description"
                                      type="textarea"
                                      :disable="!(!sItem.item.loading) || !(!sItem.item.is_submitted)"
                                      class="flex-grow"
                                    />
                                  </div>
                                </q-item-section>
                              </q-item>
                            </div>
                          </q-list>
                        </q-scroll-area>
                      </q-card-section>
                    </q-card>
                  </div>
                </q-form> -->

                <q-form v-show="photo.scan_result"
                  :ref="(e) => setFormRef((e as QForm), photoIndex)"
                  class="column gap-1"
                >
                  <form-component
                    :data="photo"
                  />
                </q-form>

                <q-card v-show="!photo.scan_result && photo.on_process"
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
// import SelectResource from 'src/components/SelectResource.vue';
import { useAuthStore } from 'src/stores/auth-store';
import type { CapturedImageModel, InspectionFormModel, OperatorModel, PackingItemFaultModel, PackingItemOrderModel, PartModel, UnitModel, UploadableModel, WOItemModel } from 'src/types/model';
// import { levenshtein, sorensenDice } from 'src/composable/algorithms';
import FileSelection from 'src/components/FileSelection.vue';
import FormComponent from 'src/components/FormComponent.vue';
// import ImageComponent from 'src/components/ImageComponent.vue';

const useAuth = useAuthStore();

const imageTab = ref(0);

// const triggerReloadWO = ref<{ [key: string]: boolean }>({});
// const triggerReloadItem = ref<{ [key: string]: boolean }>({});
// const triggerReloadFaults = ref<{ [key: string]: boolean }>({});

const capturedPhoto = ref<CapturedImageModel[]>([]);
const selectedFile = ref<UploadableModel | null>(null);

const formRefs = ref<{ [key: string]: QForm | null }>({});
// const faultSelectRef = ref<{ [key: string]: QSelect | null }>({});

const availableSPKQuantity = (spk: WOItemModel | undefined | null) => {
  if (spk) return Number(spk.quantity) - (Number(spk.amount_packing) + Number(spk.amount_faulty));
  else return 0;
}

onMounted(() => {
  api.defaults.headers.common['Authorization'] = `Bearer ${useAuth.user?.token}`;
})

// const getSplittedItems = (items: FormItemModel[]) => {
//   const middle = Math.ceil(items.length / 2)

//   return [
//     items.slice(0, middle).map((item, index) => ({
//       item,
//       originalIndex: index
//     })),

//     items.slice(middle).map((item, index) => ({
//       item,
//       originalIndex: middle + index
//     }))
//   ]
// }

const setFormRef = (ref: QForm | null, index: number) => {
  if (ref) {
    formRefs.value[index] = ref;
  }
}

// const setFaultRef = (ref: QSelect | null, formIndex: number) => {
//   if (ref) {
//     faultSelectRef.value[`${formIndex}`] = ref;
//   }
// }

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

// const handleSelectOperator = (operator: OperatorModel | null, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   form.operator = operator;
//   form.operator_id = operator ? operator.id : null;
// }

// const handleSelectShift = (shift: ShiftModel | null, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   form.shift = shift;
//   form.shift_id = shift ? shift.id : null;
// }

// const handleSelectCustomer = (itemIndex: number, customer: CustomerModel | null, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]) {
//     //handling on changed customer (not first time select)
//     if (form.items[itemIndex].customer_id) {
//       //remove selected part
//       form.items[itemIndex].item_id = null;
//       form.items[itemIndex].part = null;

//       //remove selected unit
//       form.items[itemIndex].unit_id = null;
//       form.items[itemIndex].unit = null;

//       //remove selected work order
//       // form.items[itemIndex].work_order_item_id = null;
//       // form.items[itemIndex].work_order_item = null;
//       form.items[itemIndex].ok_list = [];

//       //reset wo on ng_list
//       form.items[itemIndex].ng_list.forEach((ng) => {
//         ng.work_order_item_id = null;
//         ng.work_order_item = null;
//       })

//       triggerReloadItem.value[itemIndex] = true;

//       setTimeout(() => {
//         delete triggerReloadItem.value[itemIndex];
//       }, 100);
//     }

//     form.items[itemIndex].customer = customer;
//     form.items[itemIndex].customer_id = customer ? customer.id : null;
//   }
// }

// const handleSelectItem = (itemIndex: number, item: PartModel | null, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]) {
//     if (form.items[itemIndex].customer_id) {
//       form.items[itemIndex].unit_id = null;
//       form.items[itemIndex].unit = null;

//       // form.items[itemIndex].work_order_item_id = null;
//       // form.items[itemIndex].work_order_item = null;

//       form.items[itemIndex].ok_list = [];

//       if (form.items[itemIndex].item_id) {
//         form.items[itemIndex].ng_list = [];
//         updateNGQty(itemIndex, formIndex);

//         // const scannedData = data.scan_result;
//         // const scannedItem = scannedData?.items[itemIndex];

//         // if (scannedItem) {
//         //   form.items[itemIndex].ng_list = scannedItem.ng_list.map((ng) => {
//         //     return {
//         //       code: ng.code,
//         //       scanned_code: ng.code,

//         //       quantity: ng.quantity,
//         //       scanned_quantity: ng.quantity,
//         //     }
//         //   })
//         // }
//       }

//       // form.items[itemIndex].ng_list.forEach((ng) => {
//       //   ng.work_order_item_id = null;
//       //   ng.work_order_item = null;
//       // });

//       if (form.items[itemIndex].item_id) {
//         triggerReloadWO.value[itemIndex] = true;

//         setTimeout(() => {
//           delete triggerReloadWO.value[itemIndex];
//         }, 100);
//       }
//     }

//     form.items[itemIndex].part = item;
//     form.items[itemIndex].item_id = item ? item.id : null;

//     autoAssignUnit((item ? item.item_units : []), itemIndex, formIndex);

//     handleAddOK(itemIndex, formIndex);
//   }
// }

// const handleSelectWOItem = (itemIndex: number, item: WOItemModel, formIndex: number, okIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]?.ok_list) {
//     // form.items[itemIndex].work_order_item_id = item.id;
//     // form.items[itemIndex].work_order_item = item;

//     const ok = form.items[itemIndex].ok_list[okIndex];

//     if (ok) {
//       const selectedWOIdSnapshot = JSON.parse(JSON.stringify(ok.work_order_item_id))

//       ok.work_order_item_id = item.id;
//       ok.work_order_item = item;

//       if (Number(item.quantity) >= Number(form.items[itemIndex].scanned_ok)) {
//         ok.quantity = Number(form.items[itemIndex].scanned_ok);

//         updateOKQty(itemIndex, formIndex);
//       }

//       if (selectedWOIdSnapshot) {
//         form.items[itemIndex].ng_list
//           .filter(ng => String(ng.work_order_item_id) === String(selectedWOIdSnapshot))
//           .forEach(ng => {
//             ng.work_order_item = ok.work_order_item as WOItemModel;
//             ng.work_order_item_id = ok.work_order_item_id as string;
//           })
//       }
//     }

//   }
// }

// const handleSelectUnit = (itemIndex: number, unit: PartModel['item_units'][number] | null, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]) {
//     form.items[itemIndex].unit = unit;
//     form.items[itemIndex].unit_id = unit ? unit.unit.id : null;
//   }
// }

// const handleSelectFaultType = (fault_type: FaultTypeModel, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   if (form) {
//     if (form.type_fault_id) {
//       triggerReloadFaults.value[formIndex] = true;

//       setTimeout(() => {
//         delete triggerReloadFaults.value[formIndex];
//       }, 100);
//     }

//     form.type_fault = fault_type;
//     form.type_fault_id = fault_type.id;
//   }
// }

// const handleSelectFault = (itemIndex: number, fault: FaultModel | null, formIndex: number, okIndex: number, ngIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;
//   const item = form.items[itemIndex];
//   const ok = item?.ok_list?.[okIndex];

//   if (item && ok) {
//     const ng = item.ng_list.filter(ng =>
//       String(ng.work_order_item_id) === String(ok.work_order_item_id)
//     )?.[ngIndex];

//     if (!ng) return;

//     const options = (faultSelectRef.value[`${formIndex}`] as { opts?: FaultModel[] }).opts;
//     const selectedIndex = options && fault
//       ? options.findIndex((opt) => String(opt.id) === String(fault.id))
//       : null;

//     const indexToCode = selectedIndex !== null ? Number(selectedIndex) + 1 : null;

//     if (indexToCode) ng.code = indexToCode;

//     ng.fault = fault;
//     ng.fault_id = fault ? fault.id : null;
//   }

//   // if (item && item.ng_list[ngIndex]) {
//   //   const options = (faultSelectRef.value[`${formIndex}`] as { opts?: FaultModel[] }).opts;
//   //   const selectedIndex = options && fault
//   //     ? options.findIndex((opt) => String(opt.id) === String(fault.id))
//   //     : null;

//   //   const indexToCode = selectedIndex !== null ? Number(selectedIndex) + 1 : null;

//   //   if (indexToCode) item.ng_list[ngIndex].code = indexToCode;

//   //   item.ng_list[ngIndex].fault = fault;
//   //   item.ng_list[ngIndex].fault_id = fault ? fault.id : null;
//   // }
// }

// const handleAddItem = (formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   const newItem = {
//     customer: null,
//     customer_id: null,
//     part: null,
//     item_id: null,
//     unit_id: null,
//     work_order_item: null,
//     work_order_item_id: null,
//     lot_number: '',
//     worktime: '',
//     begin_datetime: '',
//     until_datetime: '',
//     type_fault_id: null,
//     ok: 0,
//     ng: 0,
//     ng_list: [],

//     is_markup_ng_collapsed: true,
//     is_collapsed: false,
//     is_submitted: false,
//   }

//   form.items.push(newItem);
// }

// const handleAddOK = (itemIndex: number, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   const newOK = {
//     work_order_item_id: null,
//     work_order_item: null,
//     quantity: 0,

//     is_ng_collapsed: true,
//   }

//   if (form.items[itemIndex]) {
//     if (form.items[itemIndex].ok_list) form.items[itemIndex].ok_list.push(newOK);
//     else form.items[itemIndex].ok_list = [newOK];
//   }
// }

// const handleAddNG = (itemIndex: number, okIndex: number, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;
//   const item = form.items[itemIndex];

//   if (item) {
//     const ok = item.ok_list?.[okIndex];

//     if (!ok) return;

//     const newNG = {
//       code: '',
//       quantity: 0,
//       work_order_item: ok.work_order_item as WOItemModel,
//       work_order_item_id: ok.work_order_item_id as string,
//     }

//     item.ng_list.push(newNG);
//   }
// }

// const handleRemoveItem = (index: number, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   form.items.splice(index, 1);
// }

// const handleRemoveOK = (itemIndex: number, okIndex: number, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex] && form.items[itemIndex].ok_list) {
//     const WOIdSnapshot = JSON.parse(JSON.stringify(form.items[itemIndex].ok_list[okIndex]?.work_order_item_id));

//     form.items[itemIndex].ok_list.splice(okIndex, 1);

//     if (WOIdSnapshot) {
//       form.items[itemIndex].ng_list
//         .filter(ng => String(ng.work_order_item_id) === String(WOIdSnapshot))
//         .forEach(ng => {
//           ng.work_order_item = null;
//           ng.work_order_item_id = null;
//         })
//     }
//   }
// }

// const handleRemoveNG = (itemIndex: number, fault_id: string | number, okIndex: number, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;
//   const item = form.items[itemIndex];
//   const ok = item?.ok_list?.[okIndex];

//   if (item && ok) {
//     const ngIndexToRemove = item.ng_list.findIndex(ng =>
//       String(ng.fault_id) === String(fault_id)
//       && String(ng.work_order_item_id) === String(ok.work_order_item_id)
//     );

//     item.ng_list.splice(ngIndexToRemove, 1);

//     updateNGQty(itemIndex, formIndex);
//   }
// }

// const updateOKQty = (itemIndex: number, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex] && form.items[itemIndex].ok_list) {
//     form.items[itemIndex].ok = form.items[itemIndex].ok_list.reduce((a, b) => Number(a) + Number(b.quantity), 0);
//   }
// }

const updateNGQty = (itemIndex: number, formIndex: number) => {
  const data = capturedPhoto.value[formIndex];

  if (!data) return;

  const form = data.form;

  if (form.items[itemIndex]) {
    form.items[itemIndex].ng = form.items[itemIndex].ng_list.reduce((a, b) => Number(a) + Number(b.quantity), 0);

    // formRefs.value[formIndex]?.validate().catch(() => {});
  }
}

// const findBestMatch = <T extends Record<string, unknown>> (
//   scannedText: string,
//   data: T[],
//   key: keyof T
// ): T | null => {
//   if (!scannedText) return null;

//   const text = scannedText.toLowerCase().trim();

//   let best: T | null = null;
//   let bestDistance = Infinity;
//   let bestScore = 0;

//   //levenshtein dist
//   data.forEach((item) => {
//     const rawValue = item[key];

//     if (typeof rawValue !== 'string') return;

//     const value = rawValue.toLowerCase().trim();

//     const distance = levenshtein(text, value);

//     if (distance < bestDistance) {
//       bestDistance = distance;
//       best = item;
//     }
//   });

//   if (bestDistance <= Math.max(2, text.length * 0.3)) {
//     return best;
//   }

//   //sorensen dice
//   for (const item of data) {
//     const raw = item[key];

//     if (typeof raw !== 'string') continue;

//     const score = sorensenDice(scannedText, raw);

//     if (score > bestScore) {
//       bestScore = score;
//       best = item;
//     }
//   }

//   if (bestScore >= 0.6) {
//     return best;
//   }

//   return null;
// }

// const findDataFromScan = (scannedData: string, data: Record<string, unknown>[], key: string) => {
//   if (!scannedData) return null;

//   const trimmedScannedData = scannedData.toLocaleLowerCase().trim();

//   let found = data?.find(op => String(op[key]).toLocaleLowerCase().trim() === trimmedScannedData);
//   if (found) return found;

//   found = data?.find(op => String(op[key]).toLocaleLowerCase().includes(trimmedScannedData) || trimmedScannedData.includes(String(op[key]).toLocaleLowerCase()));
//   if (found) return found;

//   const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g,"");

//   found = data?.find(o => norm(String(o[key])) === norm(trimmedScannedData));
//   if (found) return found;

//   return findBestMatch(scannedData, data, key);
// }

// const autoAssignOperator = (options: OperatorModel[], formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   const match = findDataFromScan(
//     String(form.scanned_operator_name),
//     options as unknown as Record<string, unknown>[],
//     'name'
//   );

//   if (match) {
//     handleSelectOperator(match as unknown as OperatorModel, formIndex);
//   } else {
//     handleSelectOperator(null, formIndex);
//   }
// }

// const autoAssignShift = (options: ShiftModel[], formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   const match = findDataFromScan(
//     String(form.scanned_shift),
//     options as unknown as Record<string, unknown>[],
//     'name'
//   );

//   if (match) {
//     handleSelectShift(match as unknown as ShiftModel, formIndex);
//   } else {
//     handleSelectShift(null, formIndex);
//   }
// }

// const autoAssignFaultType = (options: FaultTypeModel[], formIndex: number) => {
//   // const data = capturedPhoto.value[formIndex];

//   // if (!data) return;

//   // const form = data.form;

//   const match = options[0];

//   handleSelectFaultType(match as FaultTypeModel, formIndex)

//   // const match = findDataFromScan(
//   //   String(form.scanned_shift),
//   //   options as unknown as Record<string, unknown>[],
//   //   'name'
//   // );

//   // if (match) {
//   //   handleSelectShift(match as unknown as ShiftModel, formIndex);
//   // } else {
//   //   handleSelectShift(null, formIndex);
//   // }
// }

// const autoAssignCustomer = (options: CustomerModel[], itemIndex: number, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]) {
//     const match = findDataFromScan(
//       String(form.items[itemIndex].scanned_customer),
//       options as unknown as Record<string, unknown>[],
//       'code'
//     );

//     if (match) {
//       handleSelectCustomer(itemIndex, match as unknown as CustomerModel, formIndex);
//     } else {
//       handleSelectCustomer(itemIndex, null, formIndex);
//     }
//   }
// }

// const autoAssignItem = (options: PartModel[], itemIndex: number, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]) {
//     const match = findDataFromScan(
//       String(form.items[itemIndex].scanned_part_name),
//       options as unknown as Record<string, unknown>[],
//       'part_name'
//     );

//     if (match) {
//       handleSelectItem(itemIndex, match as unknown as PartModel, formIndex);
//       // autoAssignUnit((match.item_units as UnitModel[]), itemIndex);
//     } else {
//       handleSelectItem(itemIndex, null, formIndex);
//     }
//   }
// }

// const autoAssignUnit = (options: UnitModel[], itemIndex: number, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex] && options.length > 0) {
//     handleSelectUnit(itemIndex, (options[0] as UnitModel), formIndex);
//   } else {
//     handleSelectUnit(itemIndex, null, formIndex);
//   }
// }

// const autoAssignFault = (options: FaultModel[], itemIndex: number, formIndex: number, okIndex: number, ngIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;
//   const item = form.items[itemIndex];
//   const ok = item?.ok_list?.[okIndex];

//   if (item && ok) {
//     const ng = item.ng_list.filter(ng =>
//       String(ng.work_order_item_id) === String(ok.work_order_item_id)
//     )?.[ngIndex];

//     if (!ng) return;

//     const match = options.find((op, opIndex) => (Number(opIndex) + 1) === Number(ng.code));

//     if (match) {
//       handleSelectFault(itemIndex, match, formIndex, okIndex, ngIndex);
//     } else {
//       handleSelectFault(itemIndex, null, formIndex, okIndex, ngIndex);
//     }
//   }

//   // if (form.items[itemIndex] && options.length > 0) {
//   //   const ng = form.items[itemIndex].ng_list[ngIndex];
//   //   if (ng) {
//   //     const match = options
//   //       .find((op, opIndex) => (Number(opIndex) + 1) === Number(ng.code));

//   //     if (match) {
//   //       handleSelectFault(itemIndex, match, formIndex, ngIndex);
//   //     } else {
//   //       handleSelectFault(itemIndex, null, formIndex, ngIndex);
//   //     }
//   //   }
//   // }
// }

// const autoAssignWOItem = (options: WOItemModel[], itemIndex: number, formIndex: number) => {
//   const data = capturedPhoto.value[formIndex];

//   if (!data) return;

//   const form = data.form;

//   if (
//     Number(form.items[itemIndex]?.ok_list?.length) > 1
//     || !(!form.items[itemIndex]?.ok_list?.[0]?.work_order_item_id)
//   ) return;

//   if (form.items[itemIndex] && options.length > 0) {
//     const ok = form.items[itemIndex].scanned_ok;
//     const ng = form.items[itemIndex].scanned_ng;

//     const totalQty = Number(ok) + Number(ng);

//     const assignedWOItems: WOItemModel[] = [];

//     options.forEach((woItem) => {
//       if (assignedWOItems.reduce((a, b) => Number(a) + Number(b.quantity), 0) >= totalQty) return;

//       assignedWOItems.push(woItem);
//     });

//     let settedQty = 0;

//     const mappedOKList = assignedWOItems.map(woItem => {
//       // const qty = Number(woItem.quantity) <= (Number(ok) - settedQty)
//       //     ? Number(woItem.quantity)
//       //     : Math.max(0, Number(ok) - settedQty);

//       const qty = availableSPKQuantity(woItem) <= (Number(ok) - settedQty)
//           ? availableSPKQuantity(woItem)
//           : Math.max(0, Number(ok) - settedQty);

//       settedQty += qty;

//       return {
//         work_order_item: woItem,
//         work_order_item_id: woItem.id,
//         quantity: qty,
//         is_ng_collapsed: true,
//       }
//     });

//     // form.items[itemIndex].ok_list = mappedOKList;
//     form.items[itemIndex].ok_list?.splice(
//       0,
//       form.items[itemIndex].ok_list?.length,
//       ...mappedOKList
//     );

//     // form.items[itemIndex].ok_list?.push(...mappedOKList);

//     updateOKQty(itemIndex, formIndex);

//     handleAssignFaultyWOItem(itemIndex, formIndex);
//   }
// }

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

  for (const [itemIndex, item] of form.items.filter(i => !i.is_submitted).entries()) {
    // item.ng_list.forEach(ng => {
    //   const lastWO = item.ok_list?.[Number(item.ok_list?.length) - 1];

    //   ng.work_order_item = lastWO?.work_order_item as WOItemModel;
    //   ng.work_order_item_id = lastWO?.work_order_item_id as string;
    // })

    handleAssignFaultyWOItem(itemIndex, formIndex);

    const dataToSubmit: InspectionFormModel = {
      customer_id: String(item.customer_id),
      date: String(form.date),
      shift_id: String(form.shift_id),
      worktime: form.worktime || 'REGULER',
      description: item.description ? String(item.description) : '',
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

const handleCancelForm = (formIndex: number) => {
  capturedPhoto.value.splice(formIndex, 1);

  if (formIndex === capturedPhoto.value.length && capturedPhoto.value.length > 0) {
    imageTab.value = formIndex - 1;
  }

  if (!capturedPhoto.value.length) {
    selectedFile.value = null;
  }
}

// const handleOpenReport = (id: string | number) => {
//   window.open(`${process.env.WEB_BASE_URL}/#/admin/factories/packings/${id}`, '_blank');
// }

// const onlyNumber = (e: KeyboardEvent) => {
//   const input = e.target as HTMLInputElement;
//   const key = e.key;

//   if (
//     key === 'Backspace' ||
//     key === 'Delete' ||
//     key === 'ArrowLeft' ||
//     key === 'ArrowRight' ||
//     key === 'Tab'
//   ) {
//     return;
//   }

//   if (/^\d$/.test(key)) {
//     return;
//   }

//   if (key === '.' && !input.value.includes('.') && input.value.length > 0) {
//     return;
//   }

//   e.preventDefault();
// };

const handleViewImage = (data: CapturedImageModel) => {
  const popup = window.open(
    '',
    'ImagePreview',
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

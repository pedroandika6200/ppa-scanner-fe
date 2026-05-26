<template>
  <q-form
    ref="formRef"
    class="column gap-1"
  >
    <!-- <div class="column">
      <div class="row items-end justify-between">
        <q-item-label class="font-medium text-italic text-uppercase q-pl-xs pt-[10px]">
          Operator
        </q-item-label>

        <q-btn-dropdown v-if="!data.is_submitted && !data.form.items.some(i => i.is_submitted)"
          dense
          unelevated
          size="sm"
          icon="refresh"
          color="green-4"
          text-color="black"
          class="disable-arrow q-pr-sm text-bold q-mb-xs"
          label="Re-generate results"
          :disable="!(!data.on_process)"
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
                @click="handleRegenerateScanResult"
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
      <select-resource
        ref="operatorSelect"
        dense
        outlined
        use-refresh
        :xbottom-slots="!(!data.form.scanned_operator_name)"
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
        :disable="!(!data.on_process) || data.form.items.some(i => i.is_submitted)"
        :model-value="data.form.operator"
        @update:model-value="(e: OperatorModel) => handleSelectOperator(e)"
        @update:options="(e: OperatorModel[]) => autoAssignOperator(e)"
      >
        <template v-slot:hint>
          <q-item-label v-if="data.form?.scanned_operator_name" caption class="font-medium q-pl-xs pt-[1px]">
            Scanned as {{ data.form?.scanned_operator_name }}
          </q-item-label>
        </template>
      </select-resource>
    </div>

    <div xclass="grid grid-cols-3 gap-2" :class="$q.screen.lt.sm ? '' : 'grid grid-cols-3 gap-2'">
      <div class="column flex-grow col-span-2">
        <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
          Shift
        </q-item-label>
        <select-resource
          dense
          outlined
          use-refresh
          :xbottom-slots="!(!data.form.scanned_shift)"
          bottom-slots
          search=""
          api-url="/api/v1/references/shifts"
          :api-params="{
            'mode': 'all',
            'limit': '*',
          }"
          option-label="name"
          :disable="!(!data.on_process) || data.form.items.some(i => i.is_submitted)"
          :model-value="data.form.shift"
          @update:model-value="(e: ShiftModel) => handleSelectShift(e)"
          @update:options="(e: ShiftModel[]) => autoAssignShift(e)"
        >
          <template v-slot:hint>
            <q-item-label v-if="data.form?.scanned_shift" caption class="font-medium q-pl-xs pt-[1px]">
              Scanned as {{ data.form?.scanned_shift }}
            </q-item-label>
          </template>
        </select-resource>
      </div>

      <div class="column flex-grow">
        <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
          Date
        </q-item-label>
        <q-input
          dense
          outlined
          :xbottom-slots="!(!data.form.scanned_date)"
          bottom-slots
          type="date"
          :disable="!(!data.on_process) || data.form.items.some(i => i.is_submitted)"
          :model-value="data.form.date"
          @update:model-value="(e) => handleSetDate(e as string)"
        >
          <template v-slot:hint>
            <q-item-label v-if="data.form?.scanned_date" caption class="font-medium q-pl-xs pt-[1px]">
              Scanned as {{ data.form?.scanned_date }}
            </q-item-label>
          </template>
        </q-input>
      </div>
    </div>

    <div class="column">
      <div class="row items-end justify-between">
        <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
          Items {{ data.form.items.length ? `- ${data.form.items.length} Item${data.form.items.length > 1 ? 's' : ''} scanned` : '' }}
        </q-item-label>
        <q-btn v-if="!data.form.items.some(i => i.is_submitted) && !data.on_process"
          dense
          unelevated
          size="12px"
          icon="add"
          label="Item"
          color="primary"
          class="q-pr-sm q-py-none mb-[2px]"
          :disable="!(!data.on_process)"
          @click="handleAddItem"
        />
      </div>
      <q-card flat bordered>
        <q-card-section v-if="!data.form.items.length" class="flex items-center justify-center q-pa-xs">
          <span class="text-lg font-medium text-italic text-uppercase text-gray-500">No Item Added</span>
        </q-card-section>

        <q-card-section v-else class="q-pa-none">
          <q-scroll-area
            style="height: calc(100dvh - 350px);"
            class="no-scrollbar"
          >
            <q-list class="gap-2">
              <q-item
                dense
                v-for="(item, index) in data.form.items"
                :key="index"
                class="q-px-none q-py-xs border rounded q-mx-xs q-my-sm bg-gray-100 border-md border-gray-400"
              >
                <q-item-section>
                  <div class="sticky-item-header bg-gray-100">
                    <div
                      @click="item.is_collapsed = !item.is_collapsed"
                      class="row items-center justify-between q-px-sm cursor-pointer"
                    >
                      <div class="row items-center gap-1">
                        <q-icon :name="item.is_collapsed ? 'keyboard_arrow_down' : 'keyboard_arrow_up'" />
                        <q-badge
                          dense
                          square
                          color="primary"
                          text-color="white"
                          class="font-medium q-py-xs"
                          :label="index + 1"
                        />

                        <q-item-label v-if="item.number" class="font-medium text-italic text-uppercase">
                          {{ item.number }}
                        </q-item-label>

                        <q-item-label v-else class="font-medium text-italic text-uppercase">
                          Item {{ index + 1 }}
                        </q-item-label>
                      </div>

                      <q-btn-dropdown v-if="!item.loading && !item.is_submitted && !item.error"
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
                              @click="handleRemoveItem(index)"
                            />
                          </q-card-actions>
                        </q-card>
                      </q-btn-dropdown>

                      <q-spinner v-else-if="item.loading" color="primary" />

                      <div v-else-if="item.is_submitted">
                        <q-chip
                          size="sm"
                          icon="task_alt"
                          label="Submitted"
                          color="positive"
                          text-color="black"
                          class="q-my-none text-bold text-uppercase"
                        />

                        <q-btn v-if="item.id"
                          dense
                          rounded
                          unelevated
                          size="sm"
                          label="Open Report"
                          icon="open_in_new"
                          color="primary"
                          class="q-px-sm"
                          @click.stop="handleOpenReport(item.id)"
                        />
                      </div>

                      <q-chip v-else-if="item.error"
                        size="sm"
                        icon="warning"
                        label="Error"
                        color="negative"
                        text-color="white"
                        class="q-my-none text-bold text-uppercase"
                      />
                    </div>

                    <q-separator v-if="item.error"
                      spaced="xs"
                    />

                    <q-item-label v-if="item.error"
                      class="font-medium text-italic text-center q-px-sm text-gray-600"
                    >
                      {{ item.error }}
                    </q-item-label>

                    <q-separator v-show="!item.is_collapsed" spaced="sm" />
                  </div>

                  <div v-show="!item.is_collapsed" class="column q-mb-xs">
                    <q-item-label class="font-medium text-italic text-uppercase q-px-sm">
                      Customer
                    </q-item-label>

                    <select-resource
                      dense
                      outlined
                      use-refresh
                      hide-bottom-space
                      :bottom-slots="!(!item.scanned_customer)"
                      search=""
                      api-url="/api/v1/incomes/customers"
                      :api-params="{
                        'limit': '*',
                      }"
                      class="q-px-sm"
                      :disable="!(!item.loading) || !(!item.is_submitted)"
                      :option-label="(option: CustomerModel) => `(${option.code}) ${option.name}`"
                      :model-value="item.customer"
                      :rules="[(val: CustomerModel) => !!val || 'Customer is required']"
                      @update:model-value="(e: CustomerModel) => handleSelectCustomer(index, e)"
                      @update:options="(option: CustomerModel[]) => !(!item.scanned_customer) && !item.customer_id ? autoAssignCustomer(option, index) : undefined"
                    >
                      <template v-slot:hint>
                        <q-item-label v-if="item.scanned_customer" caption class="font-medium q-pl-xs pt-[1px]">
                          Scanned as {{ item.scanned_customer }}
                        </q-item-label>
                      </template>
                    </select-resource>
                  </div>

                  <div v-show="!item.is_collapsed" class="column q-mb-xs">
                    <q-item-label class="font-medium text-italic text-uppercase q-px-sm">
                      Part Name
                    </q-item-label>

                    <select-resource
                      dense
                      outlined
                      use-refresh
                      hide-bottom-space
                      :bottom-slots="!(!item.scanned_part_name)"
                      search=""
                      api-url="/api/v1/common/items"
                      :api-params="{
                        'mode': 'all',
                        'limit': '*',
                        'has_stocks': 'WIP',
                        'customer_id': item.customer_id,
                        '--with': 'item_units',
                        'search': '',
                        'search-keys': ''
                      }"
                      class="q-px-sm"
                      option-label="part_name"
                      :load-until="!(!item.customer_id)"
                      :force-reload="triggerReloadItem[index] || null"
                      :option-caption="(option: PartModel) => `Code: ${option.code}`"
                      :model-value="item.part"
                      :disable="!item.customer_id || !(!item.loading) || !(!item.is_submitted) ? true : null"
                      :rules="[(val: PartModel) => !!val || 'Part is required']"
                      @update:model-value="(e: PartModel) => handleSelectItem(index, e)"
                      @update:options="(e: PartModel[]) => autoAssignItem(e, index)"
                    >
                      <template v-slot:hint>
                        <q-item-label v-if="item.scanned_part_name" caption class="font-medium q-pl-xs pt-[1px]">
                          Scanned as {{ item.scanned_part_name }}
                        </q-item-label>
                      </template>

                      <q-tooltip v-if="!item.customer_id">
                        Please select customer first
                      </q-tooltip>
                    </select-resource>
                  </div>

                  <div v-show="!item.is_collapsed" class="grid grid-cols-2 gap-2 q-px-sm q-mb-xs">
                    <div class="column flex-grow">
                      <q-item-label class="font-medium text-italic text-uppercase">
                        OK
                      </q-item-label>
                      <q-input
                        dense
                        outlined
                        disable
                        hide-bottom-space
                        :bottom-slots="!(!item.scanned_ok)"
                        :rules="[(val: string) => Number(val) >= 0 || 'Must be greater than or equal to 0']"
                        v-model="item.ok"
                      >
                        <template v-slot:hint>
                          <q-item-label v-if="item.scanned_ok" caption class="font-medium q-pl-xs pt-[1px]">
                            Scanned as {{ item.scanned_ok }}
                          </q-item-label>
                        </template>
                      </q-input>
                    </div>

                    <div class="column flex-grow">
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
                        :options="(item.part?.item_units as UnitModel[])"
                        :option-label="(option: PartModel['item_units'][number]) => `${option.unit.name}`"
                        :option-caption="(option: PartModel['item_units'][number]) => `Code: ${option.unit.code}`"
                        :model-value="item.unit"
                        :disable="!item.item_id || !(!item.loading) || !(!item.is_submitted)"
                        :rules="[(val: PartModel['item_units'][number]) => !!val || 'Unit is required']"
                        @update:model-value="(e: PartModel['item_units'][number]) => handleSelectUnit(index, e)"
                      />
                    </div>
                  </div>

                  <div v-show="!item.is_collapsed" class="column no-wrap q-px-sm q-mb-md">
                    <div class="row items-end justify-between">
                      <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
                        Work Orders (SPK)
                      </q-item-label>
                      <q-btn v-if="!item.is_submitted"
                        dense
                        unelevated
                        size="12px"
                        icon="add"
                        label="SPK"
                        color="primary"
                        class="q-pr-sm q-py-none mb-[2px]"
                        :disable="!item.item_id || !(!item.loading)"
                        @click="handleAddOK(index)"
                      >
                        <q-tooltip v-if="!item.item_id" class="">
                          Please select item/part first
                        </q-tooltip>
                      </q-btn>
                    </div>

                    <q-card flat bordered>
                      <q-card-section v-if="!item.ok_list?.length" class="flex items-center justify-center q-pa-xs">
                        <span class="text-lg font-medium text-italic text-uppercase text-gray-500">No SPK Added</span>
                      </q-card-section>

                      <q-card-section v-else class="q-pa-none">
                        <q-list>
                          <q-item
                            dense
                            v-for="(ok, okIndex) in item.ok_list"
                            :key="okIndex"
                            class="q-px-none q-py-xs border rounded q-ma-xs bg-blue-50"
                          >
                            <q-item-section
                              side
                              style="padding-left: 5px !important; padding-right: unset !important;"
                            >
                              <q-badge
                                dense
                                square
                                color="secondary"
                                text-color="white"
                                class="font-medium q-py-xs"
                                :label="okIndex + 1"
                              />
                            </q-item-section>
                            <q-item-section class="grid grid-cols-3 q-px-xs">
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
                                  'item_id': item.item_id,
                                  'or_detail_ids': null,
                                  'search': '',
                                  'search-keys': ''
                                }"
                                class="q-px-sm col-span-2"
                                label="Work Order (SPK)"
                                :load-until="!(!item.item_id)"
                                :force-reload="triggerReloadWO[index] || null"
                                :option-label="(option: WOItemModel) => `${option.work_order_number} (#${option.id})`"
                                :option-caption="(option: WOItemModel) => `Date: ${option.work_order_date} [${option.work_order_shift.toUpperCase()}]`"
                                :model-value="ok.work_order_item"
                                :disable="!item.item_id || !(!item.loading) || !(!item.is_submitted)"
                                :rules="[(val: WOItemModel) => !!val || 'Work Order (SPK) is required']"
                                @update:model-value="(e: WOItemModel) => handleSelectWOItem(index, e, okIndex)"
                              >
                                <template v-slot:option="scope">
                                  <q-item
                                    v-bind="scope.itemProps"
                                    dense
                                    clickable
                                    class="q-pa-sm border-b"
                                    @click="handleSelectWOItem(index, scope.opt, okIndex)"
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
                                        :label="`QTY: ${scope.opt.quantity}`"
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
                                label="Quantity"
                                v-model="ok.quantity"
                                :suffix="`/ ${(Number(ok.work_order_item?.quantity ?? 0) - Number(item.ng_list?.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id) && ok.work_order_item_id).reduce((acc, ng) => Number(acc) + Number(ng.quantity), 0)))}`"
                                :rules="[
                                  (val: string) => Number(val) >= 0 || 'Must be >= 0',
                                  (val: string) => Number(val) <= Number(ok.work_order_item?.quantity ?? 0) - Number(item.ng_list?.filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id)).reduce((acc, ng) => Number(acc) + Number(ng.quantity), 0)) || `Must be less than ${Number(ok.work_order_item?.quantity ?? 0) - Number(item.ng_list?.filter(ng => ng.work_order_item_id === ok.work_order_item_id).reduce((acc, ng) => Number(acc) + Number(ng.quantity), 0))}`
                                ]"
                                :disable="!(!item.loading) || !(!item.is_submitted)"
                                @update:model-value="updateOKQty(index)"
                                class="flex-grow"
                              />
                            </q-item-section>

                            <q-item-section
                              side
                              style="padding-left: unset !important; padding-right: 5px !important;"
                            >
                              <q-btn v-if="!item.is_submitted"
                                dense
                                flat
                                icon="close"
                                color="negative"
                                class="q-py-none mb-[2px]"
                                :disable="!(!item.loading)"
                                @click="handleRemoveOK(index, okIndex)"
                              />
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </q-card-section>
                    </q-card>
                  </div>

                  <div v-show="!item.is_collapsed" class="grid grid-cols-2 gap-2 q-px-sm q-mb-xs">
                    <div class="column flex-grow">
                      <q-item-label class="font-medium text-italic text-uppercase">
                        NG
                      </q-item-label>
                      <q-input
                        dense
                        outlined
                        hide-bottom-space
                        :bottom-slots="!(!item.scanned_ng)"
                        :rules="[(val: string) => Number(val) >= 0 || 'Must be greater than or equal to 0']"
                        v-model="item.ng"
                        disable
                      >
                        <template v-slot:hint>
                          <q-item-label v-if="item.scanned_ng" caption class="font-medium q-pl-xs pt-[1px]">
                            Scanned as {{ item.scanned_ng }}
                          </q-item-label>
                        </template>
                      </q-input>
                    </div>

                    <div class="column flex-grow">
                      <q-item-label class="font-medium text-italic text-uppercase">
                        Fault Type
                      </q-item-label>

                      <select-resource
                        dense
                        outlined
                        hide-bottom-space
                        :bg-color="item.type_fault ? '' : item.ng_list.length > 0 ? 'yellow-1' : ''"
                        search=""
                        api-url="api/v1/references/type-faults"
                        :api-params="{
                          'mode': 'all',
                          'limit': '*'
                        }"
                        option-label="name"
                        :disable="!(!item.loading) || !(!item.is_submitted)"
                        :model-value="item.type_fault"
                        :rules="[(val: FaultTypeModel) => item.ng_list.length === 0 || !!val || 'Fault Type is required']"
                        @update:model-value="(e: FaultTypeModel) => handleSelectFaultType(index, e)"
                      />
                    </div>
                  </div>

                  <div v-show="!item.is_collapsed" class="column no-wrap q-mb-xs q-px-sm">
                    <div class="row items-end justify-between">
                      <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
                        NG List
                      </q-item-label>
                      <q-btn v-if="!item.is_submitted"
                        dense
                        unelevated
                        size="12px"
                        icon="add"
                        label="NG"
                        color="primary"
                        class="q-pr-sm q-py-none mb-[2px]"
                        :disable="!(!item.loading)"
                        @click="handleAddNG(index)"
                      />
                    </div>

                    <q-card flat bordered>
                      <q-card-section v-if="!item.ng_list.length" class="flex items-center justify-center q-pa-xs">
                        <span class="text-lg font-medium text-italic text-uppercase text-gray-500">No NG</span>
                      </q-card-section>

                      <q-card-section v-else class="q-pa-none">
                        <q-list>
                          <q-item
                            dense
                            v-for="(ng, ngIndex) in item.ng_list"
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
                              <q-select
                                dense
                                outlined
                                stack-label
                                hide-bottom-space
                                label="Work Order (SPK)"
                                :disable="!(!item.loading) || !(!item.is_submitted)"
                                :bg-color="ng.work_order_item_id ? '' : 'yellow-1'"
                                :options="item.ok_list?.every(ok => !(!ok.work_order_item)) ? item.ok_list?.flatMap(ok => ok.work_order_item) : []"
                                :model-value="ng.work_order_item"
                                :rules="[(val: WOItemModel) => !!val || '']"
                                :option-label="(opt: WOItemModel) => `${opt.work_order_number} (#${opt.id})`"
                                @update:model-value="(e: WOItemModel) => handleSelectFaultWOItem(index, e, ngIndex)"
                              >
                                <template v-slot:option="scope">
                                  <q-item
                                    v-bind="scope.itemProps"
                                    dense
                                    clickable
                                    class="q-pa-sm border-b"
                                    @click="handleSelectFaultWOItem(index, scope.opt, ngIndex)"
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
                                        :label="`QTY: ${scope.opt.quantity}`"
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
                                      <q-item-label caption class="text-bold text-gray-500 text-center">
                                        Please add work order (SPK) to this item first
                                      </q-item-label>
                                    </q-item-section>
                                  </q-item>
                                </template>
                              </q-select>

                              <div class="grid grid-cols-3 gap-2">
                                <div class="column col-span-2">
                                  <select-resource
                                    :ref="(e) => setFaultRef((e as QSelect), index, ngIndex)"
                                    dense
                                    outlined
                                    hide-bottom-space
                                    label="Fault"
                                    :bg-color="ng.fault_id ? '' : 'yellow-1'"
                                    :bottom-slots="!(!ng.code)"
                                    search=""
                                    api-url="api/v1/references/faults"
                                    :api-params="{
                                      'mode': 'all',
                                      'limit': '*',
                                      'type_fault_id': item.type_fault_id
                                    }"
                                    :option-label="(opt: FaultModel) => `${Number((faultSelectRef[`${index}_${ngIndex}`] as { opts?: FaultModel[] })?.opts?.flatMap(opt => String(opt.id)).findIndex(id => id === String(opt.id))) + 1}. ${opt.name}`"
                                    :load-until="!(!item.type_fault_id)"
                                    :disable="!item.type_fault_id || !(!item.loading) || !(!item.is_submitted)"
                                    :model-value="ng.fault"
                                    :rules="[(val: FaultModel) => !!val || 'Fault is required']"
                                    @update:model-value="(e: FaultModel) => handleSelectFault(index, e, ngIndex)"
                                    @update:options="(options: FaultModel[]) => !(!item.type_fault_id) ? autoAssignFault(options, index, ngIndex) : undefined"
                                  >
                                    <template v-slot:option="scope">
                                      <q-item v-bind="scope.itemProps">
                                        <q-item-section>
                                          <div class="row items-center gap-2">
                                            <q-badge
                                              color="grey-7"
                                            >
                                              {{ scope.index + 1 }}
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

                                    <template v-slot:hint>
                                      <q-item-label v-if="ng.code" caption class="font-medium q-pl-xs pt-[1px]">
                                        Scanned as code {{ ng.code }}
                                      </q-item-label>
                                    </template>
                                  </select-resource>
                                </div>

                                <div class="column">
                                  <q-input
                                    dense
                                    outlined
                                    stack-label
                                    hide-bottom-space
                                    label="Quantity"
                                    v-model="ng.quantity"
                                    :disable="!(!item.loading) || !(!item.is_submitted)"
                                    :rules="[(val: string) => Number(val) > 0 || 'Must be greater than 0']"
                                    @update:model-value="updateNGQty(index)"
                                    class="flex-grow"
                                  >
                                    <template v-slot:hint>
                                      <q-item-label v-if="ng.scanned_quantity" caption class="font-medium q-pl-xs pt-[1px]">
                                        Scanned as {{ ng.scanned_quantity }}
                                      </q-item-label>
                                    </template>
                                  </q-input>
                                </div>
                              </div>
                            </q-item-section>

                            <q-item-section
                              side
                              style="padding-left: unset !important; padding-right: 5px !important;"
                            >
                              <q-btn v-if="!item.is_submitted"
                                dense
                                flat
                                icon="close"
                                color="negative"
                                class="q-py-none mb-[2px]"
                                :disable="!(!item.loading)"
                                @click="handleRemoveNG(index, ngIndex)"
                              />
                            </q-item-section>
                          </q-item>
                        </q-list>
                      </q-card-section>
                    </q-card>
                  </div>

                  <div v-show="!item.is_collapsed" class="column q-mb-xs q-px-sm">
                    <q-item-label class="font-medium text-italic text-uppercase q-px-sm">
                      Description
                    </q-item-label>

                    <q-input
                      dense
                      outlined
                      autogrow
                      v-model="item.description"
                      type="textarea"
                      :disable="!(!item.loading) || !(!item.is_submitted)"
                      class="flex-grow"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>
        </q-card-section>
      </q-card>
    </div> -->
  </q-form>
</template>

<script setup lang="ts">
// import { Notify, QForm, QSelect } from 'quasar';
// import { n8nApi } from 'src/boot/axios';
// import { levenshtein, sorensenDice } from 'src/composable/algorithms';
// import type { CapturedImageModel, CustomerModel, FaultModel, FaultTypeModel, OperatorModel, PartModel, ShiftModel, UnitModel, WOItemModel } from 'src/types/model';
// import { ref } from 'vue';
// import SelectResource from 'src/components/SelectResource.vue';

// const formRef = ref<QForm | null>(null);

// const faultSelectRef = ref<{ [key: string]: QSelect | null }>({});

// const triggerReloadWO = ref<{ [key: string]: boolean }>({});
// const triggerReloadItem = ref<{ [key: string]: boolean }>({});

// const props = defineProps<{
//   data: CapturedImageModel;
// }>();

// const setFaultRef = (ref: QSelect | null, itemIndex: number, ngIndex: number) => {
//   if (ref) {
//     faultSelectRef.value[`${itemIndex}_${ngIndex}`] = ref;
//   }
// }

// const handleRegenerateScanResult = async () => {
//   const data = props.data;

//   if (data) {
//     data.form = { line: '', date: '', items: [] };
//     data.scan_result = null;
//     data.on_process = true;
//     data.is_error = false;
//   }

//   await handleGenereteScanResult(data.base64);
// }

// const handleGenereteScanResult = async (photo: string) => {
//   const data = props.data;

//   try {
//     const response = await fetch(
//       String(photo)
//     );

//     const blob = await response.blob();

//     const formData = new FormData();

//     formData.append(
//       'file',
//       blob,
//       'photo.png'
//     );

//     const res = await n8nApi.post(
//       '/webhook/upload',
//       formData
//     );

//     let scanResult = {
//       operator_name: '',
//       date: '',
//       shift: '',
//       line: '',
//       items: []
//     };

//     if (res?.data?.[0] && !res?.data?.[0]?.error && !(!res.data[0].data)) {
//       if (typeof res.data[0].data === 'string') {
//         const parsed = JSON.parse(
//           res.data[0].data
//         );

//         scanResult = parsed[0];
//       } else {
//         scanResult = res.data[0].data[0];
//       }
//     } else if (res?.data?.[0]?.error) {
//       Notify.create({
//         message: `UNABLE TO PROCESS IMAGE`,
//         caption: res?.data?.[0]?.error,
//         type: 'negative',
//         position: 'top-right',
//         timeout: 5000
//       })
//     } else {
//       Notify.create({
//         message: 'Unable to process image',
//         caption: 'please try again or contact administrator',
//         type: 'negative',
//         position: 'top-right',
//         timeout: 5000
//       });
//     }

//     data.scan_result = scanResult;

//     handleFillStateWithScannedData();
//   } catch (err) {
//     console.error(err);

//     Notify.create({
//       message: 'Unable to process image',
//       caption: 'please try again or contact administrator',
//       type: 'negative',
//       position: 'top-right',
//       timeout: 5000
//     });

//     data.is_error = true;
//   } finally {
//     data.on_process = false;
//   }
// }

// const handleFillStateWithScannedData = () => {
//   const data = props.data;
//   if (!data) return;

//   const form = data.form;

//   const scannedData = data.scan_result;

//   form.date = String(scannedData?.date);
//   form.scanned_date = String(scannedData?.date);

//   form.scanned_shift = String(scannedData?.shift);
//   form.scanned_operator_name = String(scannedData?.operator_name);

//   form.items = [];

//   scannedData?.items.forEach((scannedItem) => {
//     const newItem = {
//       scanned_customer: scannedItem.customer,
//       customer: null,
//       customer_id: null,

//       scanned_part_name: scannedItem.part_name,
//       part: null,
//       item_id: null,

//       unit: null,
//       unit_id: null,

//       work_order_item: null,
//       work_order_item_id: null,

//       lot_number: '', // may not be used

//       worktime: '', // may not be used
//       begin_datetime: '', // may not be used
//       until_datetime: '', // may not be used

//       type_fault: null,
//       type_fault_id: null,

//       scanned_ok: scannedItem.ok,
//       ok: 0,

//       scanned_ng: scannedItem.ng,
//       ng: scannedItem.ng_list.reduce((a, b) => Number(a) + Number(b.quantity), 0),

//       ng_list: scannedItem.ng_list.map((ng) => {
//         return {
//           code: ng.code,
//           quantity: ng.quantity,
//           scanned_quantity: ng.quantity,
//         }
//       }),

//       is_ng_collapsed: true,
//       is_collapsed: false,
//       is_submitted: false,
//     }

//     form.items.push(newItem);
//   })
// }

// const autoAssignOperator = (options: OperatorModel[]) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   const match = findDataFromScan(
//     String(form.scanned_operator_name),
//     options as unknown as Record<string, unknown>[],
//     'name'
//   );

//   if (match) {
//     handleSelectOperator(match as unknown as OperatorModel);
//   }
// }

// const autoAssignShift = (options: ShiftModel[]) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   const match = findDataFromScan(
//     String(form.scanned_shift),
//     options as unknown as Record<string, unknown>[],
//     'name'
//   );

//   if (match) {
//     handleSelectShift(match as unknown as ShiftModel);
//   }
// }

// const autoAssignCustomer = (options: CustomerModel[], itemIndex: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]) {
//     const match = findDataFromScan(
//       String(form.items[itemIndex].scanned_customer),
//       options as unknown as Record<string, unknown>[],
//       'code'
//     );

//     if (match) {
//       handleSelectCustomer(itemIndex, match as unknown as CustomerModel);
//     }
//   }
// }

// const autoAssignItem = (options: PartModel[], itemIndex: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]) {
//     const match = findDataFromScan(
//       String(form.items[itemIndex].scanned_part_name),
//       options as unknown as Record<string, unknown>[],
//       'part_name'
//     );

//     if (match) {
//       handleSelectItem(itemIndex, match as unknown as PartModel);
//     }
//   }
// }

// const autoAssignUnit = (options: UnitModel[], itemIndex: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex] && options.length > 0) {
//     handleSelectUnit(itemIndex, (options[0] as UnitModel));
//   }
// }

// const autoAssignFault = (options: FaultModel[], itemIndex: number, ngIndex: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex] && options.length > 0) {
//     const ng = form.items[itemIndex].ng_list[ngIndex];
//     if (ng) {
//       const match = options.find((op, opIndex) => (Number(opIndex) + 1) === Number(ng.code));

//       if (match) {
//         handleSelectFault(itemIndex, match, ngIndex);
//       }
//     }
//   }
// }

// const handleSelectOperator = (operator: OperatorModel) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   form.operator_id = operator.id;
//   form.operator = operator;
// }

// const handleSelectShift = (shift: ShiftModel) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   form.shift_id = shift.id;
//   form.shift = shift;
// }

// const handleSelectCustomer = (itemIndex: number, customer: CustomerModel) => {
//   const data = props.data;

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

//     form.items[itemIndex].customer_id = customer.id;
//     form.items[itemIndex].customer = customer;
//   }
// }

// const handleSelectItem = (itemIndex: number, item: PartModel) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]) {
//     if (form.items[itemIndex].customer_id) {
//       form.items[itemIndex].unit_id = null;
//       form.items[itemIndex].unit = null;

//       // form.items[itemIndex].work_order_item_id = null;
//       // form.items[itemIndex].work_order_item = null;

//       form.items[itemIndex].ok_list = [];

//       form.items[itemIndex].ng_list.forEach((ng) => {
//         ng.work_order_item_id = null;
//         ng.work_order_item = null;
//       });

//       if (form.items[itemIndex].item_id) {
//         triggerReloadWO.value[itemIndex] = true;

//         setTimeout(() => {
//           delete triggerReloadWO.value[itemIndex];
//         }, 100);
//       }
//     }

//     form.items[itemIndex].item_id = item.id;
//     form.items[itemIndex].part = item;

//     autoAssignUnit(item.item_units, itemIndex);

//     handleAddOK(itemIndex);
//   }
// }

// const handleSelectUnit = (itemIndex: number, unit: PartModel['item_units'][number]) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]) {
//     form.items[itemIndex].unit_id = unit.unit.id;
//     form.items[itemIndex].unit = unit;
//   }
// }

// const handleSelectWOItem = (itemIndex: number, item: WOItemModel, okIndex: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]?.ok_list) {
//     const ok = form.items[itemIndex].ok_list[okIndex];

//     if (ok) {
//       const selectedWOIdSnapshot = JSON.parse(JSON.stringify(ok.work_order_item_id))

//       ok.work_order_item_id = item.id;
//       ok.work_order_item = item;

//       if (Number(item.quantity) >= Number(form.items[itemIndex].scanned_ok)) {
//         ok.quantity = Number(form.items[itemIndex].scanned_ok);

//         updateOKQty(itemIndex);
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

// const handleSelectFaultType = (itemIndex: number, fault_type: FaultTypeModel) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]) {
//     form.items[itemIndex].type_fault_id = fault_type.id;
//     form.items[itemIndex].type_fault = fault_type;
//   }
// }

// const handleSelectFault = (itemIndex: number, fault: FaultModel, ngIndex: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex] && form.items[itemIndex].ng_list[ngIndex]) {
//     form.items[itemIndex].ng_list[ngIndex].fault = fault;
//     form.items[itemIndex].ng_list[ngIndex].fault_id = fault.id;
//   }
// }

// const handleSelectFaultWOItem = (itemIndex: number, item: WOItemModel, ngIndex: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]?.ng_list) {
//     const ng = form.items[itemIndex].ng_list[ngIndex];
//     if (ng) {
//       ng.work_order_item_id = item.id;
//       ng.work_order_item = item;
//     }
//   }
// }

// const handleSetDate = (date: string) => {
//   const data = props.data;

//   if (!data) return;

//   data.form.date = date;
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

// const handleAddItem = () => {
//   const data = props.data;

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

//     is_ng_collapsed: true,
//     is_collapsed: false,
//     is_submitted: false,
//   }

//   form.items.push(newItem);
// }

// const handleAddOK = (itemIndex: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   const newOK = {
//     work_order_item_id: null,
//     work_order_item: null,
//     quantity: 0
//   }

//   if (form.items[itemIndex]) {
//     if (form.items[itemIndex].ok_list) form.items[itemIndex].ok_list.push(newOK);
//     else form.items[itemIndex].ok_list = [newOK];
//   }
// }

// const handleAddNG = (itemIndex: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   const newNG = {
//     code: '',
//     quantity: 0
//   }

//   if (form.items[itemIndex]) {
//     form.items[itemIndex].ng_list.push(newNG);
//   }
// }

// const handleRemoveItem = (index: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   form.items.splice(index, 1);
// }

// const handleRemoveOK = (itemIndex: number, okIndex: number) => {
//   const data = props.data;

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

// const handleRemoveNG = (itemIndex: number, ngIndex: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]) {
//     form.items[itemIndex].ng_list.splice(ngIndex, 1);
//   }
// }

// const updateOKQty = (itemIndex: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex] && form.items[itemIndex].ok_list) {
//     form.items[itemIndex].ok = form.items[itemIndex].ok_list.reduce((a, b) => Number(a) + Number(b.quantity), 0);
//   }
// }

// const updateNGQty = (itemIndex: number) => {
//   const data = props.data;

//   if (!data) return;

//   const form = data.form;

//   if (form.items[itemIndex]) {
//     form.items[itemIndex].ng = form.items[itemIndex].ng_list.reduce((a, b) => Number(a) + Number(b.quantity), 0);

//     formRef.value?.validate().catch(() => {});
//   }
// }

// const handleOpenReport = (id: string | number) => {
//   window.open(`${process.env.WEB_BASE_URL}/#/admin/factories/packings/${id}`, '_blank');
// }
</script>

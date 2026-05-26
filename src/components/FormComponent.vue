<template>
  <div class="row items-start no-wrap gap-1">
    <div class="column flex-grow">
      <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
        Shift
      </q-item-label>
      <select-resource
        dense
        outlined
        use-refresh
        :xbottom-slots="!(!props.data.form.scanned_shift)"
        bottom-slots
        search=""
        api-url="/api/v1/references/shifts"
        :api-params="{
          'mode': 'all',
          'limit': '*',
        }"
        option-label="name"
        class="wrap-select-input"
        :load-until="!(!props.data.scan_result) && !props.data.on_process"
        :disable="!(!props.data.on_process) || props.data.form.items.some(i => i.is_submitted)"
        :model-value="props.data.form.shift"
        @update:model-value="(e: ShiftModel) => handleSelectShift(e)"
        @update:options="(e: ShiftModel[]) => autoAssignShift(e)"
      >
        <template v-slot:hint>
          <q-item-label v-if="props.data.form?.scanned_shift" caption class="font-medium q-pl-xs pt-[1px]">
            Scanned as {{ props.data.form?.scanned_shift }}
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
        :xbottom-slots="!(!props.data.form.scanned_operator_name)"
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
        :load-until="!(!props.data.scan_result) && !props.data.on_process"
        :disable="!(!props.data.on_process) || props.data.form.items.some(i => i.is_submitted)"
        :model-value="props.data.form.operator"
        @update:model-value="(e: OperatorModel) => handleSelectOperator(e)"
        @update:options="(e: OperatorModel[]) => autoAssignOperator(e)"
      >
        <template v-slot:hint>
          <q-item-label v-if="props.data.form?.scanned_operator_name" caption class="font-medium q-pl-xs pt-[1px]">
            Scanned as {{ props.data.form?.scanned_operator_name }}
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
        :xbottom-slots="!(!props.data.form.scanned_date)"
        type="date"
        :disable="!(!props.data.on_process) || props.data.form.items.some(i => i.is_submitted)"
        :model-value="props.data.form.date"
        @update:model-value="handleSetDate(String($event))"
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
        :disable="!(!props.data.on_process) || props.data.form.items.some(i => i.is_submitted)"
        :model-value="props.data.form.worktime"
        @update:model-value="handleSelectWorktime($event)"
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
        :bg-color="props.data.form.type_fault ? '' : 'yellow-1'"
        search=""
        api-url="api/v1/references/type-faults"
        :api-params="{
          'mode': 'all',
          'limit': '*'
        }"
        option-label="name"
        :load-until="!(!props.data.scan_result) && !props.data.on_process"
        :disable="!(!props.data.on_process) || props.data.form.items.some(i => i.is_submitted)"
        :model-value="props.data.form.type_fault"
        :rules="[(val: FaultTypeModel) => !!val || 'Fault Type is required']"
        @update:model-value="(e: FaultTypeModel) => handleSelectFaultType(e)"
        @update:options="(options: FaultTypeModel[]) => autoAssignFaultType(options)"
      />
    </div>
  </div>

  <div class="column">
    <div class="row items-end justify-between">
      <q-item-label class="font-medium text-italic text-uppercase q-pl-xs">
        Items {{ props.data.form.items.length ? `- ${props.data.form.items.length} Item${props.data.form.items.length > 1 ? 's' : ''} scanned` : '' }}
      </q-item-label>
      <q-btn v-if="!props.data.form.items.some(i => i.is_submitted) && !props.data.on_process"
        dense
        unelevated
        size="12px"
        icon="add"
        label="Item"
        color="primary"
        class="q-pr-sm q-py-none mb-[2px]"
        :disable="!(!props.data.on_process)"
        @click="handleAddItem"
      />
    </div>
    <q-card flat bordered>
      <q-card-section v-if="!props.data.form.items.length" class="flex items-center justify-center q-pa-xs">
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
                v-for="(sItem, sIndex) in getSplittedItems(props.data.form.items)[sideIndex]"
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
                              @click="handleRemoveItem(sItem.originalIndex)"
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
                      @update:model-value="(e: CustomerModel) => handleSelectCustomer(sItem.originalIndex, e)"
                      @update:options="(option: CustomerModel[]) => !(!sItem.item.scanned_customer) && !sItem.item.customer_id ? autoAssignCustomer(option, sItem.originalIndex) : undefined"
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
                        @update:model-value="(e: PartModel) => handleSelectItem(sItem.originalIndex, e)"
                        @update:options="(e: PartModel[]) => autoAssignItem(e, sItem.originalIndex)"
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
                        @update:model-value="(e: PartModel['item_units'][number]) => handleSelectUnit(sItem.originalIndex, e)"
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
                        @click="handleAddOK(sItem.originalIndex)"
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
                                  @update:model-value="(e: WOItemModel) => handleSelectWOItem(sItem.originalIndex, e, okIndex)"
                                  @update:options="(options: WOItemModel[]) => !sItem.item.ok_list?.[okIndex]?.work_order_item_id ? autoAssignWOItem(options, sItem.originalIndex) : undefined"
                                >
                                  <template v-slot:option="scope">
                                    <q-item
                                      v-bind="scope.itemProps"
                                      dense
                                      clickable
                                      class="q-pa-sm border-b"
                                      @click="handleSelectWOItem(sItem.originalIndex, scope.opt, okIndex)"
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
                                  @update:model-value="ok.quantity = Number(String($event).replaceAll(',', '')); updateOKQty(sItem.originalIndex)"
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
                                                  :ref="(e) => setFaultRef((e as QSelect))"
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
                                                    'type_fault_id': props.data.form.type_fault_id
                                                  }"
                                                  :option-label="(opt: FaultModel) => `(#${Number((faultSelectRef[0] as { selectResource?: QSelect }).selectResource?.options?.flatMap(opt => String(opt.id)).findIndex(id => id === String(opt.id))) + 1}) ${opt.name}`"
                                                  :option-disable="(opt: FaultModel) =>
                                                    sItem.item.ng_list
                                                    .filter(ng => String(ng.work_order_item_id) === String(ok.work_order_item_id))
                                                    .some((itemNG, itemNGIndex) =>
                                                      itemNGIndex !== ngIndex &&
                                                      String(itemNG.fault_id) === String(opt.id)
                                                    )
                                                  "
                                                  :load-until="!(!props.data.form.type_fault_id)"
                                                  :force-reload="triggerReloadFaults[0] || null"
                                                  :disable="!props.data.form.type_fault_id || !(!sItem.item.loading) || !(!sItem.item.is_submitted)"
                                                  :model-value="ng.fault"
                                                  :rules="[(val: FaultModel) => !!val || 'Fault is required']"
                                                  @update:model-value="(e: FaultModel) => handleSelectFault(sItem.originalIndex, e, okIndex, ngIndex)"
                                                  @update:options="(options: FaultModel[]) => !(!props.data.form.type_fault_id) ? autoAssignFault(options, sItem.originalIndex, okIndex, ngIndex) : undefined"
                                                >
                                                  <template v-slot:option="scope">
                                                    <q-item v-bind="scope.itemProps">
                                                      <q-item-section>
                                                        <div class="row items-center gap-2">
                                                          <q-badge
                                                            color="grey-7"
                                                          >
                                                            {{ Number((faultSelectRef[0] as { selectResource?: QSelect }).selectResource?.options?.flatMap(opt => String(opt.id)).findIndex(id => id === String(scope.opt.id))) + 1 }}
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
                                                  @update:model-value="ng.quantity = Number(String($event).replaceAll(',', '')); updateNGQty(sItem.originalIndex)"
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
                                              @click="handleRemoveNG(sItem.originalIndex, String(ng.fault_id), okIndex)"
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
                                            @click.stop="handleAddNG(sItem.originalIndex, okIndex); ok.is_ng_collapsed = false"
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
                                        @click="handleRemoveOK(sItem.originalIndex, okIndex)"
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
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QSelect } from 'quasar';
import { levenshtein, sorensenDice } from 'src/composable/algorithms';
import type { CapturedImageModel, CustomerModel, FaultModel, FaultTypeModel, FormItemModel, OperatorModel, PartModel, ShiftModel, UnitModel, WOItemModel } from 'src/types/model';
import SelectResource from './SelectResource.vue';

const props = defineProps<{
  data: CapturedImageModel
}>();

const triggerReloadWO = ref<{ [key: string]: boolean }>({});
const triggerReloadItem = ref<{ [key: string]: boolean }>({});
const triggerReloadFaults = ref<{ [key: string]: boolean }>({});

const faultSelectRef = ref<{ [key: string]: QSelect | null }>({});

const handleSelectWorktime = (worktime: 'REGULER' | 'OVERTIME') => {
  const data = props.data;

  if (!data) return;

  data.form.worktime = worktime;
}

const handleSetDate = (date: string) => {
  const data = props.data;

  if (!data) return;

  data.form.date = date;
}

const setFaultRef = (ref: QSelect | null) => {
  if (ref) {
    faultSelectRef.value[0] = ref;
  }
}

const getSplittedItems = (items: FormItemModel[]) => {
  const middle = Math.ceil(items.length / 2)

  return [
    items.slice(0, middle).map((item, index) => ({
      item,
      originalIndex: index
    })),

    items.slice(middle).map((item, index) => ({
      item,
      originalIndex: middle + index
    }))
  ]
}

const onlyNumber = (e: KeyboardEvent) => {
  const input = e.target as HTMLInputElement;
  const key = e.key;

  if (
    key === 'Backspace' ||
    key === 'Delete' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'Tab'
  ) {
    return;
  }

  if (/^\d$/.test(key)) {
    return;
  }

  if (key === '.' && !input.value.includes('.') && input.value.length > 0) {
    return;
  }

  e.preventDefault();
};

const handleSelectShift = (shift: ShiftModel | null) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  form.shift = shift;
  form.shift_id = shift ? shift.id : null;
}

const handleSelectOperator = (operator: OperatorModel | null) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  form.operator = operator;
  form.operator_id = operator ? operator.id : null;
}

const handleSelectCustomer = (itemIndex: number, customer: CustomerModel | null) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  if (form.items[itemIndex]) {
    //handling on changed customer (not first time select)
    if (form.items[itemIndex].customer_id) {
      //remove selected part
      form.items[itemIndex].item_id = null;
      form.items[itemIndex].part = null;

      //remove selected unit
      form.items[itemIndex].unit_id = null;
      form.items[itemIndex].unit = null;

      //remove selected work order
      // form.items[itemIndex].work_order_item_id = null;
      // form.items[itemIndex].work_order_item = null;
      form.items[itemIndex].ok_list = [];

      //reset wo on ng_list
      form.items[itemIndex].ng_list.forEach((ng) => {
        ng.work_order_item_id = null;
        ng.work_order_item = null;
      })

      triggerReloadItem.value[itemIndex] = true;

      setTimeout(() => {
        delete triggerReloadItem.value[itemIndex];
      }, 100);
    }

    form.items[itemIndex].customer = customer;
    form.items[itemIndex].customer_id = customer ? customer.id : null;
  }
}

const handleSelectItem = (itemIndex: number, item: PartModel | null) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  if (form.items[itemIndex]) {
    if (form.items[itemIndex].customer_id) {
      form.items[itemIndex].unit_id = null;
      form.items[itemIndex].unit = null;

      form.items[itemIndex].ok_list = [];

      if (form.items[itemIndex].item_id) {
        form.items[itemIndex].ng_list = [];
        updateNGQty(itemIndex);
      }

      if (form.items[itemIndex].item_id) {
        triggerReloadWO.value[itemIndex] = true;

        setTimeout(() => {
          delete triggerReloadWO.value[itemIndex];
        }, 100);
      }
    }

    form.items[itemIndex].part = item;
    form.items[itemIndex].item_id = item ? item.id : null;

    autoAssignUnit((item ? item.item_units : []), itemIndex);

    handleAddOK(itemIndex);
  }
}

const handleSelectWOItem = (itemIndex: number, item: WOItemModel, okIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  if (form.items[itemIndex]?.ok_list) {
    // form.items[itemIndex].work_order_item_id = item.id;
    // form.items[itemIndex].work_order_item = item;

    const ok = form.items[itemIndex].ok_list[okIndex];

    if (ok) {
      const selectedWOIdSnapshot = JSON.parse(JSON.stringify(ok.work_order_item_id))

      ok.work_order_item_id = item.id;
      ok.work_order_item = item;

      if (Number(item.quantity) >= Number(form.items[itemIndex].scanned_ok)) {
        ok.quantity = Number(form.items[itemIndex].scanned_ok);

        updateOKQty(itemIndex);
      }

      if (selectedWOIdSnapshot) {
        form.items[itemIndex].ng_list
          .filter(ng => String(ng.work_order_item_id) === String(selectedWOIdSnapshot))
          .forEach(ng => {
            ng.work_order_item = ok.work_order_item as WOItemModel;
            ng.work_order_item_id = ok.work_order_item_id as string;
          })
      }
    }

  }
}

const handleSelectUnit = (itemIndex: number, unit: PartModel['item_units'][number] | null) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  if (form.items[itemIndex]) {
    form.items[itemIndex].unit = unit;
    form.items[itemIndex].unit_id = unit ? unit.unit.id : null;
  }
}

const handleSelectFaultType = (fault_type: FaultTypeModel) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  if (form) {
    if (form.type_fault_id) {
      triggerReloadFaults.value[0] = true;

      setTimeout(() => {
        delete triggerReloadFaults.value[0];
      }, 100);
    }

    form.type_fault = fault_type;
    form.type_fault_id = fault_type.id;
  }
}

const handleSelectFault = (itemIndex: number, fault: FaultModel | null, okIndex: number, ngIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;
  const item = form.items[itemIndex];
  const ok = item?.ok_list?.[okIndex];

  if (item && ok) {
    const ng = item.ng_list.filter(ng =>
      String(ng.work_order_item_id) === String(ok.work_order_item_id)
    )?.[ngIndex];

    if (!ng) return;

    const options = (faultSelectRef.value[0] as { opts?: FaultModel[] }).opts;
    const selectedIndex = options && fault
      ? options.findIndex((opt) => String(opt.id) === String(fault.id))
      : null;

    const indexToCode = selectedIndex !== null ? Number(selectedIndex) + 1 : null;

    if (indexToCode) ng.code = indexToCode;

    ng.fault = fault;
    ng.fault_id = fault ? fault.id : null;
  }
}

const handleAddItem = () => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  const newItem = {
    customer: null,
    customer_id: null,
    part: null,
    item_id: null,
    unit_id: null,
    work_order_item: null,
    work_order_item_id: null,
    lot_number: '',
    worktime: '',
    begin_datetime: '',
    until_datetime: '',
    type_fault_id: null,
    ok: 0,
    ng: 0,
    ng_list: [],

    is_markup_ng_collapsed: true,
    is_collapsed: false,
    is_submitted: false,
  }

  form.items.push(newItem);
}

const handleAddOK = (itemIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  const newOK = {
    work_order_item_id: null,
    work_order_item: null,
    quantity: 0,

    is_ng_collapsed: true,
  }

  if (form.items[itemIndex]) {
    if (form.items[itemIndex].ok_list) form.items[itemIndex].ok_list.push(newOK);
    else form.items[itemIndex].ok_list = [newOK];
  }
}

const handleAddNG = (itemIndex: number, okIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;
  const item = form.items[itemIndex];

  if (item) {
    const ok = item.ok_list?.[okIndex];

    if (!ok) return;

    const newNG = {
      code: '',
      quantity: 0,
      work_order_item: ok.work_order_item as WOItemModel,
      work_order_item_id: ok.work_order_item_id as string,
    }

    item.ng_list.push(newNG);
  }
}

const handleRemoveItem = (index: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  form.items.splice(index, 1);
}

const handleRemoveOK = (itemIndex: number, okIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  if (form.items[itemIndex] && form.items[itemIndex].ok_list) {
    const WOIdSnapshot = JSON.parse(JSON.stringify(form.items[itemIndex].ok_list[okIndex]?.work_order_item_id));

    form.items[itemIndex].ok_list.splice(okIndex, 1);

    if (WOIdSnapshot) {
      form.items[itemIndex].ng_list
        .filter(ng => String(ng.work_order_item_id) === String(WOIdSnapshot))
        .forEach(ng => {
          ng.work_order_item = null;
          ng.work_order_item_id = null;
        })
    }
  }
}

const handleRemoveNG = (itemIndex: number, fault_id: string | number, okIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;
  const item = form.items[itemIndex];
  const ok = item?.ok_list?.[okIndex];

  if (item && ok) {
    const ngIndexToRemove = item.ng_list.findIndex(ng =>
      String(ng.fault_id) === String(fault_id)
      && String(ng.work_order_item_id) === String(ok.work_order_item_id)
    );

    item.ng_list.splice(ngIndexToRemove, 1);

    updateNGQty(itemIndex);
  }
}

const updateOKQty = (itemIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  if (form.items[itemIndex] && form.items[itemIndex].ok_list) {
    form.items[itemIndex].ok = form.items[itemIndex].ok_list.reduce((a, b) => Number(a) + Number(b.quantity), 0);
  }
}

const updateNGQty = (itemIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  if (form.items[itemIndex]) {
    form.items[itemIndex].ng = form.items[itemIndex].ng_list.reduce((a, b) => Number(a) + Number(b.quantity), 0);
  }
}

const findBestMatch = <T extends Record<string, unknown>> (
  scannedText: string,
  data: T[],
  key: keyof T
): T | null => {
  if (!scannedText) return null;

  const text = scannedText.toLowerCase().trim();

  let best: T | null = null;
  let bestDistance = Infinity;
  let bestScore = 0;

  //levenshtein dist
  data.forEach((item) => {
    const rawValue = item[key];

    if (typeof rawValue !== 'string') return;

    const value = rawValue.toLowerCase().trim();

    const distance = levenshtein(text, value);

    if (distance < bestDistance) {
      bestDistance = distance;
      best = item;
    }
  });

  if (bestDistance <= Math.max(2, text.length * 0.3)) {
    return best;
  }

  //sorensen dice
  for (const item of data) {
    const raw = item[key];

    if (typeof raw !== 'string') continue;

    const score = sorensenDice(scannedText, raw);

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (bestScore >= 0.6) {
    return best;
  }

  return null;
}

const findDataFromScan = (scannedData: string, data: Record<string, unknown>[], key: string) => {
  if (!scannedData) return null;

  const trimmedScannedData = scannedData.toLocaleLowerCase().trim();

  let found = data?.find(op => String(op[key]).toLocaleLowerCase().trim() === trimmedScannedData);
  if (found) return found;

  found = data?.find(op => String(op[key]).toLocaleLowerCase().includes(trimmedScannedData) || trimmedScannedData.includes(String(op[key]).toLocaleLowerCase()));
  if (found) return found;

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g,"");

  found = data?.find(o => norm(String(o[key])) === norm(trimmedScannedData));
  if (found) return found;

  return findBestMatch(scannedData, data, key);
}

const autoAssignOperator = (options: OperatorModel[]) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  const match = findDataFromScan(
    String(form.scanned_operator_name),
    options as unknown as Record<string, unknown>[],
    'name'
  );

  if (match) {
    handleSelectOperator(match as unknown as OperatorModel);
  } else {
    handleSelectOperator(null);
  }
}

const autoAssignShift = (options: ShiftModel[]) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  const match = findDataFromScan(
    String(form.scanned_shift),
    options as unknown as Record<string, unknown>[],
    'name'
  );

  if (match) {
    handleSelectShift(match as unknown as ShiftModel);
  } else {
    handleSelectShift(null);
  }
}

const autoAssignFaultType = (options: FaultTypeModel[]) => {

  const match = options[0];

  handleSelectFaultType(match as FaultTypeModel)
}

const autoAssignCustomer = (options: CustomerModel[], itemIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  if (form.items[itemIndex]) {
    const match = findDataFromScan(
      String(form.items[itemIndex].scanned_customer),
      options as unknown as Record<string, unknown>[],
      'code'
    );

    if (match) {
      handleSelectCustomer(itemIndex, match as unknown as CustomerModel);
    } else {
      handleSelectCustomer(itemIndex, null);
    }
  }
}

const autoAssignItem = (options: PartModel[], itemIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  if (form.items[itemIndex]) {
    const match = findDataFromScan(
      String(form.items[itemIndex].scanned_part_name),
      options as unknown as Record<string, unknown>[],
      'part_name'
    );

    if (match) {
      handleSelectItem(itemIndex, match as unknown as PartModel);
    } else {
      handleSelectItem(itemIndex, null);
    }
  }
}

const autoAssignUnit = (options: UnitModel[], itemIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  if (form.items[itemIndex] && options.length > 0) {
    handleSelectUnit(itemIndex, (options[0] as UnitModel));
  } else {
    handleSelectUnit(itemIndex, null);
  }
}

const autoAssignFault = (options: FaultModel[], itemIndex: number, okIndex: number, ngIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;
  const item = form.items[itemIndex];
  const ok = item?.ok_list?.[okIndex];

  if (item && ok) {
    const ng = item.ng_list.filter(ng =>
      String(ng.work_order_item_id) === String(ok.work_order_item_id)
    )?.[ngIndex];

    if (!ng) return;

    const match = options.find((op, opIndex) => (Number(opIndex) + 1) === Number(ng.code));

    if (match) {
      handleSelectFault(itemIndex, match, okIndex, ngIndex);
    } else {
      handleSelectFault(itemIndex, null, okIndex, ngIndex);
    }
  }
}

const autoAssignWOItem = (options: WOItemModel[], itemIndex: number) => {
  const data = props.data;

  if (!data) return;

  const form = data.form;

  if (
    Number(form.items[itemIndex]?.ok_list?.length) > 1
    || !(!form.items[itemIndex]?.ok_list?.[0]?.work_order_item_id)
  ) return;

  if (form.items[itemIndex] && options.length > 0) {
    const ok = form.items[itemIndex].scanned_ok;
    const ng = form.items[itemIndex].scanned_ng;

    const totalQty = Number(ok) + Number(ng);

    const assignedWOItems: WOItemModel[] = [];

    options.forEach((woItem) => {
      if (assignedWOItems.reduce((a, b) => Number(a) + Number(b.quantity), 0) >= totalQty) return;

      assignedWOItems.push(woItem);
    });

    let settedQty = 0;

    const mappedOKList = assignedWOItems.map(woItem => {
      // const qty = Number(woItem.quantity) <= (Number(ok) - settedQty)
      //     ? Number(woItem.quantity)
      //     : Math.max(0, Number(ok) - settedQty);

      const qty = availableSPKQuantity(woItem) <= (Number(ok) - settedQty)
          ? availableSPKQuantity(woItem)
          : Math.max(0, Number(ok) - settedQty);

      settedQty += qty;

      return {
        work_order_item: woItem,
        work_order_item_id: woItem.id,
        quantity: qty,
        is_ng_collapsed: true,
      }
    });

    // form.items[itemIndex].ok_list = mappedOKList;
    form.items[itemIndex].ok_list?.splice(
      0,
      form.items[itemIndex].ok_list?.length,
      ...mappedOKList
    );

    // form.items[itemIndex].ok_list?.push(...mappedOKList);

    updateOKQty(itemIndex);

    handleAssignFaultyWOItem(itemIndex);
  }
}

const handleAssignFaultyWOItem = (itemIndex: number) => {
  const data = props.data;

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

  updateNGQty(itemIndex);
};

const availableSPKQuantity = (spk: WOItemModel | undefined | null) => {
  if (spk) return Number(spk.quantity) - (Number(spk.amount_packing) + Number(spk.amount_faulty));
  else return 0;
}

const handleOpenReport = (id: string | number) => {
  window.open(`${process.env.WEB_BASE_URL}/#/admin/factories/packings/${id}`, '_blank');
}
</script>

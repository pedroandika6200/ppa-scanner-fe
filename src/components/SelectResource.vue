<template>
  <q-select
    ref="selectResource"
    v-bind="attributes"
    :loading="loading"
    :model-value="$attrs.modelValue"
    :options="filteredOpts"
    @filter="onSearch"
    @input-value="onInputValue"
    @popup-show="selectClicked"
    @virtual-scroll="handleLoadNextPage"
    :virtual-scroll-slice-size="40"
    :virtual-scroll-item-size="48"
    popup-content-class="select-resource-option-menu"
  >
    <template v-for="name in Object.keys($slots)" v-slot:[getSlotIndex(name)]="scope">
      <slot :name="name" v-bind="scope ?? {}"></slot>
    </template>

    <template
      v-slot:option="scope"
      v-if="!Object.keys($slots).some((name) => name === 'option')"
    >
      <q-item v-bind="scope.itemProps"
        xv-show="(typeof $props.hideOption === 'function' ? !$props.hideOption(scope.opt) : true)"
        :disable="(typeof $props.disableOption === 'function' ? $props.disableOption(scope.opt) : $props.disableOption)"
      >
        <q-item-section avatar v-if="scope.opt.icon">
          <q-icon :name="scope.opt.icon" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ getLabel(scope) }}</q-item-label>
          <q-item-label
            caption
            v-if="Boolean(optionCaption)"
            class="ellipsis-3-lines"
          >
            {{
              typeof $props.optionCaption === 'function'
                ? $props.optionCaption(scope.opt)
                : scope.opt[String($props.optionCaption)] || ''
            }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template
      v-slot:no-option="scope"
      v-if="!Object.keys($slots).some((name) => name === 'option')"
    >
      <q-item v-if="useAdd" clickable @click="onCreate()">
        <q-item-section>
          <div class="row justify-center">
            <q-item-label class="text-primary text-center q-pt-xs q-ml-sm">
              <span class="text-weight-medium">ADD </span> "{{
                scope.inputValue
              }}"
            </q-item-label>
            <q-icon
              class="q-pl-sm"
              name="add_circle_outline"
              color="primary"
              size="sm"
            />
          </div>
        </q-item-section>
      </q-item>

      <q-item v-if="!useAdd && !opts.length && !loading">
        <q-item-section>
          <q-item-label class="text-bold text-gray-500 text-center">
            No available options
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template
      v-slot:append
      v-if="useRefresh && !Object.keys($slots).some((name) => name === 'append') && !loading"
    >
      <q-btn flat unelevated color="secondary" dense icon="refresh" @click.stop="handleRefresh" />
    </template>

    <template
      v-slot:after-options
    >
      <div v-if="loading">
        <q-spinner-dots
          size="sm"
          color="primary"
          class="sticky left-1/2 transform -translate-x-1/2"
        />
      </div>
    </template>
  </q-select>
</template>

<script lang="ts">
import type { QSelectSlots, QSelect } from 'quasar';
import { useSelect } from 'src/composable/select';
import { defineComponent, computed, ref, onMounted, nextTick, watch } from 'vue';

export default defineComponent({
  name: 'SelectResource',
  props: {
    search: [Boolean, String],
    useAdd: Boolean,
    apiParams: Object,
    apiUrl: {
      type: [String],
      required: true,
    },
    optionCaption: {
      type: [String, Function],
    },
    disableOption: {
      type: [Boolean, Function],
    },
    hideOption: {
      type: [Function],
    },
    multiple: Boolean,
    useRefresh: Boolean,
    loadUntil: {
      type: [Boolean, null],
      default: null,
      required: false
    },
    forceReload: {
      type: [Boolean, null],
      default: null,
      required: false
    },
  },
  setup(props, vm) {
    const selectResource = ref<QSelect>();

    const {
      refresh,
      onFetch,
      onApiFilter,
      onFilter,
      opts,
      select,
      loading
    } = useSelect(() => ({
      props,
    }));
    const forms = ref(false);
    const inputValue = ref(null);
    const filterInput = ref<string | null>(null);
    const hasLoaded = ref(false);
    const page = ref(1);

    const filteredOpts = computed(() => {
      if (props.hideOption && typeof props.hideOption === 'function') {
        return opts.value.filter((opt) => !props.hideOption!(opt));
      }
      return opts.value;
    })

    const selectClicked = () => {
      // console.log('Select Clicked', hasLoaded.value)
      if (hasLoaded.value === false && loading.value) {
        selectResource.value?.filter('');
      }
    };

    onMounted(() => {
      if (props.search !== 'api') {
        if (props.apiUrl === '' || props.loadUntil !== null) {
          hasLoaded.value = true
        } else {
          hasLoaded.value = true
          onFetch().catch(() => {}).finally(() => {
            vm.emit('update:options', opts.value);
          });
        }
      }
    });

    watch(() => props.loadUntil, (load) => {
      if (load) {
        onFetch().catch(() => {}).finally(() => {
          vm.emit('update:options', opts.value);
        });
      }
    }, { immediate: true });

    watch(() => props.forceReload, (load) => {
      if (load) {
        opts.value = [];
        page.value = 1;

        onFetch().catch(() => {}).finally(() => {
          vm.emit('update:options', opts.value);
        });

      }
    }, { immediate: true });

    const attributes = computed(() => ({
      useInput: Boolean(props.search),
      fillInput: Boolean(props.search),
      hideSelected: Boolean(props.search) && !props.multiple,
      multiple: props.multiple,
      inputDebounce: 800,
      ...vm.attrs,
      disable: Boolean(selectResource.value?.loading || vm.attrs.disable)
    }));

    const onFIlterLoaded = async (str: string, cb: CallableFunction) => {
      if (hasLoaded.value === true) onFilter(str, cb);
      else if (hasLoaded.value === false && !loading.value) {
        hasLoaded.value = true;
        page.value = 1;
        await onFetch(str).finally(() => onFilter(str, cb));
      }
    };

    const handleRefresh = async () => {
      page.value = 1;
      await refresh();
    }

    const handleLoadNextPage = async (val: { index: number, from: number, to: number, direction: string }) => {
      if (
        !loading.value && val.direction === 'increase' && val.index === val.to
        // && Number(opts.value.length) >= Number(props.apiParams?.limit || 10)
      ) {
        if (props.search === 'api') {
          await onFetch('', page.value + 1);
          page.value += 1;
        }
      }
    }

    const autoLoadIfOptionShort = async () => {
      await nextTick();

      const selectOptionBody = document.querySelector('.select-resource-option-menu');

      if (!selectOptionBody) return;

      if (
        selectOptionBody.scrollHeight <= selectOptionBody.clientHeight &&
        !loading.value
      ) {
        if (props.search === 'api') {
          await onFetch('', page.value + 1);
          page.value += 1;
        }
      }
    }

    const handleAPIFilter = async (input: string, doneFn: CallableFunction) => {
      await onApiFilter(input, doneFn).then(async () => {
        if (Number(opts.value.length) === Number(props.apiParams?.limit || 10)) await autoLoadIfOptionShort();
      });
    }

    return {
      onInputValue: (v: string) => (filterInput.value = v),
      onSearch:
        props.search === 'api'
          ? handleAPIFilter
          : props.search
          ? onFIlterLoaded
          : undefined,
      onCreate: () => {
        forms.value = true;
      },
      onAdded: (v: unknown) => {
        forms.value = false;
        vm.emit('update:model-value', v);
        select.value?.toggleOption(v);
      },
      getLabel: (scope: unknown) => (scope as { label: string }).label,
      getSlotIndex: (index: unknown) => index as keyof QSelectSlots,
      selectClicked,
      handleRefresh,
      handleLoadNextPage,
      attributes,
      select,
      opts,
      filteredOpts,
      loading,
      forms,
      inputValue,
      filterInput,
      selectResource
    };
  },
});
</script>

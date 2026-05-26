// /* eslint-disable @typescript-eslint/no-explicit-any */

// import {
//   ref,
//   shallowRef,
//   watch,
//   onUnmounted,
// } from 'vue';
// import type { QSelect } from 'quasar';
// import { api as $api } from 'src/boot/axios';
// import type { SelectProps } from 'src/types/resource';
// import type {
//   AxiosError,
//   AxiosRequestConfig,
//   AxiosResponse,
// } from 'axios';

// import {
//   getCacheKey,
//   getOrCreateCache,
//   removeCache,
// } from './select-cache';

// export function useSelect<R = any>(
//   property: { (): SelectProps }
// ) {
//   const select = ref<QSelect>();

//   const { props } = property();

//   const cacheKey = getCacheKey(
//     String(props.apiUrl),
//     {
//       ...(props.apiParams || {}),
//       searchMode: props.search,
//     }
//   );

//   const cache = getOrCreateCache<R>(cacheKey);

//   cache.subscribers++;

//   const options = cache.options;

//   const opts = shallowRef<R[]>([]);

//   const loading = cache.loading;

//   onUnmounted(() => {
//     cache.subscribers--;

//     if (cache.subscribers <= 0) {
//       removeCache(cacheKey);
//     }
//   });

//   const cancelPreviousRequest = () => {
//     if (cache.abortController) {
//       cache.abortController.abort();
//     }

//     cache.abortController = new AbortController();
//   };

//   const onFetch = (
//     input = '',
//     page = 1,
//     forceReload = false
//   ) => {
//     const { props } = property();

//     // gunakan cache existing
//     if (
//       !forceReload &&
//       page === 1 &&
//       options.value.length > 0
//     ) {
//       opts.value = [...options.value];

//       return Promise.resolve();
//     }

//     // request sedang berjalan
//     if (
//       !forceReload &&
//       loading.value &&
//       cache.promise
//     ) {
//       return cache.promise.then(() => {
//         opts.value = [...options.value];
//       });
//     }

//     loading.value = true;

//     cancelPreviousRequest();

//     const request: AxiosRequestConfig = {
//       url: String(props.apiUrl),
//       method: 'GET',
//       params: {
//         page,
//         ...(props.search && props.search === 'api'
//           ? {}
//           : {
//               'with-limitation': true,
//               limit: '*',
//             }),
//         ...(props.apiParams || {}),
//         ...(props.search === 'api'
//           ? { search: input }
//           : {}),
//       },
//     };

//     if (cache.abortController) {
//       request.signal = cache.abortController.signal;
//     }

//     cache.promise = $api
//       .request<AxiosResponse<R[]>>(request)
//       .then((response) => {
//         console.log(
//           '[APP] SELECT LOAD',
//           request.url,
//           response
//         );

//         const newOpts: R[] = response.data.data || response.data || [];

//         if (page !== 1) {
//           opts.value = [
//             ...opts.value,
//             ...newOpts,
//           ];

//           options.value = [
//             ...options.value,
//             ...newOpts,
//           ];
//         } else {
//           opts.value = [...newOpts];
//           options.value = [...newOpts];
//         }
//       })
//       .catch((e: AxiosError) => {
//         if (
//           e.name === 'CanceledError' ||
//           e.code === 'ERR_CANCELED' ||
//           e.response == undefined
//         ) {
//           console.log(
//             '[APP] Request dibatalkan:',
//             request.url
//           );

//           return;
//         }

//         console.error(
//           '[APP] SELECT LOAD',
//           e.response || e
//         );

//         return Promise.reject(e);
//       })
//       .finally(() => {
//         loading.value = false;

//         cache.promise = null;
//       });

//     return cache.promise;
//   };

//   const refresh = async () => {
//     await onFetch('', 1, true);
//   };

//   const onFilter = (
//     input: string,
//     doneFn: CallableFunction
//   ) => {
//     if (loading.value) {
//       const stop = watch(loading, (val) => {
//         if (!val) {
//           stop();

//           onFilter(input, doneFn);
//         }
//       });

//       return;
//     }

//     if (input === '') {
//       doneFn(() => {
//         opts.value = [...options.value];
//       });
//     } else {
//       doneFn(() => {
//         opts.value = options.value.filter((e) => {
//           if (
//             typeof e === 'string' &&
//             e
//               .toLocaleLowerCase()
//               .includes(input.toLocaleLowerCase())
//           ) {
//             return true;
//           }

//           if (
//             typeof e === 'object' &&
//             e !== null &&
//             Object.values(
//               e as Record<string, unknown>
//             ).some((x) => {
//               return (
//                 typeof x === 'string' &&
//                 x
//                   .toLocaleLowerCase()
//                   .includes(input.toLocaleLowerCase())
//               );
//             })
//           ) {
//             return true;
//           }

//           return false;
//         });
//       });
//     }
//   };

//   const onApiFilter = async (
//     input: string,
//     doneFn: CallableFunction
//   ) => {
//     await onFetch(input);

//     doneFn();
//   };

//   return {
//     refresh,
//     onFetch,
//     onFilter,
//     onApiFilter,
//     opts,
//     select,
//     loading,
//   };
// }

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ref,
  shallowRef,
  watch,
  onUnmounted,
} from 'vue';

import type { QSelect } from 'quasar';

import { api as $api } from 'src/boot/axios';

import type { SelectProps } from 'src/types/resource';

import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

import {
  getCacheKey,
  getOrCreateCache,
  removeCache,
} from './select-cache';

export function useSelect<R = any>(
  property: { (): SelectProps }
) {
  const select = ref<QSelect>();

  const opts = shallowRef<R[]>([]);

  const rawOpts = shallowRef<R[]>([]);

  const loading = ref(false);

  let currentCacheKey = '';

  onUnmounted(() => {
    if (currentCacheKey) {
      const cache =
        getOrCreateCache<R>(currentCacheKey);

      cache.subscribers--;

      if (cache.subscribers <= 0) {
        removeCache(currentCacheKey);
      }
    }
  });

  const onFetch = (
    input = '',
    page = 1,
    forceReload = false
  ) => {
    const { props } = property();

    const requestParams = {
      page,

      ...(props.search &&
      props.search === 'api'
        ? {}
        : {
            'with-limitation': true,
            limit: '*',
          }),

      ...(props.apiParams || {}),

      ...(props.search === 'api'
        ? { search: input }
        : {}),
    };

    const cacheKey = getCacheKey(
      String(props.apiUrl),
      {
        ...requestParams,
        searchMode: props.search,
      }
    );

    currentCacheKey = cacheKey;

    const cache = getOrCreateCache<R>(cacheKey);

    cache.subscribers++;

    const options = cache.options;

    // use existing cache
    if (
      !forceReload &&
      page === 1 &&
      options.value.length > 0
    ) {
      rawOpts.value = [...options.value];
      opts.value = [...options.value];

      return Promise.resolve();
    }

    // use on laoding cache
    if (
      !forceReload &&
      cache.loading.value &&
      cache.promise
    ) {
      loading.value = true;

      return cache.promise.then(() => {
        rawOpts.value = [...options.value];
        opts.value = [...options.value];

        loading.value = false;
      });
    }

    // request to API (no cache exist/on load)
    loading.value = true;
    cache.loading.value = true;

    if (cache.abortController) {
      cache.abortController.abort();
    }

    cache.abortController =
      new AbortController();

    const request: AxiosRequestConfig = {
      url: String(props.apiUrl),
      method: 'GET',
      params: requestParams,
      signal:
        cache.abortController.signal,
    };

    cache.promise = $api
      .request<AxiosResponse<R[]>>(request)
      .then((response) => {
        console.log(
          '[APP] SELECT LOAD',
          request.url,
          response
        );

        const newOpts: R[] =
          response.data.data ||
          response.data ||
          [];

        if (page !== 1) {
          rawOpts.value = [
            ...rawOpts.value,
            ...newOpts,
          ];

          opts.value = [
            ...opts.value,
            ...newOpts,
          ];

          options.value = [
            ...options.value,
            ...newOpts,
          ];
        } else {
          rawOpts.value = [...newOpts];

          opts.value = [...newOpts];

          options.value = [...newOpts];
        }
      })
      .catch((e: AxiosError) => {
        if (
          e.name === 'CanceledError' ||
          e.code === 'ERR_CANCELED' ||
          e.response == undefined
        ) {
          console.log(
            '[APP] Request dibatalkan:',
            request.url
          );

          return;
        }

        console.error(
          '[APP] SELECT LOAD',
          e.response || e
        );

        return Promise.reject(e);
      })
      .finally(() => {
        loading.value = false;

        cache.loading.value = false;

        cache.promise = null;
      });

    return cache.promise;
  };

  const refresh = async () => {
    await onFetch('', 1, true);
  };

  const onFilter = (
    input: string,
    doneFn: CallableFunction
  ) => {
    if (loading.value) {
      const stop = watch(
        loading,
        (val) => {
          if (!val) {
            stop();

            onFilter(input, doneFn);
          }
        }
      );

      return;
    }

    doneFn(() => {
      if (input === '') {
        opts.value = [...rawOpts.value];
        return;
      }

      opts.value = opts.value.filter(
        (e) => {
          if (
            typeof e === 'string'
          ) {
            return e
              .toLocaleLowerCase()
              .includes(
                input.toLocaleLowerCase()
              );
          }

          if (
            typeof e === 'object' &&
            e !== null
          ) {
            return Object.values(
              e as Record<
                string,
                unknown
              >
            ).some((x) => {
              return (
                typeof x ===
                  'string' &&
                x
                  .toLocaleLowerCase()
                  .includes(
                    input.toLocaleLowerCase()
                  )
              );
            });
          }

          return false;
        }
      );
    });
  };

  const onApiFilter = async (
    input: string,
    doneFn: CallableFunction
  ) => {
    await onFetch(input);

    doneFn();
  };

  return {
    refresh,
    onFetch,
    onFilter,
    onApiFilter,
    opts,
    select,
    loading,
  };
}

import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({ baseURL: process.env.API_BASE_URL || 'http://localhost:8000' });
const n8nApi = axios.create({ baseURL: process.env.N8N_BASE_URL || 'https://unhauled-chondrosarcomatous-petrina.ngrok-free.dev' });
// api.defaults.withCredentials = true;

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API

  api.interceptors.response.use(
    response => response,
    async error => {
      if (error.response && error.response.status === 401) {
        const originalUrl = error.config?.url || '';
        const originalPath = window.location.pathname || window.location.hash.split('#')[1] || '/';
        const excluded401Redirect = ['/api/auth/me'];

        const shouldSkip = excluded401Redirect.some(url =>
          originalUrl.includes(url)
        );

        if (!shouldSkip && !originalPath?.includes('/auth/login')) {
          window.location.replace(`/auth/login${originalPath ? `?redirect=${originalPath}` : ''}`)
        }

        error.response.data.message = 'Unauthorized';
      }
      const err = new Error(error.response.data.message || 'Request failed');
      Object.assign(err, error);

      return Promise.reject(err);
    }
  );


});

export { api, n8nApi };

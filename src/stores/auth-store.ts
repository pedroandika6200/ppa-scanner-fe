import type { AxiosError } from 'axios';
import { defineStore } from 'pinia';
import { Loading, Notify } from 'quasar';
import { api } from 'src/boot/axios';
import type { UserModel } from 'src/types/app';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | UserModel,
    loading: false
  }),
  getters: {
    isLogin: (state) => !(!state.user),
    authUser: (state) => state.user,
  },
  actions: {
    setUser(user: UserModel) {
      this.user = user;
      localStorage.setItem('auth-user', JSON.stringify(user));
    },

    validate: function () {
      Loading.show();
      if (!this.loading) this.loading = true;

      if (!this.user) {
        const localData = localStorage.getItem('auth-user');
        if (localData) {
          this.setUser(JSON.parse(localData));
        }
      }

      return new Promise((resolve, reject) => {
        api.post('/api/v1/auth/valid-token',
          null,
          {
            headers: {
              Authorization: `Bearer ${this.user?.token}`
            }
          }
        ).then((result) => {
          Loading.hide();
          this.loading = false;

          resolve(result);
        }).catch((error: AxiosError<{ error: string, message: string }>) => {
          console.error('VALIDATE ERROR:', error.response || error);
          Notify.create({
            type: 'negative',
            icon: 'warning',
            message: error.response?.data?.error || error.response?.data?.message || error.response?.statusText || JSON.stringify(error),
            caption: 'Please login',
            position: 'top-right',
            classes: 'text-uppercase',
            timeout: 5000,
          });

          localStorage.removeItem('auth-user');

          Loading.hide();
          this.loading = false;

          reject(error);
        })
      })
    },

    setLogout: async function () {
      Loading.show();
      await api.post('/api/v1/auth/logout',
        null,
        {
          headers: {
            Authorization: `Bearer ${this.user?.token}`
          }
        }
      );

      localStorage.removeItem('auth-user');
      Loading.hide();
      this.user = null;
    },

    setLogin: async function (password: string, email: string) {
      // Loading.show();
      this.loading = true;

      await api.post('/api/v1/login', {
        email,
        password
      }).then((res) => {
        const response = res.data.data ?? res.data;

        this.setUser({
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          token: response.token
        });

        const masterList = [
          ''
        ]

        masterList.forEach(master => {
          const savedViewPages = JSON.parse(localStorage.getItem('viewPages:' + master) || '[]');
          if (savedViewPages.length > 0) {
            const newViewPages = savedViewPages.filter((s: { edited: boolean }) => !(!s.edited));

            localStorage.setItem('viewPages:' + master, JSON.stringify(newViewPages));
          }
        })
      }).catch((error: AxiosError<{ message: string }>) => {
        console.error('SETLOGIN ERROR:', error.message);
        Notify.create({
          type: 'negative',
          icon: 'warning',
          message: error.response?.data?.message || error.response?.statusText || error.message || JSON.stringify(error),
          caption: "Please try again later",
          position: 'top-right',
          timeout: 5000,
        });
      }).finally(() => {
        // Loading.hide();
        this.loading = false;
      })
    },
  }
});


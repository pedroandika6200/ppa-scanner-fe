import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { Loading } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to, from, next) => {
    document.title = typeof to.meta.title === 'string' ? to.meta.title : 'PPA Inspection Form Scanner';

    Loading.show();

    const auth = useAuthStore();

    if (to.path === '/auth/login') {
      if (from.path !== '/' || !auth.isLogin || to.query.redirect) return next();

      try {
        await auth.validate();
      } catch {
        return next();
      }

      if (auth.isLogin) return next('/');
    } else {
      if (from.path === '/auth/login' || auth.isLogin) {
        return next()
      };

      return next('/auth/login');
    }

    next();

  });

  Router.beforeResolve((to, from, next) => {
    Loading.hide();
    next();
  })

  return Router;
});

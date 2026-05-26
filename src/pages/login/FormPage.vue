<template>
  <q-page
    class="flex bg-gradient-to-br to-gray-500"
    :class="$q.screen.lt.sm ? 'row justify-center from-blue-400' : 'flex-center from-gray-100 via-gray-200'"
  >
    <q-card
      class="q-pa-md shadow-2xl w-full animate-fade-in"
      :class="$q.screen.lt.sm ? 'rounded-none column bg-transparent' : 'max-w-md rounded-2xl bg-gray-300'"
    >
      <q-space />

      <q-card-section class="q-px-none">
        <div class="text-xl text-bold text-uppercase text-center">Sign in</div>
      </q-card-section>

      <q-card-section class="q-px-none">
        <q-input
          dense
          outlined
          autofocus
          v-model="state.email"
          label="Email"
          type="email"
          :rules="[
            (val) => (val && val.length > 0) || 'Please enter your email',
            (val) => val.includes('@') || 'Please enter a valid email'
          ]"
          :disable="auth.loading"
          @keyup.enter="handleLogin"
        />

        <q-input
          ref="passRef"
          dense
          outlined
          v-model="state.password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          :rules="[
            (val) => (val && val.length > 0) || 'Please enter your password'
          ]"
          :disable="auth.loading"
          @keyup.enter="handleLogin"
        >
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>
      </q-card-section>

      <q-card-actions align="center" class="q-pa-none">
        <q-btn
          class="w-full py-3 text-white font-semibold flex items-center justify-center rounded"
          style="background-color:#2F2F2F"
          @click="handleLogin"
          :disable="auth.loading"
        >
          <!-- <q-img
            src="/icons/favicon-microsoft.png"
            width="20px"
            height="20px"
          >
            <template v-slot:loading>
              <q-spinner color="white" size="xs" />
            </template>
          </q-img> -->
          <q-spinner v-if="auth.loading" color="white" size="xs" />
          <span v-else class="q-px-sm">Login</span>
        </q-btn>
      </q-card-actions>
      <q-space />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import type { QInput } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';
import { nextTick, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const auth = useAuthStore();
const $route = useRoute();
const $router = useRouter();

const state = reactive({
  email: '',
  password: '',
})

const passRef = ref<QInput | null>(null);
const showPassword = ref(false)

onMounted(async () => {
  sessionStorage.clear();

  const credentials = localStorage.getItem('auth-user');
  if (credentials) {
    await auth.validate().then(async () => {
      await nextTick(async () => {
        if (auth.isLogin) {
          const redirect = ($route.query.redirect as string) || '/';
          await $router.replace(redirect);
        } else {
          await auth.setLogout();
        }
      })
    });
  }
})

const handleLogin = async () => {
  localStorage.clear();

  await auth.setLogin(state.password, state.email).then(async() => {
    await nextTick(async () => {
      if (auth.isLogin) {
        const redirect = ($route.query.redirect as string) || '/';
        await $router.replace(redirect);
      }
    })
  });
}
</script>

<style>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

/* Apply to the native input element inside QInput */
.q-field__native:-webkit-autofill,
.q-field__native:-webkit-autofill:hover,
.q-field__native:-webkit-autofill:focus {
  /* Set transition to a very long time to prevent color change */
  transition: background-color 5000s ease-in-out 0s;
  /* Optional: Match your input text color */
  -webkit-text-fill-color: #000 !important;
}

/* Alternative: Set a solid white background color */
.q-field__native:-webkit-autofill {
  -webkit-box-shadow: 0 0 0px 1000px rgb(209 213 219) inset !important;
}
</style>

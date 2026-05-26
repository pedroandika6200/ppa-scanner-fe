<template>
  <q-btn-dropdown
    dense
    unelevated
    icon="person"
    color="primary"
    :label="auth.user?.name"
    class="disable-arrow q-pr-sm"
  >
    <q-card>
      <q-card-section class="q-pa-xs">
        <q-btn
          dense
          unelevated
          color="primary"
          label="Logout"
          class="w-full"
          @click="handleLogout()"
        />
      </q-card-section>
    </q-card>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth-store';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const $router = useRouter();

const handleLogout = async () => {
  await auth.setLogout();

  void $router.push('/auth/login');
}
</script>

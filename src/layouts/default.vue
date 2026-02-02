<script setup>
import {useConfigStore} from "@core/stores/config";
import {AppContentLayoutNav} from "@layouts/enums";
import {switchToVerticalNavOnLtOverlayNavBreakpoint} from "@layouts/utils";
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import BotSetupModal from "@/components/BotSetupModal.vue";

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(
  () => import("./components/DefaultLayoutWithHorizontalNav.vue"),
);
const DefaultLayoutWithVerticalNav = defineAsyncComponent(
  () => import("./components/DefaultLayoutWithVerticalNav.vue"),
);
const configStore = useConfigStore();
const {snackbar} = useToast();

// Auth store for user data
import {useAuthStore} from "@/stores/auth";
const authStore = useAuthStore();

// ℹ️ This will switch to vertical nav when define breakpoint is reached when in horizontal nav layout

// Remove below composable usage if you are not using horizontal nav layout in your app
switchToVerticalNavOnLtOverlayNavBreakpoint();

const {layoutAttrs, injectSkinClasses} = useSkins();

injectSkinClasses();

// SECTION: Loading Indicator
const isFallbackStateActive = ref(false);
const refLoadingIndicator = ref(null);

watch(
  [isFallbackStateActive, refLoadingIndicator],
  () => {
    if (isFallbackStateActive.value && refLoadingIndicator.value)
      refLoadingIndicator.value.fallbackHandle();
    if (!isFallbackStateActive.value && refLoadingIndicator.value)
      refLoadingIndicator.value.resolveHandle();
  },
  {immediate: true},
);
// !SECTION

// SECTION: Bot Setup
const showBotSetupModal = ref(false);
const botCheckLoading = ref(true);
const botConfigured = ref(false);
const botUsername = ref("");

// Check if bot is configured and user has telegram connected
const checkBotConfiguration = async () => {
  botCheckLoading.value = true;
  try {
    // Fetch latest user data to check telegramUserId
    await authStore.fetchUser();
    
    const response = await $api(`/v1/center-bots/my-bot`, {
      method: "GET",
    });

    const hasBot = response.data !== null;
    const hasTelegramConnected = authStore.userData?.telegramUserId !== null && 
                                  authStore.userData?.telegramUserId !== undefined;

    botConfigured.value = hasBot;
    botUsername.value = response.data?.botUsername || "";
    
    // Show modal if either bot is not configured OR user hasn't connected Telegram
    showBotSetupModal.value = !hasBot || !hasTelegramConnected;
  } catch (error) {
    console.error("Error checking bot configuration:", error);
  } finally {
    botCheckLoading.value = false;
  }
};

// Handle bot configuration success
const onBotConfigured = () => {
  // Refresh to check if user has connected Telegram
  checkBotConfiguration();
};

// Check bot configuration on mount and fetch user data
onMounted(() => {
  checkBotConfiguration();
  authStore.fetchUser();
});
// !SECTION
</script>

<template>
  <Component
    v-bind="layoutAttrs"
    :is="
      configStore.appContentLayoutNav === AppContentLayoutNav.Vertical
        ? DefaultLayoutWithVerticalNav
        : DefaultLayoutWithHorizontalNav
    "
  >
    <AppLoadingIndicator ref="refLoadingIndicator" />

    <RouterView v-slot="{Component}">
      <Suspense
        :timeout="0"
        @fallback="isFallbackStateActive = true"
        @resolve="isFallbackStateActive = false"
      >
        <Component :is="Component" />
      </Suspense>
    </RouterView>

    <!-- Global Toast Snackbar -->
    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.message }}
    </VSnackbar>

    <!-- Bot Setup Modal -->
    <BotSetupModal
      v-model="showBotSetupModal"
      :bot-configured="botConfigured"
      :user-telegram-connected="authStore.userData?.telegramUserId !== null && authStore.userData?.telegramUserId !== undefined"
      :initial-username="botUsername"
      @bot-configured="onBotConfigured"
      @refresh="checkBotConfiguration"
    />
  </Component>
</template>

<style lang="scss">
// As we are using `layouts` plugin we need its styles to be imported
@use "@layouts/styles/default-layout";
</style>

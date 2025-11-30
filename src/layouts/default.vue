<script setup>
import {useConfigStore} from "@core/stores/config";
import {AppContentLayoutNav} from "@layouts/enums";
import {switchToVerticalNavOnLtOverlayNavBreakpoint} from "@layouts/utils";
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import BotSetupModal from "@/components/BotSetupModal.vue";

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(
  () => import("./components/DefaultLayoutWithHorizontalNav.vue")
);
const DefaultLayoutWithVerticalNav = defineAsyncComponent(
  () => import("./components/DefaultLayoutWithVerticalNav.vue")
);
const configStore = useConfigStore();
const {snackbar} = useToast();

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
  {immediate: true}
);
// !SECTION

// SECTION: Bot Setup
const showBotSetupModal = ref(false);
const botCheckLoading = ref(true);

// Check if bot is configured
const checkBotConfiguration = async () => {
  botCheckLoading.value = true;
  try {
    const response = await $api(`/v1/center-bots/my-bot`, {
      method: "GET",
    });

    // If data is null, show the setup modal
    showBotSetupModal.value = response.data === null;
  } catch (error) {
    console.error("Error checking bot configuration:", error);
  } finally {
    botCheckLoading.value = false;
  }
};

// Handle bot configuration success
const onBotConfigured = () => {
  showBotSetupModal.value = false;
  // Optionally refresh bot data
  checkBotConfiguration();
};

// Check bot configuration on mount
onMounted(() => {
  checkBotConfiguration();
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
      @bot-configured="onBotConfigured"
    />
  </Component>
</template>

<style lang="scss">
// As we are using `layouts` plugin we need its styles to be imported
@use "@layouts/styles/default-layout";
</style>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: "primary",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <VCard height="100%">
    <VCardText class="d-flex align-center justify-space-between">
      <div class="d-flex align-center gap-4">
        <VAvatar :color="color" variant="tonal" size="44" rounded>
          <VIcon :icon="icon" size="28" />
        </VAvatar>
        <div class="d-flex flex-column">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{
            title
          }}</span>
          <div v-if="loading" class="mt-1">
            <VProgressCircular
              indeterminate
              size="24"
              width="3"
              :color="color"
            />
          </div>
          <h4 v-else class="text-h4 font-weight-bold text-no-wrap">
            {{ value }}
          </h4>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

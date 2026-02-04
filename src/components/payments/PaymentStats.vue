<script setup>
const props = defineProps({
  stats: {
    type: Object,
    default: () => ({}),
  },
});

const statCards = [
  {key: "pending", label: "Kutilmoqda", color: "warning", icon: "tabler-clock"},
  {key: "paid", label: "Tasdiqlangan", color: "success", icon: "tabler-check"},
  {key: "cancelled", label: "Bekor qilingan", color: "error", icon: "tabler-x"},
];
</script>

<template>
  <VRow class="mb-4">
    <VCol v-for="card in statCards" :key="card.key" cols="12" sm="4">
      <VCard variant="tonal" :color="card.color">
        <VCardText class="d-flex align-center gap-3">
          <VAvatar :color="card.color" variant="tonal" size="44">
            <VIcon :icon="card.icon" size="28" />
          </VAvatar>
          <div>
            <div class="text-h5 font-weight-bold">
              {{ stats[card.key] || 0 }}
            </div>
            <div class="text-body-2">{{ card.label }}</div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

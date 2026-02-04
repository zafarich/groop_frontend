<script setup>
const props = defineProps({
  discounts: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["add", "remove", "format-amount"]);
</script>

<template>
  <div>
    <div class="d-flex align-center mt-4">
      <h4 class="text-h6 mr-4">Bir necha oylik chegirmalar</h4>
      <VBtn
        size="small"
        color="primary"
        prepend-icon="tabler-plus"
        @click="$emit('add')"
      >
        Chegirma qo'shish
      </VBtn>
    </div>

    <VAlert
      v-if="discounts.length > 0"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-0 mt-2"
    >
      Bir necha oyga oldindan to'laganda chegirma. Masalan: 3 oyga to'lasa 100,000 so'm chegirma.
    </VAlert>

    <VRow class="mt-2">
      <VCol
        v-for="(discount, index) in discounts"
        :key="index"
        cols="12"
      >
        <slot :discount="discount" :index="index" />
      </VCol>
    </VRow>
  </div>
</template>

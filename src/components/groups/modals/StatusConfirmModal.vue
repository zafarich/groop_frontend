<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  group: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const isChannel = computed(() => props.group?.telegramResourceType === 'PRIVATE_CHANNEL');

const handleConfirm = () => {
  emit("confirm");
};

const close = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
  >
    <VCard v-if="group">
      <VCardTitle class="text-h5 pt-4 px-6"> Statusni o'zgartirish </VCardTitle>
      <VCardText>
        Siz haqiqatan ham {{ isChannel ? 'kanal' : 'guruh' }} statusini
        <strong>{{
          group?.isActive ? "faolsizlantirmoqchi" : "faollashtirmoqchi"
        }}</strong>
        misiz?
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="close"
          :disabled="loading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          :color="group?.isActive ? 'error' : 'success'"
          variant="elevated"
          @click="handleConfirm"
          :loading="loading"
          :disabled="loading"
        >
          Tasdiqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

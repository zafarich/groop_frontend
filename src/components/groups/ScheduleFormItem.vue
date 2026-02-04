<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  daysOfWeek: {
    type: Array,
    default: () => [],
  },
  canRemove: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "remove"]);

const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const remove = () => {
  emit("remove", props.index);
};
</script>

<template>
  <VCard variant="outlined" class="pa-4">
    <VRow>
      <VCol cols="12" md="4">
        <AppSelect
          v-model="localValue.dayOfWeek"
          :items="daysOfWeek"
          label="Kun *"
          placeholder="Hafta kunini tanlang"
        />
      </VCol>
      <VCol cols="12" md="3">
        <AppTextField
          v-model="localValue.startTime"
          label="Boshlanish vaqti *"
          placeholder="16:00"
          v-mask="'##:##'"
        />
      </VCol>
      <VCol cols="12" md="3">
        <AppTextField
          v-model="localValue.endTime"
          label="Tugash vaqti *"
          placeholder="18:00"
          v-mask="'##:##'"
        />
      </VCol>
      <VCol cols="12" md="2">
        <VBtn
          v-if="canRemove"
          size="small"
          color="error"
          class="mt-6"
          variant="text"
          icon="tabler-trash"
          @click="remove"
        />
      </VCol>
    </VRow>
  </VCard>
</template>

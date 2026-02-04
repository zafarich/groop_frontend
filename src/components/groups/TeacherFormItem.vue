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
  teachersList: {
    type: Array,
    default: () => [],
  },
  loadingTeachers: {
    type: Boolean,
    default: false,
  },
  canRemove: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "set-primary", "remove"]);

const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const setPrimary = () => {
  emit("set-primary", props.index);
};

const remove = () => {
  emit("remove", props.index);
};
</script>

<template>
  <VCard variant="outlined" class="pa-4">
    <VRow>
      <VCol cols="12" md="8">
        <AppSelect
          v-model="localValue.teacherId"
          :items="teachersList"
          label="O'qituvchi *"
          placeholder="O'qituvchini tanlang"
          :loading="loadingTeachers"
        />
      </VCol>
      <VCol cols="12" md="4" class="d-flex gap-2">
        <VCheckbox
          :model-value="modelValue.isPrimary"
          label="Asosiy o'qituvchi"
          class="mt-4 block"
          style="height: 40px"
          @update:model-value="setPrimary"
        />
        <VBtn
          v-if="canRemove"
          size="small"
          color="error"
          class="mt-4"
          variant="text"
          icon="tabler-trash"
          @click="remove"
        />
      </VCol>
    </VRow>
  </VCard>
</template>

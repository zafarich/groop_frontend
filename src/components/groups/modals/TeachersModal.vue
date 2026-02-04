<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  teachers: {
    type: Array,
    default: () => [],
  },
  teachersList: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const form = ref([]);

// Initialize form when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      form.value = props.teachers.map((t) => ({
        teacherId: t.teacherId,
        isPrimary: t.isPrimary,
      }));
      if (form.value.length === 0) {
        form.value.push({teacherId: null, isPrimary: true});
      }
    }
  },
  {immediate: true}
);

const addTeacher = () => {
  form.value.push({teacherId: null, isPrimary: false});
};

const removeTeacher = (index) => {
  if (form.value.length > 1) {
    form.value.splice(index, 1);
  }
};

const setPrimaryTeacher = (index) => {
  form.value.forEach((teacher, i) => {
    teacher.isPrimary = i === index;
  });
};

const handleSave = () => {
  emit("save", form.value);
};

const close = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
  >
    <VCard>
      <VCardTitle class="text-h5 pt-4 px-6">
        O'qituvchilarni tahrirlash
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol v-for="(teacher, index) in form" :key="index" cols="12">
            <VCard variant="outlined" class="pa-4">
              <VRow>
                <VCol cols="12" md="8">
                  <AppSelect
                    v-model="teacher.teacherId"
                    :items="teachersList"
                    label="O'qituvchi *"
                    placeholder="O'qituvchini tanlang"
                  />
                </VCol>
                <VCol cols="12" md="4" class="d-flex gap-2 align-center">
                  <VCheckbox
                    :model-value="teacher.isPrimary"
                    label="Asosiy"
                    hide-details
                    @update:model-value="setPrimaryTeacher(index)"
                  />
                  <VBtn
                    v-if="form.length > 1"
                    size="small"
                    color="error"
                    variant="text"
                    icon="tabler-trash"
                    @click="removeTeacher(index)"
                  />
                </VCol>
              </VRow>
            </VCard>
          </VCol>

          <VCol cols="12">
            <VBtn
              color="primary"
              variant="outlined"
              prepend-icon="tabler-plus"
              @click="addTeacher"
            >
              O'qituvchi qo'shish
            </VBtn>
          </VCol>
        </VRow>
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
          color="primary"
          variant="elevated"
          @click="handleSave"
          :loading="loading"
          :disabled="loading"
        >
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

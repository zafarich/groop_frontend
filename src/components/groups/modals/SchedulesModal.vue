<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  schedules: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const daysOfWeek = [
  {value: 1, title: "Dushanba"},
  {value: 2, title: "Seshanba"},
  {value: 3, title: "Chorshanba"},
  {value: 4, title: "Payshanba"},
  {value: 5, title: "Juma"},
  {value: 6, title: "Shanba"},
  {value: 7, title: "Yakshanba"},
];

const form = ref([]);

// Initialize form when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      form.value = props.schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      }));
      if (form.value.length === 0) {
        form.value.push({dayOfWeek: null, startTime: "", endTime: ""});
      }
    }
  },
  {immediate: true}
);

const addSchedule = () => {
  form.value.push({dayOfWeek: null, startTime: "", endTime: ""});
};

const removeSchedule = (index) => {
  if (form.value.length > 1) {
    form.value.splice(index, 1);
  }
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
        Dars jadvalini tahrirlash
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol
            v-for="(schedule, index) in form"
            :key="index"
            cols="12"
          >
            <VCard variant="outlined" class="pa-4">
              <VRow>
                <VCol cols="12" md="4">
                  <AppSelect
                    v-model="schedule.dayOfWeek"
                    :items="daysOfWeek"
                    label="Kun *"
                    placeholder="Hafta kunini tanlang"
                  />
                </VCol>
                <VCol cols="12" md="3">
                  <AppTextField
                    v-model="schedule.startTime"
                    label="Boshlanish vaqti *"
                    placeholder="16:00"
                    v-mask="'##:##'"
                  />
                </VCol>
                <VCol cols="12" md="3">
                  <AppTextField
                    v-model="schedule.endTime"
                    label="Tugash vaqti *"
                    placeholder="18:00"
                    v-mask="'##:##'"
                  />
                </VCol>
                <VCol cols="12" md="2" class="d-flex align-center">
                  <VBtn
                    v-if="form.length > 1"
                    size="small"
                    color="error"
                    variant="text"
                    icon="tabler-trash"
                    @click="removeSchedule(index)"
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
              @click="addSchedule"
            >
              Jadval qo'shish
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

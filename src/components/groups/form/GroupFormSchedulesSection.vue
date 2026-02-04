<script setup>
const props = defineProps({
  schedules: {
    type: Array,
    required: true,
  },
  daysOfWeek: {
    type: Array,
    default: () => [],
  },
  rules: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["add", "remove"]);
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mt-4">
      <h3 class="text-h5">Dars jadvali</h3>
      <VBtn
        size="small"
        color="primary"
        prepend-icon="tabler-plus"
        @click="$emit('add')"
      >
        Jadval qo'shish
      </VBtn>
    </div>

    <VRow class="mt-2">
      <VCol
        v-for="(schedule, index) in schedules"
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
                :rules="[rules.required]"
              />
            </VCol>
            <VCol cols="12" md="3">
              <AppTextField
                v-model="schedule.startTime"
                label="Boshlanish vaqti *"
                placeholder="16:00"
                v-mask="'##:##'"
                :rules="[rules.timeFormat]"
              />
            </VCol>
            <VCol cols="12" md="3">
              <AppTextField
                v-model="schedule.endTime"
                label="Tugash vaqti *"
                placeholder="18:00"
                v-mask="'##:##'"
                :rules="[rules.timeFormat]"
              />
            </VCol>
            <VCol cols="12" md="2">
              <VBtn
                v-if="schedules.length > 1"
                size="small"
                color="error"
                class="mt-6"
                variant="text"
                icon="tabler-trash"
                @click="$emit('remove', index)"
              />
            </VCol>
          </VRow>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

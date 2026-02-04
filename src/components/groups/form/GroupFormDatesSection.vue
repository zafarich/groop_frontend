<script setup>
const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  rules: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <VRow>
    <VCol cols="12">
      <h2 class="text-h5 mt-3">Kurs muddati</h2>
    </VCol>

    <VCol cols="12" md="6">
      <AppDateTimePicker
        v-model="form.courseStartDate"
        placeholder="Boshlash sanasini tanlang"
        :config="{dateFormat: 'd.m.Y'}"
        label="Kurs boshlanish sanasi *"
        :rules="[rules.required]"
      >
        <template #append-inner>
          <VIcon icon="tabler-calendar" />
        </template>
      </AppDateTimePicker>
    </VCol>

    <VCol cols="12" md="6">
      <AppDateTimePicker
        v-model="form.courseEndDate"
        placeholder="Tugash sanasini tanlang"
        :config="{dateFormat: 'd.m.Y'}"
        label="Kurs tugash sanasi *"
        :rules="[rules.required]"
      >
        <template #append-inner>
          <VIcon icon="tabler-calendar" />
        </template>
      </AppDateTimePicker>
    </VCol>
  </VRow>
</template>

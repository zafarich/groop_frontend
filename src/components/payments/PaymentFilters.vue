<script setup>
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";

const props = defineProps({
  groups: {
    type: Array,
    default: () => [],
  },
});

const searchQuery = defineModel("search", {type: String, default: ""});
const groupFilter = defineModel("group", {type: [String, Number], default: null});
const startDate = defineModel("startDate", {type: String, default: ""});
const endDate = defineModel("endDate", {type: String, default: ""});

const emit = defineEmits(["date-range-change"]);

const dateRange = ref(null);

const dateRangeOptions = [
  {title: "Bugun", value: "TODAY"},
  {title: "Oxirgi 7 kun", value: "LAST_7_DAYS"},
  {title: "Bu oy", value: "THIS_MONTH"},
  {title: "O'tgan oy", value: "LAST_MONTH"},
  {title: "Barchasi", value: "ALL"},
];

const calculateDateRange = (range) => {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);
  const fmt = (d) => d.toISOString().split("T")[0];

  switch (range) {
    case "TODAY":
      return {start: fmt(start), end: fmt(end)};
    case "LAST_7_DAYS":
      start.setDate(today.getDate() - 7);
      return {start: fmt(start), end: fmt(end)};
    case "THIS_MONTH":
      start.setDate(1);
      return {start: fmt(start), end: fmt(end)};
    case "LAST_MONTH":
      start.setMonth(today.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
      return {start: fmt(start), end: fmt(end)};
    case "ALL":
      return {start: "", end: ""};
    default:
      return {start: "", end: ""};
  }
};

const onDateRangeChange = (val) => {
  const {start, end} = calculateDateRange(val);
  startDate.value = start;
  endDate.value = end;
  emit("date-range-change", {start, end});
};
</script>

<template>
  <VCardText>
    <VRow>
      <VCol cols="12" md="3">
        <AppTextField
          v-model="searchQuery"
          placeholder="O'quvchi ismi yoki telefon..."
          density="compact"
        >
          <template #prepend-inner>
            <VIcon icon="tabler-search" />
          </template>
        </AppTextField>
      </VCol>
      <VCol cols="12" md="3">
        <VSelect
          v-model="groupFilter"
          :items="[{title: 'Barcha guruhlar', value: null}, ...groups]"
          label="Guruh"
          density="compact"
          clearable
        />
      </VCol>
      <VCol cols="12" md="2">
        <VSelect
          v-model="dateRange"
          :items="dateRangeOptions"
          label="Davr"
          density="compact"
          hide-details
          @update:model-value="onDateRangeChange"
        />
      </VCol>
      <VCol cols="12" md="2">
        <AppDateTimePicker
          v-model="startDate"
          placeholder="Boshlanish"
          density="compact"
        />
      </VCol>
      <VCol cols="12" md="2">
        <AppDateTimePicker
          v-model="endDate"
          placeholder="Tugash"
          density="compact"
        />
      </VCol>
    </VRow>
  </VCardText>
</template>

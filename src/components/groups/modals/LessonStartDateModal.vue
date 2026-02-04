<script setup>
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  enrollment: {
    type: Object,
    default: null,
  },
  group: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isChannel: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "activate"]);

const form = ref({
  lessonStartDate: "",
});

// Watch for enrollment changes to initialize form
watch(
  () => props.enrollment,
  (newEnrollment) => {
    if (newEnrollment) {
      form.value.lessonStartDate = newEnrollment.lessonStartDate
        ? newEnrollment.lessonStartDate.split("T")[0]
        : "";
    }
  },
  {immediate: true}
);

// Get student status config
const getStudentStatusConfig = (status) => {
  switch (status) {
    case "LEAD":
      return {color: "info", text: "Lead"};
    case "TRIAL":
      return {color: "warning", text: "Sinov darsidagi"};
    case "PENDING_JOIN":
      return {color: "info", text: "Guruhga ulanish kutilmoqda"};
    case "ACTIVE":
      return {color: "success", text: "Faol"};
    case "FROZEN":
      return {color: "warning", text: "Muzlatilgan"};
    case "EXPELLED":
      return {color: "error", text: "Chiqarilgan"};
    case "COMPLETED":
      return {color: "primary", text: "Tugatgan"};
    case "DROPPED":
      return {color: "secondary", text: "Tashlab ketgan"};
    case "LEFT_GROUP":
      return {color: "error", text: "Guruhdan chiqqan"};
    default:
      return {color: "default", text: status};
  }
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  let date = new Date(dateString);

  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  if (month < 10) {
    month = `0${month}`;
  }
  if (day < 10) {
    day = `0${day}`;
  }

  return `${day}.${month}.${year}`;
};

const handleActivate = () => {
  emit("activate", form.value.lessonStartDate);
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
    <VCard v-if="enrollment">
      <VCardTitle class="text-h5 pt-4 px-6">
        {{ isChannel ? 'Obunachini faollashtirish' : "O'quvchini faollashtirish" }}
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Student Info -->
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-1">
            <strong>{{ isChannel ? 'Obunachi:' : "O'quvchi:" }}</strong>
            {{ enrollment.student?.firstName }}
            {{ enrollment.student?.lastName }}
          </div>
          <div class="text-body-2 mt-1">
            <strong>Status:</strong>
            <VChip
              :color="getStudentStatusConfig(enrollment.status).color"
              size="small"
              variant="tonal"
              class="ms-2"
            >
              {{ getStudentStatusConfig(enrollment.status).text }}
            </VChip>
          </div>
        </VAlert>

        <!-- Course Date Range Info (hidden for channels) -->
        <VAlert 
          v-if="!isChannel && group?.courseStartDate && group?.courseEndDate" 
          type="warning" 
          variant="tonal" 
          density="compact" 
          class="mb-4"
        >
          <div class="text-body-2">
            <VIcon icon="tabler-info-circle" size="16" class="me-1" />
            Sana kurs davri ichida bo'lishi kerak:
            {{ formatDate(group.courseStartDate) }} -
            {{ formatDate(group.courseEndDate) }}
          </div>
        </VAlert>

        <!-- Date Picker -->
        <AppDateTimePicker
          v-model="form.lessonStartDate"
          :placeholder="isChannel ? 'Obuna boshlanish sanasini tanlang' : 'Dars boshlanish sanasini tanlang'"
          :config="{
            dateFormat: 'Y-m-d',
            minDate: isChannel ? undefined : group?.courseStartDate,
            maxDate: isChannel ? undefined : group?.courseEndDate,
          }"
          :label="isChannel ? 'Obuna boshlanish sanasi *' : 'Dars boshlanish sanasi *'"
        />
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
          @click="handleActivate"
          :loading="loading"
          :disabled="loading || !form.lessonStartDate"
        >
          Faollashtirish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

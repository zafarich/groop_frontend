<script setup>
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";
import {TeachersModal, SchedulesModal, DiscountsModal} from "@/components/groups";
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import {prettyMoney} from "@/utils/utils";

definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();
const route = useRoute();
const {success: showSuccess, error: showError} = useToast();

const groupId = computed(() => route.params.id);

// Group type detection
const groupType = ref(null);
const isChannel = computed(() => groupType.value === 'PRIVATE_CHANNEL');

// Form data
const form = ref({
  name: "",
  description: "",
  monthlyPrice: null,
  monthlyPriceDisplay: "",
  wholePeriodPrice: null,
  wholePeriodPriceDisplay: "",
  courseStartDate: "",
  courseEndDate: "",
  paymentType: "MONTHLY_SAME_DATE",
  lessonsPerPaymentPeriod: null,
  studentsCanWrite: true,
});

const loading = ref(false);
const loadingData = ref(false);
const errorMessage = ref("");

// Related data
const teachers = ref([]);
const teachersList = ref([]);
const loadingTeachers = ref(false);
const schedules = ref([]);
const discounts = ref([]);

// Modal states
const showTeachersModal = ref(false);
const showSchedulesModal = ref(false);
const showDiscountsModal = ref(false);

// Payment type options
const paymentTypes = [
  {value: "START_TO_END_OF_MONTH", title: "Oyning boshidan oxirigacha"},
  {value: "MONTHLY_SAME_DATE", title: "Har oy bir xil sanada"},
  {value: "LESSON_BASED", title: "Darslar asosida"},
];

// Days of week
const daysOfWeek = [
  {value: 1, title: "Dushanba"},
  {value: 2, title: "Seshanba"},
  {value: 3, title: "Chorshanba"},
  {value: 4, title: "Payshanba"},
  {value: 5, title: "Juma"},
  {value: 6, title: "Shanba"},
  {value: 7, title: "Yakshanba"},
];

// Get day name
const getDayName = (dayOfWeek) => {
  const day = daysOfWeek.find((d) => d.value === dayOfWeek);
  return day ? day.title : "";
};

// Payment type descriptions
const paymentTypeDescription = computed(() => {
  const descriptions = {
    START_TO_END_OF_MONTH:
      "Dars boshlanish sanasidan oyni oxirigacha hisoblanadi va keyingi oylar to'liq 1 oy hisoblanadi.",
    MONTHLY_SAME_DATE:
      "Dars boshlangan sanadan boshlab keyingi oyning shu sanasigacha 1 oy hisoblanadi.",
    LESSON_BASED:
      "Bunda yozgan darslar sonidan kelib chiqib 1 oylik pul hisoblanadi. Masalan: 12 ta dars 1 oy deb hisoblanadi.",
  };
  return descriptions[form.value.paymentType] || "";
});

// Validation rules
const rules = {
  required: (value) => !!value || "To'ldirish shart",
  requiredNumber: (value) =>
    (value !== null && value !== "" && value >= 0) || "To'ldirish shart",
  positiveNumber: (value) => value > 0 || "Musbat son bo'lishi kerak",
};

// Money formatting
const formatMoneyInput = (value) => {
  const numericValue = value.replace(/\s/g, "");
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) {
    form.value.monthlyPrice = null;
    form.value.monthlyPriceDisplay = "";
  } else {
    form.value.monthlyPrice = number;
    form.value.monthlyPriceDisplay = prettyMoney(number);
  }
};

const formatWholePeriodPrice = (value) => {
  const numericValue = value.replace(/\s/g, "");
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) {
    form.value.wholePeriodPrice = null;
    form.value.wholePeriodPriceDisplay = "";
  } else {
    form.value.wholePeriodPrice = number;
    form.value.wholePeriodPriceDisplay = prettyMoney(number);
  }
};

// Calculate course duration in months
const courseDurationMonths = computed(() => {
  if (!form.value.courseStartDate || !form.value.courseEndDate) return 0;

  const parseDate = (dateStr) => {
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split(".");
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
  };

  const start = parseDate(form.value.courseStartDate);
  const end = parseDate(form.value.courseEndDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  const diffTime = end.getTime() - start.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const months = diffDays / 30;

  return Math.round(months * 10) / 10;
});

// Calculate total if paying monthly
const totalMonthlyPayment = computed(() => {
  if (!form.value.monthlyPrice || !courseDurationMonths.value) return 0;
  return Math.ceil(courseDurationMonths.value) * form.value.monthlyPrice;
});

// Calculate savings for whole period payment
const wholePeriodSavings = computed(() => {
  if (!form.value.wholePeriodPrice || !totalMonthlyPayment.value) return 0;
  return totalMonthlyPayment.value - form.value.wholePeriodPrice;
});

// Calculate savings percentage
const wholePeriodSavingsPercent = computed(() => {
  if (!wholePeriodSavings.value || !totalMonthlyPayment.value) return 0;
  return Math.round((wholePeriodSavings.value / totalMonthlyPayment.value) * 100);
});

// Convert date to ISO 8601 format
const convertDateToISO = (value) => {
  if (!value) return undefined;

  const dateString = String(value).trim();

  // Handle DD.MM.YYYY format
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split(".");
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toISOString();
  }

  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split("-");
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toISOString();
  }

  // Handle full ISO string
  if (/^\d{4}-\d{2}-\d{2}T/.test(dateString)) {
    return dateString;
  }

  // Fallback
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    console.error("Date conversion failed:", e);
  }

  return dateString;
};

// Convert ISO date to DD.MM.YYYY format for display
const formatDateForDisplay = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
};

// Fetch group details
const fetchGroupDetails = async () => {
  loadingData.value = true;
  try {
    const response = await $api(`/v1/groups/${groupId.value}`, {
      method: "GET",
    });

    if (response.success && response.data) {
      const group = response.data;

      groupType.value = group.telegramResourceType || 'PRIVATE_GROUP';

      form.value = {
        name: group.name,
        description: group.description || "",
        monthlyPrice: Number(group.monthlyPrice),
        monthlyPriceDisplay: prettyMoney(Number(group.monthlyPrice)),
        wholePeriodPrice: group.wholePeriodPrice ? Number(group.wholePeriodPrice) : null,
        wholePeriodPriceDisplay: group.wholePeriodPrice ? prettyMoney(Number(group.wholePeriodPrice)) : "",
        courseStartDate: formatDateForDisplay(group.courseStartDate),
        courseEndDate: formatDateForDisplay(group.courseEndDate),
        paymentType: group.paymentType,
        lessonsPerPaymentPeriod: group.lessonsPerPaymentPeriod,
        studentsCanWrite: group.studentsCanWrite ?? true,
      };

      teachers.value = group.groupTeachers || [];
      schedules.value = group.lessonSchedules || [];
      discounts.value = group.discounts || [];
    }
  } catch (error) {
    console.error("Error fetching group details:", error);
    showError("Guruh ma'lumotlarini yuklashda xatolik");
    router.push("/groups");
  } finally {
    loadingData.value = false;
  }
};

// Fetch teachers list
const fetchTeachersList = async () => {
  loadingTeachers.value = true;
  try {
    const response = await $api("/v1/teachers?page=1&limit=200", {
      method: "GET",
    });

    if (response.success && response.data) {
      teachersList.value = response.data.data.map((teacher) => ({
        value: teacher.id,
        title:
          `${teacher.user?.firstName || ""} ${teacher.user?.lastName || ""} ${
            teacher.specialty ? `(${teacher.specialty})` : ""
          }`.trim(),
      }));
    }
  } catch (error) {
    console.error("Error fetching teachers:", error);
    showError("O'qituvchilar ro'yxatini yuklashda xatolik");
  } finally {
    loadingTeachers.value = false;
  }
};

// Teachers management
const openTeachersModal = () => {
  showTeachersModal.value = true;
};

const saveTeachers = async (teachersData) => {
  loading.value = true;
  try {
    const response = await $api(`/v1/groups/${groupId.value}/teachers`, {
      method: "PUT",
      body: {teachers: teachersData},
    });

    if (response.success) {
      showSuccess("O'qituvchilar muvaffaqiyatli yangilandi!");
      showTeachersModal.value = false;
      await fetchGroupDetails();
    }
  } catch (error) {
    showError(
      error.data?.message || "O'qituvchilarni yangilashda xatolik yuz berdi"
    );
  } finally {
    loading.value = false;
  }
};

// Schedules management
const openSchedulesModal = () => {
  showSchedulesModal.value = true;
};

const saveSchedules = async (schedulesData) => {
  loading.value = true;
  try {
    const response = await $api(`/v1/groups/${groupId.value}/schedules`, {
      method: "PUT",
      body: {schedules: schedulesData},
    });

    if (response.success) {
      showSuccess("Dars jadvali muvaffaqiyatli yangilandi!");
      showSchedulesModal.value = false;
      await fetchGroupDetails();
    }
  } catch (error) {
    showError(
      error.data?.message || "Dars jadvalini yangilashda xatolik yuz berdi"
    );
  } finally {
    loading.value = false;
  }
};

// Discounts management
const openDiscountsModal = () => {
  showDiscountsModal.value = true;
};

const saveDiscounts = async (discountsData) => {
  loading.value = true;
  try {
    const response = await $api(`/v1/groups/${groupId.value}/discounts`, {
      method: "PUT",
      body: {discounts: discountsData},
    });

    if (response.success) {
      showSuccess("Chegirmalar muvaffaqiyatli yangilandi!");
      showDiscountsModal.value = false;
      await fetchGroupDetails();
    }
  } catch (error) {
    showError(
      error.data?.message || "Chegirmalarni yangilashda xatolik yuz berdi"
    );
  } finally {
    loading.value = false;
  }
};

// Validation
const validateForm = () => {
  errorMessage.value = "";

  if (!form.value.name) {
    errorMessage.value = isChannel.value ? "Kanal nomini kiriting" : "Guruh nomini kiriting";
    return false;
  }

  if (form.value.monthlyPrice === null || form.value.monthlyPrice < 0) {
    errorMessage.value = "Oylik to'lovni kiriting";
    return false;
  }

  if (!isChannel.value) {
    if (!form.value.courseStartDate) {
      errorMessage.value = "Kurs boshlanish sanasini kiriting";
      return false;
    }

    if (!form.value.courseEndDate) {
      errorMessage.value = "Kurs tugash sanasini kiriting";
      return false;
    }

    if (!form.value.paymentType) {
      errorMessage.value = "To'lov turini tanlang";
      return false;
    }

    if (
      form.value.paymentType === "LESSON_BASED" &&
      (!form.value.lessonsPerPaymentPeriod ||
        form.value.lessonsPerPaymentPeriod < 1)
    ) {
      errorMessage.value = "Darslar sonini kiriting";
      return false;
    }
  }

  return true;
};

// Submit function
const onSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const payload = {
      name: form.value.name,
      description: form.value.description || undefined,
      monthlyPrice: form.value.monthlyPrice,
      studentsCanWrite: form.value.studentsCanWrite,
    };

    if (!isChannel.value) {
      const startDateISO = convertDateToISO(form.value.courseStartDate);
      const endDateISO = convertDateToISO(form.value.courseEndDate);

      Object.assign(payload, {
        wholePeriodPrice: form.value.wholePeriodPrice || undefined,
        courseStartDate: startDateISO,
        courseEndDate: endDateISO,
        paymentType: form.value.paymentType,
        lessonsPerPaymentPeriod:
          form.value.paymentType === "LESSON_BASED"
            ? form.value.lessonsPerPaymentPeriod
            : undefined,
      });
    }

    const response = await $api(`/v1/groups/${groupId.value}`, {
      method: "PATCH",
      body: payload,
    });

    if (response.success) {
      showSuccess(isChannel.value ? "Kanal muvaffaqiyatli yangilandi!" : "Guruh muvaffaqiyatli yangilandi!");
      router.push(`/groups/${groupId.value}`);
    } else {
      errorMessage.value = response.message || "Xatolik yuz berdi";
    }
  } catch (error) {
    errorMessage.value =
      error.data?.message ||
      error.message ||
      (isChannel.value ? "Kanal yangilashda xatolik yuz berdi" : "Guruh yangilashda xatolik yuz berdi");
  } finally {
    loading.value = false;
  }
};

// Cancel and go back
const onCancel = () => {
  router.push(`/groups/${groupId.value}`);
};

// Watch payment type changes
watch(
  () => form.value.paymentType,
  (newType) => {
    if (newType !== "LESSON_BASED") {
      form.value.lessonsPerPaymentPeriod = null;
    }
  }
);

// Load data on mount
onMounted(() => {
  fetchGroupDetails();
  fetchTeachersList();
});
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- Back Button -->
      <VBtn
        variant="text"
        color="primary"
        prepend-icon="tabler-arrow-left"
        class="mb-4"
        @click="router.push(`/groups/${groupId}`)"
      >
        Orqaga
      </VBtn>

      <!-- Loading State -->
      <VCard v-if="loadingData">
        <VCardText class="text-center py-8">
          <VProgressCircular indeterminate color="primary" />
          <div class="text-body-1 mt-4">Yuklanmoqda...</div>
        </VCardText>
      </VCard>

      <!-- Edit Form -->
      <template v-else>
        <!-- Basic Information Card -->
        <VCard class="mb-4">
          <VCardTitle class="d-flex align-center">
            <VIcon icon="tabler-edit" class="me-2" />
            <span>{{ isChannel ? 'Kanalni tahrirlash' : 'Guruhni tahrirlash' }}</span>
          </VCardTitle>

          <VDivider />

          <!-- Error alert -->
          <VCardText v-if="errorMessage">
            <VAlert
              type="error"
              variant="tonal"
              closable
              @click:close="errorMessage = ''"
            >
              {{ errorMessage }}
            </VAlert>
          </VCardText>

          <VCardText>
            <VForm @submit.prevent="onSubmit">
              <VRow>
                <!-- Basic Information Section -->
                <VCol cols="12">
                  <h3 class="text-h5">Asosiy ma'lumotlar</h3>
                </VCol>

                <!-- Group/Channel Name -->
                <VCol cols="12" md="6">
                  <AppTextField
                    v-model="form.name"
                    :label="isChannel ? 'Kanal nomi *' : 'Guruh nomi *'"
                    :placeholder="isChannel ? 'Kanal nomini kiriting' : 'Guruh nomini kiriting'"
                    :rules="[rules.required]"
                  />
                </VCol>

                <!-- Monthly Price -->
                <VCol cols="12" md="6">
                  <AppTextField
                    v-model="form.monthlyPriceDisplay"
                    label="Oylik to'lov (so'm) *"
                    placeholder="500 000"
                    :rules="[rules.required]"
                    @input="formatMoneyInput($event.target.value)"
                  />
                </VCol>

                <!-- Whole Period Price (hidden for channels) -->
                <VCol v-if="!isChannel" cols="12" md="6">
                  <AppTextField
                    v-model="form.wholePeriodPriceDisplay"
                    label="Butun davr uchun narx (ixtiyoriy)"
                    placeholder="1 500 000"
                    @input="formatWholePeriodPrice($event.target.value)"
                  >
                    <template #append-inner>
                      <span class="text-body-2 text-medium-emphasis">so'm</span>
                    </template>
                  </AppTextField>
                </VCol>

                <!-- Pricing Summary (hidden for channels) -->
                <VCol cols="12" v-if="!isChannel && courseDurationMonths > 0 && form.monthlyPrice">
                  <VCard variant="tonal" color="info" class="pa-4">
                    <div class="text-subtitle-1 font-weight-bold mb-3">
                      Narxlar taqqoslash ({{ courseDurationMonths }} oy uchun)
                    </div>
                    <VRow>
                      <VCol cols="12" md="4">
                        <div class="text-caption text-medium-emphasis">Oyma-oy to'lash</div>
                        <div class="text-body-1 font-weight-medium">
                          {{ prettyMoney(totalMonthlyPayment) }} so'm
                        </div>
                        <div class="text-caption">
                          ({{ prettyMoney(form.monthlyPrice) }} × {{ Math.ceil(courseDurationMonths) }} oy)
                        </div>
                      </VCol>
                      <VCol cols="12" md="4" v-if="form.wholePeriodPrice">
                        <div class="text-caption text-medium-emphasis">Butun davr uchun</div>
                        <div class="text-body-1 font-weight-medium text-success">
                          {{ prettyMoney(form.wholePeriodPrice) }} so'm
                        </div>
                        <div class="text-caption text-success" v-if="wholePeriodSavings > 0">
                          {{ wholePeriodSavingsPercent }}% tejash
                        </div>
                      </VCol>
                      <VCol cols="12" md="4" v-if="wholePeriodSavings > 0">
                        <div class="text-caption text-medium-emphasis">Tejash</div>
                        <div class="text-body-1 font-weight-medium text-success">
                          {{ prettyMoney(wholePeriodSavings) }} so'm
                        </div>
                      </VCol>
                    </VRow>
                  </VCard>
                </VCol>

                <!-- Description -->
                <VCol cols="12">
                  <AppTextarea
                    v-model="form.description"
                    label="Tavsif - kurs haqida ma'lumot"
                    placeholder="Guruh haqida qisqacha ma'lumot..."
                    rows="3"
                  />
                  <VSwitch
                    v-model="form.studentsCanWrite"
                    label="Studentlar guruhga yoza oladimi?"
                    color="primary"
                    class="mt-2"
                  />
                  <VAlert
                    type="info"
                    variant="tonal"
                    density="compact"
                    class="mt-2"
                  >
                    Buni yoqib qo'ysangiz o'quvchi qarzdor bo'lsa telegram
                    guruhga yoza olmaydi
                  </VAlert>
                </VCol>

                <!-- Course Dates Section (hidden for channels) -->
                <template v-if="!isChannel">
                  <VCol cols="12">
                    <h2 class="text-h5 mt-3">Kurs muddati</h2>
                  </VCol>

                  <!-- Course Start Date -->
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

                  <!-- Course End Date -->
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

                  <!-- Payment Configuration Section -->
                  <VCol cols="12">
                    <h3 class="text-h5 mt-4">To'lov sozlamalari</h3>
                  </VCol>

                  <!-- Payment Type -->
                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="form.paymentType"
                      :items="paymentTypes"
                      label="To'lov turi *"
                      :rules="[rules.required]"
                    />
                  </VCol>

                  <!-- Lessons Per Payment Period (conditional) -->
                  <VCol
                    v-if="form.paymentType === 'LESSON_BASED'"
                    cols="12"
                    md="6"
                  >
                    <AppTextField
                      v-model.number="form.lessonsPerPaymentPeriod"
                      type="number"
                      label="To'lov davridagi darslar soni *"
                      placeholder="12"
                      :rules="[rules.requiredNumber, rules.positiveNumber]"
                    />
                  </VCol>

                  <!-- Payment Type Info -->
                  <VCol cols="12" v-if="paymentTypeDescription">
                    <VAlert
                      type="info"
                      variant="tonal"
                      density="compact"
                      class="mb-0"
                    >
                      {{ paymentTypeDescription }}
                    </VAlert>
                  </VCol>
                </template>

                <!-- Action Buttons -->
                <VCol cols="12" class="d-flex gap-4 mt-4">
                  <VBtn type="submit" :loading="loading" :disabled="loading">
                    Saqlash
                  </VBtn>

                  <VBtn
                    color="secondary"
                    variant="outlined"
                    @click="onCancel"
                    :disabled="loading"
                  >
                    Bekor qilish
                  </VBtn>
                </VCol>
              </VRow>
            </VForm>
          </VCardText>
        </VCard>

        <!-- Teachers Management Card (hidden for channels) -->
        <VCard v-if="!isChannel" class="mb-4">
          <VCardTitle class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <VIcon icon="tabler-users" class="me-2" />
              <span>O'qituvchilar</span>
            </div>
            <VBtn
              color="primary"
              variant="outlined"
              size="small"
              @click="openTeachersModal"
            >
              <VIcon icon="tabler-edit" class="me-1" />
              Tahrirlash
            </VBtn>
          </VCardTitle>

          <VDivider />

          <VCardText>
            <VRow v-if="teachers.length > 0">
              <VCol
                v-for="teacher in teachers"
                :key="teacher.id"
                cols="12"
                md="6"
              >
                <VCard variant="outlined">
                  <VCardText>
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-body-1 font-weight-medium">
                          {{ teacher.teacher.user?.firstName }}
                          {{ teacher.teacher.user?.lastName }}
                        </div>
                        <div class="text-body-2 text-medium-emphasis">
                          {{ teacher.teacher.specialty || "-" }}
                        </div>
                      </div>
                      <VChip
                        v-if="teacher.isPrimary"
                        color="primary"
                        size="small"
                        variant="tonal"
                      >
                        Asosiy
                      </VChip>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
            <VAlert v-else type="info" variant="tonal">
              O'qituvchilar mavjud emas
            </VAlert>
          </VCardText>
        </VCard>

        <!-- Lesson Schedules Management Card (hidden for channels) -->
        <VCard v-if="!isChannel" class="mb-4">
          <VCardTitle class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <VIcon icon="tabler-calendar-time" class="me-2" />
              <span>Dars jadvali</span>
            </div>
            <VBtn
              color="primary"
              variant="outlined"
              size="small"
              @click="openSchedulesModal"
            >
              <VIcon icon="tabler-edit" class="me-1" />
              Tahrirlash
            </VBtn>
          </VCardTitle>

          <VDivider />

          <VCardText>
            <VRow v-if="schedules.length > 0">
              <VCol
                v-for="schedule in schedules"
                :key="schedule.id"
                cols="12"
                md="4"
              >
                <VCard variant="outlined">
                  <VCardText>
                    <div class="text-center">
                      <div class="text-h6 text-primary">
                        {{ getDayName(schedule.dayOfWeek) }}
                      </div>
                      <div class="text-body-1 mt-2">
                        {{ schedule.startTime }} - {{ schedule.endTime }}
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
            <VAlert v-else type="info" variant="tonal">
              Dars jadvali mavjud emas
            </VAlert>
          </VCardText>
        </VCard>

        <!-- Discounts Management Card (hidden for channels) -->
        <VCard v-if="!isChannel" class="mb-4">
          <VCardTitle class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <VIcon icon="tabler-discount" class="me-2" />
              <span>Chegirmalar</span>
            </div>
            <VBtn
              color="primary"
              variant="outlined"
              size="small"
              @click="openDiscountsModal"
            >
              <VIcon icon="tabler-edit" class="me-1" />
              Tahrirlash
            </VBtn>
          </VCardTitle>

          <VDivider />

          <VCardText>
            <VRow v-if="discounts.length > 0">
              <VCol
                v-for="discount in discounts"
                :key="discount.id"
                cols="12"
                md="3"
              >
                <VCard variant="outlined">
                  <VCardText>
                    <div class="text-center">
                      <div class="text-h6 text-primary">
                        {{ discount.months }} oy
                      </div>
                      <div class="text-body-2 text-medium-emphasis mt-1">
                        {{ prettyMoney(discount.discountAmount) }} so'm
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
            <VAlert v-else type="info" variant="tonal">
              Chegirmalar mavjud emas
            </VAlert>
          </VCardText>
        </VCard>
      </template>
    </VCol>
  </VRow>

  <!-- Teachers Modal -->
  <TeachersModal
    v-model="showTeachersModal"
    :teachers="teachers"
    :teachers-list="teachersList"
    :loading="loading"
    @save="saveTeachers"
  />

  <!-- Schedules Modal -->
  <SchedulesModal
    v-model="showSchedulesModal"
    :schedules="schedules"
    :loading="loading"
    @save="saveSchedules"
  />

  <!-- Discounts Modal -->
  <DiscountsModal
    v-model="showDiscountsModal"
    :discounts="discounts"
    :monthly-price="form.monthlyPrice"
    :loading="loading"
    @save="saveDiscounts"
  />
</template>

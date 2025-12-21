<script setup>
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";
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

// Form data
const form = ref({
  name: "",
  description: "",
  monthlyPrice: null,
  monthlyPriceDisplay: "",
  courseStartDate: "",
  courseEndDate: "",
  paymentType: "MONTHLY_SAME_DATE",
  lessonsPerPaymentPeriod: null,
});

const loading = ref(false);
const loadingData = ref(false);
const errorMessage = ref("");

// Teachers management
const teachers = ref([]);
const teachersList = ref([]);
const loadingTeachers = ref(false);
const showTeachersModal = ref(false);
const teachersForm = ref([]);

// Schedules management
const schedules = ref([]);
const showSchedulesModal = ref(false);
const schedulesForm = ref([]);

// Discounts management
const discounts = ref([]);
const showDiscountsModal = ref(false);
const discountsForm = ref([]);

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
  timeFormat: (value) => {
    if (!value) return "To'ldirish shart";
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(value) || "HH:MM formatida kiriting (masalan: 09:00)";
  },
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

const formatDiscountAmount = (index, value) => {
  const numericValue = value.replace(/\s/g, "");
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) {
    discountsForm.value[index].discountAmount = null;
    discountsForm.value[index].discountAmountDisplay = "";
  } else {
    discountsForm.value[index].discountAmount = number;
    discountsForm.value[index].discountAmountDisplay = prettyMoney(number);
  }
};

// Convert date to ISO 8601 format
const convertDateToISO = (value) => {
  if (!value) return undefined;

  const dateString = String(value).trim();

  // Handle DD.MM.YYYY format (e.g. 15.01.2025)
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

  // Fallback: Try to parse as Date
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
      form.value = {
        name: group.name,
        description: group.description || "",
        monthlyPrice: Number(group.monthlyPrice),
        monthlyPriceDisplay: prettyMoney(Number(group.monthlyPrice)),
        courseStartDate: formatDateForDisplay(group.courseStartDate),
        courseEndDate: formatDateForDisplay(group.courseEndDate),
        paymentType: group.paymentType,
        lessonsPerPaymentPeriod: group.lessonsPerPaymentPeriod,
      };

      // Load related data
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
  teachersForm.value = teachers.value.map((t) => ({
    teacherId: t.teacherId,
    isPrimary: t.isPrimary,
  }));
  if (teachersForm.value.length === 0) {
    teachersForm.value.push({teacherId: null, isPrimary: true});
  }
  showTeachersModal.value = true;
};

const addTeacher = () => {
  teachersForm.value.push({teacherId: null, isPrimary: false});
};

const removeTeacher = (index) => {
  if (teachersForm.value.length > 1) {
    teachersForm.value.splice(index, 1);
  }
};

const setPrimaryTeacher = (index) => {
  teachersForm.value.forEach((teacher, i) => {
    teacher.isPrimary = i === index;
  });
};

const saveTeachers = async () => {
  loading.value = true;
  try {
    const response = await $api(`/v1/groups/${groupId.value}/teachers`, {
      method: "PUT",
      body: {teachers: teachersForm.value},
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
  schedulesForm.value = schedules.value.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
  }));
  if (schedulesForm.value.length === 0) {
    schedulesForm.value.push({dayOfWeek: null, startTime: "", endTime: ""});
  }
  showSchedulesModal.value = true;
};

const addSchedule = () => {
  schedulesForm.value.push({dayOfWeek: null, startTime: "", endTime: ""});
};

const removeSchedule = (index) => {
  if (schedulesForm.value.length > 1) {
    schedulesForm.value.splice(index, 1);
  }
};

const saveSchedules = async () => {
  loading.value = true;
  try {
    const response = await $api(`/v1/groups/${groupId.value}/schedules`, {
      method: "PUT",
      body: {schedules: schedulesForm.value},
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
  discountsForm.value = discounts.value.map((d) => ({
    months: d.months,
    discountAmount: Number(d.discountAmount),
    discountAmountDisplay: prettyMoney(Number(d.discountAmount)),
  }));
  showDiscountsModal.value = true;
};

const addDiscount = () => {
  discountsForm.value.push({
    months: null,
    discountAmount: null,
    discountAmountDisplay: "",
  });
};

const removeDiscount = (index) => {
  discountsForm.value.splice(index, 1);
};

const saveDiscounts = async () => {
  loading.value = true;
  try {
    const payload = discountsForm.value.map((d) => ({
      months: d.months,
      discountAmount: d.discountAmount,
    }));

    const response = await $api(`/v1/groups/${groupId.value}/discounts`, {
      method: "PUT",
      body: {discounts: payload},
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
    errorMessage.value = "Guruh nomini kiriting";
    return false;
  }

  if (form.value.monthlyPrice === null || form.value.monthlyPrice < 0) {
    errorMessage.value = "Oylik to'lovni kiriting";
    return false;
  }

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

  // Validate lessons per payment period for LESSON_BASED
  if (
    form.value.paymentType === "LESSON_BASED" &&
    (!form.value.lessonsPerPaymentPeriod ||
      form.value.lessonsPerPaymentPeriod < 1)
  ) {
    errorMessage.value = "Darslar sonini kiriting";
    return false;
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
    const startDateISO = convertDateToISO(form.value.courseStartDate);
    const endDateISO = convertDateToISO(form.value.courseEndDate);

    const payload = {
      name: form.value.name,
      description: form.value.description || undefined,
      monthlyPrice: form.value.monthlyPrice,
      courseStartDate: startDateISO,
      courseEndDate: endDateISO,
      paymentType: form.value.paymentType,
      lessonsPerPaymentPeriod:
        form.value.paymentType === "LESSON_BASED"
          ? form.value.lessonsPerPaymentPeriod
          : undefined,
    };

    const response = await $api(`/v1/groups/${groupId.value}`, {
      method: "PATCH",
      body: payload,
    });

    if (response.success) {
      showSuccess("Guruh muvaffaqiyatli yangilandi!");
      router.push(`/groups/${groupId.value}`);
    } else {
      errorMessage.value = response.message || "Xatolik yuz berdi";
    }
  } catch (error) {
    errorMessage.value =
      error.data?.message ||
      error.message ||
      "Guruh yangilashda xatolik yuz berdi";
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
            <span>Guruhni tahrirlash</span>
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

                <!-- Group Name -->
                <VCol cols="12" md="6">
                  <AppTextField
                    v-model="form.name"
                    label="Guruh nomi *"
                    placeholder="Guruh nomini kiriting"
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

                <!-- Description -->
                <VCol cols="12">
                  <AppTextarea
                    v-model="form.description"
                    label="Tavsif - kurs haqida ma'lumot"
                    placeholder="Guruh haqida qisqacha ma'lumot..."
                    rows="3"
                  />
                </VCol>

                <!-- Course Dates Section -->
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

        <!-- Teachers Management Card -->
        <VCard class="mb-4">
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

        <!-- Lesson Schedules Management Card -->
        <VCard class="mb-4">
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

        <!-- Discounts Management Card -->
        <VCard class="mb-4">
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
  <VDialog v-model="showTeachersModal" max-width="800">
    <VCard>
      <VCardTitle class="text-h5 pt-4 px-6">
        O'qituvchilarni tahrirlash
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol v-for="(teacher, index) in teachersForm" :key="index" cols="12">
            <VCard variant="outlined" class="pa-4">
              <VRow>
                <VCol cols="12" md="8">
                  <AppSelect
                    v-model="teacher.teacherId"
                    :items="teachersList"
                    label="O'qituvchi *"
                    placeholder="O'qituvchini tanlang"
                    :loading="loadingTeachers"
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
                    v-if="teachersForm.length > 1"
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
          @click="showTeachersModal = false"
          :disabled="loading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          @click="saveTeachers"
          :loading="loading"
          :disabled="loading"
        >
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Schedules Modal -->
  <VDialog v-model="showSchedulesModal" max-width="800">
    <VCard>
      <VCardTitle class="text-h5 pt-4 px-6">
        Dars jadvalini tahrirlash
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol
            v-for="(schedule, index) in schedulesForm"
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
                    v-if="schedulesForm.length > 1"
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
          @click="showSchedulesModal = false"
          :disabled="loading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          @click="saveSchedules"
          :loading="loading"
          :disabled="loading"
        >
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Discounts Modal -->
  <VDialog v-model="showDiscountsModal" max-width="800">
    <VCard>
      <VCardTitle class="text-h5 pt-4 px-6">
        Chegirmalarni tahrirlash
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VAlert
          v-if="discountsForm.length > 0"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          1 oydan ko'p muddatga to'laganda chegirma bo'ladigan holatdagi
          chegirma turi. Nechta oy uchun to'lasa umumiy qancha chegirma
          bo'lishini kiriting
        </VAlert>

        <VRow>
          <VCol
            v-for="(discount, index) in discountsForm"
            :key="index"
            cols="12"
          >
            <VCard variant="outlined" class="pa-4">
              <VRow>
                <VCol cols="12" md="5">
                  <AppTextField
                    v-model.number="discount.months"
                    type="number"
                    label="Oylar soni *"
                    placeholder="3"
                  />
                </VCol>
                <VCol cols="12" md="5">
                  <AppTextField
                    v-model="discount.discountAmountDisplay"
                    label="Chegirma miqdori (so'm) *"
                    placeholder="100 000"
                    @input="formatDiscountAmount(index, $event.target.value)"
                  />
                </VCol>
                <VCol cols="12" md="2" class="d-flex align-center">
                  <VBtn
                    size="small"
                    color="error"
                    variant="text"
                    icon="tabler-trash"
                    @click="removeDiscount(index)"
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
              @click="addDiscount"
            >
              Chegirma qo'shish
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="showDiscountsModal = false"
          :disabled="loading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          @click="saveDiscounts"
          :loading="loading"
          :disabled="loading"
        >
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

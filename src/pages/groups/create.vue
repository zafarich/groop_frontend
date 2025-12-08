<script setup>
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";
import TelegramSetupModal from "@/components/TelegramSetupModal.vue";
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import {prettyMoney} from "@/utils/utils";

definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();
const {success: showSuccess, error: showError} = useToast();

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
  teachers: [{teacherId: null, isPrimary: true}],
  lessonSchedules: [{dayOfWeek: null, startTime: "", endTime: ""}],
  discounts: [],
});

const loading = ref(false);
const errorMessage = ref("");
const teachersList = ref([]);
const loadingTeachers = ref(false);

// Telegram setup modal state
const showTelegramSetupModal = ref(false);
const connectToken = ref("");

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
    form.value.discounts[index].discountAmount = null;
    form.value.discounts[index].discountAmountDisplay = "";
  } else {
    form.value.discounts[index].discountAmount = number;
    form.value.discounts[index].discountAmountDisplay = prettyMoney(number);
  }
};

// Convert date to ISO 8601 format (YYYY-MM-DD)
// Convert date to ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
const convertDateToISO = (value) => {
  if (!value) return undefined;

  const dateString = String(value).trim();

  // Handle DD.MM.YYYY format (e.g. 15.01.2025)
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split(".");
    // Create UTC date at midnight
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

// Fetch teachers
const fetchTeachers = async () => {
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

// Teacher management
const addTeacher = () => {
  form.value.teachers.push({teacherId: null, isPrimary: false});
};

const removeTeacher = (index) => {
  if (form.value.teachers.length > 1) {
    form.value.teachers.splice(index, 1);
  }
};

const setPrimaryTeacher = (index) => {
  form.value.teachers.forEach((teacher, i) => {
    teacher.isPrimary = i === index;
  });
};

// Lesson schedule management
const addLessonSchedule = () => {
  form.value.lessonSchedules.push({
    dayOfWeek: null,
    startTime: "",
    endTime: "",
  });
};

const removeLessonSchedule = (index) => {
  if (form.value.lessonSchedules.length > 1) {
    form.value.lessonSchedules.splice(index, 1);
  }
};

// Discount management
const addDiscount = () => {
  form.value.discounts.push({
    months: null,
    discountAmount: null,
    discountAmountDisplay: "",
  });
};

const removeDiscount = (index) => {
  form.value.discounts.splice(index, 1);
};

// Validation
const validateForm = () => {
  errorMessage.value = "";

  // Basic validation
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

  // Validate teachers
  if (form.value.teachers.length === 0) {
    errorMessage.value = "Kamida bitta o'qituvchi qo'shing";
    return false;
  }

  const hasEmptyTeacher = form.value.teachers.some((t) => !t.teacherId);
  if (hasEmptyTeacher) {
    errorMessage.value = "Barcha o'qituvchilarni tanlang";
    return false;
  }

  const primaryTeachers = form.value.teachers.filter((t) => t.isPrimary);
  if (primaryTeachers.length !== 1) {
    errorMessage.value = "Faqat bitta asosiy o'qituvchi bo'lishi kerak";
    return false;
  }

  // Validate lesson schedules
  if (form.value.lessonSchedules.length === 0) {
    errorMessage.value = "Kamida bitta dars jadvalini qo'shing";
    return false;
  }

  const hasEmptySchedule = form.value.lessonSchedules.some(
    (s) => !s.dayOfWeek || !s.startTime || !s.endTime
  );
  if (hasEmptySchedule) {
    errorMessage.value = "Barcha dars jadvallarini to'ldiring";
    return false;
  }

  // Check for duplicate days
  const days = form.value.lessonSchedules.map((s) => s.dayOfWeek);
  const uniqueDays = new Set(days);
  if (days.length !== uniqueDays.size) {
    errorMessage.value = "Bir xil kunlar takrorlanmasligi kerak";
    return false;
  }

  // Validate time format and logic
  for (const schedule of form.value.lessonSchedules) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (
      !timeRegex.test(schedule.startTime) ||
      !timeRegex.test(schedule.endTime)
    ) {
      errorMessage.value = "Vaqtni HH:MM formatida kiriting (masalan: 09:00)";
      return false;
    }

    if (schedule.startTime >= schedule.endTime) {
      errorMessage.value =
        "Tugash vaqti boshlanish vaqtidan kechroq bo'lishi kerak";
      return false;
    }
  }

  // Validate discounts
  if (form.value.discounts.length > 0) {
    const hasEmptyDiscount = form.value.discounts.some(
      (d) => d.months === null || d.months < 2 || d.discountAmount === null
    );
    if (hasEmptyDiscount) {
      errorMessage.value = "Chegirmalar kamida 2 oydan boshlanishi kerak";
      return false;
    }

    // Check for duplicate months
    const months = form.value.discounts.map((d) => d.months);
    const uniqueMonths = new Set(months);
    if (months.length !== uniqueMonths.size) {
      errorMessage.value =
        "Bir xil oylar uchun chegirma takrorlanmasligi kerak";
      return false;
    }
  }

  return true;
};

// Submit function
const onSubmit = async () => {
  // if (!validateForm()) {
  //   return;
  // }

  // loading.value = true;
  // errorMessage.value = "";

  try {
    // Debug: Log original dates
    console.log("Original dates:", {
      courseStartDate: form.value.courseStartDate,
      courseEndDate: form.value.courseEndDate,
    });

    // Convert dates
    const startDateISO = convertDateToISO(form.value.courseStartDate);
    const endDateISO = convertDateToISO(form.value.courseEndDate);

    // Debug: Log converted dates
    console.log("Converted dates:", {
      courseStartDate: startDateISO,
      courseEndDate: endDateISO,
    });

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
      teachers: form.value.teachers.map((t) => ({
        teacherId: t.teacherId,
        isPrimary: t.isPrimary,
      })),
      lessonSchedules: form.value.lessonSchedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      discounts:
        form.value.discounts.length > 0
          ? form.value.discounts.map((d) => ({
              months: d.months,
              discountAmount: d.discountAmount,
            }))
          : undefined,
    };

    const response = await $api("/v1/groups", {
      method: "POST",
      body: payload,
    });

    if (response.success) {
      showSuccess("Guruh muvaffaqiyatli yaratildi!");

      // Show Telegram setup modal instead of redirecting
      if (
        response.setupInstructions?.connectToken ||
        response.data?.connectToken
      ) {
        connectToken.value =
          response.setupInstructions?.connectToken ||
          response.data?.connectToken;
        showTelegramSetupModal.value = true;
      } else {
        // Fallback: redirect if no connect token (shouldn't happen)
        router.push("/groups");
      }
    } else {
      errorMessage.value = response.message || "Xatolik yuz berdi";
    }
  } catch (error) {
    errorMessage.value =
      error.data?.message ||
      error.message ||
      "Guruh yaratishda xatolik yuz berdi";
  } finally {
    loading.value = false;
  }
};

// Cancel and go back
const onCancel = () => {
  router.go(-1);
};

// Handle Telegram setup modal close
const handleSetupModalClose = () => {
  showTelegramSetupModal.value = false;
  router.push("/groups");
};

// Load teachers on mount
onMounted(() => {
  fetchTeachers();
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
        @click="router.go(-1)"
      >
        Orqaga
      </VBtn>

      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon icon="tabler-users-group" class="me-2" />
          <span>Yangi guruh yaratish</span>
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
              <VCol v-if="form.paymentType === 'LESSON_BASED'" cols="12" md="6">
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

              <!-- Teachers Section -->
              <VCol cols="12">
                <div class="d-flex align-center justify-space-between mt-4">
                  <h3 class="text-h5">O'qituvchilar</h3>
                  <VBtn
                    size="small"
                    color="primary"
                    prepend-icon="tabler-plus"
                    @click="addTeacher"
                  >
                    O'qituvchi qo'shish
                  </VBtn>
                </div>
              </VCol>

              <VCol
                v-for="(teacher, index) in form.teachers"
                :key="index"
                cols="12"
              >
                <VCard variant="outlined" class="pa-4">
                  <VRow>
                    <VCol cols="12" md="8">
                      <AppSelect
                        v-model="teacher.teacherId"
                        :items="teachersList"
                        label="O'qituvchi *"
                        placeholder="O'qituvchini tanlang"
                        :loading="loadingTeachers"
                        :rules="[rules.required]"
                      />
                    </VCol>
                    <VCol cols="12" md="4" class="d-flex gap-2">
                      <VCheckbox
                        :model-value="teacher.isPrimary"
                        label="Asosiy o'qituvchi"
                        class="mt-4 block"
                        style="height: 40px"
                        @update:model-value="setPrimaryTeacher(index)"
                      />
                      <VBtn
                        v-if="form.teachers.length > 1"
                        size="small"
                        color="error"
                        class="mt-4"
                        variant="text"
                        icon="tabler-trash"
                        @click="removeTeacher(index)"
                      />
                    </VCol>
                  </VRow>
                </VCard>
              </VCol>

              <!-- Lesson Schedules Section -->
              <VCol cols="12">
                <div class="d-flex align-center justify-space-between mt-4">
                  <h3 class="text-h5">Dars jadvali</h3>
                  <VBtn
                    size="small"
                    color="primary"
                    prepend-icon="tabler-plus"
                    @click="addLessonSchedule"
                  >
                    Jadval qo'shish
                  </VBtn>
                </div>
              </VCol>

              <VCol
                v-for="(schedule, index) in form.lessonSchedules"
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
                        v-if="form.lessonSchedules.length > 1"
                        size="small"
                        color="error"
                        class="mt-6"
                        variant="text"
                        icon="tabler-trash"
                        @click="removeLessonSchedule(index)"
                      />
                    </VCol>
                  </VRow>
                </VCard>
              </VCol>

              <!-- Discounts Section -->
              <VCol cols="12">
                <div class="d-flex align-center mt-4">
                  <h3 class="text-h5 mr-4">Chegirmalar (ixtiyoriy)</h3>
                  <VBtn
                    size="small"
                    color="primary"
                    prepend-icon="tabler-plus"
                    @click="addDiscount"
                  >
                    Chegirma qo'shish
                  </VBtn>
                </div>
              </VCol>

              <VCol cols="12" v-if="form.discounts.length > 0">
                <VAlert
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mb-0"
                >
                  1 oydan ko'p muddatga to'laganda chegirma bo'ladigan holatdagi
                  chegirma turi. Nechta oy uchun to'lasa umumiy qancha chegirma
                  bo'lishini kiriting
                </VAlert>
              </VCol>

              <VCol
                v-if="form.discounts.length > 0"
                v-for="(discount, index) in form.discounts"
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
                        :rules="[rules.requiredNumber]"
                      />
                    </VCol>
                    <VCol cols="12" md="5">
                      <AppTextField
                        v-model="discount.discountAmountDisplay"
                        label="Chegirma miqdori (so'm) *"
                        placeholder="100 000"
                        :rules="[rules.required]"
                        @input="
                          formatDiscountAmount(index, $event.target.value)
                        "
                      />
                    </VCol>
                    <VCol cols="12" md="2">
                      <VBtn
                        size="small"
                        color="error"
                        variant="text"
                        class="mt-6"
                        icon="tabler-trash"
                        @click="removeDiscount(index)"
                      />
                    </VCol>
                  </VRow>
                </VCard>
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
    </VCol>
  </VRow>

  <!-- Telegram Setup Modal -->
  <TelegramSetupModal
    v-model="showTelegramSetupModal"
    :connect-token="connectToken"
    @close="handleSetupModalClose"
  />
</template>

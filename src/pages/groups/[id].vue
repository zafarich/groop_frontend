<script setup>
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue";
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";
import TelegramSetupModal from "@/components/TelegramSetupModal.vue";
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import {prettyMoney, prettyPhoneNumber} from "@/utils/utils";

definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();
const route = useRoute();
const {success: showSuccess, error: showError} = useToast();

// State
const groupId = computed(() => route.params.id);
const group = ref(null);
const loading = ref(false);
const activeTab = ref("all");

// Telegram setup modal state
const showTelegramSetupModal = ref(false);

// Status change state
const isStatusDialogVisible = ref(false);
const statusLoading = ref(false);

// Students state
const students = ref([]);
const studentsLoading = ref(false);
const studentsPagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});
const studentsSearch = ref("");

// Debtors state
const debtors = ref([]);
const debtorsLoading = ref(false);
const debtorsSummary = ref({
  totalDebtors: 0,
  totalDebtAmount: "0",
});

// Discount modal state
const showDiscountModal = ref(false);
const selectedEnrollment = ref(null);
const discountForm = ref({
  customMonthlyPrice: 0,
  customMonthlyPriceDisplay: "",
  discountStartDate: "",
  discountEndDate: "",
  discountReason: "",
});
const discountLoading = ref(false);

// Lesson start date modal state
const showLessonStartDateModal = ref(false);
const selectedLessonEnrollment = ref(null);
const lessonStartDateForm = ref({
  lessonStartDate: "",
});
const lessonStartDateLoading = ref(false);
const prorationInfo = ref(null);

// Bulk expel modal state
const showBulkExpelModal = ref(false);
const bulkExpelForm = ref({
  minDebtAmount: 0,
  minDebtAmountDisplay: "",
  excludeEnrollmentIds: [],
});
const bulkExpelLoading = ref(false);
const expelResult = ref(null);

// Search students for exclusion
const excludeSearchQuery = ref("");
const excludeSearchResults = ref([]);
const excludeSearchLoading = ref(false);
const excludeSearchTimeout = ref(null);

// Get day name in Uzbek
const getDayName = (dayOfWeek) => {
  const days = ["", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];
  return days[dayOfWeek] || "";
};

// Format schedule display
const formatSchedule = (lessonSchedules) => {
  if (!lessonSchedules || lessonSchedules.length === 0) return "-";
  return lessonSchedules
    .map((s) => `${getDayName(s.dayOfWeek)} ${s.startTime}-${s.endTime}`)
    .join(", ");
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

// Get status config
const getStatusConfig = (status) => {
  switch (status) {
    case "ACTIVE":
      return {color: "success", text: "Faol", icon: "tabler-check"};
    case "PENDING":
      return {
        color: "warning",
        text: "Telegram guruhga ulanish kutilmoqda",
        icon: "tabler-clock",
      };
    case "INACTIVE":
      return {color: "error", text: "Faol emas", icon: "tabler-x"};
    default:
      return {color: "default", text: status, icon: "tabler-help"};
  }
};

// Get payment type text
const getPaymentTypeText = (paymentType) => {
  const types = {
    START_TO_END_OF_MONTH: "Oyning boshidan oxirigacha",
    MONTHLY_SAME_DATE: "Har oy bir xil sanada",
    LESSON_BASED: "Darslar asosida",
  };
  return types[paymentType] || paymentType;
};

// Get student status config
const getStudentStatusConfig = (status) => {
  switch (status) {
    case "LEAD":
      return {color: "info", text: "Lead"};
    case "TRIAL":
      return {color: "warning", text: "Sinov darsidagi"};
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
    default:
      return {color: "default", text: status};
  }
};

// Fetch group details
const fetchGroupDetails = async () => {
  loading.value = true;
  try {
    const response = await $api(`/v1/groups/${groupId.value}`, {
      method: "GET",
    });

    if (response.success && response.data) {
      group.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching group details:", error);
    showError("Guruh ma'lumotlarini yuklashda xatolik");
  } finally {
    loading.value = false;
  }
};

// Fetch students
const fetchStudents = async () => {
  studentsLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: studentsPagination.value.page.toString(),
      limit: studentsPagination.value.limit.toString(),
    });

    // Add status filter based on active tab
    if (activeTab.value === "leads") {
      params.append("status", "LEAD");
    } else if (activeTab.value === "trial") {
      params.append("status", "TRIAL");
    } else if (activeTab.value === "active") {
      params.append("status", "ACTIVE");
    }

    if (studentsSearch.value.trim()) {
      params.append("search", studentsSearch.value.trim());
    }

    const response = await $api(
      `/v1/groups/${groupId.value}/students?${params.toString()}`,
      {
        method: "GET",
      }
    );

    if (response.success && response.data) {
      students.value = response.data || [];
      studentsPagination.value = {
        page: response.meta.page,
        limit: response.meta.limit,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      };
    }
  } catch (error) {
    console.error("Error fetching students:", error);
    showError("O'quvchilar ro'yxatini yuklashda xatolik");
  } finally {
    studentsLoading.value = false;
  }
};

// Fetch debtors
const fetchDebtors = async () => {
  debtorsLoading.value = true;
  try {
    const response = await $api(`/v1/groups/${groupId.value}/debtors`, {
      method: "GET",
    });

    if (response.success && response.data) {
      debtors.value = response.data.debtors || [];
      debtorsSummary.value = response.data.summary || {
        totalDebtors: 0,
        totalDebtAmount: "0",
      };
    }
  } catch (error) {
    console.error("Error fetching debtors:", error);
    showError("Qarzdorlar ro'yxatini yuklashda xatolik");
  } finally {
    debtorsLoading.value = false;
  }
};

// Search handler with debounce
const searchTimeout = ref(null);
const onStudentsSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    studentsPagination.value.page = 1;
    fetchStudents();
  }, 500);
};

// Tab change handler
const onTabChange = () => {
  if (activeTab.value === "debtors") {
    fetchDebtors();
  } else {
    studentsPagination.value.page = 1;
    fetchStudents();
  }
};

// Pagination handlers
const onStudentsPageChange = (page) => {
  studentsPagination.value.page = page;
  fetchStudents();
};

const onStudentsLimitChange = (limit) => {
  studentsPagination.value.limit = limit;
  studentsPagination.value.page = 1;
  fetchStudents();
};

// Open telegram setup modal
const openTelegramSetupModal = () => {
  showTelegramSetupModal.value = true;
};

// Handle Telegram setup modal close
const handleSetupModalClose = () => {
  showTelegramSetupModal.value = false;
  fetchGroupDetails();
};

// Copy join link to clipboard
const copyJoinLink = async () => {
  if (!group.value?.joinLink) return;

  try {
    await navigator.clipboard.writeText(group.value.joinLink);
    showSuccess("Havola nusxalandi");
  } catch (error) {
    console.error("Failed to copy link:", error);
    showError("Havolani nusxalashda xatolik");
  }
};

// Navigate to edit page
const goToEdit = () => {
  router.push(`/groups/edit/${groupId.value}`);
};

// Status change handlers
const openStatusDialog = () => {
  isStatusDialogVisible.value = true;
};

const onStatusChange = async () => {
  statusLoading.value = true;
  try {
    const newStatus = group.value.isActive ? "INACTIVE" : "ACTIVE";
    const response = await $api(`/v1/groups/${groupId.value}/status`, {
      method: "PATCH",
      body: {isActive: !group.value.isActive},
    });

    if (response.success) {
      showSuccess(
        `Guruh ${newStatus === "ACTIVE" ? "faollashtirildi" : "faolsizlantirildi"}`
      );
      isStatusDialogVisible.value = false;
      fetchGroupDetails();
    }
  } catch (error) {
    console.error("Error changing status:", error);
    showError("Statusni o'zgartirishda xatolik");
  } finally {
    statusLoading.value = false;
  }
};

// Discount management
const openDiscountModal = (student) => {
  selectedEnrollment.value = student;

  // Initialize form with current values or group price
  const currentPrice = student.customMonthlyPrice
    ? Number(student.customMonthlyPrice)
    : Number(group.value.monthlyPrice);

  discountForm.value = {
    customMonthlyPrice: currentPrice,
    customMonthlyPriceDisplay: prettyMoney(currentPrice),
    discountStartDate: student.discountStartDate
      ? student.discountStartDate.split("T")[0]
      : "",
    discountEndDate: student.discountEndDate
      ? student.discountEndDate.split("T")[0]
      : "",
    discountReason: student.discountReason || "",
  };

  showDiscountModal.value = true;
};

const formatDiscountPrice = (value) => {
  const numericValue = value.replace(/\s/g, "");
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) {
    discountForm.value.customMonthlyPrice = 0;
    discountForm.value.customMonthlyPriceDisplay = "";
  } else {
    discountForm.value.customMonthlyPrice = number;
    discountForm.value.customMonthlyPriceDisplay = prettyMoney(number);
  }
};

const discountAmount = computed(() => {
  if (!group.value) return 0;
  return (
    Number(group.value.monthlyPrice) - discountForm.value.customMonthlyPrice
  );
});

const discountPercentage = computed(() => {
  if (!group.value) return 0;
  if (discountForm.value.customMonthlyPrice === 0) return 100;
  const discount = discountAmount.value;
  return Math.round((discount / Number(group.value.monthlyPrice)) * 100);
});

const isFreeEnrollment = computed(() => {
  return discountForm.value.customMonthlyPrice === 0;
});

const saveDiscount = async () => {
  if (!selectedEnrollment.value) return;

  discountLoading.value = true;
  try {
    const payload = {
      customMonthlyPrice: discountForm.value.customMonthlyPrice,
    };

    if (discountForm.value.discountStartDate) {
      payload.discountStartDate = discountForm.value.discountStartDate;
    }
    if (discountForm.value.discountEndDate) {
      payload.discountEndDate = discountForm.value.discountEndDate;
    }
    if (discountForm.value.discountReason) {
      payload.discountReason = discountForm.value.discountReason;
    }

    const response = await $api(
      `/v1/enrollments/${selectedEnrollment.value.id}/discount`,
      {
        method: "PATCH",
        body: payload,
      }
    );

    if (response.success) {
      showSuccess("Chegirma muvaffaqiyatli belgilandi!");
      showDiscountModal.value = false;
      await fetchStudents();
    }
  } catch (error) {
    console.error("Error assigning discount:", error);
    showError(error.data?.message || "Chegirma belgilashda xatolik yuz berdi");
  } finally {
    discountLoading.value = false;
  }
};

// Lesson start date management
const openLessonStartDateModal = (student) => {
  selectedLessonEnrollment.value = student;
  lessonStartDateForm.value = {
    lessonStartDate: student.lessonStartDate
      ? student.lessonStartDate.split("T")[0]
      : "",
  };
  prorationInfo.value = null;
  showLessonStartDateModal.value = true;
};

const saveLessonStartDate = async () => {
  if (!selectedLessonEnrollment.value) return;
  if (!lessonStartDateForm.value.lessonStartDate) {
    showError("Iltimos, dars boshlanish sanasini tanlang");
    return;
  }

  lessonStartDateLoading.value = true;
  try {
    const response = await $api(
      `/v1/enrollments/${selectedLessonEnrollment.value.id}/lesson-start-date`,
      {
        method: "PATCH",
        body: {
          lessonStartDate: lessonStartDateForm.value.lessonStartDate,
        },
      }
    );

    if (response.success) {
      prorationInfo.value = response.data.proration;
      showSuccess("Dars boshlanish sanasi muvaffaqiyatli o'zgartirildi!");
      showLessonStartDateModal.value = false;
      await fetchStudents();
    }
  } catch (error) {
    console.error("Error updating lesson start date:", error);
    showError(
      error.data?.message || "Dars sanasini o'zgartirishda xatolik yuz berdi"
    );
  } finally {
    lessonStartDateLoading.value = false;
  }
};

// Bulk expel management
const openBulkExpelModal = () => {
  bulkExpelForm.value = {
    minDebtAmount: 0,
    minDebtAmountDisplay: "",
    excludeEnrollmentIds: [],
  };
  expelResult.value = null;
  excludeSearchResults.value = [];
  excludeSearchQuery.value = "";
  showBulkExpelModal.value = true;
};

const formatMinDebtAmount = (value) => {
  const numericValue = value.replace(/\s/g, "");
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) {
    bulkExpelForm.value.minDebtAmount = 0;
    bulkExpelForm.value.minDebtAmountDisplay = "";
  } else {
    bulkExpelForm.value.minDebtAmount = number;
    bulkExpelForm.value.minDebtAmountDisplay = prettyMoney(number);
  }
};

const searchStudentsForExclude = (query) => {
  if (excludeSearchTimeout.value) {
    clearTimeout(excludeSearchTimeout.value);
  }

  if (!query || query.length < 2) {
    excludeSearchResults.value = [];
    return;
  }

  excludeSearchTimeout.value = setTimeout(async () => {
    excludeSearchLoading.value = true;
    try {
      const response = await $api(
        `/v1/groups/${groupId.value}/students/search?search=${encodeURIComponent(query)}&limit=10`,
        {method: "GET"}
      );

      console.log("rerr", response);
      if (response.data.success && response.data.data) {
        excludeSearchResults.value = response.data.data.map((s) => ({
          title: `${s.name} (${prettyPhoneNumber(s.phoneNumber)})`,
          value: s.enrollmentId,
          debt: s.debt,
        }));
      }
    } catch (error) {
      console.error("Error searching students:", error);
    } finally {
      excludeSearchLoading.value = false;
    }
  }, 300);
};

const debtorsToExpel = computed(() => {
  if (!debtors.value || debtors.value.length === 0) return [];
  return debtors.value.filter((d) => {
    const debtAmount = Number(d.debtAmount);
    const isAboveMin = debtAmount >= bulkExpelForm.value.minDebtAmount;
    const isNotExcluded = !bulkExpelForm.value.excludeEnrollmentIds.includes(
      d.enrollmentId
    );
    return isAboveMin && isNotExcluded;
  });
});

const performBulkExpel = async () => {
  if (debtorsToExpel.value.length === 0) {
    showError("Chiqariladigan qarzdor yo'q");
    return;
  }

  bulkExpelLoading.value = true;
  try {
    const response = await $api(
      `/v1/groups/${groupId.value}/debtors/bulk-expel`,
      {
        method: "POST",
        body: {
          minDebtAmount: bulkExpelForm.value.minDebtAmount,
          excludeEnrollmentIds: bulkExpelForm.value.excludeEnrollmentIds,
        },
      }
    );

    if (response.success) {
      expelResult.value = response.data;
      showSuccess(
        response.message ||
          `${response.data.expelledCount} ta qarzdor chiqarildi`
      );
      await fetchDebtors();
    }
  } catch (error) {
    console.error("Error bulk expelling debtors:", error);
    showError(
      error.data?.message || "Qarzdorlarni chiqarishda xatolik yuz berdi"
    );
  } finally {
    bulkExpelLoading.value = false;
  }
};

// Load data on mount
onMounted(() => {
  fetchGroupDetails();
  fetchStudents();
});

// Watch tab changes
watch(activeTab, () => {
  onTabChange();
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
        @click="router.push('/groups')"
      >
        Orqaga
      </VBtn>

      <!-- Loading State -->
      <VCard v-if="loading">
        <VCardText class="text-center py-8">
          <VProgressCircular indeterminate color="primary" />
        </VCardText>
      </VCard>

      <!-- Group Details -->
      <template v-else-if="group">
        <!-- Header Card -->
        <VCard class="mb-4">
          <VCardTitle
            class="d-flex align-center justify-space-between flex-wrap gap-4"
          >
            <div class="d-flex align-center">
              <VIcon icon="tabler-users-group" class="me-2" size="28" />
              <span>{{ group.name }}</span>
            </div>
            <div class="d-flex gap-2">
              <VBtn color="primary" variant="outlined" @click="goToEdit">
                <VIcon icon="tabler-edit" class="me-1" />
                Tahrirlash
              </VBtn>
              <VBtn
                :color="group.isActive ? 'error' : 'success'"
                variant="outlined"
                @click="openStatusDialog"
              >
                <VIcon
                  :icon="group.isActive ? 'tabler-x' : 'tabler-check'"
                  class="me-1"
                />
                {{ group.isActive ? "Faolsizlantirish" : "Faollashtirish" }}
              </VBtn>
            </div>
          </VCardTitle>

          <VDivider />

          <VCardText>
            <VRow>
              <!-- Basic Information -->
              <VCol cols="12" md="6">
                <h3 class="text-h6 mb-3">Asosiy ma'lumotlar</h3>
                <VList density="compact" class="bg-transparent">
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Guruh ID
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1 font-weight-medium">
                      {{ group.id }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Tavsif
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ group.description || "-" }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Oylik to'lov
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1 font-weight-medium">
                      {{ prettyMoney(group.monthlyPrice) }} so'm
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      To'lov turi
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ getPaymentTypeText(group.paymentType) }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem v-if="group.lessonsPerPaymentPeriod" class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Darslar soni (to'lov davri)
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ group.lessonsPerPaymentPeriod }} ta
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Status
                    </VListItemTitle>
                    <VListItemSubtitle>
                      <VChip
                        :color="getStatusConfig(group.status).color"
                        size="small"
                        variant="tonal"
                        :prepend-icon="getStatusConfig(group.status).icon"
                      >
                        {{ getStatusConfig(group.status).text }}
                      </VChip>
                    </VListItemSubtitle>
                  </VListItem>
                </VList>
              </VCol>

              <!-- Dates and Schedule -->
              <VCol cols="12" md="6">
                <h3 class="text-h6 mb-3">Kurs muddati va jadval</h3>
                <VList density="compact" class="bg-transparent">
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Boshlanish sanasi
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ formatDate(group.courseStartDate) }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Tugash sanasi
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ formatDate(group.courseEndDate) }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Dars jadvali
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ formatSchedule(group.lessonSchedules) }}
                    </VListItemSubtitle>
                  </VListItem>
                </VList>
              </VCol>

              <!-- Teachers -->
              <VCol cols="12">
                <h3 class="text-h6 mb-3">O'qituvchilar</h3>
                <VRow>
                  <VCol cols="12" md="4">
                    <div class="d-flex gap-2">
                      <h5
                        v-for="teacher in group.groupTeachers"
                        :key="teacher.id"
                      >
                        {{ teacher.teacher.firstName }}
                        {{ teacher.teacher.lastName }},
                      </h5>
                    </div>
                  </VCol>
                </VRow>
              </VCol>

              <!-- Discounts -->
              <VCol
                v-if="group.discounts && group.discounts.length > 0"
                cols="12"
              >
                <h3 class="text-h6 mb-3">Chegirmalar</h3>
                <VRow>
                  <VCol
                    v-for="discount in group.discounts"
                    :key="discount.months"
                    cols="12"
                    md="3"
                  >
                    <VCard variant="outlined">
                      <VCardText>
                        <div class="text-center">
                          <div class="text-h6 text-primary">
                            {{ discount.months }} oy
                          </div>
                          <div class="text-body-2 text-medium-emphasis">
                            {{ prettyMoney(discount.discountAmount) }} so'm
                          </div>
                        </div>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </VCol>

              <!-- Telegram Connection -->
              <VCol cols="12">
                <h3 class="text-h6 mb-3">Telegram ulanishi</h3>

                <!-- Not Connected -->
                <VAlert
                  v-if="group.status === 'PENDING' && group.connectToken"
                  type="warning"
                  variant="tonal"
                  class="mb-0"
                >
                  <div
                    class="d-flex align-center justify-space-between flex-wrap gap-4"
                  >
                    <div>
                      <div class="text-body-1 font-weight-medium mb-1">
                        Telegram guruhga ulanmagan
                      </div>
                      <div class="text-body-2">
                        Guruh to'liq ishlashi uchun telegram guruhga ulash kerak
                      </div>
                    </div>
                    <VBtn
                      color="warning"
                      variant="elevated"
                      @click="openTelegramSetupModal"
                    >
                      <VIcon icon="tabler-brand-telegram" class="me-1" />
                      Telegram guruhga ulash
                    </VBtn>
                  </div>
                </VAlert>

                <!-- Connected -->
                <VAlert
                  v-else-if="group.joinLink"
                  type="success"
                  variant="tonal"
                  class="mb-0"
                >
                  <div>
                    <div class="text-body-1 font-weight-medium mb-2">
                      <VIcon icon="tabler-check" class="me-1" />
                      Telegram guruhga ulangan
                    </div>
                    <div class="text-body-2 mb-3">
                      O'quvchilar qo'shilish havolasi:
                    </div>
                    <div class="d-flex align-center gap-2">
                      <AppTextField
                        :model-value="group.joinLink"
                        readonly
                        density="compact"
                        variant="outlined"
                        hide-details
                      />
                      <VBtn
                        color="success"
                        variant="elevated"
                        @click="copyJoinLink"
                      >
                        <VIcon icon="tabler-copy" class="me-1" />
                        Nusxalash
                      </VBtn>
                    </div>
                  </div>
                </VAlert>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Students Section -->
        <VCard>
          <VCardTitle>
            <VIcon icon="tabler-users" class="me-2" />
            O'quvchilar
          </VCardTitle>

          <VDivider />

          <!-- Tabs -->
          <VTabs v-model="activeTab" bg-color="transparent">
            <VTab value="all">Barcha</VTab>
            <VTab value="leads">Lead o'quvchilar</VTab>
            <VTab value="trial">Sinov darsidagi o'quvchilar</VTab>
            <VTab value="active">Aktiv o'quvchilar</VTab>
            <VTab value="debtors">
              <VIcon icon="tabler-alert-triangle" class="me-1" size="18" />
              Qarzdorlar
              <VChip
                v-if="debtorsSummary.totalDebtors > 0"
                size="x-small"
                color="error"
                class="ms-2"
              >
                {{ debtorsSummary.totalDebtors }}
              </VChip>
            </VTab>
          </VTabs>

          <VDivider />

          <!-- Debtors Tab Content -->
          <template v-if="activeTab === 'debtors'">
            <!-- Debtors Summary -->
            <VCardText>
              <VAlert type="error" variant="tonal" class="mb-0">
                <div
                  class="d-flex align-center justify-space-between flex-wrap gap-4"
                >
                  <div>
                    <div class="text-body-1 font-weight-medium mb-1">
                      Jami qarzdorlar: {{ debtorsSummary.totalDebtors }} ta
                    </div>
                    <div class="text-body-2">
                      Jami qarz:
                      {{ prettyMoney(debtorsSummary.totalDebtAmount) }} so'm
                    </div>
                  </div>
                  <VBtn
                    v-if="debtors.length > 0"
                    color="error"
                    variant="elevated"
                    @click="openBulkExpelModal"
                  >
                    <VIcon icon="tabler-user-x" class="me-1" />
                    Qarzdorlarni guruhdan chiqarish
                  </VBtn>
                </div>
              </VAlert>
            </VCardText>

            <!-- Debtors Table -->
            <VTable>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ism</th>
                  <th>Familiya</th>
                  <th>Telefon</th>
                  <th>Status</th>
                  <th>Oylik narx</th>
                  <th>Qarz miqdori</th>
                  <th>Oxirgi to'lov</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="debtorsLoading">
                  <td colspan="8" class="text-center py-8">
                    <VProgressCircular indeterminate color="primary" />
                  </td>
                </tr>
                <tr v-else-if="debtors.length === 0">
                  <td colspan="8" class="text-center py-8">
                    <div class="d-flex flex-column align-center">
                      <VIcon
                        icon="tabler-check-circle"
                        size="48"
                        color="success"
                        class="mb-2"
                      />
                      <div class="text-body-1 text-medium-emphasis">
                        Qarzdor o'quvchilar yo'q 🎉
                      </div>
                    </div>
                  </td>
                </tr>
                <tr v-else v-for="debtor in debtors" :key="debtor.enrollmentId">
                  <td>{{ debtor.student.id }}</td>
                  <td>{{ debtor.student.firstName }}</td>
                  <td>{{ debtor.student.lastName }}</td>
                  <td>{{ prettyPhoneNumber(debtor.student.phoneNumber) }}</td>
                  <td>
                    <VChip
                      :color="getStudentStatusConfig(debtor.status).color"
                      size="small"
                      variant="tonal"
                    >
                      {{ getStudentStatusConfig(debtor.status).text }}
                    </VChip>
                  </td>
                  <td>
                    <span v-if="debtor.customMonthlyPrice">
                      {{ prettyMoney(debtor.effectiveMonthlyPrice) }} so'm
                      <VChip
                        size="x-small"
                        color="info"
                        variant="tonal"
                        class="ms-1"
                      >
                        Maxsus
                      </VChip>
                    </span>
                    <span v-else>
                      {{ prettyMoney(debtor.effectiveMonthlyPrice) }} so'm
                    </span>
                  </td>
                  <td>
                    <span class="text-error font-weight-medium">
                      -{{ prettyMoney(debtor.debtAmount) }} so'm
                    </span>
                  </td>
                  <td>{{ formatDate(debtor.lastPaymentDate) }}</td>
                </tr>
              </tbody>
            </VTable>
          </template>

          <!-- Students Tab Content -->
          <template v-else>
            <!-- Search -->
            <VCardText>
              <VRow>
                <VCol cols="12" md="4">
                  <AppTextField
                    v-model="studentsSearch"
                    placeholder="O'quvchi nomi bo'yicha qidirish..."
                    @input="onStudentsSearch"
                  >
                    <template #prepend-inner>
                      <VIcon icon="tabler-search" />
                    </template>
                  </AppTextField>
                </VCol>
              </VRow>
            </VCardText>

            <!-- Students Table -->
            <VTable>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ism</th>
                  <th>Familiya</th>
                  <th>Telefon</th>
                  <th>Status</th>
                  <th>Qo'shilgan sana</th>
                  <th>Balans</th>
                  <th v-if="activeTab === 'active' || activeTab === 'all'">
                    Dars boshlanish
                  </th>
                  <th v-if="activeTab === 'active'">Chegirma</th>
                  <th v-if="activeTab === 'all'">Amallar</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="studentsLoading">
                  <td
                    :colspan="
                      activeTab === 'active' ? 9 : activeTab === 'all' ? 9 : 7
                    "
                    class="text-center py-8"
                  >
                    <VProgressCircular indeterminate color="primary" />
                  </td>
                </tr>
                <tr v-else-if="students.length === 0">
                  <td
                    :colspan="
                      activeTab === 'active' ? 9 : activeTab === 'all' ? 9 : 7
                    "
                    class="text-center py-8"
                  >
                    <div class="text-body-1 text-medium-emphasis">
                      O'quvchilar topilmadi
                    </div>
                  </td>
                </tr>
                <tr v-else v-for="student in students" :key="student.id">
                  <td>{{ student.student.id }}</td>
                  <td>{{ student.student.firstName }}</td>
                  <td>{{ student.student.lastName }}</td>
                  <td>
                    {{ prettyPhoneNumber(student.student.user.phoneNumber) }}
                  </td>
                  <td>
                    <VChip
                      :color="getStudentStatusConfig(student.status).color"
                      size="small"
                      variant="tonal"
                    >
                      {{ getStudentStatusConfig(student.status).text }}
                    </VChip>
                  </td>
                  <td>{{ formatDate(student.joinedAt) }}</td>
                  <td>
                    <span
                      :class="{
                        'text-success': student.balance > 0,
                        'text-error': student.balance < 0,
                      }"
                    >
                      {{ prettyMoney(student.balance) }} so'm
                    </span>
                  </td>
                  <td v-if="activeTab === 'active'">
                    {{ formatDate(student.lessonStartDate) }}
                  </td>
                  <td v-if="activeTab === 'active'">
                    <span v-if="student.individualDiscountAmount > 0">
                      {{ prettyMoney(student.individualDiscountAmount) }} so'm
                    </span>
                    <span v-else-if="student.isFreeEnrollment">
                      <VChip size="small" color="success" variant="tonal">
                        Bepul
                      </VChip>
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td v-if="activeTab === 'all'">
                    {{ formatDate(student.lessonStartDate) }}
                  </td>
                  <td v-if="activeTab === 'all'">
                    <div class="d-flex gap-2">
                      <VBtn
                        size="small"
                        color="secondary"
                        variant="tonal"
                        @click="openLessonStartDateModal(student)"
                      >
                        <VIcon
                          icon="tabler-calendar-event"
                          size="16"
                          class="me-1"
                        />
                        Dars sanasi
                      </VBtn>
                      <VBtn
                        size="small"
                        color="primary"
                        variant="tonal"
                        @click="openDiscountModal(student)"
                      >
                        Chegirma
                      </VBtn>
                    </div>
                  </td>
                </tr>
              </tbody>
            </VTable>

            <!-- Pagination -->
            <VCardText v-if="studentsPagination.totalPages > 1">
              <VRow class="align-center">
                <VCol cols="12" md="6">
                  <div class="d-flex align-center gap-2">
                    <span class="text-body-2">Sahifada:</span>
                    <VSelect
                      :model-value="studentsPagination.limit"
                      :items="[10, 20, 50, 100]"
                      density="compact"
                      variant="outlined"
                      style="max-width: 100px"
                      @update:model-value="onStudentsLimitChange"
                    />
                  </div>
                </VCol>
                <VCol cols="12" md="6" class="d-flex justify-end">
                  <VPagination
                    :model-value="studentsPagination.page"
                    :length="studentsPagination.totalPages"
                    :total-visible="5"
                    @update:model-value="onStudentsPageChange"
                  />
                </VCol>
              </VRow>
              <div class="text-body-2 text-center mt-2">
                Jami: {{ studentsPagination.total }} ta o'quvchi
              </div>
            </VCardText>
          </template>
        </VCard>
      </template>
    </VCol>
  </VRow>

  <!-- Telegram Setup Modal -->
  <TelegramSetupModal
    v-if="group"
    v-model="showTelegramSetupModal"
    :connect-token="group.connectToken"
    @close="handleSetupModalClose"
  />

  <!-- Status Change Confirmation Dialog -->
  <VDialog v-model="isStatusDialogVisible" max-width="500">
    <VCard>
      <VCardTitle class="text-h5 pt-4 px-6"> Statusni o'zgartirish </VCardTitle>
      <VCardText>
        Siz haqiqatan ham guruh statusini
        <strong>{{
          group?.isActive ? "faolsizlantirmoqchi" : "faollashtirmoqchi"
        }}</strong>
        misiz?
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="isStatusDialogVisible = false"
          :disabled="statusLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          :color="group?.isActive ? 'error' : 'success'"
          variant="elevated"
          @click="onStatusChange"
          :loading="statusLoading"
          :disabled="statusLoading"
        >
          Tasdiqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Discount Modal -->
  <VDialog v-model="showDiscountModal" max-width="700">
    <VCard v-if="selectedEnrollment">
      <VCardTitle class="text-h5 pt-4 px-6"> Maxsus narx belgilash </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Student Info -->
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-1">
            <strong>O'quvchi:</strong>
            {{ selectedEnrollment.student.firstName }}
            {{ selectedEnrollment.student.lastName }}
          </div>
          <div class="text-body-2 mt-1">
            <strong>Guruh narxi:</strong>
            {{ prettyMoney(group.monthlyPrice) }} so'm/oy
          </div>
        </VAlert>

        <VRow>
          <!-- Custom Monthly Price -->
          <VCol cols="12">
            <AppTextField
              v-model="discountForm.customMonthlyPriceDisplay"
              label="Maxsus oylik narx *"
              placeholder="500 000"
              @input="formatDiscountPrice($event.target.value)"
            >
              <template #append-inner>
                <span class="text-body-2 text-medium-emphasis">so'm</span>
              </template>
            </AppTextField>

            <!-- Discount Info -->
            <VAlert
              v-if="discountAmount !== 0"
              :type="discountAmount > 0 ? 'success' : 'warning'"
              variant="tonal"
              density="compact"
              class="mt-2"
            >
              <div v-if="discountAmount > 0" class="text-body-2">
                ✅ Chegirma: {{ prettyMoney(discountAmount) }} so'm ({{
                  discountPercentage
                }}%)
              </div>
              <div v-else class="text-body-2">
                ⚠️ Qo'shimcha: {{ prettyMoney(Math.abs(discountAmount)) }} so'm
              </div>
            </VAlert>

            <!-- Free Badge -->
            <VAlert
              v-if="isFreeEnrollment"
              type="success"
              variant="tonal"
              density="compact"
              class="mt-2"
            >
              <div class="text-body-2 font-weight-medium">
                🎁 Bepul o'qitish
              </div>
            </VAlert>
          </VCol>

          <!-- Date Range -->
          <VCol cols="12" md="6">
            <AppDateTimePicker
              v-model="discountForm.discountStartDate"
              placeholder="Boshlanish sanasini tanlang"
              :config="{dateFormat: 'd.m.Y'}"
              label="Boshlanish sanasi"
            >
              <template #append-inner>
                <VIcon icon="tabler-calendar" />
              </template>
            </AppDateTimePicker>
            <div class="text-caption text-medium-emphasis mt-1">
              Bo'sh qoldiring = hozirdan boshlanadi
            </div>
          </VCol>

          <VCol cols="12" md="6">
            <AppDateTimePicker
              v-model="discountForm.discountEndDate"
              placeholder="Tugash sanasini tanlang"
              :config="{dateFormat: 'd.m.Y'}"
              label="Tugash sanasi"
            >
              <template #append-inner>
                <VIcon icon="tabler-calendar" />
              </template>
            </AppDateTimePicker>
            <div class="text-caption text-medium-emphasis mt-1">
              Bo'sh qoldiring = cheksiz
            </div>
          </VCol>

          <!-- Reason -->
          <VCol cols="12">
            <AppTextarea
              v-model="discountForm.discountReason"
              label="Sabab"
              placeholder="Masalan: Ota-onasi o'qituvchi, Nafaqadagi oila a'zosi"
              rows="3"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="showDiscountModal = false"
          :disabled="discountLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          @click="saveDiscount"
          :loading="discountLoading"
          :disabled="discountLoading"
        >
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Lesson Start Date Modal -->
  <VDialog v-model="showLessonStartDateModal" max-width="500">
    <VCard v-if="selectedLessonEnrollment">
      <VCardTitle class="text-h5 pt-4 px-6">
        Dars boshlanish sanasini o'zgartirish
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Student Info -->
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-1">
            <strong>O'quvchi:</strong>
            {{ selectedLessonEnrollment.student.firstName }}
            {{ selectedLessonEnrollment.student.lastName }}
          </div>
          <div class="text-body-2 mt-1">
            <strong>Joriy dars boshlanish sanasi:</strong>
            {{ formatDate(selectedLessonEnrollment.lessonStartDate) }}
          </div>
        </VAlert>

        <!-- Course Date Range Info -->
        <VAlert type="warning" variant="tonal" density="compact" class="mb-4">
          <div class="text-body-2">
            <VIcon icon="tabler-info-circle" size="16" class="me-1" />
            Sana kurs davri ichida bo'lishi kerak:
            {{ formatDate(group.courseStartDate) }} -
            {{ formatDate(group.courseEndDate) }}
          </div>
        </VAlert>

        <!-- Date Picker -->
        <AppDateTimePicker
          v-model="lessonStartDateForm.lessonStartDate"
          placeholder="Yangi dars boshlanish sanasini tanlang"
          :config="{
            dateFormat: 'Y-m-d',
            minDate: group.courseStartDate,
            maxDate: group.courseEndDate,
          }"
          label="Yangi dars boshlanish sanasi *"
        />
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="showLessonStartDateModal = false"
          :disabled="lessonStartDateLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          @click="saveLessonStartDate"
          :loading="lessonStartDateLoading"
          :disabled="lessonStartDateLoading"
        >
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Bulk Expel Modal -->
  <VDialog v-model="showBulkExpelModal" max-width="700" persistent>
    <VCard>
      <VCardTitle class="text-h5 pt-4 px-6">
        <VIcon icon="tabler-user-x" class="me-2" color="error" />
        Qarzdorlarni guruhdan chiqarish
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Result Display -->
        <template v-if="expelResult">
          <VAlert type="success" variant="tonal" class="mb-4">
            <div class="text-body-1 font-weight-medium">
              {{ expelResult.expelledCount }} ta o'quvchi guruhdan chiqarildi
            </div>
          </VAlert>

          <VTable
            v-if="expelResult.expelledEnrollments?.length > 0"
            density="compact"
          >
            <thead>
              <tr>
                <th>Ism</th>
                <th>Telefon</th>
                <th>Qarz</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="student in expelResult.expelledEnrollments"
                :key="student.id"
              >
                <td>{{ student.studentName }}</td>
                <td>{{ prettyPhoneNumber(student.phoneNumber) }}</td>
                <td class="text-error">
                  -{{ prettyMoney(student.debt) }} so'm
                </td>
              </tr>
            </tbody>
          </VTable>
        </template>

        <!-- Form -->
        <template v-else>
          <VAlert type="warning" variant="tonal" class="mb-4">
            <div class="text-body-2">
              <VIcon icon="tabler-alert-triangle" size="18" class="me-1" />
              Diqqat! Bu amal qaytarib bo'lmaydi. Chiqarilgan o'quvchilar
              guruhdan butunlay olib tashlanadi.
            </div>
          </VAlert>

          <!-- Min Debt Amount -->
          <AppTextField
            v-model="bulkExpelForm.minDebtAmountDisplay"
            label="Minimal qarz summasi"
            placeholder="100 000"
            hint="Faqat shu summadan ko'p qarzi bor o'quvchilar chiqariladi"
            persistent-hint
            class="mb-4"
            @input="formatMinDebtAmount($event.target.value)"
          >
            <template #append-inner>
              <span class="text-body-2 text-medium-emphasis">so'm</span>
            </template>
          </AppTextField>

          <!-- Exclude Students Search -->
          <VAutocomplete
            v-model="bulkExpelForm.excludeEnrollmentIds"
            v-model:search="excludeSearchQuery"
            :items="excludeSearchResults"
            :loading="excludeSearchLoading"
            label="Istisno qilinadigan o'quvchilar"
            placeholder="O'quvchi ismini yozing..."
            multiple
            chips
            closable-chips
            clearable
            no-filter
            hide-no-data
            @update:search="searchStudentsForExclude"
          >
            <template #chip="{props, item}">
              <VChip v-bind="props" color="info" closable>
                {{ item.title }}
              </VChip>
            </template>
          </VAutocomplete>

          <!-- Preview -->
          <VDivider class="my-4" />

          <div class="text-body-1 font-weight-medium mb-2">
            Chiqariladigan o'quvchilar: {{ debtorsToExpel.length }} ta
          </div>

          <VTable
            v-if="debtorsToExpel.length > 0"
            density="compact"
            class="mb-4"
          >
            <thead>
              <tr>
                <th>Ism</th>
                <th>Telefon</th>
                <th>Qarz</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="debtor in debtorsToExpel" :key="debtor.enrollmentId">
                <td>
                  {{ debtor.student.firstName }} {{ debtor.student.lastName }}
                </td>
                <td>{{ prettyPhoneNumber(debtor.student.phoneNumber) }}</td>
                <td class="text-error">
                  -{{ prettyMoney(debtor.debtAmount) }} so'm
                </td>
              </tr>
            </tbody>
          </VTable>

          <VAlert v-else type="info" variant="tonal" density="compact">
            Hech qaysi qarzdor tanlangan shartlarga mos kelmaydi
          </VAlert>
        </template>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="showBulkExpelModal = false"
          :disabled="bulkExpelLoading"
        >
          {{ expelResult ? "Yopish" : "Bekor qilish" }}
        </VBtn>
        <VBtn
          v-if="!expelResult"
          color="error"
          variant="elevated"
          @click="performBulkExpel"
          :loading="bulkExpelLoading"
          :disabled="bulkExpelLoading || debtorsToExpel.length === 0"
        >
          <VIcon icon="tabler-user-x" class="me-1" />
          Chiqarish ({{ debtorsToExpel.length }})
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

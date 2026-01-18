<script setup>
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue";
import AppTextarea from "@/@core/components/app-form-elements/AppTextarea.vue";
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";
import TelegramSetupModal from "@/components/TelegramSetupModal.vue";
import BulkActivationModal from "@/components/groups/bulk-activation-modal.vue";
import SendMessageModal from "@/components/groups/send-message-modal.vue";
import StudentMessageModal from "@/components/groups/student-message-modal.vue";
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
const activeTab = ref("students");
const studentStatusFilter = ref("all");

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

// Activatable students (only TRIAL for bulk activation)
const activatableStudents = ref([]);
const activatableStudentsLoading = ref(false);
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

// Bulk activation modal state
const showBulkActivationModal = ref(false);

// Send message modal state
const showSendMessageModal = ref(false);

// Add balance modal state
const showAddBalanceModal = ref(false);
const selectedBalanceEnrollment = ref(null);
const balanceForm = ref({
  amount: 0,
  amountDisplay: "",
  notes: "",
});
const balanceLoading = ref(false);

// Individual expel modal state
const showExpelModal = ref(false);
const selectedExpelEnrollment = ref(null);
const expelForm = ref({
  reason: "",
});
const expelLoading = ref(false);

// Student detail modal state
const showStudentDetailModal = ref(false);
const studentDetail = ref(null);

// Student message modal state
const showStudentMessageModal = ref(false);
const selectedMessageEnrollment = ref(null);

const viewStudentProfile = (student) => {
  const id = student.studentId || student?.student?.id;
  if (id) {
    router.push(`/students/${id}`);
  } else {
    console.error("Student ID missing", student);
    showError("O'quvchi ma'lumotlari to'liq emas");
  }
};

const openStudentMessageModal = (student) => {
  selectedMessageEnrollment.value = student;
  showStudentMessageModal.value = true;
};

// Open telegram chat
const openTelegram = (username) => {
  if (username) {
    window.open(`https://t.me/${username}`, "_blank");
  }
};

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

    case "LEFT_GROUP":
      return {color: "error", text: "Guruhdan chiqqan"};
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

    // Add status filter based on active tab and filter
    if (activeTab.value === "students") {
      if (studentStatusFilter.value === "leads") {
        params.append("status", "LEAD");
      } else if (studentStatusFilter.value === "trial") {
        params.append("status", "TRIAL");
      } else if (studentStatusFilter.value === "active") {
        params.append("status", "ACTIVE");
      } else if (studentStatusFilter.value === "left_group") {
        params.append("status", "LEFT_GROUP");
      } else if (studentStatusFilter.value === "expelled") {
        params.append("status", "EXPELLED");
      }
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
    // Refresh activatable students when in students tab (effectively 'all' context or similar)
    fetchActivatableStudents();
  }
};

// Filter change handler
const onFilterChange = () => {
  studentsPagination.value.page = 1;
  fetchStudents();
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

// Student activation management
const openActivationModal = (student) => {
  selectedLessonEnrollment.value = student;
  lessonStartDateForm.value = {
    lessonStartDate: student.lessonStartDate
      ? student.lessonStartDate.split("T")[0]
      : "",
  };
  prorationInfo.value = null;
  showLessonStartDateModal.value = true;
};

const activateStudent = async () => {
  if (!selectedLessonEnrollment.value) return;
  if (!lessonStartDateForm.value.lessonStartDate) {
    showError("Iltimos, dars boshlanish sanasini tanlang");
    return;
  }

  lessonStartDateLoading.value = true;
  try {
    const response = await $api(
      `/v1/enrollments/${selectedLessonEnrollment.value.id}/activate`,
      {
        method: "PATCH",
        body: {
          lessonStartDate: lessonStartDateForm.value.lessonStartDate,
        },
      }
    );

    if (response.success) {
      showSuccess("O'quvchi muvaffaqiyatli faollashtirildi!");
      showLessonStartDateModal.value = false;
      await fetchStudents();
    }
  } catch (error) {
    console.error("Error activating student:", error);
    showError(
      error.data?.message || "O'quvchini faollashtiriishda xatolik yuz berdi"
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

// Bulk activation management
const openBulkActivationModal = async () => {
  // If in 'students' tab, fetch all TRIAL/LEAD students first
  if (activeTab.value === "students") {
    await fetchActivatableStudents();
  }
  showBulkActivationModal.value = true;
};

const handleBulkActivationSuccess = () => {
  showBulkActivationModal.value = false;
  fetchStudents();
  fetchActivatableStudents(); // Refresh the count after activation
};

// Add balance management
const openAddBalanceModal = (student) => {
  selectedBalanceEnrollment.value = student;
  balanceForm.value = {
    amount: 0,
    amountDisplay: "",
    notes: "",
  };
  showAddBalanceModal.value = true;
};

const formatBalanceAmount = (value) => {
  const numericValue = value.replace(/\s/g, "");
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) {
    balanceForm.value.amount = 0;
    balanceForm.value.amountDisplay = "";
  } else {
    balanceForm.value.amount = number;
    balanceForm.value.amountDisplay = prettyMoney(number);
  }
};

const addBalance = async () => {
  if (!selectedBalanceEnrollment.value) return;
  if (!balanceForm.value.amount || balanceForm.value.amount <= 0) {
    showError("Iltimos, to'lov summasini kiriting");
    return;
  }

  balanceLoading.value = true;
  try {
    const response = await $api(
      `/v1/enrollments/${selectedBalanceEnrollment.value.id}/add-balance`,
      {
        method: "POST",
        body: {
          amount: balanceForm.value.amount,
          notes: balanceForm.value.notes || "",
        },
      }
    );

    if (response.success) {
      const previousBalance = response.data.previousBalance;
      const newBalance = response.data.newBalance;
      showSuccess(
        `To'lov muvaffaqiyatli qo'shildi! Balans: ${prettyMoney(previousBalance)} → ${prettyMoney(newBalance)} so'm`
      );
      showAddBalanceModal.value = false;
      await fetchStudents();
    }
  } catch (error) {
    console.error("Error adding balance:", error);
    showError(error.data?.message || "To'lov qo'shishda xatolik yuz berdi");
  } finally {
    balanceLoading.value = false;
  }
};

// Individual expel management
const openExpelModal = (student) => {
  selectedExpelEnrollment.value = student;
  expelForm.value = {
    reason: "",
  };
  showExpelModal.value = true;
};

const expelStudent = async () => {
  if (!selectedExpelEnrollment.value) return;

  expelLoading.value = true;
  try {
    const response = await $api(
      `/v1/enrollments/${selectedExpelEnrollment.value.id}/expel`,
      {
        method: "PATCH",
        body: {
          reason: expelForm.value.reason || undefined,
        },
      }
    );

    if (response.success) {
      showSuccess("O'quvchi muvaffaqiyatli guruhdan chiqarildi!");
      showExpelModal.value = false;
      await fetchStudents();
      // Also refresh debtors if student was in debt
      if (activeTab.value === "debtors") {
        await fetchDebtors();
      } else {
        await fetchStudents();
      }
    }
  } catch (error) {
    console.error("Error expelling student:", error);
    showError(
      error.data?.message || "O'quvchini chiqarishda xatolik yuz berdi"
    );
  } finally {
    expelLoading.value = false;
  }
};

// Fetch all activatable students (only TRIAL for bulk activation)
const fetchActivatableStudents = async () => {
  activatableStudentsLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: "1",
      limit: "1000", // Get all TRIAL students
      status: "TRIAL", // Only TRIAL students for bulk activation
    });

    const response = await $api(
      `/v1/groups/${groupId.value}/students?${params.toString()}`,
      {
        method: "GET",
      }
    );

    if (response.success && response.data) {
      // Filter only TRIAL students
      const allStudents = response.data || [];
      activatableStudents.value = allStudents.filter(
        (s) => s.status === "TRIAL"
      );
    }
  } catch (error) {
    console.error("Error fetching activatable students:", error);
    // Fallback to current page students filtered
    activatableStudents.value = students.value.filter(
      (s) => s.status === "TRIAL"
    );
  } finally {
    activatableStudentsLoading.value = false;
  }
};

// Get activatable students count for button display (only TRIAL students)
const getActivatableStudentsCount = () => {
  if (studentStatusFilter.value === "trial") {
    return students.value.filter((s) => s.status === "TRIAL").length;
  }
  return activatableStudents.value.filter((s) => s.status === "TRIAL").length;
};

// Get students to pass to bulk activation modal (only TRIAL students)
const getActivatableStudents = () => {
  if (studentStatusFilter.value === "trial") {
    return students.value.filter((s) => s.status === "TRIAL");
  }
  return activatableStudents.value.filter((s) => s.status === "TRIAL");
};

// Load data on mount
onMounted(() => {
  fetchGroupDetails();
  fetchStudents();
  fetchActivatableStudents(); // Fetch all TRIAL/LEAD students for bulk activation
});

// Watch tab changes
watch(activeTab, () => {
  onTabChange();
});

// Watch filter changes
watch(studentStatusFilter, () => {
  onFilterChange();
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
    </VCol>
  </VRow>

  <!-- Loading State -->
  <VRow v-if="loading">
    <VCol cols="12">
      <VCard>
        <VCardText class="text-center py-8">
          <VProgressCircular indeterminate color="primary" />
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Content -->
  <VRow v-else-if="group">
    <!-- Sidebar -->
    <VCol cols="12" md="3">
      <VCard class="mb-4">
        <VCardText class="d-flex flex-column gap-y-4">
          <!-- Header -->
          <div class="d-flex align-center mb-2">
            <VIcon icon="tabler-users-group" class="me-2" size="24" />
            <span class="text-h6 text-truncate" :title="group.name">{{
              group.name
            }}</span>
          </div>

          <!-- Status Chip -->
          <div>
            <VChip
              :color="getStatusConfig(group.status).color"
              size="small"
              variant="tonal"
              :prepend-icon="getStatusConfig(group.status).icon"
              class="w-100 justify-center"
            >
              {{ getStatusConfig(group.status).text }}
            </VChip>
          </div>

          <VDivider />

          <!-- Actions -->
          <div class="d-flex flex-column gap-2">
            <VBtn
              block
              color="info"
              variant="elevated"
              @click="showSendMessageModal = true"
            >
              <VIcon icon="tabler-send" class="me-1" /> Xabar yuborish
            </VBtn>
            <VBtn block color="primary" variant="outlined" @click="goToEdit">
              <VIcon icon="tabler-edit" class="me-1" /> Tahrirlash
            </VBtn>
            <VBtn
              block
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

          <VDivider />

          <!-- Info List -->
          <VList density="compact" class="bg-transparent pa-0">
            <VListItem class="px-0">
              <VListItemTitle class="text-caption text-medium-emphasis"
                >Guruh ID</VListItemTitle
              >
              <VListItemSubtitle class="text-body-2 text-high-emphasis">{{
                group.id
              }}</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <VListItemTitle class="text-caption text-medium-emphasis"
                >Oylik to'lov</VListItemTitle
              >
              <VListItemSubtitle class="text-body-2 text-high-emphasis"
                >{{ prettyMoney(group.monthlyPrice) }} so'm</VListItemSubtitle
              >
            </VListItem>

            <VListItem class="px-0">
              <VListItemTitle class="text-caption text-medium-emphasis"
                >To'lov turi</VListItemTitle
              >
              <VListItemSubtitle class="text-body-2 text-high-emphasis">{{
                getPaymentTypeText(group.paymentType)
              }}</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <VListItemTitle class="text-caption text-medium-emphasis"
                >Boshlanish sanasi</VListItemTitle
              >
              <VListItemSubtitle class="text-body-2 text-high-emphasis">{{
                formatDate(group.courseStartDate)
              }}</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <VListItemTitle class="text-caption text-medium-emphasis"
                >Tugash sanasi</VListItemTitle
              >
              <VListItemSubtitle class="text-body-2 text-high-emphasis">{{
                formatDate(group.courseEndDate)
              }}</VListItemSubtitle>
            </VListItem>

            <VListItem class="px-0">
              <VListItemTitle class="text-caption text-medium-emphasis"
                >Dars jadvali</VListItemTitle
              >
              <VListItemSubtitle class="text-body-2 text-high-emphasis">{{
                formatSchedule(group.lessonSchedules)
              }}</VListItemSubtitle>
            </VListItem>
          </VList>

          <VDivider />

          <!-- Teachers -->
          <div>
            <div class="text-caption text-medium-emphasis mb-1">
              O'qituvchilar
            </div>
            <div
              v-for="teacher in group.groupTeachers"
              :key="teacher.id"
              class="text-body-2 font-weight-medium"
            >
              {{ teacher.teacher.firstName }} {{ teacher.teacher.lastName }}
            </div>
          </div>

          <!-- Telegram -->
          <div
            v-if="group.status === 'PENDING' && group.connectToken"
            class="mt-2"
          >
            <VBtn
              block
              color="warning"
              variant="tonal"
              size="small"
              @click="openTelegramSetupModal"
            >
              <VIcon icon="tabler-brand-telegram" class="me-1" /> Ulanish
            </VBtn>
          </div>
          <div v-else-if="group.joinLink" class="mt-2">
            <VBtn
              block
              color="success"
              variant="tonal"
              size="small"
              @click="copyJoinLink"
            >
              <VIcon icon="tabler-copy" class="me-1" /> Linkni nusxalash
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Main Content -->
    <VCol cols="12" md="9">
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center py-3">
          <div class="d-flex align-center">
            <VIcon icon="tabler-users" class="me-2" />
            O'quvchilar
          </div>
        </VCardTitle>

        <VTabs v-model="activeTab" bg-color="transparent">
          <VTab value="students">O'quvchilar</VTab>
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

        <!-- Debtors Content (ActiveTab = debtors) -->
        <template v-if="activeTab === 'debtors'">
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

        <!-- Students Content (ActiveTab = students) -->
        <template v-else>
          <VCardText>
            <VRow>
              <!-- Search -->
              <VCol cols="12" md="5">
                <AppTextField
                  v-model="studentsSearch"
                  placeholder="Qidirish..."
                  hide-details
                  @input="onStudentsSearch"
                >
                  <template #prepend-inner>
                    <VIcon icon="tabler-search" />
                  </template>
                </AppTextField>
              </VCol>

              <!-- Status Filter -->
              <VCol cols="12" md="3">
                <VSelect
                  v-model="studentStatusFilter"
                  :items="[
                    {title: 'Aktiv', value: 'active'},
                    {title: 'Barchasi', value: 'all'},
                    {title: 'Sinov', value: 'trial'},
                    {title: 'Lead', value: 'leads'},
                    {title: 'Guruhdan chiqqan', value: 'left_group'},
                    {title: 'Chetlatilgan', value: 'expelled'},
                  ]"
                  label="Status"
                  hide-details
                />
              </VCol>

              <!-- Bulk Action -->
              <VCol cols="12" md="4" class="text-end">
                <VBtn
                  color="primary"
                  variant="elevated"
                  @click="openBulkActivationModal"
                  :disabled="getActivatableStudentsCount() === 0"
                  :loading="activatableStudentsLoading"
                >
                  <VIcon icon="tabler-users-plus" class="me-1" />
                  Ommaviy faollashtirish
                  <VChip
                    v-if="getActivatableStudentsCount() > 0"
                    size="small"
                    color="white"
                    text-color="primary"
                    class="ms-2"
                  >
                    {{ getActivatableStudentsCount() }}
                  </VChip>
                </VBtn>
              </VCol>
            </VRow>
          </VCardText>

          <!-- Students Table -->
          <VTable>
            <thead>
              <tr>
                <th>Ism Familiya</th>
                <th>Status</th>
                <th>Balans</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              <!-- Loading -->
              <tr v-if="studentsLoading">
                <td colspan="4" class="text-center py-8">
                  <VProgressCircular indeterminate color="primary" />
                </td>
              </tr>
              <!-- Empty -->
              <tr v-else-if="students.length === 0">
                <td colspan="4" class="text-center py-8">
                  <div class="text-body-1 text-medium-emphasis">
                    O'quvchilar topilmadi
                  </div>
                </td>
              </tr>
              <!-- Rows -->
              <tr v-else v-for="student in students" :key="student.id">
                <td>
                  <div class="d-flex flex-column">
                    <span class="font-weight-medium">
                      {{ student.student.firstName }}
                      {{ student.student.lastName }}
                    </span>
                    <span class="text-caption text-medium-emphasis">
                      {{ prettyPhoneNumber(student.student.user.phoneNumber) }}
                    </span>
                  </div>
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
                <td>
                  <span
                    :class="{
                      'text-success': student.balance >= 0,
                      'text-error': student.balance < 0,
                    }"
                  >
                    {{ prettyMoney(student.balance) }} so'm
                  </span>
                </td>

                <!-- Actions -->
                <td>
                  <div class="d-flex align-center gap-2">
                    <VBtn
                      icon
                      size="small"
                      color="default"
                      variant="text"
                      @click="viewStudentProfile(student)"
                    >
                      <VIcon icon="tabler-eye" />
                      <VTooltip activator="parent" location="top"
                        >Profilni ko'rish</VTooltip
                      >
                    </VBtn>

                    <VMenu>
                      <template #activator="{props}">
                        <VBtn
                          size="small"
                          color="primary"
                          variant="tonal"
                          v-bind="props"
                        >
                          Amallar
                          <VIcon
                            icon="tabler-chevron-down"
                            size="16"
                            class="ms-1"
                          />
                        </VBtn>
                      </template>
                      <VList>
                        <VListItem
                          v-if="
                            student.status === 'TRIAL' ||
                            student.status === 'LEAD'
                          "
                          @click="openActivationModal(student)"
                        >
                          <template #prepend
                            ><VIcon icon="tabler-check" color="success"
                          /></template>
                          <VListItemTitle>Faollashtirish</VListItemTitle>
                        </VListItem>
                        <VListItem @click="openDiscountModal(student)">
                          <template #prepend
                            ><VIcon icon="tabler-discount" color="primary"
                          /></template>
                          <VListItemTitle>Chegirma belgilash</VListItemTitle>
                        </VListItem>
                        <VListItem @click="openAddBalanceModal(student)">
                          <template #prepend
                            ><VIcon icon="tabler-cash" color="success"
                          /></template>
                          <VListItemTitle>To'lov qo'shish</VListItemTitle>
                        </VListItem>
                        <VListItem @click="openStudentMessageModal(student)">
                          <template #prepend
                            ><VIcon icon="tabler-send" color="info"
                          /></template>
                          <VListItemTitle>Xabar yuborish</VListItemTitle>
                        </VListItem>
                        <VListItem
                          v-if="student.student?.user?.telegramUser?.username"
                          @click="
                            openTelegram(
                              student.student.user.telegramUser.username
                            )
                          "
                        >
                          <template #prepend
                            ><VIcon
                              icon="tabler-brand-telegram"
                              color="primary"
                          /></template>
                          <VListItemTitle>Telegramdan yozish</VListItemTitle>
                        </VListItem>
                        <VListItem @click="openExpelModal(student)">
                          <template #prepend
                            ><VIcon icon="tabler-user-x" color="error"
                          /></template>
                          <VListItemTitle>Guruhdan chetlatish</VListItemTitle>
                        </VListItem>
                      </VList>
                    </VMenu>
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

  <!-- Student Activation Modal -->
  <VDialog v-model="showLessonStartDateModal" max-width="500">
    <VCard v-if="selectedLessonEnrollment">
      <VCardTitle class="text-h5 pt-4 px-6">
        O'quvchini faollashtirish
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
            <strong>Status:</strong>
            <VChip
              :color="
                getStudentStatusConfig(selectedLessonEnrollment.status).color
              "
              size="small"
              variant="tonal"
              class="ms-2"
            >
              {{ getStudentStatusConfig(selectedLessonEnrollment.status).text }}
            </VChip>
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
          placeholder="Dars boshlanish sanasini tanlang"
          :config="{
            dateFormat: 'Y-m-d',
            minDate: group.courseStartDate,
            maxDate: group.courseEndDate,
          }"
          label="Dars boshlanish sanasi *"
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
          @click="activateStudent"
          :loading="lessonStartDateLoading"
          :disabled="lessonStartDateLoading"
        >
          Faollashtirish
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

  <!-- Add Balance Modal -->
  <VDialog v-model="showAddBalanceModal" max-width="600">
    <VCard v-if="selectedBalanceEnrollment">
      <VCardTitle class="text-h5 pt-4 px-6">
        <VIcon icon="tabler-cash" class="me-2" color="success" />
        To'lov qo'shish
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Student Info -->
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-1">
            <strong>O'quvchi:</strong>
            {{ selectedBalanceEnrollment.student.firstName }}
            {{ selectedBalanceEnrollment.student.lastName }}
          </div>
          <div class="text-body-2 mt-1">
            <strong class="mr-2">Hozirgi balans:</strong>
            <span
              :class="{
                'text-success': selectedBalanceEnrollment.balance > 0,
                'text-error': selectedBalanceEnrollment.balance < 0,
              }"
            >
              {{ prettyMoney(selectedBalanceEnrollment.balance) }} so'm
            </span>
          </div>
        </VAlert>

        <VRow>
          <!-- Amount Input -->
          <VCol cols="12">
            <AppTextField
              v-model="balanceForm.amountDisplay"
              label="To'lov summasi *"
              placeholder="50 000"
              @input="formatBalanceAmount($event.target.value)"
            >
              <template #append-inner>
                <span class="text-body-2 text-medium-emphasis">so'm</span>
              </template>
            </AppTextField>
          </VCol>

          <!-- Notes Input -->
          <VCol cols="12">
            <AppTextarea
              v-model="balanceForm.notes"
              label="Izoh"
              placeholder="Masalan: Telegram orqali qabul qilingan to'lov"
              rows="3"
            />
          </VCol>
        </VRow>

        <!-- Preview new balance -->
        <VAlert
          v-if="balanceForm.amount > 0"
          type="success"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          <div class="text-body-2">
            Yangi balans:
            {{
              prettyMoney(
                Number(selectedBalanceEnrollment.balance) + balanceForm.amount
              )
            }}
            so'm
          </div>
        </VAlert>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="showAddBalanceModal = false"
          :disabled="balanceLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="success"
          variant="elevated"
          @click="addBalance"
          :loading="balanceLoading"
          :disabled="balanceLoading || balanceForm.amount <= 0"
        >
          <VIcon icon="tabler-check" class="me-1" />
          Qo'shish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Individual Expel Modal -->
  <VDialog v-model="showExpelModal" max-width="600">
    <VCard v-if="selectedExpelEnrollment">
      <VCardTitle class="text-h5 pt-4 px-6">
        <VIcon icon="tabler-user-x" class="me-2" color="error" />
        Guruhdan chetlatish
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Student Info -->
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-1">
            <strong>O'quvchi:</strong>
            {{ selectedExpelEnrollment.student.firstName }}
            {{ selectedExpelEnrollment.student.lastName }}
          </div>
          <div class="text-body-2 mt-1">
            <strong>Status:</strong>
            <VChip
              :color="
                getStudentStatusConfig(selectedExpelEnrollment.status).color
              "
              size="small"
              variant="tonal"
              class="ms-2"
            >
              {{ getStudentStatusConfig(selectedExpelEnrollment.status).text }}
            </VChip>
          </div>
        </VAlert>

        <!-- Warning -->
        <VAlert type="warning" variant="tonal" class="mb-4">
          <div class="text-body-2">
            <VIcon icon="tabler-alert-triangle" size="18" class="me-1" />
            Diqqat! Bu amal qaytarib bo'lmaydi. O'quvchi guruhdan butunlay
            chiqariladi va Telegram guruhidan ban qilinadi.
          </div>
        </VAlert>

        <!-- Reason Input -->
        <AppTextarea
          v-model="expelForm.reason"
          label="Sabab (ixtiyoriy)"
          placeholder="Masalan: 3 oy to'lov qilmadingiz"
          rows="3"
          hint="Sabab o'quvchiga Telegram orqali yuboriladi"
          persistent-hint
        />
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="showExpelModal = false"
          :disabled="expelLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="error"
          variant="elevated"
          @click="expelStudent"
          :loading="expelLoading"
          :disabled="expelLoading"
        >
          <VIcon icon="tabler-user-x" class="me-1" />
          Chetlatish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Bulk Activation Modal -->
  <BulkActivationModal
    v-if="group"
    v-model="showBulkActivationModal"
    :group-id="groupId"
    :students="getActivatableStudents()"
    :course-start-date="group.courseStartDate"
    :course-end-date="group.courseEndDate"
    @activation-success="handleBulkActivationSuccess"
  />

  <!-- Send Message Modal -->
  <SendMessageModal
    v-if="group"
    v-model="showSendMessageModal"
    :group-id="groupId"
    @message-sent="showSendMessageModal = false"
  />

  <!-- Student Message Modal (Single Student) -->
  <StudentMessageModal
    v-model="showStudentMessageModal"
    :enrollment="selectedMessageEnrollment"
    @message-sent="showStudentMessageModal = false"
  />

  <!-- Student Detail Modal -->
  <VDialog v-model="showStudentDetailModal" max-width="600">
    <VCard v-if="studentDetail">
      <VCardTitle
        class="text-h5 pt-4 px-6 d-flex justify-space-between align-center"
      >
        <span>O'quvchi ma'lumotlari</span>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="showStudentDetailModal = false"
        />
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VList class="card-list" density="compact">
          <VListItem>
            <template #prepend>
              <VAvatar color="primary" variant="tonal" size="34" class="me-3">
                <VIcon size="20" icon="tabler-user" />
              </VAvatar>
            </template>
            <VListItemTitle class="font-weight-medium">
              {{ studentDetail.student.firstName }}
              {{ studentDetail.student.lastName }}
            </VListItemTitle>
            <VListItemSubtitle>To'liq ism</VListItemSubtitle>
          </VListItem>

          <VListItem>
            <template #prepend>
              <VAvatar color="info" variant="tonal" size="34" class="me-3">
                <VIcon size="20" icon="tabler-id" />
              </VAvatar>
            </template>
            <VListItemTitle class="font-weight-medium">
              {{ studentDetail.student.id }}
            </VListItemTitle>
            <VListItemSubtitle>ID</VListItemSubtitle>
          </VListItem>

          <VListItem>
            <template #prepend>
              <VAvatar color="success" variant="tonal" size="34" class="me-3">
                <VIcon size="20" icon="tabler-phone" />
              </VAvatar>
            </template>
            <VListItemTitle class="font-weight-medium">
              {{ prettyPhoneNumber(studentDetail.student.user.phoneNumber) }}
            </VListItemTitle>
            <VListItemSubtitle>Telefon raqam</VListItemSubtitle>
          </VListItem>

          <VListItem>
            <template #prepend>
              <VAvatar
                :color="getStudentStatusConfig(studentDetail.status).color"
                variant="tonal"
                size="34"
                class="me-3"
              >
                <VIcon
                  size="20"
                  :icon="
                    getStudentStatusConfig(studentDetail.status).icon ||
                    'tabler-info-circle'
                  "
                />
              </VAvatar>
            </template>
            <VListItemTitle class="font-weight-medium">
              <VChip
                :color="getStudentStatusConfig(studentDetail.status).color"
                size="small"
                variant="tonal"
              >
                {{ getStudentStatusConfig(studentDetail.status).text }}
              </VChip>
            </VListItemTitle>
            <VListItemSubtitle>Status</VListItemSubtitle>
          </VListItem>

          <VListItem>
            <template #prepend>
              <VAvatar color="warning" variant="tonal" size="34" class="me-3">
                <VIcon size="20" icon="tabler-calendar" />
              </VAvatar>
            </template>
            <VListItemTitle class="font-weight-medium">
              {{ formatDate(studentDetail.joinedAt) }}
            </VListItemTitle>
            <VListItemSubtitle>Qo'shilgan sana</VListItemSubtitle>
          </VListItem>

          <VListItem>
            <template #prepend>
              <VAvatar color="primary" variant="tonal" size="34" class="me-3">
                <VIcon size="20" icon="tabler-calendar-time" />
              </VAvatar>
            </template>
            <VListItemTitle class="font-weight-medium">
              {{
                studentDetail.lessonStartDate
                  ? formatDate(studentDetail.lessonStartDate)
                  : "-"
              }}
            </VListItemTitle>
            <VListItemSubtitle>Dars boshlanish sanasi</VListItemSubtitle>
          </VListItem>

          <VListItem>
            <template #prepend>
              <VAvatar
                :color="studentDetail.balance >= 0 ? 'success' : 'error'"
                variant="tonal"
                size="34"
                class="me-3"
              >
                <VIcon size="20" icon="tabler-wallet" />
              </VAvatar>
            </template>
            <VListItemTitle class="font-weight-medium">
              <span
                :class="
                  studentDetail.balance >= 0 ? 'text-success' : 'text-error'
                "
              >
                {{ prettyMoney(studentDetail.balance) }} so'm
              </span>
            </VListItemTitle>
            <VListItemSubtitle>Balans</VListItemSubtitle>
          </VListItem>

          <VListItem>
            <template #prepend>
              <VAvatar color="secondary" variant="tonal" size="34" class="me-3">
                <VIcon size="20" icon="tabler-discount" />
              </VAvatar>
            </template>
            <VListItemTitle class="font-weight-medium">
              <span v-if="studentDetail.individualDiscountAmount > 0">
                {{ prettyMoney(studentDetail.individualDiscountAmount) }} so'm
              </span>
              <span v-else-if="studentDetail.isFreeEnrollment">
                <VChip size="small" color="success" variant="tonal">
                  Bepul
                </VChip>
              </span>
              <span v-else>Mavjud emas</span>
            </VListItemTitle>
            <VListItemSubtitle>Chegirma</VListItemSubtitle>
          </VListItem>
        </VList>
      </VCardText>
    </VCard>
  </VDialog>
</template>

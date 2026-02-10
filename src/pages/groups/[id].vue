<script setup>
import TelegramSetupModal from "@/components/TelegramSetupModal.vue";
import BulkActivationModal from "@/components/groups/bulk-activation-modal.vue";
import SendMessageModal from "@/components/groups/send-message-modal.vue";
import StudentMessageModal from "@/components/groups/student-message-modal.vue";
import {
  GroupSidebar,
  GroupStudentsTab,
  GroupDebtorsTab,
  GroupDiscountedTab,
  GroupTelegramStudentsTab,
  DiscountModal,
  LessonStartDateModal,
  AddBalanceModal,
  ExpelModal,
  BulkExpelModal,
  StatusConfirmModal,
  PromiseToPayModal,
  BulkRemoveTrialModal,
  BanStudentModal,
} from "@/components/groups";
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

// Channel type detection
const isChannel = computed(() => group.value?.telegramResourceType === 'PRIVATE_CHANNEL');
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

// Sort state
const sortBy = ref('joinedAt');
const sortOrder = ref('desc');

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

// Discounted students state
const discountedStudents = ref([]);
const discountedStudentsLoading = ref(false);

// Telegram students state
const telegramStudents = ref([]);
const telegramStudentsLoading = ref(false);
const telegramStudentsSummary = ref({
  total: 0,
  trialCount: 0,
  activeCount: 0,
});
const telegramStudentsPagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

// Modal states
const showDiscountModal = ref(false);
const showLessonStartDateModal = ref(false);
const showAddBalanceModal = ref(false);
const showExpelModal = ref(false);
const showBulkExpelModal = ref(false);
const showBulkActivationModal = ref(false);
const showBulkRemoveTrialModal = ref(false);
const showSendMessageModal = ref(false);
const showStudentMessageModal = ref(false);
const showPromiseToPayModal = ref(false);
const showBanStudentModal = ref(false);

// Selected items for modals
const selectedEnrollment = ref(null);
const selectedMessageEnrollment = ref(null);

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
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
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
      } else if (studentStatusFilter.value === "dropped") {
        params.append("status", "DROPPED");
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
      },
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

// Fetch discounted students
const fetchDiscountedStudents = async () => {
  discountedStudentsLoading.value = true;
  try {
    const response = await $api(
      `/v1/groups/${groupId.value}/students/discounted`,
      {
        method: "GET",
      },
    );

    if (response.success && response.data) {
      discountedStudents.value = response.data.students || [];
    }
  } catch (error) {
    console.error("Error fetching discounted students:", error);
    showError("Chegirmali o'quvchilar ro'yxatini yuklashda xatolik");
  } finally {
    discountedStudentsLoading.value = false;
  }
};

// Fetch Telegram students (TRIAL and ACTIVE from Telegram)
const fetchTelegramStudents = async () => {
  telegramStudentsLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: telegramStudentsPagination.value.page.toString(),
      limit: telegramStudentsPagination.value.limit.toString(),
    });

    const response = await $api(
      `/v1/groups/${groupId.value}/telegram-students?${params.toString()}`,
      {
        method: "GET",
      },
    );

    if (response.success && response.data) {
      telegramStudents.value = response.data.students || [];
      telegramStudentsSummary.value = response.data.summary || {
        total: 0,
        trialCount: 0,
        activeCount: 0,
      };
      if (response.meta) {
        telegramStudentsPagination.value.total = response.meta.total;
        telegramStudentsPagination.value.totalPages = response.meta.totalPages;
      }
    }
  } catch (error) {
    console.error("Error fetching Telegram students:", error);
    showError("Telegram o'quvchilar ro'yxatini yuklashda xatolik");
  } finally {
    telegramStudentsLoading.value = false;
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
  } else if (activeTab.value === "students-with-discount") {
    fetchDiscountedStudents();
  } else if (activeTab.value === "telegram-students") {
    fetchTelegramStudents();
  } else {
    studentsPagination.value.page = 1;
    fetchStudents();
    fetchActivatableStudents();
  }
};

// Filter change handler
const onFilterChange = () => {
  studentsPagination.value.page = 1;
  fetchStudents();
};

// Promise to Pay
const openPromiseToPayModal = (student) => {
  selectedEnrollment.value = student;
  showPromiseToPayModal.value = true;
};

// Ban Student
const openBanStudentModal = (student) => {
  selectedEnrollment.value = student;
  showBanStudentModal.value = true;
};

// Bulk Remove Trial
const openBulkRemoveTrialModal = () => {
  showBulkRemoveTrialModal.value = true;
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

const onStudentsPaginationUpdate = (newPagination) => {
  const pageChanged = studentsPagination.value.page !== newPagination.page;
  const limitChanged = studentsPagination.value.limit !== newPagination.limit;
  studentsPagination.value = newPagination;
  if (pageChanged || limitChanged) {
    fetchStudents();
  }
};

const onTelegramStudentsPageChange = (page) => {
  telegramStudentsPagination.value.page = page;
  fetchTelegramStudents();
};

const onTelegramStudentsLimitChange = (limit) => {
  telegramStudentsPagination.value.limit = limit;
  telegramStudentsPagination.value.page = 1;
  fetchTelegramStudents();
};

const onTelegramStudentsPaginationUpdate = (newPagination) => {
  const pageChanged = telegramStudentsPagination.value.page !== newPagination.page;
  const limitChanged = telegramStudentsPagination.value.limit !== newPagination.limit;
  telegramStudentsPagination.value = newPagination;
  if (pageChanged || limitChanged) {
    fetchTelegramStudents();
  }
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
      const typeLabel = isChannel.value ? 'Kanal' : 'Guruh';
      showSuccess(
        `${typeLabel} ${newStatus === "ACTIVE" ? "faollashtirildi" : "faolsizlantirildi"}`,
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
  showDiscountModal.value = true;
};

const saveDiscount = async (data) => {
  if (!selectedEnrollment.value) return;

  try {
    const response = await $api(
      `/v1/enrollments/${selectedEnrollment.value.id}/discount`,
      {
        method: "PATCH",
        body: data,
      },
    );

    if (response.success) {
      showSuccess("Chegirma muvaffaqiyatli belgilandi!");
      showDiscountModal.value = false;
      await fetchStudents();
    }
  } catch (error) {
    console.error("Error assigning discount:", error);
    showError(error.data?.message || "Chegirma belgilashda xatolik yuz berdi");
  }
};

// Student activation management
const openActivationModal = (student) => {
  selectedEnrollment.value = student;
  showLessonStartDateModal.value = true;
};

const activateStudent = async (lessonStartDate) => {
  if (!selectedEnrollment.value || !lessonStartDate) return;

  try {
    const response = await $api(
      `/v1/enrollments/${selectedEnrollment.value.id}/activate`,
      {
        method: "PATCH",
        body: {lessonStartDate},
      },
    );

    if (response.success) {
      showSuccess(isChannel.value ? "Obunachi muvaffaqiyatli faollashtirildi!" : "O'quvchi muvaffaqiyatli faollashtirildi!");
      showLessonStartDateModal.value = false;
      await fetchStudents();
    }
  } catch (error) {
    console.error("Error activating student:", error);
    showError(
      error.data?.message || (isChannel.value ? "Obunachini faollashtiriishda xatolik yuz berdi" : "O'quvchini faollashtiriishda xatolik yuz berdi"),
    );
  }
};

// Bulk expel management
const openBulkExpelModal = () => {
  showBulkExpelModal.value = true;
};

const searchStudentsForExclude = async ({query, callback}) => {
  try {
    const response = await $api(
      `/v1/groups/${groupId.value}/students/search?search=${encodeURIComponent(query)}&limit=10`,
      {method: "GET"},
    );

    if (response.data?.success && response.data.data) {
      callback(response.data.data);
    }
  } catch (error) {
    console.error("Error searching students:", error);
  }
};

const performBulkExpel = async ({minDebtAmount, excludeEnrollmentIds, onSuccess}) => {
  try {
    const response = await $api(
      `/v1/groups/${groupId.value}/debtors/bulk-expel`,
      {
        method: "POST",
        body: {
          minDebtAmount,
          excludeEnrollmentIds,
        },
      },
    );

    if (response.success) {
      onSuccess?.(response.data);
      showSuccess(
        response.message ||
          `${response.data.expelledCount} ta qarzdor chiqarildi`,
      );
      await fetchDebtors();
    }
  } catch (error) {
    console.error("Error bulk expelling debtors:", error);
    showError(
      error.data?.message || "Qarzdorlarni chiqarishda xatolik yuz berdi",
    );
  }
};

// Bulk activation management
const openBulkActivationModal = async () => {
  if (activeTab.value === "students") {
    await fetchActivatableStudents();
  }
  showBulkActivationModal.value = true;
};

const handleBulkActivationSuccess = () => {
  showBulkActivationModal.value = false;
  fetchStudents();
  fetchActivatableStudents();
};

// Add balance management
const openAddBalanceModal = (student) => {
  selectedEnrollment.value = student;
  showAddBalanceModal.value = true;
};

const addBalance = async (data) => {
  if (!selectedEnrollment.value) return;

  try {
    const response = await $api(
      `/v1/enrollments/${selectedEnrollment.value.id}/add-balance`,
      {
        method: "POST",
        body: data,
      },
    );

    if (response.success) {
      const previousBalance = response.data.previousBalance;
      const newBalance = response.data.newBalance;
      showSuccess(
        `To'lov muvaffaqiyatli qo'shildi! Balans: ${prettyMoney(previousBalance)} → ${prettyMoney(newBalance)} so'm`,
      );
      showAddBalanceModal.value = false;
      await fetchStudents();
    }
  } catch (error) {
    console.error("Error adding balance:", error);
    showError(error.data?.message || "To'lov qo'shishda xatolik yuz berdi");
  }
};

// Individual expel management
const openExpelModal = (student) => {
  selectedEnrollment.value = student;
  showExpelModal.value = true;
};

const expelStudent = async (reason) => {
  if (!selectedEnrollment.value) return;

  try {
    const response = await $api(
      `/v1/enrollments/${selectedEnrollment.value.id}/expel`,
      {
        method: "PATCH",
        body: {
          reason: reason || undefined,
        },
      },
    );

    if (response.success) {
      showSuccess(isChannel.value ? "Obunachi muvaffaqiyatli kanaldan chiqarildi!" : "O'quvchi muvaffaqiyatli guruhdan chiqarildi!");
      showExpelModal.value = false;
      await fetchStudents();
      if (activeTab.value === "debtors") {
        await fetchDebtors();
      }
    }
  } catch (error) {
    console.error("Error expelling student:", error);
    showError(
      error.data?.message || "O'quvchini chiqarishda xatolik yuz berdi",
    );
  }
};

// Fetch all activatable students (only TRIAL for bulk activation)
const fetchActivatableStudents = async () => {
  activatableStudentsLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: "1",
      limit: "1000",
      status: "TRIAL",
    });

    const response = await $api(
      `/v1/groups/${groupId.value}/students?${params.toString()}`,
      {
        method: "GET",
      },
    );

    if (response.success && response.data) {
      const allStudents = response.data || [];
      activatableStudents.value = allStudents.filter(
        (s) => s.status === "TRIAL",
      );
    }
  } catch (error) {
    console.error("Error fetching activatable students:", error);
    activatableStudents.value = students.value.filter(
      (s) => s.status === "TRIAL",
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

// View student profile
const viewStudentProfile = (student) => {
  const id = student.studentId || student?.student?.id || student?.id;
  if (id) {
    router.push(`/students/${id}`);
  } else {
    console.error("Student ID missing", student);
    showError("O'quvchi ma'lumotlari to'liq emas");
  }
};

// Open student message modal
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

// Load data on mount
onMounted(() => {
  fetchGroupDetails();
  fetchStudents();
  fetchActivatableStudents();
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
      <GroupSidebar
        :group="group"
        @send-message="showSendMessageModal = true"
        @edit="goToEdit"
        @toggle-status="openStatusDialog"
        @setup-telegram="openTelegramSetupModal"
        @copy-link="copyJoinLink"
      />
    </VCol>

    <!-- Main Content -->
    <VCol cols="12" md="9">
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center py-3">
          <div class="d-flex align-center">
            <VIcon icon="tabler-users" class="me-2" />
            {{ isChannel ? 'Obunachilar' : "O'quvchilar" }}
          </div>
        </VCardTitle>

        <VTabs v-model="activeTab" bg-color="transparent">
          <VTab value="students">{{ isChannel ? 'Obunachilar' : "O'quvchilar" }}</VTab>
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
          <VTab value="students-with-discount">
            <VIcon icon="tabler-discount-2" class="me-1" size="18" />
            Chegirmalilar
          </VTab>
          <VTab value="telegram-students">
            <VIcon icon="tabler-brand-telegram" class="me-1" size="18" />
            Telegram guruhdagilar
            <VChip
              v-if="telegramStudentsSummary.total > 0"
              size="x-small"
              color="info"
              class="ms-2"
            >
              {{ telegramStudentsSummary.total }}
            </VChip>
          </VTab>
        </VTabs>
        <VDivider />

        <!-- Debtors Content -->
        <GroupDebtorsTab
          v-if="activeTab === 'debtors'"
          :debtors="debtors"
          :loading="debtorsLoading"
          :summary="debtorsSummary"
          @open-bulk-expel="openBulkExpelModal"
          @view-student="(id) => router.push(`/students/${id}`)"
        />

        <!-- Discounted Students Content -->
        <GroupDiscountedTab
          v-else-if="activeTab === 'students-with-discount'"
          :students="discountedStudents"
          :loading="discountedStudentsLoading"
          @edit-discount="openDiscountModal"
          @view-student="(id) => router.push(`/students/${id}`)"
        />

        <!-- Telegram Students Content -->
        <GroupTelegramStudentsTab
          v-else-if="activeTab === 'telegram-students'"
          :students="telegramStudents"
          :loading="telegramStudentsLoading"
          :pagination="telegramStudentsPagination"
          :summary="telegramStudentsSummary"
          @update:pagination="onTelegramStudentsPaginationUpdate"
          @view-student="viewStudentProfile"
          @open-activation="openActivationModal"
          @open-discount="openDiscountModal"
          @open-add-balance="openAddBalanceModal"
          @open-message="openStudentMessageModal"
          @open-telegram="openTelegram"
          @open-expel="openExpelModal"
        />

        <!-- Students Content -->
        <GroupStudentsTab
          v-else
          :students="students"
          :loading="studentsLoading"
          :pagination="studentsPagination"
          v-model:search="studentsSearch"
          v-model:status-filter="studentStatusFilter"
          v-model:sort-by="sortBy"
          :sort-order="sortOrder"
          :activatable-students-count="getActivatableStudentsCount()"
          :activatable-students-loading="activatableStudentsLoading"
          :is-channel="isChannel"
          @search="onStudentsSearch"
          @open-bulk-activation="openBulkActivationModal"
          @open-bulk-remove-trial="openBulkRemoveTrialModal"
          @view-student="viewStudentProfile"
          @open-activation="openActivationModal"
          @open-discount="openDiscountModal"
          @open-add-balance="openAddBalanceModal"
          @open-message="openStudentMessageModal"
          @open-telegram="openTelegram"
          @open-expel="openExpelModal"
          @open-promise-to-pay="openPromiseToPayModal"
          @open-ban-student="openBanStudentModal"
          @update:pagination="onStudentsPaginationUpdate"
          @update:sort-order="sortOrder = $event"
        />
      </VCard>
    </VCol>
  </VRow>

  <!-- Telegram Setup Modal -->
  <TelegramSetupModal
    v-if="group"
    v-model="showTelegramSetupModal"
    :connect-token="group.connectToken"
    :telegram-resource-type="group.telegramResourceType"
    @close="handleSetupModalClose"
  />

  <!-- Status Change Confirmation Dialog -->
  <StatusConfirmModal
    v-model="isStatusDialogVisible"
    :group="group"
    :loading="statusLoading"
    @confirm="onStatusChange"
  />

  <!-- Discount Modal -->
  <DiscountModal
    v-model="showDiscountModal"
    :enrollment="selectedEnrollment"
    :group="group"
    @save="saveDiscount"
  />

  <!-- Student Activation Modal -->
  <LessonStartDateModal
    v-model="showLessonStartDateModal"
    :enrollment="selectedEnrollment"
    :group="group"
    :is-channel="isChannel"
    @activate="activateStudent"
  />

  <!-- Bulk Expel Modal -->
  <BulkExpelModal
    v-model="showBulkExpelModal"
    :debtors="debtors"
    :group-id="groupId"
    @expel="performBulkExpel"
    @search-students="searchStudentsForExclude"
  />

  <!-- Add Balance Modal -->
  <AddBalanceModal
    v-model="showAddBalanceModal"
    :enrollment="selectedEnrollment"
    @save="addBalance"
  />

  <!-- Individual Expel Modal -->
  <ExpelModal
    v-model="showExpelModal"
    :enrollment="selectedEnrollment"
    :is-channel="isChannel"
    @expel="expelStudent"
  />

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
    :group="group"
    @message-sent="showSendMessageModal = false"
  />

  <!-- Student Message Modal (Single Student) -->
  <StudentMessageModal
    v-model="showStudentMessageModal"
    :enrollment="selectedMessageEnrollment"
    @message-sent="showStudentMessageModal = false"
  />

  <!-- Promise to Pay Modal -->
  <PromiseToPayModal
    v-if="group"
    v-model="showPromiseToPayModal"
    :enrollment="selectedEnrollment"
    :group-id="groupId"
    @success="fetchStudents"
  />

  <!-- Ban Student Modal -->
  <BanStudentModal
    v-model="showBanStudentModal"
    :student="selectedEnrollment?.student"
    :enrollment="selectedEnrollment"
    @success="fetchStudents"
  />

  <!-- Bulk Remove Trial Modal -->
  <BulkRemoveTrialModal
    v-if="group"
    v-model="showBulkRemoveTrialModal"
    :group-id="groupId"
    @success="fetchStudents"
  />
</template>

<script setup>
import {$api} from "@/utils/api";
import {prettyPhoneNumber} from "@/utils/utils";
definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();

// State
const teachers = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

// Delete state
const isDeleteDialogVisible = ref(false);
const teacherToDelete = ref(null);
const deleteLoading = ref(false);

// Fetch teachers
const fetchTeachers = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (searchQuery.value.trim()) {
      params.append("search", searchQuery.value.trim());
    }

    const response = await $api(`/v1/teachers?${params.toString()}`, {
      method: "GET",
    });

    if (response.success && response.data) {
      teachers.value = response.data.data || [];
      pagination.value = {
        page: response.data.meta.page,
        limit: response.data.meta.limit,
        total: response.data.meta.total,
        totalPages: response.data.meta.totalPages,
      };
    }
  } catch (error) {
    console.error("Error fetching teachers:", error);
  } finally {
    loading.value = false;
  }
};

// Search handler with debounce
const searchTimeout = ref(null);
const onSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    pagination.value.page = 1; // Reset to first page on search
    fetchTeachers();
  }, 500);
};

// Pagination handlers
const onPageChange = (page) => {
  pagination.value.page = page;
  fetchTeachers();
};

const onLimitChange = (limit) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  fetchTeachers();
};

// Navigate to create page
const goToCreate = () => {
  router.push("/teachers/create");
};

// Delete handlers
const onDeleteClick = (teacher) => {
  teacherToDelete.value = teacher;
  isDeleteDialogVisible.value = true;
};

const onDeleteConfirm = async () => {
  if (!teacherToDelete.value) return;

  deleteLoading.value = true;
  try {
    const response = await $api(`/v1/teachers/${teacherToDelete.value.id}`, {
      method: "DELETE",
    });

    if (response.success) {
      isDeleteDialogVisible.value = false;
      teacherToDelete.value = null;
      // Refresh list
      fetchTeachers();
    }
  } catch (error) {
    console.error("Error deleting teacher:", error);
  } finally {
    deleteLoading.value = false;
  }
};

// Load teachers on mount
onMounted(() => {
  fetchTeachers();
});

function clickTableItem(item) {
  router.push({name: "teachers-edit", params: {id: item.id}});
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <!-- Header -->
        <VCardTitle
          class="d-flex align-center justify-space-between flex-wrap gap-4"
        >
          <div class="d-flex align-center">
            <VIcon icon="tabler-users" class="me-2" />
            <span>O'qituvchilar ro'yxati</span>
          </div>
          <VBtn color="primary" @click="goToCreate">
            <VIcon icon="tabler-plus" class="me-1" />
            O'qituvchi qo'shish
          </VBtn>
        </VCardTitle>

        <VDivider />

        <!-- Search -->
        <VCardText>
          <VRow>
            <VCol cols="12" md="4">
              <AppTextField
                v-model="searchQuery"
                placeholder="Ism, telefon yoki Telegram ID bo'yicha qidirish..."
                @input="onSearch"
              >
                <template #prepend-inner>
                  <VIcon icon="tabler-search" />
                </template>
              </AppTextField>
            </VCol>
          </VRow>
        </VCardText>

        <!-- Teachers Table -->
        <VTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>Ism</th>
              <th>Familiya</th>
              <th>Telefon</th>
              <th>Telegram ID</th>
              <th>Telegram Username</th>
              <th>Mutaxassislik</th>
              <th>Status</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="text-center py-8">
                <VProgressCircular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="teachers.length === 0">
              <td colspan="9" class="text-center py-8">
                <div class="text-body-1 text-medium-emphasis">
                  O'qituvchilar topilmadi
                </div>
              </td>
            </tr>
            <tr
              @click="clickTableItem"
              v-else
              v-for="teacher in teachers"
              :key="teacher.id"
            >
              <td>{{ teacher.id }}</td>
              <td>{{ teacher.user?.firstName || "-" }}</td>
              <td>{{ teacher.user?.lastName || "-" }}</td>
              <td>{{ prettyPhoneNumber(teacher.user?.phoneNumber) || "-" }}</td>
              <td>{{ teacher.user?.telegramUser?.telegramId || "-" }}</td>
              <td>
                <span v-if="teacher.user?.telegramUser?.username">
                  @{{ teacher.user.telegramUser.username }}
                </span>
                <span v-else>-</span>
              </td>
              <td>{{ teacher.specialty || "-" }}</td>
              <td>
                <VChip
                  :color="teacher.isActive ? 'success' : 'error'"
                  size="small"
                  variant="tonal"
                >
                  {{ teacher.isActive ? "Faol" : "Faol emas" }}
                </VChip>
              </td>
              <td>
                <VBtn
                  size="small"
                  color="primary"
                  variant="text"
                  icon="tabler-edit"
                  @click="router.push(`/teachers/edit/${teacher.id}`)"
                />
                <VBtn
                  size="small"
                  color="error"
                  variant="text"
                  icon="tabler-trash"
                  @click="onDeleteClick(teacher)"
                />
              </td>
            </tr>
          </tbody>
        </VTable>

        <!-- Pagination -->
        <VCardText v-if="pagination.totalPages > 1">
          <VRow class="align-center">
            <VCol cols="12" md="6">
              <div class="d-flex align-center gap-2">
                <span class="text-body-2">Sahifada:</span>
                <VSelect
                  :model-value="pagination.limit"
                  :items="[10, 20, 50, 100]"
                  density="compact"
                  variant="outlined"
                  style="max-width: 100px"
                  @update:model-value="onLimitChange"
                />
              </div>
            </VCol>
            <VCol cols="12" md="6" class="d-flex justify-end">
              <VPagination
                :model-value="pagination.page"
                :length="pagination.totalPages"
                :total-visible="5"
                @update:model-value="onPageChange"
              />
            </VCol>
          </VRow>
          <div class="text-body-2 text-center mt-2">
            Jami: {{ pagination.total }} ta o'qituvchi
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Delete Confirmation Dialog -->
  <VDialog v-model="isDeleteDialogVisible" max-width="500">
    <VCard>
      <VCardTitle class="text-h5 pt-4 px-6">O'qituvchini o'chirish</VCardTitle>
      <VCardText>
        Siz haqiqatan ham ushbu o'qituvchini o'chirmoqchimisiz? Bu amalni ortga
        qaytarib bo'lmaydi.
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="isDeleteDialogVisible = false"
          :disabled="deleteLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="error"
          variant="elevated"
          @click="onDeleteConfirm"
          :loading="deleteLoading"
          :disabled="deleteLoading"
        >
          O'chirish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

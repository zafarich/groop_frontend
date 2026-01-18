<script setup>
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import {prettyMoney, prettyPhoneNumber} from "@/utils/utils";

definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();
const {success: showSuccess, error: showError} = useToast();

// State
const students = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const groupFilter = ref(null);
const groups = ref([]);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});

// Fetch groups for filter dropdown
const fetchGroups = async () => {
  try {
    const res = await $api("/v1/groups?limit=100");
    if (res.success) {
      groups.value = res.data?.map((g) => ({title: g.name, value: g.id})) || [];
    }
  } catch (e) {
    console.error(e);
  }
};

// Fetch students
const fetchStudents = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (searchQuery.value.trim()) {
      params.append("search", searchQuery.value.trim());
    }
    if (groupFilter.value) {
      params.append("groupId", groupFilter.value.toString());
    }

    const res = await $api(`/v1/students?${params.toString()}`);
    if (res.success) {
      students.value = res.data?.data || [];
      pagination.value = {
        page: res.data?.meta?.page || 1,
        limit: res.data?.meta?.limit || 20,
        total: res.data?.meta?.total || 0,
        totalPages: res.data?.meta?.totalPages || 0,
      };
    }
  } catch (err) {
    console.error(err);
    showError("O'quvchilarni yuklashda xatolik");
  } finally {
    loading.value = false;
  }
};

// Search debounce
const searchTimeout = ref(null);
const onSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    pagination.value.page = 1;
    fetchStudents();
  }, 500);
};

// Filter change
const onFilterChange = () => {
  pagination.value.page = 1;
  fetchStudents();
};

// Pagination
const onPageChange = (page) => {
  pagination.value.page = page;
  fetchStudents();
};

const onLimitChange = (limit) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  fetchStudents();
};

// Navigate to student profile
const viewStudent = (student) => {
  router.push(`/students/${student.id}`);
};

onMounted(() => {
  fetchGroups();
  fetchStudents();
});
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardTitle
          class="d-flex align-center justify-space-between flex-wrap gap-4"
        >
          <div class="d-flex align-center">
            <VIcon icon="tabler-school" class="me-2" />
            <span>O'quvchilar ro'yxati</span>
          </div>
        </VCardTitle>

        <VDivider />

        <!-- Filters -->
        <VCardText>
          <VRow>
            <VCol cols="12" md="5">
              <AppTextField
                v-model="searchQuery"
                placeholder="Ism, telefon yoki Telegram bo'yicha qidirish..."
                @input="onSearch"
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
                clearable
                @update:model-value="onFilterChange"
              />
            </VCol>
          </VRow>
        </VCardText>

        <!-- Students Table -->
        <VTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>Ism Familiya</th>
              <th>Telefon</th>
              <th>Telegram</th>
              <th>Guruhlar</th>
              <th>Balans</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-8">
                <VProgressCircular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="students.length === 0">
              <td colspan="7" class="text-center py-8">
                <div class="text-body-1 text-medium-emphasis">
                  O'quvchilar topilmadi
                </div>
              </td>
            </tr>
            <tr v-else v-for="student in students" :key="student.id">
              <td>{{ student.id }}</td>
              <td>
                <div class="font-weight-medium">
                  {{ student.firstName }} {{ student.lastName }}
                </div>
              </td>
              <td>{{ prettyPhoneNumber(student.phoneNumber) }}</td>
              <td>
                <a
                  v-if="student.telegramUsername"
                  :href="`https://t.me/${student.telegramUsername}`"
                  target="_blank"
                  class="text-primary"
                >
                  @{{ student.telegramUsername }}
                </a>
                <span v-else class="text-disabled">-</span>
              </td>
              <td>
                <VChip size="small" color="info" variant="tonal">
                  {{ student.enrollmentsCount }} guruh
                </VChip>
                <VChip
                  v-if="student.activeEnrollmentsCount > 0"
                  size="small"
                  color="success"
                  variant="tonal"
                  class="ms-1"
                >
                  {{ student.activeEnrollmentsCount }} faol
                </VChip>
              </td>
              <td>
                <span
                  :class="
                    student.totalBalance < 0 ? 'text-error' : 'text-success'
                  "
                >
                  {{ prettyMoney(student.totalBalance) }} so'm
                </span>
              </td>
              <td>
                <VBtn
                  size="small"
                  color="info"
                  variant="text"
                  icon="tabler-eye"
                  @click="viewStudent(student)"
                >
                  <VIcon icon="tabler-eye" />
                  <VTooltip activator="parent" location="top"
                    >Profilni ko'rish</VTooltip
                  >
                </VBtn>
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
            Jami: {{ pagination.total }} ta o'quvchi
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

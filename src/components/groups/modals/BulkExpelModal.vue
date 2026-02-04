<script setup>
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue";
import {prettyMoney, prettyPhoneNumber} from "@/utils/utils";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  debtors: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  groupId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "expel", "search-students"]);

const router = useRouter();

const form = ref({
  minDebtAmount: 0,
  minDebtAmountDisplay: "",
  excludeEnrollmentIds: [],
});

const expelResult = ref(null);
const excludeSearchQuery = ref("");
const excludeSearchResults = ref([]);
const excludeSearchLoading = ref(false);
const excludeSearchTimeout = ref(null);

// Reset form when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      form.value = {
        minDebtAmount: 0,
        minDebtAmountDisplay: "",
        excludeEnrollmentIds: [],
      };
      expelResult.value = null;
      excludeSearchResults.value = [];
      excludeSearchQuery.value = "";
    }
  }
);

const formatMinDebtAmount = (value) => {
  const numericValue = value.replace(/\s/g, "");
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) {
    form.value.minDebtAmount = 0;
    form.value.minDebtAmountDisplay = "";
  } else {
    form.value.minDebtAmount = number;
    form.value.minDebtAmountDisplay = prettyMoney(number);
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
    emit("search-students", {
      query,
      callback: (results) => {
        excludeSearchResults.value = results.map((s) => ({
          title: `${s.name} (${prettyPhoneNumber(s.phoneNumber)})`,
          value: s.enrollmentId,
          debt: s.debt,
        }));
      },
    });
  }, 300);
};

const debtorsToExpel = computed(() => {
  if (!props.debtors || props.debtors.length === 0) return [];
  return props.debtors.filter((d) => {
    const debtAmount = Number(d.debtAmount);
    const isAboveMin = debtAmount >= form.value.minDebtAmount;
    const isNotExcluded = !form.value.excludeEnrollmentIds.includes(
      d.enrollmentId,
    );
    return isAboveMin && isNotExcluded;
  });
});

const handleExpel = () => {
  emit("expel", {
    minDebtAmount: form.value.minDebtAmount,
    excludeEnrollmentIds: form.value.excludeEnrollmentIds,
    onSuccess: (result) => {
      expelResult.value = result;
    },
  });
};

const close = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="700"
    persistent
  >
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
            v-model="form.minDebtAmountDisplay"
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
            v-model="form.excludeEnrollmentIds"
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
                  <a
                    class="text-primary cursor-pointer"
                    @click="router.push(`/students/${debtor.student.id}`)"
                  >
                    {{ debtor.student.firstName }} {{ debtor.student.lastName }}
                  </a>
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
          @click="close"
          :disabled="loading"
        >
          {{ expelResult ? "Yopish" : "Bekor qilish" }}
        </VBtn>
        <VBtn
          v-if="!expelResult"
          color="error"
          variant="elevated"
          @click="handleExpel"
          :loading="loading"
          :disabled="loading || debtorsToExpel.length === 0"
        >
          <VIcon icon="tabler-user-x" class="me-1" />
          Chiqarish ({{ debtorsToExpel.length }})
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

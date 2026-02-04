<script setup>
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  payment: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "approve", "reject"]);

const confirmedAmount = ref(null);

// Initialize confirmed amount when payment changes
watch(
  () => props.payment,
  (newPayment) => {
    if (newPayment) {
      confirmedAmount.value = newPayment.amount;
    }
  },
  {immediate: true}
);

const formattedConfirmedAmount = computed({
  get: () => {
    if (!confirmedAmount.value) return "";
    return new Intl.NumberFormat("uz-UZ").format(confirmedAmount.value);
  },
  set: (value) => {
    const cleanValue = value.replace(/\D/g, "");
    confirmedAmount.value = cleanValue ? Number(cleanValue) : null;
  },
});

// Format price
const formatPrice = (price) => {
  if (!price) return "-";
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("uz-UZ").format(num) + " so'm";
};

// Format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// Format phone number
const formatPhoneNumber = (phone) => {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
  }
  return phone;
};

// Get student full name
const getStudentName = (payment) => {
  if (!payment?.student) return "-";
  return `${payment.student.firstName || ""} ${payment.student.lastName || ""}`.trim() || "-";
};

// Get student phone
const getStudentPhone = (payment) => {
  if (!payment?.student?.user?.phoneNumber) return "-";
  return formatPhoneNumber(payment.student.user.phoneNumber);
};

// Get group name
const getGroupName = (payment) => {
  if (!payment?.group) return "-";
  return payment.group.name || "-";
};

const handleApprove = () => {
  emit("approve", confirmedAmount.value);
};

const handleReject = () => {
  emit("reject");
};

const close = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
  >
    <VCard v-if="payment">
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>Chek rasmi</span>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="close"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <!-- Payment Info -->
        <VRow class="mb-4">
          <VCol cols="6">
            <div class="text-caption text-medium-emphasis">O'quvchi</div>
            <a
              class="font-weight-medium text-primary cursor-pointer"
              @click="$emit('view-student', payment.student?.id)"
            >
              {{ getStudentName(payment) }}
            </a>
            <div class="text-body-2">
              {{ getStudentPhone(payment) }}
            </div>
          </VCol>
          <VCol cols="6">
            <div class="text-caption text-medium-emphasis">To'lov summasi</div>
            <div class="font-weight-medium text-primary">
              {{ formatPrice(payment.amount) }}
            </div>
          </VCol>
          <VCol cols="6">
            <div class="text-caption text-medium-emphasis">Guruh</div>
            <div class="font-weight-medium">
              {{ getGroupName(payment) }}
            </div>
          </VCol>
          <VCol cols="6">
            <div class="text-caption text-medium-emphasis">Yuborilgan vaqt</div>
            <div class="font-weight-medium">
              {{ formatDateTime(payment.createdAt) }}
            </div>
          </VCol>
        </VRow>

        <div v-if="payment.status === 'PENDING'" class="mb-4">
          <AppTextField
            v-model="formattedConfirmedAmount"
            label="Tasdiqlanadigan summa"
            type="text"
            placeholder="Summani kiriting"
            :hint="`Asl summa: ${formatPrice(payment.amount)}`"
            persistent-hint
          />
        </div>

        <VDivider class="mb-4" />

        <!-- Receipt Image -->
        <div class="receipt-image-container">
          <img
            :src="payment.receiptUrl"
            alt="Chek rasmi"
            class="receipt-image"
          />
        </div>
      </VCardText>

      <VDivider class="mb-4" />

      <VCardActions>
        <!-- Approve/Reject buttons for pending payments -->
        <template v-if="payment.status === 'PENDING'">
          <VBtn
            color="error"
            variant="outlined"
            :disabled="loading"
            @click="handleReject"
          >
            <VIcon icon="tabler-x" class="me-1" />
            Bekor qilish
          </VBtn>
          <VBtn color="success" :loading="loading" @click="handleApprove">
            <VIcon icon="tabler-check" class="me-1" />
            Tasdiqlash
          </VBtn>
        </template>
        <VSpacer />
        <VBtn
          :href="payment.receiptUrl"
          download
          target="_blank"
          color="primary"
          variant="outlined"
        >
          <VIcon icon="tabler-download" class="me-1" />
          Yuklab olish
        </VBtn>
        <VBtn color="secondary" variant="outlined" @click="close">
          Yopish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.receipt-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 8px;
  padding: 16px;
  min-height: 300px;
}

.receipt-image {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 4px;
}
</style>

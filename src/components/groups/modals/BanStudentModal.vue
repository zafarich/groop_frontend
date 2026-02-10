<script setup>
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  student: {
    type: Object,
    default: null,
  },
  enrollment: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "success"]);

const {success: showSuccess, error: showError} = useToast();

// State
const reason = ref("");
const banType = ref("TRIAL_ONLY");
const loading = ref(false);

// Reset form when modal opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    reason.value = "";
    banType.value = "TRIAL_ONLY";
  }
});

const closeModal = () => {
  emit("update:modelValue", false);
};

const banStudent = async () => {
  if (!reason.value.trim()) {
    showError("Iltimos, taqiqlash sababini yozing");
    return;
  }

  if (!props.student?.id) {
    showError("O'quvchi ma'lumotlari topilmadi");
    return;
  }

  loading.value = true;
  try {
    const response = await $api(
      `/v1/enrollments/students/${props.student.id}/ban`,
      {
        method: "POST",
        body: {
          reason: reason.value.trim(),
          banType: banType.value,
          enrollmentId: props.enrollment?.id,
        },
      },
    );

    if (response.success) {
      showSuccess("O'quvchi sinov darsidan taqiqlandi");
      emit("success");
      closeModal();
    }
  } catch (error) {
    console.error("Error banning student:", error);
    showError(error.data?.message || "Taqiqlashda xatolik yuz berdi");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="closeModal"
    max-width="500"
  >
    <VCard>
      <VCardTitle class="pa-4 d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <VIcon icon="tabler-ban" color="error" class="me-2" />
          <span class="text-h6">Sinov darsidan taqiqlash</span>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          density="compact"
          @click="closeModal"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <VRow>
          <VCol cols="12">
            <div class="mb-4">
              <div class="text-subtitle-2 mb-1">O'quvchi</div>
              <div class="text-body-1">
                {{ student?.firstName }} {{ student?.lastName }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ student?.user?.phoneNumber }}
              </div>
            </div>
          </VCol>

          <VCol cols="12">
            <VRadioGroup v-model="banType" label="Taqiq turi">
              <VRadio
                value="TRIAL_ONLY"
                label="Faqat sinov darsidan (to'lov qilsa qaytishi mumkin)"
              />
              <VRadio
                value="COMPLETE"
                label="To'liq taqiq (qayta qo'shilmaydi)"
              />
            </VRadioGroup>
          </VCol>

          <VCol cols="12">
            <VTextarea
              v-model="reason"
              label="Sabab *"
              placeholder="Nima sababdan taqiqlanmoqda?"
              rows="3"
              auto-grow
              required
            />
          </VCol>

          <VCol cols="12">
            <VAlert
              type="warning"
              variant="tonal"
              density="compact"
            >
              <VAlertTitle>Diqqat!</VAlertTitle>
              <div v-if="banType === 'TRIAL_ONLY'">
                Bu o'quvchi endi sinov darsiga qatnasha olmaydi, lekin to'lov
                qilsa, to'liq o'qishga qo'shila oladi.
              </div>
              <div v-else>
                Bu o'quvchi butunlay taqiqlanadi va tizimga qayta qo'shilmaydi.
              </div>
            </VAlert>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="outlined"
          color="secondary"
          @click="closeModal"
          :disabled="loading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="error"
          @click="banStudent"
          :loading="loading"
          :disabled="!reason.trim()"
        >
          <VIcon icon="tabler-ban" class="me-2" />
          Taqiqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

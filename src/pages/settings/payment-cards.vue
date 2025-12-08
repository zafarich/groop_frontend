<script setup>
import PaymentCardModal from "@/components/PaymentCardModal.vue";
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";

definePage({
  meta: {
    layout: "default",
  },
});

const {success: showSuccess, error: showError} = useToast();

const cards = ref([]);
const loading = ref(false);
const showCardModal = ref(false);
const isEditMode = ref(false);
const selectedCard = ref(null);
const showDeleteDialog = ref(false);
const cardToDelete = ref(null);

// Fetch all payment cards
const fetchCards = async () => {
  loading.value = true;
  try {
    const response = await $api("/v1/payment-cards", {
      method: "GET",
      query: {includeHidden: "true"},
    });

    if (response.success && response.data) {
      cards.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching payment cards:", error);
    showError("Kartalarni yuklashda xatolik");
  } finally {
    loading.value = false;
  }
};

// Open create modal
const openCreateModal = () => {
  isEditMode.value = false;
  selectedCard.value = null;
  showCardModal.value = true;
};

// Open edit modal
const openEditModal = (card) => {
  isEditMode.value = true;
  selectedCard.value = card;
  showCardModal.value = true;
};

// Handle card saved
const onCardSaved = () => {
  fetchCards();
};

// Toggle card visibility
const toggleVisibility = async (card) => {
  try {
    const response = await $api(
      `/v1/payment-cards/${card.id}/toggle-visibility`,
      {
        method: "PATCH",
      }
    );

    if (response.success) {
      showSuccess("Karta ko'rinishi o'zgartirildi");
      fetchCards();
    }
  } catch (error) {
    showError("Xatolik yuz berdi");
  }
};

// Set card as primary
const setPrimary = async (card) => {
  try {
    const response = await $api(`/v1/payment-cards/${card.id}/set-primary`, {
      method: "PATCH",
    });

    if (response.success) {
      showSuccess("Asosiy karta o'rnatildi");
      fetchCards();
    }
  } catch (error) {
    showError("Xatolik yuz berdi");
  }
};

// Toggle active status
const toggleActive = async (card) => {
  try {
    const response = await $api(`/v1/payment-cards/${card.id}`, {
      method: "PATCH",
      body: {isActive: !card.isActive},
    });

    if (response.success) {
      showSuccess("Karta holati o'zgartirildi");
      fetchCards();
    }
  } catch (error) {
    showError("Xatolik yuz berdi");
  }
};

// Open delete confirmation
const confirmDelete = (card) => {
  cardToDelete.value = card;
  showDeleteDialog.value = true;
};

// Delete card
const deleteCard = async () => {
  if (!cardToDelete.value) return;

  try {
    const response = await $api(
      `/v1/payment-cards/${cardToDelete.value.id}/soft`,
      {
        method: "DELETE",
      }
    );

    if (response.success) {
      showSuccess("Karta o'chirildi");
      showDeleteDialog.value = false;
      cardToDelete.value = null;
      fetchCards();
    }
  } catch (error) {
    showError("Karta o'chirishda xatolik");
  }
};

// Format card number for display (mask middle digits)
const formatCardNumber = (cardNumber) => {
  if (!cardNumber) return "";
  const cleaned = cardNumber.replace(/\s/g, "");
  if (cleaned.length !== 16) return cardNumber;
  return `${cleaned.slice(0, 4)} **** **** ${cleaned.slice(-4)}`;
};

// Get card type badge color
const getCardTypeColor = (type) => {
  const colors = {
    uzcard: "primary",
    humo: "success",
    visa: "info",
    mastercard: "warning",
    other: "secondary",
  };
  return colors[type] || "secondary";
};

onMounted(() => {
  fetchCards();
});
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- Page Header -->
      <div class="d-flex justify-space-between align-center mb-4">
        <div>
          <h2 class="text-h4 mb-1">To'lov kartalari</h2>
          <p class="text-body-2 text-medium-emphasis">
            Talabalar guruhga qo'shilganda to'lov qilish uchun kartalar
          </p>
        </div>
        <VBtn
          prepend-icon="tabler-plus"
          color="primary"
          @click="openCreateModal"
        >
          Karta qo'shish
        </VBtn>
      </div>

      <!-- Info Alert -->
      <VAlert type="warning" variant="tonal" class="mb-6">
        <div class="text-body-2">
          <VIcon icon="tabler-info-circle" class="me-2" />
          Bu kartalar talabalar kursga to'lov qilish uchun to'lov qilayotganda
          ko'rinadi. Kamida bitta faol karta bo'lishi kerak. Qaysidir karta blok
          bo'lsa uni o'chirib qo'ying
        </div>
      </VAlert>

      <!-- Loading State -->
      <div v-if="loading" class="d-flex justify-center py-8">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <!-- Cards Grid -->
      <VRow v-else-if="cards.length > 0">
        <VCol v-for="card in cards" :key="card.id" cols="12" md="6" lg="4">
          <VCard
            :class="[
              'payment-card',
              {'primary-card': card.isPrimary},
              {'inactive-card': !card.isActive},
            ]"
          >
            <VCardText>
              <!-- Card Header -->
              <div class="d-flex justify-space-between align-center mb-4">
                <div class="d-flex gap-2">
                  <VChip
                    :color="getCardTypeColor(card.cardType)"
                    size="small"
                    variant="tonal"
                  >
                    {{ card.cardType?.toUpperCase() || "OTHER" }}
                  </VChip>
                  <VChip
                    v-if="card.isPrimary"
                    color="success"
                    size="small"
                    variant="tonal"
                  >
                    <VIcon icon="tabler-star" size="14" class="me-1" />
                    Asosiy
                  </VChip>
                </div>
                <div class="d-flex gap-1">
                  <VBtn
                    icon="tabler-edit"
                    size="small"
                    variant="text"
                    @click="openEditModal(card)"
                  />
                  <VBtn
                    icon="tabler-trash"
                    size="small"
                    variant="text"
                    color="error"
                    @click="confirmDelete(card)"
                  />
                </div>
              </div>

              <!-- Card Number -->
              <div class="mb-3">
                <div class="text-h6 font-weight-medium">
                  {{ formatCardNumber(card.cardNumber) }}
                </div>
              </div>

              <!-- Card Holder -->
              <div class="mb-2">
                <div class="text-caption text-medium-emphasis">Karta egasi</div>
                <div class="text-body-1">{{ card.cardHolder }}</div>
              </div>

              <!-- Bank Name -->
              <div v-if="card.bankName" class="mb-2">
                <div class="text-caption text-medium-emphasis">Bank</div>
                <div class="text-body-2">{{ card.bankName }}</div>
              </div>

              <!-- Description -->
              <div v-if="card.description" class="mb-4">
                <div class="text-caption text-medium-emphasis">Izoh</div>
                <div class="text-body-2">{{ card.description }}</div>
              </div>

              <VDivider class="my-4" />

              <!-- Status Switches -->
              <div class="d-flex flex-column gap-2">
                <div class="d-flex justify-space-between align-center">
                  <span class="text-body-2">Faol</span>
                  <VSwitch
                    :model-value="card.isActive"
                    color="primary"
                    density="compact"
                    hide-details
                    @update:model-value="toggleActive(card)"
                  />
                </div>
                <div class="d-flex justify-space-between align-center">
                  <span class="text-body-2">Ko'rinadi</span>
                  <VSwitch
                    :model-value="card.isVisible"
                    color="primary"
                    density="compact"
                    hide-details
                    @update:model-value="toggleVisibility(card)"
                  />
                </div>
                <div class="d-flex justify-space-between align-center">
                  <span class="text-body-2">Asosiy</span>
                  <VSwitch
                    :model-value="card.isPrimary"
                    color="success"
                    density="compact"
                    hide-details
                    @update:model-value="setPrimary(card)"
                  />
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Empty State -->
      <VCard v-else>
        <VCardText class="text-center py-8">
          <VIcon icon="tabler-credit-card-off" size="64" class="mb-4" />
          <div class="text-h6 mb-2">Kartalar topilmadi</div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            To'lov kartalarini qo'shish uchun yuqoridagi tugmani bosing
          </div>
          <VBtn
            prepend-icon="tabler-plus"
            color="primary"
            @click="openCreateModal"
          >
            Karta qo'shish
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Card Modal -->
  <PaymentCardModal
    v-model="showCardModal"
    :is-edit-mode="isEditMode"
    :card-data="selectedCard"
    @card-saved="onCardSaved"
  />

  <!-- Delete Confirmation Dialog -->
  <VDialog v-model="showDeleteDialog" max-width="400">
    <VCard>
      <VCardTitle>Kartani o'chirish</VCardTitle>
      <VCardText>
        Haqiqatan ham bu kartani o'chirmoqchimisiz? Bu amalni bekor qilib
        bo'lmaydi.
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="showDeleteDialog = false"
        >
          Bekor qilish
        </VBtn>
        <VBtn color="error" variant="elevated" @click="deleteCard">
          O'chirish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
.payment-card {
  transition: all 0.3s ease;

  &.primary-card {
    border: 2px solid rgb(var(--v-theme-success));
  }

  &.inactive-card {
    opacity: 0.6;
  }

  &:hover {
    transform: translateY(-4px);
  }
}
</style>

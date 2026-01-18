<script setup>
import {$api} from "@/utils/api";

const loading = ref({
  deductBalances: false,
  checkLowBalance: false,
  notifyDebtors: false,
});

const results = ref({
  deductBalances: null,
  checkLowBalance: null,
  notifyDebtors: null,
});

const deductBalances = async () => {
  loading.value.deductBalances = true;
  results.value.deductBalances = null;
  try {
    const response = await $api("/v1/tasks/deduct-balances", {
      method: "POST",
    });
    results.value.deductBalances = {success: true, data: response};
  } catch (error) {
    results.value.deductBalances = {
      success: false,
      error: error.message || "Xatolik yuz berdi",
    };
  } finally {
    loading.value.deductBalances = false;
  }
};

const checkLowBalance = async () => {
  loading.value.checkLowBalance = true;
  results.value.checkLowBalance = null;
  try {
    const response = await $api("/v1/tasks/check-low-balance", {
      method: "POST",
    });
    results.value.checkLowBalance = {success: true, data: response};
  } catch (error) {
    results.value.checkLowBalance = {
      success: false,
      error: error.message || "Xatolik yuz berdi",
    };
  } finally {
    loading.value.checkLowBalance = false;
  }
};

const notifyDebtors = async () => {
  loading.value.notifyDebtors = true;
  results.value.notifyDebtors = null;
  try {
    const response = await $api("/v1/tasks/notify-debtors", {
      method: "POST",
    });
    results.value.notifyDebtors = {success: true, data: response};
  } catch (error) {
    results.value.notifyDebtors = {
      success: false,
      error: error.message || "Xatolik yuz berdi",
    };
  } finally {
    loading.value.notifyDebtors = false;
  }
};
</script>

<template>
  <div>
    <VCard class="mb-6" title="Tez kunda statistikalarni ham qo'shamiz 🚀">
    </VCard>

    <!-- Cron Job Test Buttons -->
    <VCard class="mb-6" title="🔧 Cron Joblarni Test Qilish">
      <VCardText>
        <p class="text-body-2 mb-4">
          Cron joblarni ishlashini kutmasdan sinab ko'rish uchun quyidagi
          buttonlardan foydalaning.
        </p>

        <div class="d-flex flex-wrap gap-4 mb-4">
          <!-- Deduct Balances Button -->
          <VBtn
            color="warning"
            :loading="loading.deductBalances"
            @click="deductBalances"
          >
            <VIcon start icon="ri-money-dollar-circle-line" />
            Kunlik Balance Yechish
          </VBtn>

          <!-- Check Low Balance Button -->
          <VBtn
            color="info"
            :loading="loading.checkLowBalance"
            @click="checkLowBalance"
          >
            <VIcon start icon="ri-alert-line" />
            Kam Balans Tekshirish
          </VBtn>

          <!-- Notify Debtors Button -->
          <VBtn
            color="error"
            :loading="loading.notifyDebtors"
            @click="notifyDebtors"
          >
            <VIcon start icon="ri-notification-line" />
            Qarzdorlarga Xabar
          </VBtn>
        </div>

        <!-- Results Section -->
        <VExpandTransition>
          <VAlert
            v-if="results.deductBalances"
            :type="results.deductBalances.success ? 'success' : 'error'"
            variant="tonal"
            class="mb-3"
            closable
            @click:close="results.deductBalances = null"
          >
            <VAlertTitle>Balance Yechish Natijasi</VAlertTitle>
            <pre class="text-caption mt-2">{{
              JSON.stringify(
                results.deductBalances.data || results.deductBalances.error,
                null,
                2
              )
            }}</pre>
          </VAlert>
        </VExpandTransition>

        <VExpandTransition>
          <VAlert
            v-if="results.checkLowBalance"
            :type="results.checkLowBalance.success ? 'success' : 'error'"
            variant="tonal"
            class="mb-3"
            closable
            @click:close="results.checkLowBalance = null"
          >
            <VAlertTitle>Kam Balans Tekshirish Natijasi</VAlertTitle>
            <pre class="text-caption mt-2">{{
              JSON.stringify(
                results.checkLowBalance.data || results.checkLowBalance.error,
                null,
                2
              )
            }}</pre>
          </VAlert>
        </VExpandTransition>

        <VExpandTransition>
          <VAlert
            v-if="results.notifyDebtors"
            :type="results.notifyDebtors.success ? 'success' : 'error'"
            variant="tonal"
            class="mb-3"
            closable
            @click:close="results.notifyDebtors = null"
          >
            <VAlertTitle>Qarzdorlarga Xabar Natijasi</VAlertTitle>
            <pre class="text-caption mt-2">{{
              JSON.stringify(
                results.notifyDebtors.data || results.notifyDebtors.error,
                null,
                2
              )
            }}</pre>
          </VAlert>
        </VExpandTransition>
      </VCardText>
    </VCard>
  </div>
</template>

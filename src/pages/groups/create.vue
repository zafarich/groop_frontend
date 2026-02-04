<script setup>
import TelegramSetupModal from "@/components/TelegramSetupModal.vue";
import {useGroupForm} from "@/composables/useGroupForm";
import {
  GroupFormBasicSection,
  GroupFormDatesSection,
  GroupFormPaymentSection,
  GroupFormTeachersSection,
  GroupFormSchedulesSection,
  GroupFormDiscountsSection,
} from "@/components/groups";
import {prettyMoney} from "@/utils/utils";

definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();

const {
  form,
  loading,
  errorMessage,
  teachersList,
  loadingTeachers,
  showTelegramSetupModal,
  botUsername,
  createdTelegramResourceType,
  createdConnectToken,
  paymentTypes,
  trialPaymentTypes,
  telegramResourceTypes,
  daysOfWeek,
  rules,
  isChannel,
  paymentTypeDescription,
  courseDurationMonths,
  totalMonthlyPayment,
  wholePeriodSavings,
  wholePeriodSavingsPercent,
  formatMoneyInput,
  formatTrialPrice,
  formatWholePeriodPrice,
  formatDiscountAmount,
  getDiscountExample,
  addTeacher,
  removeTeacher,
  setPrimaryTeacher,
  addLessonSchedule,
  removeLessonSchedule,
  addDiscount,
  removeDiscount,
  fetchTeachers,
  onSubmit,
  onCancel,
  handleSetupModalClose,
} = useGroupForm();

onMounted(() => {
  fetchTeachers();
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
        @click="router.go(-1)"
      >
        Orqaga
      </VBtn>

      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon icon="tabler-users-group" class="me-2" />
          <span>Yangi guruh yaratish</span>
        </VCardTitle>

        <VDivider />

        <!-- Error alert -->
        <VCardText v-if="errorMessage">
          <VAlert
            type="error"
            variant="tonal"
            closable
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </VAlert>
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="onSubmit">
            <VRow>
              <!-- Basic Information Section -->
              <GroupFormBasicSection
                :form="form"
                :rules="rules"
                :telegram-resource-types="telegramResourceTypes"
              />

              <!-- Course Dates Section (hidden for channels) -->
              <GroupFormDatesSection
                v-if="!isChannel"
                :form="form"
                :rules="rules"
              />

              <!-- Payment Configuration Section -->
              <GroupFormPaymentSection
                :form="form"
                :rules="rules"
                :payment-types="paymentTypes"
                :trial-payment-types="trialPaymentTypes"
                :payment-type-description="paymentTypeDescription"
                :course-duration-months="courseDurationMonths"
                :total-monthly-payment="totalMonthlyPayment"
                :whole-period-savings="wholePeriodSavings"
                :whole-period-savings-percent="wholePeriodSavingsPercent"
                @format-money="formatMoneyInput"
                @format-trial="formatTrialPrice"
                @format-whole-period="formatWholePeriodPrice"
              />

              <!-- Teachers Section (hidden for channels) -->
              <VCol v-if="!isChannel" cols="12">
                <GroupFormTeachersSection
                  :teachers="form.teachers"
                  :teachers-list="teachersList"
                  :loading-teachers="loadingTeachers"
                  :rules="rules"
                  @add="addTeacher"
                  @remove="removeTeacher"
                  @set-primary="setPrimaryTeacher"
                />
              </VCol>

              <!-- Lesson Schedules Section (hidden for channels) -->
              <VCol v-if="!isChannel" cols="12">
                <GroupFormSchedulesSection
                  :schedules="form.lessonSchedules"
                  :days-of-week="daysOfWeek"
                  :rules="rules"
                  @add="addLessonSchedule"
                  @remove="removeLessonSchedule"
                />
              </VCol>

              <!-- Pricing Options Section (hidden for channels) -->
              <template v-if="!isChannel">
                <VCol cols="12">
                  <h3 class="text-h5 mt-4">Narxlar va chegirmalar</h3>
                  <p class="text-body-2 text-medium-emphasis mt-1">
                    O'quvchilar uchun to'lov variantlari. Barcha narxlar o'quvchilarga ko'rsatiladi.
                  </p>
                </VCol>

                <!-- Multi-month Discounts -->
                <VCol cols="12">
                  <GroupFormDiscountsSection
                    :discounts="form.discounts"
                    @add="addDiscount"
                    @remove="removeDiscount"
                  >
                  <template #default="{ discount, index }">
                    <VCol cols="12">
                      <VCard variant="outlined" class="pa-4">
                        <VRow>
                          <VCol cols="12" md="5">
                            <AppTextField
                              v-model.number="discount.months"
                              type="number"
                              label="Oylar soni *"
                              placeholder="3"
                              :rules="[rules.requiredNumber]"
                            />
                          </VCol>
                          <VCol cols="12" md="5">
                            <AppTextField
                              v-model="discount.discountAmountDisplay"
                              label="Chegirma miqdori (so'm) *"
                              placeholder="100 000"
                              :rules="[rules.required]"
                              @input="formatDiscountAmount(index, $event.target.value)"
                            />
                          </VCol>
                          <VCol cols="12" md="2">
                            <VBtn
                              size="small"
                              color="error"
                              variant="text"
                              class="mt-6"
                              icon="tabler-trash"
                              @click="removeDiscount(index)"
                            />
                          </VCol>
                          <VCol cols="12" v-if="getDiscountExample(discount)">
                            <VAlert
                              type="success"
                              variant="tonal"
                              density="compact"
                              class="mt-2 text-body-2"
                            >
                              <strong>{{ discount.months }} oy uchun:</strong> 
                              {{ getDiscountExample(discount).monthlyPrice }} x {{ discount.months }} = 
                              {{ getDiscountExample(discount).totalOriginal }} - {{ getDiscountExample(discount).discountAmount }} (chegirma) = 
                              <strong>{{ getDiscountExample(discount).totalWithDiscount }} so'm</strong>
                            </VAlert>
                          </VCol>
                        </VRow>
                      </VCard>
                    </VCol>
                  </template>
                  </GroupFormDiscountsSection>
                </VCol>
              </template>

              <!-- Action Buttons -->
              <VCol cols="12" class="d-flex gap-4 mt-4">
                <VBtn type="submit" :loading="loading" :disabled="loading">
                  Saqlash
                </VBtn>

                <VBtn
                  color="secondary"
                  variant="outlined"
                  @click="onCancel"
                  :disabled="loading"
                >
                  Bekor qilish
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Telegram Setup Modal -->
  <TelegramSetupModal
    v-model="showTelegramSetupModal"
    :bot-username="botUsername"
    :telegram-resource-type="createdTelegramResourceType"
    :connect-token="createdConnectToken"
    @close="handleSetupModalClose"
  />
</template>

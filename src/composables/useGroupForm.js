import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import {prettyMoney} from "@/utils/utils";

export function useGroupForm() {
  const {success: showSuccess, error: showError} = useToast();
  const router = useRouter();

  // Form data
  const form = ref({
    name: "",
    description: "",
    monthlyPrice: null,
    monthlyPriceDisplay: "",
    wholePeriodPrice: null,
    wholePeriodPriceDisplay: "",
    courseStartDate: "",
    courseEndDate: "",
    paymentType: "MONTHLY_SAME_DATE",
    trialPaymentType: "FREE",
    trialPrice: null,
    trialPriceDisplay: "",
    lessonsPerPaymentPeriod: null,
    teachers: [{teacherId: null, isPrimary: true}],
    lessonSchedules: [{dayOfWeek: null, startTime: "", endTime: ""}],
    discounts: [],
    studentsCanWrite: true,
    telegramResourceType: "PRIVATE_GROUP",
  });

  const loading = ref(false);
  const errorMessage = ref("");
  const teachersList = ref([]);
  const loadingTeachers = ref(false);

  // Telegram setup modal state
  const showTelegramSetupModal = ref(false);
  const botUsername = ref("");
  const createdTelegramResourceType = ref("PRIVATE_GROUP");
  const createdConnectToken = ref("");

  // Options
  const paymentTypes = [
    {value: "MONTHLY_SAME_DATE", title: "Har oy bir xil sanada"},
    {value: "ONE_TIME", title: "Butun kurs davri uchun(masalan 2 oy uchun)"},
    {value: "LESSON_BASED", title: "Darslar asosida"},
  ];

  const trialPaymentTypes = [
    {value: "FREE", title: "Bepul sinov darsi"},
    {value: "PAID", title: "Pullik sinov darsi"},
    {value: "OFF", title: "Sinov darsi yo'q (Birdan to'lov)"},
  ];

  const telegramResourceTypes = [
    {value: "PRIVATE_GROUP", title: "Yopiq guruh (Private Group)"},
    {value: "PRIVATE_CHANNEL", title: "Yopiq kanal (Private Channel)"},
  ];

  const daysOfWeek = [
    {value: 1, title: "Dushanba"},
    {value: 2, title: "Seshanba"},
    {value: 3, title: "Chorshanba"},
    {value: 4, title: "Payshanba"},
    {value: 5, title: "Juma"},
    {value: 6, title: "Shanba"},
    {value: 7, title: "Yakshanba"},
  ];

  // Validation rules
  const rules = {
    required: (value) => !!value || "To'ldirish shart",
    requiredNumber: (value) =>
      (value !== null && value !== "" && value >= 0) || "To'ldirish shart",
    positiveNumber: (value) => value > 0 || "Musbat son bo'lishi kerak",
    timeFormat: (value) => {
      if (!value) return "To'ldirish shart";
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      return timeRegex.test(value) || "HH:MM formatida kiriting (masalan: 09:00)";
    },
  };

  // Computed
  const isChannel = computed(() => form.value.telegramResourceType === 'PRIVATE_CHANNEL');

  const paymentTypeDescription = computed(() => {
    const descriptions = {
      START_TO_END_OF_MONTH: "Dars boshlanish sanasidan oyni oxirigacha hisoblanadi va keyingi oylar to'liq 1 oy hisoblanadi.",
      MONTHLY_SAME_DATE: "Dars boshlangan sanadan boshlab keyingi oyning shu sanasigacha 1 oy hisoblanadi.",
      ONE_TIME: "Butun kurs davri uchun shu narx bir marta yechiladi",
      LESSON_BASED: "Bunda yozgan darslar sonidan kelib chiqib 1 oylik pul hisoblanadi. Masalan: 12 ta dars 1 oy deb hisoblanadi.",
    };
    return descriptions[form.value.paymentType] || "";
  });

  const courseDurationMonths = computed(() => {
    if (!form.value.courseStartDate || !form.value.courseEndDate) return 0;

    const parseDate = (dateStr) => {
      if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split(".");
        return new Date(year, month - 1, day);
      }
      return new Date(dateStr);
    };

    const start = parseDate(form.value.courseStartDate);
    const end = parseDate(form.value.courseEndDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    const diffTime = end.getTime() - start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const months = diffDays / 30;

    return Math.round(months * 10) / 10;
  });

  const totalMonthlyPayment = computed(() => {
    if (!form.value.monthlyPrice || !courseDurationMonths.value) return 0;
    return Math.ceil(courseDurationMonths.value) * form.value.monthlyPrice;
  });

  const wholePeriodSavings = computed(() => {
    if (!form.value.wholePeriodPrice || !totalMonthlyPayment.value) return 0;
    return totalMonthlyPayment.value - form.value.wholePeriodPrice;
  });

  const wholePeriodSavingsPercent = computed(() => {
    if (!wholePeriodSavings.value || !totalMonthlyPayment.value) return 0;
    return Math.round((wholePeriodSavings.value / totalMonthlyPayment.value) * 100);
  });

  // Formatting helpers
  const formatMoneyInput = (value) => {
    const numericValue = value.replace(/\s/g, "");
    const number = parseInt(numericValue, 10);
    if (isNaN(number)) {
      form.value.monthlyPrice = null;
      form.value.monthlyPriceDisplay = "";
    } else {
      form.value.monthlyPrice = number;
      form.value.monthlyPriceDisplay = prettyMoney(number);
    }
  };

  const formatTrialPrice = (value) => {
    const numericValue = value.replace(/\s/g, "");
    const number = parseInt(numericValue, 10);
    if (isNaN(number)) {
      form.value.trialPrice = null;
      form.value.trialPriceDisplay = "";
    } else {
      form.value.trialPrice = number;
      form.value.trialPriceDisplay = prettyMoney(number);
    }
  };

  const formatWholePeriodPrice = (value) => {
    const numericValue = value.replace(/\s/g, "");
    const number = parseInt(numericValue, 10);
    if (isNaN(number)) {
      form.value.wholePeriodPrice = null;
      form.value.wholePeriodPriceDisplay = "";
    } else {
      form.value.wholePeriodPrice = number;
      form.value.wholePeriodPriceDisplay = prettyMoney(number);
    }
  };

  const formatDiscountAmount = (index, value) => {
    const numericValue = value.replace(/\s/g, "");
    const number = parseInt(numericValue, 10);
    if (isNaN(number)) {
      form.value.discounts[index].discountAmount = null;
      form.value.discounts[index].discountAmountDisplay = "";
    } else {
      form.value.discounts[index].discountAmount = number;
      form.value.discounts[index].discountAmountDisplay = prettyMoney(number);
    }
  };

  const getDiscountExample = (discount) => {
    if (!form.value.monthlyPrice || !discount.months || !discount.discountAmount) return null;
    
    const totalOriginal = form.value.monthlyPrice * discount.months;
    const totalWithDiscount = totalOriginal - discount.discountAmount;
    
    return {
      monthlyPrice: prettyMoney(form.value.monthlyPrice),
      months: discount.months,
      totalOriginal: prettyMoney(totalOriginal),
      discountAmount: prettyMoney(discount.discountAmount),
      totalWithDiscount: prettyMoney(totalWithDiscount)
    };
  };

  // Date conversion
  const convertDateToISO = (value) => {
    if (!value) return undefined;

    const dateString = String(value).trim();

    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split(".");
      const date = new Date(Date.UTC(year, month - 1, day));
      return date.toISOString();
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-");
      const date = new Date(Date.UTC(year, month - 1, day));
      return date.toISOString();
    }

    if (/^\d{4}-\d{2}-\d{2}T/.test(dateString)) {
      return dateString;
    }

    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (e) {
      console.error("Date conversion failed:", e);
    }

    return dateString;
  };

  // Teacher management
  const addTeacher = () => {
    form.value.teachers.push({teacherId: null, isPrimary: false});
  };

  const removeTeacher = (index) => {
    if (form.value.teachers.length > 1) {
      form.value.teachers.splice(index, 1);
    }
  };

  const setPrimaryTeacher = (index) => {
    form.value.teachers.forEach((teacher, i) => {
      teacher.isPrimary = i === index;
    });
  };

  // Schedule management
  const addLessonSchedule = () => {
    form.value.lessonSchedules.push({dayOfWeek: null, startTime: "", endTime: ""});
  };

  const removeLessonSchedule = (index) => {
    if (form.value.lessonSchedules.length > 1) {
      form.value.lessonSchedules.splice(index, 1);
    }
  };

  // Discount management
  const addDiscount = () => {
    form.value.discounts.push({months: null, discountAmount: null, discountAmountDisplay: ""});
  };

  const removeDiscount = (index) => {
    form.value.discounts.splice(index, 1);
  };

  // Fetch teachers
  const fetchTeachers = async () => {
    loadingTeachers.value = true;
    try {
      const response = await $api("/v1/teachers?page=1&limit=200", {
        method: "GET",
      });

      if (response.success && response.data) {
        teachersList.value = response.data.data.map((teacher) => ({
          value: teacher.id,
          title: `${teacher.user?.firstName || ""} ${teacher.user?.lastName || ""} ${teacher.specialty ? `(${teacher.specialty})` : ""}`.trim(),
        }));
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      showError("O'qituvchilar ro'yxatini yuklashda xatolik");
    } finally {
      loadingTeachers.value = false;
    }
  };

  // Validation
  const validateForm = () => {
    errorMessage.value = "";

    if (!form.value.name) {
      errorMessage.value = isChannel.value ? "Kanal nomini kiriting" : "Guruh nomini kiriting";
      return false;
    }

    if (form.value.monthlyPrice === null || form.value.monthlyPrice < 0) {
      errorMessage.value = "Oylik to'lovni kiriting";
      return false;
    }

    if (!isChannel.value) {
      if (!form.value.courseStartDate) {
        errorMessage.value = "Kurs boshlanish sanasini kiriting";
        return false;
      }

      if (!form.value.courseEndDate) {
        errorMessage.value = "Kurs tugash sanasini kiriting";
        return false;
      }

      if (!form.value.paymentType) {
        errorMessage.value = "To'lov turini tanlang";
        return false;
      }

      if (form.value.trialPaymentType === "PAID" && (form.value.trialPrice === null || form.value.trialPrice < 0)) {
        errorMessage.value = "Sinov darsi narxini kiriting";
        return false;
      }

      if (form.value.paymentType === "LESSON_BASED" && (!form.value.lessonsPerPaymentPeriod || form.value.lessonsPerPaymentPeriod < 1)) {
        errorMessage.value = "Darslar sonini kiriting";
        return false;
      }

      if (form.value.teachers.length === 0) {
        errorMessage.value = "Kamida bitta o'qituvchi qo'shing";
        return false;
      }

      const hasEmptyTeacher = form.value.teachers.some((t) => !t.teacherId);
      if (hasEmptyTeacher) {
        errorMessage.value = "Barcha o'qituvchilarni tanlang";
        return false;
      }

      const primaryTeachers = form.value.teachers.filter((t) => t.isPrimary);
      if (primaryTeachers.length !== 1) {
        errorMessage.value = "Faqat bitta asosiy o'qituvchi bo'lishi kerak";
        return false;
      }

      if (form.value.lessonSchedules.length === 0) {
        errorMessage.value = "Kamida bitta dars jadvalini qo'shing";
        return false;
      }

      const hasEmptySchedule = form.value.lessonSchedules.some((s) => !s.dayOfWeek || !s.startTime || !s.endTime);
      if (hasEmptySchedule) {
        errorMessage.value = "Barcha dars jadvallarini to'ldiring";
        return false;
      }

      const days = form.value.lessonSchedules.map((s) => s.dayOfWeek);
      const uniqueDays = new Set(days);
      if (days.length !== uniqueDays.size) {
        errorMessage.value = "Bir xil kunlar takrorlanmasligi kerak";
        return false;
      }

      for (const schedule of form.value.lessonSchedules) {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
          errorMessage.value = "Vaqtni HH:MM formatida kiriting (masalan: 09:00)";
          return false;
        }

        if (schedule.startTime >= schedule.endTime) {
          errorMessage.value = "Tugash vaqti boshlanish vaqtidan kechroq bo'lishi kerak";
          return false;
        }
      }
    }

    if (!isChannel.value && form.value.discounts.length > 0) {
      const hasEmptyDiscount = form.value.discounts.some((d) => d.months === null || d.months < 2 || d.discountAmount === null);
      if (hasEmptyDiscount) {
        errorMessage.value = "Chegirmalar kamida 2 oydan boshlanishi kerak";
        return false;
      }

      const months = form.value.discounts.map((d) => d.months);
      const uniqueMonths = new Set(months);
      if (months.length !== uniqueMonths.size) {
        errorMessage.value = "Bir xil oylar uchun chegirma takrorlanmasligi kerak";
        return false;
      }
    }

    return true;
  };

  // Submit
  const onSubmit = async () => {
    if (!validateForm()) return;

    loading.value = true;
    errorMessage.value = "";

    try {
      const startDateISO = isChannel.value ? undefined : convertDateToISO(form.value.courseStartDate);
      const endDateISO = isChannel.value ? undefined : convertDateToISO(form.value.courseEndDate);

      const payload = {
        name: form.value.name,
        description: form.value.description || undefined,
        monthlyPrice: form.value.monthlyPrice,
        telegramResourceType: form.value.telegramResourceType,
        studentsCanWrite: isChannel.value ? false : form.value.studentsCanWrite,
      };

      if (!isChannel.value) {
        Object.assign(payload, {
          wholePeriodPrice: form.value.wholePeriodPrice || undefined,
          courseStartDate: startDateISO,
          courseEndDate: endDateISO,
          paymentType: form.value.paymentType,
          trialPaymentType: form.value.trialPaymentType,
          trialPrice: form.value.trialPaymentType === "PAID" ? form.value.trialPrice : undefined,
          lessonsPerPaymentPeriod: form.value.paymentType === "LESSON_BASED" ? form.value.lessonsPerPaymentPeriod : undefined,
          teachers: form.value.teachers.map((t) => ({teacherId: t.teacherId, isPrimary: t.isPrimary})),
          lessonSchedules: form.value.lessonSchedules.map((s) => ({dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime})),
          discounts: form.value.discounts.length > 0 ? form.value.discounts.map((d) => ({months: d.months, discountAmount: d.discountAmount})) : undefined,
        });
      }

      const response = await $api("/v1/groups", {
        method: "POST",
        body: payload,
      });

      if (response.success) {
        showSuccess("Guruh muvaffaqiyatli yaratildi!");
        botUsername.value = response.setupInstructions?.botUsername || "";
        createdTelegramResourceType.value = response.setupInstructions?.telegramResourceType || form.value.telegramResourceType;
        createdConnectToken.value = response.setupInstructions?.connectToken || "";
        showTelegramSetupModal.value = true;
        return true;
      } else {
        errorMessage.value = response.message || "Xatolik yuz berdi";
        return false;
      }
    } catch (error) {
      errorMessage.value = error.data?.message || error.message || "Guruh yaratishda xatolik yuz berdi";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const onCancel = () => {
    router.go(-1);
  };

  const handleSetupModalClose = () => {
    showTelegramSetupModal.value = false;
    router.push("/groups");
  };

  // Watch for resource type changes
  watch(() => form.value.telegramResourceType, (newType) => {
    if (newType === 'PRIVATE_CHANNEL') {
      form.value.paymentType = 'MONTHLY_SAME_DATE';
      form.value.trialPaymentType = 'OFF';
      form.value.studentsCanWrite = false;
    } else {
      form.value.studentsCanWrite = true;
    }
  });

  return {
    // State
    form,
    loading,
    errorMessage,
    teachersList,
    loadingTeachers,
    showTelegramSetupModal,
    botUsername,
    createdTelegramResourceType,
    createdConnectToken,
    // Options
    paymentTypes,
    trialPaymentTypes,
    telegramResourceTypes,
    daysOfWeek,
    rules,
    // Computed
    isChannel,
    paymentTypeDescription,
    courseDurationMonths,
    totalMonthlyPayment,
    wholePeriodSavings,
    wholePeriodSavingsPercent,
    // Methods
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
    validateForm,
    onSubmit,
    onCancel,
    handleSetupModalClose,
  };
}

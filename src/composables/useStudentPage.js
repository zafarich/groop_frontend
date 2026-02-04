import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";

export function useStudentPage(studentId) {
  const {success: showSuccess, error: showError} = useToast();

  // State
  const loading = ref(false);
  const student = ref(null);
  const groups = ref([]);
  const groupsLoading = ref(false);
  const balanceSummary = ref(null);
  const balanceSummaryLoading = ref(false);
  const payments = ref([]);
  const paymentsLoading = ref(false);
  const statusLogs = ref([]);
  const statusLogsLoading = ref(false);

  // Data Fetching
  const fetchStudent = async () => {
    loading.value = true;
    try {
      const res = await $api(`/v1/students/${studentId.value}`);
      if (res.success) {
        student.value = res.data?.data;
      }
    } catch (err) {
      showError(err.data?.message || "Error fetching student");
    } finally {
      loading.value = false;
    }
  };

  const fetchGroups = async () => {
    groupsLoading.value = true;
    try {
      const res = await $api(`/v1/students/${studentId.value}/groups`);
      if (res.success) {
        groups.value = res.data?.data;
      }
    } catch (err) {
      console.error(err);
    } finally {
      groupsLoading.value = false;
    }
  };

  const fetchBalanceSummary = async () => {
    balanceSummaryLoading.value = true;
    try {
      const res = await $api(`/v1/students/${studentId.value}/balance-summary`);
      if (res.success) {
        balanceSummary.value = res?.data;
      }
    } catch (err) {
      console.error(err);
    } finally {
      balanceSummaryLoading.value = false;
    }
  };

  const fetchPayments = async () => {
    paymentsLoading.value = true;
    try {
      const res = await $api(`/v1/students/${studentId.value}/payments`);
      if (res.success) {
        payments.value = res.data?.data;
      }
    } catch (err) {
      console.error(err);
    } finally {
      paymentsLoading.value = false;
    }
  };

  const fetchStatusLogs = async () => {
    statusLogsLoading.value = true;
    try {
      const res = await $api(`/v1/students/${studentId.value}/status-logs`);
      if (res.success) {
        statusLogs.value = res.data?.data;
      }
    } catch (err) {
      console.error(err);
    } finally {
      statusLogsLoading.value = false;
    }
  };

  const refreshAll = () => {
    fetchStudent();
    fetchGroups();
    fetchBalanceSummary();
    fetchPayments();
    fetchStatusLogs();
  };

  // Actions
  const addBalance = async (enrollmentId, data) => {
    try {
      const res = await $api(
        `/v1/enrollments/${enrollmentId}/add-balance`,
        {
          method: "POST",
          body: data,
        },
      );
      if (res.success) {
        showSuccess("Balans to'ldirildi");
        refreshAll();
        return true;
      } else {
        showError(res.message);
        return false;
      }
    } catch (e) {
      showError(e.data?.message || "Xatolik");
      return false;
    }
  };

  const setDiscount = async (enrollmentId, data) => {
    try {
      const res = await $api(
        `/v1/enrollments/${enrollmentId}/discount`,
        {
          method: "PATCH",
          body: data,
        },
      );
      if (res.success) {
        showSuccess("Chegirma belgilandi");
        fetchGroups();
        return true;
      } else {
        showError(res.message);
        return false;
      }
    } catch (e) {
      showError(e.data?.message || "Xatolik");
      return false;
    }
  };

  const expelStudent = async (enrollmentId, reason) => {
    try {
      const res = await $api(
        `/v1/enrollments/${enrollmentId}/expel`,
        {
          method: "PATCH",
          body: {reason},
        },
      );
      if (res.success) {
        showSuccess("Guruhdan chetlatildi");
        refreshAll();
        return true;
      } else {
        showError(res.message);
        return false;
      }
    } catch (e) {
      showError(e.data?.message || "Xatolik");
      return false;
    }
  };

  const activateStudent = async (enrollmentId, lessonStartDate) => {
    try {
      const res = await $api(
        `/v1/enrollments/${enrollmentId}/activate`,
        {
          method: "PATCH",
          body: {lessonStartDate},
        },
      );
      if (res.success) {
        showSuccess("O'quvchi faollashtirildi");
        refreshAll();
        return true;
      } else {
        showError(res.message);
        return false;
      }
    } catch (e) {
      showError(e.data?.message || "Xatolik");
      return false;
    }
  };

  const getActivationPreview = async (enrollmentId, lessonStartDate) => {
    try {
      const res = await $api(
        `/v1/enrollments/${enrollmentId}/activation-preview?lessonStartDate=${lessonStartDate}`,
      );
      if (res.success) {
        return res.data;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const editPayment = async (paymentId, data) => {
    try {
      const res = await $api(`/v1/payments/${paymentId}`, {
        method: "PATCH",
        body: data,
      });
      if (res.success) {
        showSuccess("To'lov tahrirlandi");
        refreshAll();
        return true;
      } else {
        showError(res.message);
        return false;
      }
    } catch (e) {
      showError(e.data?.message || "Xatolik");
      return false;
    }
  };

  const deletePayment = async (paymentId) => {
    try {
      const res = await $api(`/v1/payments/${paymentId}`, {
        method: "DELETE",
      });
      if (res.success) {
        showSuccess("To'lov o'chirildi");
        refreshAll();
        return true;
      } else {
        showError(res.message);
        return false;
      }
    } catch (e) {
      showError(e.data?.message || "Xatolik");
      return false;
    }
  };

  return {
    // State
    loading,
    student,
    groups,
    groupsLoading,
    balanceSummary,
    balanceSummaryLoading,
    payments,
    paymentsLoading,
    statusLogs,
    statusLogsLoading,
    // Methods
    fetchStudent,
    fetchGroups,
    fetchBalanceSummary,
    fetchPayments,
    fetchStatusLogs,
    refreshAll,
    addBalance,
    setDiscount,
    expelStudent,
    activateStudent,
    getActivationPreview,
    editPayment,
    deletePayment,
  };
}

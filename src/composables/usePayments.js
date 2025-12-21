import {ref} from "vue";
import {$api} from "@/utils/api";

/**
 * Composable for managing payments API calls
 * @returns {Object} Payments state and methods
 */
export function usePayments() {
  const payments = ref([]);
  const stats = ref({
    pending: 0,
    paid: 0,
    overdue: 0,
    cancelled: 0,
    refunded: 0,
    total: 0,
  });
  const meta = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetch payments with optional filters
   * @param {Object} filters - Filter options
   * @param {string} [filters.status] - Payment status (PENDING, PAID, CANCELLED, OVERDUE, REFUNDED)
   * @param {number} [filters.groupId] - Group ID filter
   * @param {string} [filters.search] - Search by student name or phone
   * @param {number} [filters.page=1] - Page number
   * @param {number} [filters.limit=10] - Items per page
   */
  const fetchPayments = async (filters = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams();

      if (filters.status) params.append("status", filters.status);
      if (filters.groupId) params.append("groupId", String(filters.groupId));
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));

      const response = await $api(`/v1/payments?${params.toString()}`, {
        method: "GET",
      });

      if (response.success && response.data) {
        payments.value = response.data;
        meta.value = response.meta || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        };
      }
    } catch (err) {
      error.value = err;
      console.error("Failed to fetch payments:", err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Fetch payment statistics
   */
  const fetchStats = async () => {
    try {
      const response = await $api("/v1/payments/stats", {
        method: "GET",
      });

      if (response.success && response.data) {
        stats.value = response.data;
      }
    } catch (err) {
      console.error("Failed to fetch payment stats:", err);
    }
  };

  /**
   * Get a single payment by ID
   * @param {number} id - Payment ID
   */
  const getPayment = async (id) => {
    try {
      const response = await $api(`/v1/payments/${id}`, {
        method: "GET",
      });

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error("Failed to fetch payment:", err);
      return null;
    }
  };

  /**
   * Approve a payment
   * @param {number} id - Payment ID
   * @param {string} [notes] - Optional notes
   * @returns {Object} Result with success status and data/error
   */
  const approvePayment = async (id, notes = null) => {
    try {
      const body = {};
      if (notes) body.notes = notes;

      const response = await $api(`/v1/payments/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (err) {
      console.error("Failed to approve payment:", err);
      return {
        success: false,
        error: err,
        message: err.message || "To'lovni tasdiqlashda xatolik yuz berdi",
      };
    }
  };

  /**
   * Reject a payment
   * @param {number} id - Payment ID
   * @param {string} reason - Rejection reason (required)
   * @returns {Object} Result with success status and data/error
   */
  const rejectPayment = async (id, reason) => {
    try {
      const response = await $api(`/v1/payments/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({reason}),
      });

      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (err) {
      console.error("Failed to reject payment:", err);
      return {
        success: false,
        error: err,
        message: err.message || "To'lovni bekor qilishda xatolik yuz berdi",
      };
    }
  };

  return {
    // State
    payments,
    stats,
    meta,
    loading,
    error,
    // Methods
    fetchPayments,
    fetchStats,
    getPayment,
    approvePayment,
    rejectPayment,
  };
}

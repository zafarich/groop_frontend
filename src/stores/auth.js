import {$api} from "@/utils/api";
import {defineStore} from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    accessToken: useCookie("accessToken").value || null,
    refreshToken: useCookie("refreshToken").value || null,
    userData: useCookie("userData").value || null,
    loading: false,
    error: null,
    pendingPhoneNumber: useCookie("pendingPhoneNumber").value || null, // SMS kod uchun
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    currentUser: (state) => state.userData || state.user,
  },

  actions: {
    // Login
    async login(credentials) {
      this.loading = true;
      this.error = null;

      try {
        const response = await $api("/v1/auth/login", {
          method: "POST",
          body: {
            phoneNumber: credentials.phoneNumber,
            password: credentials.password,
          },
        });

        // API response: { success, code, data: { user, accessToken, refreshToken }, message }
        if (!response.success || !response.data) {
          throw new Error(response.message || "Login xatosi yuz berdi");
        }

        this.accessToken = response.data.accessToken;
        this.refreshToken = response.data.refreshToken;
        this.user = response.data.user;
        this.userData = response.data.user;

        // Cookie'larga saqlash
        useCookie("accessToken").value = response.data.accessToken;
        useCookie("refreshToken").value = response.data.refreshToken;
        useCookie("userData").value = response.data.user;

        return {success: true, data: response.data};
      } catch (error) {
        this.error =
          error.data?.message || error.message || "Login xatosi yuz berdi";

        return {success: false, error: this.error};
      } finally {
        this.loading = false;
      }
    },

    // Register Center (1-bosqich - SMS kod yuborish)
    async registerCenter(centerData) {
      this.loading = true;
      this.error = null;

      try {
        const response = await $api("/v1/auth/register-center", {
          method: "POST",
          body: {
            centerName: centerData.centerName,
            phoneNumber: centerData.phoneNumber,
            password: centerData.password,
            firstName: centerData.firstName,
            lastName: centerData.lastName,
          },
        });

        // API response: { success, code, data: { phoneNumber }, message }
        if (!response.success || !response.data) {
          throw new Error(
            response.message || "Ro'yxatdan o'tishda xatolik yuz berdi",
          );
        }

        // Telefon raqamini saqlash (SMS kod sahifasida ishlatish uchun)
        this.pendingPhoneNumber = response.data.phoneNumber;
        useCookie("pendingPhoneNumber").value = response.data.phoneNumber;

        return {success: true, data: response.data};
      } catch (error) {
        this.error =
          error.data?.message ||
          error.message ||
          "Ro'yxatdan o'tishda xatolik yuz berdi";

        return {success: false, error: this.error};
      } finally {
        this.loading = false;
      }
    },

    // Verify Center (2-bosqich - SMS kodni tasdiqlash)
    async verifyCenter(phoneNumber, code) {
      this.loading = true;
      this.error = null;

      try {
        const response = await $api("/v1/auth/verify-center", {
          method: "POST",
          body: {
            phoneNumber,
            code,
          },
        });

        // API response: { success, code, data: { user, accessToken, refreshToken }, message }
        if (!response.success || !response.data) {
          throw new Error(
            response.message || "SMS kod tasdiqlashda xatolik yuz berdi",
          );
        }

        // Muvaffaqiyatli tasdiqlash - tokenlarni saqlash
        this.accessToken = response.data.accessToken;
        this.refreshToken = response.data.refreshToken;
        this.user = response.data.user;
        this.userData = response.data.user;

        // Cookie'larga saqlash
        useCookie("accessToken").value = response.data.accessToken;
        useCookie("refreshToken").value = response.data.refreshToken;
        useCookie("userData").value = response.data.user;

        // Pending phone number'ni tozalash
        this.pendingPhoneNumber = null;
        useCookie("pendingPhoneNumber").value = null;

        return {success: true, data: response.data};
      } catch (error) {
        this.error =
          error.data?.message ||
          error.message ||
          "SMS kod tasdiqlashda xatolik yuz berdi";

        return {success: false, error: this.error};
      } finally {
        this.loading = false;
      }
    },

    // Register (eski - oddiy ro'yxatdan o'tish)
    async register(userData) {
      this.loading = true;
      this.error = null;

      try {
        const response = await $api("/auth/register", {
          method: "POST",
          body: userData,
        });

        // API response: { success, code, data: { user, accessToken, refreshToken }, message }
        if (!response.success || !response.data) {
          throw new Error(
            response.message || "Ro'yxatdan o'tishda xatolik yuz berdi",
          );
        }

        // Avtomatik login qilish (agar backend token qaytarsa)
        if (response.data.accessToken) {
          this.accessToken = response.data.accessToken;
          this.refreshToken = response.data.refreshToken;
          this.user = response.data.user;
          this.userData = response.data.user;

          useCookie("accessToken").value = response.data.accessToken;
          useCookie("refreshToken").value = response.data.refreshToken;
          useCookie("userData").value = response.data.user;
        }

        return {success: true, data: response.data};
      } catch (error) {
        this.error =
          error.data?.message ||
          error.message ||
          "Ro'yxatdan o'tishda xatolik yuz berdi";

        return {success: false, error: this.error};
      } finally {
        this.loading = false;
      }
    },

    // Logout
    logout() {
      this.accessToken = null;
      this.refreshToken = null;
      this.userData = null;
      this.user = null;
      this.pendingPhoneNumber = null;

      // Cookie'larni tozalash
      useCookie("accessToken").value = null;
      useCookie("refreshToken").value = null;
      useCookie("userData").value = null;
      useCookie("pendingPhoneNumber").value = null;
    },

    // Foydalanuvchi ma'lumotlarini yangilash
    async fetchUser() {
      if (!this.accessToken) return;

      try {
        const response = await $api("/v1/auth/me", {
          method: "POST",
        });

        // Response is wrapped in { success, code, data, message } format by backend interceptor
        // The actual user data is in response.data
        const user = response.data || response;
        this.user = user;
        this.userData = user;
        useCookie("userData").value = user;
      } catch (error) {
        // Token noto'g'ri bo'lsa logout qilish
        if (error.status === 401) this.logout();
      }
    },

    // Token yangilash
    async refreshAccessToken() {
      if (!this.refreshToken) return false;

      try {
        const response = await $api("/auth/refresh", {
          method: "POST",
          body: {
            refreshToken: this.refreshToken,
          },
        });

        this.accessToken = response.accessToken;
        if (response.refreshToken) {
          this.refreshToken = response.refreshToken;
          useCookie("refreshToken").value = response.refreshToken;
        }
        useCookie("accessToken").value = response.accessToken;

        return true;
      } catch (error) {
        this.logout();

        return false;
      }
    },

    // State'ni qayta tiklash (refresh paytida)
    initAuth() {
      const accessToken = useCookie("accessToken").value;
      const refreshToken = useCookie("refreshToken").value;
      const userData = useCookie("userData").value;
      const pendingPhoneNumber = useCookie("pendingPhoneNumber").value;

      if (accessToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userData = userData;
      }

      if (pendingPhoneNumber) {
        this.pendingPhoneNumber = pendingPhoneNumber;
      }
    },

    // Resend Forgot Password Code
    async resendForgotPassword(phoneNumber) {
      this.loading = true;
      this.error = null;

      try {
        const response = await $api("/v1/auth/forgot-password/resend", {
          method: "POST",
          body: {
            phoneNumber,
          },
        });

        // API response: { success, code, data: { message, phoneNumber }, message }
        if (!response.success || !response.data) {
          throw new Error(
            response.message || "Kod yuborishda xatolik yuz berdi",
          );
        }

        return {success: true, data: response.data};
      } catch (error) {
        this.error =
          error.data?.message ||
          error.message ||
          "Kod yuborishda xatolik yuz berdi";

        return {success: false, error: this.error};
      } finally {
        this.loading = false;
      }
    },

    // Verify Forgot Password Code
    async verifyForgotPassword(phoneNumber, code) {
      this.loading = true;
      this.error = null;

      try {
        const response = await $api("/v1/auth/verify-forgot-password", {
          method: "POST",
          body: {
            phoneNumber,
            code,
          },
        });

        // API response: { success, code, data: { message, ... }, message }
        if (!response.success || !response.data) {
          throw new Error(
            response.message || "Kod tasdiqlashda xatolik yuz berdi",
          );
        }

        return {success: true, data: response.data};
      } catch (error) {
        this.error =
          error.data?.message ||
          error.message ||
          "Kod tasdiqlashda xatolik yuz berdi";

        return {success: false, error: this.error};
      } finally {
        this.loading = false;
      }
    },

    // Reset Password
    async resetPassword({phoneNumber, code, newPassword}) {
      this.loading = true;
      this.error = null;

      try {
        const response = await $api("/v1/auth/reset-password", {
          method: "POST",
          body: {
            phoneNumber,
            code,
            newPassword,
          },
        });

        // API response: { success, code, data: { message, ... }, message }
        if (!response.success) {
          throw new Error(
            response.message || "Parolni o'zgartirishda xatolik yuz berdi",
          );
        }

        return {success: true, data: response.data};
      } catch (error) {
        this.error =
          error.data?.message ||
          error.message ||
          "Parolni o'zgartirishda xatolik yuz berdi";

        return {success: false, error: this.error};
      } finally {
        this.loading = false;
      }
    },
  },
});

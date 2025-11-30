import {ref} from "vue";

const snackbar = ref({
  show: false,
  message: "",
  color: "success",
  timeout: 3000,
});

export function useToast() {
  const showToast = (message, color = "success", timeout = 3000) => {
    snackbar.value = {
      show: true,
      message,
      color,
      timeout,
    };
  };

  const success = (message, timeout = 3000) => {
    showToast(message, "success", timeout);
  };

  const error = (message, timeout = 3000) => {
    showToast(message, "error", timeout);
  };

  const info = (message, timeout = 3000) => {
    showToast(message, "info", timeout);
  };

  const warning = (message, timeout = 3000) => {
    showToast(message, "warning", timeout);
  };

  return {
    snackbar,
    showToast,
    success,
    error,
    info,
    warning,
  };
}

/**
 * Telefon raqami uchun mask composable
 * O'zbekiston telefon raqamlari uchun: +998 (XX) XXX-XX-XX
 */

export const usePhoneMask = () => {
  // Telefon raqamini formatlash
  const formatPhoneNumber = value => {
    // Faqat raqamlarni qoldirish
    const digits = String(value || '').replace(/\D/g, '')

    // Maximum 9 ta raqam
    const limited = digits.slice(0, 9)

    // Format: (XX) XXX-XX-XX
    if (limited.length <= 2) {
      return limited
    } else if (limited.length <= 5) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 5)}-${limited.slice(5)}`
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 5)}-${limited.slice(5, 7)}-${limited.slice(7)}`
    }
  }

  // Faqat raqamlarni olish
  const getDigitsOnly = value => {
    return String(value || '').replace(/\D/g, '')
  }

  // To'liq telefon raqamini olish (998 + kiritilgan raqam)
  const getFullPhoneNumber = value => {
    const digits = getDigitsOnly(value)

    return digits ? `998${digits}` : ''
  }

  // Telefon raqamini validatsiya qilish
  const isValidPhone = value => {
    const digits = getDigitsOnly(value)

    return digits.length === 9
  }

  // Validatsiya xabari
  const phoneValidationMessage = "Telefon raqami 9 ta raqamdan iborat bo'lishi kerak"

  // Vuetify uchun validation rule
  const phoneRule = value => {
    if (!value) return true // required rule alohida tekshiradi
    const digits = getDigitsOnly(value)

    return digits.length === 9 || phoneValidationMessage
  }

  // Input handler - mask qo'llash
  const createPhoneInputHandler = phoneRef => {
    return event => {
      const input = event.target
      const cursorPosition = input.selectionStart
      const oldValue = phoneRef.value
      const newValue = formatPhoneNumber(input.value)

      phoneRef.value = newValue

      // Cursor pozitsiyasini saqlash
      nextTick(() => {
        const diff = newValue.length - oldValue.length
        const newPosition = Math.max(0, cursorPosition + diff)
        input.setSelectionRange(newPosition, newPosition)
      })
    }
  }

  return {
    formatPhoneNumber,
    getDigitsOnly,
    getFullPhoneNumber,
    isValidPhone,
    phoneValidationMessage,
    phoneRule,
    createPhoneInputHandler,
  }
}

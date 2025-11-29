/**
 * Auth Middleware
 * Router guard - foydalanuvchi autentifikatsiyasini tekshiradi
 */

export const setupAuthMiddleware = router => {
  router.beforeEach((to, from, next) => {
    const accessToken = useCookie('accessToken').value
    const isAuthenticated = !!accessToken

    // Public sahifalar (login, register va boshqalar)
    const isPublicRoute = to.meta.public === true

    // Agar public sahifa bo'lsa va foydalanuvchi allaqachon login qilgan bo'lsa
    // Uni asosiy sahifaga yo'naltirish
    if (isPublicRoute && isAuthenticated) {
      // Login/register sahifalariga kirmaslik uchun
      const authPages = [
        '/login',
        '/register',
        '/forgot-password',
        '/verify-code',
        '/reset-password',
      ]

      if (authPages.includes(to.path)) {
        return next({ path: '/' })
      }
    }

    // Agar protected sahifa bo'lsa va foydalanuvchi login qilmagan bo'lsa
    if (!isPublicRoute && !isAuthenticated) {
      // Login sahifasiga yo'naltirish
      return next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }

    // Boshqa holatlarda davom etish
    next()
  })
}

/**
 * Role-based access control middleware (ixtiyoriy)
 * Agar role tekshiruvi kerak bo'lsa ishlatiladi
 */
export const checkRole = (allowedRoles = []) => {
  return (to, from, next) => {
    const userData = useCookie('userData').value

    if (!userData) {
      return next({ path: '/login' })
    }

    const userRole = userData.role

    if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
      return next()
    }

    // Ruxsat yo'q - 403 sahifasiga yoki boshqa joyga yo'naltirish
    return next({ path: '/not-authorized' })
  }
}

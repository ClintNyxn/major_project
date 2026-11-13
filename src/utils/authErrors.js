export function authErrorMessage(error, fallback) {
  const message = error?.message || fallback
  if (/sending confirmation email/i.test(message)) {
    return 'Supabase could not send the verification email. A project owner must configure a custom SMTP provider in Authentication → SMTP Settings, or turn off "Confirm email" for testing. Until then, email signup cannot finish; choose "Continue without an account" to use guest mode.'
  }
  if (/email address not authorized/i.test(message)) {
    return 'Supabase’s built-in email sender only delivers to project team addresses. Configure a custom SMTP provider in the project’s Auth settings to email other addresses.'
  }
  if (error?.status === 429 || /rate limit/i.test(message)) {
    return 'Supabase is rate-limiting email requests. Wait before requesting another link, or configure a custom SMTP provider for higher sending limits.'
  }
  return message
}

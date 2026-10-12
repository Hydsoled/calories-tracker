type SignupError = { code?: string; status?: number; message: string };

export function describeSignupError(error: SignupError): string {
  switch (error.code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many signup attempts or emails. Please wait before trying again.";
    case "email_address_not_authorized":
      return "Confirmation emails cannot be sent to this address yet. Please contact the app administrator.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "Email registration is currently disabled. Please contact the app administrator.";
    case "weak_password":
      return "This password does not meet the account security requirements. Choose a stronger password.";
    case "email_address_invalid":
      return "This email address is not accepted. Check the address and try again.";
    case "captcha_failed":
      return "Signup verification failed. Please contact the app administrator.";
    default:
      return "Could not create your account. Please try again shortly or contact the app administrator.";
  }
}

// Log only bounded diagnostic fields, never the error object, email or password.
export function signupDiagnostic(error: SignupError) {
  return {
    code: error.code && /^[a-z_]{1,80}$/.test(error.code) ? error.code : "unknown",
    status: error.status,
    category: /database error/i.test(error.message)
      ? "database"
      : /sending.*email/i.test(error.message)
        ? "email_delivery"
        : "auth",
  };
}

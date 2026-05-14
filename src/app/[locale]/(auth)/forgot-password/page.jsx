import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordClient from "@/components/auth/ForgotPasswordClient";

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordClient />
    </AuthShell>
  );
}

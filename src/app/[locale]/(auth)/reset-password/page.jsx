import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordClient from "@/components/auth/ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <ResetPasswordClient />
    </AuthShell>
  );
}

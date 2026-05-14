import AuthShell from "@/components/auth/AuthShell";
import VerifyEmailClient from "@/components/auth/VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <VerifyEmailClient />
    </AuthShell>
  );
}

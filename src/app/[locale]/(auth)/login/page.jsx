import AuthShell from "@/components/auth/AuthShell";
import LoginClient from "@/components/auth/LoginClient";

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginClient />
    </AuthShell>
  );
}

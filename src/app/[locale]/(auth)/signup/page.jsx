import AuthShell from "@/components/auth/AuthShell";
import SignupClient from "@/components/auth/SignupClient";

export default function SignupPage() {
  return (
    <AuthShell>
      <SignupClient />
    </AuthShell>
  );
}

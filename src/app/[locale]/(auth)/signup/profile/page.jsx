import { redirect } from "@/i18n/navigation";
import AuthShell from "@/components/auth/AuthShell";
import PartnerProfileClient from "@/components/auth/PartnerProfileClient";
import CompanyProfileClient from "@/components/auth/CompanyProfileClient";

export default async function SignupProfilePage({ params, searchParams }) {
  const { locale } = await params;
  const sp = await searchParams;
  const role = sp?.role;

  if (role !== "partner" && role !== "company") {
    redirect({ href: "/signup", locale });
  }

  return (
    <AuthShell align="top">
      {role === "partner" ? <PartnerProfileClient /> : <CompanyProfileClient />}
    </AuthShell>
  );
}

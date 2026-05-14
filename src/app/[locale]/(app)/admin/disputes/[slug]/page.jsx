import DisputeDetailPage from "@/components/admin/disputes/DisputeDetailPage";

export default async function Page({ params }) {
  const { slug } = await params;
  return <DisputeDetailPage slug={slug} />;
}

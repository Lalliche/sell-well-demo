import CampaignSlugRouter from "@/components/campaigns/detail/CampaignSlugRouter";

export default async function Page({ params }) {
  const { slug } = await params;
  return <CampaignSlugRouter slug={slug} />;
}

import MarketplaceCampaignDetail from "@/components/marketplace/detail/MarketplaceCampaignDetail";

export default async function Page({ params }) {
  const { slug } = await params;
  return <MarketplaceCampaignDetail slug={slug} />;
}

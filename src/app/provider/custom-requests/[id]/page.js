import ProviderRequestDetailClient from "./ProviderRequestDetailClient";

export const metadata = { title: "Custom Request" };

export default async function Page({ params }) {
  const { id } = await params;
  return <ProviderRequestDetailClient id={id} />;
}

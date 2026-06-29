import { notFound } from "next/navigation";
import { fetchSite } from "../../utils/fetchSite";
import MyRequestDetailClient from "./MyRequestDetailClient";

export async function generateMetadata({ params }) {
  const { domain } = await params;
  const { site } = await fetchSite(domain);
  const name = site?.tenant?.name || "Request";
  return {
    title: `Request | ${name}`,
    description: `Track your custom request on ${name}`,
  };
}

export default async function MyRequestDetailPage({ params }) {
  const { domain, id } = await params;
  const { site, sections, error } = await fetchSite(domain);
  console.log(site,"DADA")
  if (error || !site?.is_published) notFound();

  const header = sections?.find((s) => s.section_type === "header");
  const footer = sections?.find((s) => s.section_type === "footer");

  return (
    <MyRequestDetailClient
      domain={domain}
      requestId={id}
      site={site}
      header={header}
      footer={footer}
    />
  );
}

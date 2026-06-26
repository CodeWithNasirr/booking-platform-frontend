import { notFound } from "next/navigation";
import { fetchSite } from "../utils/fetchSite";
import RequestServiceClient from "./RequestServiceClient";

export async function generateMetadata({ params }) {
  const { domain } = await params;
  const { site } = await fetchSite(domain);
  const name = site?.tenant?.name || "Request Service";
  return {
    title: `Request Custom Service | ${name}`,
    description: `Submit a custom service request to ${name}`,
  };
}

export default async function RequestServicePage({ params }) {
  const { domain } = await params;
  const { site, sections, error } = await fetchSite(domain);

  if (error || !site?.is_published) notFound();

  const header = sections?.find((s) => s.section_type === "header");
  const footer = sections?.find((s) => s.section_type === "footer");

  const customRequestSection = sections?.find(
    (s) => s.section_type === "module" && (s.module_key === "custom_request" || s.content?.module_key === "custom_request")
  );

  const settings = customRequestSection?.content?.settings || {};

  return (
    <RequestServiceClient
      domain={domain}
      site={site}
      header={header}
      footer={footer}
      settings={settings}
    />
  );
}

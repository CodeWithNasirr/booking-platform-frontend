import { notFound } from "next/navigation";
import { fetchSite } from "../utils/fetchSite";
import MyRequestsClient from "./MyRequestsClient";

export async function generateMetadata({ params }) {
  const { domain } = await params;
  const { site } = await fetchSite(domain);
  const name = site?.tenant?.name || "My Requests";
  return {
    title: `My Requests | ${name}`,
    description: `Track your custom service requests from ${name}`,
  };
}

export default async function MyRequestsPage({ params }) {
  const { domain } = await params;
  const { site, sections, error } = await fetchSite(domain);

  if (error || !site?.is_published) notFound();

  const header = sections?.find((s) => s.section_type === "header");
  const footer = sections?.find((s) => s.section_type === "footer");

  return (
    <MyRequestsClient
      domain={domain}
      site={site}
      header={header}
      footer={footer}
    />
  );
}

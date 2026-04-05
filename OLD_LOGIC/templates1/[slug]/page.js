// app/tenant-site/templates/[slug]/page.jsx
import axios from "@/lib/axios";
import mapSectionToComponent from "../utils/map";
import TemplateRenderer from "./TemplateRenderer";
import { TenantLangProvider } from "../utils/TenantLangContext";
import { TenantThemeProvider } from "../utils/theme";
export default async function TemplatePreviewPage(props) {
  const { params } = props;       // params is a ReactPromise
  const resolved = await params;  // unwrap it

  // console.log("Slug:", resolved.slug);

  const slug = resolved.slug
  // console.log(slug)
  // Fetch template details from backend
  const res = await axios.get(`/api/v1/website/templates/${slug}/`);
  const template = res.data;
  const layout = template?.default_layout?.sections || [];
  
  return (
    <TenantThemeProvider theme={template.theme_defaults}>
    <TenantLangProvider>
    <TemplateRenderer sections={layout}/>
    </TenantLangProvider>
    </TenantThemeProvider>
  );
}

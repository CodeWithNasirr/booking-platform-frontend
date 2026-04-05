// app/tenant-site/templates/[slug]/layouts/[layoutid]/page.jsx
import axios from "@/lib/axios";
import LayoutRenderer from "./LayoutRenderer";

import TemplateClientWrapper from "./TemplateClientWrapper";
export default async function LayoutPreviewPage(props) {
  const { params } = props;
  const resolved = await params;
  const { slug, layoutId } = resolved;

  // Fetch specific layout
  const res = await axios.get(
    `/api/v1/website/templates/${slug}/layouts/${layoutId}/`
  );
  
  const { template, layout,theme_defaults } = res.data;
  const sections = layout?.sections || [];
  console.log(template,"TEMPLATE")
  return (
  <TemplateClientWrapper theme={theme_defaults}>
     <LayoutRenderer sections={sections} template={template} layout={layout} />
  </TemplateClientWrapper>
);
  
}
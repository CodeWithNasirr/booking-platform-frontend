// tenant-site/[domain]/page.js

import { fetchSite } from "./utils/fetchSite";
import { renderSection } from "./utils/mapSectionToComponent";

export default async function WebsitePage({ params }) {
  const domain = params.domain; // dynamic domain
  const { site, layout } = await fetchSite(domain);

  return (
    <div className="site-container">
      {layout.layout_json.sections.map((section, index) => (
        <div key={index}>
          {renderSection(section)}
        </div>
      ))}
    </div>
  );
}

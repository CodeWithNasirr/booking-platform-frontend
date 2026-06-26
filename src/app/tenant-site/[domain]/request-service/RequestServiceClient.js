"use client";

import dynamic from "next/dynamic";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import mapSectionToComponent from "../utils/mapSectionToComponent";
import { resolveTranslatedContent } from "../utils/resolveTranslated";

const CustomRequestModule = dynamic(
  () => import("../../modules/CustomRequestModule"),
  { ssr: false }
);

export default function RequestServiceClient({ domain, site, header, footer, settings }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();

  const HeaderComponent = header ? mapSectionToComponent("header") : null;
  const FooterComponent = footer ? mapSectionToComponent("footer") : null;

  return (
    <div className="tenant-site-layout" dir={isRTL ? "rtl" : "ltr"}>
      {HeaderComponent && header && (
        <HeaderComponent
          data={resolveTranslatedContent(header.content, language)}
          lang={language}
          theme={theme}
        />
      )}

      <main className="min-h-screen bg-gray-50">
        <CustomRequestModule
          data={{}}
          settings={settings}
          tenantId={site?.tenant?.id}
          domain={domain}
        />
      </main>

      {FooterComponent && footer && (
        <FooterComponent
          data={resolveTranslatedContent({
            ...footer.content,
            show_powered_by: site?.show_powered_by ?? true,
          }, language)}
          lang={language}
        />
      )}
    </div>
  );
}

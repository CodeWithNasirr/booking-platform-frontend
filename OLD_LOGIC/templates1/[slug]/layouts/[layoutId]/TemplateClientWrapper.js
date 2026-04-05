"use client";

import { TenantThemeProvider } from "../../../utils/theme";
import { TenantLangProvider } from "../../../utils/TenantLangContext";

export default function TemplateClientWrapper({ children, theme }) {
  return (
    <TenantThemeProvider theme={theme}>
      <TenantLangProvider>
        {children}
      </TenantLangProvider>
    </TenantThemeProvider>
  );
}

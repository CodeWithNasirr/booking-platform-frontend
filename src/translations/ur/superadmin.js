import common from "./superadmin/common";
import layout from "./superadmin/layout";
import navigation from "./superadmin/navigation";
import dashboard from "./superadmin/dashboard";
import tenantsList from "./superadmin/tenants_list";
import tenantDetail from "./superadmin/tenant_detail";
import editTenant from "./superadmin/editTenant";
import documents from "./superadmin/documents";
import billing from "./superadmin/billing";
import notifications from "./superadmin/notifications";
import announcements from "./superadmin/announcements";
import templates from "./superadmin/templates";
import support from "./superadmin/support";
import subadmin from "./superadmin/subadmin";
import logs from "./superadmin/logs";
import settings from "./superadmin/settings";
import refunds from "./superadmin/refunds";
import health from "./superadmin/health";
import dunning from "./superadmin/dunning";
export default {
  ...common,
  ...layout,
  ...navigation,
  ...dashboard,
  ...tenantsList,
  ...tenantDetail,
  ...editTenant,
  ...documents,
  ...billing,
  ...notifications,
  ...announcements,
  ...templates,
  ...support,
  ...subadmin,
  ...logs,
  ...settings,
  ...refunds,
  ...health,
  ...dunning,
};
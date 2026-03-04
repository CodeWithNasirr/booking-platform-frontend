// ENGLISH
import enCommon from "./en/common";
import enNav from "./en/nav";
import enAuth from "./en/auth";
import enDashboard from "./en/dashboard";
import enSuperadmin from "./en/superadmin";
import enLanding from "./en/landing";
import enServices from "./en/services";
import enProviders from "./en/providers";
import enBookings from "./en/bookings";
import enCustomers from "./en/customers";
import enOnboarding from "./en/onboarding";

// ARABIC
import arCommon from "./ar/common";
import arNav from "./ar/nav";
import arAuth from "./ar/auth";
import arDashboard from "./ar/dashboard";
import arSuperadmin from "./ar/superadmin";
import arLanding from "./ar/landing";
import arServices from "./ar/services";
import arProviders from "./ar/providers";
import arBookings from "./ar/bookings";
import arCustomers from "./ar/customers";
import arOnboarding from "./ar/onboarding";

// URDU
import urCommon from "./ur/common";
import urNav from "./ur/nav";
import urAuth from "./ur/auth";
import urDashboard from "./ur/dashboard";
import urSuperadmin from "./ur/superadmin";
import urLanding from "./ur/landing";
import urServices from "./ur/services";
import urProviders from "./ur/providers";
import urBookings from "./ur/bookings";
import urCustomers from "./ur/customers";
import urOnboarding from "./ur/onboarding";

export const translations = {
  en: {
    ...enCommon,
    ...enNav,
    ...enAuth,
    ...enDashboard,
    ...enSuperadmin,
    ...enLanding,
    ...enServices,
    ...enProviders,
    ...enBookings,
    ...enCustomers,
    ...enOnboarding,
  },

  ar: {
    ...arCommon,
    ...arNav,
    ...arAuth,
    ...arDashboard,
    ...arSuperadmin,
    ...arLanding,
    ...arServices,
    ...arProviders,
    ...arBookings,
    ...arCustomers,
    ...arOnboarding,
  },

  ur: {
    ...urCommon,
    ...urNav,
    ...urAuth,
    ...urDashboard,
    ...urSuperadmin,
    ...urLanding,
    ...urServices,
    ...urProviders,
    ...urBookings,
    ...urCustomers,
    ...urOnboarding,
  },
};

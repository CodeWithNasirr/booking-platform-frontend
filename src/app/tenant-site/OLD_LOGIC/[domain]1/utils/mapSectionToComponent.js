// tenant-site/[domain]/utils/mapSectionToComponent.js

import Header from "../sections/Header";
import Hero from "../sections/Hero";
import Services from "../sections/Services";
// import About from "../sections/About";
import CTA from "../sections/CTA";
import GigListings from "../sections/GigListings";
import Contact from "../sections/Contact";
import BookingWidget from "../sections/BookingWidget";
import Footer from "../sections/Footer";
import AboutSection from "../sections/AboutSection";

export const SECTION_MAP = {
  header: Header,
  hero: Hero,
  services: Services,
  about: About,
  cta: CTA,
  gig_listings: GigListings,
  contact: Contact,
  booking_widget: BookingWidget,
  footer: Footer,
};

export function renderSection(section) {
  const Component = SECTION_MAP[section.section_type];

  if (!Component) {
    return <div>Unknown section: {section.section_type}</div>;
  }

  return <Component {...section} />;
}

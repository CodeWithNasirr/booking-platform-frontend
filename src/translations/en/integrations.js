export default {
  // ── Page Header ──
  "integrations.title": "Integrations",
  "integrations.subtitle": "Connect your tools and automate your business",

  // ── Status Bar ──
  "integrations.statusBar.title": "Connection Status",
  "integrations.statusBar.count": "{{connected}} of {{total}} connected",
  "integrations.statusBar.active": "{{count}} Active",
  "integrations.statusBar.available": "{{count}} Available",

  // ── Categories ──
  "integrations.category.all": "All Integrations",
  "integrations.category.calendar": "Calendar & Meetings",
  "integrations.category.communication": "Communication",
  "integrations.category.marketing": "Marketing & Analytics",

  // ── Card ──
  "integrations.card.connect": "Connect",
  "integrations.card.manage": "Manage",
  "integrations.card.setupGuide": "Setup Guide",
  "integrations.card.disabledByPlatform": "Disabled by Platform",
  "integrations.card.providersSynced": "{{count}} provider{{count, plural, one {} other {s}}} synced",
  "integrations.card.connectedAt": "Connected {{date}}",

  // ── Status ──
  "integrations.status.connected": "Connected",
  "integrations.status.pending": "Pending",
  "integrations.status.qrReady": "Awaiting Scan",
  "integrations.status.error": "Error",
  "integrations.status.disconnected": "Not Connected",
  "integrations.status.disabledByPlatform": "Disabled by Platform",

  // ── Guide Modal ──
  "integrations.guide.title": "Setup Guide",
  "integrations.guide.subtitle": "Follow these steps to connect",
  "integrations.guide.noGuide": "No setup guide available for this integration yet.",
  "integrations.guide.requirements": "Requirements",
  "integrations.guide.trackedEvents": "Auto-Tracked Events",
  "integrations.guide.viewDocs": "View Official Documentation",

  // Google Calendar Guide
  "integrations.guide.googleCalendar.title": "Google Calendar Setup",
  "integrations.guide.googleCalendar.step1.title": "Select a Provider",
  "integrations.guide.googleCalendar.step1.desc": "Choose which team member to connect their Google Calendar.",
  "integrations.guide.googleCalendar.step2.title": "Authorize with Google",
  "integrations.guide.googleCalendar.step2.desc": "You'll be redirected to Google to grant calendar access.",
  "integrations.guide.googleCalendar.step3.title": "Auto Sync",
  "integrations.guide.googleCalendar.step3.desc": "New bookings will automatically create Google Calendar events with Meet links.",
  "integrations.guide.googleCalendar.req1": "Google account",
  "integrations.guide.googleCalendar.req2": "At least one provider in your team",

  // Zoom Guide
  "integrations.guide.zoom.title": "Zoom Setup",
  "integrations.guide.zoom.step1.title": "Get API Credentials",
  "integrations.guide.zoom.step1.desc": "Go to marketplace.zoom.us → Build App → Server-to-Server OAuth.",
  "integrations.guide.zoom.step2.title": "Enter Account ID",
  "integrations.guide.zoom.step2.desc": "Copy your Account ID, Client ID, and Client Secret.",
  "integrations.guide.zoom.step3.title": "Enable for Services",
  "integrations.guide.zoom.step3.desc": "Mark services as \"online\" to auto-create Zoom meetings on booking.",
  "integrations.guide.zoom.req1": "Zoom Pro or higher account",
  "integrations.guide.zoom.req2": "Zoom Marketplace developer access",

  // WhatsApp Guide
  "integrations.guide.whatsapp.title": "WhatsApp Web Setup",
  "integrations.guide.whatsapp.step1.title": "Click Connect",
  "integrations.guide.whatsapp.step1.desc": "We'll generate a QR code for you to scan.",
  "integrations.guide.whatsapp.step2.title": "Open WhatsApp",
  "integrations.guide.whatsapp.step2.desc": "On your phone: Settings → Linked Devices → Link a Device.",
  "integrations.guide.whatsapp.step3.title": "Scan the QR",
  "integrations.guide.whatsapp.step3.desc": "Point your phone camera at the QR code. Connection takes 5-10 seconds.",
  "integrations.guide.whatsapp.step4.title": "Done!",
  "integrations.guide.whatsapp.step4.desc": "Booking confirmations and reminders will be sent via your WhatsApp number.",
  "integrations.guide.whatsapp.req1": "WhatsApp installed on your phone",
  "integrations.guide.whatsapp.req2": "Active internet on phone",

  // Meta Pixel Guide
  "integrations.guide.metaPixel.title": "Meta Pixel Setup",
  "integrations.guide.metaPixel.step1.title": "Get Pixel ID",
  "integrations.guide.metaPixel.step1.desc": "Go to Meta Events Manager → Data Sources → Select your Pixel.",
  "integrations.guide.metaPixel.step2.title": "Copy the Pixel ID",
  "integrations.guide.metaPixel.step2.desc": "It's a numeric ID like 123456789012345.",
  "integrations.guide.metaPixel.step3.title": "Paste & Connect",
  "integrations.guide.metaPixel.step3.desc": "Enter your Pixel ID here. We'll inject the tracking code on your tenant site.",
  "integrations.guide.metaPixel.req1": "Meta Business account",
  "integrations.guide.metaPixel.req2": "Facebook Pixel created",

  // Google Analytics Guide
  "integrations.guide.googleAnalytics.title": "Google Analytics Setup",
  "integrations.guide.googleAnalytics.step1.title": "Get Measurement ID",
  "integrations.guide.googleAnalytics.step1.desc": "Go to analytics.google.com → Admin → Data Streams → Web.",
  "integrations.guide.googleAnalytics.step2.title": "Copy Measurement ID",
  "integrations.guide.googleAnalytics.step2.desc": "It looks like G-XXXXXXXXXX.",
  "integrations.guide.googleAnalytics.step3.title": "Paste & Connect",
  "integrations.guide.googleAnalytics.step3.desc": "We'll add the GA4 tracking script to your tenant site automatically.",
  "integrations.guide.googleAnalytics.req1": "Google Analytics 4 account",

  // Google Tag Manager Guide
  "integrations.guide.googleTagManager.title": "Google Tag Manager Setup",
  "integrations.guide.googleTagManager.step1.title": "Get Container ID",
  "integrations.guide.googleTagManager.step1.desc": "Go to tagmanager.google.com → select your container.",
  "integrations.guide.googleTagManager.step2.title": "Copy Container ID",
  "integrations.guide.googleTagManager.step2.desc": "It looks like GTM-XXXXXXX (top of page).",
  "integrations.guide.googleTagManager.step3.title": "Paste & Connect",
  "integrations.guide.googleTagManager.step3.desc": "GTM will load on your tenant site. Manage all tags from GTM dashboard.",
  "integrations.guide.googleTagManager.req1": "Google Tag Manager account",

  // TikTok Pixel Guide
  "integrations.guide.tiktokPixel.title": "TikTok Pixel Setup",
  "integrations.guide.tiktokPixel.step1.title": "Get Pixel ID",
  "integrations.guide.tiktokPixel.step1.desc": "Go to TikTok Ads Manager → Assets → Events → Manage (Web Events).",
  "integrations.guide.tiktokPixel.step2.title": "Copy Pixel ID",
  "integrations.guide.tiktokPixel.step2.desc": "Select your pixel and copy the Pixel ID.",
  "integrations.guide.tiktokPixel.step3.title": "Paste & Connect",
  "integrations.guide.tiktokPixel.step3.desc": "TikTok tracking code will be injected on your tenant site.",
  "integrations.guide.tiktokPixel.req1": "TikTok Ads Manager account",
  "integrations.guide.tiktokPixel.req2": "TikTok Pixel created",

  // ── Google Calendar Modal ──
  "integrations.modal.googleCalendar.title": "Google Calendar",
  "integrations.modal.googleCalendar.subtitle": "Connect providers to sync calendars & auto-create Meet links",
  "integrations.modal.googleCalendar.noProviders": "No providers found",
  "integrations.modal.googleCalendar.addProvidersHint": "Add team members as providers first, then connect their calendars.",
  "integrations.modal.googleCalendar.howItWorks": "Each provider connects their own Google account. Bookings assigned to them will sync automatically.",
  "integrations.modal.googleCalendar.providerFallback": "Provider",
  "integrations.modal.googleCalendar.synced": "Synced",
  "integrations.modal.googleCalendar.connect": "Connect",
  "integrations.modal.googleCalendar.autoSyncTitle": "How it works:",
  "integrations.modal.googleCalendar.autoSyncDesc": "When a customer books a service assigned to a connected provider, we auto-create a Google Calendar event with a Google Meet link attached.",

  // ── WhatsApp Modal ──
  "integrations.modal.whatsapp.title": "WhatsApp Web",
  "integrations.modal.whatsapp.subtitle": "Send booking notifications via WhatsApp",
  "integrations.modal.whatsapp.starting": "Starting session...",
  "integrations.modal.whatsapp.scanTitle": "Scan with WhatsApp",
  "integrations.modal.whatsapp.scanDesc": "Open WhatsApp → Linked Devices → Link a Device",
  "integrations.modal.whatsapp.waiting": "Waiting for scan...",
  "integrations.modal.whatsapp.connected": "Connected!",
  "integrations.modal.whatsapp.connectedDesc": "Booking confirmations and reminders will be sent via WhatsApp.",
  "integrations.modal.whatsapp.disconnect": "Disconnect WhatsApp",

  // ── Pixel Config Modal ──
  "integrations.modal.pixel.subtitle": "Enter your credentials to connect",
  "integrations.modal.pixel.whereToFind": "Where to find this",
  "integrations.modal.pixel.openDocs": "Open {{name}}",
  "integrations.modal.pixel.eventsWeTrack": "Events we'll track",
  "integrations.modal.pixel.saveConnect": "Save & Connect",

  // ── Disconnect Modal ──
  "integrations.modal.disconnect.title": "Disconnect Integration",
  "integrations.modal.disconnect.confirm": "Disconnect {{name}}?",
  "integrations.modal.disconnect.warning": "Data sync will stop. You can reconnect anytime.",
  "integrations.modal.disconnect.btn": "Disconnect",

  // ── Common ──
  "common.cancel": "Cancel",
  "common.retry": "Retry",
};
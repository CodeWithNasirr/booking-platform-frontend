// tenant-site/modules/moduleRegistry.js
import BookingModule from "./BookingModule";
import ChatModule from "./ChatModule";
import PaymentModule from "./PaymentModule";
import VideoCallModule from "./VideoCallModule";
import FileUploadModule from "./FileUploadModule";
import ContactFormModule from "./ContactFormModule";

import OrderCheckout from "./order-checkout";
import CustomerOrdersDashboard from "./CustomerOrdersDashboard";
import ProviderOrdersDashboard from "./ProviderOrdersDashboard";

// ADD these to the MODULES object:

export const MODULES = {
  booking: BookingModule,
  chat: ChatModule,
  payment: PaymentModule,
  video_call: VideoCallModule,
  file_upload: FileUploadModule,
  contact_form: ContactFormModule,
  // ─── NEW: Order modules ───
  order_checkout: OrderCheckout,
  order_dashboard: CustomerOrdersDashboard,
  provider_orders: ProviderOrdersDashboard,
};
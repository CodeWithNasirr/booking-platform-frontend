const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function createBooking({
  domain,
  service,
  staff,
  date,
  time,
  customer,
}) {
  const res = await fetch(`${API_BASE}/api/v1/bookings/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant": domain,
    },
    body: JSON.stringify({
      service: service.id,
      provider: staff?.id,
      scheduled_date: date.toISOString().split("T")[0],
      scheduled_time: time,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_notes: customer.notes,
    }),
  });

  if (!res.ok) throw new Error("Booking failed");
  return res.json();
}

// src/app/tenant-site/[domain]/provider/orders/page.js

import ProviderOrdersClient from "./ProviderOrdersClient";


export async function generateMetadata() {
  return { title: "Provider - My Orders" };
}

export default async function ProviderOrdersPage() {
 
  return (
    <ProviderOrdersClient
    />
  );
}

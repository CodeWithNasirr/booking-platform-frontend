import HyperPayCallbackClient from "./HyperPayCallbackClient";

export default async function Page({ searchParams }) {
  const params = await searchParams;

  return (
    <HyperPayCallbackClient
      checkoutId={params.id || ""}
      type={params.type || ""}
      refId={params.ref || ""}
    />
  );
}
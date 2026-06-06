import RegisterWizard from "./RegisterWizard";
import { AppProvider } from "@/contexts/AppContext";

export default async function Page({ searchParams }) {
  const params = await searchParams;

  return (
    // <AppProvider>

    <RegisterWizard
      selectedPlan={params.plan || "free"}
      selectedInterval={params.interval || "month"}
    />
    // </AppProvider>
    
  );
}
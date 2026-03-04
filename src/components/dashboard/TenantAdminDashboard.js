export default function TenantAdminDashboard({ children }) {
  // auth logic
  // onboarding logic
  // sidebar state

  return (
    <div className="flex h-screen bg-gray-50">

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6">
          {children}   {/* 🔥 THIS IS IMPORTANT */}
        </main>
      </div>

    </div>
  );
}

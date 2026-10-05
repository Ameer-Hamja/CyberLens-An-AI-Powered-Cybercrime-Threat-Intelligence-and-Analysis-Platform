export default function PageWrapper({ children }) {
  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
      {children}
    </main>
  )
}

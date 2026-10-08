export default function PageWrapper({ children }) {
  return (
    <main
      id="main-content"
      className="min-w-0 flex-1 p-4 pb-28 sm:p-6 md:pb-8 xl:p-8"
    >
      <div className="mx-auto max-w-[1600px]">{children}</div>
    </main>
  );
}

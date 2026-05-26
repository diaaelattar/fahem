// This layout intentionally overrides the parent admin layout
// so the print page renders without sidebar/topbar
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

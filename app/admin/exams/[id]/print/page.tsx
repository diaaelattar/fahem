import { redirect } from 'next/navigation'

export default function AdminPrintExamRedirect({
  params,
}: {
  params: { id: string }
}) {
  redirect(`/print/exam/${params.id}`)
}

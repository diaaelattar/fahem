import { redirect } from 'next/navigation'

export default function TeacherPrintExamRedirect({
  params,
}: {
  params: { id: string }
}) {
  redirect(`/print/exam/${params.id}`)
}

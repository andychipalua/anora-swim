import { notFound, redirect } from "next/navigation";
import EditRecordForm from "@/components/EditRecordForm";
import { getEvents, getRecords, getStrokes } from "@/lib/api";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit record", robots: { index: false, follow: false } };

export default async function EditRecordPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id } = await params;
  const [records, strokes, events] = await Promise.all([getRecords(), getStrokes(), getEvents()]);
  const record = records.find((r) => String(r.id) === id);
  if (!record) notFound();

  return (
    <>
      <h1>Edit record</h1>
      <EditRecordForm record={record} strokes={strokes} events={events} />
    </>
  );
}

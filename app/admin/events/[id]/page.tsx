import { notFound, redirect } from "next/navigation";
import EditEventForm from "@/components/EditEventForm";
import { getEvents } from "@/lib/api";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit event", robots: { index: false, follow: false } };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id } = await params;
  const event = (await getEvents()).find((e) => String(e.id) === id);
  if (!event) notFound();

  return (
    <>
      <h1>Edit event</h1>
      <EditEventForm event={event} />
    </>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import NewRecordForm from "@/components/NewRecordForm";
import { logoutAction } from "@/app/admin/actions";
import { getEvents, getStrokes } from "@/lib/api";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add record", robots: { index: false, follow: false } };

export default async function NewRecordPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const [strokes, events] = await Promise.all([getStrokes(), getEvents()]);

  return (
    <>
      <div className="page-head">
        <h1>Add a record</h1>
        <div className="head-actions">
          <Link href="/admin/event-videos" className="button secondary">
            Add videos to an event
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="button secondary">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <NewRecordForm strokes={strokes} events={events} />
    </>
  );
}

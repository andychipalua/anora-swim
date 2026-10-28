import { redirect } from "next/navigation";
import Link from "next/link";
import EventVideosForm from "@/components/EventVideosForm";
import { logoutAction } from "@/app/admin/actions";
import { getEvents, getStrokes } from "@/lib/api";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add event videos", robots: { index: false, follow: false } };

export default async function EventVideosPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const [strokes, events] = await Promise.all([getStrokes(), getEvents()]);

  return (
    <>
      <div className="page-head">
        <h1>Add videos to an event</h1>
        <div className="head-actions">
          <Link href="/admin/new-record" className="button secondary">
            Add a record
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="button secondary">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <p className="muted">
        An event can have as many videos as you like, with or without a swim record.
      </p>
      {events.length === 0 ? (
        <p>
          There are no events yet. <Link href="/admin/new-record">Add a record</Link> first to create
          one.
        </p>
      ) : (
        <EventVideosForm strokes={strokes} events={events} />
      )}
    </>
  );
}

import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin/new-record");
  return (
    <>
      <h1>Admin sign in</h1>
      <p className="muted">Only needed to add or change records.</p>
      <LoginForm />
    </>
  );
}

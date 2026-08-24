import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function RootPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__fluxwall_admin_session");

  if (session?.value === "authenticated") {
    redirect("/admin");
  } else {
    redirect("/login");
  }
}

import { redirect } from "next/navigation";

export default function SystemSettingsRedirect() {
  redirect("/admin/system-settings/payment-methods");
}

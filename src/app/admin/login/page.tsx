import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <LoginForm />;
}

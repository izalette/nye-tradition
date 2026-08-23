import type { Metadata } from "next";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRegisterPage() {
  return <RegisterForm />;
}

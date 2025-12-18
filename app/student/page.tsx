import { Suspense } from "react";
import StudentClient from "./student-client";

export const dynamic = "force-dynamic";

export default function StudentPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: "center" }}>در حال بارگذاری…</div>}>
      <StudentClient />
    </Suspense>
  );
}

import { Suspense } from "react";
import StudentClient from "./StudentClient";


export default function StudentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-lg">
          در حال بارگذاری صفحه دانش‌آموز...
        </div>
      }
    >
      <StudentClient />
    </Suspense>
  );
}

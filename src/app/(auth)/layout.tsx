"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: gradient + branding (desktop) */}
      <div className="hidden lg:flex lg:w-[55%] lg:min-h-screen bg-gradient-to-br from-indigo-700 to-indigo-900 items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <GraduationCap className="h-20 w-20 mx-auto mb-6 opacity-90" />
          <h1 className="text-3xl font-bold mb-2">CourseFlow</h1>
          <p className="text-indigo-200 text-lg">
            Manage your university, effortlessly.
          </p>
        </div>
      </div>
      {/* Right: form area */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

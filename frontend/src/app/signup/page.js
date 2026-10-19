"use client";

import Link from "next/link";
import Image from "next/image";

export default function RoleSelectionPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-white">
      {/* Campus image with a subtle purple tint */}
      <Image
        src="/campus.jpg"
        alt="CST Campus"
        fill
        priority
        className="z-0 object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 z-10 bg-accent/15" />

      {/* Content */}
      <div className="relative z-20 p-10">
        <div className="flex items-center gap-3 mb-10">
          <Image src="/cst-logo.png" alt="CST Logo" width={48} height={48} />
          <h1 className="text-lg font-bold">CST ALUMNI PORTAL</h1>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Join the CST Community</h2>
          <p className="text-gray-300 mt-2">Select your role to create an account</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {/* Student */}
          <div className="bg-white text-text rounded-xl p-6 w-60 flex flex-col items-center text-center">
            <div className="text-4xl mb-3">🎓</div>
            <h3 className="text-lg font-bold mb-2 text-primary">Student</h3>
            <p className="text-sm text-muted mb-6">
              Access academic resources, events and campus opportunities.
            </p>
            <Link
              href="/signup/student"
              className="bg-primary text-white w-full py-2 rounded-lg text-sm font-medium"
            >
              Register as Student
            </Link>
          </div>

          {/* Alumni */}
          <div className="bg-white text-text rounded-xl p-6 w-60 flex flex-col items-center text-center">
            <div className="text-4xl mb-3">🧑</div>
            <h3 className="text-lg font-bold mb-2 text-alumni">Alumni</h3>
            <p className="text-sm text-muted mb-6">
              Connect with alumni, explore events and grow your network.
            </p>
            <Link
              href="/signup/alumni"
              className="bg-alumni text-white w-full py-2 rounded-lg text-sm font-medium"
            >
              Register as Alumni
            </Link>
          </div>

          {/* Staff */}
          <div className="bg-white text-text rounded-xl p-6 w-60 flex flex-col items-center text-center">
            <div className="text-4xl mb-3">🏛</div>
            <h3 className="text-lg font-bold mb-2 text-accent">Staff</h3>
            <p className="text-sm text-muted mb-6">
              Manage events, content and support the alumni community.
            </p>
            <Link
              href="/signup/staff"
              className="bg-accent text-white w-full py-2 rounded-lg text-sm font-medium"
            >
              Register as Staff
            </Link>
          </div>

          {/* Administration */}
          <div className="bg-white text-text rounded-xl p-6 w-60 flex flex-col items-center text-center">
            <div className="text-4xl mb-3">🏢</div>
            <h3 className="text-lg font-bold mb-2 text-admin">Administration</h3>
            <p className="text-sm text-muted mb-6">
              Manage system settings, users and portal configurations.
            </p>
            <Link
              href="/signup/admin"
              className="bg-admin text-white w-full py-2 rounded-lg text-sm font-medium"
            >
              Register as Administration
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-300 mt-10">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
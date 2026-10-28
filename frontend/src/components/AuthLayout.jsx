import Image from "next/image";

export default function AuthLayout({ title, text, icon: Icon, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Left panel */}
        <div className="relative hidden w-[42%] shrink-0 flex-col bg-sidebar text-white md:flex">
          <div className="relative z-10 px-10 pt-10">
            <div className="mb-10 flex items-center gap-3">
              <Image
                src="/cst-logo.png"
                alt="CST logo"
                width={44}
                height={44}
                className="h-11 w-11"
              />
              <span className="text-sm font-bold leading-tight tracking-wide">
                CST ALUMNI
                <br />
                PORTAL
              </span>
            </div>
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/80">{text}</p>
          </div>

          {/* Campus photo (public/campus.jpg). If it is missing you just see the dark panel. */}
          <div className="relative mt-auto h-72">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/campus.jpg')" }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-sidebar via-sidebar/70 to-sidebar/30" />
            <div className="relative flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white">
                <Icon size={44} strokeWidth={1.5} />
              </div>
              <p className="text-xs text-white/80">
                Your data is safe with us.
                <br />
                We&apos;ll get you back in, quickly and securely.
              </p>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-1 flex-col justify-center px-8 py-10 md:px-14">{children}</div>
      </div>
    </div>
  );
}
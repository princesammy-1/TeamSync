import { Outlet, Link } from "react-router-dom";
import Logo from "../components/shared/Logo";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-border-subtle p-10 lg:flex">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px circle at 20% 10%, rgba(122,85,248,0.18), transparent 45%), radial-gradient(700px circle at 90% 90%, rgba(45,212,191,0.10), transparent 45%)",
          }}
          aria-hidden="true"
        />

        <Link to="/" className="relative z-10">
          <Logo />
        </Link>

        <div className="relative z-10 max-w-md">
          <blockquote className="text-xl leading-relaxed font-medium text-ink">
            “TeamSync is the first tool that actually keeps our whole team on the
            same page. Meetings, tasks, and chats finally live in one calm place.”
          </blockquote>
          <div className="mt-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white">
              MC
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Maya Chen</p>
              <p className="text-xs text-ink-mute">Head of Product, Aurora Labs</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-ink-mute">
          © {new Date().getFullYear()} TeamSync, Inc. All rights reserved.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

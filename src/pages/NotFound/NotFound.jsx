import { Link } from "react-router-dom";
import Logo from "../../components/shared/Logo";
import Button from "../../components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <Logo />

      <p className="mt-10 bg-gradient-to-r from-brand-300 to-teal-300 bg-clip-text text-7xl font-bold text-transparent">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">This page drifted off</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-mute">
        The page you're looking for doesn't exist, or it moved somewhere else.
        Let's get you back on track.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/app">
          <Button>Go to dashboard</Button>
        </Link>
        <Link to="/">
          <Button variant="secondary">Back home</Button>
        </Link>
      </div>
    </div>
  );
}

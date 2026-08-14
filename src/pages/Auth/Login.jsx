import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";
import AuthShell from "./AuthShell";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { validateEmail } from "../../utils/validateEmail";

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
  };

  const fillDemo = () => {
    setForm({ email: "adrian@teamsync.app", password: "demo1234" });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!validateEmail(form.email)) next.email = "Enter a valid email.";
    if (!form.password) next.password = "Enter your password.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast({ type: "success", title: `Welcome back, ${user.name.split(" ")[0]}!` });
      navigate("/app", { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your workspace to pick up where you left off."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-brand-300 hover:text-brand-200">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
            {errors.form}
          </p>
        )}

        <Input
          label="Email"
          type="email"
          icon={<FiMail size={15} />}
          value={form.email}
          onChange={setField("email")}
          placeholder="you@company.com"
          error={errors.email}
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          icon={<FiLock size={15} />}
          value={form.password}
          onChange={setField("password")}
          placeholder="••••••••"
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={fillDemo}
            className="text-xs font-medium text-ink-mute transition hover:text-brand-300"
          >
            Use demo account
          </button>
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-brand-300 transition hover:text-brand-200"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          <FiLogIn size={16} /> Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

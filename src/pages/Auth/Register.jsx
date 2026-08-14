import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiUserPlus } from "react-icons/fi";
import AuthShell from "./AuthShell";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { validateEmail } from "../../utils/validateEmail";

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = "Enter your full name.";
    if (!validateEmail(form.email)) next.email = "Enter a valid email.";
    if (form.password.length < 8) next.password = "At least 8 characters.";
    if (form.confirm !== form.password) next.confirm = "Passwords don't match.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password);
      toast({ type: "success", title: "Account created", message: `Welcome to TeamSync, ${user.name}!` });
      navigate("/app", { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start collaborating with your team in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">
            Sign in
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
          label="Full name"
          icon={<FiUser size={15} />}
          value={form.name}
          onChange={setField("name")}
          placeholder="Ada Lovelace"
          error={errors.name}
          autoComplete="name"
        />

        <Input
          label="Work email"
          type="email"
          icon={<FiMail size={15} />}
          value={form.email}
          onChange={setField("email")}
          placeholder="you@company.com"
          error={errors.email}
          autoComplete="email"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            type="password"
            icon={<FiLock size={15} />}
            value={form.password}
            onChange={setField("password")}
            placeholder="8+ characters"
            error={errors.password}
            autoComplete="new-password"
          />
          <Input
            label="Confirm"
            type="password"
            icon={<FiLock size={15} />}
            value={form.confirm}
            onChange={setField("confirm")}
            placeholder="Repeat password"
            error={errors.confirm}
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          <FiUserPlus size={16} /> Create account
        </Button>

        <p className="text-xs leading-relaxed text-ink-mute">
          By signing up you agree to the Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}

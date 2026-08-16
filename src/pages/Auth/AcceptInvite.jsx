import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiUserPlus,
  FiArrowRight,
} from "react-icons/fi";
import AuthShell from "./AuthShell";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { acceptInvite } from "../../services/authService";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ name: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(token ? "ready" : "missing");
  const [loading, setLoading] = useState(false);

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = "Enter your full name.";
    if (form.password.length < 8) next.password = "At least 8 characters.";
    if (form.confirm !== form.password) next.confirm = "Passwords don't match.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setLoading(true);
    try {
      await acceptInvite(token, form.password, form.name);
      navigate("/app", { replace: true });
    } catch (err) {
      setErrors({ form: err.message });
      setStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  if (status === "missing") {
    return (
      <AuthShell
        title="Invalid invite link"
        subtitle="This invitation is missing its token."
      >
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
          <FiAlertCircle size={22} className="mb-2 text-rose-400" />
          <p className="text-sm leading-relaxed text-ink-soft">
            The invite link you opened doesn't contain a valid token. Please ask
            the workspace owner to send you a new invitation.
          </p>
        </div>
      </AuthShell>
    );
  }

  if (status === "failed") {
    return (
      <AuthShell
        title="Invite link invalid"
        footer={
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="inline-flex items-center gap-1.5 font-semibold text-brand-300 hover:text-brand-200"
          >
            Back to sign in <FiArrowRight size={14} />
          </button>
        }
      >
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
          <FiAlertCircle size={22} className="mb-2 text-rose-400" />
          <p className="text-sm leading-relaxed text-ink-soft">
            {errors.form || "This invite link is invalid or has expired. Please ask for a new one."}
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Accept your invitation"
      subtitle="You've been invited to join a TeamSync workspace. Set a password to get started."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
            {errors.form}
          </p>
        )}

        <Input
          label="Full name"
          icon={<FiUserPlus size={15} />}
          value={form.name}
          onChange={setField("name")}
          placeholder="Your name"
          error={errors.name}
          autoComplete="name"
        />

        <Input
          label="Create a password"
          type="password"
          icon={<FiLock size={15} />}
          value={form.password}
          onChange={setField("password")}
          placeholder="8+ characters"
          error={errors.password}
          autoComplete="new-password"
        />

        <Input
          label="Confirm password"
          type="password"
          icon={<FiLock size={15} />}
          value={form.confirm}
          onChange={setField("confirm")}
          placeholder="Repeat password"
          error={errors.confirm}
          autoComplete="new-password"
        />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          <FiCheckCircle size={16} /> Join workspace
        </Button>
      </form>
    </AuthShell>
  );
}
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiLock, FiCheckCircle, FiAlertCircle, FiArrowLeft } from "react-icons/fi";
import AuthShell from "./AuthShell";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { resetPassword } from "../../services/authService";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ password: "", confirm: "" });
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
    if (form.password.length < 8) next.password = "At least 8 characters.";
    if (form.confirm !== form.password) next.confirm = "Passwords don't match.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, form.password);
      setStatus("done");
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
        title="Invalid reset link"
        footer={
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1.5 font-semibold text-brand-300 hover:text-brand-200"
          >
            <FiArrowLeft size={14} /> Request a new link
          </Link>
        }
      >
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
          <FiAlertCircle size={22} className="mb-2 text-rose-400" />
          <p className="text-sm leading-relaxed text-ink-soft">
            This link is missing its reset token. Please request a new password
            reset link from the forgot password page.
          </p>
        </div>
      </AuthShell>
    );
  }

  if (status === "done") {
    return (
      <AuthShell
        title="Password updated"
        footer={
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="inline-flex items-center gap-1.5 font-semibold text-brand-300 hover:text-brand-200"
          >
            <FiArrowLeft size={14} /> Back to sign in
          </button>
        }
      >
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <FiCheckCircle size={22} className="mb-2 text-emerald-400" />
          <p className="text-sm leading-relaxed text-ink-soft">
            Your password has been reset. You can now sign in with your new
            password.
          </p>
        </div>
      </AuthShell>
    );
  }

  if (status === "failed") {
    return (
      <AuthShell
        title="Reset link invalid"
        footer={
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-1.5 font-semibold text-brand-300 hover:text-brand-200"
          >
            <FiArrowLeft size={14} /> Request a new link
          </Link>
        }
      >
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5">
          <FiAlertCircle size={22} className="mb-2 text-rose-400" />
          <p className="text-sm leading-relaxed text-ink-soft">
            {errors.form || "This reset link is invalid or has expired. Please request a new one."}
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Your reset link is valid. Set a strong password to continue."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-brand-300 hover:text-brand-200"
        >
          <FiArrowLeft size={14} /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
            {errors.form}
          </p>
        )}

        <Input
          label="New password"
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
          <FiCheckCircle size={16} /> Reset password
        </Button>
      </form>
    </AuthShell>
  );
}
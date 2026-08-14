import { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiArrowLeft, FiCheckCircle, FiSend } from "react-icons/fi";
import AuthShell from "./AuthShell";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { validateEmail } from "../../utils/validateEmail";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
      toast({ type: "error", title: "Reset failed", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        footer={
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-brand-300 hover:text-brand-200"
          >
            <FiArrowLeft size={14} /> Back to sign in
          </Link>
        }
      >
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <FiCheckCircle size={22} className="mb-2 text-emerald-400" />
          <p className="text-sm leading-relaxed text-ink-soft">
            If an account exists for <span className="font-semibold text-ink">{email}</span>,
            we've sent a password reset link. It expires in 30 minutes.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure link to set a new password."
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
        <Input
          label="Email"
          type="email"
          icon={<FiMail size={15} />}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="you@company.com"
          error={error}
          autoComplete="email"
        />

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          <FiSend size={15} /> Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}

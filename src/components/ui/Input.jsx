export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}

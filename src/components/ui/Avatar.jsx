export default function Avatar({ name, src, className = "" }) {
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-semibold text-slate-700 ${className}`.trim()}
    >
      {src ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className="h-full w-full object-cover"
        />
      ) : name ? (
        name.charAt(0).toUpperCase()
      ) : (
        "?"
      )}
    </div>
  );
}

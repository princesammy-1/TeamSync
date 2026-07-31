import { NavLink } from "react-router-dom";
import { navigation } from "../../constants/navigation";

export default function Sidebar() {
  return (
    <aside className="w-80 min-h-screen bg-slate-900 text-white p-6 flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-blue-500">TeamSync</h1>

        <p className="text-slate-400 mt-2 text-sm">We build. We learn.</p>
      </div>

      <nav className="mt-12 flex flex-col gap-3">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.title}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                  isActive ? "bg-blue-600" : "hover:bg-slate-800"
                }`
              }
            >
              <Icon size={22} />

              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-700 pt-6">
        <h3 className="font-semibold">Prince</h3>

        <p className="text-sm text-slate-400">Frontend Developer</p>
      </div>
    </aside>
  );
}

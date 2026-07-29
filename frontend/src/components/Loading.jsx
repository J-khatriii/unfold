import { Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
      {/* Background Glow */}
      <div className="absolute h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative flex flex-col items-center">

        {/* Animated Icon */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/30 blur-xl" />

          <div className="relative flex h-24 w-24 animate-[float_3s_ease-in-out_infinite] items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 shadow-2xl">
            <Sparkles
              size={42}
              className="animate-spin text-white"
              style={{ animationDuration: "5s" }}
            />
          </div>
        </div>

        <h2 className="mt-8 text-xl font-semibold text-white">
          Loading Workspace
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Preparing everything...
        </p>

        {/* Progress */}
        <div className="mt-8 h-2 w-72 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full animate-[loading_3s_ease-in-out_infinite] rounded-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-cyan-400" />
        </div>
      </div>

      <style>{`
        @keyframes loading{
          0%{width:15%}
          50%{width:85%}
          100%{width:100%}
        }

        @keyframes float{
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(-12px)}
        }
      `}</style>
    </div>
  );
}

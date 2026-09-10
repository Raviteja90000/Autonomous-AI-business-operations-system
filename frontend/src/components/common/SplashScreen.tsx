import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { AurenLogo } from './AurenLogo';

interface SplashScreenProps {
  onComplete: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDurationMs = 2400,
}) => {
  const [stage, setStage] = useState<'enter' | 'reveal' | 'ready' | 'exit'>('enter');
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Stage 1 -> 2: Reveal Brand & Typography
    const t1 = setTimeout(() => {
      setStage('reveal');
      setProgress(55);
    }, 600);

    // Stage 2 -> 3: All Systems Ready
    const t2 = setTimeout(() => {
      setStage('ready');
      setProgress(100);
    }, 1400);

    // Stage 3 -> 4: Exit transition into App
    const t3 = setTimeout(() => {
      setStage('exit');
    }, minDurationMs - 350);

    // Complete callback: Hand over to App
    const t4 = setTimeout(() => {
      onComplete();
    }, minDurationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [minDurationMs, onComplete]);

  const handleSkip = () => {
    setStage('exit');
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0F0E0D] text-[#FAF8F5] transition-all duration-500 ease-out select-none ${
        stage === 'exit' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Warm Ambient Copper Glow Halo */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#C5855A]/25 via-[#8E5633]/20 to-transparent blur-3xl pointer-events-none animate-pulse" />

      {/* Futuristic Grid / Matrix Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      {/* Center Cinematic Hero Sequence */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
        {/* Animated Brand Emblem */}
        <div
          className={`transform transition-all duration-700 ease-out ${
            stage === 'enter'
              ? 'scale-75 opacity-0 -translate-y-6'
              : 'scale-100 opacity-100 translate-y-0'
          }`}
        >
          <div className="relative p-4 rounded-3xl bg-[#1C1A18]/90 border border-[#C5855A]/50 shadow-2xl shadow-[#C5855A]/30">
            <AurenLogo size={96} variant="icon" animated={true} theme="luxury" />
          </div>
        </div>

        {/* Brand Name Typography */}
        <div
          className={`mt-6 transform transition-all duration-700 delay-100 ease-out ${
            stage === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[0.4em] auren-shimmer-text uppercase">
            AUREN
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm font-medium text-[#C8BEB0] tracking-[0.25em] uppercase">
            Autonomous AI Business Operations Matrix
          </p>
        </div>

        {/* Status Protocol Online Badge */}
        <div
          className={`mt-7 transform transition-all duration-500 delay-200 ease-out ${
            stage === 'reveal' || stage === 'ready' || stage === 'exit'
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          }`}
        >
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1C1A18] border border-[#C5855A]/40 text-xs text-[#DFB59D] shadow-lg">
            {stage === 'ready' || stage === 'exit' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            )}
            <span className="font-mono text-[11px] font-semibold tracking-wider uppercase">
              {stage === 'ready' || stage === 'exit'
                ? 'Matrix Initialized · Entering Command Center'
                : 'ODAEA Kernel Synchronizing...'}
            </span>
          </div>
        </div>

        {/* Dynamic Loading Progress Bar */}
        <div className="mt-8 w-64 h-1 bg-[#24211E] rounded-full overflow-hidden p-0.5 border border-[#3A342E]">
          <div
            className="h-full bg-gradient-to-r from-[#DFB59D] via-[#C5855A] to-[#8E5633] rounded-full transition-all duration-500 ease-out shadow-sm shadow-[#C5855A]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Instant Skip / Enter Button */}
        <button
          type="button"
          onClick={handleSkip}
          className="mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1C1A18]/60 hover:bg-[#252220] border border-[#3A342E] hover:border-[#C5855A]/60 text-[11px] text-[#A8A29E] hover:text-[#FAF8F5] transition-all cursor-pointer"
        >
          <span>Enter Application</span>
          <ArrowRight className="w-3 h-3 text-[#C5855A]" />
        </button>
      </div>
    </div>
  );
};

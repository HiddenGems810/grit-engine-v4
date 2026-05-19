'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  unstable_retry
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('FORMAT workspace error boundary captured an error.', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#181818] px-6 text-[#e0e0e0]">
      <section className="w-full max-w-lg rounded-[8px] border border-[#3a3527] bg-[#121212] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#d6a13a]">FORMAT Recovery</p>
        <h1 className="mt-3 text-xl font-semibold text-[#f3efe6]">The workspace hit a render/import error.</h1>
        <p className="mt-3 text-sm leading-6 text-[#aaa49a]">
          Your image stays in this browser. Retry the workspace, or clear the current import if a file was malformed.
        </p>
        {error.digest && (
          <p className="mt-3 rounded-[3px] border border-[#333] bg-[#181818] px-3 py-2 font-mono text-[11px] text-[#888]">
            digest: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-5 rounded-[3px] bg-[#e8a82d] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.16em] text-black hover:bg-[#ffba33] focus:outline-none focus:ring-2 focus:ring-[#e8a82d]"
        >
          Retry Workspace
        </button>
      </section>
    </main>
  );
}

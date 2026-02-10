'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-400 mb-4">Something went wrong</h1>
        <p className="text-gray-400 mb-6">{error.message || 'An unexpected error occurred.'}</p>
        <button onClick={reset} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg">
          Try again
        </button>
      </div>
    </div>
  );
}

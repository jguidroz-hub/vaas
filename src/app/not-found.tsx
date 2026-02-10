import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-700 mb-4">404</h1>
        <p className="text-gray-400 mb-6">Page not found</p>
        <Link href="/" className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg">
          Go home
        </Link>
      </div>
    </div>
  );
}

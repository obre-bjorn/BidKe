import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-blue-500">
            🔨 Auction<span className="text-slate-50">Hub</span>
          </Link>
          <div className="flex gap-6 text-sm font-medium text-slate-400">
            <Link to="/" className="hover:text-blue-400 transition-colors">Browse</Link>
            <button className="hover:text-blue-400 transition-colors">My Bids</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
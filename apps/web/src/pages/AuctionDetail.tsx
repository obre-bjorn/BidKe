import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch static data from your API
    async function loadAuction() {
      try {
        const response = await fetch(`http://localhost:4000/auctions/${id}`);
        const data = await response.json();
        setAuction(data);
      } catch (error) {
        console.error("Failed to load auction", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) loadAuction();
  }, [id]);

  if (loading) return <div>Loading Auction...</div>;
  if (!auction) return <div>Auction not found.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Auction Info */}
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight">{auction.title}</h1>
        <div className="aspect-video bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center">
          <span className="text-slate-700 text-lg">Auction Image Placeholder</span>
        </div>
        <p className="text-slate-400 text-lg leading-relaxed">{auction.description}</p>
      </div>

      {/* Right: Bidding Sidebar */}
      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Current Price</p>
          <div className="text-4xl font-mono font-bold text-green-400 my-2">
            ${auction.currentPrice.toLocaleString()}
          </div>
          
          <div className="mt-6 space-y-3">
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Enter bid amount..."
            />
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
              Place Bid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
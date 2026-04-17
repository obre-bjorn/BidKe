import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

import {type Auction} from '../types'




interface AuctionCardProps {
  auction: Auction,

}

const AuctionCard = ({ auction }: AuctionCardProps) => {


  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all hover:border-blue-300 hover:shadow-xl group">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{auction.title}</h3>
        
        <div className="flex items-center justify-between mt-4 mb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Bid</span>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500" />
              <p className="text-3xl font-black text-blue-600 tracking-tight">
                ${auction.currentPrice.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <Link to={`/auctions/${auction.id}`}>
            <button className="btn-primary bg-sky-950 py-2 px-4">View Auction</button>
        </Link>
      </div>
    </div>
  )
}

export default AuctionCard
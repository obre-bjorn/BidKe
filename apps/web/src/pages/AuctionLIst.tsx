
import { useFetch } from '../hooks/useFetch'
import {type Auction} from '../types'
import AuctionCard from '../components/AuctionCard'

const AuctionLIst = () => {

    const { data: auctions, loading, error } = useFetch <Auction []>('/auctions')

    if (loading) return <div className="text-center mt-20 text-gray-500">Loading auctions...</div>

    if (error) return <div className="text-center mt-20 text-red-500">Error: {error}</div>

    if (!auctions || auctions.length === 0) return <div className="text-center mt-20 text-gray-500">No auctions available</div>


    return (
        <>
        <div className="min-h-screen bg-gray-100 p-8">
        <header className="max-w-6xl mx-auto mb-10 flex justify-between items-end">
            <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">AUCTION <span className="text-blue-600">HUB</span></h1>
            <p className="text-gray-500 font-medium">High-Performance Real-Time Bidding</p>
            </div>
            <div className="text-right">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Live System
            </span>
            </div>
        </header>

        <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
            ))}
        </main>
        </div>
        </>
    )
  
}

export default AuctionLIst
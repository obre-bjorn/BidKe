export interface Bid {
  id: string;
  amount: number;
  bidderName?: string; // Optional
  createdAt: string;
}

export interface Auction {
  id: string;
  title: string;
  description?: string;
  currentPrice: number;
  image?: string;
  bids?: Bid[]; // Array of related bids
}
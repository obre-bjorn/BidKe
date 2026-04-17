import { useState, useEffect } from 'react';
import { CONFIG } from '../config'; // <--- Import here

export function useFetch<T>(url: string) {
    const [data, setData] = useState<T|null>()
    const [loading, setLoading]  = useState(true)
    const[error, setError] = useState<string|null>(null)
    

    useEffect(() => {
        const fetchData = async () => {
        try {
            // Automatically becomes http://localhost:3001/auctions

            console.log(`Fetching from: ${CONFIG.API_URL}${url}`); // <--- Log the full URL
            const response = await fetch(`${CONFIG.API_URL}${url}`); 
            
            if (!response.ok) throw new Error("Network response was not ok");

            const result = await response.json();

            setData(result);
        } catch (err: any) {
            setError(err.message);
            
        } finally {
            setLoading(false);
        }
        };
        fetchData();
    }, [url]);

  return { data, loading, error };
}
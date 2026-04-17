import { useEffect,useState } from "react";
import { socket } from "../lib/socket";


export const useAuction = (initialPrice:number, auctionId:string) => {

    const [currentPrice, setCurrentPrice] = useState(initialPrice)
    const [error,setError] = useState <string | null>(null)

    useEffect (() =>{

        socket.on('bid:update',(data) => {


            if(data.auctionId === auctionId){

                setCurrentPrice(data.newPrice)

            }
            
        })


        socket.on('bid:error', (data) => {


            setError(data.errorMessage)


            setTimeout(() => setError(null), 3000)


        })

        return () => {
            socket.off('bid:update')
            socket.off('bid.error')

        }


    }, [auctionId])


    const placeBid = (amount: number) => {

        socket.emit('bid:submit', {auctionId,amount})



    }



    return {currentPrice, placeBid, error}
}


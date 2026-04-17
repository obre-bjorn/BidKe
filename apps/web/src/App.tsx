import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout';
import AuctionList from './pages/AuctionLIst';
import AuctionDetail from './pages/AuctionDetail';

// import reactLogo from './assets/react.svg'


import './App.css'

function App() {

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          path: '/',
          element: <AuctionList />
        },
        {
          path: '/auctions/:id',
          element: <AuctionDetail />
        }
      ]
    }
  ])


  
  return <RouterProvider router={router} />
  
}

export default App

import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Private, Public } from './layout'
import { RouterUrl } from './routes'
import { AdminHomepage, AdminReportsPage, AdminSalesPage, CategoryListPage, CreateCategoryPage, CreateInventoryPage, CreateStaffPage, InventoryListPage, LoginPage, PointofSalePage, StaffDashboard, StaffInventoryPage, StaffListPage, StaffSalesPage } from './pages'
import StaffSide from './layout/staff'

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element:<Public />,
      children:[
        { path: RouterUrl.Login, element: <LoginPage />},
      ]
    },
    {
      path: RouterUrl.Login,
      element:<Private />,
      children:[
        { path: RouterUrl.AdminDashboard, element:<AdminHomepage />},
        { path: RouterUrl.StaffAdd, element:<CreateStaffPage />},
        { path: RouterUrl.StaffList, element:<StaffListPage />},
        { path: RouterUrl.CategoryCreation, element:<CreateCategoryPage />},
        { path: RouterUrl.CategoryList, element:<CategoryListPage />},
        { path: RouterUrl.InventoryCreation, element:<CreateInventoryPage />},
        { path: RouterUrl.InventoryList, element:<InventoryListPage />},
        { path: RouterUrl.AdminSales, element:<AdminSalesPage />},
        { path: RouterUrl.Reports, element:<AdminReportsPage />},
      
      ]
    },
    {
      path: RouterUrl.Login,
      element:<StaffSide />,
      children:[
        { path: RouterUrl.StaffDashboard, element:<StaffDashboard />},
        { path: RouterUrl.POS, element:<PointofSalePage />},
        { path: RouterUrl.ProductList, element:<StaffInventoryPage />},
        { path: RouterUrl.Sales, element:<StaffSalesPage />}
      ]
    }
  ])

  return (
    <RouterProvider router={router} fallbackElement={<h6>Loading...</h6>}  />
  )
}

export default App

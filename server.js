require("dotenv").config()
const express = require("express")
const cors = require("cors")
const adminAuth = require('./Routes/Admin/Auth/AdminAuth')
const categoryRoutes = require('./Routes/Admin/Category/CategoryRoute')
const SubcategoryRoutes = require('./Routes/Admin/SubCategory/SubCategoryRoute')
const sliderRoutes = require('./Routes/Admin/Slider/sliderRoute')
const couponRoutes = require('./Routes/Admin/Coupon/couponRoute')
const productRoutes = require('./Routes/Admin/Product/productRoute')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())
require('./DB/connection')

// admin Routes
app.use('/admin/auth',adminAuth)
app.use('/admin/category',categoryRoutes)
app.use('/admin/Subcategory',SubcategoryRoutes)
app.use('/admin/slider',sliderRoutes)
app.use('/admin/coupon',couponRoutes)
app.use('/admin/products',productRoutes)




// USER ROUTES



app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const PORT = 3000 || process.env.PORT

app.listen(PORT,()=>{
    console.log(`server started listening at PORT ${PORT}`);
})
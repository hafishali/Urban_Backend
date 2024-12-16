require("dotenv").config()
const express = require("express")
const cors = require("cors")
const passport = require('passport')
const adminAuth = require('./Routes/Admin/Auth/AdminAuth')
const categoryRoutes = require('./Routes/Admin/Category/CategoryRoute')
const SubcategoryRoutes = require('./Routes/Admin/SubCategory/SubCategoryRoute')
const sliderRoutes = require('./Routes/Admin/Slider/sliderRoute')
const couponRoutes = require('./Routes/Admin/Coupon/couponRoute')
const productRoutes = require('./Routes/Admin/Product/productRoute')
const userCategoryRoutes = require('./Routes/User/Category/categoryRoute')
const userSubCategoryRoutes = require('./Routes/User/Subcategory/subCategoryRoute')
const userProductRoutes = require('./Routes/User/Product/productRoute')
const userSliderRoutes = require('./Routes/User/Slider/sliderRoute')
const userCartController = require('./Routes/User/Cart/cartRoute')
const wishlistController = require('./Routes/User/Wishlist/wishlistRoute')
const addressController = require('./Routes/User/Address/addressRoute')
const userController = require('./Routes/User/Auth/UserAuth')
const profileController = require('./Routes/User/Profile/profileRoute')
const checkoutController=require('./Routes/User/Checkout/checkoutRoute')
const userAdminController=require('./Routes/Admin/Users/userRoute')
const orderController = require('./Routes/User/Order/OrderRoute')
const adminOrderRoutes = require('./Routes/Admin/OrderList/orderListRoutes')


const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())
require('./DB/connection')
require('./config/passportConfigFacebook')
require('./config/passportConfigGoogle')
app.use(passport.initialize())

// admin Routes
app.use('/admin/auth',adminAuth)
app.use('/admin/category',categoryRoutes)
app.use('/admin/Subcategory',SubcategoryRoutes)
app.use('/admin/slider',sliderRoutes)
app.use('/admin/coupon',couponRoutes)
app.use('/admin/products',productRoutes)
app.use('/admin/users',userAdminController)
app.use('/admin/orderlist', adminOrderRoutes)


// USER ROUTES
app.use('/user/category',userCategoryRoutes)
app.use('/user/subCategory',userSubCategoryRoutes)
app.use('/user/products',userProductRoutes)
app.use('/user/slider',userSliderRoutes)
app.use('/user/cart',userCartController)
app.use('/user/wishlist',wishlistController)
app.use('/user/address',addressController)
app.use('/user/auth',userController)
app.use('/user/profile',profileController)
app.use('/user/checkout',checkoutController)
app.use('/user/order',orderController)


app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const PORT = 3000 || process.env.PORT

app.listen(PORT,()=>{
    console.log(`server started listening at PORT ${PORT}`);
})
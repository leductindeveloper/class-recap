require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const session = require('express-session')
const methodOverride = require('method-override')
const connectMongo = require('connect-mongo');
const MongoStore = connectMongo.default || connectMongo;
const expressLayouts = require('express-ejs-layouts')

const app = express()
const PORT = process.env.PORT || 3000

app.set('trust proxy', 1)


// ==========================
// MONGODB
// ==========================

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/classrecap'

mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err))


// ==========================
// MIDDLEWARE
// ==========================

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(methodOverride('_method'))


// ==========================
// VIEW ENGINE
// ==========================

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(expressLayouts)
app.set('layout', 'layout')


// ==========================
// STATIC FILES
// ==========================

app.use(express.static(path.join(__dirname, 'public')))


// ==========================
// SESSION
// ==========================

app.use(session({
  secret: process.env.SESSION_SECRET || "supersecretkey",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    collectionName: "sessions"
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}))


// ==========================
// GLOBAL VARIABLES
// ==========================

app.use((req, res, next) => {

  res.locals.isAdmin = req.session.isAdmin || false

  next()
})


// ==========================
// KEEP ALIVE PING
// ==========================

app.get("/ping", (req, res) => {
  res.status(200).send("server alive")
})


// ==========================
// ROUTES
// ==========================

const publicRoutes = require('./server/routes/publicRoutes')
const adminRoutes = require('./server/routes/adminRoutes')

app.use('/', publicRoutes)
app.use('/admin', adminRoutes)


// ==========================
// AUTO CREATE ADMIN
// ==========================

mongoose.connection.once("open", async () => {

  const users = mongoose.connection.collection("users")

  const admin = await users.findOne({ username: "admin" })

  if (!admin) {

    await users.insertOne({
      username: "admin",
      password: "123456",
      role: "admin",
      createdAt: new Date()
    })

    console.log("Admin account created")
  }

})


// ==========================
// 404
// ==========================

app.use((req, res) => {

  res.status(404).render('404', { title: '404 - Không tìm thấy trang' })

})


// ==========================
// START SERVER
// ==========================

app.listen(PORT, () => {

  console.log("Server running on port " + PORT)

})

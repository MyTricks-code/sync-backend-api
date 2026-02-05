import express from 'express'

const PORT = 8000 || process.env.PORT
const app = express()

app.get("/", (req, res)=>{
    res.send("SYNC AIT BACKEND API")
})

app.listen(PORT, ()=>{
    console.log("Server Started: ", PORT)
})
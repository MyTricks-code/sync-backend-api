import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next)=>{
    const {adminToken} = req.cookies;
    if(!adminToken){
        return res.json({
            success: false,
            message: "Not Authorized. Login Again"
        })
    }
    try{
         
        const decodeToken =  jwt.verify(adminToken, process.env.JWT_SECRET)
        if(decodeToken.email && decodeToken.club){
            req.body = {
            ...req.body,
            email: decodeToken.email,
            club: decodeToken.club
            };
            console.log(req.body)
        }else{
            return res.json({
            success: false,
            message: "Not Authorized. Login Again"
        })
        }
        next()
    }catch(err){
        return res.json({
            success: false,
            message: err.message
        })
    }
}

export default adminAuth;
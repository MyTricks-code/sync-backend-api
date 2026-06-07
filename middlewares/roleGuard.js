export const roleGuard =
(...roles)=>
(req,res,next)=>{

 try{

   const role =
   req.admin?.role;

   if(!role){

      return res.json({
        success:false,
        message:"Unauthorized"
      });

   }

   if(
      !roles.includes(role)
   ){

      return res.json({
        success:false,
        message:"Access Denied"
      });

   }

   next();

 }catch(err){

   return res.json({
      success:false,
      message:err.message
   });

 }

}
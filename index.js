const express = require("express");
const path = require("path");
const expresslayouts=require("express-ejs-layouts");
const fileupload=require("express-fileupload");
const { uptime } = require("process");
const MongoClient = require("mongodb").MongoClient;
const app = express();




app.set("views",path.join(__dirname,"/views/"));
app.set("view engine","ejs");
app.set("layout","layouts/mainlayouts");
app.use(fileupload());
app.use(expresslayouts); 
app.use(express.static(__dirname+"/public")); 
app.use(express.urlencoded({extended: false}));

const url="mongodb://localhost:27017/pizza_order";
let customer_detail_collection = "";
let admin_detail_collection ="";
let item_detail_collection ="";
MongoClient.connect(url,function(err,client){

    if(err) throw err;
    const db=client.db("pizza_order");
    customer_detail_collection=db.collection("customer_detail");
    admin_detail_collection=db.collection("admin_detail");
    item_detail_collection=db.collection("item_detail");
    console.log("Database Connected...!!");
})


app.get("/",function(req,res){

    res.render("default/home")
})

app.get("/about",function(req,res){

    res.render("default/about")
})

app.get("/contact",function(req,res){

    res.render("default/contact")
})


app.get("/login",function(req,res){

    res.render("default/login")
})

app.get("/registration",function(req,res){

    res.render("default/registration")
})

app.post("/add_cust",function(req,res){

    const{txtname,txtadd,txtcity,txtmno,txtemail,txtpwd} =req.body;
    customer_detail_collection.findOne({email_id: txtemail},function(err,data){
        if(err) throw err;
        if(data == null)
        {
            customer_detail_collection.find().sort({cust_id: -1}).limit(1).toArray(function(err2,data2){
                if(err2) throw err2;

                let custid = 0;
                if(data2.length == 0)
                {
                    custid=1;
                }
                else
                {
                    var row=JSON.parse(JSON.stringify(data2[0]));
                    custid = row.cust_id + 1;
                }
                
                customer_detail_collection.insert({cust_id: custid,cust_name: txtname,address: txtadd,city: txtcity,mobile_no: txtmno,email_id: txtemail,pwd: txtpwd},function(err3,data3){
                    if(err3) throw err3;
                    res.write("<script> alert('Registration Successfully Done..!!'); window.location.href='/login'; </script>");
                })
            })
        }
        else
        {
            res.write("<script> alert('Email Id Already Exists'); window.location.href='/registration'; </script>");
        }

    })

})




app.post("/log_user",function(req,res){

    const {txtemail,txtpwd} = req.body;

    admin_detail_collection.findOne({email_id: txtemail,pwd: txtpwd},function(err1,data1){
        if(err1) throw err1;

        if(data1 == null)
        {
            customer_detail_collection.findOne({email_id: txtemail,pwd: txtpwd},function(err2,data2){
                if(err2) throw err2;
        
                if(data2 == null)
                {
                    res.write("<script> alert('Check Given Email_Id Or Password...!!'); window.location.href='/login'; </script>");
                }
                else
                {
                    res.write("<script> alert('Customer Login Successfully...!!!'); window.location.href='/'; </script>");
                }
        
            })
        }
        else
        {
            res.write("<script> alert('Admin Login Successfully...!!!'); window.location.href='/admin_manage_pizza'; </script>");
        }

    })

})


app.get("/admin_manage_pizza",function(req,res){

    item_detail_collection.find().toArray(function(err1,data1){

        if(err1) throw err1;
        res.render("admin/admin_manage_pizza",{layout: "layouts/adminlayouts",itemdetail: data1});
    })
    
})

app.post("/add_product",function(req,res){

    const {txtname,txtdesc,txtprice,txtimg} = req.body;

    if(!req.files || Object.keys(req.files).length!=0)
    {
        let samplefile=req.files.txtimg;
        let ipath= "/item_img/"+Date.now()+".png";
        let upath= __dirname+"/public"+ipath;

        item_detail_collection.find().sort({item_id: -1}).limit(1).toArray(function(err1,data1){
            if(err1) throw err1;


            let pid=0;
            if(data1.length==0)
            {
                pid=1;
            }
            else
            {
                var row= JSON.parse(JSON.stringify(data1[0]));
                pid=row.item_id+1;
            }

            item_detail_collection.insertOne({item_id: pid,item_name: txtname,description: txtdesc,price: parseInt(txtprice),item_img: ipath},function(err2,data2){
                if(err2) throw err2;

                samplefile.mv(upath,function(err3,data3){
                    if(err3) 
                    {
                        res.write("<script> alert('error in image uploading'); window.location.href='/admin_manage_pizza';</script>");
                    }
                    else
                    {
                        res.write("<script> alert('item saved successfully..!!'); window.location.href='/admin_manage_pizza';</script>");
                    }
                })
            })
        })



    }
    else
    {
        res.render("<script> alert('Please Select Product Images'); window.location.href='/admin_manage_pizza';</script>");
    }




})

app.get("/delete_item/:iid",function(req,res){

    let iid= parseInt(req.params.iid);
    item_detail_collection.remove({item_id: iid},function(err1,data1){
        if(err1) throw err1;

        res.write("<script> alert('Item Deleted...!!!'); window.location.href='/admin_manage_pizza';</script>");

    })
})


app.get("/edit_item/:iid",function(req,res){

    let iid= parseInt(req.params.iid);
    item_detail_collection.find({item_id: iid}).toArray(function(err1,data1){

        if(err1) throw err1;
        res.render("admin/admin_edit_pizza",{layout: "layouts/adminlayouts",itemdetail: data1});
    })

})


app.post("/update_item",function(req,res){

    const {txtname,txtdesc,txtprice,txtiid} = req.body;   
    
    if(!req.files || Object.keys(req.files).length==0)
    {
        item_detail_collection.update({item_id: parseInt(txtiid)},{$set:{item_name: txtname,description: txtdesc,price: parseInt(txtprice)}},function(err1,data1){

            if(err1) throw err1;

            res.write("<script> alert('Item Updated..!!'); window.location.href='/admin_manage_pizza';</script>");

        })
    }
    else
    {
        let samplefile=req.files.txtimg;
        let ipath= "/item_img/"+Date.now()+".png";
        let upath= __dirname+"/public"+ipath;

        item_detail_collection.update({item_id: parseInt(txtiid)},{$set:{item_name: txtname,description: txtdesc,price: parseInt(txtprice),item_img: ipath}},function(err2,data2){
            if(err2) throw err2;
            samplefile.mv(upath,function(err3,data3){
                if(err3)
                {
                    res.write("<script> alert('error in image updating'); window.location.href='/admin_manage_pizza';</script>");
  
                }
                else
                {
                    res.write("<script> alert('item updated..!!!'); window.location.href='/admin_manage_pizza';</script>");
                }
            })
        })
    }

})

app.get("/view_item",function(req,res){

    item_detail_collection.find().toArray(function(err1,data1){
        if(err1) throw err1;
        res.render("customer/view_item",{idetail: data1});

    })
})


app.listen(3000,"localhost",function(){
    console.log("Server Started At Port no 3000 click here http://127.0.0.1:3000/ to open website:) ")
})
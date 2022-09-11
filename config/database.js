const mongoose = require('mongoose');
async function connect(){
    try {
        await mongoose.connect('mongodb+srv://ak47016599:tctk19tdptcxlddm@cluster0.tq8jxdo.mongodb.net/chat?retryWrites=true&w=majority');
        console.log('connect database success !');
    } catch {
        console.log('connect database error !');
    }
}
module.exports = {connect};
//mongodb+srv://ak47016599:tctk19tdptcxlddm@cluster0.tq8jxdo.mongodb.net/property?retryWrites=true&w=majority
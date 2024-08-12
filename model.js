const { Schema, model } = require('mongoose')

const roomSchema = new Schema({
    id: Number,
    name: String,
    serialNumber: String,
})

const Room = new model("Room", roomSchema)

module.exports = Room
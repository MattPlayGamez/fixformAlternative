require('dotenv/config')
const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const morgan = require('morgan')
const app = express()
const fs = require('fs/promises')
const multer = require('multer')
const path = require('path')


app.use(helmet())
app.use(morgan("dev"))

app.set('view engine', 'ejs')
app.set('public', 'public')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

mongoose.connect(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@fixformalternative.xva7k.mongodb.net/?retryWrites=true&w=majority&appName=FixFormAlternative`)


const roomSchema = new mongoose.Schema({
    name: String,
    serialNumber: String,
    manufacturer: String,
    contactNumber: String,
})

const problemSchema = new mongoose.Schema({
    name: String,
    description: String,
    roomID: String,
    image: String
})

const Room = new mongoose.model("Room", roomSchema)
const Problem = new mongoose.model("Problem", problemSchema)

app.get('/', (req, res) => {
    res.redirect('/dashboard')
})

app.get('/dashboard', async (req, res) => {
    let rooms = await Room.find({})
    let problems = await Problem.find({})
    res.render('dashboard.ejs', { rooms, problems })
})

app.get('/room', (req, res) => {
    res.redirect('/room/66b91e834e09ffa0ca2c45bc')
})

app.get('/room/:id', async (req, res) => {
    try {
        const room = await Room.findOne({ _id: req.params.id })
        res.render('reportProblem.ejs', { roomName: room.name, roomID: room._id })
    } catch (error) {
        console.log(error)
        res.send("Kamer niet gevonden")
    }

})

app.get('/delete-problem/:id', async (req, res) => {
    await Problem.findByIdAndDelete(req.params.id)
    res.redirect('/dashboard')

})
app.get('/delete-room/:id', async (req, res) => {
    await Room.findByIdAndDelete(req.params.id)
    res.redirect('/dashboard')
})

app.get('/add-room', (req, res) => {
    res.render('add-room', {
        title: 'Voeg Kamer Toe - Dashboard',
        header: 'Voeg Nieuwe Kamer Toe',
    });
});

app.post('/add-room', (req, res) => {
    const { name, serialNumber, manufacturer, contactNumber } = req.body

    const room = new Room({
        name,
        serialNumber,
        manufacturer,
        contactNumber
    })
    room.save()
    res.redirect('/dashboard')
})

app.get('/edit-room/:id', async (req, res) => {
    const room = await Room.findById(req.params.id)
    res.render('edit-room.ejs', { room })
})

app.post('/edit-room', async (req, res) => {
    const { id, name, serialNumber, manufacturer, contactNumber } = req.body

    const data = {
        name,
        serialNumber,
        manufacturer,
        contactNumber
    }
    await Room.updateOne({ _id: id }, data)
    res.redirect('/dashboard')
})

app.get('/view-problem/:id', async (req, res) => {
    const problem = await Problem.findById(req.params.id)
    const roomID = problem.roomID

    const room = await Room.findById(roomID)
    res.render('view-problem.ejs', { problem, room })
})

app.get('/report/:id', (req, res) => {
    res.redirect('/room/' + req.params.id)
})

app.post('/report/:id', upload.single('image'), async (req, res) => {
    let isThereAnImage = true
    if (!req.file) {
        isThereAnImage = false
    }
    const { name, description, image } = req.body;
    const roomID = req.params.id; // Assuming roomID is intended to be a string
    console.log(req.body);
    console.log(req.params);

    const date = new Date().toISOString().replace(/:/g, '-');
    const imageName = `${roomID}_${date}.jpg`;
    const imagePath = `./public/images/${imageName}`;

    if (isThereAnImage) {
        const problem = new Problem({
            name,
            description,
            roomID, // Ensure the schema allows roomID as a string
            image: `/images/${imageName}`
        });
        try {
            await problem.save();
            res.render('thanksreport.ejs', { name })
            console.log('Report submitted successfully: ' + problem._id);
            fs.writeFile(imagePath, req.file.buffer, (err) => {
                if (err) {
                    return res.status(500).send('Failed to save file.');
                }
                res.send('File uploaded and saved successfully!');
            });
        } catch (error) {
            console.error('Error submitting report:', error);
            res.status(500).send('Error submitting report');
        }
    } else {
        const problem = new Problem({
            name,
            description,
            roomID, // Ensure the schema allows roomID as a string
            image: null
        });
        try {
            await problem.save();
            res.render('thanksreport.ejs', { name })
            console.log('Report submitted successfully: ' + problem._id);
        } catch (error) {
            console.error('Error submitting report:', error);
            res.status(500).send('Error submitting report');
        }
    }

});



app.listen(process.env.PORT || 3000, () => console.log('Server started'))
require('dotenv/config')
const express = require('express')
const mongoose = require('mongoose')
const helmet = require('helmet')
const morgan = require('morgan')
const app = express()
const fs = require('fs/promises')
const multer = require('multer')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const checkAuthStatus = require('./authMiddleware.js')
const cookieParser = require('cookie-parser');
const imgbbUploader = require('imgbb-uploader')

HASH = process.env.HASH


app.use(helmet())
app.use(morgan("common"))
app.use(cookieParser())

app.set('view engine', 'ejs')
app.set('public', 'public')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
// Middleware to handle CSP headers
app.use((req, res, next) => {
    // Disable CSP for specific route
    if (req.path.startsWith('/dashb')) {
        res.removeHeader("Content-Security-Policy");
    }
    if (req.path.startsWith("/view")) {
        if (req.path.startsWith("/view")) {
            res.header("Content-Security-Policy", "img-src 'self' https://i.ibb.co");
            res.header("Access-Control-Allow-Origin", "https://i.ibb.co");
        }
    }
    next();
});

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
    imageLink: String,
})

const Room = new mongoose.model("Room", roomSchema)
const Problem = new mongoose.model("Problem", problemSchema)


app.get('/', (req, res) => {
    res.redirect('/dashboard')
})

app.get('/login', (req, res) => {
    res.render('login.ejs')
})

app.post('/login', (req, res) => {
    if (bcrypt.compareSync(req.body.password, HASH)) {
        let token = jwt.sign({ authenticated: true }, process.env.JWT_SECRET, { expiresIn: '1h' })
        // console.log(res.getHeaders());
        res.cookie('token', token)
        return res.redirect('/dashboard')
    } else {
        res.render('login.ejs', { error: 'Bruh' })
    }
})


app.get('/dashboard', checkAuthStatus, async (req, res) => {
    res.removeHeader("Content-Security-Policy");
    let rooms = await Room.find({})
    let problems = await Problem.find({})
    res.render('dashboard.ejs', { rooms, problems })
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

app.get('/delete-problem/:id', checkAuthStatus, async (req, res) => {
    await Problem.findByIdAndDelete(req.params.id)
    res.redirect('/dashboard')

})
app.get('/delete-room/:id', checkAuthStatus, async (req, res) => {
    await Room.findByIdAndDelete(req.params.id)
    await Problem.deleteMany({ roomID: req.params.id })
    res.redirect('/dashboard')
})

app.get('/add-room', checkAuthStatus, (req, res) => {
    res.render('add-room', {
        title: 'Voeg Kamer Toe - Dashboard',
        header: 'Voeg Nieuwe Kamer Toe',
    });
});

app.post('/add-room', checkAuthStatus, (req, res) => {
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

app.get('/edit-room/:id', checkAuthStatus, async (req, res) => {
    const room = await Room.findById(req.params.id)
    res.render('edit-room.ejs', { room })
})

app.post('/edit-room', checkAuthStatus, async (req, res) => {
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

app.get('/view-problem/:id', checkAuthStatus, async (req, res) => {
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
    const { name, description } = req.body;
    const roomID = req.params.id; // Assuming roomID is intended to be a string
    console.log(req.body);
    console.log(req.params);

    if (isThereAnImage) {
        try {
            const options = {
                apiKey: process.env.IMGBB_APIKEY, // MANDATORY

                base64string:
                    req.file.buffer.toString('base64'),
            };
            imgbbUploader(options)
                .then((response) => {
                    const problem = new Problem({
                        name,
                        description,
                        roomID, // Ensure the schema allows roomID as a string
                        imageLink: response.display_url,
                    });
                    console.log(response)
                    problem.save();
                    res.render('thanksreport.ejs', { name })
                    console.log('Report submitted successfully: ' + problem._id);
                })
                .catch((error) => console.error(error));


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
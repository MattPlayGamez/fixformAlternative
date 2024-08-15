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
const fbAdmin = require('firebase-admin')
const service_account = require('./service_account.json')
HASH = process.env.HASH


app.use(helmet())
app.use(morgan("common"))
app.use(cookieParser())

fbAdmin.initializeApp({
    credential: fbAdmin.credential.cert(service_account),
    storageBucket: "white-watch-405218.appspot.com"
});

const bucket = fbAdmin.storage().bucket()


async function uploadFile(buffer, name) {
    if (!name) {
        throw new Error('No object name provided');
    }

    if (!buffer || !buffer.length) {
        throw new Error('No buffer provided');
    }

    return new Promise((resolve, reject) => {
        const file = bucket.file(name);
        const stream = file.createWriteStream({
            metadata: {
                contentType: 'image/jpeg',
            },
        });

        stream.on('error', (err) => {
            console.error('Error uploading image:', err);
            reject(err);
        });

        stream.on('finish', async () => {
            try {
                await file.makePublic();
                const publicUrl = file.publicUrl();
                const internalLink = file.cloudStorageURI
                const combined = publicUrl + '&n&' + internalLink
                resolve(combined);
            } catch (err) {
                console.error('Error making file public:', err);
                reject(err);
            }
        });

        stream.end(buffer);
    });
}


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
            res.header("Content-Security-Policy", "img-src 'self' https://storage.googleapis.com/");
            res.header("Access-Control-Allow-Origin", "https://storage.googleapis.com/");
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
    publicimageLink: String,
    internalLink: String
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
    const problem = await Problem.findById(req.params.id).internalLink

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

app.get('/view-room/:id', checkAuthStatus, async (req, res) => {
    const room = await Room.findById(req.params.id)
    console.log(room)
    res.render('view-room.ejs', { room, id: req.params.id })
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
    const { name, description } = req.body;
    const roomID = req.params.id;
    let imageLink = null;
    let googleLink = null;

    // Check if an image was uploaded
    if (req.file) {
        try {
            console.log('Buffer length:', req.file.buffer.length);
            const randomId = new mongoose.Types.ObjectId().toString();
            console.log('Generated file name:', randomId);

            imageLink = await uploadFile(req.file.buffer, randomId);
            let splittedLink = imageLink.split('&n&');
            googleLink = splittedLink[1];
            imageLink = splittedLink[0];

            console.log("The link to the image is: " + imageLink);
        } catch (error) {
            console.error('Error uploading image:', error);
            return res.status(500).send('Error uploading image');
        }
    }

    // Create and save the problem report
    const report = new Problem({
        name,
        description,
        roomID,
        publicimageLink: imageLink,
        internalLink: googleLink

    });

    try {
        await report.save();
        console.log('Report submitted successfully: ' + report._id);
        res.render('thanksreport.ejs', { name });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).send('Error submitting report');
    }
});




app.listen(process.env.PORT || 3000, () => console.log('Server started'))
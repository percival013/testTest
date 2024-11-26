const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const bcrypt = require('bcrypt')
const port = 3019
const app = express()
const mongoUrl = 'mongodb+srv://admin:BKjonpCFvhw1QnPe@dbcluster.rzvwo.mongodb.net/fixerfinder'
const cookieParser = require('cookie-parser')
const cors = require('cors');
const router = express.Router()
const Message = require('./models/Message')

process.on('exit', function(code) {
    console.log(`About to exit with code: ${code}`);
    
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(cookieParser())
app.use(express.static(__dirname))
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(session({
    secret: 'BKjonpCFvhw1QnPe',
    resave: false,
    saveUninitialized: true,
    cookie:{maxAge: 34560000},
    store: new MongoStore({
        mongoUrl: mongoUrl,
        collectionName: 'users'
    })
}))

mongoose.connect(mongoUrl, {
    useUnifiedTopology: true,
    useNewUrlParser: true
})
const db = mongoose.connection
db.once('open',()=>{
    console.log("MongoDb Connection established!")
})

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'regular' },
    isApproved: { type: Boolean, required: true },
    createdAt: { type: Date, default: Date.now },
    address: { type: String, required: true },
    city: { type: String, required: true }, // Add city field
    province: { type: String, required: true }, // Add province field
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
});
const Users = mongoose.model("users", UserSchema)

const ApplicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    gender: { type: String, required: true },
    phone: { type: String, required: true },
    proofOfWork: { type: String, required: true },
    credentials: { type: String },
    status: { type: String, default: 'pending' }
});
const Application = mongoose.model("Application", ApplicationSchema);

const AdvertisementRequestSchema = new mongoose.Schema({
    serviceName: { type: String, required: true},
    serviceCategory: { type: String, required: true },
    serviceDescription: { type: String, required: true },
    averagePrice: { type: Number, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true }, // Add city field
    province: { type: String, required: true }, // Add province field
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
AdvertisementRequestSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});
const AdvertisementRequest = mongoose.model('AdvertisementRequest', AdvertisementRequestSchema);
module.exports = AdvertisementRequest;

const ServiceSchema = new mongoose.Schema({
    serviceName: { type: String, required: true},
    serviceCategory: { type: String, required: true },
    serviceDescription: { type: String, required: true },
    averagePrice: { type: Number, required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    ratings: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, required: true },
        username: { type: String, required: true }
    }],
    averageRating: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now },
    address: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
}); 
const Service = mongoose.model('Service', ServiceSchema);

const CommentSchema = new mongoose.Schema({
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    comment: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    username: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now }
});
const Comment = mongoose.model('Comment', CommentSchema);

const BookingSchema = new mongoose.Schema({
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', BookingSchema);
module.exports = Booking;

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'index.html'))
})

app.post('/applications', async (req, res) => {
    const { address, gender, phone, proofOfWork } = req.body;

    
    const userId = req.session.userId;

    
    if (!userId || !address || !gender || !phone || !proofOfWork) {
        return res.status(400).send({ error: 'All fields are required' });
    }

    try {
        const newApplication = new Application({ 
            userId,
            address,
            gender,
            phone,
            proofOfWork
        });
        await newApplication.save();
        console.log('Application saved:', newApplication); 
        res.status(201).send(newApplication);
    } catch (error) {
        console.error('Error saving application:', error); 
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await Users.findOne({ email, password });

    if (user) {
        req.session.userId = user.id; 
        res.cookie('sessionId', req.session.id, { maxAge: 86400000, httpOnly: true });
        res.redirect('dashboard.html');
    } else {
        res.redirect('login.html');
    }
});

app.post('/post', async (req, res) => {
    const { username, email, password, address, city, province, latitude, longitude } = req.body;

    console.log("Received data:", req.body); 

    if (!email || !username || !password || !address || !city || !province || !latitude || !longitude) {
        console.error('All fields are required');
        return res.status(400).redirect('/register.html');
    }

    const existingUser  = await Users.findOne({ email });
    if (existingUser ) {
        console.log('User  with this email already exists.');
        return res.status(400).redirect('/register.html');
    }

    const user = new Users({
        username,
        email,
        password,
        isApproved: false,
        address,
        city,
        province,
        latitude,
        longitude
    });

    try {
        
        await user.save();
        console.log('User  saved:', user); 
        res.redirect('/index.html');
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).redirect('/register.html');
    }
});

app.get('/api/user', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" }); 
    }
    const user = await Users.findById(req.session.userId);
    if (!user) {
        return res.status(404).json({ message: "User  not found" });
    }
    res.json({
        username: user.username,
        email: user.email,
        joinedDate: user.createdAt,
        role: user.role,
        isApproved: user.isApproved,
        _id: user._id,
        address: user.address,
        city: user.city,
        province: user.province,
        latitude: user.latitude,
        longitude: user.longitude
    });
});

app.get('/api/get-users', async (req, res) => {
    try {
        const users = await Users.find({}, 'username _id'); 
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.get('/api/get-user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/current-user', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' }); 
    }
  
    Users.findById(req.session.userId)
      .then(user => {
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
      })
      .catch(err => {
        console.error('Error getting current user:', err);
        res.status(500).json({ message: 'Internal server error' });
      });
  });

app.get('/api/check-login', async (req, res) => {
    const sessionId = req.cookies.sessionId; 

    if (!sessionId) {
        return res.json({ success: false });
    }

    try {
        const user = await Users.findById(req.session.userId);
        if (!user) {
            return res.json({ success: false });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error checking login status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/switch-to-provider', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await Users.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: 'User  not found' });
        }

        
        if (!user.isApproved) {
            return res.status(403).json({ message: 'You must be approved to switch to Service Provider.' });
        }

        
        user.role = 'provider';
        await user.save(); 
        req.session.userId = user._id; 
        res.status(200).json({ message: 'Switched to Service Provider successfully!' });
    } catch (error) {
        console.error('Error switching to service provider:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/switch-to-customer', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await Users.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: 'User  not found' });
        }

        
        user.role = 'regular'; 

        await user.save();
        res.status(200).json({ message: 'Switched to Regular Customer successfully!' });
    } catch (error) {
        console.error('Error switching to regular customer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/apply-service-provider', async (req, res) => {
    const { gender, phone, proofOfWork } = req.body;

    
    const userId = req.session.userId;

    
    if (!userId|| !gender || !phone || !proofOfWork) {
        return res.status(400).send({ error: 'All fields are required' });
    }

    try {
        const newApplication = new Application({ 
            userId,

            gender,
            phone,
            proofOfWork
        });
        await newApplication.save();
        console.log('Application saved:', newApplication); 
        res.status(201).send(newApplication);
    } catch (error) {
        console.error('Error saving application:', error); 
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.patch('/api/update-user-role/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        
        const updatedUser  = await Users.findByIdAndUpdate(userId, { isApproved: true, role: 'provider' }, { new: true });
        
        if (!updatedUser ) {
            return res.status(404).json({ message: 'User  not found' });
        }
        
        res.json(updatedUser );
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/get-service-providers', async (req, res) => {
    try {
        const serviceProviders = await Users.find({ role: 'provider' }); 
        res.json(serviceProviders);
    } catch (error) {
        console.error('Error fetching service providers:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.patch('/api/remove-access/:userId', async (req, res) => {
    const userId = req.params.userId;
  
    try {
      const user = await User.findByIdAndUpdate(userId, { role: 'user' }, { new: true });
      if (!user) {
        return res.status(404).json({ message: 'User  not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error removing access:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/advertise-service', async (req, res) => {
    const { serviceName, serviceCategory, serviceDescription, averagePrice } = req.body;

    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const user = await Users.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ message: 'User  not found' });
        }

        const newAdvertisementRequest = new AdvertisementRequest({
            serviceName,
            serviceCategory,
            serviceDescription,
            averagePrice,
            providerId: req.session.userId,
            address: user.address,
            city: user.city,
            province: user.province,
            latitude: user.latitude,
            longitude: user.longitude
        });

        await newAdvertisementRequest.save(); 
        res.status(201).json({ message: 'Advertisement request submitted successfully and is pending approval!' });
    } catch (error) {
        console.error('Error saving advertisement request:', error);
        res.status(500).json({ message: 'Failed to submit advertisement request.' });
    }
});

app.get('/api/get-advertisement-requests', async (req, res) => {
    try {
        const requests = await AdvertisementRequest.find()
            .populate('providerId', 'username') 
            .exec();

        res.json(requests);
    } catch (error) {
        console.error('Error fetching advertisement requests:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/api/get-pending-applications', async (req, res) => {
    try {
      const applications = await Application.find({ status: 'pending' });
      res.json(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/get-approved-applications', async (req, res) => {
    try {
        const approvedApplications = await Application.find({ status: 'approved' }); 
        res.json(approvedApplications);
    } catch (error) {
        console.error('Error fetching approved applications:', error);
        res.status(500).send('Failed to fetch approved applications.');
    }
});

app.delete('/api/remove-application/:id', async (req, res) => {
    const applicationId = req.params.id;

    try {
        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: 'Application not found.' });
        }

        
        await Application.deleteOne({ _id: applicationId });

        
        await Users.findByIdAndUpdate(application.userId, { isApproved: false, role: 'regular' }, { new: true });

        res.status(200).json({ message: 'Application removed successfully! User role updated to regular.' });
    } catch (error) {
        console.error('Error removing application:', error);
        res.status(500).json({ message: 'Failed to remove application.' });
    }
});

app.patch('/api/update-application-status/:applicationId', async (req, res) => {
    const applicationId = req.params.applicationId;
    const { status } = req.body;

    try {
        const application = await Application.findByIdAndUpdate(applicationId, { status }, { new: true });
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        
        if (status === 'approved') {
            await Users.findByIdAndUpdate(application.userId, { isApproved: true }, { new: true });
        }

        res.json(application);
    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
  

app.patch('/api/update-user-role/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { isApproved } = req.body; 

    try {
        const user = await Users.findByIdAndUpdate(userId, { isApproved: isApproved }, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User  not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.patch('/api/update-user/:id', async (req, res) => {
    const { email, username } = req.body;

    
    if (email === null || email.trim() === '') {
        return res.status(400).send({ error: 'Email is required.' });
    }

    try {
        const updatedUser  = await Users.findByIdAndUpdate(req.params.id, { email, username }, { new: true });
        if (!updatedUser ) {
            return res.status(404).send({ error: 'User  not found.' });
        }
        res.send(updatedUser );
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});  


app.patch('/api/remove-access/:userId', async (req, res) => {
    const userId = req.params.userId;
  
    try {
      const user = await User.findByIdAndUpdate(userId, { role: 'user' }, { new: true });
      if (!user) {
        return res.status(404).json({ message: 'User  not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error removing access:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  app.post('/api/approve-advertisement/:id', async (req, res) => {
    const requestId = req.params.id;

    try {
        const request = await AdvertisementRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Advertisement request not found.' });
        }

        const newService = new Service({
            serviceName: request.serviceName,
            serviceCategory: request.serviceCategory,
            serviceDescription: request.serviceDescription,
            averagePrice: request.averagePrice,
            providerId: request.providerId,
            address: request.address,
            city: request.city,
            province: request.province,
            latitude: request.latitude,
            longitude: request.longitude
        });

        await newService.save();
        await AdvertisementRequest.deleteOne({ _id: requestId }); res.status(200).json({ message: 'Advertisement request approved and service created successfully!' });
    } catch (error) {
        console.error('Error approving advertisement request:', error);
        res.status(500).json({ message: 'Failed to approve advertisement request.' });
    }
});

app.get('/api/get-services', async (req, res) => {
    const providerId = req.query.providerId; 

    try {
        if (providerId) {
            
            const services = await Service.find({ providerId: providerId })
                .populate('providerId', 'username') 
                .exec()

            res.json(services);
        } else {
            
            const services = await Service.find()
                .populate('providerId', 'username')
                .exec()

            res.json(services);
        }
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ message: 'Failed to fetch services.' });
    }
});

app.get('/api/get-services/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate('providerId', 'username')
            .exec()

        if (!service) {
            return res.status(404).send('Service not found');
        }

        res.json(service); 
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).send('Server error');
    }
});

app.delete('/api/remove-service/:id', async (req, res) => {
    const serviceId = req.params.id;

    try {
        const result = await Service.deleteOne({ _id: serviceId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Service not found.' });
        }
        res.status(200).json({ message: 'Service removed successfully!' });
    } catch (error) {
        console.error('Error removing service:', error);
        res.status(500).json({ message: 'Failed to remove service.' });
    }
});

app.post('/api/submit-rating', async (req, res) => {
    const { serviceId, rating, comment, username } = req.body; 
    
    if (!serviceId || rating === undefined || !comment || !username) {
        return res.status(400).json({ message: 'Service ID, rating, comment, and username are required.' });
    }

    try {
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found.' });
        }
        
        if (service.providerId.equals(req.session.userId)) {
            return res.status(403).json({ message: 'Service providers cannot rate their own services.' });
        }
        
        const existingRatingIndex = service.ratings.findIndex(r => r.userId.equals(req.session.userId));
        if (existingRatingIndex !== -1) {
            
            service.ratings[existingRatingIndex].rating = rating;
            service.ratings[existingRatingIndex].comment = comment;
            service.ratings[existingRatingIndex].username = username;
        } else {
            
            service.ratings.push({ userId: req.session.userId, rating, comment, username });
        }

        const totalRating = service.ratings.reduce((acc, r) => acc + r.rating, 0);
        const averageRating = totalRating / service.ratings.length;
        service.averageRating = averageRating; 

        await service.save(); 
        
        const newComment = {
            serviceId,
            userId: req.session.userId,
            comment,
            rating,
            username
        };

        await Comment.findOneAndUpdate(
            { serviceId, userId: req.session.userId },
            newComment,
            { upsert: true } 
        );

        res.json({ message: 'Rating and comment submitted successfully!', service });
    } catch (error) {
        console.error('Error submitting rating and comment:', error); 
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.get('/api/get-comments', async (req, res) => {
    const { serviceId } = req.query; 

    if (!serviceId) {
        return res.status(400).json({ message: 'Service ID is required' });
    }
    try {
        const comments = await Comment.find({ serviceId })
            .populate('userId', 'username') 
            .exec();

        res.json(comments); 
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/book-service', async (req, res) => {
    const { serviceId, userId, providerId } = req.body;
    
    if (!serviceId || !userId || !providerId) {
        return res.status(400).json({ message: 'Service ID, User ID, and Provider ID are required.' });
    }

    try {
        
        const booking = new Booking({
            serviceId,
            userId,
            providerId,
            status: 'pending' 
        });

        await booking.save(); 

        

        res.status(201).json({ message: 'Booking request submitted successfully!' });
    } catch (error) {
        console.error('Error processing booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/get-bookings', async (req, res) => {
    
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        
        const bookings = await Booking.find({ providerId: req.session.userId })
            .populate('serviceId', 'serviceCategory', 'serviceName') 
            .populate('userId', 'username') 
            .exec();

        res.json(bookings); 
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.patch('/api/approve-booking/:id', async (req, res) => {
    const bookingId = req.params.id;
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        booking.status = 'Approved'; 
        await booking.save();
        res.status(200).json({ message: 'Booking approved successfully' });
    } catch (error) {
        console.error('Error approving booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.delete('/api/remove-booking/:id', async (req, res) => {
    const bookingId = req.params.id;
    try {
        const booking = await Booking.findByIdAndDelete(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.status(200).json({ message: 'Booking removed successfully' });
    } catch (error) {
        console.error('Error removing booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/get-user-bookings', async (req, res) => {
    
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const bookings = await Booking.find({ userId: req.session.userId })
            .populate('serviceId', 'serviceCategory', 'ServiceName') 
            .populate('providerId', 'username') 
            .exec();

        res.json(bookings); 
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/send-message', async (req, res) => {
    const { senderId, receiverId, message } = req.body;

    try {
        const senderUsername = await getUserUsername(senderId);
        const newMessage = new Message({
            senderId,
            receiverId,
            message,
            username: senderUsername
        });
        await newMessage.save();
        res.status(201).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

async function getUserUsername(userId) {
    try {
        const user = await Users.findById(userId, 'username');
        return user.username;
    } catch (error) {
        console.error('Error getting username:', error);
        return null; 
    }
}

app.get('/api/get-messages/:userId', async (req, res) => {
    const userId = req.params.userId; 
    const currentUserId = req.session.userId; 
  
    try {
      
      const messages = await Message.find({
        $or: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId }
        ]
      })
        .sort({ createdAt: 1 }) 
        .exec();

      if (messages.length === 0) {
        
        return res.json({ newChat: true }); 
      } else {
        
        res.json(messages); 
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Internal server error' }); 
    }
  });

router.get('/api/get-messages/:userId', async (req, res) => {
    const userId = req.params.userId; 
    const currentUserId = req.session.userId; 
  
    try {
      
      const messages = await Message.find({
        $or: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId }
        ]
      })
      .select('senderId receiverId message createdAt username') 
      .sort({ createdAt: 1 }) 
      .populate('senderId', 'username') 
      .exec();
  
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

app.use('/api', router);

app.post('/logout', (req, res) => {
    
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
        
        res.clearCookie('users'); 
        res.status(200).json({ message: 'Successfully logged out' }); 
    });
});

app.listen(port,()=>{
    console.log("Server started!")
})


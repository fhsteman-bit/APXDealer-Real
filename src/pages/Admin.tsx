import React, { useState, useEffect, useRef, useMemo } from 'react';
import { auth, db, storage } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth as getSecondaryAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, getDoc, serverTimestamp, onSnapshot, deleteField, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Edit, Trash2, LogOut, Settings, Car as CarIcon, Image as ImageIcon, Upload, X, Users, BarChart3, ShoppingBag, Truck, DollarSign, Megaphone, ShieldCheck, LayoutDashboard, Contact, Save, Instagram } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AIAssistant from '../components/AIAssistant';

export function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWorker, setIsWorker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cars' | 'crm' | 'sales' | 'logistics' | 'financials' | 'marketing' | 'social' | 'settings' | 'users' | 'analytics' | 'ai'>('dashboard');
  const [settingsTab, setSettingsTab] = useState<'general' | 'home' | 'about' | 'services' | 'contact' | 'media'>('general');

  // Cars State
  const [cars, setCars] = useState<any[]>([]);
  const [isEditingCar, setIsEditingCar] = useState(false);
  const [currentCar, setCurrentCar] = useState<any>(null);
  const [carSearchQuery, setCarSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Inquiries State
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquirySearchQuery, setInquirySearchQuery] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<'all' | 'new' | 'read' | 'contacted'>('all');

  // Orders, Shipments, Campaigns State
  const [orders, setOrders] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [newWorkerEmail, setNewWorkerEmail] = useState('');
  const [newWorkerPassword, setNewWorkerPassword] = useState('');
  const [isCreatingWorker, setIsCreatingWorker] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Analytics State
  const [analytics, setAnalytics] = useState<any[]>([]);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Settings State
  const [settings, setSettings] = useState({
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    contactEmail: '',
    contactPhone: '',
    heroTitle: '',
    heroSubtitle: '',
    heroImage: '',
    aboutTitle: '',
    aboutSubtitle: '',
    aboutText: '',
    aboutImage: '',
    showroomImage: '',
    soldCarsImage: '',
    footerDescription: '',
    workingHours: '',
    sourcingText: '',
    howWeWorkText: '',
    servicesTitle: '',
    service1Title: '',
    service1Desc: '',
    service2Title: '',
    service2Desc: '',
    service3Title: '',
    service3Desc: '',
    socialGridImages: [] as string[]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Modal State
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);

  // Feature Modal States
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrder, setNewOrder] = useState({ customerName: '', carId: '', totalAmount: '', profit: '', balanceDue: '', status: 'pending' });

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', carMakeModel: '', message: '', status: 'new' });

  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [newShipment, setNewShipment] = useState({ supplier: '', origin: '', destination: '', eta: 'this_week', status: 'active' });

  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', platform: '', budget: '', status: 'active' });

  const [replyModalOpen, setReplyModalOpen] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const handleSendReply = async (inquiryId: string) => {
    if (!replyMessage.trim()) return;
    try {
      const inquiryRef = doc(db, 'inquiries', inquiryId);
      const inquiryDoc = await getDoc(inquiryRef);
      if (inquiryDoc.exists()) {
        const currentReplies = inquiryDoc.data().replies || [];
        await updateDoc(inquiryRef, {
          replies: [...currentReplies, { message: replyMessage, sentAt: new Date() }],
          status: 'contacted',
          lastContactedAt: serverTimestamp()
        });
        setReplyModalOpen(null);
        setReplyMessage('');
        showAlert('Reply sent successfully.');
      }
    } catch (error) {
      console.error('Error sending reply', error);
      showAlert('Failed to send reply.');
    }
  };

  const [carFormTab, setCarFormTab] = useState<'basic' | 'tech' | 'pricing' | 'media'>('basic');

  const showAlert = (message: string) => setAlertMessage(message);
  const showConfirm = (message: string, onConfirm: () => void) => setConfirmDialog({ message, onConfirm });

  const filteredCars = useMemo(() => {
    if (!carSearchQuery) return cars;
    const query = carSearchQuery.toLowerCase();
    return cars.filter(car => 
      car.make?.toLowerCase().includes(query) || 
      car.model?.toLowerCase().includes(query) || 
      car.year?.toString().includes(query)
    );
  }, [cars, carSearchQuery]);

  const filteredInquiries = useMemo(() => {
    let result = inquiries;
    if (inquiryStatusFilter !== 'all') {
      result = result.filter(inq => inq.status === inquiryStatusFilter || (!inq.status && inquiryStatusFilter === 'new'));
    }
    if (inquirySearchQuery) {
      const query = inquirySearchQuery.toLowerCase();
      result = result.filter(inq => 
        inq.name?.toLowerCase().includes(query) || 
        inq.email?.toLowerCase().includes(query) || 
        inq.carMakeModel?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [inquiries, inquirySearchQuery, inquiryStatusFilter]);

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return users;
    const query = userSearchQuery.toLowerCase();
    return users.filter(u => u.email?.toLowerCase().includes(query));
  }, [users, userSearchQuery]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const newImages = [...(currentCar.images || [])];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Create a unique filename
        const filename = `cars/${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name}`;
        const storageRef = ref(storage, filename);
        
        // Upload the file directly to Firebase Storage
        const snapshot = await uploadBytes(storageRef, file);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        newImages.push(downloadURL);
      }
      setCurrentCar({ ...currentCar, images: newImages });
    } catch (error) {
      console.error("Error uploading image:", error);
      showAlert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'exteriorSound' | 'interiorSound' | 'videoUrl' | 'brochureUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const folder = type === 'videoUrl' ? 'videos' : type === 'brochureUrl' ? 'documents' : 'audio';
      const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name}`;
      const storageRef = ref(storage, filename);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setCurrentCar({ ...currentCar, [type]: downloadURL });
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      showAlert(`Failed to upload file. Please try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setCurrentCar({
      ...currentCar,
      images: currentCar.images.filter((_: any, index: number) => index !== indexToRemove)
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if admin (for UI purposes, real check is in rules)
        // We assume fhsteman@gmail.com is admin
        if (currentUser.email === 'fhsteman@gmail.com') {
          setIsAdmin(true);
          setIsWorker(false);
          fetchData(true);
        } else {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const role = userDoc.data().role;
              if (role === 'admin') {
                setIsAdmin(true);
                setIsWorker(false);
                fetchData(true);
              } else if (role === 'worker') {
                setIsAdmin(false);
                setIsWorker(true);
                fetchData(false);
              } else {
                setIsAdmin(false);
                setIsWorker(false);
              }
            } else {
              setIsAdmin(false);
              setIsWorker(false);
            }
          } catch (e) {
            setIsAdmin(false);
            setIsWorker(false);
          }
        }
      } else {
        setIsAdmin(false);
        setIsWorker(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchData = (fetchAdminData: boolean) => {
    // Fetch Cars
    const unsubscribeCars = onSnapshot(collection(db, 'cars'), (snapshot) => {
      const carsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCars(carsData);
    });

    // Fetch Inquiries
    const unsubscribeInquiries = onSnapshot(collection(db, 'inquiries'), (snapshot) => {
      const inquiriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInquiries(inquiriesData.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    });

    // Fetch Orders
    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
    });

    // Fetch Shipments
    const unsubscribeShipments = onSnapshot(collection(db, 'shipments'), (snapshot) => {
      const shipmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShipments(shipmentsData);
    });

    // Fetch Campaigns
    const unsubscribeCampaigns = onSnapshot(collection(db, 'campaigns'), (snapshot) => {
      const campaignsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaigns(campaignsData);
    });

    let unsubscribeSettings = () => {};
    let unsubscribeUsers = () => {};
    let unsubscribeAnalytics = () => {};

    if (fetchAdminData) {
      // Fetch Settings
      unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      });

      // Fetch Users
      unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
      });

      // Fetch Analytics
      unsubscribeAnalytics = onSnapshot(collection(db, 'analytics'), (snapshot) => {
        const analyticsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAnalytics(analyticsData.sort((a: any, b: any) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0)));
      });
    }

    return () => {
      unsubscribeCars();
      unsubscribeInquiries();
      unsubscribeSettings();
      unsubscribeUsers();
      unsubscribeAnalytics();
    };
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      let result;
      try {
        result = await signInWithEmailAndPassword(auth, email, password);
      } catch (signInError: any) {
        // Auto-create the requested admin account if it doesn't exist yet
        if (email.toLowerCase() === 'fhsteman@gmail.com' && password === '!!APXDealer10!!') {
          try {
            result = await createUserWithEmailAndPassword(auth, email, password);
          } catch (createError: any) {
            if (createError.code === 'auth/email-already-in-use') {
              throw signInError; // It exists, so the password was just wrong
            }
            throw createError;
          }
        } else {
          throw signInError;
        }
      }
      
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document
        await setDoc(userDocRef, {
          email: user.email,
          role: user.email.toLowerCase() === 'fhsteman@gmail.com' ? 'admin' : 'user',
          createdAt: serverTimestamp()
        });
      }
    } catch (error: any) {
      console.error('Authentication failed', error);
      if (error.code === 'auth/operation-not-allowed') {
        setAuthError('Email/Password sign-in is disabled. Please enable it in the Firebase Console -> Authentication -> Sign-in method.');
      } else {
        setAuthError(error.message || 'Authentication failed. Please check your credentials.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          role: user.email?.toLowerCase() === 'fhsteman@gmail.com' ? 'admin' : 'user',
          createdAt: serverTimestamp()
        });
      }
    } catch (error: any) {
      console.error('Google Sign-In failed', error);
      setAuthError(error.message || 'Google Sign-In failed.');
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), settings, { merge: true });
      showAlert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings', error);
      showAlert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const carData: any = {
        ...currentCar,
        year: parseInt(currentCar.year),
        countryPrices: currentCar.countryPrices || {},
        countryCosts: currentCar.countryCosts || {},
        images: currentCar.images ? (typeof currentCar.images === 'string' ? currentCar.images.split(',').map((s: string) => s.trim()) : currentCar.images) : [],
        isFeatured: currentCar.isFeatured || false,
        status: currentCar.status || 'Available',
      };
      
      delete carData.price;
      delete carData.priceEur;
      delete carData.currency;
      delete carData.engine;
      delete carData.id;

      if (currentCar.id) {
        // Explicitly delete deprecated fields from Firestore document
        carData.price = deleteField();
        carData.priceEur = deleteField();
        carData.currency = deleteField();
        carData.engine = deleteField();
        await updateDoc(doc(db, 'cars', currentCar.id), carData);
      } else {
        const newDocRef = doc(collection(db, 'cars'));
        await setDoc(newDocRef, { ...carData, createdAt: serverTimestamp() });
      }
      setIsEditingCar(false);
      setCurrentCar(null);
    } catch (error) {
      console.error('Error saving car', error);
      showAlert('Failed to save car.');
    }
  };

  const handleSeedCars = async () => {
    const seedCars = [
      {
        make: 'Porsche', model: '911 GT3 RS', year: 2024, condition: 'New', status: 'Available',
        engineType: '4.0L Flat-6', horsepower: '518 hp', performance: '3.0s', transmission: '7-speed PDK',
        mileage: '150 km', driversSeat: 'LHD', exteriorColor: 'Guards Red', interiorColor: 'Black Race-Tex',
        costPrice: 220000, countryPrices: { Global: 280000, 'United Kingdom': 240000 },
        description: 'Track-focused street legal monster with DRS.',
        images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=2000'],
        isFeatured: true
      },
      {
        make: 'Ferrari', model: 'F8 Tributo', year: 2023, condition: 'Showroom', status: 'Available',
        engineType: '3.9L Twin-Turbo V8', horsepower: '710 hp', performance: '2.9s', transmission: '7-speed Dual-Clutch',
        mileage: '1,200 km', driversSeat: 'LHD', exteriorColor: 'Rosso Corsa', interiorColor: 'Nero',
        costPrice: 280000, countryPrices: { Global: 350000, 'United Arab Emirates': 340000 },
        description: 'A celebration of excellence and an homage to the most powerful Ferrari V8 engine ever.',
        images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=2000'],
        isFeatured: true
      },
      {
        make: 'Lamborghini', model: 'Huracan STO', year: 2023, condition: 'Used', status: 'Available',
        engineType: '5.2L V10', horsepower: '631 hp', performance: '3.0s', transmission: '7-speed LDF',
        mileage: '4,500 km', driversSeat: 'LHD', exteriorColor: 'Blu Laufey', interiorColor: 'Nero Cosmus',
        costPrice: 300000, countryPrices: { Global: 380000, 'United States': 390000 },
        description: 'Super Trofeo Omologata. A street-legal race car.',
        images: ['https://images.unsplash.com/photo-1662691316776-92823a0d5c80?auto=format&fit=crop&q=80&w=2000'],
        isFeatured: false
      },
      {
        make: 'McLaren', model: '765LT', year: 2022, condition: 'Used', status: 'Available',
        engineType: '4.0L Twin-Turbo V8', horsepower: '755 hp', performance: '2.7s', transmission: '7-speed SSG',
        mileage: '2,100 km', driversSeat: 'RHD', exteriorColor: 'Nardo Orange', interiorColor: 'Carbon Black',
        costPrice: 320000, countryPrices: { Global: 400000, 'United Kingdom': 380000 },
        description: 'Lighter, more powerful, and with even higher levels of performance on both road and track.',
        images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&q=80&w=2000'],
        isFeatured: true
      },
      {
        make: 'Aston Martin', model: 'DBS Superleggera', year: 2023, condition: 'Showroom', status: 'Available',
        engineType: '5.2L Twin-Turbo V12', horsepower: '715 hp', performance: '3.4s', transmission: '8-speed Automatic',
        mileage: '500 km', driversSeat: 'LHD', exteriorColor: 'Magnetic Silver', interiorColor: 'Obsidian Black',
        costPrice: 250000, countryPrices: { Global: 310000, 'Germany': 305000 },
        description: 'The ultimate production Aston Martin.',
        images: ['https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=2000'],
        isFeatured: false
      },
      {
        make: 'Rolls-Royce', model: 'Cullinan', year: 2024, condition: 'New', status: 'Available',
        engineType: '6.75L Twin-Turbo V12', horsepower: '563 hp', performance: '5.0s', transmission: '8-speed Automatic',
        mileage: '50 km', driversSeat: 'LHD', exteriorColor: 'Arctic White', interiorColor: 'Mandarin',
        costPrice: 350000, countryPrices: { Global: 450000, 'United Arab Emirates': 460000 },
        description: 'Supreme liberty. The first all-terrain SUV from Rolls-Royce makes luxury off-road travel a reality.',
        images: ['https://images.unsplash.com/photo-1633605268482-1e9b25206259?auto=format&fit=crop&q=80&w=2000'],
        isFeatured: true
      },
      {
        make: 'Bentley', model: 'Continental GT Speed', year: 2023, condition: 'Used', status: 'Available',
        engineType: '6.0L Twin-Turbo W12', horsepower: '650 hp', performance: '3.5s', transmission: '8-speed Dual-Clutch',
        mileage: '8,000 km', driversSeat: 'LHD', exteriorColor: 'Beluga Black', interiorColor: 'Hotspur',
        costPrice: 200000, countryPrices: { Global: 260000, 'France': 265000 },
        description: 'The most dynamic road car in Bentley’s history.',
        images: ['https://images.unsplash.com/photo-1622185135505-2d795003994a?auto=format&fit=crop&q=80&w=2000'],
        isFeatured: false
      },
      {
        make: 'Mercedes-Benz', model: 'G63 AMG', year: 2024, condition: 'New', status: 'Available',
        engineType: '4.0L Twin-Turbo V8', horsepower: '577 hp', performance: '4.5s', transmission: '9-speed Automatic',
        mileage: '100 km', driversSeat: 'LHD', exteriorColor: 'G Manufaktur Olive Metallic', interiorColor: 'Tartufo Brown',
        costPrice: 160000, countryPrices: { Global: 220000, 'Germany': 210000 },
        description: 'The iconic G-Wagon. Unmistakable design meets AMG performance.',
        images: ['https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&q=80&w=2000'],
        isFeatured: true
      },
      {
        make: 'Audi', model: 'R8 V10 Performance', year: 2023, condition: 'Showroom', status: 'Available',
        engineType: '5.2L V10', horsepower: '602 hp', performance: '3.2s', transmission: '7-speed S tronic',
        mileage: '300 km', driversSeat: 'LHD', exteriorColor: 'Kemora Gray', interiorColor: 'Black with Red Stitching',
        costPrice: 150000, countryPrices: { Global: 200000, 'United States': 195000 },
        description: 'The everyday supercar. Naturally aspirated V10 symphony.',
        images: ['https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=2000'],
        isFeatured: false
      },
      {
        make: 'BMW', model: 'M5 CS', year: 2022, condition: 'Used', status: 'Available',
        engineType: '4.4L Twin-Turbo V8', horsepower: '627 hp', performance: '2.9s', transmission: '8-speed Automatic',
        mileage: '12,000 km', driversSeat: 'LHD', exteriorColor: 'Frozen Deep Green Metallic', interiorColor: 'Black with Mugello Red',
        costPrice: 130000, countryPrices: { Global: 175000, 'United Kingdom': 170000 },
        description: 'The most powerful and fastest production BMW ever made.',
        images: ['https://images.unsplash.com/photo-1555353540-64fd1b19584d?auto=format&fit=crop&q=80&w=2000'],
        isFeatured: false
      }
    ];

    showConfirm('Are you sure you want to add 10 test cars to the inventory?', async () => {
      try {
        for (const car of seedCars) {
          await addDoc(collection(db, 'cars'), {
            ...car,
            createdAt: serverTimestamp()
          });
        }
        showAlert('Successfully added 10 test cars!');
      } catch (error) {
        console.error('Error seeding cars:', error);
        showAlert('Failed to seed cars.');
      }
    });
  };

  const handleDeleteCar = async (id: string) => {
    showConfirm('Are you sure you want to delete this car?', async () => {
      try {
        await deleteDoc(doc(db, 'cars', id));
      } catch (error) {
        console.error('Error deleting car', error);
        showAlert('Failed to delete car.');
      }
    });
  };

  const handleMarkAsSold = async (id: string) => {
    showConfirm('Are you sure you want to mark this car as Sold? It will appear in the Recently Sold section.', async () => {
      try {
        await updateDoc(doc(db, 'cars', id), { status: 'Sold' });
      } catch (error) {
        console.error('Error marking car as sold', error);
        showAlert('Failed to update car status.');
      }
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'orders'), { ...newOrder, createdAt: serverTimestamp() });
      setShowOrderModal(false);
      setNewOrder({ customerName: '', carId: '', totalAmount: '', profit: '', balanceDue: '', status: 'pending' });
      showAlert('Order created successfully.');
    } catch (error) {
      console.error('Error creating order', error);
      showAlert('Failed to create order.');
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'inquiries'), { ...newLead, createdAt: serverTimestamp() });
      setShowLeadModal(false);
      setNewLead({ name: '', email: '', phone: '', carMakeModel: '', message: '', status: 'new' });
      showAlert('Lead created successfully.');
    } catch (error) {
      console.error('Error creating lead', error);
      showAlert('Failed to create lead.');
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'shipments'), { ...newShipment, createdAt: serverTimestamp() });
      setShowShipmentModal(false);
      setNewShipment({ supplier: '', origin: '', destination: '', eta: 'this_week', status: 'active' });
      showAlert('Shipment added successfully.');
    } catch (error) {
      console.error('Error adding shipment', error);
      showAlert('Failed to add shipment.');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'campaigns'), { ...newCampaign, createdAt: serverTimestamp() });
      setShowCampaignModal(false);
      setNewCampaign({ name: '', platform: '', budget: '', status: 'active' });
      showAlert('Campaign created successfully.');
    } catch (error) {
      console.error('Error creating campaign', error);
      showAlert('Failed to create campaign.');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    setConfirmDialog({
      message: 'Are you sure you want to delete this order?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'orders', id));
          showAlert('Order deleted successfully.');
        } catch (error) {
          console.error('Error deleting order', error);
          showAlert('Failed to delete order.');
        }
      }
    });
  };

  const handleDeleteShipment = async (id: string) => {
    setConfirmDialog({
      message: 'Are you sure you want to delete this shipment?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'shipments', id));
          showAlert('Shipment deleted successfully.');
        } catch (error) {
          console.error('Error deleting shipment', error);
          showAlert('Failed to delete shipment.');
        }
      }
    });
  };

  const handleDeleteCampaign = async (id: string) => {
    setConfirmDialog({
      message: 'Are you sure you want to delete this campaign?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'campaigns', id));
          showAlert('Campaign deleted successfully.');
        } catch (error) {
          console.error('Error deleting campaign', error);
          showAlert('Failed to delete campaign.');
        }
      }
    });
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      showAlert('User role updated successfully.');
    } catch (error) {
      console.error('Error updating user role', error);
      showAlert('Failed to update user role.');
    }
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerEmail || !newWorkerPassword) {
      showAlert('Please provide both email and password.');
      return;
    }
    setIsCreatingWorker(true);
    try {
      // Create a secondary Firebase app instance to create a user without logging out the current admin
      const secondaryApp = getApps().find(app => app.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
      const secondaryAuth = getSecondaryAuth(secondaryApp);
      
      const result = await createUserWithEmailAndPassword(secondaryAuth, newWorkerEmail, newWorkerPassword);
      
      // Create the user document with 'worker' role
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        role: 'worker',
        createdAt: serverTimestamp()
      });
      
      // Sign out the secondary auth
      await signOut(secondaryAuth);
      
      setNewWorkerEmail('');
      setNewWorkerPassword('');
      showAlert('Worker account created successfully.');
    } catch (error: any) {
      console.error('Error creating worker', error);
      showAlert(error.message || 'Failed to create worker account.');
    } finally {
      setIsCreatingWorker(false);
    }
  };

  const analyticsData = useMemo(() => {
    // Device Data
    const deviceCounts = analytics.reduce((acc, curr) => {
      const device = curr.device || 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const deviceChartData = Object.keys(deviceCounts).map(key => ({ name: key, value: deviceCounts[key] }));

    // Page Views Data
    const pageCounts = analytics.reduce((acc, curr) => {
      const page = curr.page || 'Unknown';
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const pageChartData = Object.keys(pageCounts)
      .map(key => ({ name: key, views: pageCounts[key] }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10); // Top 10 pages

    // Time Series Data (last 7 days)
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();

    const timeSeriesCounts = analytics.reduce((acc, curr) => {
      if (!curr.timestamp) return acc;
      const date = curr.timestamp.toDate ? curr.timestamp.toDate() : new Date(curr.timestamp);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (last7Days.includes(dateStr)) {
        acc[dateStr] = (acc[dateStr] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const timeSeriesData = last7Days.map(date => ({
      date,
      visits: timeSeriesCounts[date] || 0
    }));

    return { deviceChartData, pageChartData, timeSeriesData };
  }, [analytics]);

  const COLORS = ['#ffffff', '#a3a3a3', '#525252', '#262626'];

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="bg-[#111] border border-white/10 p-12 max-w-md w-full text-center">
          <h1 className="text-2xl font-light tracking-[0.2em] text-white uppercase mb-8">
            Admin Login
          </h1>
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors"
                required
              />
            </div>
            {authError && (
              <div className="text-red-500 text-sm mt-2">{authError}</div>
            )}
            <button 
              type="submit"
              className="w-full py-4 bg-white text-black text-xs font-medium tracking-[0.2em] uppercase hover:bg-gray-200 transition-colors"
            >
              Sign In
            </button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#111] px-2 text-gray-400 tracking-[0.1em] uppercase">Or</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-4 bg-transparent border border-white/20 text-white text-xs font-medium tracking-[0.2em] uppercase hover:bg-white/5 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isWorker) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <div className="bg-[#111] border border-white/10 p-12 max-w-md w-full text-center">
          <h1 className="text-xl font-light tracking-[0.2em] text-white uppercase mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-8">You do not have permission to access this area.</p>
          <button 
            onClick={handleLogout}
            className="w-full py-4 border border-white/20 text-white text-xs font-medium tracking-[0.2em] uppercase hover:bg-white/5 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
          <h1 className="text-3xl font-light tracking-[0.2em] uppercase">Control Center</h1>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-400">{user.email}</span>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <LogOut size={16} />
              <span className="text-xs tracking-widest uppercase">Logout</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-6 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-8 scrollbar-hide">
            
            {/* Overview Group */}
            <div className="space-y-1">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3 px-6">Overview</h3>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${activeTab === 'dashboard' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${activeTab === 'analytics' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <BarChart3 size={16} />
                  Analytics
                </button>
              )}
            </div>

            {/* Business Operations Group */}
            <div className="space-y-1">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3 px-6">Operations</h3>
              <button 
                onClick={() => setActiveTab('cars')}
                className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${activeTab === 'cars' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <CarIcon size={16} />
                Inventory
              </button>
              <button 
                onClick={() => setActiveTab('sales')}
                className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${activeTab === 'sales' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <ShoppingBag size={16} />
                Orders & Sales
              </button>
              <button 
                onClick={() => setActiveTab('crm')}
                className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${activeTab === 'crm' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Contact size={16} />
                CRM & Leads
              </button>
            </div>

            {/* Management Group */}
            <div className="space-y-1">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3 px-6">Management</h3>
              <button 
                onClick={() => setActiveTab('logistics')}
                className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${activeTab === 'logistics' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Truck size={16} />
                Logistics
              </button>
              <button 
                onClick={() => setActiveTab('financials')}
                className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${activeTab === 'financials' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <DollarSign size={16} />
                Financials
              </button>
              <button 
                onClick={() => setActiveTab('marketing')}
                className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${activeTab === 'marketing' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Megaphone size={16} />
                Marketing
              </button>
              <button 
                onClick={() => setActiveTab('social')}
                className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${activeTab === 'social' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Instagram size={16} />
                Social Media
              </button>
            </div>

            {/* System Group */}
            {isAdmin && (
              <div className="space-y-1">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3 px-6">System</h3>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${activeTab === 'settings' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <Settings size={16} />
                  Site Content
                </button>
                <button 
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${activeTab === 'users' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <ShieldCheck size={16} />
                  Users & Roles
                </button>
                <button 
                  onClick={() => setActiveTab('ai')}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${activeTab === 'ai' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  AI Assistant
                </button>
                <a 
                  href="/calculator"
                  target="_blank"
                  className="w-full flex items-center gap-3 px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  Edit Calculator
                </a>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-[#111] border border-white/10 p-8">
            
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-xl font-light tracking-[0.1em] uppercase mb-8">Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-black border border-white/10 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setActiveTab('cars')}>
                    <CarIcon size={24} className="text-gray-400 mb-4" />
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-500 mb-2">Total Inventory</h3>
                    <p className="text-4xl font-light">{cars.length}</p>
                    <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">{cars.filter(c => c.status === 'Available').length} Available</p>
                  </div>
                  <div className="bg-black border border-white/10 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setActiveTab('crm')}>
                    <svg className="w-6 h-6 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-500 mb-2">New Leads</h3>
                    <p className="text-4xl font-light">{inquiries.filter(i => i.status !== 'read' && i.status !== 'contacted').length}</p>
                    <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">Awaiting Response</p>
                  </div>
                  <div className="bg-black border border-white/10 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setActiveTab('sales')}>
                    <ShoppingBag size={24} className="text-gray-400 mb-4" />
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-500 mb-2">Pending Orders</h3>
                    <p className="text-4xl font-light">{orders.filter(o => o.status === 'pending').length}</p>
                    <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">Requires Processing</p>
                  </div>
                  <div className="bg-black border border-white/10 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setActiveTab('logistics')}>
                    <Truck size={24} className="text-gray-400 mb-4" />
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-500 mb-2">Active Shipments</h3>
                    <p className="text-4xl font-light">{shipments.filter(s => s.status === 'active').length}</p>
                    <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">In Transit</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Inquiries */}
                  <div className="bg-black border border-white/10 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400">Recent Inquiries</h3>
                      <button onClick={() => setActiveTab('inquiries')} className="text-xs tracking-widest uppercase text-white hover:text-gray-300 transition-colors">View All</button>
                    </div>
                    <div className="space-y-4">
                      {inquiries.slice(0, 5).map(inquiry => (
                        <div key={inquiry.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium">{inquiry.name}</span>
                            <span className="text-xs text-gray-500">{inquiry.createdAt?.toDate ? inquiry.createdAt.toDate().toLocaleDateString() : 'Recent'}</span>
                          </div>
                          <p className="text-xs text-gray-400 truncate">{inquiry.message}</p>
                        </div>
                      ))}
                      {inquiries.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No recent inquiries.</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-black border border-white/10 p-6">
                    <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 mb-6">Quick Actions</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => {
                          setActiveTab('cars');
                          setIsEditingCar(true);
                          setCurrentCar({ status: 'Available', isFeatured: false });
                        }}
                        className="w-full flex items-center justify-between p-4 border border-white/10 hover:bg-white/5 transition-colors group"
                      >
                        <span className="text-sm tracking-widest uppercase">Add New Car</span>
                        <Plus size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                      </button>
                      <button 
                        onClick={() => {
                          setActiveTab('sales');
                          setShowOrderModal(true);
                        }}
                        className="w-full flex items-center justify-between p-4 border border-white/10 hover:bg-white/5 transition-colors group"
                      >
                        <span className="text-sm tracking-widest uppercase">Create New Order</span>
                        <ShoppingBag size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            setActiveTab('settings');
                            setSettingsTab('home');
                          }}
                          className="w-full flex items-center justify-between p-4 border border-white/10 hover:bg-white/5 transition-colors group"
                        >
                          <span className="text-sm tracking-widest uppercase">Update Site Content</span>
                          <Settings size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cars Tab */}
            {activeTab === 'cars' && (
              <div>
                {!isEditingCar ? (
                  <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                      <h2 className="text-xl font-light tracking-[0.1em] uppercase">Manage Inventory</h2>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <input 
                          type="text" 
                          placeholder="Search make, model, year..." 
                          value={carSearchQuery}
                          onChange={(e) => setCarSearchQuery(e.target.value)}
                          className="bg-black border border-white/20 p-2 text-white text-sm focus:border-white outline-none w-full md:w-64"
                        />
                        <button 
                          onClick={handleSeedCars}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-xs font-medium tracking-[0.1em] uppercase hover:bg-gray-700 transition-colors whitespace-nowrap"
                        >
                          Seed 10 Cars
                        </button>
                        <button 
                          onClick={() => {
                            setCurrentCar({ status: 'Available', isFeatured: false });
                            setIsEditingCar(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-medium tracking-[0.1em] uppercase hover:bg-gray-200 transition-colors whitespace-nowrap"
                        >
                          <Plus size={14} />
                          Add Car
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-xs tracking-[0.1em] text-gray-500 uppercase">
                            <th className="pb-4 font-medium">Make & Model</th>
                            <th className="pb-4 font-medium">Year</th>
                            <th className="pb-4 font-medium">Price</th>
                            <th className="pb-4 font-medium">Status</th>
                            <th className="pb-4 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCars.map(car => (
                            <tr key={car.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-4 text-sm">{car.make} {car.model}</td>
                              <td className="py-4 text-sm text-gray-400">{car.year}</td>
                              <td className="py-4 text-sm text-gray-400">{car.countryPrices?.['Global'] ? `€${car.countryPrices['Global'].toLocaleString()}` : 'Price on Request'}</td>
                              <td className="py-4 text-sm">
                                <span className={`px-2 py-1 text-[10px] tracking-wider uppercase ${car.status === 'Available' ? 'bg-green-500/20 text-green-400' : car.status === 'Sold' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                  {car.status}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                {car.status !== 'Sold' && (
                                  <button 
                                    onClick={() => handleMarkAsSold(car.id)} 
                                    className="p-2 text-gray-400 hover:text-green-400 transition-colors inline-block mr-2"
                                    title="Mark as Sold"
                                  >
                                    <span className="text-[10px] font-bold tracking-wider uppercase border border-current px-2 py-1">Sold</span>
                                  </button>
                                )}
                                <button onClick={() => { setCurrentCar(car); setIsEditingCar(true); }} className="p-2 text-gray-400 hover:text-white transition-colors inline-block" title="Edit">
                                  <Edit size={16} />
                                </button>
                                <button onClick={() => handleDeleteCar(car.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors inline-block ml-2" title="Delete">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {cars.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">No cars found in inventory.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-xl font-light tracking-[0.1em] uppercase">{currentCar.id ? 'Edit Car' : 'Add New Car'}</h2>
                      <button 
                        onClick={() => { setIsEditingCar(false); setCurrentCar(null); }}
                        className="text-xs tracking-[0.1em] text-gray-400 hover:text-white uppercase transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    <form onSubmit={handleSaveCar} className="space-y-8">
                      
                      {/* Tabs Navigation */}
                      <div className="flex border-b border-white/10 mb-6">
                        <button
                          type="button"
                          onClick={() => setCarFormTab('basic')}
                          className={`px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${carFormTab === 'basic' ? 'border-b-2 border-white text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          Basic Info
                        </button>
                        <button
                          type="button"
                          onClick={() => setCarFormTab('tech')}
                          className={`px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${carFormTab === 'tech' ? 'border-b-2 border-white text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          Tech Specs
                        </button>
                        <button
                          type="button"
                          onClick={() => setCarFormTab('pricing')}
                          className={`px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${carFormTab === 'pricing' ? 'border-b-2 border-white text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          Pricing
                        </button>
                        <button
                          type="button"
                          onClick={() => setCarFormTab('media')}
                          className={`px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${carFormTab === 'media' ? 'border-b-2 border-white text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          Media
                        </button>
                      </div>

                      {/* Basic Information */}
                      {carFormTab === 'basic' && (
                        <div className="bg-[#1a1a1a] p-6 border border-white/5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Make *</label>
                              <input required type="text" value={currentCar.make || ''} onChange={e => setCurrentCar({...currentCar, make: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" />
                            </div>
                            <div>
                              <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Model *</label>
                              <input required type="text" value={currentCar.model || ''} onChange={e => setCurrentCar({...currentCar, model: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" />
                            </div>
                            <div>
                              <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Year *</label>
                              <input required type="number" value={currentCar.year || ''} onChange={e => setCurrentCar({...currentCar, year: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" />
                            </div>
                            <div>
                              <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">VIN</label>
                              <input type="text" value={currentCar.vin || ''} onChange={e => setCurrentCar({...currentCar, vin: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" placeholder="Vehicle Identification Number" />
                            </div>
                            <div>
                              <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Condition</label>
                              <select value={currentCar.condition || 'New'} onChange={e => setCurrentCar({...currentCar, condition: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors">
                                <option value="New">New</option>
                                <option value="Used">Used</option>
                                <option value="Imported">Imported</option>
                                <option value="Showroom">Showroom</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Status</label>
                              <select value={currentCar.status || 'Available'} onChange={e => setCurrentCar({...currentCar, status: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors">
                                <option value="Available">Available</option>
                                <option value="Reserved">Reserved</option>
                                <option value="Sold">Sold</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Technical Specifications */}
                      {carFormTab === 'tech' && (
                        <div className="bg-[#1a1a1a] p-6 border border-white/5">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Engine Type</label>
                            <input type="text" value={currentCar.engineType || ''} onChange={e => setCurrentCar({...currentCar, engineType: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" placeholder="e.g. 4.0L V8 Twin-Turbo" />
                          </div>
                          <div>
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Horsepower</label>
                            <input type="text" value={currentCar.horsepower || ''} onChange={e => setCurrentCar({...currentCar, horsepower: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" placeholder="e.g. 710 hp" />
                          </div>
                          <div>
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Performance (0-100 km/h)</label>
                            <input type="text" value={currentCar.performance || ''} onChange={e => setCurrentCar({...currentCar, performance: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" placeholder="e.g. 2.9s" />
                          </div>
                          <div>
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Transmission</label>
                            <input type="text" value={currentCar.transmission || ''} onChange={e => setCurrentCar({...currentCar, transmission: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" />
                          </div>
                          <div>
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Mileage</label>
                            <input type="text" value={currentCar.mileage || ''} onChange={e => setCurrentCar({...currentCar, mileage: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" placeholder="e.g. 15,000 km" />
                          </div>
                          <div>
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Driver's Seat</label>
                            <input type="text" value={currentCar.driversSeat || ''} onChange={e => setCurrentCar({...currentCar, driversSeat: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" />
                          </div>
                          <div>
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Exterior Color</label>
                            <input type="text" value={currentCar.exteriorColor || ''} onChange={e => setCurrentCar({...currentCar, exteriorColor: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" />
                          </div>
                          <div>
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Interior Color</label>
                            <input type="text" value={currentCar.interiorColor || ''} onChange={e => setCurrentCar({...currentCar, interiorColor: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" />
                          </div>
                        </div>
                      </div>
                      )}
                      {/* Pricing Tab */}
                      {carFormTab === 'pricing' && (
                        <div className="space-y-8">
                          <div className="bg-[#1a1a1a] p-6 border border-white/5">
                            <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-white mb-6 border-b border-white/10 pb-4">Regional Pricing & Costs</h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-white/10">
                                    <th className="py-3 px-4 text-xs font-medium tracking-[0.1em] text-gray-400 uppercase">Region</th>
                                    <th className="py-3 px-4 text-xs font-medium tracking-[0.1em] text-gray-400 uppercase">Cost Price (€)</th>
                                    <th className="py-3 px-4 text-xs font-medium tracking-[0.1em] text-gray-400 uppercase">Selling Price (€)</th>
                                    <th className="py-3 px-4 text-xs font-medium tracking-[0.1em] text-gray-400 uppercase">Margin (%)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {['Global', 'United Kingdom', 'United States', 'Germany', 'France', 'United Arab Emirates'].map(country => {
                                    const cost = currentCar.countryCosts?.[country] || currentCar.costPrice || 0;
                                    const price = currentCar.countryPrices?.[country] || 0;
                                    const margin = cost && price ? (((price - cost) / cost) * 100).toFixed(1) : '-';
                                    
                                    return (
                                      <tr key={country} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-4 text-sm text-white">{country}</td>
                                        <td className="py-4 px-4">
                                          <input
                                            type="number"
                                            value={currentCar.countryCosts?.[country] || (country === 'Global' ? currentCar.costPrice : '') || ''}
                                            onChange={e => {
                                              const val = e.target.value;
                                              if (country === 'Global') {
                                                setCurrentCar({ ...currentCar, costPrice: Number(val) });
                                              } else {
                                                const newCountryCosts = { ...(currentCar.countryCosts || {}) };
                                                if (val) {
                                                  newCountryCosts[country] = Number(val);
                                                } else {
                                                  delete newCountryCosts[country];
                                                }
                                                setCurrentCar({ ...currentCar, countryCosts: newCountryCosts });
                                              }
                                            }}
                                            className="w-full bg-black border border-white/20 p-2 text-white focus:border-white outline-none transition-colors text-sm"
                                            placeholder={country === 'Global' ? 'Default Cost' : 'Cost'}
                                          />
                                        </td>
                                        <td className="py-4 px-4">
                                          <input
                                            type="number"
                                            value={currentCar.countryPrices?.[country] || ''}
                                            onChange={e => {
                                              const val = e.target.value;
                                              const newCountryPrices = { ...(currentCar.countryPrices || {}) };
                                              if (val) {
                                                newCountryPrices[country] = Number(val);
                                              } else {
                                                delete newCountryPrices[country];
                                              }
                                              setCurrentCar({ ...currentCar, countryPrices: newCountryPrices });
                                            }}
                                            className="w-full bg-black border border-white/20 p-2 text-white focus:border-white outline-none transition-colors text-sm"
                                            placeholder={country === 'Global' ? 'Default Price' : 'Price'}
                                          />
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-400">
                                          {margin !== '-' ? `${margin}%` : '-'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#1a1a1a] border border-white/5 p-6">
                              <h4 className="text-xs font-medium tracking-[0.1em] text-white uppercase mb-4 border-b border-white/10 pb-2">Import Details</h4>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Supplier Info</label>
                                  <input type="text" value={currentCar.supplierInfo || ''} onChange={e => setCurrentCar({...currentCar, supplierInfo: e.target.value})} className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-white outline-none transition-colors" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Import Date</label>
                                  <input type="date" value={currentCar.importDate || ''} onChange={e => setCurrentCar({...currentCar, importDate: e.target.value})} className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-white outline-none transition-colors" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Customs Status</label>
                                  <select value={currentCar.customsStatus || 'Pending'} onChange={e => setCurrentCar({...currentCar, customsStatus: e.target.value})} className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-white outline-none transition-colors appearance-none">
                                    <option value="Pending">Pending</option>
                                    <option value="Cleared">Cleared</option>
                                    <option value="In Transit">In Transit</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                            <div className="bg-[#1a1a1a] border border-white/5 p-6">
                              <h4 className="text-xs font-medium tracking-[0.1em] text-white uppercase mb-4 border-b border-white/10 pb-2">Stock Levels & Location</h4>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Facility / Location</label>
                                  <select value={currentCar.location || 'Showroom'} onChange={e => setCurrentCar({...currentCar, location: e.target.value})} className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-white outline-none transition-colors appearance-none">
                                    <option value="Showroom">Showroom</option>
                                    <option value="Warehouse">Warehouse (Storage)</option>
                                    <option value="In Transit">In Transit</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Country</label>
                                  <input type="text" value={currentCar.locationCountry || ''} onChange={e => setCurrentCar({...currentCar, locationCountry: e.target.value})} className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-white outline-none transition-colors" placeholder="e.g. UK, Germany, UAE" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Transit Status</label>
                                  <select value={currentCar.transitStatus || 'in_stock'} onChange={e => setCurrentCar({...currentCar, transitStatus: e.target.value})} className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-white outline-none transition-colors appearance-none">
                                    <option value="in_stock">In Stock</option>
                                    <option value="needs_transport">Needs Transport</option>
                                    <option value="in_transit">In Transit</option>
                                  </select>
                                </div>
                                {(currentCar.transitStatus === 'needs_transport' || currentCar.transitStatus === 'in_transit') && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">Origin Country</label>
                                      <input type="text" value={currentCar.transitOrigin || ''} onChange={e => setCurrentCar({...currentCar, transitOrigin: e.target.value})} className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-white outline-none transition-colors" placeholder="From..." />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-500 mb-1">Destination Country</label>
                                      <input type="text" value={currentCar.transitDestination || ''} onChange={e => setCurrentCar({...currentCar, transitDestination: e.target.value})} className="w-full bg-black border border-white/20 p-2 text-white text-sm focus:border-white outline-none transition-colors" placeholder="To..." />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Media & Description Tab */}
                      {carFormTab === 'media' && (
                        <div className="bg-[#1a1a1a] p-6 border border-white/5">
                          <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-white mb-6 border-b border-white/10 pb-4">Media & Description</h3>
                          <div className="space-y-6">
                            <div>
                              <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Description</label>
                              <textarea value={currentCar.description || ''} onChange={e => setCurrentCar({...currentCar, description: e.target.value})} rows={4} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"></textarea>
                            </div>
                            <div>
                              <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Images</label>
                              <div className="space-y-4">
                                <div className="flex flex-wrap gap-4 mb-4">
                                  {Array.isArray(currentCar.images) && currentCar.images.map((img: string, index: number) => (
                                    <div key={index} className="relative w-24 h-24 bg-[#1a1a1a] border border-white/10 group">
                                      <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                      <button 
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-black/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-500"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                  <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-24 h-24 border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isUploading ? (
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mb-2"></div>
                                    ) : (
                                      <Upload size={20} className="mb-2" />
                                    )}
                                    <span className="text-[10px] uppercase tracking-wider">
                                      {isUploading ? 'Uploading...' : 'Upload'}
                                    </span>
                                  </button>
                                  <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    multiple 
                                    accept="image/*" 
                                    className="hidden" 
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    id="imageUrlInput"
                                    className="flex-1 bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors text-xs" 
                                    placeholder="Or paste image URL here"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.currentTarget;
                                        if (input.value.trim()) {
                                          setCurrentCar({...currentCar, images: [...(Array.isArray(currentCar.images) ? currentCar.images : []), input.value.trim()]});
                                          input.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const input = document.getElementById('imageUrlInput') as HTMLInputElement;
                                      if (input && input.value.trim()) {
                                        setCurrentCar({...currentCar, images: [...(Array.isArray(currentCar.images) ? currentCar.images : []), input.value.trim()]});
                                        input.value = '';
                                      }
                                    }}
                                    className="px-4 py-2 bg-white text-black text-xs font-medium uppercase hover:bg-gray-200 transition-colors"
                                  >
                                    Add URL
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Video URL (Showcase)</label>
                                <div className="flex gap-2">
                                  <input type="text" value={currentCar.videoUrl || ''} onChange={e => setCurrentCar({...currentCar, videoUrl: e.target.value})} className="flex-1 w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors text-sm" placeholder="URL or upload ->" />
                                  <label className="cursor-pointer px-4 py-3 bg-white text-black text-xs font-medium uppercase hover:bg-gray-200 transition-colors flex items-center justify-center">
                                    Upload
                                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleAudioUpload(e, 'videoUrl')} />
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Document / Brochure (PDF)</label>
                                <div className="flex gap-2">
                                  <input type="text" value={currentCar.brochureUrl || ''} onChange={e => setCurrentCar({...currentCar, brochureUrl: e.target.value})} className="flex-1 w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors text-sm" placeholder="URL or upload ->" />
                                  <label className="cursor-pointer px-4 py-3 bg-white text-black text-xs font-medium uppercase hover:bg-gray-200 transition-colors flex items-center justify-center">
                                    Upload
                                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleAudioUpload(e, 'brochureUrl')} />
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Exterior Sound</label>
                                <div className="flex gap-2">
                                  <input type="text" value={currentCar.exteriorSound || ''} onChange={e => setCurrentCar({...currentCar, exteriorSound: e.target.value})} className="flex-1 bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors text-sm" placeholder="URL or upload ->" />
                                  <label className="cursor-pointer px-4 py-3 bg-white text-black text-xs font-medium uppercase hover:bg-gray-200 transition-colors flex items-center justify-center">
                                    Upload
                                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e, 'exteriorSound')} />
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Interior Sound</label>
                                <div className="flex gap-2">
                                  <input type="text" value={currentCar.interiorSound || ''} onChange={e => setCurrentCar({...currentCar, interiorSound: e.target.value})} className="flex-1 bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors text-sm" placeholder="URL or upload ->" />
                                  <label className="cursor-pointer px-4 py-3 bg-white text-black text-xs font-medium uppercase hover:bg-gray-200 transition-colors flex items-center justify-center">
                                    Upload
                                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e, 'interiorSound')} />
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <input type="checkbox" id="isFeatured" checked={currentCar.isFeatured || false} onChange={e => setCurrentCar({...currentCar, isFeatured: e.target.checked})} className="w-4 h-4 bg-black border-white/20" />
                              <label htmlFor="isFeatured" className="text-sm text-white">Feature this car on the homepage</label>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={() => { setIsEditingCar(false); setCurrentCar(null); }} className="px-6 py-3 border border-white/20 text-xs font-medium tracking-[0.15em] uppercase hover:bg-white/5 transition-colors">
                          Cancel
                        </button>
                        <button type="submit" className="px-6 py-3 bg-white text-black text-xs font-medium tracking-[0.15em] uppercase hover:bg-gray-200 transition-colors flex items-center gap-2">
                          <Save size={16} />
                          Save Car
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* CRM Tab */}
            {activeTab === 'crm' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-light tracking-[0.1em] uppercase">CRM & Leads</h2>
                  <button onClick={() => setShowLeadModal(true)} className="px-6 py-3 bg-white text-black text-xs font-medium tracking-[0.15em] uppercase hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <Plus size={16} />
                    New Lead
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Total Leads</h3>
                    <p className="text-3xl font-light">{inquiries.length}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Active Prospects</h3>
                    <p className="text-3xl font-light text-blue-400">{inquiries.filter(i => i.status === 'contacted').length}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Conversion Rate</h3>
                    <p className="text-3xl font-light text-green-400">
                      {inquiries.length > 0 ? ((orders.length / inquiries.length) * 100).toFixed(1) + '%' : '0%'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-[#111] border border-white/10 p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400">Lead Management</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                      <input 
                        type="text" 
                        placeholder="Search name, email, car..." 
                        value={inquirySearchQuery}
                        onChange={(e) => setInquirySearchQuery(e.target.value)}
                        className="bg-black border border-white/20 p-2 text-white text-sm focus:border-white outline-none w-full sm:w-64"
                      />
                      <select 
                        value={inquiryStatusFilter}
                        onChange={(e) => setInquiryStatusFilter(e.target.value as any)}
                        className="bg-black border border-white/20 p-2 text-white text-sm focus:border-white outline-none w-full sm:w-auto appearance-none"
                      >
                        <option value="all">All Statuses</option>
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="contacted">Contacted</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {filteredInquiries.map(inquiry => (
                      <div key={inquiry.id} className={`p-6 border ${inquiry.status === 'new' ? 'border-white/40 bg-white/5' : 'border-white/10 bg-black'} transition-colors`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium">{inquiry.name}</h3>
                            <div className="text-sm text-gray-400 mt-1 flex flex-col sm:flex-row sm:gap-4">
                              <span><a href={`mailto:${inquiry.email}`} className="hover:text-white transition-colors">{inquiry.email}</a></span>
                              {inquiry.phone && <span><a href={`tel:${inquiry.phone}`} className="hover:text-white transition-colors">{inquiry.phone}</a></span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] tracking-widest uppercase px-2 py-1 ${inquiry.status === 'new' ? 'bg-blue-500/20 text-blue-400' : inquiry.status === 'contacted' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                              {inquiry.status || 'new'}
                            </span>
                            <div className="text-xs text-gray-500 mt-2">
                              {inquiry.createdAt?.toDate().toLocaleDateString() || 'Unknown date'}
                            </div>
                          </div>
                        </div>
                        
                        {inquiry.carMakeModel && (
                          <div className="mb-4 text-sm">
                            <span className="text-gray-500 uppercase tracking-wider text-xs mr-2">Interested in:</span>
                            <span className="font-medium">{inquiry.carMakeModel}</span>
                          </div>
                        )}
                        
                        <div className="bg-[#111] p-4 text-sm text-gray-300 whitespace-pre-wrap border border-white/5">
                          {inquiry.message}
                        </div>
                        
                        {inquiry.replies && inquiry.replies.length > 0 && (
                          <div className="mt-4 space-y-3 pl-4 border-l-2 border-white/20">
                            <h4 className="text-[10px] tracking-widest uppercase text-gray-500">Reply History</h4>
                            {inquiry.replies.map((reply: any, idx: number) => (
                              <div key={idx} className="bg-white/5 p-3 text-sm text-gray-300">
                                <p className="whitespace-pre-wrap">{reply.message}</p>
                                <p className="text-[10px] text-gray-500 mt-2">
                                  {reply.sentAt?.toDate ? reply.sentAt.toDate().toLocaleString() : new Date(reply.sentAt).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button 
                            onClick={() => setReplyModalOpen(inquiry.id)}
                            className="px-4 py-2 bg-white text-black text-xs tracking-widest uppercase hover:bg-gray-200 transition-colors"
                          >
                            Reply
                          </button>
                          {inquiry.status !== 'read' && inquiry.status !== 'contacted' && (
                            <button 
                              onClick={() => updateDoc(doc(db, 'inquiries', inquiry.id), { status: 'read' })}
                              className="px-4 py-2 border border-white/20 text-xs tracking-widest uppercase hover:bg-white/10 transition-colors"
                            >
                              Mark Read
                            </button>
                          )}
                          {inquiry.status !== 'contacted' && (
                            <button 
                              onClick={() => updateDoc(doc(db, 'inquiries', inquiry.id), { status: 'contacted' })}
                              className="px-4 py-2 border border-white/20 text-xs tracking-widest uppercase hover:bg-white/10 transition-colors"
                            >
                              Mark Contacted
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              showConfirm('Delete this lead?', async () => {
                                await deleteDoc(doc(db, 'inquiries', inquiry.id));
                              });
                            }}
                            className="px-4 py-2 border border-red-500/20 text-red-400 text-xs tracking-widest uppercase hover:bg-red-500/10 transition-colors ml-auto"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredInquiries.length === 0 && (
                      <div className="text-center py-12 border border-white/10 text-gray-500">
                        No leads found matching your criteria.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sales Tab */}
            {activeTab === 'sales' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-light tracking-[0.1em] uppercase">Orders & Sales</h2>
                  <button onClick={() => setShowOrderModal(true)} className="px-6 py-3 bg-white text-black text-xs font-medium tracking-[0.15em] uppercase hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <Plus size={16} />
                    New Order
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Total Sales (YTD)</h3>
                    <p className="text-3xl font-light">€{orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Pending Orders</h3>
                    <p className="text-3xl font-light text-yellow-400">{orders.filter(o => o.status === 'pending').length}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Awaiting Deposit</h3>
                    <p className="text-3xl font-light text-orange-400">{orders.filter(o => o.status === 'awaiting_deposit').length}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Completed</h3>
                    <p className="text-3xl font-light text-green-400">{orders.filter(o => o.status === 'completed').length}</p>
                  </div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6">
                  <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-6">Recent Orders</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-xs tracking-[0.1em] text-gray-500 uppercase">
                          <th className="pb-4 font-medium">Customer</th>
                          <th className="pb-4 font-medium">Car ID</th>
                          <th className="pb-4 font-medium">Amount</th>
                          <th className="pb-4 font-medium">Status</th>
                          <th className="pb-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 text-sm">{order.customerName}</td>
                            <td className="py-4 text-sm text-gray-400">{order.carId}</td>
                            <td className="py-4 text-sm">€{Number(order.totalAmount).toLocaleString()}</td>
                            <td className="py-4 text-sm">
                              <span className={`px-2 py-1 text-[10px] uppercase tracking-widest ${
                                order.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                order.status === 'awaiting_deposit' ? 'bg-orange-500/10 text-orange-400' :
                                'bg-gray-500/10 text-gray-400'
                              }`}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button onClick={() => handleDeleteOrder(order.id)} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Delete Order">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">No orders found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Logistics Tab */}
            {activeTab === 'logistics' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-light tracking-[0.1em] uppercase">Import & Logistics</h2>
                  <button onClick={() => setShowShipmentModal(true)} className="px-6 py-3 bg-white text-black text-xs font-medium tracking-[0.15em] uppercase hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <Plus size={16} />
                    Add Shipment
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Active Shipments</h3>
                    <p className="text-3xl font-light text-blue-400">{shipments.filter(s => s.status === 'active').length}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Pending Customs</h3>
                    <p className="text-3xl font-light text-yellow-400">{shipments.filter(s => s.status === 'customs').length}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Arriving This Week</h3>
                    <p className="text-3xl font-light text-green-400">{shipments.filter(s => s.eta === 'this_week').length}</p>
                  </div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6">
                  <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-6">Active Shipments</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-xs tracking-[0.1em] text-gray-500 uppercase">
                          <th className="pb-4 font-medium">Supplier</th>
                          <th className="pb-4 font-medium">Route</th>
                          <th className="pb-4 font-medium">ETA</th>
                          <th className="pb-4 font-medium">Status</th>
                          <th className="pb-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shipments.map(shipment => (
                          <tr key={shipment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 text-sm">{shipment.supplier}</td>
                            <td className="py-4 text-sm text-gray-400">{shipment.origin} &rarr; {shipment.destination}</td>
                            <td className="py-4 text-sm text-gray-400">{shipment.eta.replace('_', ' ')}</td>
                            <td className="py-4 text-sm">
                              <span className={`px-2 py-1 text-[10px] uppercase tracking-widest ${
                                shipment.status === 'delivered' ? 'bg-green-500/10 text-green-400' :
                                shipment.status === 'customs' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-blue-500/10 text-blue-400'
                              }`}>
                                {shipment.status}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button onClick={() => handleDeleteShipment(shipment.id)} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Delete Shipment">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {shipments.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">No shipments found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Financials Tab */}
            {activeTab === 'financials' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-light tracking-[0.1em] uppercase">Financial Management</h2>
                  <button onClick={() => showAlert('Financial report generated and sent to your email.')} className="px-6 py-3 bg-white text-black text-xs font-medium tracking-[0.15em] uppercase hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <DollarSign size={16} />
                    Generate Report
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Total Revenue</h3>
                    <p className="text-3xl font-light">€{orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Gross Profit</h3>
                    <p className="text-3xl font-light text-green-400">€{orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (Number(o.profit) || 0), 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Avg Margin</h3>
                    <p className="text-3xl font-light text-blue-400">
                      {orders.filter(o => o.status === 'completed').length > 0 
                        ? ((orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (Number(o.profit) || 0), 0) / 
                            orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)) * 100).toFixed(1) + '%'
                        : '0%'}
                    </p>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Pending Payments</h3>
                    <p className="text-3xl font-light text-yellow-400">€{orders.filter(o => o.status === 'pending' || o.status === 'awaiting_deposit').reduce((sum, o) => sum + (Number(o.balanceDue) || 0), 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6">
                  <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-6">Recent Transactions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-xs tracking-[0.1em] text-gray-500 uppercase">
                          <th className="pb-4 font-medium">Customer</th>
                          <th className="pb-4 font-medium">Car ID</th>
                          <th className="pb-4 font-medium">Amount</th>
                          <th className="pb-4 font-medium">Profit</th>
                          <th className="pb-4 font-medium">Margin</th>
                          <th className="pb-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.filter(o => o.status === 'completed' || o.status === 'awaiting_deposit').map(order => (
                          <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 text-sm">{order.customerName}</td>
                            <td className="py-4 text-sm text-gray-400">{order.carId}</td>
                            <td className="py-4 text-sm">€{Number(order.totalAmount).toLocaleString()}</td>
                            <td className="py-4 text-sm text-green-400">€{Number(order.profit || 0).toLocaleString()}</td>
                            <td className="py-4 text-sm text-blue-400">{order.totalAmount ? ((Number(order.profit || 0) / Number(order.totalAmount)) * 100).toFixed(1) + '%' : '0%'}</td>
                            <td className="py-4 text-sm">
                              <span className={`px-2 py-1 text-[10px] uppercase tracking-widest ${
                                order.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                'bg-orange-500/10 text-orange-400'
                              }`}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {orders.filter(o => o.status === 'completed' || o.status === 'awaiting_deposit').length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">No recent transactions found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Marketing Tab */}
            {activeTab === 'marketing' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-light tracking-[0.1em] uppercase">Marketing & Promotions</h2>
                  <button onClick={() => setShowCampaignModal(true)} className="px-6 py-3 bg-white text-black text-xs font-medium tracking-[0.15em] uppercase hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <Plus size={16} />
                    New Campaign
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Active Campaigns</h3>
                    <p className="text-3xl font-light text-blue-400">{campaigns.filter(c => c.status === 'active').length}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Total Leads Generated</h3>
                    <p className="text-3xl font-light">{inquiries.length}</p>
                  </div>
                  <div className="bg-[#1a1a1a] p-6 border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-[0.1em] mb-2">Avg Conversion</h3>
                    <p className="text-3xl font-light text-green-400">
                      {inquiries.length > 0 ? ((orders.length / inquiries.length) * 100).toFixed(1) + '%' : '0%'}
                    </p>
                  </div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6">
                  <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-6">Active Campaigns</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-xs tracking-[0.1em] text-gray-500 uppercase">
                          <th className="pb-4 font-medium">Campaign Name</th>
                          <th className="pb-4 font-medium">Platform</th>
                          <th className="pb-4 font-medium">Budget</th>
                          <th className="pb-4 font-medium">Status</th>
                          <th className="pb-4 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map(campaign => (
                          <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-4 text-sm">{campaign.name}</td>
                            <td className="py-4 text-sm text-gray-400">{campaign.platform}</td>
                            <td className="py-4 text-sm">€{Number(campaign.budget).toLocaleString()}</td>
                            <td className="py-4 text-sm">
                              <span className={`px-2 py-1 text-[10px] uppercase tracking-widest ${
                                campaign.status === 'active' ? 'bg-green-500/10 text-green-400' :
                                campaign.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-gray-500/10 text-gray-400'
                              }`}>
                                {campaign.status}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button onClick={() => handleDeleteCampaign(campaign.id)} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Delete Campaign">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {campaigns.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">No campaigns found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-light tracking-[0.1em] uppercase">Site Content & Settings</h2>
                  <button onClick={handleSaveSettings} className="px-6 py-3 bg-white text-black text-xs font-medium tracking-[0.15em] uppercase hover:bg-gray-200 transition-colors flex items-center gap-2">
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
                
                {/* Settings Sub-navigation */}
                <div className="flex overflow-x-auto border-b border-white/10 mb-8 pb-2 gap-6 scrollbar-hide">
                  <button 
                    onClick={() => setSettingsTab('general')}
                    className={`text-xs font-medium tracking-[0.15em] uppercase whitespace-nowrap transition-colors ${settingsTab === 'general' ? 'text-white border-b border-white pb-2' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    General & Footer
                  </button>
                  <button 
                    onClick={() => setSettingsTab('home')}
                    className={`text-xs font-medium tracking-[0.15em] uppercase whitespace-nowrap transition-colors ${settingsTab === 'home' ? 'text-white border-b border-white pb-2' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Home & Headers
                  </button>
                  <button 
                    onClick={() => setSettingsTab('about')}
                    className={`text-xs font-medium tracking-[0.15em] uppercase whitespace-nowrap transition-colors ${settingsTab === 'about' ? 'text-white border-b border-white pb-2' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    About & Info
                  </button>
                  <button 
                    onClick={() => setSettingsTab('services')}
                    className={`text-xs font-medium tracking-[0.15em] uppercase whitespace-nowrap transition-colors ${settingsTab === 'services' ? 'text-white border-b border-white pb-2' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Services
                  </button>
                  <button 
                    onClick={() => setSettingsTab('contact')}
                    className={`text-xs font-medium tracking-[0.15em] uppercase whitespace-nowrap transition-colors ${settingsTab === 'contact' ? 'text-white border-b border-white pb-2' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Contact Info
                  </button>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-8 max-w-3xl">
                  
                  {settingsTab === 'home' && (
                    <>
                      {/* Hero Section */}
                      <div className="space-y-6 border border-white/10 p-6">
                        <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 border-b border-white/10 pb-4">Hero Section</h3>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Hero Title</label>
                          <input 
                            type="text" 
                            value={settings.heroTitle} 
                            onChange={e => setSettings({...settings, heroTitle: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                            placeholder="e.g. APEX AUTOMOTIVE"
                          />
                        </div>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Hero Subtitle</label>
                          <input 
                            type="text" 
                            value={settings.heroSubtitle} 
                            onChange={e => setSettings({...settings, heroSubtitle: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                            placeholder="e.g. Curated excellence for the discerning driver."
                          />
                        </div>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Hero Background Image URL</label>
                          <input 
                            type="url" 
                            value={settings.heroImage} 
                            onChange={e => setSettings({...settings, heroImage: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>

                      {/* Page Headers */}
                      <div className="space-y-6 border border-white/10 p-6">
                        <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 border-b border-white/10 pb-4">Page Header Images</h3>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Showroom Header Image URL</label>
                          <input 
                            type="url" 
                            value={settings.showroomImage || ''} 
                            onChange={e => setSettings({...settings, showroomImage: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Recently Sold Header Image URL</label>
                          <input 
                            type="url" 
                            value={settings.soldCarsImage || ''} 
                            onChange={e => setSettings({...settings, soldCarsImage: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {settingsTab === 'about' && (
                    <>
                      {/* About Section */}
                      <div className="space-y-6 border border-white/10 p-6">
                        <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 border-b border-white/10 pb-4">About Section</h3>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">About Us Title</label>
                          <input 
                            type="text" 
                            value={settings.aboutTitle || ''} 
                            onChange={e => setSettings({...settings, aboutTitle: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                            placeholder="e.g. THE APX EXPERIENCE"
                          />
                        </div>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">About Us Subtitle</label>
                          <input 
                            type="text" 
                            value={settings.aboutSubtitle || ''} 
                            onChange={e => setSettings({...settings, aboutSubtitle: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                            placeholder="e.g. A legacy of excellence in luxury automotive."
                          />
                        </div>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">About Us Text</label>
                          <textarea 
                            value={settings.aboutText || ''} 
                            onChange={e => setSettings({...settings, aboutText: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors min-h-[150px]" 
                            placeholder="Write your dealership's story here..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">About Us Image URL</label>
                          <input 
                            type="url" 
                            value={settings.aboutImage || ''} 
                            onChange={e => setSettings({...settings, aboutImage: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>

                      {/* Sourcing & How We Work Sections */}
                      <div className="space-y-6 border border-white/10 p-6">
                        <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 border-b border-white/10 pb-4">Sourcing & How We Work</h3>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Sourcing Page Text</label>
                          <textarea 
                            value={settings.sourcingText || ''} 
                            onChange={e => setSettings({...settings, sourcingText: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors min-h-[100px]" 
                            placeholder="With our extensive global network..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">How We Work Intro Text</label>
                          <textarea 
                            value={settings.howWeWorkText || ''} 
                            onChange={e => setSettings({...settings, howWeWorkText: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors min-h-[100px]" 
                            placeholder="Our process is designed to provide..."
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {settingsTab === 'services' && (
                    <>
                      {/* Services Section */}
                      <div className="space-y-6 border border-white/10 p-6">
                        <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 border-b border-white/10 pb-4">Services Section</h3>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Section Title</label>
                          <input 
                            type="text" 
                            value={settings.servicesTitle || ''} 
                            onChange={e => setSettings({...settings, servicesTitle: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                            placeholder="OUR SERVICES"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Service 1 Title</label>
                            <input 
                              type="text" 
                              value={settings.service1Title || ''} 
                              onChange={e => setSettings({...settings, service1Title: e.target.value})} 
                              className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors mb-4" 
                              placeholder="Vehicle Sourcing"
                            />
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Service 1 Description</label>
                            <textarea 
                              value={settings.service1Desc || ''} 
                              onChange={e => setSettings({...settings, service1Desc: e.target.value})} 
                              className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors min-h-[100px]" 
                              placeholder="Looking for a specific rare model?..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Service 2 Title</label>
                            <input 
                              type="text" 
                              value={settings.service2Title || ''} 
                              onChange={e => setSettings({...settings, service2Title: e.target.value})} 
                              className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors mb-4" 
                              placeholder="Bespoke Financing"
                            />
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Service 2 Description</label>
                            <textarea 
                              value={settings.service2Desc || ''} 
                              onChange={e => setSettings({...settings, service2Desc: e.target.value})} 
                              className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors min-h-[100px]" 
                              placeholder="Tailored financial solutions..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Service 3 Title</label>
                            <input 
                              type="text" 
                              value={settings.service3Title || ''} 
                              onChange={e => setSettings({...settings, service3Title: e.target.value})} 
                              className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors mb-4" 
                              placeholder="Premium Insurance"
                            />
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Service 3 Description</label>
                            <textarea 
                              value={settings.service3Desc || ''} 
                              onChange={e => setSettings({...settings, service3Desc: e.target.value})} 
                              className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors min-h-[100px]" 
                              placeholder="Comprehensive coverage options..."
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {settingsTab === 'contact' && (
                    <>
                      {/* Contact Info */}
                      <div className="space-y-6 border border-white/10 p-6">
                        <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 border-b border-white/10 pb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Email Address</label>
                            <input 
                              type="email" 
                              value={settings.contactEmail} 
                              onChange={e => setSettings({...settings, contactEmail: e.target.value})} 
                              className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Locations</label>
                            <input 
                              type="text" 
                              value={settings.address || ''} 
                              onChange={e => setSettings({...settings, address: e.target.value})} 
                              className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                              placeholder="e.g. Netherlands & Cyprus"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Working Hours</label>
                            <input 
                              type="text" 
                              value={settings.workingHours} 
                              onChange={e => setSettings({...settings, workingHours: e.target.value})} 
                              className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                              placeholder="e.g. Available 24/7"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {settingsTab === 'general' && (
                    <>
                      {/* Footer Section */}
                      <div className="space-y-6 border border-white/10 p-6">
                        <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 border-b border-white/10 pb-4">Footer Section</h3>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Footer Description</label>
                          <textarea 
                            value={settings.footerDescription || ''} 
                            onChange={e => setSettings({...settings, footerDescription: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors min-h-[100px]" 
                            placeholder="The ultimate destination for high-end automotive excellence..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Footer Emblem Image URL</label>
                          <input 
                            type="url" 
                            value={settings.footerImage || ''} 
                            onChange={e => setSettings({...settings, footerImage: e.target.value})} 
                            className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                            placeholder="https://example.com/emblem.png"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </form>
              </div>
            )}

            {/* Social Media Tab */}
            {activeTab === 'social' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-light tracking-[0.1em] uppercase">Social Media Management</h2>
                  <button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="bg-white text-black px-6 py-3 text-xs font-medium tracking-[0.15em] uppercase hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Social Links */}
                  <div className="bg-black border border-white/10 p-6">
                    <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 border-b border-white/10 pb-4 mb-6">Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Instagram URL</label>
                        <input 
                          type="url" 
                          value={settings.instagramUrl || ''} 
                          onChange={e => setSettings({...settings, instagramUrl: e.target.value})} 
                          className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                          placeholder="https://instagram.com/yourusername"
                        />
                      </div>
                      <div>
                        <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Facebook URL</label>
                        <input 
                          type="url" 
                          value={settings.facebookUrl || ''} 
                          onChange={e => setSettings({...settings, facebookUrl: e.target.value})} 
                          className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      <div>
                        <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">TikTok URL</label>
                        <input 
                          type="url" 
                          value={settings.tiktokUrl || ''} 
                          onChange={e => setSettings({...settings, tiktokUrl: e.target.value})} 
                          className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                          placeholder="https://tiktok.com/@yourusername"
                        />
                      </div>
                      <div>
                        <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Youtube URL</label>
                        <input 
                          type="url" 
                          value={settings.youtubeUrl || ''} 
                          onChange={e => setSettings({...settings, youtubeUrl: e.target.value})} 
                          className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors" 
                          placeholder="https://youtube.com/yourpage"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Media Grid Section */}
                  <div className="bg-black border border-white/10 p-6">
                    <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 border-b border-white/10 pb-4 mb-6">Media Grid Posts</h3>
                    <p className="text-xs text-gray-500 mb-6">Upload images to display in the Media section on the homepage.</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      {(settings.socialGridImages || []).map((img: string, i: number) => (
                        <div key={i} className="relative aspect-square bg-white/5 border border-white/10 group">
                          <img src={img} alt={`Social Post ${i + 1}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => {
                              const newImages = [...(settings.socialGridImages || [])];
                              newImages.splice(i, 1);
                              setSettings({...settings, socialGridImages: newImages});
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files) return;
                          
                          setIsUploading(true);
                          try {
                            const newImages = [...(settings.socialGridImages || [])];
                            for (let i = 0; i < files.length; i++) {
                              const file = files[i];
                              const storageRef = ref(storage, `social/${Date.now()}_${file.name}`);
                              await uploadBytes(storageRef, file);
                              const url = await getDownloadURL(storageRef);
                              newImages.push(url);
                            }
                            setSettings({ ...settings, socialGridImages: newImages });
                          } catch (error) {
                            console.error("Error uploading images:", error);
                            alert("Failed to upload images");
                          } finally {
                            setIsUploading(false);
                          }
                        }} 
                        className="hidden" 
                        id="social-image-upload" 
                        disabled={isUploading}
                      />
                      <label 
                        htmlFor="social-image-upload" 
                        className={`inline-block px-6 py-3 border border-white/20 text-xs tracking-[0.1em] uppercase hover:bg-white hover:text-black transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        {isUploading ? 'Uploading...' : 'Upload Posts'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <h2 className="text-xl font-light tracking-[0.1em] uppercase">Manage Users</h2>
                  <input 
                    type="text" 
                    placeholder="Search users by email..." 
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="bg-black border border-white/20 p-2 text-white text-sm focus:border-white outline-none w-full md:w-64"
                  />
                </div>

                {/* Create Worker Form */}
                <div className="bg-black border border-white/10 p-6 mb-8">
                  <h3 className="text-sm font-medium tracking-[0.2em] uppercase text-gray-400 mb-4">Add Worker Account</h3>
                  <form onSubmit={handleCreateWorker} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Worker Email</label>
                      <input 
                        type="email" 
                        value={newWorkerEmail}
                        onChange={(e) => setNewWorkerEmail(e.target.value)}
                        className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"
                        placeholder="worker@apxdealer.com"
                        required
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Temporary Password</label>
                      <input 
                        type="password" 
                        value={newWorkerPassword}
                        onChange={(e) => setNewWorkerPassword(e.target.value)}
                        className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none transition-colors"
                        placeholder="Minimum 6 characters"
                        required
                        minLength={6}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isCreatingWorker}
                      className="w-full md:w-auto px-8 py-3 bg-white text-black text-xs font-medium tracking-[0.2em] uppercase hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {isCreatingWorker ? 'Creating...' : 'Add Worker'}
                    </button>
                  </form>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-xs tracking-[0.1em] text-gray-500 uppercase">
                        <th className="pb-4 font-medium">Email</th>
                        <th className="pb-4 font-medium">Role</th>
                        <th className="pb-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 text-sm">{u.email}</td>
                          <td className="py-4 text-sm">
                            <span className={`px-2 py-1 text-[10px] tracking-wider uppercase ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <select 
                              value={u.role}
                              onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                              className="bg-black border border-white/20 p-2 text-white text-xs outline-none transition-colors"
                              disabled={u.email === 'fhsteman@gmail.com'}
                            >
                              <option value="user">User</option>
                              <option value="worker">Worker</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-gray-500 text-sm">No users found matching your criteria.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && isAdmin && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-light tracking-[0.1em] uppercase">User Analytics</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#111] border border-white/10 p-6">
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-2">Total Visits</h3>
                    <p className="text-3xl font-light">{analytics.length}</p>
                  </div>
                  <div className="bg-[#111] border border-white/10 p-6">
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-2">Unique Pages</h3>
                    <p className="text-3xl font-light">{new Set(analytics.map(a => a.page)).size}</p>
                  </div>
                  <div className="bg-[#111] border border-white/10 p-6">
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-2">Mobile Users</h3>
                    <p className="text-3xl font-light">{analytics.filter(a => a.device === 'Mobile').length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Time Series Chart */}
                  <div className="bg-[#111] border border-white/10 p-6">
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-6">Visits Over Last 7 Days</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis dataKey="date" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Line type="monotone" dataKey="visits" stroke="#fff" strokeWidth={2} dot={{ r: 4, fill: '#000', stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Device Pie Chart */}
                  <div className="bg-[#111] border border-white/10 p-6">
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-6">Device Breakdown</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.deviceChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {analyticsData.deviceChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px', color: '#888' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Pages Bar Chart */}
                  <div className="bg-[#111] border border-white/10 p-6 lg:col-span-2">
                    <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-6">Top Pages</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.pageChartData} layout="vertical" margin={{ left: 50 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                          <XAxis type="number" stroke="#888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                          <YAxis dataKey="name" type="category" stroke="#888" fontSize={10} tickLine={false} axisLine={false} width={100} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{ fill: '#222' }}
                          />
                          <Bar dataKey="views" fill="#fff" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto bg-[#111] border border-white/10 p-6">
                  <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-6">Detailed Visit Log</h3>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-xs tracking-[0.1em] text-gray-500 uppercase">
                        <th className="pb-4 font-medium">Page</th>
                        <th className="pb-4 font-medium">Device</th>
                        <th className="pb-4 font-medium">Language</th>
                        <th className="pb-4 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.slice(0, 50).map(a => (
                        <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 text-sm">{a.page}</td>
                          <td className="py-4 text-sm text-gray-400">{a.device || 'Unknown'}</td>
                          <td className="py-4 text-sm text-gray-400">{a.language || 'Unknown'}</td>
                          <td className="py-4 text-sm text-gray-400">
                            {a.timestamp?.toDate ? a.timestamp.toDate().toLocaleString() : new Date(a.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {analytics.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-500 text-sm">No analytics data found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI Assistant Tab */}
            {activeTab === 'ai' && isAdmin && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-light tracking-[0.1em] uppercase">AI Admin Assistant</h2>
                </div>
                <AIAssistant 
                  cars={cars} 
                  settings={settings} 
                  onSettingsUpdated={() => {
                    showAlert('Settings updated successfully by AI.');
                  }} 
                />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 p-8 max-w-sm w-full text-center">
            <p className="text-white text-sm mb-8">{alertMessage}</p>
            <button
              onClick={() => setAlertMessage(null)}
              className="px-8 py-3 bg-white text-black text-xs tracking-widest uppercase hover:bg-gray-200 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 p-8 max-w-sm w-full text-center">
            <p className="text-white text-sm mb-8">{confirmDialog.message}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-6 py-3 border border-white/20 text-white text-xs tracking-widest uppercase hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-6 py-3 bg-white text-black text-xs tracking-widest uppercase hover:bg-gray-200 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Modals */}
      {showOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-light tracking-[0.1em] uppercase">New Order</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Customer Name</label>
                <input required type="text" value={newOrder.customerName} onChange={e => setNewOrder({...newOrder, customerName: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Select Car</label>
                <select required value={newOrder.carId} onChange={e => setNewOrder({...newOrder, carId: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none appearance-none">
                  <option value="">Select a car...</option>
                  {cars.map(car => (
                    <option key={car.id} value={car.id}>{car.year} {car.make} {car.model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Total Amount (€)</label>
                <input required type="number" value={newOrder.totalAmount} onChange={e => setNewOrder({...newOrder, totalAmount: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Profit (€)</label>
                  <input type="number" value={newOrder.profit} onChange={e => setNewOrder({...newOrder, profit: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Balance Due (€)</label>
                  <input type="number" value={newOrder.balanceDue} onChange={e => setNewOrder({...newOrder, balanceDue: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Status</label>
                <select value={newOrder.status} onChange={e => setNewOrder({...newOrder, status: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none appearance-none">
                  <option value="pending">Pending</option>
                  <option value="awaiting_deposit">Awaiting Deposit</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <button type="submit" className="w-full px-6 py-3 bg-white text-black text-xs tracking-widest uppercase hover:bg-gray-200 transition-colors mt-4">Create Order</button>
            </form>
          </div>
        </div>
      )}

      {showLeadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-light tracking-[0.1em] uppercase">New Lead</h3>
              <button onClick={() => setShowLeadModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Name</label>
                <input required type="text" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Email</label>
                <input required type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Phone</label>
                <input type="text" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Interested In</label>
                <input type="text" value={newLead.carMakeModel} onChange={e => setNewLead({...newLead, carMakeModel: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" placeholder="e.g. Ferrari F40" />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Notes</label>
                <textarea value={newLead.message} onChange={e => setNewLead({...newLead, message: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" rows={3}></textarea>
              </div>
              <button type="submit" className="w-full px-6 py-3 bg-white text-black text-xs tracking-widest uppercase hover:bg-gray-200 transition-colors mt-4">Add Lead</button>
            </form>
          </div>
        </div>
      )}

      {showShipmentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-light tracking-[0.1em] uppercase">Add Shipment</h3>
              <button onClick={() => setShowShipmentModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Supplier</label>
                <input required type="text" value={newShipment.supplier} onChange={e => setNewShipment({...newShipment, supplier: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Origin</label>
                <input required type="text" value={newShipment.origin} onChange={e => setNewShipment({...newShipment, origin: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Destination</label>
                <input required type="text" value={newShipment.destination} onChange={e => setNewShipment({...newShipment, destination: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">ETA</label>
                <select value={newShipment.eta} onChange={e => setNewShipment({...newShipment, eta: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none appearance-none">
                  <option value="this_week">This Week</option>
                  <option value="next_week">Next Week</option>
                  <option value="this_month">This Month</option>
                  <option value="tbd">TBD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Status</label>
                <select value={newShipment.status} onChange={e => setNewShipment({...newShipment, status: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none appearance-none">
                  <option value="active">Active</option>
                  <option value="customs">Pending Customs</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <button type="submit" className="w-full px-6 py-3 bg-white text-black text-xs tracking-widest uppercase hover:bg-gray-200 transition-colors mt-4">Add Shipment</button>
            </form>
          </div>
        </div>
      )}

      {showCampaignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-light tracking-[0.1em] uppercase">New Campaign</h3>
              <button onClick={() => setShowCampaignModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Campaign Name</label>
                <input required type="text" value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Platform</label>
                <input required type="text" value={newCampaign.platform} onChange={e => setNewCampaign({...newCampaign, platform: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" placeholder="e.g. Instagram, Google Ads" />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Budget (€)</label>
                <input required type="number" value={newCampaign.budget} onChange={e => setNewCampaign({...newCampaign, budget: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Status</label>
                <select value={newCampaign.status} onChange={e => setNewCampaign({...newCampaign, status: e.target.value})} className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none appearance-none">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <button type="submit" className="w-full px-6 py-3 bg-white text-black text-xs tracking-widest uppercase hover:bg-gray-200 transition-colors mt-4">Create Campaign</button>
            </form>
          </div>
        </div>
      )}

      {replyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-light tracking-[0.1em] uppercase">Reply to Lead</h3>
              <button onClick={() => { setReplyModalOpen(null); setReplyMessage(''); }} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs tracking-[0.1em] text-gray-400 uppercase mb-2">Message</label>
                <textarea 
                  required 
                  value={replyMessage} 
                  onChange={e => setReplyMessage(e.target.value)} 
                  className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none min-h-[150px]" 
                  placeholder="Type your reply here..."
                ></textarea>
              </div>
              <button 
                onClick={() => handleSendReply(replyModalOpen)}
                disabled={!replyMessage.trim()}
                className="w-full px-6 py-3 bg-white text-black text-xs tracking-widest uppercase hover:bg-gray-200 transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

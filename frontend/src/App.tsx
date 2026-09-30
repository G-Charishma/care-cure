import { useState, useRef, useEffect } from 'react'
import './App.css'
import {
  type UserPreferences,
  loadPreferences,
  savePreferences,
  formatCurrency,
  COUNTRIES,
  LANGUAGES,
  type Country,
  type Language,
} from './types'
import {
  InteractiveMap,
  type Facility,
  generateFacilitiesForLocation,
  geocodeSearch,
} from './InteractiveMap'

interface Medicine {
  id: number;
  name: string;
  description: string;
  price: number;
  category?: string;
  dosage_form?: string;
  rating?: number;
  reviews_count?: number;
  badge?: string | null;
  in_stock?: boolean;
  dosage_guidance?: string | null;
  image_url?: string | null;
}

interface OrderItem {
  orderId: string;
  date: string;
  items: Medicine[];
  total: number;
  payment: string;
  paymentType: 'cod' | 'upi' | 'card';
  deliveryEstimateMinutes: number;
  deliveryAddress: string;
  fulfillingStore: string;
}

interface UserProfile {
  name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  house: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

const DEFAULT_FACILITIES = generateFacilitiesForLocation(12.9716, 77.6412, 'Indiranagar, Bengaluru');

// -----------------------------------------------
// Onboarding Progress Bar Component
// -----------------------------------------------
function OnboardingProgressBar({ step }: { step: 1 | 2 | 3 | 4 }) {
  const steps = ['Country', 'Language', 'Location', 'Done'];
  return (
    <div className="ob-progress-bar">
      {steps.map((label, i) => {
        const num = i + 1;
        const isDone = num < step;
        const isActive = num === step;
        return (
          <div key={label} className="ob-progress-step">
            <div className={`ob-step-circle ${isDone ? 'ob-done' : isActive ? 'ob-active' : ''}`}>
              {isDone ? '✓' : num}
            </div>
            <span className={`ob-step-label ${isActive ? 'ob-label-active' : isDone ? 'ob-label-done' : ''}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`ob-step-connector ${isDone ? 'ob-connector-done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function App() {
  // Navigation: 'landing' → 'transition' → 'login' / 'signup' → onboarding steps → 'pharmacy'
  type Screen =
    | 'landing' | 'transition' | 'login' | 'signup'
    | 'onboarding-country' | 'onboarding-language' | 'onboarding-location'
    | 'pharmacy';
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Pharmacy Tabs
  const [activeTab, setActiveTab] = useState('home');
  const [symptomsText, setSymptomsText] = useState('');
  const [recommendation, setRecommendation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [storeMedicines, setStoreMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<Medicine[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Item added to cart!');

  // User State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('carecure_user');
    return saved ? JSON.parse(saved) : {
      name: 'Jane Doe',
      dob: '1995-08-15',
      gender: 'Female',
      phone: '9876543210',
      email: 'jane.doe@example.com',
      house: 'Flat 402, Green Heights',
      street: '10th Main, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      emergencyContactName: 'John Doe',
      emergencyContactPhone: '9876500000'
    };
  });

  // -----------------------------------------------
  // Centralized User Preferences
  // -----------------------------------------------
  const [userPrefs, setUserPrefsState] = useState<UserPreferences>(() => loadPreferences());

  const updatePrefs = (patch: Partial<UserPreferences>) => {
    setUserPrefsState(prev => {
      const next = { ...prev, ...patch };
      try {
        savePreferences(next);
      } catch {
        // save error handled in UI
      }
      return next;
    });
  };

  // Helper: format currency using centralized prefs
  const fmtPrice = (amount: number) =>
    formatCurrency(amount, userPrefs.currencyCode || 'USD', userPrefs.currencyLocale || 'en-US');

  // Auth & Registration Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authErrors, setAuthErrors] = useState<Record<string, string>>({});
  const [showAccountCreatedSuccess, setShowAccountCreatedSuccess] = useState(false);

  const [signUpForm, setSignUpForm] = useState({
    fullName: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    house: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  // Location State (Accurate Leaflet & GPS Coordinates)
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>(() => {
    return (localStorage.getItem('carecure_loc_permission') as any) || 'prompt';
  });
  const [manualCity, setManualCity] = useState('');
  const [userAddressText, setUserAddressText] = useState(() => {
    const prefs = loadPreferences();
    return prefs.location || 'Indiranagar, Bengaluru';
  });
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.6412 });
  const [facilitiesData, setFacilitiesData] = useState(() => DEFAULT_FACILITIES);
  const [nearbyFilter, setNearbyFilter] = useState<'all' | 'stores' | 'hospitals'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [directionsFacility, setDirectionsFacility] = useState<Facility | null>(null);

  // Shop Enhanced Filter & Quantity State
  const [selectedMedCategory, setSelectedMedCategory] = useState<string>('All');
  const [medSearchQuery, setMedSearchQuery] = useState<string>('');
  const [medSortOption, setMedSortOption] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'name'>('featured');
  const [medQuantities, setMedQuantities] = useState<Record<number, number>>({});
  const [expandedGuidanceId, setExpandedGuidanceId] = useState<number | null>(null);

  // Checkout State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card'>('cod');
  const [upiApp, setUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'custom'>('gpay');
  const [upiId, setUpiId] = useState('user@okaxis');

  // Card Form State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Payment Processing & Order Success Modal
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [currentSuccessOrder, setCurrentSuccessOrder] = useState<OrderItem | null>(null);

  // Skin Allergy Upload State
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'analyzing' | 'complete'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStageText, setUploadStageText] = useState('');
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [allergyResult, setAllergyResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  // -----------------------------------------------
  // Onboarding State
  // -----------------------------------------------
  const [countrySearch, setCountrySearch] = useState('');
  const [langSearch, setLangSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

  // Location Modal State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationMode, setLocationMode] = useState<'choose' | 'gps' | 'manual' | 'confirming' | 'confirmed'>('choose');
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [manualLocationForm, setManualLocationForm] = useState({
    state: '', city: '', area: '', pincode: '', address: ''
  });
  const [manualLocationError, setManualLocationError] = useState('');
  const [prefSaveError, setPrefSaveError] = useState('');

  // Settings Panel
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'main' | 'country' | 'language' | 'location'>('main');
  const [settingsCountrySearch, setSettingsCountrySearch] = useState('');
  const [settingsLangSearch, setSettingsLangSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTimerRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('carecure_user', JSON.stringify(user));
  }, [user]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // GET STARTED Animation Handler
  const handleGetStartedClick = () => {
    setCurrentScreen('transition');
    setTimeout(() => {
      setCurrentScreen('login');
    }, 1200);
  };

  // Login Submit Handler — check saved preferences
  const handleLoginSubmit = () => {
    const errors: Record<string, string> = {};
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!loginPassword) {
      errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length === 0) {
      setIsLoggedIn(true);
      const prefs = loadPreferences();
      if (prefs.onboardingComplete) {
        // Returning user — load saved preferences and go straight to pharmacy
        setUserPrefsState(prefs);
        if (prefs.location) setUserAddressText(prefs.location);
        setCurrentScreen('pharmacy');
        triggerToast('✅ Welcome back! Preferences loaded.');
      } else {
        // New user — start onboarding
        setCurrentScreen('onboarding-country');
        triggerToast('✅ Logged in! Let\'s personalize your experience.');
      }
    } else {
      setAuthErrors(errors);
    }
  };

  // Registration Submit Handler
  const handleSignUpSubmit = () => {
    const errors: Record<string, string> = {};

    if (!signUpForm.fullName.trim()) errors.fullName = 'Full Name is required.';
    if (!signUpForm.dob) errors.dob = 'Date of Birth is required.';
    if (!/^[6-9]\d{9}$/.test(signUpForm.phone.trim())) errors.phone = 'Mobile number is required (10-digit Indian format).';
    if (!/\S+@\S+\.\S+/.test(signUpForm.email.trim())) errors.email = 'Please enter a valid email address.';
    if (!signUpForm.password) errors.password = 'Password is required.';
    if (signUpForm.password !== signUpForm.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!signUpForm.house.trim()) errors.house = 'Building / House Number is required.';
    if (!signUpForm.street.trim()) errors.street = 'Street / Area is required.';
    if (!signUpForm.city.trim()) errors.city = 'City is required.';
    if (!signUpForm.state.trim()) errors.state = 'State is required.';
    if (!/^\d{6}$/.test(signUpForm.pincode.trim())) errors.pincode = 'Please enter a valid 6-digit pincode.';

    if (Object.keys(errors).length === 0) {
      const newProf: UserProfile = {
        name: signUpForm.fullName,
        dob: signUpForm.dob,
        gender: signUpForm.gender,
        phone: signUpForm.phone,
        email: signUpForm.email,
        house: signUpForm.house,
        street: signUpForm.street,
        city: signUpForm.city,
        state: signUpForm.state,
        pincode: signUpForm.pincode,
        emergencyContactName: signUpForm.emergencyContactName || 'Emergency Contact',
        emergencyContactPhone: signUpForm.emergencyContactPhone || signUpForm.phone
      };
      setUser(newProf);
      setLoginEmail(signUpForm.email);
      setShowAccountCreatedSuccess(true);
    } else {
      setAuthErrors(errors);
    }
  };

  // Logout Handler
  const handleConfirmLogout = () => {
    setIsLoggedIn(false);
    setShowLogoutConfirm(false);
    setCurrentScreen('login');
    setCart([]);
    triggerToast('Logged out successfully.');
  };

  const updateMedQuantity = (id: number, delta: number) => {
    setMedQuantities((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, Math.min(20, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const handleAddToCart = (item: Medicine, qty: number = 1) => {
    const itemsToAdd = Array(qty).fill(item);
    setCart((prev) => [...prev, ...itemsToAdd]);
    triggerToast(`✅ Added ${qty > 1 ? `${qty}x ` : ''}${item.name} to cart!`);
  };

  const handleQuickBuy = (item: Medicine, qty: number = 1) => {
    const itemsToAdd = Array(qty).fill(item);
    setCart((prev) => [...prev, ...itemsToAdd]);
    setCheckoutStep(1);
    setFormErrors({});
    setShowCheckoutModal(true);
  };

  // Accurate location handlers (GPS Geolocation + OpenStreetMap Geocoding)
  const handleGrantLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          setLocationPermission('granted');
          localStorage.setItem('carecure_loc_permission', 'granted');
          
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const geoData = await geoRes.json();
            const addr = geoData.display_name?.split(',').slice(0, 3).join(',') || `GPS Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
            setUserAddressText(addr);
            updatePrefs({ location: addr, locationConfirmed: true });
            setFacilitiesData(generateFacilitiesForLocation(lat, lng, addr));
            triggerToast(`📍 Accurate GPS Location detected: ${addr}`);
          } catch {
            const locStr = `GPS Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
            setUserAddressText(locStr);
            setFacilitiesData(generateFacilitiesForLocation(lat, lng, locStr));
            triggerToast('📍 GPS Location detected!');
          }
        },
        () => {
          setLocationPermission('granted');
          localStorage.setItem('carecure_loc_permission', 'granted');
          setUserAddressText('Indiranagar, Bengaluru');
          setUserCoords({ lat: 12.9716, lng: 77.6412 });
          setFacilitiesData(generateFacilitiesForLocation(12.9716, 77.6412, 'Indiranagar, Bengaluru'));
          triggerToast('📍 Set to default location: Indiranagar');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationPermission('granted');
      localStorage.setItem('carecure_loc_permission', 'granted');
    }
  };

  const handleManualLocationSubmit = async () => {
    if (!manualCity.trim()) return;
    const query = manualCity.trim();
    setLocationPermission('granted');
    localStorage.setItem('carecure_loc_permission', 'granted');
    
    // Accurate geocoding resolution
    const geocoded = await geocodeSearch(query);
    if (geocoded) {
      setUserCoords({ lat: geocoded.lat, lng: geocoded.lng });
      const display = geocoded.displayName.split(',').slice(0, 2).join(',') || query;
      setUserAddressText(display);
      updatePrefs({ location: display, locationConfirmed: true });
      setFacilitiesData(generateFacilitiesForLocation(geocoded.lat, geocoded.lng, display));
      triggerToast(`📍 Location accurately updated to: ${display}`);
    } else {
      setUserAddressText(query);
      updatePrefs({ location: query, locationConfirmed: true });
      setFacilitiesData(generateFacilitiesForLocation(userCoords.lat, userCoords.lng, query));
      triggerToast(`📍 Location updated to: ${query}`);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutStep(1);
    setFormErrors({});
    setShowCheckoutModal(true);
  };

  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const validatePaymentForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        errors.upiId = 'Please enter a valid UPI ID (e.g. name@bank)';
      }
    } else if (paymentMethod === 'card') {
      if (!cardName.trim()) errors.cardName = 'Cardholder name is required';
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length !== 16) errors.cardNumber = 'Enter valid 16-digit card number';
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) errors.cardExpiry = 'Enter MM/YY expiry';
      if (!/^\d{3,4}$/.test(cardCvv)) errors.cardCvv = 'Enter 3 or 4-digit CVV';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFinalizeCheckout = () => {
    if (!validatePaymentForm()) return;

    setIsPaymentProcessing(true);

    setTimeout(() => {
      setIsPaymentProcessing(false);

      const randomId = Math.floor(10000 + Math.random() * 90000);
      const orderIdStr = `#CC${randomId}`;
      const deliveryMins = Math.floor(20 + Math.random() * 21);

      let paymentLabel = 'Cash on Delivery';
      if (paymentMethod === 'upi') {
        const appName = upiApp === 'gpay' ? 'Google Pay' : upiApp === 'phonepe' ? 'PhonePe' : upiApp === 'paytm' ? 'Paytm' : 'UPI';
        paymentLabel = `Online UPI (${appName} - ${upiId.trim()})`;
      } else if (paymentMethod === 'card') {
        const last4 = cardNumber.replace(/\s/g, '').slice(-4) || '4242';
        paymentLabel = `Card Payment (ending in ${last4})`;
      }

      const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
      const fullAddressStr = `${user.house}, ${user.street}, ${user.city}, ${user.state} - ${user.pincode}`;

      const newOrder: OrderItem = {
        orderId: orderIdStr,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' } as any),
        items: [...cart],
        total: totalAmount,
        payment: paymentLabel,
        paymentType: paymentMethod,
        deliveryEstimateMinutes: deliveryMins,
        deliveryAddress: fullAddressStr,
        fulfillingStore: facilitiesData.stores[0]?.name || 'Care&Cure Pharmacy 24/7'
      };

      setOrders((prev) => [newOrder, ...prev]);
      setCurrentSuccessOrder(newOrder);
      setShowCheckoutModal(false);
      setCart([]);

      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
    }, 1800);
  };

  useEffect(() => {
    // Preload medicines catalog
    fetch('http://localhost:8000/api/medicines')
      .then(res => res.json())
      .then(data => setStoreMedicines(data))
      .catch(err => console.error("Initial medicine catalog load error:", err));
  }, []);

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    if (tab === 'shop' && storeMedicines.length === 0) {
      try {
        const response = await fetch('http://localhost:8000/api/medicines');
        const data = await response.json();
        setStoreMedicines(data);
      } catch (error) {
        console.error("Failed to fetch store medicines:", error);
      }
    }
  };

  const handleAnalyzeSymptoms = async () => {
    if (!symptomsText.trim()) return;
    setIsLoading(true);
    setRecommendation(null);
    try {
      const response = await fetch('http://localhost:8000/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: symptomsText })
      });
      const data = await response.json();
      setRecommendation(data);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFileSelect = (file: File) => {
    if (!file) return;

    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);

    setUploadState('uploading');
    setUploadProgress(5);
    setUploadStageText('Uploading image...');
    setAllergyResult(null);

    const previewUrl = URL.createObjectURL(file);
    setSelectedImagePreview(previewUrl);

    let currentProgress = 5;
    uploadTimerRef.current = setInterval(() => {
      currentProgress += 10;
      if (currentProgress <= 35) {
        setUploadState('uploading');
        setUploadStageText('Uploading image...');
        setUploadProgress(currentProgress);
      } else if (currentProgress <= 70) {
        setUploadState('processing');
        setUploadStageText('Processing image features...');
        setUploadProgress(currentProgress);
      } else if (currentProgress < 100) {
        setUploadState('analyzing');
        setUploadStageText('Analyzing skin allergy with Dermatology AI...');
        setUploadProgress(currentProgress);
      } else {
        clearInterval(uploadTimerRef.current);
        setUploadProgress(100);
        setUploadState('complete');
        setUploadStageText('Image uploaded successfully');

        const formData = new FormData();
        formData.append('file', file);

        fetch('http://localhost:8000/api/upload-allergy', {
          method: 'POST',
          body: formData
        })
          .then((res) => res.json())
          .then((data) => setAllergyResult(data))
          .catch(() => {
            setAllergyResult({
              detected_allergy: "Contact Dermatitis / Skin Rash",
              syrup_recommendation: "AllergyRelief Cetirizine Syrup (10ml daily)",
              other_medicines: [
                { id: 2, name: "AllergyRelief Cetirizine", description: "Non-drowsy allergy relief for skin and respiratory.", price: 8.50 },
                { id: 4, name: "DermaCream Plus", description: "Soothing cream for rashes and minor skin allergies.", price: 12.00 }
              ]
            });
          });
      }
    }, 200);
  };

  // -----------------------------------------------
  // Onboarding Handlers
  // -----------------------------------------------
  const handleCountryContinue = () => {
    if (!selectedCountry) return;
    updatePrefs({
      country: selectedCountry.name,
      countryCode: selectedCountry.code,
      currencyCode: selectedCountry.currencyCode,
      currencyLocale: selectedCountry.currencyLocale,
    });
    setCurrentScreen('onboarding-language');
  };

  const handleLanguageContinue = () => {
    if (!selectedLanguage) return;
    updatePrefs({
      language: selectedLanguage.name,
      languageCode: selectedLanguage.code,
    });
    setCurrentScreen('onboarding-location');
  };

  const openLocationModal = () => {
    setLocationMode('choose');
    setDetectedLocation(null);
    setLocationDenied(false);
    setLocationError('');
    setManualLocationError('');
    setPrefSaveError('');
    setShowLocationModal(true);
  };

  const handleUseCurrentLocation = () => {
    setLocationMode('gps');
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`;
        // In a real app, reverse-geocode here. We display coordinates clearly as detected.
        setDetectedLocation(loc);
        setLocationDenied(false);
      },
      () => {
        setLocationDenied(true);
        setLocationError('Location access was not granted. Please enter your location manually.');
      }
    );
  };

  const handleConfirmLocation = (locationText: string, method: 'gps' | 'manual') => {
    setLocationMode('confirming');

    setTimeout(() => {
      try {
        updatePrefs({
          location: locationText,
          address: locationText,
          locationMethod: method,
          locationConfirmed: true,
          onboardingComplete: true,
        });
        setUserAddressText(locationText);
        setLocationPermission('granted');
        localStorage.setItem('carecure_loc_permission', 'granted');
        setLocationMode('confirmed');

        setTimeout(() => {
          setShowLocationModal(false);
          setCurrentScreen('pharmacy');
          triggerToast('🎉 Setup complete! Welcome to Care&Cure!');
        }, 1000);
      } catch {
        setPrefSaveError('Could not save your preferences. Please try again.');
        setLocationMode('choose');
      }
    }, 1500);
  };

  const handleManualLocationConfirm = () => {
    const { city, state: st } = manualLocationForm;
    if (!city.trim()) {
      setManualLocationError('Please enter at least a city name.');
      return;
    }
    const parts = [
      manualLocationForm.area,
      city,
      st,
      manualLocationForm.pincode
    ].filter(Boolean).join(', ');
    setManualLocationError('');
    handleConfirmLocation(parts, 'manual');
  };

  // Settings handlers
  const handleSettingsChangeCountry = (country: Country) => {
    updatePrefs({
      country: country.name,
      countryCode: country.code,
      currencyCode: country.currencyCode,
      currencyLocale: country.currencyLocale,
    });
    setSettingsSection('main');
    triggerToast(`✅ Country updated to ${country.name}. Prices updated.`);
  };

  const handleSettingsChangeLanguage = (lang: Language) => {
    updatePrefs({ language: lang.name, languageCode: lang.code });
    setSettingsSection('main');
    triggerToast(`✅ Language updated to ${lang.name}.`);
  };

  const handleSettingsChangeLocationConfirm = (locationText: string, method: 'gps' | 'manual') => {
    updatePrefs({ location: locationText, address: locationText, locationMethod: method, locationConfirmed: true });
    setUserAddressText(locationText);
    setLocationPermission('granted');
    localStorage.setItem('carecure_loc_permission', 'granted');
    setShowSettings(false);
    triggerToast(`📍 Location updated to: ${locationText}`);
  };

  // Filtered data for onboarding selectors
  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );
  const filteredLanguages = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(langSearch.toLowerCase())
  );
  const filteredSettingsCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(settingsCountrySearch.toLowerCase())
  );
  const filteredSettingsLanguages = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(settingsLangSearch.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(settingsLangSearch.toLowerCase())
  );

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          {toastMsg}
        </div>
      )}

      {/* PORTAL OPENING TRANSITION SCREEN */}
      {currentScreen === 'transition' && (
        <div className="portal-transition-overlay">
          <div className="portal-pulse-icon">🏥</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Opening Care&Cure Healthcare Portal...</h2>
          <p style={{ color: 'var(--color-surface)', marginTop: '0.5rem' }}>Securing digital healthcare workspace</p>
        </div>
      )}

      {/* 1. FIRST SCREEN — PROFESSIONAL LANDING PAGE */}
      {currentScreen === 'landing' && (
        <div className="container mt-4 fade-in">
          {/* Landing Header */}
          <header style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1.2rem 0', marginBottom: '2rem', borderBottom: '1px solid var(--color-accent)'
          }}>
            <div style={{ color: 'var(--color-primary)', fontSize: '1.8rem', fontWeight: 'bold' }}>
              🏥 Care&Cure
            </div>
            <button className="btn-outline" onClick={() => setCurrentScreen('login')}>
              🔑 Partner / User Login
            </button>
          </header>

          {/* Landing Hero */}
          <div className="landing-hero">
            <div className="landing-hero-content">
              <span className="landing-logo-badge">Care&Cure Healthcare</span>
              <h1 className="landing-hero-title">Your Health. Your Care.<br />One Platform.</h1>
              <p className="landing-hero-text">
                Care&Cure is a smart healthcare and online pharmacy platform that helps you find medicines, discover nearby healthcare facilities, get healthcare assistance, and conveniently order medicines from anywhere.
              </p>
              <div>
                <button className="btn-get-started" onClick={handleGetStartedClick}>
                  GET STARTED <span className="arrow-icon">➔</span>
                </button>
              </div>
            </div>

            <div className="hero-image-wrapper">
              <img
                src="/hero-illustration.png"
                alt="Healthcare & Digital Pharmacy Illustration"
                className="hero-img"
              />
            </div>
          </div>

          {/* Landing Features Grid */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Comprehensive Healthcare Features</h2>
            <p style={{ color: 'var(--color-text-dark)' }}>Everything you need for smart, trusted medical assistance in one unified platform.</p>
          </div>

          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">💊</div>
              <h3>Online Pharmacy</h3>
              <p>Search and order verified over-the-counter medicines conveniently through the Care&Cure online pharmacy.</p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">🔍</div>
              <h3>Smart Medicine Assistance</h3>
              <p>Upload relevant skin/wound/allergy images for AI-driven analysis assistance. <em>(Informational tool, does not replace medical diagnosis).</em></p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">🏥</div>
              <h3>Nearby Hospitals</h3>
              <p>Use location access to discover 24/7 verified emergency hospitals and healthcare centers nearby.</p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">💉</div>
              <h3>Nearby Medical Stores</h3>
              <p>Find nearby pharmacies, check medicine availability, get contact phone numbers and turn-by-turn directions.</p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">📍</div>
              <h3>Location-Based Healthcare</h3>
              <p>Leverage real-time GPS or manual area entry to identify healthcare services closest to you.</p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">🛒</div>
              <h3>Easy Shopping</h3>
              <p>Add medicines to your shopping cart and complete a seamless 2-step checkout process easily.</p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">💳</div>
              <h3>Multiple Payment Options</h3>
              <p>Flexibility with Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), and Wallet/Card payments.</p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">🚚</div>
              <h3>Fast Delivery</h3>
              <p>Enjoy transparent live order tracking with estimated delivery times (20–40 minutes).</p>
            </div>
          </div>

          {/* How Care&Cure Works Section */}
          <div className="how-it-works-section">
            <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>How Care&Cure Works</h2>
            <p style={{ color: 'var(--color-text-dark)' }}>A simple 7-step seamless healthcare delivery process</p>

            <div className="steps-workflow-container">
              <div className="workflow-step-card">
                <div className="workflow-step-number">1</div>
                <strong>Get Started</strong>
              </div>
              <div className="workflow-step-card">
                <div className="workflow-step-number">2</div>
                <strong>Create Account / Login</strong>
              </div>
              <div className="workflow-step-card">
                <div className="workflow-step-number">3</div>
                <strong>Find Medicines</strong>
              </div>
              <div className="workflow-step-card">
                <div className="workflow-step-number">4</div>
                <strong>Add to Cart</strong>
              </div>
              <div className="workflow-step-card">
                <div className="workflow-step-number">5</div>
                <strong>Choose Delivery & Payment</strong>
              </div>
              <div className="workflow-step-card">
                <div className="workflow-step-number">6</div>
                <strong>Place Order</strong>
              </div>
              <div className="workflow-step-card">
                <div className="workflow-step-number">7</div>
                <strong>Track Delivery</strong>
              </div>
            </div>

            <div style={{ marginTop: '3.5rem' }}>
              <button className="btn-get-started" onClick={handleGetStartedClick}>
                GET STARTED NOW <span className="arrow-icon">➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOGIN PAGE */}
      {currentScreen === 'login' && (
        <div className="container mt-5 fade-in" style={{ maxWidth: '460px' }}>
          <div className="card" style={{ padding: '2.5rem', borderRadius: '20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏥</div>
              <h2 style={{ color: 'var(--color-primary)', fontSize: '1.8rem', margin: '0 0 0.4rem 0' }}>
                Welcome Back to Care&Cure
              </h2>
              <p style={{ color: 'var(--color-text-dark)', fontSize: '0.95rem' }}>
                Login to continue to your online pharmacy
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address:</label>
              <input
                type="email"
                className={`form-input ${authErrors.email ? 'error' : ''}`}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="user@example.com"
              />
              {authErrors.email && <p className="error-text">{authErrors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Password:</label>
              <input
                type="password"
                className={`form-input ${authErrors.password ? 'error' : ''}`}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
              />
              {authErrors.password && <p className="error-text">{authErrors.password}</p>}
            </div>

            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
              <a href="#forgot" style={{ fontSize: '0.88rem' }} onClick={(e) => { e.preventDefault(); alert('Password reset instructions sent to your email.'); }}>
                Forgot Password?
              </a>
            </div>

            <button className="btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1.1rem' }} onClick={handleLoginSubmit}>
              LOGIN
            </button>

            <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-accent)' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text-dark)', marginBottom: '0.8rem' }}>
                Don't have an account?
              </p>
              <button
                className="btn-outline"
                style={{ width: '100%', padding: '0.7rem' }}
                onClick={() => { setAuthErrors({}); setCurrentScreen('signup'); }}
              >
                CREATE A NEW ACCOUNT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CREATE NEW ACCOUNT PAGE */}
      {currentScreen === 'signup' && (
        <div className="container mt-5 fade-in" style={{ maxWidth: '650px' }}>
          <div className="card" style={{ padding: '2.5rem', borderRadius: '20px' }}>
            {showAccountCreatedSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{
                  width: '80px', height: '80px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '3rem', margin: '0 auto 1.5rem auto'
                }}>
                  ✓
                </div>
                <h2 style={{ color: 'var(--color-primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>
                  Account Created Successfully
                </h2>
                <p style={{ color: 'var(--color-text-dark)', marginBottom: '2rem' }}>
                  Your Care&Cure user profile has been registered. You can now log in to access your pharmacy dashboard.
                </p>
                <button
                  className="btn-primary"
                  style={{ padding: '0.9rem 2.5rem', fontSize: '1.1rem' }}
                  onClick={() => { setShowAccountCreatedSuccess(false); setCurrentScreen('login'); }}
                >
                  CONTINUE TO LOGIN
                </button>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>🏥</div>
                  <h2 style={{ color: 'var(--color-primary)', margin: '0 0 0.3rem 0' }}>Create a New Care&Cure Account</h2>
                  <p style={{ color: 'var(--color-text-dark)', fontSize: '0.95rem' }}>Fill in your details to set up your online pharmacy profile</p>
                </div>

                <h4 style={{ color: 'var(--color-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--color-accent)', paddingBottom: '0.4rem' }}>
                  Personal Information
                </h4>

                <div className="form-group">
                  <label className="form-label">Full Name:</label>
                  <input
                    type="text" className={`form-input ${authErrors.fullName ? 'error' : ''}`}
                    value={signUpForm.fullName} onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })}
                    placeholder="e.g. Jane Doe"
                  />
                  {authErrors.fullName && <p className="error-text">{authErrors.fullName}</p>}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Date of Birth:</label>
                    <input
                      type="date" className={`form-input ${authErrors.dob ? 'error' : ''}`}
                      value={signUpForm.dob} onChange={(e) => setSignUpForm({ ...signUpForm, dob: e.target.value })}
                    />
                    {authErrors.dob && <p className="error-text">{authErrors.dob}</p>}
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Gender:</label>
                    <select
                      className="form-input"
                      value={signUpForm.gender}
                      onChange={(e) => setSignUpForm({ ...signUpForm, gender: e.target.value })}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Mobile Number:</label>
                    <input
                      type="text" className={`form-input ${authErrors.phone ? 'error' : ''}`}
                      value={signUpForm.phone} onChange={(e) => setSignUpForm({ ...signUpForm, phone: e.target.value })}
                      placeholder="9876543210"
                    />
                    {authErrors.phone && <p className="error-text">{authErrors.phone}</p>}
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Email Address:</label>
                    <input
                      type="email" className={`form-input ${authErrors.email ? 'error' : ''}`}
                      value={signUpForm.email} onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                      placeholder="jane@example.com"
                    />
                    {authErrors.email && <p className="error-text">{authErrors.email}</p>}
                  </div>
                </div>

                <h4 style={{ color: 'var(--color-primary)', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid var(--color-accent)', paddingBottom: '0.4rem' }}>
                  Account Credentials
                </h4>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Create Password:</label>
                    <input
                      type="password" className={`form-input ${authErrors.password ? 'error' : ''}`}
                      value={signUpForm.password} onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                      placeholder="••••••••"
                    />
                    {authErrors.password && <p className="error-text">{authErrors.password}</p>}
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Confirm Password:</label>
                    <input
                      type="password" className={`form-input ${authErrors.confirmPassword ? 'error' : ''}`}
                      value={signUpForm.confirmPassword} onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                    {authErrors.confirmPassword && <p className="error-text">{authErrors.confirmPassword}</p>}
                  </div>
                </div>

                <h4 style={{ color: 'var(--color-primary)', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid var(--color-accent)', paddingBottom: '0.4rem' }}>
                  Delivery Address
                </h4>

                <div className="form-group">
                  <label className="form-label">House / Flat / Building Number:</label>
                  <input
                    type="text" className={`form-input ${authErrors.house ? 'error' : ''}`}
                    value={signUpForm.house} onChange={(e) => setSignUpForm({ ...signUpForm, house: e.target.value })}
                    placeholder="e.g. Flat 402, Green Heights"
                  />
                  {authErrors.house && <p className="error-text">{authErrors.house}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Street / Area:</label>
                  <input
                    type="text" className={`form-input ${authErrors.street ? 'error' : ''}`}
                    value={signUpForm.street} onChange={(e) => setSignUpForm({ ...signUpForm, street: e.target.value })}
                    placeholder="e.g. 10th Main, Indiranagar"
                  />
                  {authErrors.street && <p className="error-text">{authErrors.street}</p>}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">City:</label>
                    <input
                      type="text" className={`form-input ${authErrors.city ? 'error' : ''}`}
                      value={signUpForm.city} onChange={(e) => setSignUpForm({ ...signUpForm, city: e.target.value })}
                      placeholder="Bengaluru"
                    />
                    {authErrors.city && <p className="error-text">{authErrors.city}</p>}
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">State:</label>
                    <input
                      type="text" className={`form-input ${authErrors.state ? 'error' : ''}`}
                      value={signUpForm.state} onChange={(e) => setSignUpForm({ ...signUpForm, state: e.target.value })}
                      placeholder="Karnataka"
                    />
                    {authErrors.state && <p className="error-text">{authErrors.state}</p>}
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Pincode:</label>
                    <input
                      type="text" className={`form-input ${authErrors.pincode ? 'error' : ''}`}
                      value={signUpForm.pincode} onChange={(e) => setSignUpForm({ ...signUpForm, pincode: e.target.value })}
                      placeholder="560038"
                    />
                    {authErrors.pincode && <p className="error-text">{authErrors.pincode}</p>}
                  </div>
                </div>

                <h4 style={{ color: 'var(--color-primary)', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid var(--color-accent)', paddingBottom: '0.4rem' }}>
                  Additional Information
                </h4>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Emergency Contact Name:</label>
                    <input
                      type="text" className="form-input"
                      value={signUpForm.emergencyContactName} onChange={(e) => setSignUpForm({ ...signUpForm, emergencyContactName: e.target.value })}
                      placeholder="e.g. Family Relative"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Emergency Contact Number:</label>
                    <input
                      type="text" className="form-input"
                      value={signUpForm.emergencyContactPhone} onChange={(e) => setSignUpForm({ ...signUpForm, emergencyContactPhone: e.target.value })}
                      placeholder="9876500000"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button className="btn-outline" style={{ flex: 1 }} onClick={() => setCurrentScreen('login')}>
                    Cancel / Back to Login
                  </button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={handleSignUpSubmit}>
                    CREATE ACCOUNT
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          ONBOARDING — STEP 1: COUNTRY
      ========================================= */}
      {currentScreen === 'onboarding-country' && (
        <div className="ob-wrapper fade-in">
          <div className="ob-container">
            <div className="ob-header">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌍</div>
              <OnboardingProgressBar step={1} />
              <h1 className="ob-title">Which country are you in?</h1>
              <p className="ob-subtitle">Select your country to personalize your Care&Cure experience.</p>
            </div>

            <div className="ob-search-wrap">
              <input
                className="form-input ob-search-input"
                type="text"
                placeholder="🔍 Search country..."
                value={countrySearch}
                onChange={e => setCountrySearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="ob-grid">
              {filteredCountries.map(country => (
                <button
                  key={country.code}
                  className={`ob-item ${selectedCountry?.code === country.code ? 'ob-item-selected' : ''}`}
                  onClick={() => setSelectedCountry(country)}
                  id={`country-${country.code}`}
                >
                  <span className="ob-item-flag">{country.flag}</span>
                  <span className="ob-item-name">{country.name}</span>
                  {selectedCountry?.code === country.code && <span className="ob-check">✓</span>}
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-dark)', padding: '2rem' }}>
                  No countries found for "{countrySearch}"
                </p>
              )}
            </div>

            {prefSaveError && <p className="error-text" style={{ textAlign: 'center', marginTop: '1rem' }}>{prefSaveError}</p>}

            <div className="ob-footer">
              <button className="btn-outline ob-back-btn" onClick={() => setCurrentScreen('login')}>
                ← Back to Login
              </button>
              <button
                className="btn-primary ob-continue-btn"
                disabled={!selectedCountry}
                onClick={handleCountryContinue}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          ONBOARDING — STEP 2: LANGUAGE
      ========================================= */}
      {currentScreen === 'onboarding-language' && (
        <div className="ob-wrapper fade-in">
          <div className="ob-container">
            <div className="ob-header">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌐</div>
              <OnboardingProgressBar step={2} />
              <h1 className="ob-title">Choose your preferred language</h1>
              <p className="ob-subtitle">
                Select your language preference. Care&Cure will be enhanced with localization in future updates.
              </p>
            </div>

            <div className="ob-search-wrap">
              <input
                className="form-input ob-search-input"
                type="text"
                placeholder="🔍 Search language..."
                value={langSearch}
                onChange={e => setLangSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="ob-grid ob-lang-grid">
              {filteredLanguages.map(lang => (
                <button
                  key={lang.code}
                  className={`ob-item ${selectedLanguage?.code === lang.code ? 'ob-item-selected' : ''}`}
                  onClick={() => setSelectedLanguage(lang)}
                  id={`lang-${lang.code}`}
                >
                  <span className="ob-item-flag">{lang.flag}</span>
                  <span className="ob-item-name">{lang.name}</span>
                  <span className="ob-item-native">{lang.nativeName}</span>
                  {selectedLanguage?.code === lang.code && <span className="ob-check">✓</span>}
                </button>
              ))}
            </div>

            <p className="ob-note">
              ℹ️ Full translations for all Care&Cure pages will be added in future updates. Currently English is displayed throughout.
            </p>

            <div className="ob-footer">
              <button className="btn-outline ob-back-btn" onClick={() => setCurrentScreen('onboarding-country')}>
                ← Back
              </button>
              <button
                className="btn-primary ob-continue-btn"
                disabled={!selectedLanguage}
                onClick={handleLanguageContinue}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          ONBOARDING — STEP 3: LOCATION
      ========================================= */}
      {currentScreen === 'onboarding-location' && (
        <div className="ob-wrapper fade-in">
          <div className="ob-container">
            <div className="ob-header">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</div>
              <OnboardingProgressBar step={3} />
              <h1 className="ob-title">Set your location</h1>
              <p className="ob-subtitle">
                Set your location to discover nearby hospitals, medical stores and healthcare services.
              </p>
            </div>

            <div className="ob-location-options">
              <div className="ob-loc-card" onClick={openLocationModal} id="btn-use-current-location">
                <div className="ob-loc-icon">📍</div>
                <div>
                  <strong className="ob-loc-title">Use Current Location</strong>
                  <p className="ob-loc-desc">Allow access to detect your GPS location automatically</p>
                </div>
              </div>

              <div className="ob-loc-divider">
                <span>or</span>
              </div>

              <div className="ob-loc-card" onClick={() => { openLocationModal(); }} id="btn-enter-manually">
                <div className="ob-loc-icon">🔎</div>
                <div>
                  <strong className="ob-loc-title">Enter Location Manually</strong>
                  <p className="ob-loc-desc">Type your city, area, or full address</p>
                </div>
              </div>
            </div>

            <div className="ob-footer ob-footer-center">
              <button className="btn-primary ob-set-location-btn" onClick={openLocationModal} id="btn-set-location">
                📍 Set Location
              </button>
              <button className="btn-outline ob-back-btn" onClick={() => setCurrentScreen('onboarding-language')}>
                ← Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          LOCATION MODAL (shared: onboarding + settings)
      ========================================= */}
      {showLocationModal && (
        <div className="loc-modal-overlay fade-in" onClick={(e) => { if (e.target === e.currentTarget && locationMode !== 'confirming') setShowLocationModal(false); }}>
          <div className="loc-modal-card">
            {/* Header */}
            <div className="loc-modal-header">
              <div>
                <h2 className="loc-modal-title">Set Your Location</h2>
                <p className="loc-modal-desc">Choose where you want to receive healthcare services and deliveries.</p>
              </div>
              {locationMode !== 'confirming' && locationMode !== 'confirmed' && (
                <button className="loc-modal-close" onClick={() => setShowLocationModal(false)}>✕</button>
              )}
            </div>

            {/* CONFIRMING ANIMATION */}
            {(locationMode === 'confirming' || locationMode === 'confirmed') && (
              <div className="loc-confirm-anim">
                <div className={`loc-confirm-icon ${locationMode === 'confirmed' ? 'loc-confirmed' : 'loc-confirming'}`}>
                  {locationMode === 'confirmed' ? '✓' : '📍'}
                </div>
                <h3 className="loc-confirm-title">
                  {locationMode === 'confirmed' ? 'Location Confirmed Successfully!' : 'Confirming Location...'}
                </h3>
                {locationMode === 'confirmed' && (
                  <p className="loc-confirm-sub">Your healthcare services will now be personalized for this location.</p>
                )}
              </div>
            )}

            {/* CHOOSE MODE */}
            {locationMode === 'choose' && (
              <div className="loc-choose">
                <div className="loc-pin-anim">
                  <div className="loc-pin-dot">📍</div>
                  <div className="loc-pin-ripple" />
                  <div className="loc-pin-ripple loc-pin-ripple-2" />
                </div>

                {prefSaveError && (
                  <div className="ob-error-banner">{prefSaveError}</div>
                )}

                <button className="loc-option-btn loc-option-gps" onClick={handleUseCurrentLocation} id="btn-use-my-location">
                  <span style={{ fontSize: '1.5rem' }}>📍</span>
                  <div>
                    <strong>Use My Current Location</strong>
                    <p>We'll request GPS access only when you tap this button</p>
                  </div>
                </button>

                <div className="loc-or-divider"><span>or</span></div>

                <button className="loc-option-btn loc-option-manual" onClick={() => setLocationMode('manual')} id="btn-enter-location-manual">
                  <span style={{ fontSize: '1.5rem' }}>🔎</span>
                  <div>
                    <strong>Enter Location Manually</strong>
                    <p>Type your city, area, pincode, or full address</p>
                  </div>
                </button>
              </div>
            )}

            {/* GPS MODE */}
            {locationMode === 'gps' && (
              <div className="loc-gps">
                {!detectedLocation && !locationDenied && (
                  <div className="loc-detecting">
                    <div className="loc-spin-pin">📍</div>
                    <p style={{ marginTop: '1rem', color: 'var(--color-text-dark)' }}>Detecting your location...</p>
                  </div>
                )}

                {locationDenied && (
                  <div className="ob-error-banner" style={{ marginBottom: '1.5rem' }}>
                    <strong>Location access was not granted.</strong><br />
                    {locationError || 'Please enable location in your browser settings, or enter your location manually.'}
                  </div>
                )}

                {detectedLocation && !locationDenied && (
                  <div className="loc-detected-box">
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</div>
                    <h4 style={{ margin: '0 0 0.3rem 0', color: 'var(--color-primary)' }}>Detected Location</h4>
                    <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.5rem' }}>{detectedLocation}</p>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>
                      Note: Displaying GPS coordinates. For a readable address, a geocoding service can be configured.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button className="btn-outline" onClick={() => setLocationMode('manual')}>
                        Change Location
                      </button>
                      <button className="btn-primary" onClick={() => handleConfirmLocation(detectedLocation, 'gps')}>
                        Confirm Location ✓
                      </button>
                    </div>
                  </div>
                )}

                {(locationDenied) && (
                  <div style={{ textAlign: 'center' }}>
                    <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setLocationMode('manual')}>
                      Enter Location Manually →
                    </button>
                  </div>
                )}

                {!locationDenied && !detectedLocation && (
                  <button className="btn-outline" style={{ marginTop: '2rem', width: '100%' }} onClick={() => setLocationMode('choose')}>
                    ← Back
                  </button>
                )}
              </div>
            )}

            {/* MANUAL MODE */}
            {locationMode === 'manual' && (
              <div className="loc-manual">
                <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Search your location</h3>

                {manualLocationError && (
                  <div className="ob-error-banner" style={{ marginBottom: '1rem' }}>{manualLocationError}</div>
                )}

                <div className="form-group">
                  <label className="form-label">City / Town: *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Bengaluru, Mumbai, Bhimavaram"
                    value={manualLocationForm.city}
                    onChange={e => setManualLocationForm(p => ({ ...p, city: e.target.value }))}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">State / Province:</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Karnataka, Andhra Pradesh"
                      value={manualLocationForm.state}
                      onChange={e => setManualLocationForm(p => ({ ...p, state: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Area / Locality:</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Indiranagar, Koramangala"
                      value={manualLocationForm.area}
                      onChange={e => setManualLocationForm(p => ({ ...p, area: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Pincode / Postal Code:</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. 560038"
                      value={manualLocationForm.pincode}
                      onChange={e => setManualLocationForm(p => ({ ...p, pincode: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Full Address (optional):</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="House/Flat, Street"
                      value={manualLocationForm.address}
                      onChange={e => setManualLocationForm(p => ({ ...p, address: e.target.value }))}
                    />
                  </div>
                </div>

                {manualLocationForm.city && (
                  <div className="loc-selected-preview">
                    <strong style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>Selected Location:</strong>
                    <p style={{ margin: '0.3rem 0 0 0', fontWeight: 600 }}>
                      {[manualLocationForm.area, manualLocationForm.city, manualLocationForm.state, manualLocationForm.pincode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="btn-outline" style={{ flex: 1 }} onClick={() => setLocationMode('choose')}>
                    Change Location
                  </button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={handleManualLocationConfirm}>
                    Confirm Location ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          SETTINGS PANEL (accessible from pharmacy)
      ========================================= */}
      {showSettings && (
        <>
          <div className="settings-overlay" onClick={() => { setShowSettings(false); setSettingsSection('main'); }} />
          <div className="settings-panel fade-in">
            <div className="settings-panel-header">
              <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>
                {settingsSection === 'main' && '⚙️ Preferences & Settings'}
                {settingsSection === 'country' && '🌍 Change Country'}
                {settingsSection === 'language' && '🌐 Change Language'}
                {settingsSection === 'location' && '📍 Change Location'}
              </h3>
              {settingsSection !== 'main' && (
                <button className="btn-outline settings-back-btn" onClick={() => setSettingsSection('main')}>← Back</button>
              )}
              <button className="loc-modal-close" onClick={() => { setShowSettings(false); setSettingsSection('main'); }}>✕</button>
            </div>

            {settingsSection === 'main' && (
              <div className="settings-main">
                <div className="settings-row" onClick={() => { setSettingsSection('country'); setSettingsCountrySearch(''); }}>
                  <div>
                    <span className="settings-label">Country</span>
                    <span className="settings-value">
                      {userPrefs.country
                        ? `${COUNTRIES.find(c => c.code === userPrefs.countryCode)?.flag || ''} ${userPrefs.country}`
                        : 'Not set'}
                    </span>
                  </div>
                  <span className="settings-chevron">›</span>
                </div>

                <div className="settings-row" onClick={() => { setSettingsSection('language'); setSettingsLangSearch(''); }}>
                  <div>
                    <span className="settings-label">Language</span>
                    <span className="settings-value">{userPrefs.language || 'Not set'}</span>
                  </div>
                  <span className="settings-chevron">›</span>
                </div>

                <div className="settings-row">
                  <div>
                    <span className="settings-label">Currency</span>
                    <span className="settings-value">{userPrefs.currencyCode || 'USD'} — {formatCurrency(1, userPrefs.currencyCode || 'USD', userPrefs.currencyLocale || 'en-US').replace(/[\d.,]/g, '').trim()}</span>
                  </div>
                  <span className="settings-note">Set via Country</span>
                </div>

                <div className="settings-row" onClick={() => setSettingsSection('location')}>
                  <div>
                    <span className="settings-label">Location</span>
                    <span className="settings-value">{userPrefs.location || 'Not set'}</span>
                  </div>
                  <span className="settings-chevron">›</span>
                </div>
              </div>
            )}

            {settingsSection === 'country' && (
              <div>
                <input
                  className="form-input"
                  style={{ marginBottom: '1rem' }}
                  type="text"
                  placeholder="🔍 Search country..."
                  value={settingsCountrySearch}
                  onChange={e => setSettingsCountrySearch(e.target.value)}
                  autoFocus
                />
                <div className="settings-list">
                  {filteredSettingsCountries.map(c => (
                    <div
                      key={c.code}
                      className={`settings-list-item ${userPrefs.countryCode === c.code ? 'settings-list-selected' : ''}`}
                      onClick={() => handleSettingsChangeCountry(c)}
                    >
                      <span>{c.flag} {c.name}</span>
                      {userPrefs.countryCode === c.code && <span>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settingsSection === 'language' && (
              <div>
                <input
                  className="form-input"
                  style={{ marginBottom: '1rem' }}
                  type="text"
                  placeholder="🔍 Search language..."
                  value={settingsLangSearch}
                  onChange={e => setSettingsLangSearch(e.target.value)}
                  autoFocus
                />
                <div className="settings-list">
                  {filteredSettingsLanguages.map(l => (
                    <div
                      key={l.code}
                      className={`settings-list-item ${userPrefs.languageCode === l.code ? 'settings-list-selected' : ''}`}
                      onClick={() => handleSettingsChangeLanguage(l)}
                    >
                      <span>{l.flag} {l.name} <span style={{ color: '#888', fontSize: '0.9em' }}>({l.nativeName})</span></span>
                      {userPrefs.languageCode === l.code && <span>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settingsSection === 'location' && (
              <div className="loc-manual">
                <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Update your location</h4>
                <div className="form-group">
                  <label className="form-label">City / Town: *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={manualLocationForm.city}
                    onChange={e => setManualLocationForm(p => ({ ...p, city: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">State:</label>
                    <input className="form-input" type="text" placeholder="Karnataka"
                      value={manualLocationForm.state}
                      onChange={e => setManualLocationForm(p => ({ ...p, state: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Area:</label>
                    <input className="form-input" type="text" placeholder="Indiranagar"
                      value={manualLocationForm.area}
                      onChange={e => setManualLocationForm(p => ({ ...p, area: e.target.value }))} />
                  </div>
                </div>
                {manualLocationForm.city && (
                  <div className="loc-selected-preview" style={{ marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>New Location:</strong>
                    <p style={{ margin: '0.3rem 0 0 0', fontWeight: 600 }}>
                      {[manualLocationForm.area, manualLocationForm.city, manualLocationForm.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => {
                  if (!manualLocationForm.city.trim()) return;
                  const loc = [manualLocationForm.area, manualLocationForm.city, manualLocationForm.state].filter(Boolean).join(', ');
                  handleSettingsChangeLocationConfirm(loc, 'manual');
                }}>
                  Confirm New Location ✓
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* =========================================
          4. ONLINE PHARMACY DASHBOARD
      ========================================= */}
      {currentScreen === 'pharmacy' && isLoggedIn && (
        <>
          <header style={{
            backgroundColor: 'var(--color-surface)',
            padding: '0.9rem 1.5rem',
            boxShadow: '0 2px 8px rgba(0,67,70,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.8rem',
            borderBottom: '1px solid var(--color-accent)'
          }}>
            <div style={{ color: 'var(--color-primary)', fontSize: '1.6rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => handleTabChange('home')}>
              🏥 Care&Cure Pharmacy
            </div>

            <nav style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => handleTabChange('home')} style={{
                backgroundColor: activeTab === 'home' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'home' ? 'var(--color-white)' : 'var(--color-text-dark)',
                border: activeTab === 'home' ? 'none' : '1px solid var(--color-accent)'
              }}>Home</button>

              <button onClick={() => handleTabChange('shop')} style={{
                backgroundColor: activeTab === 'shop' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'shop' ? 'var(--color-white)' : 'var(--color-text-dark)',
                border: activeTab === 'shop' ? 'none' : '1px solid var(--color-accent)'
              }}>Shop Medicines</button>

              <button onClick={() => handleTabChange('symptoms')} style={{
                backgroundColor: activeTab === 'symptoms' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'symptoms' ? 'var(--color-white)' : 'var(--color-text-dark)',
                border: activeTab === 'symptoms' ? 'none' : '1px solid var(--color-accent)'
              }}>Symptom Checker</button>

              <button onClick={() => handleTabChange('allergy')} style={{
                backgroundColor: activeTab === 'allergy' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'allergy' ? 'var(--color-white)' : 'var(--color-text-dark)',
                border: activeTab === 'allergy' ? 'none' : '1px solid var(--color-accent)'
              }}>Skin Allergy AI</button>

              <button onClick={() => handleTabChange('nearby')} style={{
                backgroundColor: activeTab === 'nearby' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'nearby' ? 'var(--color-white)' : 'var(--color-text-dark)',
                border: activeTab === 'nearby' ? 'none' : '1px solid var(--color-accent)'
              }}>📍 Nearby Care</button>

              <button className="emergency-nav-btn" onClick={() => handleTabChange('emergency')}>
                🚨 Emergency Help
              </button>

              <button onClick={() => handleTabChange('cart')} style={{
                backgroundColor: activeTab === 'cart' ? 'var(--color-primary)' : 'var(--color-white)',
                color: activeTab === 'cart' ? 'var(--color-white)' : 'var(--color-primary)',
                border: '1px solid var(--color-primary)',
                fontWeight: 'bold'
              }}>🛒 Cart ({cart.length})</button>

              <button onClick={() => handleTabChange('orders')} style={{
                backgroundColor: activeTab === 'orders' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'orders' ? 'var(--color-white)' : 'var(--color-text-dark)',
                border: activeTab === 'orders' ? 'none' : '1px solid var(--color-accent)'
              }}>📦 Orders ({orders.length})</button>

              {/* SETTINGS BUTTON */}
              <button
                style={{ backgroundColor: showSettings ? 'var(--color-primary)' : 'transparent', color: showSettings ? 'white' : 'var(--color-text-dark)', border: '1px solid var(--color-accent)' }}
                onClick={() => { setShowSettings(true); setSettingsSection('main'); }}
                id="btn-settings"
              >
                ⚙️ Settings
              </button>

              {/* Currency Badge */}
              {userPrefs.currencyCode && (
                <span style={{
                  backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)',
                  border: '1px solid var(--color-accent)', borderRadius: '20px',
                  padding: '0.4rem 0.8rem', fontSize: '0.85rem', fontWeight: 600
                }}>
                  {COUNTRIES.find(c => c.code === userPrefs.countryCode)?.flag || '🌍'} {userPrefs.currencyCode}
                </span>
              )}

              {/* LOGOUT BUTTON */}
              <button
                style={{ backgroundColor: 'transparent', color: '#d93025', border: '1px solid #d93025', fontWeight: 600 }}
                onClick={() => setShowLogoutConfirm(true)}
              >
                Logout 🚪
              </button>
            </nav>
          </header>

          {/* Payment Processing Overlay */}
          {isPaymentProcessing && (
            <div className="payment-processing-overlay">
              <div className="processing-spinner-large"></div>
              <h3 style={{ color: 'var(--color-white)', fontSize: '1.4rem' }}>🔒 Securing Payment Connection...</h3>
              <p style={{ color: 'var(--color-surface)', marginTop: '0.5rem' }}>Processing transaction securely. Please do not refresh.</p>
            </div>
          )}

          <main className="container mt-5">
            {/* Location Permission Prompt Banner */}
            {locationPermission === 'prompt' && activeTab !== 'emergency' && (
              <div className="location-prompt-banner fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontSize: '2rem' }}>📍</span>
                  <div>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '1.05rem' }}>Enable Location Access</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>
                      Allow Care&Cure to access your location to find nearby medical stores, pharmacies, and hospitals.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <button className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }} onClick={handleGrantLocation}>
                    Allow Location
                  </button>
                  <button className="btn-outline" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }} onClick={() => setLocationPermission('granted')}>
                    Enter Location Manually
                  </button>
                </div>
              </div>
            )}

            {/* HOME TAB */}
            {activeTab === 'home' && (
              <>
                <div className="hero-section text-center">
                  <div className="hero-content">
                    <h1 className="hero-title">
                      Welcome, <span style={{ color: 'var(--color-emphasized)' }}>{user.name}</span>!
                    </h1>
                    {userPrefs.location && (
                      <p style={{ fontSize: '0.95rem', color: 'var(--color-emphasized)', marginBottom: '0.5rem' }}>
                        📍 {userPrefs.location} · {userPrefs.country || 'Global'}
                        {userPrefs.currencyCode && ` · Currency: ${userPrefs.currencyCode}`}
                      </p>
                    )}
                    <p className="hero-text">
                      Access expert AI-driven symptom checks, skin allergy analyses, order over-the-counter medicines, and locate nearby healthcare centers.
                    </p>
                    <div className="hero-buttons">
                      <button className="btn-primary" onClick={() => handleTabChange('shop')}>
                        Shop Medicines
                      </button>
                      <button className="btn-outline" onClick={() => handleTabChange('nearby')}>
                        Find Nearby Care
                      </button>
                    </div>
                  </div>

                  <div className="hero-image-wrapper">
                    <img
                      src="/hero-illustration.png"
                      alt="Pharmacy Illustration"
                      className="hero-img"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="feature-cards">
                  <div className="feature-card" onClick={() => handleTabChange('shop')}>
                    <div className="feature-icon">💎</div>
                    <h3>Verified Pharmacy</h3>
                    <p>Browse our curated store with top-rated over-the-counter medicines ready for swift dispatch.</p>
                  </div>
                  <div className="feature-card" onClick={() => handleTabChange('symptoms')}>
                    <div className="feature-icon">🛡️</div>
                    <h3>Smart Diagnosis</h3>
                    <p>Input your symptoms into our medical AI for instant, reliable product recommendations.</p>
                  </div>
                  <div className="feature-card" onClick={() => handleTabChange('allergy')}>
                    <div className="feature-icon">🌿</div>
                    <h3>Dermatology AI</h3>
                    <p>Upload an image of a skin issue and get targeted syrup and cream treatments in seconds.</p>
                  </div>
                  <div className="feature-card" onClick={() => handleTabChange('nearby')}>
                    <div className="feature-icon">📍</div>
                    <h3>Nearby Hospitals & Stores</h3>
                    <p>Locate nearby 24/7 pharmacies and hospitals with live maps, phone calls, and directions.</p>
                  </div>
                </div>
              </>
            )}

            {/* SHOP TAB */}
            {activeTab === 'shop' && (() => {
              const categoryIcons: Record<string, string> = {
                'All': '🌟',
                'Pain & Fever': '💊',
                'Cold & Allergy': '🤧',
                'Digestion & Stomach': '🍃',
                'Skin & Dermatology': '🧴',
                'Vitamins & Supplements': '🍊',
                'First Aid': '🩹',
                'Eye & Ear Care': '👁️',
                'Joint & Muscle Relief': '🦵',
                'Sleep & Wellness': '🌙',
                'Women & Family': '🌸',
                'Diabetes & Heart': '❤️',
              };

              const allCategories = ['All', 'Pain & Fever', 'Cold & Allergy', 'Digestion & Stomach', 'Skin & Dermatology', 'Vitamins & Supplements', 'First Aid', 'Eye & Ear Care', 'Joint & Muscle Relief', 'Sleep & Wellness', 'Women & Family', 'Diabetes & Heart'];

              const filteredList = storeMedicines.filter((m) => {
                const matchCategory = selectedMedCategory === 'All' || m.category === selectedMedCategory;
                const matchSearch =
                  !medSearchQuery.trim() ||
                  m.name.toLowerCase().includes(medSearchQuery.toLowerCase()) ||
                  m.description.toLowerCase().includes(medSearchQuery.toLowerCase()) ||
                  (m.category && m.category.toLowerCase().includes(medSearchQuery.toLowerCase())) ||
                  (m.dosage_form && m.dosage_form.toLowerCase().includes(medSearchQuery.toLowerCase()));
                return matchCategory && matchSearch;
              }).sort((a, b) => {
                if (medSortOption === 'price-asc') return a.price - b.price;
                if (medSortOption === 'price-desc') return b.price - a.price;
                if (medSortOption === 'rating') return (b.rating || 4.5) - (a.rating || 4.5);
                if (medSortOption === 'name') return a.name.localeCompare(b.name);
                return 0; // featured default
              });

              return (
                <div className="fade-in">
                  {/* Shop Hero Banner */}
                  <div className="shop-hero-banner">
                    <div>
                      <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '2.2rem', color: 'var(--color-primary)' }}>🏥 Verified Pharmacy Store</h2>
                      <p style={{ margin: 0, color: 'var(--color-text-dark)', fontSize: '1rem' }}>
                        Browse over <strong>55+ certified over-the-counter medicines</strong> with door-to-door express delivery.
                      </p>
                      {userPrefs.currencyCode && (
                        <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-emphasized)' }}>
                          Prices formatted in {userPrefs.currencyCode} ({COUNTRIES.find(c => c.code === userPrefs.countryCode)?.flag || ''} {userPrefs.country || 'Global'})
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ backgroundColor: 'var(--color-white)', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid var(--color-accent)', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#666', display: 'block' }}>Available Catalog</span>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{storeMedicines.length || 58}+ Medicines</strong>
                      </div>
                      <div style={{ backgroundColor: 'var(--color-white)', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid var(--color-accent)', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#666', display: 'block' }}>Items in Cart</span>
                        <strong style={{ fontSize: '1.2rem', color: '#00875a' }}>{cart.length} pcs</strong>
                      </div>
                    </div>
                  </div>

                  {/* Shop Filter & Search Controls */}
                  <div className="shop-controls-bar">
                    <div className="shop-search-row">
                      <div className="shop-search-input-wrap">
                        <span className="shop-search-icon">🔍</span>
                        <input
                          type="text"
                          className="shop-search-input"
                          placeholder="Search medicines by name, condition, or keyword (e.g., fever, paracetamol, skin, allergy, cough)..."
                          value={medSearchQuery}
                          onChange={(e) => setMedSearchQuery(e.target.value)}
                        />
                        {medSearchQuery && (
                          <button
                            onClick={() => setMedSearchQuery('')}
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#888' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <select
                        className="shop-sort-select"
                        value={medSortOption}
                        onChange={(e: any) => setMedSortOption(e.target.value)}
                      >
                        <option value="featured">✨ Sort by: Featured</option>
                        <option value="rating">⭐ Top Rated First</option>
                        <option value="price-asc">💵 Price: Low to High</option>
                        <option value="price-desc">💎 Price: High to Low</option>
                        <option value="name">🔤 Alphabetical (A-Z)</option>
                      </select>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="category-pills-scroll">
                      {allCategories.map((cat) => {
                        const count = cat === 'All' ? storeMedicines.length : storeMedicines.filter(m => m.category === cat).length;
                        return (
                          <button
                            key={cat}
                            className={`category-pill ${selectedMedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedMedCategory(cat)}
                          >
                            <span>{categoryIcons[cat] || '💊'}</span>
                            <span>{cat}</span>
                            <span style={{ opacity: 0.8, fontSize: '0.78rem' }}>({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Medicine Products Grid */}
                  {storeMedicines.length === 0 ? (
                    <p style={{ textAlign: 'center', margin: '4rem 0', fontSize: '1.1rem', color: '#666' }}>Loading extensive medicine catalog...</p>
                  ) : filteredList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--color-surface)', borderRadius: '16px' }}>
                      <span style={{ fontSize: '3rem' }}>🔍</span>
                      <h3 style={{ marginTop: '0.8rem', color: 'var(--color-primary)' }}>No medicines found</h3>
                      <p style={{ color: '#666', marginBottom: '1.2rem' }}>No medicines match &quot;{medSearchQuery}&quot; under &quot;{selectedMedCategory}&quot; category.</p>
                      <button className="btn-primary" onClick={() => { setMedSearchQuery(''); setSelectedMedCategory('All'); }}>
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                      {filteredList.map((item, index) => {
                        const qty = medQuantities[item.id] || 1;
                        const isExpanded = expandedGuidanceId === item.id;
                        return (
                          <div key={item.id} className="med-card-enhanced stagger-card" style={{ animationDelay: `${(index % 12) * 0.05}s` }}>
                            {item.badge && (
                              <div className="med-badge-tag">{item.badge}</div>
                            )}

                            <div>
                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                                <div className="med-icon-box">
                                  {categoryIcons[item.category || ''] || '💊'}
                                </div>
                                <div style={{ flex: 1 }}>
                                  {item.dosage_form && (
                                    <span className="med-form-tag">{item.dosage_form}</span>
                                  )}
                                  <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.2rem 0', color: 'var(--color-primary)' }}>
                                    {item.name}
                                  </h3>
                                  <div className="med-rating-row">
                                    <span>⭐ {item.rating || 4.8}</span>
                                    <span>({item.reviews_count || 150}+ reviews)</span>
                                    <span style={{ color: '#00875a', marginLeft: 'auto', fontWeight: 600 }}>✓ In Stock</span>
                                  </div>
                                </div>
                              </div>

                              <p style={{ color: 'var(--color-text-dark)', fontSize: '0.9rem', lineHeight: 1.4, margin: '0 0 0.8rem 0', minHeight: '2.8rem' }}>
                                {item.description}
                              </p>

                              {item.dosage_guidance && (
                                <div>
                                  <button
                                    onClick={() => setExpandedGuidanceId(isExpanded ? null : item.id)}
                                    style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--color-emphasized)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.4rem' }}
                                  >
                                    <span>{isExpanded ? '▾ Hide Dosage Guide' : '▸ View Dosage & Usage'}</span>
                                  </button>
                                  {isExpanded && (
                                    <div className="med-guidance-preview fade-in">
                                      <strong>Dosage Guide:</strong> {item.dosage_guidance}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-surface)', paddingTop: '1rem', marginTop: '0.6rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                <div>
                                  <span style={{ fontSize: '0.75rem', color: '#666', display: 'block' }}>Price</span>
                                  <strong style={{ fontSize: '1.35rem', color: 'var(--color-primary)' }}>
                                    {fmtPrice(item.price * qty)}
                                  </strong>
                                  {qty > 1 && (
                                    <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '4px' }}>
                                      ({fmtPrice(item.price)} each)
                                    </span>
                                  )}
                                </div>

                                <div className="med-qty-control">
                                  <button className="med-qty-btn" onClick={() => updateMedQuantity(item.id, -1)}>−</button>
                                  <span className="med-qty-num">{qty}</span>
                                  <button className="med-qty-btn" onClick={() => updateMedQuantity(item.id, 1)}>+</button>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <button
                                  className="btn-outline"
                                  style={{ flex: 1, padding: '0.55rem 0.5rem', fontSize: '0.88rem' }}
                                  onClick={() => handleAddToCart(item, qty)}
                                >
                                  🛒 Add to Cart
                                </button>
                                <button
                                  className="btn-primary"
                                  style={{ flex: 1, padding: '0.55rem 0.5rem', fontSize: '0.88rem' }}
                                  onClick={() => handleQuickBuy(item, qty)}
                                >
                                  ⚡ Buy Now
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* SYMPTOMS TAB */}
            {activeTab === 'symptoms' && (
              <div className="card fade-in">
                <h2>AI Symptom Checker</h2>
                <p className="mb-4">Describe your symptoms to get professional medicine recommendations.</p>

                <textarea
                  value={symptomsText}
                  onChange={(e) => setSymptomsText(e.target.value)}
                  style={{
                    width: '100%', minHeight: '120px', padding: '1rem',
                    borderRadius: '10px', border: '1px solid var(--color-accent)',
                    backgroundColor: 'var(--color-base)', color: 'var(--color-text-dark)',
                    fontFamily: 'inherit', fontSize: '1rem', marginBottom: '1rem', resize: 'vertical'
                  }}
                  placeholder="E.g., I have a headache, mild fever, and body aches..."
                ></textarea>

                <button onClick={handleAnalyzeSymptoms} disabled={isLoading || !symptomsText.trim()}>
                  {isLoading ? 'Analyzing Symptoms...' : 'Analyze Symptoms'}
                </button>

                {recommendation && (
                  <div className="mt-4" style={{ textAlign: 'left', borderTop: '1px solid var(--color-accent)', paddingTop: '1.5rem' }}>
                    <h3 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Diagnosed Condition: {recommendation.condition}</h3>
                    <h4 style={{ marginBottom: '1rem' }}>Recommended OTC Medicines:</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                      {recommendation.recommended_medicines.map((med: Medicine) => (
                        <div key={med.id} style={{ backgroundColor: 'var(--color-base)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--color-accent)' }}>
                          <h5 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{med.name}</h5>
                          <p style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: 'var(--color-text-dark)' }}>{med.description}</p>
                          <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                            {fmtPrice(med.price)}
                          </p>
                          <button style={{ width: '100%', marginTop: '0.8rem', padding: '0.5rem', fontSize: '0.95rem' }} onClick={() => handleAddToCart(med)}>Add to Cart</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ALLERGY TAB */}
            {activeTab === 'allergy' && (
              <div className="card fade-in">
                <h2>Skin Allergy Image Analysis</h2>
                <p className="mb-4">Upload a clear photo of your skin rash or wound for AI-driven syrup and topical cream suggestions. <em>(Informational guidance; not a medical diagnosis).</em></p>

                <input
                  type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files && e.target.files[0]) handleImageFileSelect(e.target.files[0]); }}
                />

                <div
                  className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleImageFileSelect(e.dataTransfer.files[0]); }}
                >
                  <div style={{ fontSize: '3.5rem', marginBottom: '0.8rem', color: 'var(--color-primary)' }}>📸</div>
                  <h3 style={{ marginBottom: '0.5rem' }}>Click or drag image to upload</h3>
                  <p style={{ color: 'var(--color-text-dark)', opacity: 0.85, fontSize: '0.95rem' }}>Supports JPG, PNG, WEBP (Max 10MB)</p>
                  <button
                    type="button" className="btn-primary" style={{ marginTop: '1.2rem', padding: '0.6rem 1.6rem' }}
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    Upload Image
                  </button>
                </div>

                {uploadState !== 'idle' && (
                  <div className="upload-progress-container fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1rem' }}>{uploadStageText}</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-emphasized)' }}>{uploadProgress}%</span>
                    </div>

                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>

                    <div className="upload-steps-indicator">
                      <div className={`step-item ${uploadProgress >= 35 ? 'completed' : uploadState === 'uploading' ? 'active' : ''}`}>1. Uploading</div>
                      <div className={`step-item ${uploadProgress >= 70 ? 'completed' : uploadState === 'processing' ? 'active' : ''}`}>2. Processing</div>
                      <div className={`step-item ${uploadState === 'complete' ? 'completed' : uploadState === 'analyzing' ? 'active' : ''}`}>3. Analyzing</div>
                    </div>

                    {uploadState === 'complete' && (
                      <div style={{ marginTop: '1rem', padding: '0.8rem', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: '8px', fontWeight: 600, textAlign: 'center' }}>
                        ✅ Image uploaded successfully
                      </div>
                    )}
                  </div>
                )}

                {selectedImagePreview && (
                  <div className="mt-4 fade-in" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', borderTop: '1px solid var(--color-accent)', paddingTop: '1.5rem' }}>
                    <div style={{ flex: '1 1 250px', maxWidth: '320px' }}>
                      <h4 style={{ marginBottom: '0.8rem' }}>Uploaded Image Preview:</h4>
                      <img src={selectedImagePreview} alt="Uploaded Allergy" style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--color-accent)' }} />
                    </div>

                    {allergyResult && (
                      <div style={{ flex: '2 1 300px' }}>
                        <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Detected Condition: {allergyResult.detected_allergy}</h3>
                        <p style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-dark)' }}>
                          <strong>Syrup Recommendation:</strong> {allergyResult.syrup_recommendation}
                        </p>
                        <h4 style={{ marginBottom: '0.8rem' }}>Recommended OTC Treatments:</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                          {allergyResult.other_medicines.map((med: Medicine) => (
                            <div key={med.id} style={{ backgroundColor: 'var(--color-base)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--color-accent)' }}>
                              <h5 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>{med.name}</h5>
                              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dark)', marginBottom: '0.5rem' }}>{med.description}</p>
                              <p style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                {fmtPrice(med.price)}
                              </p>
                              <button style={{ width: '100%', marginTop: '0.5rem', padding: '0.4rem', fontSize: '0.85rem' }} onClick={() => handleAddToCart(med)}>Add to Cart</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* NEARBY HEALTHCARE */}
            {activeTab === 'nearby' && (
              <div className="card fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.3rem 0', color: 'var(--color-primary)' }}>Nearby Healthcare Facilities</h2>
                    <p style={{ color: 'var(--color-text-dark)', margin: 0 }}>
                      Current Set Origin: <strong style={{ color: 'var(--color-primary)' }}>{userAddressText}</strong>
                    </p>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#00875a' }}>
                      ✓ High-accuracy OpenStreetMap geocoding & OSRM turn-by-turn road navigation enabled
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button
                      className={viewMode === 'map' ? 'btn-primary' : 'btn-outline'}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      onClick={() => setViewMode('map')}
                    >
                      🗺️ Interactive Map & Route
                    </button>
                    <button
                      className={viewMode === 'list' ? 'btn-primary' : 'btn-outline'}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      onClick={() => setViewMode('list')}
                    >
                      📋 List View
                    </button>
                  </div>
                </div>

                {/* Location Search Bar & GPS Trigger */}
                <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search any locality, area, landmark, or city (e.g., Koramangala, Bandra, Connaught Place)..."
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleManualLocationSubmit(); }}
                    style={{ flex: 2, minWidth: '240px' }}
                  />
                  <button className="btn-primary" style={{ padding: '0.5rem 1.2rem', whiteSpace: 'nowrap' }} onClick={handleManualLocationSubmit}>
                    📍 Set Location
                  </button>
                  <button className="btn-outline" style={{ padding: '0.5rem 1.2rem', whiteSpace: 'nowrap' }} onClick={handleGrantLocation}>
                    🎯 Detect My GPS
                  </button>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-accent)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
                  <button
                    style={{ backgroundColor: nearbyFilter === 'all' ? 'var(--color-primary)' : 'transparent', color: nearbyFilter === 'all' ? 'white' : 'var(--color-text-dark)', border: '1px solid var(--color-accent)' }}
                    onClick={() => setNearbyFilter('all')}
                  >
                    All Facilities ({facilitiesData.stores.length + facilitiesData.hospitals.length})
                  </button>
                  <button
                    style={{ backgroundColor: nearbyFilter === 'stores' ? 'var(--color-primary)' : 'transparent', color: nearbyFilter === 'stores' ? 'white' : 'var(--color-text-dark)', border: '1px solid var(--color-accent)' }}
                    onClick={() => setNearbyFilter('stores')}
                  >
                    💊 Medical Stores ({facilitiesData.stores.length})
                  </button>
                  <button
                    style={{ backgroundColor: nearbyFilter === 'hospitals' ? 'var(--color-primary)' : 'transparent', color: nearbyFilter === 'hospitals' ? 'white' : 'var(--color-text-dark)', border: '1px solid var(--color-accent)' }}
                    onClick={() => setNearbyFilter('hospitals')}
                  >
                    🏥 Hospitals & ER ({facilitiesData.hospitals.length})
                  </button>
                </div>

                {/* Real-time Interactive Leaflet Map Component */}
                <div style={{ display: viewMode === 'map' ? 'block' : 'none' }}>
                  <InteractiveMap
                    userCoords={userCoords}
                    userAddress={userAddressText}
                    selectedFacility={directionsFacility}
                    onSelectFacility={(fac) => setDirectionsFacility(fac)}
                    facilities={[...facilitiesData.stores, ...facilitiesData.hospitals]}
                    filterType={nearbyFilter}
                  />
                </div>

                {/* Facilities Cards Grid */}
                <h3 style={{ margin: '1.5rem 0 1rem 0', color: 'var(--color-primary)' }}>
                  {nearbyFilter === 'stores' ? 'Nearby Pharmacies & Medical Stores' : nearbyFilter === 'hospitals' ? 'Nearby Hospitals & Emergency Clinics' : 'All Nearby Healthcare Centers'}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {(nearbyFilter === 'all' || nearbyFilter === 'stores') && facilitiesData.stores.map((store) => (
                    <div key={store.id} className="facility-card" style={{ border: directionsFacility?.id === store.id ? '2px solid var(--color-primary)' : '1px solid var(--color-accent)' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1.15rem' }}>💊 {store.name}</h4>
                          <span className="badge-open">{store.openText}</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)', marginBottom: '0.4rem' }}>
                          📍 <strong>{store.distance}</strong> • {store.address}
                        </p>
                        {store.rating && (
                          <p style={{ fontSize: '0.82rem', color: '#666', margin: '0 0 0.4rem 0' }}>
                            ⭐ <strong>{store.rating} / 5.0</strong> • Verified OTC Store
                          </p>
                        )}
                        {store.availableMedicines && (
                          <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: '1rem' }}>
                            <strong>In Stock:</strong> {store.availableMedicines.slice(0, 3).join(', ')}...
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                        <a href={`tel:${store.phone}`} className="btn-outline" style={{ flex: 1, textAlign: 'center', padding: '0.5rem', fontSize: '0.85rem' }}>
                          📞 Call Store
                        </a>
                        <button
                          className="btn-primary"
                          style={{ flex: 1.3, padding: '0.5rem', fontSize: '0.85rem' }}
                          onClick={() => {
                            setDirectionsFacility(store);
                            setViewMode('map');
                          }}
                        >
                          🗺️ Route Directions
                        </button>
                      </div>
                    </div>
                  ))}

                  {(nearbyFilter === 'all' || nearbyFilter === 'hospitals') && facilitiesData.hospitals.map((hosp) => (
                    <div key={hosp.id} className="facility-card" style={{ borderColor: directionsFacility?.id === hosp.id ? '#d93025' : 'rgba(217,48,37,0.3)', borderLeft: '4px solid #d93025' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#b3261e' }}>🏥 {hosp.name}</h4>
                          {hosp.emergencyAvailable && <span className="badge-emergency">Emergency 24/7</span>}
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)', marginBottom: '0.4rem' }}>
                          📍 <strong>{hosp.distance}</strong> • {hosp.address}
                        </p>
                        {hosp.rating && (
                          <p style={{ fontSize: '0.82rem', color: '#666', margin: '0 0 0.8rem 0' }}>
                            ⭐ <strong>{hosp.rating} / 5.0</strong> • Trauma & ICU Ready
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                        <a href={`tel:${hosp.phone}`} className="btn-outline" style={{ flex: 1, textAlign: 'center', padding: '0.5rem', fontSize: '0.85rem', borderColor: '#d93025', color: '#d93025' }}>
                          📞 Call ER
                        </a>
                        <button
                          className="btn-primary"
                          style={{ flex: 1.3, padding: '0.5rem', fontSize: '0.85rem', backgroundColor: '#d93025', borderColor: '#d93025' }}
                          onClick={() => {
                            setDirectionsFacility(hosp);
                            setViewMode('map');
                          }}
                        >
                          🗺️ Emergency Route
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EMERGENCY SECTION */}
            {activeTab === 'emergency' && (
              <div className="card fade-in" style={{ borderColor: '#d93025', backgroundColor: '#fff9f8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #fce8e6', paddingBottom: '1rem' }}>
                  <div style={{ fontSize: '3rem' }}>🚨</div>
                  <div>
                    <h2 style={{ color: '#d93025', margin: 0 }}>Emergency Healthcare Assistance</h2>
                    <p style={{ margin: 0, color: 'var(--color-text-dark)', fontSize: '1rem' }}>Find immediate medical emergency care & ambulance response near you.</p>
                  </div>
                </div>

                <div style={{ backgroundColor: '#fce8e6', padding: '1.5rem', borderRadius: '14px', border: '2px solid #d93025', marginBottom: '2rem', textAlign: 'center' }}>
                  <h3 style={{ color: '#b3261e', marginBottom: '0.5rem' }}>Life-Threatening Emergency?</h3>
                  <p style={{ color: 'var(--color-text-dark)', marginBottom: '1rem' }}>
                    For urgent life-threatening medical emergencies, please dial national ambulance response services directly.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a href="tel:112" className="btn-danger" style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }}>
                      📞 Call National Emergency (112)
                    </a>
                    <a href="tel:108" className="btn-danger" style={{ fontSize: '1.1rem', padding: '0.8rem 2rem', backgroundColor: '#c5221f' }}>
                      🚑 Call Medical Ambulance (108 / 102)
                    </a>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.8rem', margin: '0.8rem 0 0 0' }}>
                    *Care&Cure provides immediate facility routing and directory assistance. Emergency response services are dispatched via certified local providers.
                  </p>
                </div>

                <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Nearby Verified Emergency Facilities:</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {facilitiesData.hospitals.map((hosp) => (
                    <div key={hosp.id} className="facility-card" style={{ border: '2px solid #fce8e6', backgroundColor: 'white' }}>
                      <h4 style={{ color: '#d93025', marginBottom: '0.4rem' }}>🏥 {hosp.name}</h4>
                      <p style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>📍 {hosp.distance} • {hosp.address}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>Emergency Status: 24/7 Verified Desk</p>

                      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                        <a href={`tel:${hosp.phone}`} className="btn-outline" style={{ flex: 1, textAlign: 'center', padding: '0.5rem', fontSize: '0.85rem', borderColor: '#d93025', color: '#d93025' }}>
                          📞 Call Hospital
                        </a>
                        <button
                          className="btn-primary"
                          style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', backgroundColor: '#d93025', borderColor: '#d93025' }}
                          onClick={() => {
                            setDirectionsFacility(hosp);
                            setActiveTab('nearby');
                            setViewMode('map');
                          }}
                        >
                          📍 Get Directions
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CART TAB */}
            {activeTab === 'cart' && (
              <div className="fade-in card">
                <h2>Your Shopping Cart</h2>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ fontSize: '1.2rem', color: 'var(--color-text-dark)', marginBottom: '1.5rem' }}>Your cart is currently empty.</p>
                    <button className="btn-primary" onClick={() => handleTabChange('shop')}>Browse Medicine Store</button>
                  </div>
                ) : (
                  <div className="mt-4">
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {cart.map((item, idx) => (
                        <li key={idx} style={{ padding: '1rem', borderBottom: '1px solid var(--color-accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{item.name}</strong>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)', margin: 0 }}>{item.description}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                              {fmtPrice(item.price)}
                            </span>
                            <button
                              style={{ backgroundColor: 'transparent', color: '#d93025', border: 'none', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '1.2rem' }}
                              onClick={() => setCart((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              🗑️
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div style={{ marginTop: '2rem', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <h3 style={{ fontSize: '1.6rem', color: 'var(--color-text-dark)', marginBottom: '1rem' }}>
                        Total: <span style={{ color: 'var(--color-primary)' }}>{fmtPrice(cart.reduce((s, i) => s + i.price, 0))}</span>
                      </h3>
                      <button className="btn-primary" onClick={handleCheckout}>Proceed to Checkout</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="fade-in card">
                <h2>Your Order History</h2>
                {orders.length === 0 ? (
                  <p className="mt-4">You have not placed any orders yet.</p>
                ) : (
                  <div className="mt-4">
                    {orders.map((order, oidx) => (
                      <div key={oidx} style={{ padding: '1.8rem', border: '1px solid var(--color-accent)', borderRadius: '16px', marginBottom: '2rem', backgroundColor: 'var(--color-white)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-accent)', paddingBottom: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <strong style={{ fontSize: '1.3rem', color: 'var(--color-primary)' }}>Order {order.orderId}</strong>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dark)', margin: 0 }}>Placed on: {order.date}</p>
                          </div>
                          <div>
                            <span style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-dark)', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem' }}>
                              ⏱️ Delivery: {order.deliveryEstimateMinutes} mins
                            </span>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-text-dark)' }}>
                          📍 <strong>Delivery Address:</strong> {order.deliveryAddress}
                        </p>

                        <div style={{ marginBottom: '2rem' }}>
                          <h4 style={{ fontSize: '1rem', color: 'var(--color-text-dark)', marginBottom: '0.5rem' }}>Live Order Status:</h4>
                          <div className="tracking-timeline">
                            <div className="tracking-timeline-fill" style={{ width: '10%' }}></div>
                            <div className="tracking-step active">✓<span className="tracking-label">Order Placed</span></div>
                            <div className="tracking-step">🍳<span className="tracking-label">Preparing</span></div>
                            <div className="tracking-step">🚚<span className="tracking-label">Out for Delivery</span></div>
                            <div className="tracking-step">📦<span className="tracking-label">Delivered</span></div>
                          </div>
                        </div>

                        <h5 style={{ marginBottom: '0.8rem', marginTop: '3.5rem' }}>Items Ordered:</h5>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}>
                          {order.items.map((item, iidx) => (
                            <li key={iidx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                              <span>1x {item.name}</span>
                              <span style={{ fontWeight: 600 }}>{fmtPrice(item.price)}</span>
                            </li>
                          ))}
                        </ul>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem', paddingTop: '0.8rem', borderTop: '2px solid var(--color-accent)' }}>
                          <span style={{ fontSize: '0.95rem', color: 'var(--color-text-dark)' }}>
                            <strong>Payment:</strong> {order.payment}
                          </span>
                          <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            Total: {fmtPrice(order.total)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(23,42,58,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', overflowY: 'auto' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', backgroundColor: 'var(--color-white)', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h2 style={{ color: 'var(--color-primary)', margin: 0 }}>
                {checkoutStep === 1 ? 'Step 1: Confirm Delivery Address' : 'Step 2: Select Payment Method'}
              </h2>
              <button onClick={() => setShowCheckoutModal(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#666', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            {checkoutStep === 1 && (
              <div className="fade-in">
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--color-accent)' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Delivery Recipient & Address</h4>
                  <p style={{ margin: '0 0 0.4rem 0', fontWeight: 600 }}>{user.name} (+91 {user.phone})</p>
                  <p style={{ margin: 0, color: 'var(--color-text-dark)', fontSize: '0.95rem' }}>
                    {user.house}, {user.street}, {user.city}, {user.state} - {user.pincode}
                  </p>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1.5rem' }}>
                  🏥 <strong>Fulfilling Pharmacy:</strong> {facilitiesData.stores[0]?.name || 'Care&Cure Express Pharmacy'} ({facilitiesData.stores[0]?.distance || '0.8 km away'} - Fast Dispatch)
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <button className="btn-outline" onClick={() => setShowCheckoutModal(false)}>
                    Close
                  </button>
                  <button className="btn-primary" onClick={() => setCheckoutStep(2)}>
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === 2 && (
              <div className="fade-in">
                <div style={{ backgroundColor: 'var(--color-surface)', padding: '0.8rem 1.2rem', borderRadius: '10px', marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>Total Order Amount:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {fmtPrice(cart.reduce((s, i) => s + i.price, 0))}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
                  <div className={`payment-method-card ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')}>
                    <div className="payment-radio-circle"></div>
                    <span style={{ fontSize: '1.8rem' }}>💵</span>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--color-text-dark)' }}>Cash on Delivery (COD)</strong>
                      <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>Pay when your order is delivered.</p>
                    </div>
                  </div>

                  <div className={`payment-method-card ${paymentMethod === 'upi' ? 'selected' : ''}`} onClick={() => setPaymentMethod('upi')}>
                    <div className="payment-radio-circle"></div>
                    <span style={{ fontSize: '1.8rem' }}>📱</span>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--color-text-dark)' }}>UPI Payment</strong>
                      <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>Google Pay, PhonePe, Paytm, or UPI ID</p>
                    </div>
                  </div>

                  <div className={`payment-method-card ${paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('card')}>
                    <div className="payment-radio-circle"></div>
                    <span style={{ fontSize: '1.8rem' }}>💳</span>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--color-text-dark)' }}>Wallet / Card Payment</strong>
                      <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>Credit Card, Debit Card, or Prepaid Cards</p>
                    </div>
                  </div>
                </div>

                {paymentMethod === 'upi' && (
                  <div style={{ padding: '1rem', backgroundColor: '#f9fbfb', borderRadius: '10px', border: '1px solid var(--color-accent)', marginBottom: '1.2rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                      <button type="button" className={`btn-outline ${upiApp === 'gpay' ? 'btn-primary' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => { setUpiApp('gpay'); setUpiId('user@okaxis'); }}>Google Pay</button>
                      <button type="button" className={`btn-outline ${upiApp === 'phonepe' ? 'btn-primary' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => { setUpiApp('phonepe'); setUpiId('user@ybl'); }}>PhonePe</button>
                      <button type="button" className={`btn-outline ${upiApp === 'paytm' ? 'btn-primary' : ''}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => { setUpiApp('paytm'); setUpiId('user@paytm'); }}>Paytm</button>
                    </div>
                    <label className="form-label">Enter UPI ID:</label>
                    <input
                      type="text" className={`form-input ${formErrors.upiId ? 'error' : ''}`}
                      value={upiId} onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. name@bank"
                    />
                    {formErrors.upiId && <p className="error-text">{formErrors.upiId}</p>}
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div style={{ padding: '1rem', backgroundColor: '#f9fbfb', borderRadius: '10px', border: '1px solid var(--color-accent)', marginBottom: '1.2rem' }}>
                    <div className="form-group">
                      <label className="form-label">Cardholder Name:</label>
                      <input type="text" className={`form-input ${formErrors.cardName ? 'error' : ''}`} value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="e.g. Jane Doe" />
                      {formErrors.cardName && <p className="error-text">{formErrors.cardName}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Card Number:</label>
                      <input type="text" className={`form-input ${formErrors.cardNumber ? 'error' : ''}`} value={cardNumber} onChange={(e) => handleCardNumberChange(e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} />
                      {formErrors.cardNumber && <p className="error-text">{formErrors.cardNumber}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Expiry Date:</label>
                        <input type="text" className={`form-input ${formErrors.cardExpiry ? 'error' : ''}`} value={cardExpiry} onChange={(e) => handleExpiryChange(e.target.value)} placeholder="MM/YY" maxLength={5} />
                        {formErrors.cardExpiry && <p className="error-text">{formErrors.cardExpiry}</p>}
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">CVV:</label>
                        <input type="password" className={`form-input ${formErrors.cardCvv ? 'error' : ''}`} value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" maxLength={4} />
                        {formErrors.cardCvv && <p className="error-text">{formErrors.cardCvv}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="btn-outline" onClick={() => setCheckoutStep(1)}>← Back</button>
                  <button className="btn-primary" onClick={handleFinalizeCheckout}>
                    Place Order • {fmtPrice(cart.reduce((s, i) => s + i.price, 0))}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIRECTIONS MODAL */}
      {directionsFacility && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(23,42,58,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="card fade-in" style={{ maxWidth: '500px', width: '100%', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>🗺️ Route & Directions</h3>
              <button onClick={() => setDirectionsFacility(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>📍 <strong>From:</strong> {userAddressText}</p>
              <div className="route-line"></div>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                🏁 <strong>To:</strong> {directionsFacility.name} ({directionsFacility.address})
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', margin: '1.5rem 0', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>Distance</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{directionsFacility.distance}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>Driving Time</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>~{Math.round(directionsFacility.distanceKm * 4)} mins</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#666', display: 'block' }}>Walking Time</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>~{Math.round(directionsFacility.distanceKm * 14)} mins</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsFacility.name + ' ' + directionsFacility.address)}`}
                target="_blank" rel="noreferrer" className="btn-primary" style={{ flex: 1, textAlign: 'center', padding: '0.7rem' }}
              >
                Start Navigation in Google Maps 🚀
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ORDER SUCCESS OVERLAY */}
      {currentSuccessOrder && (
        <div className="success-overlay">
          <div className="success-card">
            <div className="success-icon">✓</div>
            <h2 className="success-text">Order Placed Successfully!</h2>
            <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.8rem' }}>
              Order {currentSuccessOrder.orderId}
            </p>

            <div style={{ backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: '12px', margin: '1rem 0', textAlign: 'left' }}>
              <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem' }}><strong>Fulfilling Pharmacy:</strong> {currentSuccessOrder.fulfillingStore}</p>
              <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem' }}><strong>Delivery Address:</strong> {currentSuccessOrder.deliveryAddress}</p>
              <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem' }}><strong>Payment Method:</strong> {currentSuccessOrder.payment}</p>
              <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem' }}><strong>Total Amount:</strong> {fmtPrice(currentSuccessOrder.total)}</p>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                ⏱️ Estimated delivery: {currentSuccessOrder.deliveryEstimateMinutes} minutes
              </p>
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-dark)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Your order has been placed successfully and will be delivered to your address in approximately <strong>{currentSuccessOrder.deliveryEstimateMinutes} minutes</strong>.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button className="btn-outline" onClick={() => { setCurrentSuccessOrder(null); handleTabChange('shop'); }}>
                Continue Shopping
              </button>
              <button className="btn-primary" onClick={() => { setCurrentSuccessOrder(null); handleTabChange('orders'); }}>
                View Order Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(23,42,58,0.6)', zIndex: 4500, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="card fade-in" style={{ maxWidth: '420px', width: '100%', borderRadius: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>🚪</div>
            <h3 style={{ color: 'var(--color-primary)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Confirm Logout</h3>
            <p style={{ color: 'var(--color-text-dark)', fontSize: '1rem', marginBottom: '1.8rem' }}>
              Are you sure you want to logout?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={handleConfirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', color: 'var(--color-text-dark)', opacity: 0.8, borderTop: '1px solid var(--color-accent)', backgroundColor: 'var(--color-surface)' }}>
        &copy; 2026 Care&Cure Pharmaceuticals. Professional Healthcare Startup Platform.
        {userPrefs.country && (
          <span style={{ marginLeft: '1rem', opacity: 0.7 }}>
            {COUNTRIES.find(c => c.code === userPrefs.countryCode)?.flag} {userPrefs.country} · {userPrefs.currencyCode}
          </span>
        )}
      </footer>
    </>
  )
}

export default App

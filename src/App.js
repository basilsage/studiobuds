import './App.css';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, onSnapshot, Timestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import banIcon from './assets/ban.png';
import checkIcon from './assets/check.png';
import cancelWhiteIcon from './assets/cancel-white.png';
import checkWhiteIcon from './assets/check-white.png';
import happyCatIcon from './assets/happy-cat.gif';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB6Hz75T4UOHxe7CNiyEDnMM-KqW4dMEA0",
  authDomain: "studiobuds-1c74e.firebaseapp.com",
  projectId: "studiobuds-1c74e",
  storageBucket: "studiobuds-1c74e.firebasestorage.app",
  messagingSenderId: "607247669238",
  appId: "1:607247669238:web:f5ca43a75c7753874759d7",
  measurementId: "G-W0VVQXHPZN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [user, setUser] = useState(null);
  const [rsvps, setRsvps] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    const q = query(
      collection(db, "rsvps"),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rsvpsByDate = {};
      
      snapshot.forEach((doc) => {
        const rsvp = doc.data();
        const date = rsvp.date instanceof Timestamp ? rsvp.date.toDate() : rsvp.date;
        const dateKey = date.toISOString().split('T')[0];
        
        if (!rsvpsByDate[dateKey]) {
          rsvpsByDate[dateKey] = [];
        }
        rsvpsByDate[dateKey].push({
          id: doc.id,
          ...rsvp
        });
      });
      
      setRsvps(rsvpsByDate);
    });

    return () => unsubscribe();
  }, []);

  // Generate array of next 30 days
  const getNext30Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Format date as "Month Day, Year"
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Add this function to handle RSVP
  const handleRSVP = async (date, timeSlot) => {
    if (!user) return;
    
    // Find existing RSVP for this user and date
    const dateKey = date.toISOString().split('T')[0];
    const existingRsvps = rsvps[dateKey] || [];
    const existingRsvp = existingRsvps.find(rsvp => rsvp.user_id === user.uid);
    
    try {
      if (existingRsvp) {
        // Update existing RSVP
        const updatedTimeSlots = {
          ...existingRsvp,
          [timeSlot]: !existingRsvp[timeSlot]
        };
        
        // If all time slots are false, delete the RSVP
        if (!updatedTimeSlots.morning && !updatedTimeSlots.midday && !updatedTimeSlots.evening) {
          await deleteDoc(doc(db, "rsvps", existingRsvp.id));
        } else {
          // Update the RSVP with new time slot
          await updateDoc(doc(db, "rsvps", existingRsvp.id), {
            [timeSlot]: !existingRsvp[timeSlot],
            updated_at: serverTimestamp()
          });
        }
      } else {
        // Create new RSVP
        const newRsvp = {
          user_id: user.uid,
          user_email: user.email,
          date: date,
          morning: false,
          midday: false,
          evening: false,
          [timeSlot]: true,
          created_at: serverTimestamp(),
        };
        await addDoc(collection(db, "rsvps"), newRsvp);
      }
      
      // Add haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      // setShowSuccessModal(true);
      // setTimeout(() => {
      //   setShowSuccessModal(false);
      // }, 1500);
    } catch (error) {
      console.error("Error updating RSVP:", error);
      alert("Failed to update RSVP. Please try again.");
    }
  };

  // Update getUserRSVP to return the full RSVP object
  const getUserRSVP = (dateRsvps) => {
    return dateRsvps.find(rsvp => rsvp.user_id === user?.uid);
  };

  // Add helper function to get time slot label
  const getTimeSlotLabel = (slot) => {
    switch(slot) {
      case 'morning': return '🌅';
      case 'midday': return '☀️';
      case 'evening': return '🌙';
      default: return slot;
    }
  };

  if (!user) {
    return <LoginModal />;
  }

  return (
    <div className="App p-8">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-30"></div>
          <div className="bg-yellow-50 p-6 border-2 border-orange-300 shadow-[4px_4px_0px_0px_rgba(251,146,60,0.2)] z-50 transform transition-all duration-300 ease-in-out font-mono">
            <div className="flex flex-col items-center space-y-3">
              <img src={happyCatIcon} alt="Success" className="w-16 h-16" />
              <p className="text-sm font-semibold text-gray-800">Excited to see you!</p>
            </div>
            {/* Progress bar container */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-200 rounded-b-lg overflow-hidden">
              {/* Animated progress bar */}
              <div 
                className="h-full bg-orange-500 transition-all duration-1500 ease-linear"
                style={{ 
                  width: '100%',
                  animation: 'shrink 1.5s linear forwards'
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">studiobuds</h1>
        <div className="flex flex-row items-center">
          {/* <p className="mr-4 text-xs text-gray-500">Logged in as {user.email}</p> */}
          <button
            onClick={() => auth.signOut()}
            className="bg-gray-400 text-white px-4 py-2 text-sm rounded hover:bg-gray-500"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {getNext30Days().map((date, index) => {
          const dateKey = date.toISOString().split('T')[0];
          const dateRsvps = rsvps[dateKey] || [];
          // const userRSVP = getUserRSVP(dateRsvps);
          
          return (
            <div 
              key={index}
              className="bg-yellow-50 p-4 border-2 border-orange-300 shadow-[4px_4px_0px_0px_rgba(251,146,60,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(251,146,60,0.3)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all font-mono"
            >
              {/* Title bar */}
              <div className="flex flex-col">
                <div className="flex flex-row justify-between">
                  <p className="text-md font-semibold mr-4">{formatDate(date)}</p> 
                  <p className="text-sm text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                </div>
                
                {/* Buttons */}
                <div className="flex gap-2 mt-2">
                  {['morning', 'midday', 'evening'].map((timeSlot) => {
                    const userRSVP = getUserRSVP(dateRsvps);
                    const isSelected = userRSVP?.[timeSlot] || false;
                    
                    return (
                      <button
                        key={timeSlot}
                        onClick={() => handleRSVP(date, timeSlot)}
                        className={`px-3 py-2 rounded transition-colors text-xs w-1/3 flex justify-between ${
                          isSelected 
                            ? 'bg-orange-300 text-white' // Orange background for selected state
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700' // Gray background for unselected state
                        }`}
                      >
                        {/* Toggle switch container */}
                        <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ease-in-out ${
                          isSelected ? 'bg-orange-200' : 'bg-gray-300' // Background color changes based on selection state
                        }`}>
                          {/* Toggle switch circle/knob that moves left/right */}
                          <div className={`absolute top-0.5 h-3 w-3 rounded-full transition-all duration-300 ease-in-out transform ${
                            isSelected 
                              ? 'bg-orange-500 translate-x-4' // When selected, circle is orange and moved right
                              : 'bg-gray-400 translate-x-0'    // When unselected, circle is gray and moved left
                          }`}></div>
                        </div>
                        {/* Text label for the time slot (morning, midday, evening) */}
                        <span className="text-xs">{getTimeSlotLabel(timeSlot)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* RSVPs display */}
              {dateRsvps.length > 0 && (
                <div className="mt-4">                  
                  <div className="space-y-2">
                    {dateRsvps.map((rsvp) => (
                      <div 
                        key={rsvp.id}
                        className={`flex items-center justify-between bg-yellow-50 rounded p-2 shadow-sm ${
                          rsvp.user_id === user?.uid ? 'border-l-4 border-orange-500' : ''
                        }`}
                      >
                      <div className="flex items-center">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                          <span className="text-sm text-gray-600 mr-3">{rsvp.user_email.split('@')[0]}</span>
                          <div className="flex space-x-2">
                            {['morning', 'midday', 'evening'].map((slot) => (
                              rsvp[slot] && (
                                <span key={slot} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                  {getTimeSlotLabel(slot)}
                                </span>
                              )
                            ))}
                        </div>
                      </div> 
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export default App;

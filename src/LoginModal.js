import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

function LoginModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-6">
      <div className="bg-yellow-50 p-8 border-2 border-orange-300 shadow-[4px_4px_0px_0px_rgba(251,146,60,0.2)] w-full max-w-md font-mono">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isSignUp ? 'Create Account' : 'Login'}
        </h2>
        
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded mb-4 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.2)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-2 border-orange-300 bg-white shadow-[2px_2px_0px_0px_rgba(251,146,60,0.2)] focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-2 border-orange-300 bg-white shadow-[2px_2px_0px_0px_rgba(251,146,60,0.2)] focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 px-4 rounded-md border-2 border-orange-600 shadow-[4px_4px_0px_0px_rgba(251,146,60,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(251,146,60,0.3)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all focus:outline-none"
          >
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 text-sm text-orange-600 hover:text-orange-700 w-full text-center font-medium"
        >
          {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  );
}

export default LoginModal;
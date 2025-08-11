import React from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';

const Login: React.FC = () => {
    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            console.log('User signed in:', result.user);
        } catch (error) {
            console.error('Error signing in with Google:', error);
        }
    };

    const signInAsGuest = async () => {
        try {
            const result = await signInAnonymously(auth);
            console.log('Anonymous user signed in:', result.user);
        } catch (error) {
            console.error('Error signing in anonymously:', error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-600">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Welcome to LifeGuide AI
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Your Personal Growth Assistant
                    </p>
                </div>
                <div className="mt-8 space-y-4">
                    <button
                        onClick={signInWithGoogle}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Sign in with Google
                    </button>
                    
                    <button
                        onClick={signInAsGuest}
                        className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;

import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userType, setUserType] = useState(null); // 'influencer' ou 'brand'
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Inscription Influenceur
    const signUpInfluencer = async (email, password, influencerData) => {
        try {
            // Créer l'utilisateur dans Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Stocker les données dans Firestore
            await setDoc(doc(db, 'influencers', user.uid), {
                uid: user.uid,
                email: email,
                userType: 'influencer',
                name: influencerData.name,
                username: influencerData.username,
                phone: influencerData.phone,
                city: influencerData.city,
                country: influencerData.country,
                category: influencerData.category,
                socialMedia: {
                    instagram: influencerData.instagram || '',
                    tiktok: influencerData.tiktok || '',
                    youtube: influencerData.youtube || ''
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return user;
        } catch (error) {
            throw error;
        }
    };

    // Inscription Marque
    const signUpBrand = async (email, password, brandData) => {
        try {
            // Créer l'utilisateur dans Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Stocker les données dans Firestore (version simplifiée)
            await setDoc(doc(db, 'brands', user.uid), {
                uid: user.uid,
                email: email,
                userType: 'brand',
                fullName: brandData.fullName || '',
                brandName: brandData.brandName || '',
                // Champs optionnels pour compatibilité
                companyName: brandData.companyName || brandData.brandName || '',
                siret: brandData.siret || '',
                industry: brandData.industry || '',
                companySize: brandData.companySize || '',
                description: brandData.description || '',
                contactPerson: brandData.contactPerson || brandData.fullName || '',
                phone: brandData.phone || '',
                website: brandData.website || '',
                address: brandData.address ? {
                    street: brandData.address,
                    city: brandData.city || '',
                    country: brandData.country || ''
                } : {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return user;
        } catch (error) {
            throw error;
        }
    };

    // Connexion
    const signIn = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    };

    // Déconnexion
    const logout = async () => {
        try {
            await signOut(auth);
            setUserData(null);
            setUserType(null);
        } catch (error) {
            throw error;
        }
    };

    // Récupérer les données utilisateur depuis Firestore
    const fetchUserData = async (uid) => {
        try {
            // Vérifier d'abord dans la collection influencers
            let docRef = doc(db, 'influencers', uid);
            let docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUserType('influencer');
                setUserData(docSnap.data());
                return;
            }

            // Sinon vérifier dans la collection brands
            docRef = doc(db, 'brands', uid);
            docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUserType('brand');
                setUserData(docSnap.data());
                return;
            }

            throw new Error('User data not found');
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    };

    // Écouter les changements d'état d'authentification
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    await fetchUserData(user.uid);
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            } else {
                setUserData(null);
                setUserType(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userType,
        userData,
        signUpInfluencer,
        signUpBrand,
        signIn,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
    auth,
    db,
    SEND_WELCOME_EMAIL_URL,
    SEND_VERIFICATION_CODE_URL,
    VERIFY_EMAIL_CODE_URL
} from '../config/firebase';

// Appelle une Cloud Function authentifiée (idToken du user Firebase) et lève une erreur
// avec le message renvoyé par le backend si la requête échoue.
const callAuthenticatedFunction = async (url, user, body) => {
    const idToken = await user.getIdToken();
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`
        },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
    }
    return data;
};

// Envoie (ou renvoie) le code à 6 chiffres permettant de valider l'adresse email.
const sendVerificationCode = (user) => {
    if (!SEND_VERIFICATION_CODE_URL) return Promise.resolve();
    return callAuthenticatedFunction(SEND_VERIFICATION_CODE_URL, user);
};

// Vérifie le code saisi par l'utilisateur ; marque son email comme validé côté Firebase Auth.
const verifyEmailCode = async (user, code) => {
    await callAuthenticatedFunction(VERIFY_EMAIL_CODE_URL, user, { code });
    await user.reload();
};

// Envoie le code de vérification (email/mot de passe uniquement, pas Google/Facebook qui sont
// déjà vérifiés) + l'email de bienvenue (Resend) après la création du compte. Ne doit jamais
// faire échouer l'inscription si l'un de ces envois échoue.
const sendPostSignupEmails = async (user, { verifyEmail = true } = {}) => {
    if (verifyEmail) {
        try {
            await sendVerificationCode(user);
        } catch (error) {
            console.error('Error sending verification code:', error);
        }
    }

    try {
        if (!SEND_WELCOME_EMAIL_URL) return;
        await callAuthenticatedFunction(SEND_WELCOME_EMAIL_URL, user);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};

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
                name: influencerData.name || '',
                username: influencerData.username || '',
                phone: influencerData.phone || '',
                city: influencerData.city || '',
                country: influencerData.country || '',
                category: influencerData.category || '',
                approved: false,
                socialMedia: {
                    instagram: influencerData.instagram || '',
                    tiktok: influencerData.tiktok || '',
                    youtube: influencerData.youtube || ''
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            sendPostSignupEmails(user);

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

            sendPostSignupEmails(user);

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

    // Connexion avec Google
    const signInWithGoogle = async (isInfluencer = true) => {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            // Vérifier si l'utilisateur existe déjà
            const collection = isInfluencer ? 'influencers' : 'brands';
            const docRef = doc(db, collection, user.uid);
            const docSnap = await getDoc(docRef);

            // Si l'utilisateur n'existe pas, créer son profil
            if (!docSnap.exists()) {
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    userType: isInfluencer ? 'influencer' : 'brand',
                    name: user.displayName || '',
                    photoURL: user.photoURL || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (isInfluencer) {
                    userData.socialMedia = {
                        instagram: '',
                        tiktok: '',
                        youtube: ''
                    };
                } else {
                    userData.brandName = '';
                    userData.companyName = '';
                }

                await setDoc(docRef, userData);
                sendPostSignupEmails(user, { verifyEmail: false });
            }

            return user;
        } catch (error) {
            throw error;
        }
    };

    // Connexion avec Facebook
    const signInWithFacebook = async (isInfluencer = true) => {
        try {
            const provider = new FacebookAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            // Vérifier si l'utilisateur existe déjà
            const collection = isInfluencer ? 'influencers' : 'brands';
            const docRef = doc(db, collection, user.uid);
            const docSnap = await getDoc(docRef);

            // Si l'utilisateur n'existe pas, créer son profil
            if (!docSnap.exists()) {
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    userType: isInfluencer ? 'influencer' : 'brand',
                    name: user.displayName || '',
                    photoURL: user.photoURL || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (isInfluencer) {
                    userData.socialMedia = {
                        instagram: '',
                        tiktok: '',
                        youtube: ''
                    };
                } else {
                    userData.brandName = '';
                    userData.companyName = '';
                }

                await setDoc(docRef, userData);
                sendPostSignupEmails(user, { verifyEmail: false });
            }

            return user;
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
        signInWithGoogle,
        signInWithFacebook,
        logout,
        loading,
        sendVerificationCode,
        verifyEmailCode,
        refreshUserData: () => currentUser && fetchUserData(currentUser.uid)
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

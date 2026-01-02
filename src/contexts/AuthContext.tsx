import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup
} from 'firebase/auth'
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { auth, googleProvider, db, storage } from '@/lib/firebase'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  studentId: string
  photoURL: string | null
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  checkEmailExists: (email: string) => Promise<boolean>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
    studentId: string,
    profilePicture?: File
  ) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateUserProfile: (
    displayName: string,
    studentId: string,
    profilePicture?: File | null
  ) => Promise<void>
  deleteAccount: (password?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        const profile = await fetchUserProfile(user.uid)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, 'users', uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile
      }
      return null
    } catch {
      return null
    }
  }

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email)
      return methods.length > 0
    } catch {
      return false
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    studentId: string,
    profilePicture?: File
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    let photoURL: string | null = null

    if (profilePicture) {
      const storageRef = ref(storage, `profile-pictures/${user.uid}`)
      await uploadBytes(storageRef, profilePicture)
      photoURL = await getDownloadURL(storageRef)
    }

    await updateProfile(user, {
      displayName,
      photoURL
    })

    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!.toLowerCase(),
      displayName,
      studentId,
      photoURL,
      createdAt: new Date()
    }

    await setDoc(doc(db, 'users', user.uid), userProfile)
    setUserProfile(userProfile)
  }

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    const existingProfile = await fetchUserProfile(user.uid)
    if (!existingProfile) {
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!.toLowerCase(),
        displayName: user.displayName || 'User',
        studentId: '',
        photoURL: user.photoURL,
        createdAt: new Date()
      }
      await setDoc(doc(db, 'users', user.uid), userProfile)
      setUserProfile(userProfile)
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setUserProfile(null)
  }

  const updateUserProfile = async (
    displayName: string,
    studentId: string,
    profilePicture?: File | null
  ) => {
    if (!user || !userProfile) throw new Error('No user logged in')

    let photoURL = userProfile.photoURL

    // Handle profile picture update
    if (profilePicture) {
      const storageRef = ref(storage, `profile-pictures/${user.uid}`)
      await uploadBytes(storageRef, profilePicture)
      photoURL = await getDownloadURL(storageRef)
    } else if (profilePicture === null && userProfile.photoURL) {
      // User wants to remove profile picture
      try {
        const storageRef = ref(storage, `profile-pictures/${user.uid}`)
        await deleteObject(storageRef)
      } catch {
        // File might not exist, ignore
      }
      photoURL = null
    }

    // Update Firebase Auth profile
    await updateProfile(user, {
      displayName,
      photoURL
    })

    // Update Firestore profile
    const updatedProfile: UserProfile = {
      ...userProfile,
      displayName,
      studentId,
      photoURL
    }

    await setDoc(doc(db, 'users', user.uid), updatedProfile)
    setUserProfile(updatedProfile)
  }

  const deleteAccount = async (password?: string) => {
    if (!user) throw new Error('No user logged in')

    // Re-authenticate user before deletion
    const providerId = user.providerData[0]?.providerId
    if (providerId === 'google.com') {
      await reauthenticateWithPopup(user, googleProvider)
    } else if (providerId === 'password' && password) {
      const credential = EmailAuthProvider.credential(user.email!, password)
      await reauthenticateWithCredential(user, credential)
    } else {
      throw new Error('Password required for re-authentication')
    }

    // Delete profile picture from storage
    try {
      const storageRef = ref(storage, `profile-pictures/${user.uid}`)
      await deleteObject(storageRef)
    } catch {
      // File might not exist, ignore
    }

    // Delete user document from Firestore
    await deleteDoc(doc(db, 'users', user.uid))

    // Delete Firebase Auth user
    await deleteUser(user)

    setUserProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        checkEmailExists,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        updateUserProfile,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

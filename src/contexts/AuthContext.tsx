import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
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
      email: user.email!,
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
        email: user.email!,
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
        signOut
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

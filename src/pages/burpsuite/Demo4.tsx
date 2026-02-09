import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Generate UUID helper (same as server)
const generateUUID = (seed: number): string => {
  const hash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
  const h = hash(seed.toString());
  return `${h.toString(16).padStart(8, '0')}-${(h >> 8).toString(16).padStart(4, '0')}-4${(h >> 12).toString(16).padStart(3, '0')}-${(h >> 16).toString(16).padStart(4, '0')}-${h.toString(16).padStart(12, '0')}`.slice(0, 36);
};

interface UserPreview {
  uid: number;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  isPrivate: boolean;
}

interface Photo {
  id: number;
  url: string;
  caption: string;
}

interface ProfileData {
  uid: number;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  isPrivate: boolean;
  followers: number;
  following: number;
  posts: number;
  joinedDate: string;
  followedBy?: UserPreview[];
  publicData: {
    location: string;
    website: string;
    recentPhotos: Photo[];
  };
  privateData?: {
    email: string;
    phone: string;
    ssn: string;
    savedPayments: string[];
    privateNotes: string;
    secretPhotos?: Photo[];
  };
  message?: string;
  flag?: string;
  methodology?: string;
}

interface ApiResponse {
  success: boolean;
  profile?: ProfileData;
  accessGranted?: boolean;
  message?: string;
}

// Mock feed users for the main page
const feedUsers: UserPreview[] = [
  { uid: 1043, username: "maya_design", displayName: "Maya Rodriguez", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya", bio: "UI/UX Designer | Minimalist", isPrivate: false },
  { uid: 1044, username: "dev_jordan", displayName: "Jordan Blake", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan", bio: "Full-stack dev | Open source", isPrivate: false },
  { uid: 1045, username: "sarah_sec", displayName: "Sarah Mitchell", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah", bio: "Pentester by day | CTF player by night", isPrivate: true },
  { uid: 1046, username: "tech_sam", displayName: "Sam Patel", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam", bio: "Cloud architect | AWS certified", isPrivate: false },
  { uid: 1047, username: "emma_data", displayName: "Emma Williams", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma", bio: "Data scientist | ML researcher", isPrivate: false },
  { uid: 1048, username: "crypto_mike", displayName: "Michael Torres", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike", bio: "Blockchain developer | Web3 builder", isPrivate: false },
  { uid: 1049, username: "lisa_net", displayName: "Lisa Nakamura", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa", bio: "Network engineer | CCNP certified", isPrivate: false },
  { uid: 1050, username: "ryan_ops", displayName: "Ryan Cooper", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ryan", bio: "SRE | Incident commander", isPrivate: false },
  { uid: 1051, username: "nina_sec", displayName: "Nina Volkov", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nina", bio: "AppSec engineer | Bug crusher", isPrivate: false },
];

const CURRENT_USER_ID = 1042;
const CURRENT_USER_UUID = generateUUID(CURRENT_USER_ID);

function Demo4() {
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = async (uid: number) => {
    setLoading(true);
    setError("");
    setSelectedProfile(null);

    try {
      // Create the query object - this is what can be manipulated in Burp
      const queryObj = {
        uid: uid,
        view: "public",
        requester_uuid: CURRENT_USER_UUID // This is the vulnerable field
      };

      // Base64 encode the query
      const encodedQuery = btoa(JSON.stringify(queryObj));

      const response = await fetch(`/api/burpsuite/hive/profile?q=${encodedQuery}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Request-UUID": CURRENT_USER_UUID, // Also exposed in header for easy discovery
        },
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.profile) {
        setSelectedProfile(data.profile);
      } else {
        setError(data.message || "Failed to load profile");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
      console.error("API Error:", err);
    }

    setLoading(false);
  };

  const ProfileModal = () => {
    if (!selectedProfile) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-4">
              <img
                src={selectedProfile.avatar}
                alt={selectedProfile.displayName}
                className="w-20 h-20 rounded-full border-2 border-gray-200"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{selectedProfile.displayName}</h2>
                  {selectedProfile.isPrivate && (
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-gray-500">@{selectedProfile.username}</p>
                <p className="text-gray-700 mt-1">{selectedProfile.bio}</p>
              </div>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <div className="font-bold text-gray-900">{selectedProfile.posts}</div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{selectedProfile.followers}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900">{selectedProfile.following}</div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Private account notice */}
            {selectedProfile.isPrivate && selectedProfile.message && !selectedProfile.flag && (
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">This Account is Private</span>
                </div>
                <p className="text-gray-600 text-sm mt-2">{selectedProfile.message}</p>
              </div>
            )}

            {/* Followers list for private accounts - HINT for attackers */}
            {selectedProfile.isPrivate && selectedProfile.followedBy && selectedProfile.followedBy.length > 0 && !selectedProfile.flag && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Followed by</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedProfile.followedBy.map((follower) => (
                    <div
                      key={follower.uid}
                      className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1"
                    >
                      <img src={follower.avatar} alt={follower.displayName} className="w-6 h-6 rounded-full" />
                      <span className="text-sm text-gray-700">@{follower.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success - Flag found! */}
            {selectedProfile.flag && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-green-800">Access Granted!</h3>
                </div>
                <div className="bg-white border border-green-300 rounded p-4 mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">FLAG:</p>
                  <code className="text-lg text-green-700 font-mono font-bold">{selectedProfile.flag}</code>
                </div>
                {selectedProfile.methodology && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm font-medium text-blue-900 mb-1">Solution:</p>
                    <p className="text-xs text-blue-800">{selectedProfile.methodology}</p>
                  </div>
                )}
              </div>
            )}

            {/* Private data if access granted */}
            {selectedProfile.privateData && selectedProfile.flag && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Private Data Exposed
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{selectedProfile.privateData.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{selectedProfile.privateData.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Notes</p>
                    <p className="font-medium text-gray-900">{selectedProfile.privateData.privateNotes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Location & Website */}
            {selectedProfile.publicData && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {selectedProfile.publicData.location !== "Private" && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{selectedProfile.publicData.location}</span>
                    </div>
                  )}
                  {selectedProfile.publicData.website !== "Private" && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span>{selectedProfile.publicData.website}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Joined {selectedProfile.joinedDate}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Photos Grid */}
            {selectedProfile.publicData?.recentPhotos && selectedProfile.publicData.recentPhotos.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Recent Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {selectedProfile.publicData.recentPhotos.map((photo) => (
                    <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for private accounts */}
            {selectedProfile.isPrivate && (!selectedProfile.publicData?.recentPhotos || selectedProfile.publicData.recentPhotos.length === 0) && !selectedProfile.flag && (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No photos available</p>
                <p className="text-sm text-gray-400 mt-1">Follow this account to see their content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <img src="/hive.png" alt="The Hive" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-bold text-gray-900">The Hive</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Logged in as</span>
              <div className="flex items-center gap-2">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=alex"
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium text-gray-900">@alex_cyber</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Current User Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=alex"
              alt="Your profile"
              className="w-16 h-16 rounded-full border-2 border-amber-500"
            />
            <div>
              <h2 className="font-bold text-gray-900">Alex Chen</h2>
              <p className="text-gray-500">@alex_cyber</p>
              <p className="text-xs text-gray-400 mt-1">User ID: {CURRENT_USER_ID}</p>
            </div>
          </div>
        </div>

        {/* Suggested Users */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Discover People</h2>
            <p className="text-sm text-gray-500">Find friends and creators to follow</p>
          </div>
          <div className="divide-y divide-gray-100">
            {feedUsers.map((user) => (
              <div
                key={user.uid}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => fetchProfile(user.uid)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 truncate">
                        {user.displayName}
                      </span>
                      {user.isPrivate && (
                        <svg className="w-4 h-4 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm truncate">@{user.username}</p>
                    <p className="text-gray-600 text-sm truncate mt-1">{user.bio}</p>
                  </div>
                  <button className="px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-full hover:bg-amber-600 transition-colors shrink-0">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back to demos link */}
        <div className="text-center">
          <Link
            to="/burpsuite"
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            ← Back to Burp Suite Demos
          </Link>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-700">Loading profile...</span>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal />
    </div>
  );
}

export default Demo4;

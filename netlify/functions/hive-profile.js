// The Hive - Social Media Profile API
// Vulnerable to IDOR via UUID manipulation

// Generate a deterministic UUID-like string for each user
const generateUUID = (seed) => {
  const hash = (str) => {
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

// Fake user database with 10+ users
const users = {
  1042: {
    uid: 1042,
    uuid: generateUUID(1042),
    username: "alex_cyber",
    displayName: "Alex Chen",
    bio: "Security researcher | Bug bounty hunter | Coffee addict",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    isPrivate: false,
    followers: [1043, 1045, 1048, 1050],
    following: [1043, 1044, 1045, 1046],
    posts: 47,
    joinedDate: "2023-03-15",
    publicData: {
      location: "San Francisco, CA",
      website: "https://alexchen.dev",
      recentPhotos: [
        { id: 1, url: "https://picsum.photos/seed/alex1/400/400", caption: "Conference talk at DEF CON" },
        { id: 2, url: "https://picsum.photos/seed/alex2/400/400", caption: "Late night hacking session" },
        { id: 3, url: "https://picsum.photos/seed/alex3/400/400", caption: "New setup who dis" },
      ]
    },
    privateData: {
      email: "alex.chen@proton.me",
      phone: "+1-555-0142",
      ssn: "XXX-XX-1042",
      savedPayments: ["Visa ending in 4242"],
      privateNotes: "Working on Project Stinger - do not share"
    }
  },
  1043: {
    uid: 1043,
    uuid: generateUUID(1043),
    username: "maya_design",
    displayName: "Maya Rodriguez",
    bio: "UI/UX Designer | Minimalist | Travel enthusiast",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
    isPrivate: false,
    followers: [1042, 1044, 1046, 1047, 1049],
    following: [1042, 1045, 1048],
    posts: 124,
    joinedDate: "2022-11-20",
    publicData: {
      location: "Austin, TX",
      website: "https://mayarod.design",
      recentPhotos: [
        { id: 1, url: "https://picsum.photos/seed/maya1/400/400", caption: "New portfolio piece" },
        { id: 2, url: "https://picsum.photos/seed/maya2/400/400", caption: "Design workshop" },
        { id: 3, url: "https://picsum.photos/seed/maya3/400/400", caption: "Creative space vibes" },
      ]
    },
    privateData: {
      email: "maya.r@gmail.com",
      phone: "+1-555-0143",
      ssn: "XXX-XX-1043",
      savedPayments: ["Mastercard ending in 8888"],
      privateNotes: "Client contracts in progress - NDA signed"
    }
  },
  1044: {
    uid: 1044,
    uuid: generateUUID(1044),
    username: "dev_jordan",
    displayName: "Jordan Blake",
    bio: "Full-stack dev | Open source contributor | Linux nerd",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
    isPrivate: false,
    followers: [1043, 1045, 1046, 1048, 1050, 1051],
    following: [1042, 1043, 1047],
    posts: 89,
    joinedDate: "2022-08-05",
    publicData: {
      location: "Seattle, WA",
      website: "https://github.com/jordanblake",
      recentPhotos: [
        { id: 1, url: "https://picsum.photos/seed/jordan1/400/400", caption: "Just merged my 100th PR" },
        { id: 2, url: "https://picsum.photos/seed/jordan2/400/400", caption: "Home office upgrade" },
        { id: 3, url: "https://picsum.photos/seed/jordan3/400/400", caption: "Hackathon victory" },
      ]
    },
    privateData: {
      email: "jordan.blake@dev.io",
      phone: "+1-555-0144",
      ssn: "XXX-XX-1044",
      savedPayments: ["Visa ending in 1234"],
      privateNotes: "New startup idea: encrypted messaging app"
    }
  },
  1045: {
    uid: 1045,
    uuid: generateUUID(1045),
    username: "sarah_sec",
    displayName: "Sarah Mitchell",
    bio: "Pentester by day | CTF player by night | OSCP certified",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    isPrivate: true,  // PRIVATE ACCOUNT - target for IDOR
    followers: [1043, 1046, 1048],  // Users who follow this account (NOT alex)
    following: [1042, 1044, 1047, 1048],
    posts: 56,
    joinedDate: "2023-01-10",
    allowedViewers: [1043, 1046, 1048],  // Users allowed to view private content (NOT alex - he must exploit IDOR)
    publicData: {
      location: "Private",
      website: "Private",
      recentPhotos: []  // Empty for non-followers
    },
    privateData: {
      email: "sarah.mitchell@secfirm.com",
      phone: "+1-555-0145",
      ssn: "XXX-XX-1045",
      savedPayments: ["Amex ending in 0045"],
      privateNotes: "Red team credentials stored in secure vault - access restricted",
      secretPhotos: [
        { id: 1, url: "https://picsum.photos/seed/sarahsecret1/400/400", caption: "Red team engagement planning" },
        { id: 2, url: "https://picsum.photos/seed/sarahsecret2/400/400", caption: "Zero-day research notes" },
        { id: 3, url: "https://picsum.photos/seed/sarahsecret3/400/400", caption: "Internal pentest findings - CONFIDENTIAL" },
      ]
    }
  },
  1046: {
    uid: 1046,
    uuid: generateUUID(1046),
    username: "tech_sam",
    displayName: "Sam Patel",
    bio: "Cloud architect | AWS certified | DevOps enthusiast",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
    isPrivate: false,
    followers: [1042, 1044, 1045, 1047, 1049],
    following: [1043, 1044, 1045, 1050],
    posts: 73,
    joinedDate: "2022-09-30",
    publicData: {
      location: "Denver, CO",
      website: "https://sampatel.cloud",
      recentPhotos: [
        { id: 1, url: "https://picsum.photos/seed/sam1/400/400", caption: "AWS re:Invent 2024" },
        { id: 2, url: "https://picsum.photos/seed/sam2/400/400", caption: "Infrastructure diagram art" },
        { id: 3, url: "https://picsum.photos/seed/sam3/400/400", caption: "Kubernetes cluster viz" },
      ]
    },
    privateData: {
      email: "sam.patel@cloudops.co",
      phone: "+1-555-0146",
      ssn: "XXX-XX-1046",
      savedPayments: ["Visa ending in 9999"],
      privateNotes: "Client AWS credentials - rotate monthly"
    }
  },
  1047: {
    uid: 1047,
    uuid: generateUUID(1047),
    username: "emma_data",
    displayName: "Emma Williams",
    bio: "Data scientist | ML researcher | Python lover",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    isPrivate: false,
    followers: [1043, 1044, 1046, 1048, 1050, 1051],
    following: [1042, 1044, 1045, 1049],
    posts: 98,
    joinedDate: "2022-06-18",
    publicData: {
      location: "Boston, MA",
      website: "https://emmawilliams.ai",
      recentPhotos: [
        { id: 1, url: "https://picsum.photos/seed/emma1/400/400", caption: "NeurIPS presentation" },
        { id: 2, url: "https://picsum.photos/seed/emma2/400/400", caption: "Model training progress" },
        { id: 3, url: "https://picsum.photos/seed/emma3/400/400", caption: "Data viz experiment" },
      ]
    },
    privateData: {
      email: "emma.w@datascience.org",
      phone: "+1-555-0147",
      ssn: "XXX-XX-1047",
      savedPayments: ["Mastercard ending in 5555"],
      privateNotes: "Research grant proposal - deadline Feb 28"
    }
  },
  1048: {
    uid: 1048,
    uuid: generateUUID(1048),
    username: "crypto_mike",
    displayName: "Michael Torres",
    bio: "Blockchain developer | Smart contracts | Web3 builder",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    isPrivate: false,
    followers: [1042, 1045, 1047, 1049, 1050],
    following: [1043, 1046, 1051],
    posts: 112,
    joinedDate: "2022-04-22",
    publicData: {
      location: "Miami, FL",
      website: "https://miketorres.eth",
      recentPhotos: [
        { id: 1, url: "https://picsum.photos/seed/mike1/400/400", caption: "ETHDenver vibes" },
        { id: 2, url: "https://picsum.photos/seed/mike2/400/400", caption: "New NFT collection preview" },
        { id: 3, url: "https://picsum.photos/seed/mike3/400/400", caption: "Smart contract audit complete" },
      ]
    },
    privateData: {
      email: "mike.t@web3labs.io",
      phone: "+1-555-0148",
      ssn: "XXX-XX-1048",
      savedPayments: ["Crypto wallet: 0x742d..."],
      privateNotes: "Private keys backup location: encrypted drive"
    }
  },
  1049: {
    uid: 1049,
    uuid: generateUUID(1049),
    username: "lisa_net",
    displayName: "Lisa Nakamura",
    bio: "Network engineer | CCNP certified | Packet whisperer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
    isPrivate: false,
    followers: [1046, 1047, 1050, 1051],
    following: [1042, 1043, 1048],
    posts: 41,
    joinedDate: "2023-02-14",
    publicData: {
      location: "Portland, OR",
      website: "https://lisanet.ninja",
      recentPhotos: [
        { id: 1, url: "https://picsum.photos/seed/lisa1/400/400", caption: "Network diagram masterpiece" },
        { id: 2, url: "https://picsum.photos/seed/lisa2/400/400", caption: "Cisco Live 2024" },
        { id: 3, url: "https://picsum.photos/seed/lisa3/400/400", caption: "Lab setup complete" },
      ]
    },
    privateData: {
      email: "lisa.nakamura@netops.net",
      phone: "+1-555-0149",
      ssn: "XXX-XX-1049",
      savedPayments: ["Visa ending in 7777"],
      privateNotes: "Core router credentials - change quarterly"
    }
  },
  1050: {
    uid: 1050,
    uuid: generateUUID(1050),
    username: "ryan_ops",
    displayName: "Ryan Cooper",
    bio: "SRE | Incident commander | On-call survivor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ryan",
    isPrivate: false,
    followers: [1042, 1044, 1047, 1048, 1049],
    following: [1043, 1046, 1047, 1051],
    posts: 67,
    joinedDate: "2022-12-01",
    publicData: {
      location: "Chicago, IL",
      website: "https://ryancooper.dev",
      recentPhotos: [
        { id: 1, url: "https://picsum.photos/seed/ryan1/400/400", caption: "3AM incident response" },
        { id: 2, url: "https://picsum.photos/seed/ryan2/400/400", caption: "Grafana dashboard porn" },
        { id: 3, url: "https://picsum.photos/seed/ryan3/400/400", caption: "Finally hit 99.99% uptime" },
      ]
    },
    privateData: {
      email: "ryan.c@techops.io",
      phone: "+1-555-0150",
      ssn: "XXX-XX-1050",
      savedPayments: ["Amex ending in 3333"],
      privateNotes: "PagerDuty escalation policy - update monthly"
    }
  },
  1051: {
    uid: 1051,
    uuid: generateUUID(1051),
    username: "nina_sec",
    displayName: "Nina Volkov",
    bio: "AppSec engineer | SAST/DAST ninja | Bug crusher",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nina",
    isPrivate: false,
    followers: [1044, 1047, 1049, 1050],
    following: [1042, 1045, 1048],
    posts: 83,
    joinedDate: "2022-10-15",
    publicData: {
      location: "New York, NY",
      website: "https://ninavolkov.sec",
      recentPhotos: [
        { id: 1, url: "https://picsum.photos/seed/nina1/400/400", caption: "Found another SQLi" },
        { id: 2, url: "https://picsum.photos/seed/nina2/400/400", caption: "OWASP meetup" },
        { id: 3, url: "https://picsum.photos/seed/nina3/400/400", caption: "Vulnerability disclosure day" },
      ]
    },
    privateData: {
      email: "nina.v@appsec.team",
      phone: "+1-555-0151",
      ssn: "XXX-XX-1051",
      savedPayments: ["Mastercard ending in 2222"],
      privateNotes: "Pending bug bounty payouts: $12,500"
    }
  }
};

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Request-UUID',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const url = new URL(req.url);
    const qParam = url.searchParams.get('q');

    if (!qParam) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing query parameter' }),
        { status: 400, headers }
      );
    }

    // Decode Base64 and parse JSON
    let queryData;
    try {
      const decoded = atob(qParam);
      queryData = JSON.parse(decoded);
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid query format' }),
        { status: 400, headers }
      );
    }

    const { uid, view, requester_uuid } = queryData;

    // Find the requested user
    const user = users[uid];
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: 'User not found' }),
        { status: 404, headers }
      );
    }

    // Add response headers that leak UUID info (visible in Burp)
    const responseHeaders = {
      ...headers,
      'X-Profile-UUID': user.uuid,
      'X-Request-Processed': 'true',
      'X-Privacy-Level': user.isPrivate ? 'private' : 'public',
    };

    // VULNERABILITY: The server checks requester_uuid against allowedViewers
    // but doesn't validate if the requester_uuid actually belongs to the session
    // An attacker can use another user's UUID to bypass privacy restrictions

    if (user.isPrivate) {
      // Check if requester is allowed to view
      // Find user by UUID
      let requesterUid = null;
      for (const [id, u] of Object.entries(users)) {
        if (u.uuid === requester_uuid) {
          requesterUid = parseInt(id);
          break;
        }
      }

      // Check if requester is in allowed viewers
      if (!requesterUid || !user.allowedViewers.includes(requesterUid)) {
        // Return limited profile for non-followers
        return new Response(
          JSON.stringify({
            success: true,
            profile: {
              uid: user.uid,
              username: user.username,
              displayName: user.displayName,
              bio: user.bio,
              avatar: user.avatar,
              isPrivate: true,
              followers: user.followers.length,
              following: user.following.length,
              posts: user.posts,
              joinedDate: user.joinedDate,
              // List who follows this private account (hint for attacker)
              followedBy: user.followers.map(fid => ({
                uid: fid,
                username: users[fid]?.username,
                displayName: users[fid]?.displayName,
                avatar: users[fid]?.avatar
              })),
              message: "This account is private. Only approved followers can see their content.",
              publicData: {
                location: "Private",
                website: "Private",
                recentPhotos: []
              }
            }
          }),
          { status: 200, headers: responseHeaders }
        );
      }

      // Authorized viewer - return full private data (this is the "win" state)
      return new Response(
        JSON.stringify({
          success: true,
          accessGranted: true,
          profile: {
            uid: user.uid,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            avatar: user.avatar,
            isPrivate: true,
            followers: user.followers.length,
            following: user.following.length,
            posts: user.posts,
            joinedDate: user.joinedDate,
            publicData: {
              location: user.privateData.email.split('@')[1],
              website: "https://sarah-sec.com",
              recentPhotos: user.privateData.secretPhotos
            },
            privateData: user.privateData
          }
        }),
        { status: 200, headers: responseHeaders }
      );
    }

    // Public profile - return standard public data
    return new Response(
      JSON.stringify({
        success: true,
        profile: {
          uid: user.uid,
          username: user.username,
          displayName: user.displayName,
          bio: user.bio,
          avatar: user.avatar,
          isPrivate: false,
          followers: user.followers.length,
          following: user.following.length,
          posts: user.posts,
          joinedDate: user.joinedDate,
          publicData: user.publicData
        }
      }),
      { status: 200, headers: responseHeaders }
    );

  } catch (error) {
    console.error('[Hive Profile] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers }
    );
  }
};

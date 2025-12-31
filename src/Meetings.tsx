import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Footer from './components/Footer'

export interface Announcement {
  id: string
  title: string
  content: string
  date: string
}

export interface Photo {
  id: string
  url: string
  caption?: string
}

export interface Resource {
  id: string
  title: string
  url: string
  type: 'slides' | 'video' | 'link' | 'file'
}

export interface Meeting {
  id: string
  title: string
  description: string
  date: string // ISO date string
  time: string
  location: string
  type: 'workshop' | 'lecture' | 'ctf' | 'social' | 'general'
  featured: boolean
  topics?: string[]
  announcements?: Announcement[]
  photos?: Photo[]
  resources?: Resource[]
}

// Sample meeting data - replace with Firebase data later
export const MEETINGS_DATA: Meeting[] = [
  {
    id: '1',
    title: 'Introduction to Ethical Hacking',
    description: 'Learn the fundamentals of ethical hacking and penetration testing. We\'ll cover reconnaissance, scanning, and basic exploitation techniques.',
    date: '2025-01-15',
    time: '4:00 PM - 6:00 PM',
    location: 'S43 Room 120',
    type: 'workshop',
    featured: true,
    topics: ['Penetration Testing', 'Kali Linux', 'Nmap'],
    announcements: [
      {
        id: 'a1',
        title: 'Bring Your Laptop!',
        content: 'Make sure to bring your laptop with Kali Linux installed (VM is fine). We\'ll have a hands-on lab portion where you\'ll be running actual scans and reconnaissance techniques. If you need help setting up your VM, drop by our Discord #tech-support channel and we\'ll walk you through it. Don\'t have a laptop? Let us know and we can pair you up with someone.',
        date: '2025-01-13'
      },
      {
        id: 'a2',
        title: 'Pre-Workshop Setup Guide',
        content: 'Check the resources tab for the VM setup guide. Complete this before the workshop to hit the ground running! The guide covers VirtualBox installation, Kali Linux ISO download, and basic configuration. We recommend allocating at least 4GB RAM and 40GB storage for your VM. If you run into any issues during setup, post in Discord and we\'ll help troubleshoot.',
        date: '2025-01-10'
      }
    ],
    photos: [
      { id: 'p1', url: '/photos/ethical-hacking-1.jpg', caption: 'Setting up Kali Linux VMs' },
      { id: 'p2', url: '/photos/ethical-hacking-2.jpg', caption: 'Nmap scanning demo' }
    ],
    resources: [
      { id: 'r1', title: 'Kali Linux VM Setup Guide', url: '#', type: 'file' },
      { id: 'r2', title: 'Nmap Cheat Sheet', url: 'https://www.stationx.net/nmap-cheat-sheet/', type: 'link' },
      { id: 'r3', title: 'Workshop Slides', url: '#', type: 'slides' }
    ]
  },
  {
    id: '2',
    title: 'Security+ Study Session',
    description: 'Group study session for CompTIA Security+ certification. Focus on domain 1: Attacks, Threats, and Vulnerabilities.',
    date: '2025-01-22',
    time: '3:00 PM - 5:00 PM',
    location: 'Library Study Room 3',
    type: 'lecture',
    featured: true,
    topics: ['Security+', 'Certification', 'Study Group'],
    announcements: [
      {
        id: 'a1',
        title: 'Study Materials Ready',
        content: 'Professor Messer videos for Domain 1 are linked in resources. Watch before the session for better discussion! We\'ll be covering Attacks, Threats, and Vulnerabilities which makes up about 24% of the exam. Bring any questions you have from the videos and we\'ll work through them together. Pro tip: take notes on the acronyms - there are a lot of them!',
        date: '2025-01-20'
      }
    ],
    photos: [
      { id: 'p1', url: '/photos/security-plus-1.jpg', caption: 'Group study session in progress' },
      { id: 'p2', url: '/photos/security-plus-2.jpg', caption: 'Reviewing practice questions' }
    ],
    resources: [
      { id: 'r1', title: 'Professor Messer - Domain 1', url: 'https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/', type: 'video' },
      { id: 'r2', title: 'Domain 1 Study Guide', url: '#', type: 'file' },
      { id: 'r3', title: 'Practice Questions', url: '#', type: 'link' }
    ]
  },
  {
    id: '3',
    title: 'CTF Practice Night',
    description: 'Practice capture-the-flag challenges together. Beginner-friendly with mentorship from experienced members.',
    date: '2025-01-29',
    time: '5:00 PM - 8:00 PM',
    location: 'Online - Discord',
    type: 'ctf',
    featured: false,
    topics: ['CTF', 'Web Security', 'Cryptography'],
    announcements: [
      {
        id: 'a2',
        title: 'Teams Forming',
        content: 'Reply in #ctf-teams on Discord if you want to team up. Max 3 per team for this practice session. We recommend mixing experience levels so everyone can learn from each other. If you\'re new, don\'t be shy - experienced members love teaching! Solo participants are also welcome. We\'ll have mentors floating around to help when you get stuck on challenges.',
        date: '2025-01-28'
      },
      {
        id: 'a1',
        title: 'CTF Platform Access',
        content: 'We\'ll be using PicoCTF for beginners and HackTheBox for advanced members. Create accounts beforehand! PicoCTF is completely free and has great beginner challenges in web exploitation, cryptography, and forensics. HackTheBox requires a quick invite code challenge to join - ask in Discord if you get stuck. Both platforms will be useful throughout your cybersecurity journey.',
        date: '2025-01-27'
      }
    ],
    photos: [
      { id: 'p1', url: '/photos/ctf-1.jpg', caption: 'Discord voice chat during CTF' },
      { id: 'p2', url: '/photos/ctf-2.jpg', caption: 'First blood celebration!' }
    ],
    resources: [
      { id: 'r1', title: 'PicoCTF Platform', url: 'https://picoctf.org/', type: 'link' },
      { id: 'r2', title: 'CTF Beginner Guide', url: '#', type: 'file' },
      { id: 'r3', title: 'CyberChef Tool', url: 'https://gchq.github.io/CyberChef/', type: 'link' }
    ]
  },
  {
    id: '4',
    title: 'Network Security Fundamentals',
    description: 'Deep dive into network security concepts including firewalls, IDS/IPS, and secure network design.',
    date: '2025-02-05',
    time: '4:00 PM - 6:00 PM',
    location: 'S43 Room 120',
    type: 'lecture',
    featured: false,
    topics: ['Networking', 'Firewalls', 'Wireshark'],
    announcements: [
      {
        id: 'a1',
        title: 'Wireshark Installation',
        content: 'Please install Wireshark before the session. We\'ll analyze packet captures live! Download it from wireshark.org - it\'s free and available for Windows, Mac, and Linux. During installation, make sure to include Npcap (Windows) or the capture drivers for your OS. We\'ll be dissecting real network traffic to understand protocols like HTTP, DNS, and TCP handshakes. Bring headphones if you want to follow along with the video portions.',
        date: '2025-02-03'
      }
    ],
    photos: [
      { id: 'p1', url: '/photos/network-1.jpg', caption: 'Network topology discussion' },
      { id: 'p2', url: '/photos/network-2.jpg', caption: 'Wireshark packet analysis' }
    ],
    resources: [
      { id: 'r1', title: 'Wireshark Download', url: 'https://www.wireshark.org/download.html', type: 'link' },
      { id: 'r2', title: 'Sample PCAP Files', url: '#', type: 'file' },
      { id: 'r3', title: 'Network Security Slides', url: '#', type: 'slides' }
    ]
  },
  {
    id: '5',
    title: 'Web Application Security Workshop',
    description: 'Hands-on workshop covering OWASP Top 10 vulnerabilities with live demonstrations using Burp Suite.',
    date: '2024-12-10',
    time: '4:00 PM - 6:00 PM',
    location: 'S43 Room 120',
    type: 'workshop',
    featured: false,
    topics: ['OWASP', 'Burp Suite', 'SQL Injection'],
    announcements: [
      {
        id: 'a2',
        title: 'Practice Lab Extended',
        content: 'Due to popular demand, we\'ve extended access to the practice lab until the end of the month. The lab includes vulnerable web applications where you can safely practice the techniques we learned. Remember: only use these skills on systems you have permission to test! Lab credentials are pinned in #workshop-labs on Discord. Let us know if you complete all the challenges - we might have bonus ones!',
        date: '2024-12-15'
      },
      {
        id: 'a1',
        title: 'Workshop Recording Available',
        content: 'The full recording of the workshop is now available on our Discord server. Check the #resources channel! The video is about 2 hours long and includes timestamps for each OWASP vulnerability we covered. We also included the bonus SQL injection deep-dive that we ran out of time for during the live session. Share with friends who couldn\'t make it - the more people learning security, the better!',
        date: '2024-12-11'
      }
    ],
    photos: [
      { id: 'p1', url: '/photos/websec-1.jpg', caption: 'Students working on SQL injection challenges' },
      { id: 'p2', url: '/photos/websec-2.jpg', caption: 'Live demo of Burp Suite' },
      { id: 'p3', url: '/photos/websec-3.jpg', caption: 'Group discussion on OWASP Top 10' }
    ],
    resources: [
      { id: 'r1', title: 'Workshop Slides', url: '#', type: 'slides' },
      { id: 'r2', title: 'OWASP Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/', type: 'link' },
      { id: 'r3', title: 'Practice Lab Access', url: '#', type: 'link' },
      { id: 'r4', title: 'Workshop Recording', url: '#', type: 'video' }
    ]
  },
  {
    id: '6',
    title: 'Club Kickoff Meeting',
    description: 'First meeting of the quarter! Learn about club activities, meet the officers, and sign up for upcoming events.',
    date: '2024-10-02',
    time: '3:00 PM - 4:30 PM',
    location: 'S43 Room 120',
    type: 'general',
    featured: false,
    topics: ['Introduction', 'Community'],
    announcements: [
      {
        id: 'a2',
        title: 'Quarter Schedule Posted',
        content: 'Check out our full fall quarter schedule on the meetings page. Lots of exciting workshops coming up! We\'ve got hands-on hacking sessions, certification study groups, CTF practice nights, and social events planned. Meetings are typically Wednesdays at 4pm, but check each event for specific times. Add them to your calendar so you don\'t miss out!',
        date: '2024-10-03'
      },
      {
        id: 'a1',
        title: 'Welcome to DACC!',
        content: 'Thanks everyone who came out to our first meeting! Don\'t forget to join our Discord server and sign the petition to help make us an official De Anza club. We need 20 signatures to get recognized, which unlocks funding for events, certifications, and competition fees. Your support means everything - spread the word to anyone interested in cybersecurity!',
        date: '2024-10-02'
      }
    ],
    photos: [
      { id: 'p1', url: '/photos/kickoff-1.jpg', caption: 'Officer introductions' },
      { id: 'p2', url: '/photos/kickoff-2.jpg', caption: 'Full house at the kickoff!' },
      { id: 'p3', url: '/photos/kickoff-3.jpg', caption: 'Q&A session' }
    ],
    resources: [
      { id: 'r1', title: 'Club Constitution', url: '#', type: 'file' },
      { id: 'r2', title: 'Fall Quarter Schedule', url: '#', type: 'file' },
      { id: 'r3', title: 'Discord Invite', url: 'https://discord.gg/AmjfRrJd5j', type: 'link' }
    ]
  },
  {
    id: '7',
    title: 'Password Cracking & HashCat Demo',
    description: 'Learn how password hashing works and see live demonstrations of password cracking techniques using HashCat.',
    date: '2024-11-15',
    time: '4:00 PM - 6:00 PM',
    location: 'Online - Discord',
    type: 'workshop',
    featured: false,
    topics: ['Password Security', 'HashCat', 'Cryptography'],
    announcements: [
      {
        id: 'a2',
        title: 'Recording Available',
        content: 'Missed the session? Full recording is now up in the resources section. We covered password hashing fundamentals, rainbow tables, salting, and live HashCat demonstrations. The recording includes our successful crack of a 50,000 password hash dump in under 10 minutes! Also check out the wordlist resources - having good wordlists is half the battle in password cracking.',
        date: '2024-11-16'
      },
      {
        id: 'a1',
        title: 'GPU Recommended',
        content: 'HashCat works best with a GPU for maximum cracking speed. Don\'t have one? No worries - watch the demo and use the cloud lab link in resources! We\'ll explain why GPUs are so much faster than CPUs for this task (hint: parallel processing). Even if you can\'t run it yourself, understanding the concepts is what matters. We\'ll cover MD5, SHA-256, bcrypt, and why some hashes are harder to crack than others.',
        date: '2024-11-13'
      }
    ],
    photos: [
      { id: 'p1', url: '/photos/hashcat-1.jpg', caption: 'HashCat cracking in action' },
      { id: 'p2', url: '/photos/hashcat-2.jpg', caption: 'Explaining hash algorithms' }
    ],
    resources: [
      { id: 'r1', title: 'HashCat Wiki', url: 'https://hashcat.net/wiki/', type: 'link' },
      { id: 'r2', title: 'Workshop Recording', url: '#', type: 'video' },
      { id: 'r3', title: 'Common Wordlists', url: '#', type: 'file' },
      { id: 'r4', title: 'Hash Identifier Tool', url: 'https://hashes.com/en/tools/hash_identifier', type: 'link' }
    ]
  },
  {
    id: '8',
    title: 'End of Quarter Social',
    description: 'Celebrate the end of fall quarter with games, food, and networking with fellow cybersecurity enthusiasts!',
    date: '2024-12-05',
    time: '5:00 PM - 7:00 PM',
    location: 'Campus Center Patio',
    type: 'social',
    featured: false,
    topics: ['Networking', 'Social'],
    announcements: [
      {
        id: 'a3',
        title: 'Thanks for an Amazing Quarter!',
        content: 'What a turnout! Thanks to everyone who came out to celebrate with us. We had over 30 people show up and the trivia competition was intense! Congrats to Team "SQL Injection" for taking first place. Photos are up in the resources section. See you all next quarter for even more hacking workshops, CTF competitions, and community events. Happy holidays and stay curious!',
        date: '2024-12-06'
      },
      {
        id: 'a2',
        title: 'Hacking Games & Trivia',
        content: 'We\'ll have some fun security-themed games and trivia with prizes! Test your knowledge on everything from famous hackers to cryptography basics. Prizes include cybersecurity books, stickers, and some surprise swag. Teams of 3-4 recommended for trivia. We\'ll also have a mini lock-picking station set up for anyone who wants to try their hand at physical security. No experience needed!',
        date: '2024-12-04'
      },
      {
        id: 'a1',
        title: 'Food & Drinks Provided!',
        content: 'Pizza and drinks on us! RSVP in the #social-events channel on Discord so we know how much to order. We\'re getting a variety of pizzas including vegetarian options. If you have dietary restrictions, let us know and we\'ll make sure there\'s something for you. This is a great chance to hang out with club members outside of workshops and make some friends in the cybersecurity community!',
        date: '2024-12-03'
      }
    ],
    photos: [
      { id: 'p1', url: '/photos/social-1.jpg', caption: 'Pizza party!' },
      { id: 'p2', url: '/photos/social-2.jpg', caption: 'Security trivia competition' },
      { id: 'p3', url: '/photos/social-3.jpg', caption: 'Group photo' },
      { id: 'p4', url: '/photos/social-4.jpg', caption: 'Prize winners' }
    ],
    resources: [
      { id: 'r1', title: 'Trivia Questions', url: '#', type: 'file' },
      { id: 'r2', title: 'Event Photos Album', url: '#', type: 'link' }
    ]
  }
]

type FilterType = 'all' | 'upcoming' | 'past'
type TypeFilter = 'all' | Meeting['type']

export const TYPE_COLORS: Record<Meeting['type'], string> = {
  workshop: 'text-hack-cyan border-hack-cyan/50',
  lecture: 'text-hack-yellow border-hack-yellow/50',
  ctf: 'text-hack-red border-hack-red/50',
  social: 'text-purple-400 border-purple-400/50',
  general: 'text-matrix border-matrix/50'
}

export const TYPE_LABELS: Record<Meeting['type'], string> = {
  workshop: 'WORKSHOP',
  lecture: 'LECTURE',
  ctf: 'CTF',
  social: 'SOCIAL',
  general: 'GENERAL'
}

function Meetings() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [loaded, setLoaded] = useState(false)

  useState(() => {
    setLoaded(true)
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const featuredMeetings = useMemo(() => {
    return MEETINGS_DATA.filter(m => m.featured && new Date(m.date) >= today)
  }, [])

  const filteredMeetings = useMemo(() => {
    let meetings = MEETINGS_DATA.filter(m => !m.featured || new Date(m.date) < today)

    // Apply time filter
    if (filter === 'upcoming') {
      meetings = meetings.filter(m => new Date(m.date) >= today)
    } else if (filter === 'past') {
      meetings = meetings.filter(m => new Date(m.date) < today)
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      meetings = meetings.filter(m => m.type === typeFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      meetings = meetings.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.location.toLowerCase().includes(query) ||
        m.topics?.some(t => t.toLowerCase().includes(query))
      )
    }

    // Sort by date (upcoming first for 'all' and 'upcoming', past first for 'past')
    meetings.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (filter === 'past') {
        return dateB - dateA // Most recent past first
      }
      return dateA - dateB // Soonest upcoming first
    })

    return meetings
  }, [filter, typeFilter, searchQuery])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isPast = (dateStr: string) => {
    return new Date(dateStr) < today
  }

  return (
    <div className="bg-terminal-bg text-matrix min-h-screen">
      <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <header className={`mb-12 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-matrix transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle">$</span>
            <span className="text-gray-400 font-terminal">cat /var/log/meetings.log</span>
          </div>

          <h1 className="text-3xl font-bold text-matrix neon-text mb-2">
            Club Meetings
          </h1>
          <p className="text-gray-500">
            Explore our upcoming events and past sessions
          </p>
        </header>

        {/* Featured Section */}
        {featuredMeetings.length > 0 && (
          <section className={`mb-12 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-matrix neon-text-subtle text-lg">$</span>
              <span className="text-gray-400 font-terminal">./highlight --featured</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featuredMeetings.map((meeting) => (
                <Link
                  to={`/meetings/${meeting.id}`}
                  key={meeting.id}
                  className="relative overflow-hidden rounded-xl border-2 border-matrix bg-gradient-to-br from-matrix/10 via-terminal-bg to-matrix/5 p-6 group hover:shadow-neon transition-all duration-300 cursor-pointer"
                >
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-terminal bg-matrix/20 text-matrix border border-matrix/50">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      FEATURED
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                      {TYPE_LABELS[meeting.type]}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-matrix mb-2 group-hover:neon-text-subtle transition-all">
                    {meeting.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {meeting.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4 text-matrix/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(meeting.date)}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4 text-matrix/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {meeting.time}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4 text-matrix/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {meeting.location}
                    </div>
                  </div>

                  {meeting.topics && meeting.topics.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {meeting.topics.map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 rounded text-xs bg-terminal-alt border border-gray-700 text-gray-400"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Search and Filter Section */}
        <section className={`mb-8 transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">search_meetings</span>
            </div>
            <div className="terminal-body">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search meetings, topics, locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-hack w-full rounded-lg pl-10"
                    />
                  </div>

                  {/* Time Filter Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all ${filter === 'all'
                        ? 'bg-matrix/20 text-matrix border border-matrix'
                        : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                        }`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setFilter('upcoming')}
                      className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all ${filter === 'upcoming'
                        ? 'bg-matrix/20 text-matrix border border-matrix'
                        : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                        }`}
                    >
                      UPCOMING
                    </button>
                    <button
                      onClick={() => setFilter('past')}
                      className={`px-4 py-2 rounded-lg text-sm font-terminal transition-all ${filter === 'past'
                        ? 'bg-matrix/20 text-matrix border border-matrix'
                        : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                        }`}
                    >
                      PAST
                    </button>
                  </div>
                </div>

                {/* Type Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 font-terminal self-center mr-2">TYPE:</span>
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-all ${typeFilter === 'all'
                      ? 'bg-matrix/20 text-matrix border border-matrix'
                      : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                      }`}
                  >
                    ALL TYPES
                  </button>
                  <button
                    onClick={() => setTypeFilter('workshop')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-all ${typeFilter === 'workshop'
                      ? 'bg-hack-cyan/20 text-hack-cyan border border-hack-cyan'
                      : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-hack-cyan/50'
                      }`}
                  >
                    WORKSHOP
                  </button>
                  <button
                    onClick={() => setTypeFilter('lecture')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-all ${typeFilter === 'lecture'
                      ? 'bg-hack-yellow/20 text-hack-yellow border border-hack-yellow'
                      : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-hack-yellow/50'
                      }`}
                  >
                    LECTURE
                  </button>
                  <button
                    onClick={() => setTypeFilter('ctf')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-all ${typeFilter === 'ctf'
                      ? 'bg-hack-red/20 text-hack-red border border-hack-red'
                      : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-hack-red/50'
                      }`}
                  >
                    CTF
                  </button>
                  <button
                    onClick={() => setTypeFilter('social')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-all ${typeFilter === 'social'
                      ? 'bg-purple-400/20 text-purple-400 border border-purple-400'
                      : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-purple-400/50'
                      }`}
                  >
                    SOCIAL
                  </button>
                  <button
                    onClick={() => setTypeFilter('general')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-terminal transition-all ${typeFilter === 'general'
                      ? 'bg-matrix/20 text-matrix border border-matrix'
                      : 'bg-terminal-alt text-gray-400 border border-gray-700 hover:border-matrix/50'
                      }`}
                  >
                    GENERAL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Meetings List */}
        <section className={`mb-16 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-400 font-terminal">
              ls -la ./meetings/ {filter !== 'all' && `--filter=${filter}`}
              {typeFilter !== 'all' && ` --type=${typeFilter}`}
              {searchQuery && ` | grep "${searchQuery}"`}
            </span>
          </div>

          {filteredMeetings.length === 0 ? (
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot red" />
                <div className="terminal-dot yellow" />
                <div className="terminal-dot green" />
                <span className="ml-4 text-xs text-gray-500 font-terminal">no_results</span>
              </div>
              <div className="terminal-body text-center py-8">
                <p className="text-gray-500 mb-2">
                  <span className="text-hack-yellow">[INFO]</span> No meetings found matching your criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilter('all')
                    setTypeFilter('all')
                  }}
                  className="text-matrix hover:neon-text-subtle transition-all text-sm"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map((meeting) => (
                <Link
                  to={`/meetings/${meeting.id}`}
                  key={meeting.id}
                  className={`card-hack p-5 rounded-lg group transition-all block ${isPast(meeting.date) ? 'opacity-70' : ''
                    }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className={`text-2xl font-bold font-terminal ${isPast(meeting.date) ? 'text-gray-500' : 'text-matrix'}`}>
                        {new Date(meeting.date).getDate()}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">
                        {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(meeting.date).getFullYear()}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-terminal border ${TYPE_COLORS[meeting.type]}`}>
                          {TYPE_LABELS[meeting.type]}
                        </span>
                        {isPast(meeting.date) && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-terminal border border-gray-600 text-gray-500">
                            COMPLETED
                          </span>
                        )}
                      </div>

                      <h3 className={`text-lg font-semibold mb-2 group-hover:neon-text-subtle transition-all ${isPast(meeting.date) ? 'text-gray-400' : 'text-matrix'
                        }`}>
                        {meeting.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3">
                        {meeting.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-matrix/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {meeting.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-matrix/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {meeting.location}
                        </div>
                      </div>

                      {meeting.topics && meeting.topics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {meeting.topics.map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-0.5 rounded text-xs bg-terminal-alt border border-gray-700 text-gray-400"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Stats Section */}
        <section className={`mb-16 transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot red" />
              <div className="terminal-dot yellow" />
              <div className="terminal-dot green" />
              <span className="ml-4 text-xs text-gray-500 font-terminal">meeting_stats</span>
            </div>
            <div className="terminal-body">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-matrix neon-text-subtle">
                    {MEETINGS_DATA.length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Total Meetings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-hack-cyan">
                    {MEETINGS_DATA.filter(m => new Date(m.date) >= today).length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Upcoming</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-hack-yellow">
                    {MEETINGS_DATA.filter(m => m.type === 'workshop').length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">Workshops</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-hack-red">
                    {MEETINGS_DATA.filter(m => m.type === 'ctf').length}
                  </div>
                  <div className="text-xs text-gray-500 uppercase">CTF Events</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer className={`transition-all duration-700 delay-500 border-matrix/20 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-gray-600 font-terminal">
              <span className="text-matrix neon-text-subtle">$</span> tail -f /var/log/meetings.log
            </p>
            <div className="text-xs text-gray-700 font-terminal">
              <span className="text-matrix/50">[</span>
              EVENTS ACTIVE
              <span className="text-matrix/50">]</span>
            </div>
          </div>
        </Footer>
      </div>
    </div>
  )
}

export default Meetings

-- Seed data for meetings table
-- Run this after setup.sql to populate the database with sample meetings

INSERT INTO public.meetings (slug, title, description, date, time, location, type, featured, topics, announcements, photos, resources, secret_code) VALUES
(
    'ethical-hacking',
    'Introduction to Ethical Hacking',
    'Learn the fundamentals of ethical hacking and penetration testing. We''ll cover reconnaissance, scanning, and basic exploitation techniques.',
    '2025-01-15',
    '4:00 PM - 6:00 PM',
    'S43 Room 120',
    'workshop',
    true,
    ARRAY['Penetration Testing', 'Kali Linux', 'Nmap'],
    '[
        {"id": "a1", "title": "Bring Your Laptop!", "content": "Make sure to bring your laptop with Kali Linux installed (VM is fine). We''ll have a hands-on lab portion where you''ll be running actual scans and reconnaissance techniques. If you need help setting up your VM, drop by our Discord #tech-support channel and we''ll walk you through it. Don''t have a laptop? Let us know and we can pair you up with someone.", "date": "2025-01-13"},
        {"id": "a2", "title": "Pre-Workshop Setup Guide", "content": "Check the resources tab for the VM setup guide. Complete this before the workshop to hit the ground running! The guide covers VirtualBox installation, Kali Linux ISO download, and basic configuration. We recommend allocating at least 4GB RAM and 40GB storage for your VM. If you run into any issues during setup, post in Discord and we''ll help troubleshoot.", "date": "2025-01-10"}
    ]'::jsonb,
    '[
        {"id": "p1", "url": "/photos/ethical-hacking-1.jpg", "caption": "Setting up Kali Linux VMs"},
        {"id": "p2", "url": "/photos/ethical-hacking-2.jpg", "caption": "Nmap scanning demo"}
    ]'::jsonb,
    '[
        {"id": "r1", "title": "Kali Linux VM Setup Guide", "url": "#", "type": "file"},
        {"id": "r2", "title": "Nmap Cheat Sheet", "url": "https://www.stationx.net/nmap-cheat-sheet/", "type": "link"},
        {"id": "r3", "title": "Workshop Slides", "url": "#", "type": "slides"}
    ]'::jsonb,
    'HACK2025'
),
(
    'secplus-1',
    'Security+ Study Session',
    'Group study session for CompTIA Security+ certification. Focus on domain 1: Attacks, Threats, and Vulnerabilities.',
    '2025-01-22',
    '3:00 PM - 5:00 PM',
    'Library Study Room 3',
    'lecture',
    true,
    ARRAY['Security+', 'Certification', 'Study Group'],
    '[
        {"id": "a1", "title": "Study Materials Ready", "content": "Professor Messer videos for Domain 1 are linked in resources. Watch before the session for better discussion! We''ll be covering Attacks, Threats, and Vulnerabilities which makes up about 24% of the exam. Bring any questions you have from the videos and we''ll work through them together. Pro tip: take notes on the acronyms - there are a lot of them!", "date": "2025-01-20"}
    ]'::jsonb,
    '[
        {"id": "p1", "url": "/photos/security-plus-1.jpg", "caption": "Group study session in progress"},
        {"id": "p2", "url": "/photos/security-plus-2.jpg", "caption": "Reviewing practice questions"}
    ]'::jsonb,
    '[
        {"id": "r1", "title": "Professor Messer - Domain 1", "url": "https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/", "type": "video"},
        {"id": "r2", "title": "Domain 1 Study Guide", "url": "#", "type": "file"},
        {"id": "r3", "title": "Practice Questions", "url": "#", "type": "link"}
    ]'::jsonb,
    'SECPLUS'
),
(
    'ctf-jan',
    'CTF Practice Night',
    'Practice capture-the-flag challenges together. Beginner-friendly with mentorship from experienced members.',
    '2025-01-29',
    '5:00 PM - 8:00 PM',
    'Online - Discord',
    'ctf',
    false,
    ARRAY['CTF', 'Web Security', 'Cryptography'],
    '[
        {"id": "a2", "title": "Teams Forming", "content": "Reply in #ctf-teams on Discord if you want to team up. Max 3 per team for this practice session. We recommend mixing experience levels so everyone can learn from each other. If you''re new, don''t be shy - experienced members love teaching! Solo participants are also welcome. We''ll have mentors floating around to help when you get stuck on challenges.", "date": "2025-01-28"},
        {"id": "a1", "title": "CTF Platform Access", "content": "We''ll be using PicoCTF for beginners and HackTheBox for advanced members. Create accounts beforehand! PicoCTF is completely free and has great beginner challenges in web exploitation, cryptography, and forensics. HackTheBox requires a quick invite code challenge to join - ask in Discord if you get stuck. Both platforms will be useful throughout your cybersecurity journey.", "date": "2025-01-27"}
    ]'::jsonb,
    '[
        {"id": "p1", "url": "/photos/ctf-1.jpg", "caption": "Discord voice chat during CTF"},
        {"id": "p2", "url": "/photos/ctf-2.jpg", "caption": "First blood celebration!"}
    ]'::jsonb,
    '[
        {"id": "r1", "title": "PicoCTF Platform", "url": "https://picoctf.org/", "type": "link"},
        {"id": "r2", "title": "CTF Beginner Guide", "url": "#", "type": "file"},
        {"id": "r3", "title": "CyberChef Tool", "url": "https://gchq.github.io/CyberChef/", "type": "link"}
    ]'::jsonb,
    'CTFNIGHT'
),
(
    'network-security',
    'Network Security Fundamentals',
    'Deep dive into network security concepts including firewalls, IDS/IPS, and secure network design.',
    '2025-02-05',
    '4:00 PM - 6:00 PM',
    'S43 Room 120',
    'lecture',
    false,
    ARRAY['Networking', 'Firewalls', 'Wireshark'],
    '[
        {"id": "a1", "title": "Wireshark Installation", "content": "Please install Wireshark before the session. We''ll analyze packet captures live! Download it from wireshark.org - it''s free and available for Windows, Mac, and Linux. During installation, make sure to include Npcap (Windows) or the capture drivers for your OS. We''ll be dissecting real network traffic to understand protocols like HTTP, DNS, and TCP handshakes. Bring headphones if you want to follow along with the video portions.", "date": "2025-02-03"}
    ]'::jsonb,
    '[
        {"id": "p1", "url": "/photos/network-1.jpg", "caption": "Network topology discussion"},
        {"id": "p2", "url": "/photos/network-2.jpg", "caption": "Wireshark packet analysis"}
    ]'::jsonb,
    '[
        {"id": "r1", "title": "Wireshark Download", "url": "https://www.wireshark.org/download.html", "type": "link"},
        {"id": "r2", "title": "Sample PCAP Files", "url": "#", "type": "file"},
        {"id": "r3", "title": "Network Security Slides", "url": "#", "type": "slides"}
    ]'::jsonb,
    'NETSEC25'
),
(
    'owasp-workshop',
    'Web Application Security Workshop',
    'Hands-on workshop covering OWASP Top 10 vulnerabilities with live demonstrations using Burp Suite.',
    '2024-12-10',
    '4:00 PM - 6:00 PM',
    'S43 Room 120',
    'workshop',
    false,
    ARRAY['OWASP', 'Burp Suite', 'SQL Injection'],
    '[
        {"id": "a2", "title": "Practice Lab Extended", "content": "Due to popular demand, we''ve extended access to the practice lab until the end of the month. The lab includes vulnerable web applications where you can safely practice the techniques we learned. Remember: only use these skills on systems you have permission to test! Lab credentials are pinned in #workshop-labs on Discord. Let us know if you complete all the challenges - we might have bonus ones!", "date": "2024-12-15"},
        {"id": "a1", "title": "Workshop Recording Available", "content": "The full recording of the workshop is now available on our Discord server. Check the #resources channel! The video is about 2 hours long and includes timestamps for each OWASP vulnerability we covered. We also included the bonus SQL injection deep-dive that we ran out of time for during the live session. Share with friends who couldn''t make it - the more people learning security, the better!", "date": "2024-12-11"}
    ]'::jsonb,
    '[
        {"id": "p1", "url": "/photos/websec-1.jpg", "caption": "Students working on SQL injection challenges"},
        {"id": "p2", "url": "/photos/websec-2.jpg", "caption": "Live demo of Burp Suite"},
        {"id": "p3", "url": "/photos/websec-3.jpg", "caption": "Group discussion on OWASP Top 10"}
    ]'::jsonb,
    '[
        {"id": "r1", "title": "Workshop Slides", "url": "#", "type": "slides"},
        {"id": "r2", "title": "OWASP Cheat Sheet", "url": "https://cheatsheetseries.owasp.org/", "type": "link"},
        {"id": "r3", "title": "Practice Lab Access", "url": "#", "type": "link"},
        {"id": "r4", "title": "Workshop Recording", "url": "#", "type": "video"}
    ]'::jsonb,
    'OWASP24'
),
(
    'kickoff',
    'Club Kickoff Meeting',
    'First meeting of the quarter! Learn about club activities, meet the officers, and sign up for upcoming events.',
    '2024-10-02',
    '3:00 PM - 4:30 PM',
    'S43 Room 120',
    'general',
    false,
    ARRAY['Introduction', 'Community'],
    '[
        {"id": "a2", "title": "Quarter Schedule Posted", "content": "Check out our full fall quarter schedule on the meetings page. Lots of exciting workshops coming up! We''ve got hands-on hacking sessions, certification study groups, CTF practice nights, and social events planned. Meetings are typically Wednesdays at 4pm, but check each event for specific times. Add them to your calendar so you don''t miss out!", "date": "2024-10-03"},
        {"id": "a1", "title": "Welcome to DACC!", "content": "Thanks everyone who came out to our first meeting! Don''t forget to join our Discord server and sign the petition to help make us an official De Anza club. We need 20 signatures to get recognized, which unlocks funding for events, certifications, and competition fees. Your support means everything - spread the word to anyone interested in cybersecurity!", "date": "2024-10-02"}
    ]'::jsonb,
    '[
        {"id": "p1", "url": "/photos/kickoff-1.jpg", "caption": "Officer introductions"},
        {"id": "p2", "url": "/photos/kickoff-2.jpg", "caption": "Full house at the kickoff!"},
        {"id": "p3", "url": "/photos/kickoff-3.jpg", "caption": "Q&A session"}
    ]'::jsonb,
    '[
        {"id": "r1", "title": "Club Constitution", "url": "#", "type": "file"},
        {"id": "r2", "title": "Fall Quarter Schedule", "url": "#", "type": "file"},
        {"id": "r3", "title": "Discord Invite", "url": "https://discord.gg/AmjfRrJd5j", "type": "link"}
    ]'::jsonb,
    'KICKOFF'
),
(
    'hashcat',
    'Password Cracking & HashCat Demo',
    'Learn how password hashing works and see live demonstrations of password cracking techniques using HashCat.',
    '2024-11-15',
    '4:00 PM - 6:00 PM',
    'Online - Discord',
    'workshop',
    false,
    ARRAY['Password Security', 'HashCat', 'Cryptography'],
    '[
        {"id": "a2", "title": "Recording Available", "content": "Missed the session? Full recording is now up in the resources section. We covered password hashing fundamentals, rainbow tables, salting, and live HashCat demonstrations. The recording includes our successful crack of a 50,000 password hash dump in under 10 minutes! Also check out the wordlist resources - having good wordlists is half the battle in password cracking.", "date": "2024-11-16"},
        {"id": "a1", "title": "GPU Recommended", "content": "HashCat works best with a GPU for maximum cracking speed. Don''t have one? No worries - watch the demo and use the cloud lab link in resources! We''ll explain why GPUs are so much faster than CPUs for this task (hint: parallel processing). Even if you can''t run it yourself, understanding the concepts is what matters. We''ll cover MD5, SHA-256, bcrypt, and why some hashes are harder to crack than others.", "date": "2024-11-13"}
    ]'::jsonb,
    '[
        {"id": "p1", "url": "/photos/hashcat-1.jpg", "caption": "HashCat cracking in action"},
        {"id": "p2", "url": "/photos/hashcat-2.jpg", "caption": "Explaining hash algorithms"}
    ]'::jsonb,
    '[
        {"id": "r1", "title": "HashCat Wiki", "url": "https://hashcat.net/wiki/", "type": "link"},
        {"id": "r2", "title": "Workshop Recording", "url": "#", "type": "video"},
        {"id": "r3", "title": "Common Wordlists", "url": "#", "type": "file"},
        {"id": "r4", "title": "Hash Identifier Tool", "url": "https://hashes.com/en/tools/hash_identifier", "type": "link"}
    ]'::jsonb,
    'HASHCAT'
),
(
    'fall-social',
    'End of Quarter Social',
    'Celebrate the end of fall quarter with games, food, and networking with fellow cybersecurity enthusiasts!',
    '2024-12-05',
    '5:00 PM - 7:00 PM',
    'Campus Center Patio',
    'social',
    false,
    ARRAY['Networking', 'Social'],
    '[
        {"id": "a3", "title": "Thanks for an Amazing Quarter!", "content": "What a turnout! Thanks to everyone who came out to celebrate with us. We had over 30 people show up and the trivia competition was intense! Congrats to Team \"SQL Injection\" for taking first place. Photos are up in the resources section. See you all next quarter for even more hacking workshops, CTF competitions, and community events. Happy holidays and stay curious!", "date": "2024-12-06"},
        {"id": "a2", "title": "Hacking Games & Trivia", "content": "We''ll have some fun security-themed games and trivia with prizes! Test your knowledge on everything from famous hackers to cryptography basics. Prizes include cybersecurity books, stickers, and some surprise swag. Teams of 3-4 recommended for trivia. We''ll also have a mini lock-picking station set up for anyone who wants to try their hand at physical security. No experience needed!", "date": "2024-12-04"},
        {"id": "a1", "title": "Food & Drinks Provided!", "content": "Pizza and drinks on us! RSVP in the #social-events channel on Discord so we know how much to order. We''re getting a variety of pizzas including vegetarian options. If you have dietary restrictions, let us know and we''ll make sure there''s something for you. This is a great chance to hang out with club members outside of workshops and make some friends in the cybersecurity community!", "date": "2024-12-03"}
    ]'::jsonb,
    '[
        {"id": "p1", "url": "/photos/social-1.jpg", "caption": "Pizza party!"},
        {"id": "p2", "url": "/photos/social-2.jpg", "caption": "Security trivia competition"},
        {"id": "p3", "url": "/photos/social-3.jpg", "caption": "Group photo"},
        {"id": "p4", "url": "/photos/social-4.jpg", "caption": "Prize winners"}
    ]'::jsonb,
    '[
        {"id": "r1", "title": "Trivia Questions", "url": "#", "type": "file"},
        {"id": "r2", "title": "Event Photos Album", "url": "#", "type": "link"}
    ]'::jsonb,
    'PARTY24'
);

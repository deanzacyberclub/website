-- ============================================================
-- Security+ Curriculum Migration
-- ============================================================
-- This migration adds comprehensive curriculum for Security+:
-- - Security+ Certification: 32 lessons across 12 modules
--
-- Structure:
-- - Module 1: Welcome (1 lesson - introduction)
-- - Modules 2-11: Course content (3 lessons each: course, quiz, flashcards)
-- - Module 12: Final Exam (1 comprehensive quiz)
-- ============================================================

-- Update difficulty constraint to support all difficulty levels
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_difficulty_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_difficulty_check
  CHECK (difficulty = ANY (ARRAY['easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced']::text[]));

-- Clear existing lessons
DELETE FROM lessons;

-- ============================================================
-- SECURITY+ CERTIFICATION PATHWAY (32 lessons)
-- ============================================================

-- Module 1: Welcome to Security+ (1 lesson)
INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, content, is_self_paced, topics)
VALUES (
  'welcome-to-security-plus',
  'Welcome to Security+',
  'Introduction to the Security+ certification pathway',
  'course',
  0,
  'beginner',
  15,
  '{"markdown": "# Welcome to Security+ Certification\n\n## What is CompTIA Security+?\n\nCompTIA Security+ is one of the most widely recognized cybersecurity certifications globally. This certification validates your knowledge and skills in:\n\n- **Network Security**: Securing network infrastructure and communications\n- **Compliance & Operations**: Understanding security policies and procedures\n- **Threats & Vulnerabilities**: Identifying and mitigating security risks\n- **Application & Data Security**: Protecting applications and sensitive information\n- **Identity & Access Management**: Controlling user access and authentication\n\n## What You''ll Learn\n\nThis pathway covers all Security+ exam objectives through:\n\n1. **Interactive Lessons**: Comprehensive courses covering each domain\n2. **Practice Quizzes**: Test your knowledge after each module\n3. **Flashcards**: Reinforce key terminology and concepts\n4. **Final Exam**: Comprehensive assessment requiring 85% to pass\n\n## Study Tips\n\n- Complete lessons in order - each builds on previous concepts\n- Take notes on key concepts and terminology\n- Practice with flashcards regularly\n- Don''t rush - understanding is more important than speed\n- Retake quizzes until you achieve 100%\n\n## Certification Path\n\nAfter completing this pathway:\n\n1. ✅ Complete all 11 course modules\n2. ✅ Pass the final exam (85% required)\n3. ✅ Earn your certificate of accomplishment\n4. 📝 Schedule your official CompTIA Security+ exam\n\nLet''s get started on your cybersecurity journey!"}'::jsonb,
  true,
  ARRAY['introduction', 'certification', 'overview']
);

-- Module 2: Security Fundamentals (3 lessons)
INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, content, is_self_paced, topics)
VALUES (
  'security-fundamentals',
  'Security Fundamentals',
  'Core security concepts including CIA Triad, AAA framework, and security principles',
  'course',
  1,
  'beginner',
  45,
  '{"markdown": "# Security Fundamentals\n\n## The CIA Triad\n\nThe CIA Triad is the foundation of information security:\n\n### Confidentiality\n- Ensures information is accessible only to authorized individuals\n- Implemented through: encryption, access controls, authentication\n- Example: Encrypting sensitive customer data\n\n### Integrity\n- Ensures information accuracy and prevents unauthorized modification\n- Implemented through: hashing, digital signatures, checksums\n- Example: Using SHA-256 to verify file integrity\n\n### Availability\n- Ensures authorized users can access information when needed\n- Implemented through: redundancy, backups, disaster recovery\n- Example: Load balancing across multiple servers\n\n## AAA Framework\n\n### Authentication\n- **What you know**: Passwords, PINs\n- **What you have**: Smart cards, tokens\n- **What you are**: Biometrics (fingerprint, facial recognition)\n- **Multi-Factor Authentication (MFA)**: Combining two or more factors\n\n### Authorization\n- Determines what resources a user can access\n- Models: DAC, MAC, RBAC, ABAC\n- Principle of Least Privilege: Users get minimum necessary access\n\n### Accounting\n- Tracks user actions and resource usage\n- Audit logs, SIEM systems\n- Non-repudiation: Users cannot deny their actions\n\n## Security Principles\n\n### Defense in Depth\n- Multiple layers of security controls\n- If one layer fails, others still protect\n- Example: Firewall + IDS + Antivirus + Access Controls\n\n### Zero Trust\n- \"Never trust, always verify\"\n- Verify every user and device, regardless of location\n- Microsegmentation and continuous authentication\n\n### Principle of Least Privilege\n- Users and systems get minimum permissions needed\n- Reduces attack surface and potential damage\n\n## Common Security Controls\n\n### Technical Controls\n- Firewalls, encryption, IDS/IPS\n- Antivirus, access control lists\n\n### Administrative Controls\n- Security policies, procedures\n- Training and awareness programs\n- Background checks\n\n### Physical Controls\n- Locks, guards, cameras\n- Mantraps, badge readers\n- Environmental controls (fire suppression)\n\n## Risk Management Basics\n\n- **Threat**: Potential cause of unwanted incident\n- **Vulnerability**: Weakness that can be exploited\n- **Risk**: Likelihood × Impact of threat exploiting vulnerability\n- **Mitigation**: Reducing risk through controls"}'::jsonb,
  true,
  ARRAY['cia-triad', 'aaa-framework', 'security-controls', 'defense-in-depth']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, quiz_data, is_self_paced, topics)
VALUES (
  'security-fundamentals-quiz',
  'Security Fundamentals Quiz',
  'Test your understanding of core security concepts',
  'quiz',
  2,
  'beginner',
  15,
  '{"questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Which component of the CIA Triad ensures data is protected from unauthorized modification?",
      "options": ["Confidentiality", "Integrity", "Availability", "Authentication"],
      "correct_answer": 1,
      "explanation": "Integrity ensures data accuracy and prevents unauthorized modifications. Confidentiality protects from unauthorized access, while Availability ensures authorized access.",
      "points": 1
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "question": "What does MFA stand for and require?",
      "options": ["Multi-Factor Authentication requiring two or more authentication factors", "Multiple File Access requiring admin privileges", "Mandatory Firewall Authentication requiring network access", "Multi-Frequency Analysis requiring signal processing"],
      "correct_answer": 0,
      "explanation": "Multi-Factor Authentication (MFA) requires two or more different types of authentication factors (something you know, have, or are) for stronger security.",
      "points": 1
    },
    {
      "id": "q3",
      "type": "multiple_choice",
      "question": "Which security principle involves implementing multiple layers of security controls?",
      "options": ["Zero Trust", "Least Privilege", "Defense in Depth", "Separation of Duties"],
      "correct_answer": 2,
      "explanation": "Defense in Depth uses multiple layers of security controls so that if one layer fails, others continue to provide protection.",
      "points": 1
    },
    {
      "id": "q4",
      "type": "multiple_choice",
      "question": "What is the Principle of Least Privilege?",
      "options": ["Administrators have all system privileges", "Users get maximum permissions for convenience", "Users receive minimum permissions necessary for their role", "Everyone has equal access to all resources"],
      "correct_answer": 2,
      "explanation": "Principle of Least Privilege means users and systems receive only the minimum permissions necessary to perform their required functions, reducing security risks.",
      "points": 1
    },
    {
      "id": "q5",
      "type": "true_false",
      "question": "True or False: In the Zero Trust model, users inside the corporate network are automatically trusted.",
      "options": ["True", "False"],
      "correct_answer": 1,
      "explanation": "False. Zero Trust follows ''never trust, always verify'' - all users and devices must be authenticated and authorized regardless of location, even inside the network.",
      "points": 1
    }
  ], "passing_score": 75}'::jsonb,
  true,
  ARRAY['quiz', 'security-fundamentals', 'assessment']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, flashcard_data, is_self_paced, topics)
VALUES (
  'security-fundamentals-flashcards',
  'Security Fundamentals Flashcards',
  'Master key security terminology and concepts',
  'flashcard',
  3,
  'beginner',
  20,
  '{"cards": [
    {"id": "f1", "front": "CIA Triad", "back": "Confidentiality, Integrity, and Availability - the three core principles of information security", "category": "Core Concepts"},
    {"id": "f2", "front": "Confidentiality", "back": "Ensuring information is accessible only to authorized individuals through encryption and access controls", "category": "CIA Triad"},
    {"id": "f3", "front": "Integrity", "back": "Ensuring information accuracy and preventing unauthorized modification through hashing and digital signatures", "category": "CIA Triad"},
    {"id": "f4", "front": "Availability", "back": "Ensuring authorized users can access information when needed through redundancy and backups", "category": "CIA Triad"},
    {"id": "f5", "front": "AAA Framework", "back": "Authentication, Authorization, and Accounting - framework for access control", "category": "Core Concepts"},
    {"id": "f6", "front": "Multi-Factor Authentication (MFA)", "back": "Security process requiring two or more authentication factors (knowledge, possession, inherence)", "category": "Authentication"},
    {"id": "f7", "front": "Defense in Depth", "back": "Security strategy using multiple layers of controls so failure of one doesn''t compromise entire system", "category": "Security Principles"},
    {"id": "f8", "front": "Zero Trust", "back": "Security model that requires verification of every user and device regardless of location (never trust, always verify)", "category": "Security Principles"},
    {"id": "f9", "front": "Principle of Least Privilege", "back": "Security principle where users receive only minimum permissions necessary for their role", "category": "Security Principles"},
    {"id": "f10", "front": "Non-repudiation", "back": "Ensuring users cannot deny their actions through audit logs and digital signatures", "category": "AAA Framework"}
  ]}'::jsonb,
  true,
  ARRAY['flashcards', 'terminology', 'security-fundamentals']
);

-- Module 3: Threats & Vulnerabilities (3 lessons)
INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, content, is_self_paced, topics)
VALUES (
  'threats-and-vulnerabilities',
  'Threats & Vulnerabilities',
  'Understanding attack types, threat actors, and common vulnerabilities',
  'course',
  4,
  'beginner',
  50,
  '{"markdown": "# Threats & Vulnerabilities\n\n## Types of Attacks\n\n### Social Engineering\n- **Phishing**: Fraudulent emails to steal credentials\n- **Spear Phishing**: Targeted phishing against specific individuals\n- **Whaling**: Phishing targeting executives\n- **Vishing**: Voice phishing via phone calls\n- **Smishing**: SMS/text message phishing\n- **Pretexting**: Creating false scenarios to gain information\n- **Tailgating**: Following authorized persons into restricted areas\n\n### Malware Types\n- **Virus**: Malicious code that attaches to files\n- **Worm**: Self-replicating malware that spreads across networks\n- **Trojan**: Malware disguised as legitimate software\n- **Ransomware**: Encrypts files and demands payment\n- **Spyware**: Secretly monitors user activity\n- **Rootkit**: Provides persistent privileged access\n- **Botnet**: Network of infected computers controlled remotely\n\n### Network Attacks\n- **DDoS**: Distributed Denial of Service overwhelming systems\n- **Man-in-the-Middle (MitM)**: Intercepting communications\n- **ARP Spoofing**: Poisoning ARP cache to redirect traffic\n- **DNS Poisoning**: Corrupting DNS cache to redirect users\n- **Session Hijacking**: Taking over active sessions\n\n### Application Attacks\n- **SQL Injection**: Injecting malicious SQL commands\n- **Cross-Site Scripting (XSS)**: Injecting malicious scripts\n- **Cross-Site Request Forgery (CSRF)**: Forcing users to execute unwanted actions\n- **Buffer Overflow**: Overwriting memory to execute malicious code\n- **Directory Traversal**: Accessing files outside intended directory\n\n## Threat Actors\n\n### Script Kiddies\n- Low skill level, use existing tools\n- Motivated by fame or fun\n- Limited resources\n\n### Hacktivists\n- Politically or socially motivated\n- Target organizations opposing their views\n- Often use DDoS and defacement\n\n### Organized Crime\n- Financially motivated\n- Well-funded and organized\n- Focus on ransomware, fraud, data theft\n\n### Nation-State Actors\n- Government-sponsored\n- Highly sophisticated, well-resourced\n- Focus on espionage, infrastructure disruption\n\n### Insider Threats\n- Current or former employees\n- Have legitimate access\n- Can cause significant damage\n\n## Common Vulnerabilities\n\n### Configuration Weaknesses\n- Default credentials\n- Unnecessary services enabled\n- Improper permissions\n- Missing patches\n\n### Software Vulnerabilities\n- Zero-day vulnerabilities\n- Known CVEs (Common Vulnerabilities and Exposures)\n- Outdated software\n- Poor input validation\n\n### Human Vulnerabilities\n- Lack of security awareness\n- Weak passwords\n- Falling for social engineering\n- Poor security hygiene\n\n## Vulnerability Assessment\n\n### CVSS (Common Vulnerability Scoring System)\n- Standardized framework for rating vulnerabilities\n- Scores from 0-10\n- **0.0**: No vulnerability\n- **0.1-3.9**: Low severity\n- **4.0-6.9**: Medium severity\n- **7.0-8.9**: High severity\n- **9.0-10.0**: Critical severity\n\n### Penetration Testing\n- Simulated attacks to find vulnerabilities\n- White Box: Full knowledge of systems\n- Black Box: No prior knowledge\n- Gray Box: Partial knowledge\n\n## Indicators of Compromise (IoCs)\n\n- Unusual network traffic patterns\n- Unauthorized account access\n- Unexpected file changes\n- Registry modifications\n- Suspicious processes\n- Anomalous user behavior"}'::jsonb,
  true,
  ARRAY['threats', 'vulnerabilities', 'malware', 'social-engineering', 'attacks']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, quiz_data, is_self_paced, topics)
VALUES (
  'threats-quiz',
  'Threats & Vulnerabilities Quiz',
  'Test your knowledge of security threats and vulnerabilities',
  'quiz',
  5,
  'beginner',
  15,
  '{"questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "What type of attack involves fraudulent emails designed to steal credentials or sensitive information?",
      "options": ["Vishing", "Phishing", "Smishing", "Whaling"],
      "correct_answer": 1,
      "explanation": "Phishing uses fraudulent emails to trick users into revealing credentials or sensitive information. Vishing uses voice calls, smishing uses SMS, and whaling targets executives.",
      "points": 1
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "question": "Which malware type encrypts files and demands payment for decryption?",
      "options": ["Trojan", "Worm", "Ransomware", "Spyware"],
      "correct_answer": 2,
      "explanation": "Ransomware encrypts victim files and demands payment (ransom) for the decryption key.",
      "points": 1
    },
    {
      "id": "q3",
      "type": "multiple_choice",
      "question": "What CVSS score range indicates a CRITICAL severity vulnerability?",
      "options": ["7.0-8.9", "4.0-6.9", "9.0-10.0", "0.1-3.9"],
      "correct_answer": 2,
      "explanation": "CVSS scores of 9.0-10.0 indicate critical severity vulnerabilities requiring immediate attention.",
      "points": 1
    },
    {
      "id": "q4",
      "type": "multiple_choice",
      "question": "Which attack involves intercepting communication between two parties?",
      "options": ["DDoS", "Man-in-the-Middle", "SQL Injection", "Buffer Overflow"],
      "correct_answer": 1,
      "explanation": "Man-in-the-Middle (MitM) attacks involve intercepting and potentially modifying communications between two parties without their knowledge.",
      "points": 1
    },
    {
      "id": "q5",
      "type": "multiple_choice",
      "question": "What distinguishes a worm from a virus?",
      "options": ["Worms require user interaction to spread", "Worms can self-replicate and spread without user interaction", "Worms only affect email systems", "Worms are less dangerous than viruses"],
      "correct_answer": 1,
      "explanation": "Worms can self-replicate and spread across networks without requiring user interaction, unlike viruses which need to attach to files and require user action to spread.",
      "points": 1
    }
  ], "passing_score": 75}'::jsonb,
  true,
  ARRAY['quiz', 'threats', 'assessment']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, flashcard_data, is_self_paced, topics)
VALUES (
  'threats-flashcards',
  'Threats & Vulnerabilities Flashcards',
  'Master threat and vulnerability terminology',
  'flashcard',
  6,
  'beginner',
  20,
  '{"cards": [
    {"id": "f1", "front": "Phishing", "back": "Fraudulent emails designed to trick users into revealing credentials or sensitive information", "category": "Social Engineering"},
    {"id": "f2", "front": "Ransomware", "back": "Malware that encrypts files and demands payment for decryption", "category": "Malware"},
    {"id": "f3", "front": "DDoS", "back": "Distributed Denial of Service - overwhelming a system with traffic from multiple sources", "category": "Network Attacks"},
    {"id": "f4", "front": "SQL Injection", "back": "Inserting malicious SQL commands into application queries to manipulate databases", "category": "Application Attacks"},
    {"id": "f5", "front": "Zero-Day", "back": "Previously unknown vulnerability with no available patch", "category": "Vulnerabilities"},
    {"id": "f6", "front": "CVSS", "back": "Common Vulnerability Scoring System - standardized framework rating vulnerabilities 0-10", "category": "Assessment"},
    {"id": "f7", "front": "Man-in-the-Middle (MitM)", "back": "Attack where attacker intercepts communication between two parties", "category": "Network Attacks"},
    {"id": "f8", "front": "Threat Actor", "back": "Individual or group that carries out cyber attacks (e.g., script kiddies, nation-states)", "category": "Threats"},
    {"id": "f9", "front": "IoC (Indicator of Compromise)", "back": "Evidence that a system has been compromised (e.g., unusual traffic, unauthorized access)", "category": "Detection"},
    {"id": "f10", "front": "Insider Threat", "back": "Security threat from current or former employees with legitimate access", "category": "Threat Actors"}
  ]}'::jsonb,
  true,
  ARRAY['flashcards', 'threats', 'terminology']
);

-- Module 4: Network Security (3 lessons)
INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, content, is_self_paced, topics)
VALUES (
  'network-security',
  'Network Security',
  'Firewalls, IDS/IPS, VPNs, and network segmentation',
  'course',
  7,
  'intermediate',
  55,
  '{"markdown": "# Network Security\n\n## Firewalls\n\n### Types of Firewalls\n\n**Packet Filtering Firewalls**\n- Examine packet headers (source/destination IP, port, protocol)\n- Fast but limited security\n- Stateless - each packet evaluated independently\n\n**Stateful Firewalls**\n- Track connection state (established, related, new)\n- More secure than packet filtering\n- Maintain connection table\n\n**Application Layer Firewalls (Layer 7)**\n- Deep packet inspection\n- Understand application protocols (HTTP, FTP, DNS)\n- Can block specific content or commands\n\n**Next-Generation Firewalls (NGFW)**\n- Combines traditional firewall with IPS\n- Application awareness and control\n- Integrated threat intelligence\n- SSL/TLS inspection\n\n### Firewall Rules Best Practices\n```\n# Implicit Deny principle\nDefault policy: DENY ALL\n\n# Allow only necessary traffic\nALLOW HTTP(80) from ANY to WEB_SERVERS\nALLOW HTTPS(443) from ANY to WEB_SERVERS\nALLOW SSH(22) from ADMIN_IPs to SERVERS\nDENY ALL\n```\n\n## Intrusion Detection/Prevention Systems\n\n### IDS (Intrusion Detection System)\n- **Passive monitoring** - alerts on suspicious activity\n- Does not block traffic\n- Types:\n  - **NIDS**: Network-based IDS\n  - **HIDS**: Host-based IDS\n\n### IPS (Intrusion Prevention System)\n- **Active blocking** - stops malicious traffic\n- Inline with network traffic\n- Can drop packets, reset connections\n\n### Detection Methods\n\n**Signature-Based Detection**\n- Matches known attack patterns\n- Fast and accurate for known threats\n- Cannot detect zero-day attacks\n\n**Anomaly-Based Detection**\n- Establishes baseline of normal behavior\n- Detects deviations from baseline\n- Can catch zero-day attacks\n- Higher false positive rate\n\n**Behavioral Analysis**\n- Monitors user and system behavior\n- Identifies suspicious patterns\n- Machine learning enhanced\n\n## Virtual Private Networks (VPNs)\n\n### VPN Protocols\n\n**IPSec (Internet Protocol Security)**\n- Layer 3 VPN\n- Two modes:\n  - **Transport Mode**: Encrypts payload only\n  - **Tunnel Mode**: Encrypts entire packet\n- Components: AH (Authentication Header) + ESP (Encapsulating Security Payload)\n\n**SSL/TLS VPN**\n- Layer 4-7 VPN\n- Uses web browser (no client needed)\n- More flexible firewall traversal\n\n**Site-to-Site VPN**\n- Connects entire networks\n- Always-on connection\n- Used between offices/data centers\n\n**Remote Access VPN**\n- Connects individual users to network\n- On-demand connection\n- Used by remote workers\n\n## Network Segmentation\n\n### DMZ (Demilitarized Zone)\n```\nInternet → External Firewall → DMZ (Web, Email servers)\n                              ↓\n                    Internal Firewall → Internal Network\n```\n- Isolates public-facing services\n- Two-firewall architecture\n- Limits internal network exposure\n\n### VLANs (Virtual LANs)\n- Logically segment network at Layer 2\n- Separate traffic domains\n- Examples:\n  - VLAN 10: Management\n  - VLAN 20: Users\n  - VLAN 30: Guests\n  - VLAN 40: Servers\n\n### Network Access Control (NAC)\n- Controls device access to network\n- Pre-admission: Health checks before access\n- Post-admission: Continuous monitoring\n- Quarantine non-compliant devices\n\n## Secure Network Protocols\n\n### Encrypted Protocols\n- **SSH** (port 22): Secure remote access (replaces Telnet)\n- **HTTPS** (port 443): Secure web traffic (replaces HTTP)\n- **SFTP** (port 22): Secure file transfer (replaces FTP)\n- **FTPS** (port 990): FTP over SSL/TLS\n- **SNMPv3**: Secure network management (replaces SNMPv1/v2)\n\n### DNS Security\n- **DNSSEC**: Authenticates DNS responses\n- **DNS over HTTPS (DoH)**: Encrypts DNS queries\n- **DNS over TLS (DoT)**: Encrypts DNS with TLS\n\n## Wireless Security\n\n### WPA3 (Wi-Fi Protected Access 3)\n- Latest wireless security standard\n- 192-bit encryption\n- Forward secrecy\n- Protection against brute force\n\n### Wireless Best Practices\n- Disable WPS (Wi-Fi Protected Setup)\n- Use strong passphrases (20+ characters)\n- Hide SSID (security through obscurity)\n- MAC address filtering (not primary security)\n- Separate guest network\n- Regular firmware updates"}'::jsonb,
  true,
  ARRAY['network-security', 'firewalls', 'ids-ips', 'vpn', 'segmentation']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, quiz_data, is_self_paced, topics)
VALUES (
  'network-security-quiz',
  'Network Security Quiz',
  'Test your network security knowledge',
  'quiz',
  8,
  'intermediate',
  20,
  '{"questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "What is the main difference between IDS and IPS?",
      "options": ["IDS is hardware-based, IPS is software-based", "IDS passively monitors and alerts, IPS actively blocks threats", "IDS is faster than IPS", "IDS works at Layer 2, IPS works at Layer 3"],
      "correct_answer": 1,
      "explanation": "IDS (Intrusion Detection System) passively monitors traffic and generates alerts, while IPS (Intrusion Prevention System) actively blocks malicious traffic inline.",
      "points": 1
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "question": "Which VPN protocol operates at Layer 3 and offers both transport and tunnel modes?",
      "options": ["SSL/TLS", "IPSec", "PPTP", "L2TP"],
      "correct_answer": 1,
      "explanation": "IPSec operates at Layer 3 (network layer) and provides both transport mode (encrypts payload) and tunnel mode (encrypts entire packet).",
      "points": 1
    },
    {
      "id": "q3",
      "type": "multiple_choice",
      "question": "What is the purpose of a DMZ in network architecture?",
      "options": ["To provide faster internet access", "To isolate public-facing services from the internal network", "To reduce network latency", "To increase bandwidth"],
      "correct_answer": 1,
      "explanation": "A DMZ (Demilitarized Zone) isolates public-facing services (like web and email servers) from the internal network, limiting exposure if those services are compromised.",
      "points": 1
    },
    {
      "id": "q4",
      "type": "multiple_choice",
      "question": "Which detection method can identify zero-day attacks by monitoring for deviations from normal behavior?",
      "options": ["Signature-based", "Anomaly-based", "Heuristic", "Pattern matching"],
      "correct_answer": 1,
      "explanation": "Anomaly-based detection establishes a baseline of normal behavior and can detect deviations, including zero-day attacks, though it may have more false positives.",
      "points": 1
    },
    {
      "id": "q5",
      "type": "true_false",
      "question": "True or False: Stateful firewalls track the state of network connections and are more secure than simple packet filtering firewalls.",
      "options": ["True", "False"],
      "correct_answer": 0,
      "explanation": "True. Stateful firewalls maintain a connection state table and make decisions based on connection context, providing better security than stateless packet filtering.",
      "points": 1
    }
  ], "passing_score": 75}'::jsonb,
  true,
  ARRAY['quiz', 'network-security', 'assessment']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, flashcard_data, is_self_paced, topics)
VALUES (
  'network-security-flashcards',
  'Network Security Flashcards',
  'Review network security concepts and terminology',
  'flashcard',
  9,
  'intermediate',
  25,
  '{"cards": [
    {"id": "f1", "front": "DMZ (Demilitarized Zone)", "back": "Network segment that isolates public-facing services from internal network using two firewalls", "category": "Network Architecture"},
    {"id": "f2", "front": "IDS vs IPS", "back": "IDS passively monitors and alerts on threats; IPS actively blocks threats inline", "category": "Security Systems"},
    {"id": "f3", "front": "IPSec Transport Mode", "back": "VPN mode that encrypts only the payload while leaving the original IP header intact", "category": "VPN"},
    {"id": "f4", "front": "IPSec Tunnel Mode", "back": "VPN mode that encrypts the entire original packet and adds a new IP header", "category": "VPN"},
    {"id": "f5", "front": "Stateful Firewall", "back": "Firewall that tracks connection state (new, established, related) for better security decisions", "category": "Firewalls"},
    {"id": "f6", "front": "Next-Generation Firewall (NGFW)", "back": "Advanced firewall combining traditional filtering with IPS, application awareness, and threat intelligence", "category": "Firewalls"},
    {"id": "f7", "front": "Signature-Based Detection", "back": "IDS/IPS method matching known attack patterns; fast but cannot detect zero-days", "category": "Detection Methods"},
    {"id": "f8", "front": "Anomaly-Based Detection", "back": "IDS/IPS method detecting deviations from baseline behavior; can catch zero-days but more false positives", "category": "Detection Methods"},
    {"id": "f9", "front": "VLAN", "back": "Virtual LAN - logically segments network at Layer 2 to separate traffic domains", "category": "Segmentation"},
    {"id": "f10", "front": "WPA3", "back": "Latest Wi-Fi security standard with 192-bit encryption and forward secrecy", "category": "Wireless Security"}
  ]}'::jsonb,
  true,
  ARRAY['flashcards', 'network-security', 'terminology']
);

-- Module 5: Cryptography (3 lessons)
INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, content, is_self_paced, topics)
VALUES (
  'cryptography',
  'Cryptography',
  'Encryption, hashing, digital signatures, and PKI',
  'course',
  10,
  'intermediate',
  60,
  '{"markdown": "# Cryptography\n\n## Encryption Basics\n\n### Symmetric Encryption\n- Same key for encryption and decryption\n- Fast and efficient for large data\n- Key distribution challenge\n\n**Common Algorithms:**\n- **AES** (Advanced Encryption Standard)\n  - Key sizes: 128, 192, 256 bits\n  - Industry standard, NIST approved\n  - Used in: WiFi (WPA2/3), VPNs, file encryption\n- **3DES** (Triple DES)\n  - Legacy algorithm, being phased out\n  - 168-bit effective key size\n- **ChaCha20**\n  - Modern stream cipher\n  - Used in TLS, VPNs\n  - Mobile-friendly (efficient on ARM)\n\n### Asymmetric Encryption (Public Key)\n- Public key encrypts, private key decrypts\n- Solves key distribution problem\n- Slower than symmetric\n- Used for key exchange and digital signatures\n\n**Common Algorithms:**\n- **RSA** (Rivest-Shamir-Adleman)\n  - Key sizes: 2048, 3072, 4096 bits\n  - Widely used for key exchange\n  - Based on factoring large numbers\n- **ECC** (Elliptic Curve Cryptography)\n  - Smaller keys, same security as RSA\n  - 256-bit ECC ≈ 3072-bit RSA\n  - Efficient for mobile devices\n- **Diffie-Hellman**\n  - Key exchange protocol\n  - Allows secure key agreement over insecure channel\n  - Used in: TLS, SSH, VPNs\n\n### Hybrid Encryption\n```\n1. Generate random symmetric key (AES-256)\n2. Encrypt data with symmetric key (fast)\n3. Encrypt symmetric key with recipient''s public key (secure)\n4. Send encrypted data + encrypted key\n```\n**Used in:** S/MIME, PGP, TLS\n\n## Hashing\n\n### Cryptographic Hash Functions\n- One-way function (cannot reverse)\n- Fixed output size\n- Deterministic (same input → same hash)\n- Avalanche effect (small change → completely different hash)\n\n**Common Algorithms:**\n- **SHA-256** (Secure Hash Algorithm)\n  - 256-bit output\n  - Industry standard\n  - Used in: Bitcoin, certificates, file integrity\n- **SHA-3**\n  - Latest NIST standard\n  - Different internal structure from SHA-2\n- **MD5** (deprecated)\n  - 128-bit output\n  - Cryptographically broken\n  - Still used for checksums (not security)\n- **bcrypt / scrypt / Argon2**\n  - Password hashing functions\n  - Intentionally slow (resist brute force)\n  - Built-in salt\n\n### Hash Applications\n\n**File Integrity:**\n```bash\nsha256sum file.iso > checksum.txt\n# Later verify:\nsha256sum -c checksum.txt\n```\n\n**Password Storage:**\n```\nNEVER store passwords in plain text!\nStore: hash(password + salt)\n```\n\n**Digital Signatures:**\n```\n1. Hash the message\n2. Encrypt hash with private key = signature\n3. Recipient decrypts with public key\n4. Compare with own hash of message\n```\n\n## Public Key Infrastructure (PKI)\n\n### Components\n\n**Certificate Authority (CA)**\n- Trusted third party\n- Issues and signs digital certificates\n- Examples: DigiCert, Let''s Encrypt, Internal CA\n\n**Registration Authority (RA)**\n- Verifies certificate requests\n- Intermediary between user and CA\n\n**Certificate Revocation List (CRL)**\n- List of revoked certificates\n- Published by CA\n- Checked before trusting certificate\n\n**OCSP (Online Certificate Status Protocol)**\n- Real-time certificate validation\n- Alternative to CRL\n- Faster, more current\n\n### X.509 Digital Certificates\n```\nCertificate:\n  Version: v3\n  Serial Number: 0x1a2b3c...\n  Signature Algorithm: SHA256-RSA\n  Issuer: CN=DigiCert, O=DigiCert Inc, C=US\n  Validity:\n    Not Before: 2024-01-01\n    Not After: 2025-01-01\n  Subject: CN=example.com, O=Example Inc\n  Public Key: RSA 2048-bit\n  Extensions:\n    Subject Alternative Names: www.example.com, api.example.com\n```\n\n### Certificate Trust Chain\n```\nRoot CA (self-signed, pre-installed in OS/browser)\n  ↓ signs\nIntermediate CA\n  ↓ signs\nEnd-Entity Certificate (your website)\n```\n\n## SSL/TLS\n\n### TLS Handshake\n```\n1. Client Hello (supported ciphers, TLS version)\n2. Server Hello (chosen cipher, certificate)\n3. Client verifies certificate\n4. Key exchange (using Diffie-Hellman or RSA)\n5. Both derive session keys\n6. Encrypted communication begins\n```\n\n### TLS Versions\n- **TLS 1.3** (current) - Faster, more secure, fewer cipher suites\n- **TLS 1.2** (acceptable) - Still widely used\n- **TLS 1.1, 1.0, SSLv3** (deprecated) - Vulnerable, disable\n\n## Cryptographic Attacks\n\n### Birthday Attack\n- Exploits hash collision probability\n- Affects digital signatures\n- Why we need longer hashes\n\n### Brute Force\n- Try all possible keys\n- Mitigated by: longer keys, rate limiting, account lockout\n\n### Rainbow Tables\n- Pre-computed hash tables\n- Mitigated by: salting passwords\n\n### Downgrade Attack\n- Force use of weaker encryption\n- Mitigated by: disable old protocols, HSTS header\n\n## Best Practices\n\n1. **Use strong encryption:** AES-256, RSA-2048+, ECC-256+\n2. **Use strong hashing:** SHA-256+, bcrypt/Argon2 for passwords\n3. **Proper key management:**\n   - Generate truly random keys\n   - Secure key storage (HSM, key vault)\n   - Regular key rotation\n   - Secure key destruction\n4. **Keep protocols updated:** TLS 1.2 minimum, prefer TLS 1.3\n5. **Salt passwords:** Unique salt per password\n6. **Perfect Forward Secrecy:** Session keys not compromised if private key leaks"}'::jsonb,
  true,
  ARRAY['cryptography', 'encryption', 'hashing', 'pki', 'ssl-tls']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, quiz_data, is_self_paced, topics)
VALUES (
  'cryptography-quiz',
  'Cryptography Quiz',
  'Test your cryptography knowledge',
  'quiz',
  11,
  'intermediate',
  20,
  '{"questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "What is the main advantage of symmetric encryption over asymmetric encryption?",
      "options": ["Better key distribution", "No key management needed", "Faster performance for large data", "More secure"],
      "correct_answer": 2,
      "explanation": "Symmetric encryption is much faster than asymmetric encryption, making it ideal for encrypting large amounts of data. However, it has the challenge of secure key distribution.",
      "points": 1
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "question": "Which hash algorithm is considered cryptographically broken and should NOT be used for security purposes?",
      "options": ["SHA-256", "SHA-3", "bcrypt", "MD5"],
      "correct_answer": 3,
      "explanation": "MD5 is cryptographically broken due to collision vulnerabilities. While it can still be used for checksums, it should never be used for security purposes like password hashing or digital signatures.",
      "points": 1
    },
    {
      "id": "q3",
      "type": "multiple_choice",
      "question": "In PKI, what is the role of a Certificate Authority (CA)?",
      "options": ["Encrypt all network traffic", "Issue and sign digital certificates", "Store private keys", "Manage firewall rules"],
      "correct_answer": 1,
      "explanation": "A Certificate Authority (CA) is a trusted third party that issues and digitally signs certificates to verify the identity of certificate holders.",
      "points": 1
    },
    {
      "id": "q4",
      "type": "multiple_choice",
      "question": "What cryptographic technique combines fast symmetric encryption with secure asymmetric key exchange?",
      "options": ["Hash chaining", "Hybrid encryption", "Quantum encryption", "Block encryption"],
      "correct_answer": 1,
      "explanation": "Hybrid encryption uses asymmetric cryptography to securely exchange a symmetric key, then uses the symmetric key for fast data encryption. This is used in TLS, PGP, and S/MIME.",
      "points": 1
    },
    {
      "id": "q5",
      "type": "true_false",
      "question": "True or False: Adding a salt to passwords before hashing helps prevent rainbow table attacks.",
      "options": ["True", "False"],
      "correct_answer": 0,
      "explanation": "True. A salt is random data added to passwords before hashing. This makes rainbow tables (pre-computed hash tables) ineffective since each salted password produces a unique hash.",
      "points": 1
    }
  ], "passing_score": 75}'::jsonb,
  true,
  ARRAY['quiz', 'cryptography', 'assessment']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, flashcard_data, is_self_paced, topics)
VALUES (
  'cryptography-flashcards',
  'Cryptography Flashcards',
  'Master cryptography concepts and terminology',
  'flashcard',
  12,
  'intermediate',
  25,
  '{"cards": [
    {"id": "f1", "front": "AES (Advanced Encryption Standard)", "back": "Symmetric encryption algorithm with 128/192/256-bit keys; industry standard for data encryption", "category": "Symmetric Encryption"},
    {"id": "f2", "front": "RSA", "back": "Asymmetric encryption algorithm using public/private key pairs; common key sizes: 2048, 3072, 4096 bits", "category": "Asymmetric Encryption"},
    {"id": "f3", "front": "SHA-256", "back": "Cryptographic hash function producing 256-bit output; used for integrity verification and digital signatures", "category": "Hashing"},
    {"id": "f4", "front": "Hybrid Encryption", "back": "Combines asymmetric encryption for key exchange with symmetric encryption for data; used in TLS and PGP", "category": "Encryption"},
    {"id": "f5", "front": "PKI (Public Key Infrastructure)", "back": "Framework of CAs, certificates, and policies for managing public key encryption", "category": "PKI"},
    {"id": "f6", "front": "Certificate Authority (CA)", "back": "Trusted entity that issues and digitally signs certificates to verify identities", "category": "PKI"},
    {"id": "f7", "front": "Salt", "back": "Random data added to passwords before hashing to prevent rainbow table attacks", "category": "Hashing"},
    {"id": "f8", "front": "Perfect Forward Secrecy", "back": "Property ensuring session keys cannot be compromised even if private key is later leaked", "category": "Cryptography Concepts"},
    {"id": "f9", "front": "TLS Handshake", "back": "Process of negotiating encryption algorithms, exchanging keys, and establishing secure connection", "category": "SSL/TLS"},
    {"id": "f10", "front": "Digital Signature", "back": "Hash of message encrypted with sender''s private key; provides authentication and non-repudiation", "category": "Cryptography Applications"}
  ]}'::jsonb,
  true,
  ARRAY['flashcards', 'cryptography', 'terminology']
);

-- Module 6: Identity & Access Management (3 lessons)
INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, content, is_self_paced, topics)
VALUES (
  'identity-access-management',
  'Identity & Access Management',
  'Authentication, authorization, SSO, and access control models',
  'course',
  13,
  'intermediate',
  50,
  '{"markdown": "# Identity & Access Management\n\n## Authentication Methods\n\n### Single Sign-On (SSO)\n- One set of credentials for multiple applications\n- Improved user experience\n- Centralized access control\n- Protocols: SAML, OAuth 2.0, OpenID Connect\n\n### Multi-Factor Authentication (MFA)\n- Something you know (password)\n- Something you have (token, phone)\n- Something you are (biometrics)\n- Somewhere you are (geolocation)\n\n### Federation\n- Trust relationship between organizations\n- Share identity information\n- SAML, WS-Federation\n\n## Access Control Models\n\n### DAC (Discretionary Access Control)\n- Owner controls access\n- Flexible but less secure\n- Example: File permissions in Windows/Linux\n\n### MAC (Mandatory Access Control)\n- System enforces access based on labels\n- Used in high-security environments\n- Example: SELinux, classified military systems\n\n### RBAC (Role-Based Access Control)\n- Access based on job role\n- Simplified management\n- Example: Admin, User, Guest roles\n\n### ABAC (Attribute-Based Access Control)\n- Access based on attributes (time, location, department)\n- Most flexible and granular\n- Example: AWS IAM policies\n\n## Account Management\n\n### Account Types\n- **User accounts**: Standard users\n- **Privileged accounts**: Administrators\n- **Service accounts**: Applications and services\n- **Guest accounts**: Temporary access\n\n### Best Practices\n- Principle of Least Privilege\n- Regular access reviews\n- Disable unused accounts\n- Password policies (complexity, expiration)\n- Account lockout policies\n- Separation of duties"}'::jsonb,
  true,
  ARRAY['iam', 'authentication', 'authorization', 'access-control']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, quiz_data, is_self_paced, topics)
VALUES (
  'iam-quiz',
  'IAM Quiz',
  'Test your IAM knowledge',
  'quiz',
  14,
  'intermediate',
  15,
  '{"questions": [
    {"id": "q1", "type": "multiple_choice", "question": "Which access control model assigns permissions based on job roles?", "options": ["DAC", "MAC", "RBAC", "ABAC"], "correct_answer": 2, "explanation": "RBAC (Role-Based Access Control) assigns permissions based on user roles within an organization.", "points": 1},
    {"id": "q2", "type": "multiple_choice", "question": "What does SSO stand for and what is its primary benefit?", "options": ["Secure Sign-On reducing passwords", "Single Sign-On allowing one credential set for multiple apps", "System Security Options improving security", "Standard Security Operation"], "correct_answer": 1, "explanation": "Single Sign-On (SSO) allows users to access multiple applications with one set of credentials, improving user experience and centralized control.", "points": 1},
    {"id": "q3", "type": "true_false", "question": "True or False: In DAC (Discretionary Access Control), the resource owner controls who can access their resources.", "options": ["True", "False"], "correct_answer": 0, "explanation": "True. DAC allows resource owners to control access to their resources at their discretion.", "points": 1}
  ], "passing_score": 75}'::jsonb,
  true,
  ARRAY['quiz', 'iam', 'assessment']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, flashcard_data, is_self_paced, topics)
VALUES (
  'iam-flashcards',
  'IAM Flashcards',
  'Review IAM concepts',
  'flashcard',
  15,
  'intermediate',
  20,
  '{"cards": [
    {"id": "f1", "front": "SSO (Single Sign-On)", "back": "Authentication scheme allowing users to log in once to access multiple applications", "category": "Authentication"},
    {"id": "f2", "front": "RBAC", "back": "Role-Based Access Control - permissions assigned based on job roles", "category": "Access Control"},
    {"id": "f3", "front": "Principle of Least Privilege", "back": "Users receive minimum permissions necessary to perform their job functions", "category": "Best Practices"},
    {"id": "f4", "front": "SAML", "back": "Security Assertion Markup Language - XML-based standard for SSO authentication", "category": "Protocols"},
    {"id": "f5", "front": "Federation", "back": "Trust relationship allowing identity sharing between organizations", "category": "IAM Concepts"}
  ]}'::jsonb,
  true,
  ARRAY['flashcards', 'iam', 'terminology']
);

-- Module 7: Security Operations (3 lessons)
INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, content, is_self_paced, topics)
VALUES (
  'security-operations', 'Security Operations', 'SIEM, logging, monitoring', 'course', 16, 'intermediate', 50,
  '{"markdown": "# Security Operations\n\n## SIEM (Security Information and Event Management)\n\n### Key Functions\n- Log aggregation from multiple sources\n- Real-time analysis and correlation\n- Alerting on suspicious activities\n- Compliance reporting\n\n### Popular SIEM Tools\n- Splunk\n- IBM QRadar\n- ArcSight\n- LogRhythm\n- ELK Stack (Elasticsearch, Logstash, Kibana)\n\n## Security Monitoring\n\n### What to Monitor\n- Failed login attempts\n- Privilege escalation\n- Data exfiltration\n- Unusual network traffic\n- Configuration changes\n- File integrity\n\n### Incident Response Process\n1. **Preparation**: Plans, tools, training\n2. **Detection**: Identify incident\n3. **Containment**: Limit damage\n4. **Eradication**: Remove threat\n5. **Recovery**: Restore systems\n6. **Lessons Learned**: Improve processes"}'::jsonb,
  true, ARRAY['security-operations', 'siem', 'monitoring']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, quiz_data, is_self_paced, topics)
VALUES (
  'security-operations-quiz', 'Security Operations Quiz', 'Test your understanding', 'quiz', 17, 'intermediate', 15,
  '{"questions": [{"id": "q1", "type": "multiple_choice", "question": "What does SIEM stand for?", "options": ["Security Incident and Event Manager", "Security Information and Event Management", "System Information Event Monitoring", "Secure Internet Event Management"], "correct_answer": 1, "explanation": "SIEM stands for Security Information and Event Management.", "points": 1}], "passing_score": 75}'::jsonb,
  true, ARRAY['quiz', 'security-operations']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, flashcard_data, is_self_paced, topics)
VALUES (
  'security-operations-flashcards', 'Security Operations Flashcards', 'Review key concepts', 'flashcard', 18, 'intermediate', 20,
  '{"cards": [{"id": "f1", "front": "SIEM", "back": "Security Information and Event Management - centralized logging and analysis platform", "category": "Tools"}]}'::jsonb,
  true, ARRAY['flashcards', 'security-operations']
);

-- Module 8: Incident Response (3 lessons)
INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, content, is_self_paced, topics)
VALUES (
  'incident-response', 'Incident Response', 'Incident handling, forensics, and recovery procedures', 'course', 19, 'advanced', 55,
  '{"markdown": "# Incident Response\n\n## Incident Response Lifecycle\n\n### 1. Preparation\n- Develop incident response plan\n- Assemble IR team with defined roles\n- Establish communication channels\n- Deploy monitoring and detection tools\n- Conduct training and drills\n\n### 2. Identification\n- Detect and confirm security incident\n- Determine scope and severity\n- Document initial findings\n- Classify incident type\n\n### 3. Containment\n- **Short-term**: Isolate affected systems\n- **Long-term**: Temporary fixes while planning recovery\n- Preserve evidence for forensics\n- Prevent spread of compromise\n\n### 4. Eradication\n- Remove malware and threats\n- Close vulnerabilities\n- Patch systems\n- Reset compromised credentials\n\n### 5. Recovery\n- Restore systems from clean backups\n- Verify system integrity\n- Monitor for reinfection\n- Gradual return to normal operations\n\n### 6. Lessons Learned\n- Post-incident review meeting\n- Document findings and improvements\n- Update incident response procedures\n- Update security controls\n\n## Digital Forensics\n\n### Order of Volatility (collect in this order)\n1. CPU registers, cache\n2. RAM contents\n3. Network connections\n4. Running processes\n5. Disk storage\n6. Backups, logs\n\n### Chain of Custody\n- Document who handled evidence\n- When and where transfers occurred\n- Maintains legal integrity\n- Critical for prosecution\n\n### Forensic Tools\n- FTK (Forensic Toolkit)\n- EnCase\n- Autopsy\n- Volatility (memory analysis)\n- Wireshark (network captures)"}'::jsonb,
  true, ARRAY['incident-response', 'forensics', 'recovery']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, quiz_data, is_self_paced, topics)
VALUES (
  'incident-response-quiz', 'Incident Response Quiz', 'Test your IR knowledge', 'quiz', 20, 'advanced', 15,
  '{"questions": [
    {"id": "q1", "type": "multiple_choice", "question": "What is the correct order of the incident response lifecycle?", "options": ["Detection, Containment, Preparation, Recovery", "Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned", "Containment, Eradication, Identification", "Recovery, Preparation, Containment"], "correct_answer": 1, "explanation": "The correct IR lifecycle is: Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned.", "points": 1},
    {"id": "q2", "type": "true_false", "question": "True or False: Chain of custody documentation is critical for maintaining legal integrity of evidence.", "options": ["True", "False"], "correct_answer": 0, "explanation": "True. Chain of custody documents who handled evidence and when, maintaining its legal integrity for potential prosecution.", "points": 1}
  ], "passing_score": 75}'::jsonb,
  true, ARRAY['quiz', 'incident-response']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, flashcard_data, is_self_paced, topics)
VALUES (
  'incident-response-flashcards', 'Incident Response Flashcards', 'Review IR concepts', 'flashcard', 21, 'advanced', 20,
  '{"cards": [
    {"id": "f1", "front": "Incident Response Lifecycle", "back": "Preparation → Identification → Containment → Eradication → Recovery → Lessons Learned", "category": "Process"},
    {"id": "f2", "front": "Chain of Custody", "back": "Documentation of who handled evidence, when, and where to maintain legal integrity", "category": "Forensics"},
    {"id": "f3", "front": "Order of Volatility", "back": "Sequence for collecting digital evidence from most volatile (CPU/RAM) to least (backups)", "category": "Forensics"}
  ]}'::jsonb,
  true, ARRAY['flashcards', 'incident-response']
);

-- Module 9: Risk Management (3 lessons)
INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, content, is_self_paced, topics)
VALUES (
  'risk-management', 'Risk Management', 'Risk assessment, mitigation strategies, and business continuity', 'course', 22, 'advanced', 50,
  '{"markdown": "# Risk Management\n\n## Risk Assessment\n\n### Risk Components\n- **Threat**: Potential cause of incident\n- **Vulnerability**: Weakness that can be exploited\n- **Impact**: Damage if risk materializes\n- **Likelihood**: Probability of occurrence\n- **Risk = Likelihood × Impact**\n\n### Risk Assessment Methods\n\n**Qualitative Assessment**\n- Low, Medium, High ratings\n- Easier, faster, less precise\n- Risk matrices\n\n**Quantitative Assessment**\n- Numerical values (dollars, percentages)\n- More precise, requires more data\n- **ALE** (Annual Loss Expectancy) = SLE × ARO\n- **SLE** (Single Loss Expectancy): Cost per incident\n- **ARO** (Annualized Rate of Occurrence): Times per year\n\n## Risk Response Strategies\n\n### Risk Avoidance\n- Eliminate the risk entirely\n- Stop the risky activity\n- Example: Not storing credit cards\n\n### Risk Mitigation\n- Reduce likelihood or impact\n- Implement security controls\n- Example: Deploy firewalls, IDS\n\n### Risk Transfer\n- Shift risk to third party\n- Insurance, outsourcing\n- Example: Cybersecurity insurance\n\n### Risk Acceptance\n- Accept the risk\n- Cost of mitigation > potential loss\n- Document decision and get approval\n\n## Business Continuity\n\n### BCP (Business Continuity Plan)\n- Procedures to maintain operations\n- Critical business functions\n- Recovery priorities\n\n### DRP (Disaster Recovery Plan)\n- IT-focused recovery procedures\n- System restoration\n- Data recovery\n\n### Key Metrics\n- **RTO** (Recovery Time Objective): Max acceptable downtime\n- **RPO** (Recovery Point Objective): Max acceptable data loss\n- **MTTR** (Mean Time To Repair): Average repair time\n- **MTBF** (Mean Time Between Failures): Reliability measure"}'::jsonb,
  true, ARRAY['risk-management', 'business-continuity', 'disaster-recovery']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, quiz_data, is_self_paced, topics)
VALUES (
  'risk-management-quiz', 'Risk Management Quiz', 'Test your risk management knowledge', 'quiz', 23, 'advanced', 15,
  '{"questions": [
    {"id": "q1", "type": "multiple_choice", "question": "Which risk response strategy involves purchasing cybersecurity insurance?", "options": ["Risk Avoidance", "Risk Mitigation", "Risk Transfer", "Risk Acceptance"], "correct_answer": 2, "explanation": "Risk Transfer shifts risk to a third party, such as through insurance or outsourcing.", "points": 1},
    {"id": "q2", "type": "multiple_choice", "question": "What does RPO (Recovery Point Objective) measure?", "options": ["Maximum acceptable downtime", "Maximum acceptable data loss", "Average repair time", "System reliability"], "correct_answer": 1, "explanation": "RPO (Recovery Point Objective) defines the maximum acceptable amount of data loss measured in time.", "points": 1}
  ], "passing_score": 75}'::jsonb,
  true, ARRAY['quiz', 'risk-management']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, flashcard_data, is_self_paced, topics)
VALUES (
  'risk-management-flashcards', 'Risk Management Flashcards', 'Review risk management terms', 'flashcard', 24, 'advanced', 20,
  '{"cards": [
    {"id": "f1", "front": "Risk Formula", "back": "Risk = Likelihood × Impact", "category": "Core Concepts"},
    {"id": "f2", "front": "RTO (Recovery Time Objective)", "back": "Maximum acceptable downtime for a system or process", "category": "Business Continuity"},
    {"id": "f3", "front": "RPO (Recovery Point Objective)", "back": "Maximum acceptable data loss measured in time", "category": "Business Continuity"},
    {"id": "f4", "front": "ALE (Annual Loss Expectancy)", "back": "Expected annual loss from a risk; calculated as SLE × ARO", "category": "Quantitative Risk"}
  ]}'::jsonb,
  true, ARRAY['flashcards', 'risk-management']
);

-- Module 10: Compliance & Governance (3 lessons)
INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, content, is_self_paced, topics)
VALUES (
  'compliance-governance', 'Compliance & Governance', 'Regulatory requirements and security policies', 'course', 25, 'advanced', 45,
  '{"markdown": "# Compliance & Governance\n\n## Major Regulations\n\n### GDPR (General Data Protection Regulation)\n- EU data protection law\n- Applies to processing EU residents'' data\n- Right to access, rectification, erasure\n- Data breach notification within 72 hours\n- Fines up to 4% of annual revenue\n\n### HIPAA (Health Insurance Portability and Accountability Act)\n- US healthcare data protection\n- PHI (Protected Health Information)\n- Privacy, Security, Breach Notification Rules\n\n### PCI DSS (Payment Card Industry Data Security Standard)\n- Credit card data protection\n- 12 requirements across 6 categories\n- Regular audits required\n- Network segmentation, encryption\n\n### SOX (Sarbanes-Oxley Act)\n- Financial reporting accuracy\n- Internal controls\n- IT system audits\n\n## Security Policies\n\n### Acceptable Use Policy (AUP)\n- Proper use of company resources\n- Prohibited activities\n- Consequences of violations\n\n### Data Classification Policy\n- Public, Internal, Confidential, Restricted\n- Handling requirements per level\n- Retention and disposal\n\n### Password Policy\n- Complexity requirements\n- Length minimums\n- Expiration periods\n- Reuse restrictions\n\n### Change Management\n- Formal approval process\n- Testing requirements\n- Rollback procedures\n- Documentation"}'::jsonb,
  true, ARRAY['compliance', 'governance', 'regulations', 'policies']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, quiz_data, is_self_paced, topics)
VALUES (
  'compliance-quiz', 'Compliance Quiz', 'Test compliance knowledge', 'quiz', 26, 'advanced', 15,
  '{"questions": [
    {"id": "q1", "type": "multiple_choice", "question": "Which regulation requires data breach notification within 72 hours?", "options": ["HIPAA", "GDPR", "PCI DSS", "SOX"], "correct_answer": 1, "explanation": "GDPR requires organizations to notify authorities of data breaches within 72 hours.", "points": 1},
    {"id": "q2", "type": "multiple_choice", "question": "What does PCI DSS primarily protect?", "options": ["Healthcare data", "Credit card data", "Financial reports", "Personal identifiable information"], "correct_answer": 1, "explanation": "PCI DSS (Payment Card Industry Data Security Standard) protects credit card data.", "points": 1}
  ], "passing_score": 75}'::jsonb,
  true, ARRAY['quiz', 'compliance']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, flashcard_data, is_self_paced, topics)
VALUES (
  'compliance-flashcards', 'Compliance Flashcards', 'Review regulations', 'flashcard', 27, 'advanced', 20,
  '{"cards": [
    {"id": "f1", "front": "GDPR", "back": "EU data protection regulation with 72-hour breach notification and fines up to 4% revenue", "category": "Regulations"},
    {"id": "f2", "front": "PCI DSS", "back": "Payment Card Industry Data Security Standard - protects credit card data", "category": "Regulations"},
    {"id": "f3", "front": "HIPAA", "back": "US healthcare regulation protecting PHI (Protected Health Information)", "category": "Regulations"}
  ]}'::jsonb,
  true, ARRAY['flashcards', 'compliance']
);

-- Module 11: Security Architecture (3 lessons)
INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, content, is_self_paced, topics)
VALUES (
  'security-architecture', 'Security Architecture', 'Secure design principles and cloud security', 'course', 28, 'advanced', 50,
  '{"markdown": "# Security Architecture\n\n## Secure Design Principles\n\n### Defense in Depth\n- Multiple layers of security\n- Redundant controls\n- No single point of failure\n\n### Least Privilege\n- Minimum necessary permissions\n- Time-limited access\n- Just-in-time access\n\n### Separation of Duties\n- Multiple people for critical tasks\n- Prevents fraud and errors\n- Example: Different people approve and execute\n\n### Secure by Default\n- Security enabled out of box\n- Restrictive default settings\n- Disable unnecessary features\n\n## Cloud Security\n\n### Cloud Service Models\n\n**IaaS (Infrastructure as a Service)**\n- Virtual machines, storage, networks\n- Customer manages: OS, applications, data\n- Provider manages: Hardware, virtualization\n- Example: AWS EC2, Azure VMs\n\n**PaaS (Platform as a Service)**\n- Development and deployment platform\n- Customer manages: Applications, data\n- Provider manages: Runtime, middleware, OS\n- Example: Heroku, Google App Engine\n\n**SaaS (Software as a Service)**\n- Complete applications\n- Customer manages: Data, users\n- Provider manages: Everything else\n- Example: Office 365, Salesforce\n\n### Shared Responsibility Model\n- Provider: Physical security, infrastructure\n- Customer: Data, access control, encryption\n- Varies by service model\n\n### Cloud Security Controls\n- Encryption at rest and in transit\n- Identity and Access Management\n- Security groups and network ACLs\n- Logging and monitoring\n- Compliance certifications"}'::jsonb,
  true, ARRAY['architecture', 'cloud-security', 'design-principles']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, quiz_data, is_self_paced, topics)
VALUES (
  'architecture-quiz', 'Architecture Quiz', 'Test architecture knowledge', 'quiz', 29, 'advanced', 15,
  '{"questions": [
    {"id": "q1", "type": "multiple_choice", "question": "In which cloud service model does the customer manage only applications and data?", "options": ["IaaS", "PaaS", "SaaS", "FaaS"], "correct_answer": 1, "explanation": "In PaaS (Platform as a Service), customers manage applications and data while the provider manages the runtime, middleware, and OS.", "points": 1},
    {"id": "q2", "type": "true_false", "question": "True or False: Separation of Duties requires multiple people for critical tasks to prevent fraud.", "options": ["True", "False"], "correct_answer": 0, "explanation": "True. Separation of Duties divides critical tasks among multiple people to prevent fraud and errors.", "points": 1}
  ], "passing_score": 75}'::jsonb,
  true, ARRAY['quiz', 'architecture']
);

INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, flashcard_data, is_self_paced, topics)
VALUES (
  'architecture-flashcards', 'Architecture Flashcards', 'Review architecture concepts', 'flashcard', 30, 'advanced', 20,
  '{"cards": [
    {"id": "f1", "front": "IaaS", "back": "Infrastructure as a Service - provides virtual machines, storage, networks; customer manages OS and apps", "category": "Cloud"},
    {"id": "f2", "front": "PaaS", "back": "Platform as a Service - provides development platform; customer manages applications and data", "category": "Cloud"},
    {"id": "f3", "front": "SaaS", "back": "Software as a Service - provides complete applications; customer manages only data and users", "category": "Cloud"},
    {"id": "f4", "front": "Separation of Duties", "back": "Security principle requiring multiple people for critical tasks to prevent fraud", "category": "Principles"}
  ]}'::jsonb,
  true, ARRAY['flashcards', 'architecture']
);

-- Module 12: Final Exam
INSERT INTO lessons (slug, title, description, type, order_index, difficulty, estimated_minutes, quiz_data, is_self_paced, topics)
VALUES (
  'security-plus-final-exam',
  'Security+ Final Exam',
  'Comprehensive assessment covering all Security+ domains',
  'quiz',
  31,
  'advanced',
  75,
  '{"questions": [
    {"id": "q1", "type": "multiple_choice", "question": "Which component of the CIA Triad ensures data is protected from unauthorized modification?", "options": ["Confidentiality", "Integrity", "Availability", "Authentication"], "correct_answer": 1, "explanation": "Integrity ensures data accuracy and prevents unauthorized modifications.", "points": 1},
    {"id": "q2", "type": "multiple_choice", "question": "What type of attack involves fraudulent emails designed to steal credentials?", "options": ["Vishing", "Phishing", "Smishing", "Whaling"], "correct_answer": 1, "explanation": "Phishing uses fraudulent emails to trick users into revealing credentials.", "points": 1},
    {"id": "q3", "type": "multiple_choice", "question": "What is the main difference between IDS and IPS?", "options": ["IDS is hardware, IPS is software", "IDS monitors passively, IPS blocks actively", "IDS is faster", "No difference"], "correct_answer": 1, "explanation": "IDS passively monitors and alerts, while IPS actively blocks threats.", "points": 1},
    {"id": "q4", "type": "multiple_choice", "question": "Which encryption algorithm is the current industry standard for symmetric encryption?", "options": ["DES", "3DES", "AES", "RSA"], "correct_answer": 2, "explanation": "AES (Advanced Encryption Standard) is the current industry standard for symmetric encryption.", "points": 1},
    {"id": "q5", "type": "multiple_choice", "question": "What does SSO stand for?", "options": ["Secure Socket Operation", "Single Sign-On", "System Security Option", "Standard Security Operation"], "correct_answer": 1, "explanation": "SSO stands for Single Sign-On, allowing users to access multiple applications with one set of credentials.", "points": 1},
    {"id": "q6", "type": "multiple_choice", "question": "In the incident response lifecycle, what comes after Identification?", "options": ["Preparation", "Containment", "Eradication", "Recovery"], "correct_answer": 1, "explanation": "The IR lifecycle order is: Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned.", "points": 1},
    {"id": "q7", "type": "multiple_choice", "question": "Which risk response strategy involves purchasing insurance?", "options": ["Risk Avoidance", "Risk Mitigation", "Risk Transfer", "Risk Acceptance"], "correct_answer": 2, "explanation": "Risk Transfer shifts risk to a third party through insurance or outsourcing.", "points": 1},
    {"id": "q8", "type": "multiple_choice", "question": "Which regulation requires data breach notification within 72 hours?", "options": ["HIPAA", "GDPR", "PCI DSS", "SOX"], "correct_answer": 1, "explanation": "GDPR requires breach notification within 72 hours to authorities.", "points": 1},
    {"id": "q9", "type": "multiple_choice", "question": "In which cloud service model does the customer manage only applications and data?", "options": ["IaaS", "PaaS", "SaaS", "FaaS"], "correct_answer": 1, "explanation": "In PaaS, customers manage applications and data while providers manage the platform.", "points": 1},
    {"id": "q10", "type": "multiple_choice", "question": "What CVSS score range indicates CRITICAL severity?", "options": ["7.0-8.9", "4.0-6.9", "9.0-10.0", "0.1-3.9"], "correct_answer": 2, "explanation": "CVSS scores of 9.0-10.0 indicate critical severity vulnerabilities.", "points": 1},
    {"id": "q11", "type": "true_false", "question": "True or False: MD5 should still be used for password hashing.", "options": ["True", "False"], "correct_answer": 1, "explanation": "False. MD5 is cryptographically broken and should never be used for security purposes.", "points": 1},
    {"id": "q12", "type": "true_false", "question": "True or False: Stateful firewalls track connection state for better security.", "options": ["True", "False"], "correct_answer": 0, "explanation": "True. Stateful firewalls maintain connection state tables for context-aware security decisions.", "points": 1},
    {"id": "q13", "type": "true_false", "question": "True or False: In Zero Trust, internal users are automatically trusted.", "options": ["True", "False"], "correct_answer": 1, "explanation": "False. Zero Trust requires verification of all users and devices regardless of location.", "points": 1},
    {"id": "q14", "type": "true_false", "question": "True or False: Chain of custody is critical for legal evidence integrity.", "options": ["True", "False"], "correct_answer": 0, "explanation": "True. Chain of custody documentation maintains legal integrity of forensic evidence.", "points": 1},
    {"id": "q15", "type": "true_false", "question": "True or False: RPO defines maximum acceptable downtime.", "options": ["True", "False"], "correct_answer": 1, "explanation": "False. RPO defines maximum acceptable data loss. RTO defines maximum acceptable downtime.", "points": 1},
    {"id": "q16", "type": "multiple_choice", "question": "Which malware encrypts files and demands payment?", "options": ["Trojan", "Worm", "Ransomware", "Spyware"], "correct_answer": 2, "explanation": "Ransomware encrypts files and demands ransom payment for decryption.", "points": 1},
    {"id": "q17", "type": "multiple_choice", "question": "What is the purpose of a DMZ?", "options": ["Faster internet", "Isolate public services from internal network", "Reduce latency", "Increase bandwidth"], "correct_answer": 1, "explanation": "A DMZ isolates public-facing services from the internal network for security.", "points": 1},
    {"id": "q18", "type": "multiple_choice", "question": "Which VPN protocol operates at Layer 3?", "options": ["SSL/TLS", "IPSec", "PPTP", "OpenVPN"], "correct_answer": 1, "explanation": "IPSec operates at Layer 3 (network layer) and provides both transport and tunnel modes.", "points": 1},
    {"id": "q19", "type": "multiple_choice", "question": "What does RBAC stand for?", "options": ["Risk-Based Access Control", "Role-Based Access Control", "Remote Basic Access Control", "Restricted Baseline Access Control"], "correct_answer": 1, "explanation": "RBAC stands for Role-Based Access Control, where permissions are assigned based on roles.", "points": 1},
    {"id": "q20", "type": "multiple_choice", "question": "Which principle requires minimum necessary permissions?", "options": ["Defense in Depth", "Separation of Duties", "Least Privilege", "Secure by Default"], "correct_answer": 2, "explanation": "Principle of Least Privilege requires users receive only minimum necessary permissions.", "points": 1}
  ], "passing_score": 85, "time_limit_minutes": 75}'::jsonb,
  true,
  ARRAY['final-exam', 'comprehensive', 'certification']
);

import { GitHub, Instagram, Globe, X, LinkedIn, Mail } from "@/lib/cyberIcon";
import type { ComponentType, SVGProps } from "react";

export interface LeadershipEntry {
  quarter: string;
  role: string;
  altRole?: string;
}

export interface OfficerData {
  name: string;
  role: string;
  altRole?: string;
  photo?: string;
  links?: {
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    href: string;
    label: string;
  }[];
  leadershipHistory: LeadershipEntry[];
  /** What this officer is responsible for in the current quarter. */
  responsibilities?: string[];
}

export interface OpenRole {
  role: string;
  responsibilities: string[];
}

export const CURRENT_QUARTER = "Fall 2026";

/** Officer positions we are still recruiting for this quarter. */
export const OPEN_ROLES: OpenRole[] = [
  {
    role: "Outreach Manager",
    responsibilities: [
      "Managing social media",
      "Active recruitment (Discord servers, campus, etc.)",
      "Communicating and organizing with other clubs and sponsors",
      "General club work",
    ],
  },
];

export const ROLE_ORDER = [
  "President",
  "Vice President",
  "Secretary",
  "Treasurer",
  "Curriculum Lead",
  "Outreach Manager",
  "Outreach",
  "Events",
  "ICC Representative",
];

export const OFFICERS: OfficerData[] = [
  {
    name: "Neel Anshu",
    role: "President",
    photo: "/neel-anshu.jpeg",
    links: [
      {
        icon: GitHub,
        href: "https://github.com/boredcreator",
        label: "GitHub",
      },
      {
        icon: Instagram,
        href: "https://instagram.com/neel_reddy455",
        label: "Instagram",
      },
      { icon: Globe, href: "https://flippedbyneel.com", label: "Website" },
    ],
    leadershipHistory: [
      { quarter: "Winter 2026", role: "President" },
      { quarter: "Spring 2026", role: "Treasurer" },
      { quarter: "Fall 2026", role: "President" },
    ],
    responsibilities: [
      "Club management and organization",
      "Carry out the constitution",
      "Maintain the club website",
      "Help with curriculum",
      "General club work",
    ],
  },
  {
    name: "Aaron Ma",
    role: "President",
    photo: "/aaron-ma.jpeg",
    links: [
      { icon: GitHub, href: "https://github.com/aaronhma", label: "GitHub" },
      { icon: X, href: "https://x.com/aaronhma", label: "X" },
      {
        icon: LinkedIn,
        href: "https://www.linkedin.com/in/air-rn/",
        label: "LinkedIn",
      },
      { icon: Mail, href: "mailto:hi@aaronhma.com", label: "Email" },
      { icon: Globe, href: "https://aaronhma.com/", label: "Website" },
    ],
    leadershipHistory: [
      {
        quarter: "Winter 2026",
        role: "Vice President",
        altRole: "ICC Representative",
      },
      { quarter: "Spring 2026", role: "President" },
    ],
  },
  {
    name: "Thant Thu Hein",
    role: "Outreach Manager",
    links: [
      {
        icon: Instagram,
        href: "https://www.instagram.com/butter.daxxton",
        label: "Instagram",
      },
    ],
    leadershipHistory: [
      { quarter: "Winter 2026", role: "Outreach Manager" },
      { quarter: "Spring 2026", role: "Outreach" },
    ],
  },
  {
    name: "Arin Thakkar",
    role: "Vice President",
    altRole: "ICC Representative",
    leadershipHistory: [
      { quarter: "Winter 2026", role: "Secretary" },
      { quarter: "Spring 2026", role: "Vice President" },
      {
        quarter: "Fall 2026",
        role: "Vice President",
        altRole: "ICC Representative",
      },
    ],
    responsibilities: [
      "Club management",
      "Attend all ICC meetings",
      "Report on the results of ICC meetings",
      "Help with curriculum",
    ],
  },
  {
    name: "Mobin Norouzi",
    role: "Treasurer",
    leadershipHistory: [
      { quarter: "Winter 2026", role: "Treasurer" },
      { quarter: "Spring 2026", role: "Events" },
    ],
  },
  {
    name: "Ollin Ruiz",
    role: "Secretary",
    leadershipHistory: [
      { quarter: "Winter 2026", role: "Curriculum Lead" },
      { quarter: "Spring 2026", role: "Curriculum Lead" },
      { quarter: "Fall 2026", role: "Secretary" },
    ],
    responsibilities: [
      "Club organization",
      "Handle the club agenda",
      "Help with projects",
    ],
  },
  {
    name: "Janice",
    role: "Treasurer",
    altRole: "Marketing",
    leadershipHistory: [
      { quarter: "Fall 2026", role: "Treasurer", altRole: "Marketing" },
    ],
    responsibilities: [
      "Managing and keeping track of funds",
      "No dues collected this quarter",
      "Marketing, posting, and outreach",
    ],
  },
  {
    name: "Michael",
    role: "Curriculum Lead",
    leadershipHistory: [{ quarter: "Fall 2026", role: "Curriculum Lead" }],
    responsibilities: ["Building the curriculum", "General club work"],
  },
];

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
}

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
      { quarter: "Spring 2026", role: "" },
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
      { quarter: "Spring 2026", role: "" },
    ],
  },
  {
    name: "Arin Thakkar",
    role: "Secretary",
    leadershipHistory: [
      { quarter: "Winter 2026", role: "Secretary" },
      { quarter: "Spring 2026", role: "" },
    ],
  },
  {
    name: "Mobin Norouzi",
    role: "Treasurer",
    leadershipHistory: [
      { quarter: "Winter 2026", role: "Treasurer" },
      { quarter: "Spring 2026", role: "" },
    ],
  },
  {
    name: "Ollin Ruiz",
    role: "Curriculum Lead",
    leadershipHistory: [
      { quarter: "Winter 2026", role: "Curriculum Lead" },
      { quarter: "Spring 2026", role: "" },
    ],
  },
];

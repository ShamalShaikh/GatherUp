import { type Metadata } from 'next';

const title = 'Our Magical Team';
const mainUrl = 'https://www.modern-ticketing.com';
const canonical = `${mainUrl}/team`;
const description = 'Meet the wizards, muggles, and mischief-makers behind GatherUp';

export const metadata: Metadata = {
  title,
  description,
  keywords: 'GatherUp, Team, Developers, Wizards',
  alternates: { canonical },
  openGraph: {
    title,
    description,
    url: canonical,
    type: 'website',
    siteName: 'GatherUp',
    images: `${mainUrl}/logo192.png`,
  },
}; 
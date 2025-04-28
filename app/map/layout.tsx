import Master from '@components/Layout/Master';
import './styles/globals.css'; // Import global styles as a fallback

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <Master>
      {children}
    </Master>
  );
} 
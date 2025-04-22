import Link from 'next/link';

// interfaces
interface IProps {
  url: string;
  text: string;
  color: string;
  leftIcon?: string;
  rightIcon?: string;
  target?: string;
}

const ButtonLink: React.FC<IProps> = ({ url, text, color, leftIcon, rightIcon, target }) => {
  // Handle external URLs (starting with http:// or https://)
  const isExternal = url.startsWith('http://') || url.startsWith('https://');
  
  // For external URLs, use the URL as is. For internal URLs, prepend /
  const href = isExternal ? url : `/${url}`;
  
  return (
    <Link 
      className={`button ${color}`} 
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
    >
      {leftIcon !== undefined && (
        <span className='material-symbols-outlined left-icon'>{leftIcon}</span>
      )}
      {text}
      {rightIcon !== undefined && (
        <span className='material-symbols-outlined right-icon'>{rightIcon}</span>
      )}
    </Link>
  );
};

export default ButtonLink;

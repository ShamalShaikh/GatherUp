import Link from 'next/link';

// interfaces
interface IProps {
  url: string;
  text: string;
  active?: boolean;
  onClick?: () => void;
}

const DropdownItem: React.FC<IProps> = ({ url, text, active, onClick }) => {
  if (onClick) {
    return (
      <button type="button" className={active === true ? 'button active' : 'button passive'} onClick={onClick}>
        {text}
      </button>
    );
  }
  
  return (
    <Link className={active === true ? 'button active' : 'button passive'} href={`/${url}`}>
      {text}
    </Link>
  );
};

export default DropdownItem;
